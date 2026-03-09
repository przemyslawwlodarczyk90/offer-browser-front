import { Outlet } from 'react-router-dom'
import ToastContainer from '@/components/ui/ToastContainer'

export default function AuthLayout() {
  return (
    <>
      <div className="auth-shell">
        <div className="bg-grid" aria-hidden="true" />
        <div className="auth-glow"  aria-hidden="true" />

        <div className="auth-brand">
          <span className="auth-logo-mark">OB</span>
          <span className="auth-logo-name">OfferBrowser</span>
        </div>

        <main className="auth-main">
          <Outlet />
        </main>
      </div>
      <ToastContainer />

      <style>{`
        .auth-shell {
          min-height: 100vh;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 32px 16px; position: relative; overflow: hidden;
          background: var(--bg-0);
        }
        .auth-glow {
          position: fixed; top: -20%; left: 50%; transform: translateX(-50%);
          width: 600px; height: 500px; pointer-events: none; z-index: 0;
          background: radial-gradient(circle, rgba(245,166,35,0.07) 0%, transparent 65%);
        }
        .auth-brand {
          position: fixed; top: 24px; left: 28px;
          display: flex; align-items: center; gap: 10px; z-index: 1;
        }
        .auth-logo-mark {
          font-family: var(--font-display); font-weight: 800; font-size: 0.85rem;
          color: var(--accent); background: var(--accent-glow);
          border: 1px solid var(--border-0); width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          border-radius: var(--radius-sm);
        }
        .auth-logo-name {
          font-family: var(--font-display); font-weight: 700;
          font-size: 0.88rem; color: var(--text-1);
        }
        .auth-main {
          position: relative; z-index: 1;
          width: 100%; max-width: 420px;
        }
      `}</style>
    </>
  )
}