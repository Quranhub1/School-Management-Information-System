export interface ConfirmDialogOptions {
  title?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
}

/**
 * Offline-friendly, centered confirmation dialog shared by management screens.
 * Uses the native dialog element and local inline styling; no CDN or network assets.
 */
export function showConfirmDialog(message: string, options: ConfirmDialogOptions = {}): Promise<boolean> {
  if (typeof document === 'undefined' || typeof HTMLDialogElement === 'undefined') {
    return Promise.resolve(false)
  }

  return new Promise(resolve => {
    const dialog = document.createElement('dialog')
    dialog.setAttribute('aria-labelledby', 'smis-confirm-title')
    dialog.style.cssText = [
      'width:min( calc(100vw - 32px), 440px)',
      'max-width:440px',
      'padding:0',
      'border:1px solid #e5dcc8',
      'border-radius:4px',
      'background:#fffdf7',
      'color:#29271f',
      'box-shadow:0 24px 80px rgba(0,0,0,.28)',
      'font:inherit',
      'overflow:hidden'
    ].join(';')

    const backdropStyle = document.createElement('style')
    backdropStyle.textContent = 'dialog.smis-confirm-dialog::backdrop{background:rgba(15,18,16,.58);backdrop-filter:blur(2px)}'
    dialog.className = 'smis-confirm-dialog'
    const header = document.createElement('div')
    header.style.cssText = 'padding:18px 22px;border-bottom:1px solid #e5dcc8;font-weight:750;font-size:17px'
    header.id = 'smis-confirm-title'
    header.textContent = options.title ?? 'Please confirm'
    const body = document.createElement('div')
    body.style.cssText = 'padding:22px;color:#4b463b;font-size:14px;line-height:1.6;white-space:pre-line'
    body.textContent = message
    const actions = document.createElement('div')
    actions.style.cssText = 'display:flex;justify-content:center;gap:10px;flex-wrap:wrap;padding:0 22px 22px'
    const cancel = document.createElement('button')
    cancel.type = 'button'
    cancel.textContent = options.cancelLabel ?? 'No, cancel'
    cancel.style.cssText = 'min-height:40px;padding:9px 16px;border:1px solid #cfc5b2;border-radius:3px;background:#fffdf7;color:#39352b;font:inherit;font-size:13px;font-weight:650;cursor:pointer'
    const confirm = document.createElement('button')
    confirm.type = 'button'
    confirm.textContent = options.confirmLabel ?? (options.destructive ? "Yes, I'm sure" : 'Continue')
    confirm.style.cssText = options.destructive
      ? 'min-height:40px;padding:9px 16px;border:1px solid #b91c1c;border-radius:3px;background:#dc2626;color:#fff;font:inherit;font-size:13px;font-weight:700;cursor:pointer'
      : 'min-height:40px;padding:9px 16px;border:1px solid #166534;border-radius:3px;background:#15803d;color:#fff;font:inherit;font-size:13px;font-weight:700;cursor:pointer'

    let settled = false
    const finish = (accepted: boolean) => {
      if (settled) return
      settled = true
      if (dialog.open) dialog.close()
      dialog.remove()
      backdropStyle.remove()
      resolve(accepted)
    }
    cancel.addEventListener('click', () => finish(false))
    confirm.addEventListener('click', () => finish(true))
    dialog.addEventListener('cancel', event => { event.preventDefault(); finish(false) })
    dialog.addEventListener('click', event => { if (event.target === dialog) finish(false) })
    actions.append(cancel, confirm)
    dialog.append(header, body, actions)
    document.head.append(backdropStyle)
    document.body.append(dialog)
    dialog.showModal()
    cancel.focus()
  })
}
