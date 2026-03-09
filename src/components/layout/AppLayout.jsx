// ╔══════════════════════════════════════════════════════╗
// ║  ŚCIEŻKA:  src/components/layout/AppLayout.jsx      ║
// ║  AKCJA:    NADPISZ istniejący plik                  ║
// ║  ZMIANA:   Dodano licznik zaaplikowanych w sidebarze ║
// ╚══════════════════════════════════════════════════════╝

import { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore, useUIStore } from '@/store'
import { userOffersApi } from '@/api/services'
import ToastContainer from '@/components/ui/ToastContainer'

// ── Licznik aplikacji — pobierany raz przy montowaniu ──────────────
function useAppliedCount(userId) {
  const [count, setCount] = useState(null)
  useEffect(() => {
    if (!userId) return
    userOffersApi.getApplied(userId)
      .then((res) => setCount(res.data?.length ?? 0))
      .catch(() => setCount(null))
  }, [userId])
  return count
}

// ── Definicja nawigacji ───────────────────────────────────────────
const NAV_TOP = [
  { to: '/dashboard', icon: '◈', label: 'Dashboard'  },
  { to: '/offers',    icon: '◉', label: 'Oferty'      },
  { to: '/my-offers', icon: '◎', label: 'Moje Oferty', showCount: true },
  { to: '/notes',     icon: '◷', label: 'Notatki'     },
  { to: '/import',    icon: '⊕', label: 'Import'      },
  { to: '/stats',     icon: '▦', label: 'Statystyki'  },
]

// ─────────────────────────────────────────────────────────────────
export default function AppLayout() {
  const { user, logout }               = useAuthStore()
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const navigate     = useNavigate()
  const appliedCount = useAppliedCount(user?.id)

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <>
      <div className={`app-shell ${sidebarOpen ? 'sb-open' : 'sb-closed'}`}>

        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <div className="sb-header">
            <span className="sb-logo">OB</span>
            {sidebarOpen && <span className="sb-name">OfferBrowser</span>}
            <button className="sb-toggle" onClick={toggleSidebar} aria-label="Toggle sidebar">
              {sidebarOpen ? '‹' : '›'}
            </button>
          </div>

          <nav className="sb-nav">
            {NAV_TOP.map(({ to, icon, label, showCount }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `nav-item${isActive ? ' nav-item--active' : ''}`}
              >
                <span className="nav-icon">{icon}</span>
                {sidebarOpen && <span className="nav-label">{label}</span>}
                {/* Licznik aplikacji obok "Moje Oferty" */}
                {showCount && appliedCount !== null && appliedCount > 0 && (
                  <span className="nav-badge">{appliedCount}</span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="sb-footer">
            <NavLink
              to="/profile"
              className={({ isActive }) => `nav-item${isActive ? ' nav-item--active' : ''}`}
            >
              <span className="nav-icon">⊙</span>
              {sidebarOpen && <span className="nav-label">{user?.username ?? 'Profil'}</span>}
            </NavLink>
            <button className="nav-item nav-item--logout" onClick={handleLogout}>
              <span className="nav-icon">⊘</span>
              {sidebarOpen && <span className="nav-label">Wyloguj</span>}
            </button>
          </div>
        </aside>

        {/* ── Treść ── */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>

      <ToastContainer />

      <style>{`
        .app-shell { display: flex; min-height: 100vh; --sb: 240px; }
        .app-shell.sb-closed { --sb: 60px; }

        /* ── Sidebar ── */
        .sidebar {
          position: fixed; top: 0; left: 0; bottom: 0; width: var(--sb);
          background: var(--bg-1); border-right: 1px solid var(--border-1);
          display: flex; flex-direction: column;
          transition: width var(--t-slow); overflow: hidden; z-index: 100;
        }

        /* Header */
        .sb-header {
          display: flex; align-items: center; gap: 10px;
          padding: 0 14px; min-height: 60px;
          border-bottom: 1px solid var(--border-1);
        }
        .sb-logo {
          font-family: var(--font-display); font-weight: 800; font-size: 1rem;
          color: var(--accent); background: var(--accent-glow);
          border: 1px solid var(--border-0); width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          border-radius: var(--radius-sm); flex-shrink: 0;
        }
        .sb-name {
          font-family: var(--font-display); font-weight: 700;
          font-size: 0.88rem; color: var(--text-0); white-space: nowrap; flex: 1;
        }
        .sb-toggle {
          margin-left: auto; background: none; border: none;
          color: var(--text-2); cursor: pointer; font-size: 1.1rem;
          padding: 4px; transition: color var(--t-fast); flex-shrink: 0;
        }
        .sb-toggle:hover { color: var(--accent); }

        /* Nav */
        .sb-nav { flex: 1; padding: 12px 0; overflow-y: auto; overflow-x: hidden; }

        .nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; color: var(--text-2); text-decoration: none;
          font-size: 0.81rem; font-weight: 500; white-space: nowrap;
          transition: color var(--t-fast), background var(--t-fast);
          cursor: pointer; background: none; border: none; width: 100%;
          text-align: left; position: relative;
        }
        .nav-item:hover { color: var(--text-0); background: var(--bg-2); }
        .nav-item--active { color: var(--accent) !important; background: var(--accent-glow) !important; }
        .nav-item--active::before {
          content: ''; position: absolute;
          left: 0; top: 0; bottom: 0; width: 2px; background: var(--accent);
        }
        .nav-icon  { font-size: 1rem; flex-shrink: 0; width: 20px; text-align: center; }
        .nav-label { overflow: hidden; text-overflow: ellipsis; flex: 1; }

        /* Licznik aplikacji w sidebarze */
        .nav-badge {
          margin-left: auto;
          font-family: var(--font-mono); font-size: 0.6rem; font-weight: 700;
          background: var(--accent); color: #000;
          padding: 1px 6px; border-radius: 100px;
          flex-shrink: 0; line-height: 1.5;
        }

        /* Footer */
        .sb-footer { border-top: 1px solid var(--border-1); padding: 8px 0; }
        .nav-item--logout { color: var(--text-3); }
        .nav-item--logout:hover { color: var(--red); background: rgba(239,68,68,0.07); }

        /* Treść główna */
        .main-content {
          margin-left: var(--sb); flex: 1; min-height: 100vh;
          padding: 32px; transition: margin-left var(--t-slow);
          background: var(--bg-0);
        }
      `}</style>
    </>
  )
}