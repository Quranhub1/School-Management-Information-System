import html2canvas from 'html2canvas'

export interface PrintCaptureOptions {
  filename?: string
  scale?: number
  backgroundColor?: string
}

/** Capture a same-origin printable node. html2canvas is bundled locally, with no runtime CDN. */
export async function captureElementAsPng(
  element: HTMLElement,
  options: Pick<PrintCaptureOptions, 'scale' | 'backgroundColor'> = {},
): Promise<Blob> {
  if (!element.isConnected) throw new Error('The printable element is not attached to the document.')
  const scale = Math.max(1, Math.min(options.scale ?? window.devicePixelRatio ?? 1, 3))
  const canvas = await html2canvas(element, {
    scale,
    backgroundColor: options.backgroundColor ?? '#ffffff',
    useCORS: false,
    allowTaint: false,
    logging: false,
    removeContainer: true,
    windowWidth: Math.max(document.documentElement.clientWidth, element.scrollWidth),
    windowHeight: Math.max(document.documentElement.clientHeight, element.scrollHeight),
    onclone: clonedDocument => {
      clonedDocument.querySelectorAll('.no-print, .capture-exclude').forEach(node => {
        ;(node as HTMLElement).style.display = 'none'
      })
    },
  })
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('The printable layout could not be converted to an image.')), 'image/png')
  })
}

export async function downloadElementAsPng(element: HTMLElement, options: PrintCaptureOptions = {}): Promise<void> {
  const blob = await captureElementAsPng(element, options)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = options.filename ?? 'printable-layout.png'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
