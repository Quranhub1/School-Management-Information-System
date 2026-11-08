declare module 'pdfmake/build/pdfmake' {
  interface PdfMakeDocument {
    download(filename?: string): Promise<void>
    print(): Promise<void>
    open(): Promise<void>
  }

  interface PdfMakeEngine {
    addVirtualFileSystem(fonts: unknown): void
    createPdf(definition: Record<string, unknown>): PdfMakeDocument
  }

  const pdfMake: PdfMakeEngine
  export = pdfMake
}

declare module 'pdfmake/build/vfs_fonts' {
  const fonts: unknown
  export = fonts
}
