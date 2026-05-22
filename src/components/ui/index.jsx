import { useState } from 'react'

// ── Badge (poziom) ────────────────────────────────────────────────
const BADGE_STYLE = {
  trainee: { bg: 'rgba(100,116,139,0.18)', border: 'rgba(100,116,139,0.35)', color: '#94a3b8' },
  junior:  { bg: 'rgba(16,185,129,0.13)',  border: 'rgba(16,185,129,0.35)',  color: '#10b981' },
  mid:     { bg: 'rgba(56,189,248,0.12)',  border: 'rgba(56,189,248,0.35)',  color: '#38bdf8' },
  senior:  { bg: 'rgba(99,102,241,0.14)',  border: 'rgba(99,102,241,0.40)',  color: '#818cf8' },
  expert:  { bg: 'rgba(245,158,11,0.13)',  border: 'rgba(245,158,11,0.38)',  color: '#f59e0b' },
  default: { bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.15)', color: '#64748b' },
}

export function Badge({ level }) {
  const key = (level || '').toLowerCase()
  const s   = BADGE_STYLE[key] || BADGE_STYLE.default
  return (
    <span
      className="badge"
      style={{ background: s.bg, borderColor: s.border, color: s.color }}
    >
      {level || '—'}
    </span>
  )
}

// ── PageHeader ────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }) {
  return (
    <>
      <header className="page-header animate-fade-in">
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="page-header-actions">{actions}</div>}
      </header>
      <style>{`
        .page-header {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 16px;
          margin-bottom: 24px; flex-wrap: wrap;
        }
        .page-title {
          font-family: var(--font-display);
          font-size: 1.75rem; font-weight: 800; color: var(--text-0);
        }
        .page-subtitle { font-size: 0.82rem; color: var(--text-2); margin-top: 3px; }
        .page-header-actions {
          display: flex; gap: 8px; align-items: center; flex-shrink: 0;
        }
        .badge {
          display: inline-flex; align-items: center;
          font-family: var(--font-mono); font-size: 0.68rem; font-weight: 700;
          letter-spacing: 0.07em; text-transform: uppercase;
          padding: 3px 8px; border-radius: 100px; border: 1px solid;
          white-space: nowrap;
        }
      `}</style>
    </>
  )
}

// ── EmptyState ────────────────────────────────────────────────────
export function EmptyState({ icon = '◌', title, description, action }) {
  return (
    <>
      <div className="empty-state">
        <span className="empty-icon">{icon}</span>
        <h3 className="empty-title">{title}</h3>
        {description && <p className="empty-desc">{description}</p>}
        {action && <div className="empty-action">{action}</div>}
      </div>
      <style>{`
        .empty-state {
          display: flex; flex-direction: column;
          align-items: center; text-align: center;
          padding: 64px 24px; gap: 8px;
        }
        .empty-icon  { font-size: 2.5rem; color: var(--text-3); margin-bottom: 8px; }
        .empty-title { font-family: var(--font-display); font-size: 1rem; font-weight: 700; color: var(--text-1); }
        .empty-desc  { font-size: 0.82rem; color: var(--text-2); max-width: 380px; line-height: 1.6; }
        .empty-action{ margin-top: 12px; }
      `}</style>
    </>
  )
}

// ── ConfirmModal ──────────────────────────────────────────────────
export function ConfirmModal({ title, description, onConfirm, onClose }) {
  const [input, setInput] = useState('')
  const valid = input === 'POTWIERDŹ'

  const submit = () => { if (valid) { onConfirm(); onClose() } }

  return (
    <>
      <div
        className="conf-backdrop"
        onClick={onClose}
        onKeyDown={e => { if (e.key === 'Escape') onClose() }}
      >
        <div
          className="conf-modal animate-fade-in"
          onClick={e => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <div className="conf-icon">⚠</div>
          <h3 className="conf-title">{title}</h3>
          {description && <p className="conf-desc">{description}</p>}
          <p className="conf-hint">Wpisz <code>POTWIERDŹ</code> aby kontynuować:</p>
          <input
            className="conf-input"
            autoFocus
            placeholder="POTWIERDŹ"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
          />
          <div className="conf-foot">
            <button className="conf-btn conf-btn--cancel" onClick={onClose}>Anuluj</button>
            <button className="conf-btn conf-btn--delete" disabled={!valid} onClick={submit}>
              Usuń
            </button>
          </div>
        </div>
      </div>
      <style>{`
        .conf-backdrop {
          position: fixed; inset: 0; z-index: 300;
          background: rgba(0,0,0,.72); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center; padding: 16px;
        }
        .conf-modal {
          background: var(--bg-1); border: 1px solid rgba(239,68,68,.4);
          border-radius: var(--radius-xl); width: 100%; max-width: 400px;
          padding: 28px 24px; display: flex; flex-direction: column; gap: 12px;
          box-shadow: 0 0 40px rgba(239,68,68,.15);
        }
        .conf-icon { font-size: 2rem; text-align: center; }
        .conf-title {
          font-family: var(--font-display); font-size: 1rem; font-weight: 800;
          color: var(--text-0); text-align: center;
        }
        .conf-desc { font-size: 0.79rem; color: var(--text-2); text-align: center; line-height: 1.6; }
        .conf-hint { font-size: 0.75rem; color: var(--text-2); }
        .conf-hint code { color: var(--red); font-family: var(--font-mono); }
        .conf-input {
          width: 100%; padding: 9px 12px; box-sizing: border-box;
          background: var(--bg-2); border: 1px solid var(--border-1);
          border-radius: var(--radius-md); font-family: var(--font-mono);
          font-size: 0.85rem; color: var(--text-0); outline: none;
          transition: border-color .15s;
        }
        .conf-input:focus { border-color: var(--red); box-shadow: 0 0 0 2px rgba(239,68,68,.15); }
        .conf-foot { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
        .conf-btn {
          padding: 8px 18px; border-radius: var(--radius-md); border: 1px solid;
          font-family: var(--font-mono); font-size: 0.8rem; font-weight: 600;
          cursor: pointer; transition: background .15s, filter .15s;
        }
        .conf-btn--cancel {
          background: transparent; color: var(--text-1); border-color: var(--border-1);
        }
        .conf-btn--cancel:hover { background: var(--bg-2); }
        .conf-btn--delete {
          background: var(--red); color: #fff; border-color: var(--red);
        }
        .conf-btn--delete:disabled { opacity: .35; cursor: not-allowed; }
        .conf-btn--delete:not(:disabled):hover { filter: brightness(1.12); }
      `}</style>
    </>
  )
}

// ── Button ────────────────────────────────────────────────────────
export function Button({ children, variant = 'primary', size = 'md', disabled, loading, onClick, ...rest }) {
  return (
    <>
      <button
        className={`btn btn--${variant} btn--${size}`}
        disabled={disabled || loading}
        onClick={onClick}
        {...rest}
      >
        {loading && <span className="btn-spin" aria-hidden="true" />}
        <span style={loading ? { visibility: 'hidden' } : {}}>{children}</span>
      </button>
      <style>{`
        .btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 7px;
          font-family: var(--font-mono); font-weight: 600; border-radius: var(--radius-md);
          border: 1px solid transparent; cursor: pointer; white-space: nowrap;
          transition: background .15s, border-color .15s, box-shadow .15s, transform .1s;
          position: relative;
        }
        .btn:active:not(:disabled)  { transform: scale(0.98); }
        .btn:disabled { opacity: .45; cursor: not-allowed; }
        .btn--sm { padding: 6px 12px;  font-size: 0.74rem; }
        .btn--md { padding: 10px 18px; font-size: 0.82rem; }
        .btn--primary {
          background: var(--accent); color: #fff; border-color: var(--accent);
        }
        .btn--primary:hover:not(:disabled) {
          background: var(--accent-dim); box-shadow: var(--shadow-accent);
        }
        .btn--secondary {
          background: var(--bg-3); color: var(--text-0); border-color: var(--border-1);
        }
        .btn--secondary:hover:not(:disabled) { background: var(--bg-4); border-color: var(--border-0); }
        .btn--ghost {
          background: transparent; color: var(--text-1); border-color: var(--border-1);
        }
        .btn--ghost:hover:not(:disabled) { background: var(--bg-2); color: var(--text-0); }
        .btn--danger {
          background: transparent; color: var(--red); border-color: rgba(239,68,68,0.3);
        }
        .btn--danger:hover:not(:disabled) { background: rgba(239,68,68,0.1); }
        .btn-spin {
          position: absolute; width: 14px; height: 14px;
          border: 2px solid transparent; border-top-color: currentColor;
          border-radius: 50%; animation: spin .6s linear infinite;
        }
      `}</style>
    </>
  )
}