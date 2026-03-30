/**
 * Download a file by URL, triggering a browser save dialog.
 *
 * @param url       - The resource URL to download
 * @param filename  - Optional explicit filename. When omitted a timestamped
 *                    name like `prmptVAULT-<ts>.<ext>` is generated.
 * @param isVideo   - Hint used for extension when filename is omitted.
 */
export async function downloadFile(
  url: string,
  filename?: string,
  isVideo?: boolean,
) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)

    const name =
      filename ??
      `prmptVAULT-${Date.now()}.${isVideo ? 'mp4' : blob.type.includes('png') ? 'png' : 'jpg'}`

    const a = document.createElement('a')
    a.href = blobUrl
    a.download = name
    a.click()
    URL.revokeObjectURL(blobUrl)
  } catch {
    // Fallback: open in a new tab so the user can still grab the file
    window.open(url, '_blank')
  }
}
