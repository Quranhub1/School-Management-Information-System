import { useEffect, useState } from 'react'
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react'

export type NotificationKind = 'success' | 'error' | 'warning' | 'info'
type NotificationDetail = { message: string; kind?: NotificationKind; title?: string }
type Toast = NotificationDetail & { id: number }

const EVENT_NAME = 'smis:notification'
let nextId = 0

export function notify(message: string, kind: NotificationKind = 'success', title?: string) {
  if (typeof window === 'undefined' || !message.trim()) return
  window.dispatchEvent(new CustomEvent<NotificationDetail>(EVENT_NAME, { detail: { message, kind, title } }))
}

export function GlobalNotificationViewport() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const timers = new Map<number, number>()
    const onNotification = (event: Event) => {
      const detail = (event as CustomEvent<NotificationDetail>).detail
      if (!detail?.message?.trim()) return
      const toast: Toast = { ...detail, kind: detail.kind ?? 'success', id: ++nextId }
      setToasts(current => [...current, toast].slice(-4))
      timers.set(toast.id, window.setTimeout(() => {
        setToasts(current => current.filter(item => item.id !== toast.id))
        timers.delete(toast.id)
      }, toast.kind === 'error' ? 7000 : 4500))
    }
    window.addEventListener(EVENT_NAME, onNotification)
    return () => {
      window.removeEventListener(EVENT_NAME, onNotification)
      timers.forEach(timer => window.clearTimeout(timer))
    }
  }, [])

  function dismiss(id: number) {
    setToasts(current => current.filter(item => item.id !== id))
  }

  return <div className="smis-toast-viewport" aria-label="System notifications" aria-live="polite" aria-relevant="additions">
    {toasts.map(toast => {
      const isError = toast.kind === 'error'
      const isWarning = toast.kind === 'warning'
      const Icon = isError || isWarning ? CircleAlert : toast.kind === 'info' ? Info : CheckCircle2
      const tone = isError ? 'error' : isWarning ? 'warning' : toast.kind === 'info' ? 'info' : 'success'
      return <div key={toast.id} className={`smis-toast smis-toast-${tone}`} role={isError ? 'alert' : 'status'}>
        <Icon size={21} aria-hidden="true" className="smis-toast-icon" />
        <div className="smis-toast-copy">
          {toast.title && <strong>{toast.title}</strong>}
          <span>{toast.message}</span>
        </div>
        <button type="button" className="smis-toast-dismiss" aria-label="Dismiss notification" onClick={() => dismiss(toast.id)}><X size={17} /></button>
      </div>
    })}
    <style>{`
      .smis-toast-viewport{position:fixed;z-index:10000;top:18px;right:18px;display:flex;flex-direction:column;gap:10px;width:min(410px,calc(100vw - 28px));pointer-events:none}
      .smis-toast{pointer-events:auto;display:flex;align-items:flex-start;gap:11px;padding:14px 13px;border:1px solid #dbe3dc;border-radius:10px;background:#fff;box-shadow:0 12px 35px rgba(15,23,42,.16);color:#1f2937;animation:smis-toast-enter .18s ease-out}
      .smis-toast-icon{flex:0 0 auto;margin-top:1px}.smis-toast-copy{display:flex;flex:1;min-width:0;flex-direction:column;gap:3px;font-size:13px;line-height:1.45}.smis-toast-copy strong{font-size:13px;font-weight:700}.smis-toast-dismiss{flex:0 0 auto;display:grid;place-items:center;padding:2px;border-radius:5px;color:#64748b}.smis-toast-dismiss:hover{background:#f1f5f9;color:#0f172a}
      .smis-toast-success{border-left:4px solid #15803d}.smis-toast-success .smis-toast-icon{color:#15803d}.smis-toast-error{border-left:4px solid #b91c1c}.smis-toast-error .smis-toast-icon{color:#b91c1c}.smis-toast-warning{border-left:4px solid #b45309}.smis-toast-warning .smis-toast-icon{color:#b45309}.smis-toast-info{border-left:4px solid #2563eb}.smis-toast-info .smis-toast-icon{color:#2563eb}
      @keyframes smis-toast-enter{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}@media(prefers-reduced-motion:reduce){.smis-toast{animation:none}}
    `}</style>
  </div>
}
