import { useState } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

const CORE_VERSION = '0.12.6'
const CORE_BASE = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd`

let ffmpegInstance: FFmpeg | null = null
let loadPromise: Promise<void> | null = null

async function getFFmpeg(): Promise<FFmpeg> {
  if (!ffmpegInstance) ffmpegInstance = new FFmpeg()
  if (!ffmpegInstance.loaded) {
    if (!loadPromise) {
      loadPromise = (ffmpegInstance.load({
        coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, 'application/wasm'),
      }) as Promise<unknown>).then(() => {}).finally(() => { loadPromise = null })
    }
    await loadPromise
  }
  return ffmpegInstance
}

export type ImageFormat = 'png' | 'jpg' | 'webp'
export type VideoFormat = 'mp4' | 'gif'
export type ExportPhase = 'idle' | 'upscaling' | 'processing' | 'done'

export interface ExportOptions {
  format: ImageFormat | VideoFormat
  targetWidth?: number   // explicit px width, maintains AR
  scale?: number         // 0.5, 0.75, etc. — mutually exclusive with targetWidth
  upscale?: 2 | 4
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

async function imageToBlob(
  img: HTMLImageElement,
  targetW: number,
  targetH: number,
  format: ImageFormat,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, targetW, targetH)
  const mimeType = format === 'jpg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png'
  const quality = format === 'jpg' ? 0.92 : format === 'webp' ? 0.9 : undefined
  return new Promise((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('Canvas toBlob failed')), mimeType, quality)
  })
}

function computeDims(
  origW: number,
  origH: number,
  opts: Pick<ExportOptions, 'targetWidth' | 'scale'>,
): { w: number; h: number } {
  if (opts.targetWidth) {
    const ratio = opts.targetWidth / origW
    return { w: opts.targetWidth, h: Math.round(origH * ratio) }
  }
  if (opts.scale && opts.scale !== 1) {
    return { w: Math.round(origW * opts.scale), h: Math.round(origH * opts.scale) }
  }
  return { w: origW, h: origH }
}

export function useExport() {
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState<ExportPhase>('idle')

  async function exportAsset(
    assetUrl: string,
    assetId: string,
    isVideo: boolean,
    options: ExportOptions,
    userToken: string | null,
    supabaseUrl: string,
    anonKey: string,
  ): Promise<void> {
    setProcessing(true)
    setProgress(0)
    setPhase('idle')

    try {
      let sourceUrl = assetUrl

      // Step 1: AI upscale (images only)
      if (options.upscale && !isVideo) {
        setPhase('upscaling')
        setProgress(5)
        const res = await fetch(`${supabaseUrl}/functions/v1/upscale-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`,
            'apikey': anonKey,
          },
          body: JSON.stringify({
            image_url: assetUrl,
            scale: options.upscale,
            user_token: userToken,
          }),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        sourceUrl = data.upscaled_url
        setProgress(65)
      }

      setPhase('processing')

      if (!isVideo) {
        const img = await loadImage(sourceUrl)
        setProgress(80)
        const { w, h } = computeDims(img.naturalWidth, img.naturalHeight, options)
        const blob = await imageToBlob(img, w, h, options.format as ImageFormat)
        setProgress(100)
        const ext = options.format === 'jpg' ? 'jpg' : options.format
        downloadBlob(blob, `prmptVAULT-${assetId}.${ext}`)
      } else {
        // No processing needed for original MP4
        if (options.format === 'mp4' && !options.targetWidth && !options.scale) {
          const a = document.createElement('a')
          a.href = sourceUrl
          a.download = `prmptVAULT-${assetId}.mp4`
          a.target = '_blank'
          a.click()
          setProgress(100)
          setPhase('done')
          return
        }

        const ff = await getFFmpeg()
        ff.on('progress', ({ progress: p }) => setProgress(Math.round(p * 100)))

        const inputName = 'input.mp4'
        const outputExt = options.format === 'gif' ? 'gif' : 'mp4'
        const outputName = `output.${outputExt}`

        const fileData = await fetchFile(sourceUrl)
        await ff.writeFile(inputName, fileData)

        const scaleArg = options.targetWidth
          ? `${options.targetWidth}:-2`
          : options.scale && options.scale !== 1
            ? `iw*${options.scale}:ih*${options.scale}`
            : null

        if (options.format === 'gif') {
          const scaleFilter = scaleArg
            ? `scale=${scaleArg}:flags=lanczos`
            : 'scale=480:-1:flags=lanczos'
          await ff.exec([
            '-i', inputName,
            '-vf', `fps=10,${scaleFilter},split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
            '-loop', '0',
            outputName,
          ])
        } else {
          const args = ['-i', inputName]
          if (scaleArg) args.push('-vf', `scale=${scaleArg}`)
          args.push('-c:v', 'libx264', '-preset', 'fast', '-crf', '23', outputName)
          await ff.exec(args)
        }

        const data = await ff.readFile(outputName)
        const bytes = data instanceof Uint8Array ? data : new TextEncoder().encode(data as string)
        const mimeType = options.format === 'gif' ? 'image/gif' : 'video/mp4'
        const blob = new Blob([bytes as unknown as BlobPart], { type: mimeType })
        downloadBlob(blob, `prmptVAULT-${assetId}.${outputExt}`)

        await ff.deleteFile(inputName).catch(() => {})
        await ff.deleteFile(outputName).catch(() => {})
      }

      setPhase('done')
    } finally {
      setProcessing(false)
      setProgress(0)
      setTimeout(() => setPhase('idle'), 1200)
    }
  }

  return { exportAsset, processing, progress, phase }
}
