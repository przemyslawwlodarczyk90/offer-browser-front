// ╔══════════════════════════════════════════════╗
// ║  ŚCIEŻKA:  src/pages/DashboardPage.jsx       ║
// ║  AKCJA:    NADPISZ istniejący plik           ║
// ╚══════════════════════════════════════════════╝

import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { statsApi, offersApi, userOffersApi } from '@/api/services'
import { useApi, useTitle } from '@/hooks'
import { useAuthStore } from '@/store'
import { formatDate, normalizeLevel } from '@/utils'

// ─────────────────────────────────────────────────────────────────
// Karta statystyczna
// ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, accent, loading }) {
  return (
    <div className="db-stat" style={accent ? { borderColor: accent } : {}}>
      <span className="db-stat-icon" style={accent ? { color: accent } : {}}>{icon}</span>
      <div className="db-stat-body">
        {loading
          ? <div className="db-skel db-skel--val" />
          : <span className="db-stat-val">{value ?? '—'}</span>
        }
        <span className="db-stat-label">{label}</span>
        {sub && <span className="db-stat-sub">{sub}</span>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Szybka akcja
// ─────────────────────────────────────────────────────────────────
function QuickAction({ icon, label, desc, to, accent, navigate }) {
  return (
    <button className="db-action" onClick={() => navigate(to)}>
      <span className="db-action-icon" style={{ color: accent }}>{icon}</span>
      <div className="db-action-body">
        <span className="db-action-label">{label}</span>
        <span className="db-action-desc">{desc}</span>
      </div>
      <span className="db-action-arrow">→</span>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────
// Mini karta oferty
// ─────────────────────────────────────────────────────────────────
function MiniOfferCard({ offer, onClick }) {
  const level = normalizeLevel(offer.level)
  const LEVEL_COLOR = {
    Trainee: '#64748b', Junior: '#22c55e', Mid: '#f5a623',
    Senior: '#00d4d4', Expert: '#a855f7',
  }
  const color = LEVEL_COLOR[level] ?? 'var(--text-3)'

  return (
    <button className="db-offer" onClick={onClick}>
      <span className="db-offer-dot" style={{ background: color }} />
      <div className="db-offer-body">
        <p className="db-offer-title">{offer.title}</p>
        <p className="db-offer-meta">
          {offer.company ?? offer.companyName ?? '—'}
          {offer.city ? ` · ${offer.city}` : ''}
        </p>
      </div>
      <span className="db-offer-date">{formatDate(offer.fetchedAt)}</span>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────
// Strona główna
// ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  useTitle('Dashboard')
  const navigate = useNavigate()
  const user     = useAuthStore(s => s.user)
  const userId   = user?.id

  // ── Dane ─────────────────────────────────────────────────────
  const { data: totalRaw,  loading: loadingT } =
    useApi(() => statsApi.getTotalOffers(),       { immediate: true })

  const { data: levelRaw,  loading: loadingL } =
    useApi(() => statsApi.getLevelDistribution(), { immediate: true })

  const { data: allOffers, loading: loadingO } =
    useApi(() => offersApi.getAll(),              { immediate: true })

  const { data: applied,   loading: loadingA } =
    useApi(
      () => userOffersApi.getApplied(userId),
      { immediate: !!userId, deps: [userId] }
    )

  const { data: notApplied, loading: loadingNA } =
    useApi(
      () => userOffersApi.getNotApplied(userId),
      { immediate: !!userId, deps: [userId] }
    )

  // ── Pochodne ─────────────────────────────────────────────────
  const totalOffers   = totalRaw?.totalOffers ?? totalRaw ?? 0
  const appliedCount  = applied?.length  ?? 0
  const pendingCount  = notApplied?.length ?? 0
  const applyRate     = appliedCount + pendingCount > 0
    ? Math.round((appliedCount / (appliedCount + pendingCount)) * 100)
    : 0

  // Top poziom z rozkładu
  let topLevel = '—'
  if (levelRaw) {
    const arr = Array.isArray(levelRaw)
      ? levelRaw.map(i => ({ name: i.level ?? i.name ?? i.key, count: i.count ?? i.value ?? 0 }))
      : Object.entries(levelRaw).map(([name, count]) => ({ name, count }))
    if (arr.length) topLevel = arr.reduce((a, b) => a.count > b.count ? a : b).name
  }

  // Ostatnie 5 ofert
  const recentOffers = allOffers
    ? [...allOffers]
        .sort((a, b) => new Date(b.fetchedAt) - new Date(a.fetchedAt))
        .slice(0, 5)
    : []

  // Godzina powitania
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Dzień dobry' : hour < 18 ? 'Cześć' : 'Dobry wieczór'

  return (
    <div className="dashboard animate-fade-in">

      {/* ── Powitanie ── */}
      <div className="db-hero">
        <div>
          <h1 className="db-hero-title">
            {greeting}, <span className="db-hero-name">{user?.username ?? 'użytkowniku'}</span> 👋
          </h1>
          <p className="db-hero-sub">
            Masz <strong>{pendingCount}</strong> ofert czekających na aplikację.
          </p>
        </div>
        <button className="db-hero-btn" onClick={() => navigate('/offers')}>
          Przeglądaj oferty →
        </button>
      </div>

      {/* ── Statystyki ── */}
      <div className="db-stats">
        <StatCard
          icon="◉" label="Wszystkich ofert"
          value={totalOffers} loading={loadingT}
          accent="var(--accent)"
        />
        <StatCard
          icon="✓" label="Zaaplikowano"
          value={appliedCount} loading={loadingA}
          accent="var(--green)"
          sub={applyRate > 0 ? `${applyRate}% wskaźnik` : null}
        />
        <StatCard
          icon="◎" label="Oczekuje"
          value={pendingCount} loading={loadingNA}
          accent="var(--yellow)"
        />
        <StatCard
          icon="⊕" label="Dominujący poziom"
          value={topLevel} loading={loadingL}
          accent="var(--cyan)"
        />
      </div>

      {/* ── Główna siatka ── */}
      <div className="db-grid">

        {/* Ostatnie oferty */}
        <section className="db-card">
          <div className="db-card-head">
            <h2 className="db-card-title">◷ Ostatnio dodane</h2>
            <button className="db-card-link" onClick={() => navigate('/offers')}>
              Zobacz wszystkie →
            </button>
          </div>
          <div className="db-card-body">
            {loadingO && Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="db-skel db-skel--row" style={{ animationDelay: `${i * 40}ms` }} />
            ))}
            {!loadingO && recentOffers.length === 0 && (
              <p className="db-empty">Brak ofert — uruchom import w sekcji Import.</p>
            )}
            {!loadingO && recentOffers.map(offer => (
              <MiniOfferCard
                key={offer.id}
                offer={offer}
                onClick={() => navigate(`/offers/${offer.id}`)}
              />
            ))}
          </div>
        </section>

        {/* Szybkie akcje */}
        <section className="db-card">
          <div className="db-card-head">
            <h2 className="db-card-title">⊕ Szybkie akcje</h2>
          </div>
          <div className="db-card-body db-card-body--actions">
            <QuickAction
              icon="◉" label="Moje oferty"
              desc={pendingCount > 0 ? `${pendingCount} ofert do aplikacji` : 'Zarządzaj aplikacjami'}
              to="/my-offers" accent="var(--accent)"
              navigate={navigate}
            />
            <QuickAction
              icon="◈" label="Import"
              desc="Pobierz nowe oferty"
              to="/import" accent="var(--cyan)"
              navigate={navigate}
            />
            <QuickAction
              icon="◷" label="Notatki"
              desc="Historia aplikacji"
              to="/notes" accent="var(--green)"
              navigate={navigate}
            />
            <QuickAction
              icon="▦" label="Statystyki"
              desc="Wykresy i rozkłady"
              to="/stats" accent="var(--yellow)"
              navigate={navigate}
            />
          </div>

          {/* Pasek postępu */}
          <div className="db-progress-wrap">
            <div className="db-progress-head">
              <span className="db-progress-label">Wskaźnik aplikacji</span>
              <span className="db-progress-pct">{applyRate}%</span>
            </div>
            <div className="db-progress-track">
              <div
                className="db-progress-fill"
                style={{ width: `${applyRate}%` }}
              />
            </div>
            <p className="db-progress-sub">
              {appliedCount} zaaplikowane z {appliedCount + pendingCount} dostępnych
            </p>
          </div>
        </section>
      </div>

      <DashboardStyles />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Style
// ─────────────────────────────────────────────────────────────────
function DashboardStyles() {
  return (
    <style>{`
      .dashboard { max-width: 1080px; }

      /* ── Hero ── */
      .db-hero {
        display: flex; align-items: center;
        justify-content: space-between; flex-wrap: wrap; gap: 16px;
        background: var(--bg-1); border: 1px solid var(--border-0);
        border-radius: var(--radius-lg); padding: 24px 28px;
        margin-bottom: 20px;
        background-image: radial-gradient(ellipse at top right,
          rgba(245,166,35,0.08) 0%, transparent 60%);
      }
      .db-hero-title {
        font-family: var(--font-display); font-size: 1.5rem;
        font-weight: 800; color: var(--text-0); margin-bottom: 6px;
      }
      .db-hero-name { color: var(--accent); }
      .db-hero-sub  {
        font-size: 0.82rem; color: var(--text-2);
      }
      .db-hero-sub strong { color: var(--text-0); }
      .db-hero-btn {
        padding: 10px 20px; background: var(--accent); color: #000;
        border: none; border-radius: var(--radius-md);
        font-family: var(--font-mono); font-size: 0.8rem; font-weight: 700;
        cursor: pointer; white-space: nowrap;
        transition: background .15s, box-shadow .15s;
      }
      .db-hero-btn:hover { background: var(--accent-dim); box-shadow: var(--shadow-accent); }

      /* ── Statystyki ── */
      .db-stats {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 10px; margin-bottom: 20px;
      }
      .db-stat {
        display: flex; align-items: center; gap: 14px;
        background: var(--bg-1); border: 1px solid var(--border-1);
        border-left: 3px solid var(--border-1);
        border-radius: var(--radius-lg); padding: 16px 18px;
        transition: border-color .15s, transform .15s;
      }
      .db-stat:hover { transform: translateY(-2px); }
      .db-stat-icon { font-size: 1.3rem; flex-shrink: 0; }
      .db-stat-body { display: flex; flex-direction: column; gap: 2px; }
      .db-stat-val  {
        font-family: var(--font-display); font-size: 1.6rem;
        font-weight: 800; color: var(--text-0); line-height: 1;
      }
      .db-stat-label {
        font-family: var(--font-mono); font-size: 0.64rem;
        color: var(--text-2); text-transform: uppercase; letter-spacing: .07em;
      }
      .db-stat-sub {
        font-family: var(--font-mono); font-size: 0.62rem; color: var(--text-3);
      }

      /* ── Siatka główna ── */
      .db-grid {
        display: grid;
        grid-template-columns: 1fr 340px;
        gap: 16px;
      }
      @media (max-width: 780px) {
        .db-grid { grid-template-columns: 1fr; }
      }

      /* ── Karta ── */
      .db-card {
        background: var(--bg-1); border: 1px solid var(--border-1);
        border-radius: var(--radius-lg); overflow: hidden;
        display: flex; flex-direction: column;
      }
      .db-card-head {
        display: flex; justify-content: space-between; align-items: center;
        padding: 14px 18px; border-bottom: 1px solid var(--border-1);
        background: var(--bg-2);
      }
      .db-card-title {
        font-family: var(--font-display); font-weight: 700;
        font-size: 0.88rem; color: var(--text-0);
      }
      .db-card-link {
        background: none; border: none; color: var(--accent);
        font-family: var(--font-mono); font-size: 0.7rem;
        cursor: pointer; padding: 0; transition: opacity .15s;
      }
      .db-card-link:hover { opacity: .75; }
      .db-card-body { padding: 8px 0; flex: 1; }
      .db-card-body--actions { padding: 8px; display: flex; flex-direction: column; gap: 4px; }

      /* ── Mini oferta ── */
      .db-offer {
        display: flex; align-items: center; gap: 12px;
        width: 100%; padding: 10px 18px;
        background: none; border: none; text-align: left;
        cursor: pointer; transition: background .12s;
      }
      .db-offer:hover { background: var(--bg-2); }
      .db-offer-dot {
        width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
      }
      .db-offer-body { flex: 1; min-width: 0; }
      .db-offer-title {
        font-size: 0.82rem; color: var(--text-0); font-weight: 500;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .db-offer-meta {
        font-family: var(--font-mono); font-size: 0.67rem;
        color: var(--text-3); margin-top: 1px;
      }
      .db-offer-date {
        font-family: var(--font-mono); font-size: 0.64rem;
        color: var(--text-3); white-space: nowrap; flex-shrink: 0;
      }

      /* ── Szybka akcja ── */
      .db-action {
        display: flex; align-items: center; gap: 12px;
        background: var(--bg-2); border: 1px solid var(--border-1);
        border-radius: var(--radius-md); padding: 12px 14px;
        cursor: pointer; text-align: left; width: 100%;
        transition: border-color .15s, background .15s;
      }
      .db-action:hover { border-color: var(--border-0); background: var(--bg-3); }
      .db-action-icon { font-size: 1.1rem; flex-shrink: 0; }
      .db-action-body { flex: 1; }
      .db-action-label {
        font-family: var(--font-display); font-weight: 700;
        font-size: 0.82rem; color: var(--text-0); display: block;
      }
      .db-action-desc {
        font-size: 0.7rem; color: var(--text-3);
      }
      .db-action-arrow { color: var(--text-3); font-size: 0.8rem; }

      /* ── Pasek postępu ── */
      .db-progress-wrap {
        margin: 8px 14px 14px; padding: 14px;
        background: var(--bg-2); border: 1px solid var(--border-1);
        border-radius: var(--radius-md);
      }
      .db-progress-head {
        display: flex; justify-content: space-between;
        margin-bottom: 8px;
      }
      .db-progress-label {
        font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-2);
      }
      .db-progress-pct {
        font-family: var(--font-mono); font-size: 0.7rem;
        font-weight: 700; color: var(--accent);
      }
      .db-progress-track {
        height: 6px; background: var(--bg-3);
        border-radius: 3px; overflow: hidden;
      }
      .db-progress-fill {
        height: 100%; border-radius: 3px;
        background: linear-gradient(90deg, var(--accent-dim), var(--accent));
        transition: width .6s ease;
      }
      .db-progress-sub {
        font-family: var(--font-mono); font-size: 0.65rem;
        color: var(--text-3); margin-top: 6px;
      }

      /* ── Empty / Skeleton ── */
      .db-empty {
        font-size: 0.78rem; color: var(--text-3); padding: 24px 18px;
        text-align: center;
      }
      .db-skel {
        background: linear-gradient(90deg, var(--bg-2) 25%, var(--bg-3) 50%, var(--bg-2) 75%);
        background-size: 200% 100%; border-radius: var(--radius-sm);
        animation: shimmer 1.5s ease infinite;
      }
      .db-skel--val { height: 28px; width: 56px; }
      .db-skel--row { height: 44px; margin: 4px 18px; }
    `}</style>
  )
}