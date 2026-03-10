// ╔══════════════════════════════════════════════╗
// ║  ŚCIEŻKA:  src/pages/StatsPage.jsx           ║
// ║  AKCJA:    NADPISZ istniejący plik (stub)    ║
// ╚══════════════════════════════════════════════╝

import { useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { statsApi } from '@/api/services'
import { useApi, useTitle } from '@/hooks'
import { PageHeader, EmptyState } from '@/components/ui'

// ─────────────────────────────────────────────────────────────────
// Kolory dla wykresów
// ─────────────────────────────────────────────────────────────────
const LEVEL_COLORS = {
  Trainee: '#64748b',
  Junior:  '#22c55e',
  Mid:     '#f5a623',
  Senior:  '#00d4d4',
  Expert:  '#a855f7',
}
const CITY_PALETTE = [
  '#f5a623', '#00d4d4', '#a855f7', '#22c55e',
  '#ef4444', '#eab308', '#3b82f6', '#ec4899',
  '#14b8a6', '#f97316',
]

// ─────────────────────────────────────────────────────────────────
// Helpers — normalizacja danych z backendu
// ─────────────────────────────────────────────────────────────────
function normalizeLevelData(raw) {
  if (!raw) return []
  // Backend może zwrócić: [{level, count}] lub {Junior: 12, Mid: 8, ...}
  if (Array.isArray(raw)) {
    return raw.map(item => ({
      name:  item.level ?? item.name ?? item.key ?? '—',
      value: item.count ?? item.value ?? 0,
    }))
  }
  return Object.entries(raw).map(([name, value]) => ({ name, value }))
}

function normalizeCityData(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) {
    return raw
      .map(item => ({
        name:  item.city ?? item.name ?? item.key ?? '—',
        value: item.count ?? item.value ?? 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12) // max 12 miast
  }
  return Object.entries(raw)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 12)
}

function extractTotal(raw) {
  if (raw == null) return null
  if (typeof raw === 'number') return raw
  return raw.total ?? raw.count ?? raw.totalOffers ?? null
}

// ─────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────
function ChartSkeleton({ height = 260 }) {
  return (
    <div
      className="st-skel"
      style={{ height }}
      aria-hidden="true"
    />
  )
}

// ─────────────────────────────────────────────────────────────────
// Tooltip customowy
// ─────────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="st-tooltip">
      <p className="st-tooltip-label">{label ?? payload[0]?.name}</p>
      <p className="st-tooltip-val">{payload[0]?.value} ofert</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Karta statystyczna (licznik)
// ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, loading, sub }) {
  return (
    <div className="st-stat-card">
      <span className="st-stat-icon">{icon}</span>
      <div className="st-stat-body">
        {loading
          ? <div className="st-skel st-skel--val" />
          : <span className="st-stat-val">{value ?? '—'}</span>
        }
        <span className="st-stat-label">{label}</span>
        {sub && <span className="st-stat-sub">{sub}</span>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Wykres: Rozkład według poziomu (BarChart)
// ─────────────────────────────────────────────────────────────────
function LevelChart({ data, loading, error }) {
  return (
    <div className="st-chart-card">
      <div className="st-chart-head">
        <h2 className="st-chart-title">Rozkład według poziomu</h2>
        <p className="st-chart-sub">Liczba ofert na każdym poziomie stanowiska</p>
      </div>

      {loading && <ChartSkeleton height={260} />}

      {!loading && error && (
        <EmptyState icon="✕" title="Błąd" description={error.message ?? 'Nie udało się załadować danych.'} />
      )}

      {!loading && !error && data.length === 0 && (
        <EmptyState icon="▦" title="Brak danych" description="Backend nie zwrócił rozkładu poziomów." />
      )}

      {!loading && !error && data.length > 0 && (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 8, right: 16, left: -8, bottom: 4 }}>
            <XAxis
              dataKey="name"
              tick={{ fill: '#70708a', fontFamily: 'JetBrains Mono', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#70708a', fontFamily: 'JetBrains Mono', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(245,166,35,0.07)' }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={56}>
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={LEVEL_COLORS[entry.name] ?? '#f5a623'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Legenda poziomów */}
      {!loading && !error && data.length > 0 && (
        <div className="st-legend">
          {data.map(entry => (
            <span key={entry.name} className="st-legend-item">
              <span
                className="st-legend-dot"
                style={{ background: LEVEL_COLORS[entry.name] ?? '#f5a623' }}
              />
              {entry.name}
              <span className="st-legend-count">{entry.value}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Wykres: Rozkład według miasta (PieChart + lista)
// ─────────────────────────────────────────────────────────────────
function CityChart({ data, loading, error }) {
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="st-chart-card">
      <div className="st-chart-head">
        <h2 className="st-chart-title">Rozkład według miasta</h2>
        <p className="st-chart-sub">Top {data.length > 0 ? Math.min(data.length, 12) : '—'} miast</p>
      </div>

      {loading && <ChartSkeleton height={260} />}

      {!loading && error && (
        <EmptyState icon="✕" title="Błąd" description={error.message ?? 'Nie udało się załadować danych.'} />
      )}

      {!loading && !error && data.length === 0 && (
        <EmptyState icon="◎" title="Brak danych" description="Backend nie zwrócił rozkładu miast." />
      )}

      {!loading && !error && data.length > 0 && (
        <div className="st-city-layout">
          {/* Pie */}
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
              >
                {data.map((entry, i) => (
                  <Cell key={entry.name} fill={CITY_PALETTE[i % CITY_PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Lista miast z paskami */}
          <div className="st-city-list">
            {data.map((entry, i) => {
              const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0
              const color = CITY_PALETTE[i % CITY_PALETTE.length]
              return (
                <div key={entry.name} className="st-city-row">
                  <div className="st-city-row-top">
                    <span className="st-city-name">
                      <span className="st-city-dot" style={{ background: color }} />
                      {entry.name}
                    </span>
                    <span className="st-city-nums">
                      <span className="st-city-count">{entry.value}</span>
                      <span className="st-city-pct">{pct}%</span>
                    </span>
                  </div>
                  <div className="st-city-bar-track">
                    <div
                      className="st-city-bar-fill"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Strona główna
// ─────────────────────────────────────────────────────────────────
export default function StatsPage() {
  useTitle('Statystyki')

  const {
    data: totalRaw, loading: loadingT, error: errorT,
  } = useApi(useCallback(() => statsApi.getTotalOffers(), []), { immediate: true })

  const {
    data: levelRaw, loading: loadingL, error: errorL,
  } = useApi(useCallback(() => statsApi.getLevelDistribution(), []), { immediate: true })

  const {
    data: cityRaw, loading: loadingC, error: errorC,
  } = useApi(useCallback(() => statsApi.getCityDistribution(), []), { immediate: true })

  const total     = extractTotal(totalRaw)
  const levelData = normalizeLevelData(levelRaw)
  const cityData  = normalizeCityData(cityRaw)

  // Pochodne statystyki z danych poziomów
  const topLevel = levelData.length > 0
    ? levelData.reduce((a, b) => a.value > b.value ? a : b)
    : null

  return (
    <div className="stats-page animate-fade-in">
      <PageHeader
        title="Statystyki"
        subtitle="Przegląd bazy ofert"
      />

      {/* ── Karty liczników ── */}
      <div className="st-stat-row">
        <StatCard
          icon="◉"
          label="Wszystkich ofert"
          value={total}
          loading={loadingT}
          sub={errorT ? 'błąd ładowania' : null}
        />
        <StatCard
          icon="▦"
          label="Poziomów"
          value={levelData.length > 0 ? levelData.length : null}
          loading={loadingL}
        />
        <StatCard
          icon="◎"
          label="Miast"
          value={cityData.length > 0 ? cityData.length : null}
          loading={loadingC}
        />
        <StatCard
          icon="⊕"
          label="Dominujący poziom"
          value={topLevel?.name ?? null}
          loading={loadingL}
          sub={topLevel ? `${topLevel.value} ofert` : null}
        />
      </div>

      {/* ── Wykresy ── */}
      <div className="st-charts-grid">
        <LevelChart data={levelData} loading={loadingL} error={errorL} />
        <CityChart  data={cityData}  loading={loadingC} error={errorC} />
      </div>

      <StatsStyles />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Style
// ─────────────────────────────────────────────────────────────────
function StatsStyles() {
  return (
    <style>{`
      .stats-page { max-width: 1080px; }

      /* ── Karty liczników ── */
      .st-stat-row {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 10px; margin-bottom: 20px;
      }
      .st-stat-card {
        display: flex; align-items: center; gap: 14px;
        background: var(--bg-1); border: 1px solid var(--border-1);
        border-radius: var(--radius-lg); padding: 16px 18px;
        transition: border-color .15s;
      }
      .st-stat-card:hover { border-color: var(--border-0); }
      .st-stat-icon { font-size: 1.3rem; color: var(--accent); flex-shrink: 0; }
      .st-stat-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
      .st-stat-val {
        font-family: var(--font-display); font-size: 1.6rem;
        font-weight: 800; color: var(--text-0); line-height: 1;
      }
      .st-stat-label {
        font-family: var(--font-mono); font-size: 0.64rem;
        color: var(--text-2); text-transform: uppercase; letter-spacing: .08em;
      }
      .st-stat-sub {
        font-family: var(--font-mono); font-size: 0.66rem; color: var(--text-3);
      }
      .st-skel--val {
        height: 28px; width: 64px; border-radius: var(--radius-sm);
      }

      /* ── Siatka wykresów ── */
      .st-charts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(440px, 1fr));
        gap: 16px;
      }

      /* ── Karta wykresu ── */
      .st-chart-card {
        background: var(--bg-1); border: 1px solid var(--border-1);
        border-radius: var(--radius-lg); padding: 20px;
        display: flex; flex-direction: column; gap: 16px;
      }
      .st-chart-head { display: flex; flex-direction: column; gap: 3px; }
      .st-chart-title {
        font-family: var(--font-display); font-weight: 700;
        font-size: 0.95rem; color: var(--text-0);
      }
      .st-chart-sub { font-size: 0.75rem; color: var(--text-2); }

      /* ── Tooltip ── */
      .st-tooltip {
        background: var(--bg-3); border: 1px solid var(--border-1);
        border-radius: var(--radius-md); padding: 8px 12px;
        font-family: var(--font-mono);
      }
      .st-tooltip-label { font-size: 0.72rem; color: var(--text-2); margin-bottom: 3px; }
      .st-tooltip-val   { font-size: 0.84rem; font-weight: 700; color: var(--accent); }

      /* ── Legenda poziomów ── */
      .st-legend {
        display: flex; flex-wrap: wrap; gap: 10px;
        padding-top: 4px; border-top: 1px solid var(--border-1);
      }
      .st-legend-item {
        display: flex; align-items: center; gap: 5px;
        font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-2);
      }
      .st-legend-dot {
        width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
      }
      .st-legend-count {
        font-weight: 700; color: var(--text-0); margin-left: 2px;
      }

      /* ── Miasta layout ── */
      .st-city-layout { display: flex; flex-direction: column; gap: 16px; }

      /* Lista miast */
      .st-city-list { display: flex; flex-direction: column; gap: 8px; }
      .st-city-row  { display: flex; flex-direction: column; gap: 4px; }
      .st-city-row-top {
        display: flex; justify-content: space-between; align-items: center; gap: 8px;
      }
      .st-city-name {
        display: flex; align-items: center; gap: 6px;
        font-family: var(--font-mono); font-size: 0.74rem; color: var(--text-1);
        min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      .st-city-dot {
        width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
      }
      .st-city-nums {
        display: flex; align-items: center; gap: 8px; flex-shrink: 0;
      }
      .st-city-count {
        font-family: var(--font-mono); font-size: 0.74rem;
        font-weight: 700; color: var(--text-0);
      }
      .st-city-pct {
        font-family: var(--font-mono); font-size: 0.68rem; color: var(--text-3);
        min-width: 32px; text-align: right;
      }
      .st-city-bar-track {
        height: 4px; background: var(--bg-3);
        border-radius: 2px; overflow: hidden;
      }
      .st-city-bar-fill {
        height: 100%; border-radius: 2px;
        transition: width .6s ease;
      }

      /* ── Skeleton ── */
      .st-skel {
        border-radius: var(--radius-md);
        background: linear-gradient(90deg, var(--bg-2) 25%, var(--bg-3) 50%, var(--bg-2) 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s ease infinite;
      }
    `}</style>
  )
}