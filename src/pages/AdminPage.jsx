import { useEffect, useState } from 'react'
import { adminApi, importApi, notificationsApi } from '@/api/services'
import { useTitle } from '@/hooks'
import { toast } from '@/store'
import { PageHeader } from '@/components/ui'

const ROLE_STYLE = {
  ADMIN: { bg: 'rgba(245,158,11,0.13)', border: 'rgba(245,158,11,0.38)', color: '#f59e0b' },
  USER:  { bg: 'rgba(56,189,248,0.10)', border: 'rgba(56,189,248,0.30)', color: '#38bdf8' },
}

function RoleBadge({ role }) {
  const s = ROLE_STYLE[role] || ROLE_STYLE.USER
  return (
    <span style={{
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 700,
      letterSpacing: '0.07em', textTransform: 'uppercase',
      padding: '3px 8px', borderRadius: '100px', whiteSpace: 'nowrap',
    }}>
      {role}
    </span>
  )
}

function AdminActionCard({ icon, title, description, buttonLabel, buttonVariant = 'primary', loading, onClick, notice }) {
  return (
    <div className="adm-action-card">
      <div className="adm-action-top">
        <span className="adm-action-icon">{icon}</span>
        <div>
          <h3 className="adm-action-title">{title}</h3>
          <p className="adm-action-desc">{description}</p>
        </div>
      </div>
      <button
        className={`adm-action-btn adm-action-btn--${buttonVariant}`}
        onClick={onClick}
        disabled={loading}
      >
        {loading
          ? <><span className="adm-action-spin" /> Trwa...</>
          : buttonLabel}
      </button>
      {notice && (
        <div className="adm-action-notice">
          <span className="adm-action-notice-spin" />
          <span>{notice}</span>
        </div>
      )}
    </div>
  )
}

export default function AdminPage() {
  useTitle('Admin')
  const [users,          setUsers]          = useState([])
  const [loading,        setLoading]        = useState(true)
  const [runningScript,  setRunningScript]  = useState(false)
  const [scriptNotice,   setScriptNotice]   = useState(null)
  const [sendingEmails,  setSendingEmails]  = useState(false)

  useEffect(() => {
    adminApi.getUsers()
      .then(r => setUsers(r.data))
      .catch(() => toast.error('Błąd pobierania użytkowników'))
      .finally(() => setLoading(false))
  }, [])

  const handleRunScript = async () => {
    setRunningScript(true)
    setScriptNotice(null)
    try {
      await importApi.runScript()
      setScriptNotice('Skrypt działa w tle — może potrwać kilka minut. Nowe oferty pojawią się automatycznie po zakończeniu. Możesz swobodnie korzystać z aplikacji.')
    } catch {
      toast.error('Błąd podczas uruchamiania skryptu')
      setScriptNotice(null)
    } finally {
      setRunningScript(false)
    }
  }

  const handleSendEmails = async () => {
    setSendingEmails(true)
    try {
      await notificationsApi.sendDailyEmails()
      toast.success('Maile z ofertami zostały wysłane do wszystkich użytkowników')
    } catch {
      toast.error('Błąd podczas wysyłki maili')
    } finally {
      setSendingEmails(false)
    }
  }

  const totalUsers   = users.length
  const activeUsers  = users.filter(u => u.active).length
  const adminUsers   = users.filter(u => u.role === 'ADMIN').length
  const totalApplied = users.reduce((s, u) => s + u.appliedCount, 0)

  return (
    <>
      <PageHeader
        title="Panel Administratora"
        subtitle="Przegląd użytkowników i statystyki aplikacji"
      />

      {/* ── Overview cards ── */}
      <div className="adm-overview">
        <div className="adm-card adm-card--stat">
          <span className="adm-card-val">{totalUsers}</span>
          <span className="adm-card-lbl">Użytkownicy</span>
        </div>
        <div className="adm-card adm-card--stat">
          <span className="adm-card-val" style={{ color: 'var(--green)' }}>{activeUsers}</span>
          <span className="adm-card-lbl">Aktywni</span>
        </div>
        <div className="adm-card adm-card--stat">
          <span className="adm-card-val" style={{ color: 'var(--yellow)' }}>{adminUsers}</span>
          <span className="adm-card-lbl">Administratorzy</span>
        </div>
        <div className="adm-card adm-card--stat">
          <span className="adm-card-val" style={{ color: 'var(--accent)' }}>{totalApplied}</span>
          <span className="adm-card-lbl">Łączne aplikacje</span>
        </div>
      </div>

      {/* ── Admin actions ── */}
      <div className="adm-actions-section">
        <h2 className="adm-section-title adm-section-title--standalone">Akcje administracyjne</h2>
        <div className="adm-actions-grid">
          <AdminActionCard
            icon="⊕"
            title="Uruchom skrypt importu ofert"
            description="Odpala skrypt Pythona, który scrapuje nowe ogłoszenia pracy i importuje je do bazy danych. Operacja trwa kilka minut i działa w tle po stronie serwera."
            buttonLabel="Uruchom skrypt"
            buttonVariant="accent"
            loading={runningScript}
            onClick={handleRunScript}
            notice={scriptNotice}
          />
          <AdminActionCard
            icon="◷"
            title="Wyślij maile z ofertami do użytkowników"
            description="Ręcznie wyzwala wysyłkę powiadomień e-mail do wszystkich aktywnych użytkowników. Każdy użytkownik otrzyma listę ofert ze swojej listy obserwowanych, do których jeszcze nie aplikował. Normalnie działa automatycznie o 17:00."
            buttonLabel="Wyślij maile"
            buttonVariant="cyan"
            loading={sendingEmails}
            onClick={handleSendEmails}
          />
        </div>
      </div>

      {/* ── User table ── */}
      <div className="adm-section">
        <h2 className="adm-section-title">Lista użytkowników</h2>

        {loading ? (
          <div className="adm-loading">
            <span className="adm-spinner" />
            <span>Ładowanie...</span>
          </div>
        ) : users.length === 0 ? (
          <p className="adm-empty">Brak użytkowników</p>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Użytkownik</th>
                  <th>Email</th>
                  <th>Rola</th>
                  <th>Status</th>
                  <th className="adm-th-center">Aplikacje</th>
                  <th className="adm-th-center">Obserwowane</th>
                  <th className="adm-th-center">Odrzucone</th>
                  <th className="adm-th-center">Notatki</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="adm-row">
                    <td>
                      <div className="adm-user-cell">
                        <span className="adm-avatar">{user.username[0]?.toUpperCase()}</span>
                        <span className="adm-username">{user.username}</span>
                      </div>
                    </td>
                    <td className="adm-email">{user.email}</td>
                    <td><RoleBadge role={user.role} /></td>
                    <td>
                      <span className={`adm-status ${user.active ? 'adm-status--active' : 'adm-status--inactive'}`}>
                        {user.active ? 'Aktywny' : 'Nieaktywny'}
                      </span>
                    </td>
                    <td className="adm-td-center">
                      <span className="adm-num adm-num--applied">{user.appliedCount}</span>
                    </td>
                    <td className="adm-td-center">
                      <span className="adm-num">{user.watchlistCount}</span>
                    </td>
                    <td className="adm-td-center">
                      <span className="adm-num adm-num--useless">{user.uselessCount}</span>
                    </td>
                    <td className="adm-td-center">
                      <span className="adm-num adm-num--notes">{user.notesCount}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        /* ── Overview ── */
        .adm-overview {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
          margin-bottom: 24px;
        }
        @media (max-width: 900px) { .adm-overview { grid-template-columns: repeat(2, 1fr); } }

        .adm-card {
          background: var(--bg-1); border: 1px solid var(--border-1);
          border-radius: var(--radius-lg); padding: 20px 24px;
        }
        .adm-card--stat { display: flex; flex-direction: column; gap: 4px; }
        .adm-card-val {
          font-family: var(--font-mono); font-size: 2rem; font-weight: 800;
          color: var(--text-0); line-height: 1;
        }
        .adm-card-lbl {
          font-size: 0.74rem; color: var(--text-2); text-transform: uppercase;
          letter-spacing: 0.06em; font-weight: 600;
        }

        /* ── Admin actions ── */
        .adm-actions-section { margin-bottom: 24px; }
        .adm-section-title--standalone {
          font-family: var(--font-display); font-size: 0.88rem; font-weight: 700;
          color: var(--text-1); text-transform: uppercase; letter-spacing: 0.07em;
          margin: 0 0 12px; padding: 0;
        }
        .adm-actions-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
        }
        @media (max-width: 800px) { .adm-actions-grid { grid-template-columns: 1fr; } }

        .adm-action-card {
          background: var(--bg-1); border: 1px solid var(--border-1);
          border-radius: var(--radius-lg); padding: 20px 24px;
          display: flex; flex-direction: column; gap: 16px;
        }
        .adm-action-top { display: flex; gap: 14px; align-items: flex-start; }
        .adm-action-icon {
          font-size: 1.4rem; color: var(--accent); flex-shrink: 0;
          margin-top: 2px; width: 24px; text-align: center;
        }
        .adm-action-title {
          font-family: var(--font-display); font-size: 0.95rem; font-weight: 700;
          color: var(--text-0); margin: 0 0 6px;
        }
        .adm-action-desc {
          font-size: 0.78rem; color: var(--text-2); line-height: 1.6; margin: 0;
        }

        .adm-action-btn {
          align-self: flex-start;
          display: inline-flex; align-items: center; gap: 8px;
          font-family: var(--font-mono); font-size: 0.78rem; font-weight: 700;
          padding: 9px 18px; border-radius: var(--radius-md); border: 1px solid transparent;
          cursor: pointer; white-space: nowrap;
          transition: background var(--t-fast), box-shadow var(--t-fast), opacity var(--t-fast);
        }
        .adm-action-btn:disabled { opacity: .5; cursor: not-allowed; }

        .adm-action-btn--accent {
          background: var(--accent); color: #fff; border-color: var(--accent);
        }
        .adm-action-btn--accent:hover:not(:disabled) {
          background: var(--accent-dim); box-shadow: var(--shadow-accent);
        }
        .adm-action-btn--cyan {
          background: rgba(56,189,248,0.12); color: var(--cyan);
          border-color: rgba(56,189,248,0.35);
        }
        .adm-action-btn--cyan:hover:not(:disabled) {
          background: rgba(56,189,248,0.20); box-shadow: var(--shadow-cyan);
        }
        .adm-action-spin {
          width: 12px; height: 12px; border: 2px solid transparent;
          border-top-color: currentColor; border-radius: 50%;
          animation: spin .6s linear infinite; flex-shrink: 0;
        }
        .adm-action-notice {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 10px 13px; border-radius: var(--radius-md);
          background: rgba(56,189,248,0.06); border: 1px solid rgba(56,189,248,0.25);
          font-size: 0.76rem; color: var(--text-2); line-height: 1.6;
        }
        .adm-action-notice-spin {
          width: 12px; height: 12px; flex-shrink: 0; margin-top: 2px;
          border: 2px solid transparent; border-top-color: var(--cyan);
          border-radius: 50%; animation: spin .8s linear infinite;
        }

        /* ── Section ── */
        .adm-section { background: var(--bg-1); border: 1px solid var(--border-1); border-radius: var(--radius-lg); overflow: hidden; }
        .adm-section-title {
          font-family: var(--font-display); font-size: 0.88rem; font-weight: 700;
          color: var(--text-1); text-transform: uppercase; letter-spacing: 0.07em;
          padding: 16px 20px; border-bottom: 1px solid var(--border-1); margin: 0;
        }

        .adm-loading {
          display: flex; align-items: center; gap: 10px;
          padding: 48px; color: var(--text-2); font-size: 0.84rem;
        }
        .adm-spinner {
          width: 18px; height: 18px; border: 2px solid var(--border-1);
          border-top-color: var(--accent); border-radius: 50%;
          animation: spin .7s linear infinite; flex-shrink: 0;
        }
        .adm-empty { padding: 48px; color: var(--text-2); text-align: center; font-size: 0.84rem; }

        /* ── Table ── */
        .adm-table-wrap { overflow-x: auto; }
        .adm-table {
          width: 100%; border-collapse: collapse;
          font-size: 0.82rem; color: var(--text-1);
        }
        .adm-table thead { background: var(--bg-2); }
        .adm-table th {
          padding: 10px 16px; text-align: left;
          font-family: var(--font-mono); font-size: 0.67rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.07em;
          color: var(--text-2); border-bottom: 1px solid var(--border-1);
          white-space: nowrap;
        }
        .adm-th-center { text-align: center; }
        .adm-td-center { text-align: center; }

        .adm-row { border-bottom: 1px solid var(--border-2); transition: background var(--t-fast); }
        .adm-row:last-child { border-bottom: none; }
        .adm-row:hover { background: var(--bg-2); }
        .adm-table td { padding: 12px 16px; vertical-align: middle; }

        .adm-user-cell { display: flex; align-items: center; gap: 10px; }
        .adm-avatar {
          width: 30px; height: 30px; border-radius: 50%;
          background: var(--accent-glow); border: 1px solid var(--border-0);
          color: var(--accent); font-family: var(--font-mono); font-size: 0.75rem; font-weight: 700;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .adm-username { font-weight: 600; color: var(--text-0); }
        .adm-email { color: var(--text-2); font-size: 0.78rem; }

        .adm-status {
          font-family: var(--font-mono); font-size: 0.65rem; font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase;
          padding: 3px 8px; border-radius: 100px;
        }
        .adm-status--active   { background: rgba(16,185,129,0.12); color: var(--green); border: 1px solid rgba(16,185,129,0.3); }
        .adm-status--inactive { background: rgba(148,163,184,0.08); color: var(--text-3); border: 1px solid var(--border-1); }

        .adm-num { font-family: var(--font-mono); font-size: 0.82rem; font-weight: 600; color: var(--text-1); }
        .adm-num--applied { color: var(--accent); }
        .adm-num--useless { color: var(--red); }
        .adm-num--notes   { color: var(--cyan); }
      `}</style>
    </>
  )
}
