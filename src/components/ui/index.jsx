// ── Badge (poziom) ────────────────────────────────────────────────
const BADGE_STYLE = {
  trainee: { bg: 'rgba(100,116,139,0.2)', border: 'rgba(100,116,139,0.4)', color: '#94a3b8' },
  junior:  { bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.35)',  color: '#22c55e' },
  mid:     { bg: 'rgba(245,166,35,0.12)', border: 'rgba(245,166,35,0.35)', color: '#f5a623' },
  senior:  { bg: 'rgba(0,212,212,0.10)',  border: 'rgba(0,212,212,0.35)',  color: '#00d4d4' },
  expert:  { bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.35)', color: '#a855f7' },
  default: { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)', color: '#70708a' },
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
          background: var(--accent); color: #000; border-color: var(--accent);
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