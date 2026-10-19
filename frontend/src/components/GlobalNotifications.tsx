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
  const [notifications, setNotifications] = useState<Toast[]>([])

  useEffect(() => {
    const timers = new Map<number, number>()
    const onNotification = (event: Event) => {
      const detail = (event as CustomEvent<NotificationDetail>).detail
      if (!detail?.message?.trim()) return
      const notification: Toast = { ...detail, kind: detail.kind ?? 'success', id: ++nextId }
      setNotifications([notification])
      timers.set(notification.id, window.setTimeout(() => {
        setNotifications(current => current.filter(item => item.id !== notification.id))
        timers.delete(notification.id)
      }, notification.kind === 'error' ? 6500 : 3500))
    }
    window.addEventListener(EVENT_NAME, onNotification)
    return () => {
      window.removeEventListener(EVENT_NAME, onNotification)
      timers.forEach(timer => window.clearTimeout(timer))
    }
  }, [])

  function dismiss(id: number) {
    setNotifications(current => current.filter(item => item.id !== id))
  }

  return <div className="smis-modal-notification-layer" aria-label="System notifications" aria-live="polite" aria-relevant="additions">
    {notifications.map((notification, index) => {
      const kind = notification.kind ?? 'success'
      const Icon = kind === 'error' || kind === 'warning' ? CircleAlert : kind === 'info' ? Info : CheckCircle2
      const label = kind === 'error' ? 'Action failed' : kind === 'warning' ? 'Please check' : kind === 'info' ? 'Information' : 'Success'
      return <div key={notification.id} className="smis-modal-notification-backdrop" style={{ zIndex: 10000 + index }} onMouseDown={event => { if (event.target === event.currentTarget) dismiss(notification.id) }}>
        <section className={`smis-modal-notification smis-modal-${kind}`} role={kind === 'error' ? 'alertdialog' : 'dialog'} aria-modal="true" aria-labelledby={`smis-notification-title-${notification.id}`} aria-describedby={`smis-notification-message-${notification.id}`}>
          <button type="button" className="smis-modal-notification-close" aria-label="Close notification" onClick={() => dismiss(notification.id)}><X size={19} /></button>
          <div className="smis-modal-notification-content">
            <div className="smis-modal-notification-icon"><Icon size={32} strokeWidth={1.8} aria-hidden="true" /></div>
            <p className="smis-modal-notification-label">{notification.title || label}</p>
            <h2 id={`smis-notification-title-${notification.id}`}>{notification.title ? label : kind === 'success' ? 'Completed successfully' : label}</h2>
            <p id={`smis-notification-message-${notification.id}`} className="smis-modal-notification-message">{notification.message}</p>
            <button type="button" className="smis-modal-notification-confirm" onClick={() => dismiss(notification.id)}>OK, got it</button>
          </div>
        </section>
      </div>
    })}
    <style>{`
      .smis-modal-notification-backdrop{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(15,23,42,.48);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);animation:smis-modal-fade-in .16s ease-out}
      .smis-modal-notification{position:relative;width:min(100%,440px);max-height:calc(100vh - 36px);overflow:auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 24px 80px rgba(0,0,0,.24);color:#1f2937;animation:smis-modal-rise-in .2s ease-out}
      .smis-modal-notification-close{position:absolute;top:11px;right:11px;z-index:1;display:grid;place-items:center;width:36px;height:36px;border:0;border-radius:7px;background:transparent;color:#6b7280;cursor:pointer}
      .smis-modal-notification-close:hover{background:#f3f4f6;color:#111827}
      .smis-modal-notification-content{display:flex;flex-direction:column;align-items:center;padding:32px 28px 26px;text-align:center}
      .smis-modal-notification-icon{display:grid;place-items:center;width:62px;height:62px;margin:4px 0 15px;border-radius:50%;background:#ecfdf3;color:#15803d}
      .smis-modal-error .smis-modal-notification-icon{background:#fef2f2;color:#b91c1c}.smis-modal-warning .smis-modal-notification-icon{background:#fffbeb;color:#b45309}.smis-modal-info .smis-modal-notification-icon{background:#eff6ff;color:#1d4ed8}
      .smis-modal-notification-label{margin:0 0 7px;color:#6b7280;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}
      .smis-modal-notification-content h2{margin:0;color:#111827;font-size:21px;font-weight:700;line-height:1.3}
      .smis-modal-notification-message{margin:12px 0 24px;color:#4b5563;font-size:14px;line-height:1.6;overflow-wrap:anywhere}
      .smis-modal-notification-confirm{min-width:120px;padding:10px 22px;border:1px solid transparent;border-radius:7px;background:#292821;color:#f5efdf;font-size:13px;font-weight:600;cursor:pointer;transition:background .15s ease}
      .smis-modal-notification-confirm:hover{background:#11110f}.smis-modal-error .smis-modal-notification-confirm{background:#b91c1c}.smis-modal-error .smis-modal-notification-confirm:hover{background:#991b1b}
      @keyframes smis-modal-fade-in{from{opacity:0}to{opacity:1}}@keyframes smis-modal-rise-in{from{opacity:0;transform:translateY(8px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
      @media(max-width:480px){.smis-modal-notification-content{padding:28px 20px 22px}.smis-modal-notification-content h2{font-size:19px}}
      @media(prefers-reduced-motion:reduce){.smis-modal-notification-backdrop,.smis-modal-notification{animation:none}}
    `}</style>
  </div>
}
