import { useRef, useState } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

const CORE_VERSION = '0.12.6'
const CORE_BASE = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd`

let ffmpegInstance: FFmpeg | null = null
let loadPromise: Promise<void> | null = null

async function getFFmpeg(): Promise<FFmpeg> {
  if (!ffmpegInstance) {
    ffmpegInstance = new FFmpeg()
  }
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

export function useVideoToGif() {
  const [converting, setConverting] = useState(false)
  const [progress, setProgress] = useState(0)
  const abortRef = useRef(false)

  async function convertToGif(videoUrl: string, filename = 'video') {
    setConverting(true)
    setProgress(0)
    abortRef.current = false

    try {
      const ff = await getFFmpeg()

      ff.on('progress', ({ progress: p }) => {
        setProgress(Math.round(p * 100))
      })

      const inputName = 'input.mp4'
      const outputName = 'output.gif'

      const fileData = await fetchFile(videoUrl)
      await ff.writeFile(inputName, fileData)

      await ff.exec([
        '-i', inputName,
        '-vf', 'fps=10,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
        '-loop', '0',
        outputName,
      ])

      const data = await ff.readFile(outputName)
      const bytes = data instanceof Uint8Array ? data : new TextEncoder().encode(data as string)
      const blob = new Blob([bytes as unknown as BlobPart], { type: 'image/gif' })
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.gif`
      a.click()
      URL.revokeObjectURL(url)

      await ff.deleteFile(inputName)
      await ff.deleteFile(outputName)
    } finally {
      setConverting(false)
      setProgress(0)
    }
  }

  return { convertToGif, converting, progress }
}
