import { useUIStore } from '@/store'

const STYLE = {
  success: { bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.3)',  color: '#22c55e', icon: '✓' },
  error:   { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  color: '#ef4444', icon: '✕' },
  info:    { bg: 'rgba(0,212,212,0.12)',  border: 'rgba(0,212,212,0.3)',  color: '#00d4d4', icon: 'ℹ' },
  warn:    { bg: 'rgba(245,166,35,0.12)', border: 'rgba(245,166,35,0.3)', color: '#f5a623', icon: '⚠' },
}

function Toast({ id, message, type }) {
  const remove = useUIStore((s) => s.removeToast)
  const s = STYLE[type] || STYLE.info
  return (
    <div
      className="toast animate-fade-in"
      style={{ background: s.bg, borderColor: s.border }}
      role="alert"
    >
      <span style={{ color: s.color, fontWeight: 700, fontSize: '0.9rem' }}>{s.icon}</span>
      <span className="toast-msg">{message}</span>
      <button className="toast-close" onClick={() => remove(id)}>✕</button>
    </div>
  )
}

export default function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts)
  return (
    <>
      <div className="toast-container" role="region" aria-label="Powiadomienia">
        {toasts.map((t) => <Toast key={t.id} {...t} />)}
      </div>
      <style>{`
        .toast-container {
          position: fixed; bottom: 24px; right: 24px;
          display: flex; flex-direction: column; gap: 8px;
          z-index: 9999; max-width: 360px;
        }
        .toast {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 12px 14px; border: 1px solid; border-radius: 10px;
          backdrop-filter: blur(8px);
        }
        .toast-msg {
          flex: 1; font-size: 0.82rem; color: var(--text-0);
          line-height: 1.4; font-family: var(--font-mono);
        }
        .toast-close {
          background: none; border: none; color: var(--text-3);
          cursor: pointer; font-size: 0.7rem; flex-shrink: 0;
          transition: color .15s; padding: 0; line-height: 1;
        }
        .toast-close:hover { color: var(--text-0); }
      `}</style>
    </>
  )
}