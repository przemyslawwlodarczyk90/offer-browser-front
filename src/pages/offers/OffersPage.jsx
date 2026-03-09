import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { offersApi } from '@/api/services'
import { useApi, useDebounce, useTitle } from '@/hooks'
import { Badge, EmptyState, PageHeader } from '@/components/ui'
import { formatDate, normalizeLevel, truncate, sortByDate, formatSalary } from '@/utils'

const SORT_OPTS = [
  { value: 'newest', label: '↓ Najnowsze' },
  { value: 'oldest', label: '↑ Najstarsze' },
]

const LEVELS = ['Wszystkie', 'Trainee', 'Junior', 'Mid', 'Senior', 'Expert']

// Backend może zwracać różne pola daty — sprawdzamy po kolei
const DATE_KEYS = ['createdAt', 'fetchedAt', 'updatedAt']

function getDate(offer) {
  for (const k of DATE_KEYS) if (offer[k]) return offer[k]
  return null
}

// ─────────────────────────────────────────────────────────────────
export default function OffersPage() {
  useTitle('Oferty pracy')
  const navigate = useNavigate()

  const { data: raw, loading, error, execute: reload } =
    useApi(offersApi.getAll, { immediate: true })

  const [search, setSearch] = useState('')
  const [sort,   setSort]   = useState('newest')
  const [level,  setLevel]  = useState('Wszystkie')
  const q = useDebounce(search, 280)

  const offers = useMemo(() => {
    let list = raw ?? []
    if (level !== 'Wszystkie')
      list = list.filter(o => normalizeLevel(o.level) === level)
    if (q.trim()) {
      const lq = q.toLowerCase()
      list = list.filter(o =>
        o.title?.toLowerCase().includes(lq) ||
        o.companyName?.toLowerCase().includes(lq) ||
        o.city?.toLowerCase().includes(lq)
      )
    }
    // Wybierz klucz daty który faktycznie istnieje w danych
    const dateKey = DATE_KEYS.find(k => list.some(o => o[k])) ?? 'createdAt'
    return sortByDate(list, dateKey, sort === 'newest' ? 'desc' : 'asc')
  }, [raw, level, q, sort])

  const goToDetail = useCallback((id) => navigate(`/offers/${id}`), [navigate])

  const isFiltered = q.trim() !== '' || level !== 'Wszystkie'

  return (
    <div className="offers-page">
      <PageHeader
        title="Oferty pracy"
        subtitle={raw ? `${raw.length} ofert w bazie` : ''}
        actions={
          <button className="btn btn--secondary btn--sm" onClick={reload} disabled={loading}>
            ↻ Odśwież
          </button>
        }
      />

      {/* ── Toolbar ── */}
      <div className="of-toolbar">
        <div className="of-search-wrap">
          <span className="of-search-ico" aria-hidden="true">⊘</span>
          <input
            className="of-search"
            type="search"
            placeholder="Szukaj po tytule, firmie, mieście…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="of-clear" onClick={() => setSearch('')} aria-label="Wyczyść">✕</button>
          )}
        </div>
        <select className="of-select" value={sort} onChange={e => setSort(e.target.value)}>
          {SORT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* ── Level pills ── */}
      <div className="of-levels">
        {LEVELS.map(l => (
          <button
            key={l}
            className={`of-pill${level === l ? ' of-pill--on' : ''}`}
            onClick={() => setLevel(l)}
          >
            {l}
          </button>
        ))}
      </div>

      {/* ── Licznik ── */}
      {!loading && !error && raw && (
        <p className="of-count">
          <strong>{offers.length}</strong>
          {isFiltered ? ` z ${raw.length}` : ''} ofert
        </p>
      )}

      {/* ── Skeleton ── */}
      {loading && (
        <div className="of-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="of-skel" style={{ animationDelay: `${i * 35}ms` }} />
          ))}
        </div>
      )}

      {/* ── Błąd ── */}
      {!loading && error && (
        <EmptyState
          icon="✕"
          title="Błąd ładowania ofert"
          description={error.message ?? 'Nie udało się połączyć z serwerem.'}
          action={<button className="btn btn--primary btn--sm" onClick={reload}>Spróbuj ponownie</button>}
        />
      )}

      {/* ── Pusta lista ── */}
      {!loading && !error && offers.length === 0 && (
        <EmptyState
          icon="⊘"
          title="Brak ofert"
          description={isFiltered
            ? 'Żadna oferta nie pasuje do wybranych kryteriów.'
            : 'Baza jest pusta — zaimportuj dane przez moduł Import.'}
          action={isFiltered
            ? <button className="btn btn--ghost btn--sm"
                onClick={() => { setSearch(''); setLevel('Wszystkie') }}>
                Wyczyść filtry
              </button>
            : null
          }
        />
      )}

      {/* ── Siatka kart ── */}
      {!loading && !error && offers.length > 0 && (
        <div className="of-grid">
          {offers.map((offer, i) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              onClick={() => goToDetail(offer.id)}
              style={{ animationDelay: `${Math.min(i * 28, 400)}ms` }}
            />
          ))}
        </div>
      )}

      <OffersStyles />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Karta oferty
// ─────────────────────────────────────────────────────────────────
function OfferCard({ offer, onClick, style }) {
  const level  = normalizeLevel(offer.level)
  const salary = formatSalary(offer.salary)
  const date   = getDate(offer)

  return (
    <article
      className={`of-card animate-fade-in${offer.duplicate ? ' of-card--dup' : ''}`}
      onClick={onClick}
      style={style}
      tabIndex={0}
      role="button"
      onKeyDown={e => e.key === 'Enter' && onClick()}
    >
      {/* badge + duplikat */}
      <div className="of-card-top">
        <Badge level={level} />
        {offer.duplicate && <span className="of-dup">DUPLIKAT</span>}
      </div>

      {/* tytuł */}
      <h3 className="of-card-title">{truncate(offer.title, 72)}</h3>

      {/* firma */}
      <p className="of-card-company">
        <span aria-hidden="true" style={{ color: 'var(--text-3)', fontSize: '.72rem' }}>◉</span>
        {offer.companyName ?? '—'}
      </p>

      {/* lokalizacja + wynagrodzenie */}
      <div className="of-chips">
        {offer.city && (
          <span className="of-chip">◎ {offer.city}</span>
        )}
        {salary && (
          <span className="of-chip of-chip--salary">₿ {salary}</span>
        )}
      </div>

      {/* stopka */}
      <div className="of-card-foot">
        <time className="of-card-date">{formatDate(date)}</time>
        <span className="of-card-arrow" aria-hidden="true">→</span>
      </div>
    </article>
  )
}

// ─────────────────────────────────────────────────────────────────
// Style
// ─────────────────────────────────────────────────────────────────
function OffersStyles() {
  return (
    <style>{`
      .offers-page { max-width: 1080px; }

      /* Toolbar */
      .of-toolbar {
        display: flex; gap: 8px; align-items: center;
        margin-bottom: 10px; flex-wrap: wrap;
      }
      .of-search-wrap { position: relative; flex: 1; min-width: 200px; }
      .of-search-ico  {
        position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
        color: var(--text-3); font-size: 0.82rem; pointer-events: none;
      }
      .of-search {
        width: 100%; padding: 8px 34px 8px 32px;
        background: var(--bg-2); border: 1px solid var(--border-1);
        border-radius: var(--radius-md); font-family: var(--font-mono);
        font-size: 0.81rem; color: var(--text-0); outline: none;
        transition: border-color .15s, box-shadow .15s;
      }
      .of-search::placeholder { color: var(--text-3); }
      .of-search::-webkit-search-cancel-button { display: none; }
      .of-search:focus { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-glow); }
      .of-clear {
        position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
        background: none; border: none; color: var(--text-3); cursor: pointer;
        font-size: 0.68rem; padding: 2px; transition: color .15s;
      }
      .of-clear:hover { color: var(--text-0); }
      .of-select {
        background: var(--bg-2); border: 1px solid var(--border-1);
        border-radius: var(--radius-md); padding: 8px 12px;
        font-family: var(--font-mono); font-size: 0.78rem; color: var(--text-1);
        outline: none; cursor: pointer; flex-shrink: 0;
        transition: border-color .15s;
      }
      .of-select:focus { border-color: var(--accent); }

      /* Level pills */
      .of-levels { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 16px; }
      .of-pill {
        padding: 4px 13px; border-radius: 100px;
        border: 1px solid var(--border-1); background: var(--bg-2);
        color: var(--text-2); font-family: var(--font-mono); font-size: 0.7rem;
        cursor: pointer; transition: border-color .15s, color .15s, background .15s;
        white-space: nowrap;
      }
      .of-pill:hover { border-color: var(--accent); color: var(--accent); }
      .of-pill--on   { background: var(--accent); color: #000; border-color: var(--accent); font-weight: 700; }

      /* Licznik */
      .of-count { font-size: 0.73rem; color: var(--text-2); margin-bottom: 14px; }
      .of-count strong { color: var(--text-0); }

      /* Siatka */
      .of-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(288px, 1fr));
        gap: 12px;
      }

      /* Karta */
      .of-card {
        display: flex; flex-direction: column; gap: 7px;
        background: var(--bg-1); border: 1px solid var(--border-1);
        border-radius: var(--radius-lg); padding: 1.05rem 1.1rem;
        cursor: pointer; outline: none;
        transition: border-color .15s, transform .15s, box-shadow .15s;
      }
      .of-card:hover,
      .of-card:focus-visible {
        border-color: var(--accent);
        transform: translateY(-2px);
        box-shadow: var(--shadow-accent);
      }
      .of-card--dup { opacity: .5; }
      .of-card--dup:hover { opacity: .72; }

      .of-card-top {
        display: flex; align-items: center;
        justify-content: space-between; gap: 6px;
      }
      .of-dup {
        font-family: var(--font-mono); font-size: 0.58rem; font-weight: 700;
        letter-spacing: .09em; color: var(--red);
        border: 1px solid rgba(239,68,68,.35); padding: 2px 6px;
        border-radius: var(--radius-sm);
      }
      .of-card-title {
        font-family: var(--font-display); font-weight: 700;
        font-size: 0.89rem; color: var(--text-0); line-height: 1.35; margin: 0;
        display: -webkit-box; -webkit-line-clamp: 2;
        -webkit-box-orient: vertical; overflow: hidden;
      }
      .of-card-company {
        display: flex; align-items: center; gap: 5px;
        font-size: 0.77rem; color: var(--text-2); margin: 0;
      }
      .of-chips { display: flex; flex-wrap: wrap; gap: 5px; }
      .of-chip {
        display: flex; align-items: center; gap: 4px;
        font-family: var(--font-mono); font-size: 0.68rem; color: var(--text-2);
        background: var(--bg-2); border: 1px solid var(--border-1);
        padding: 3px 8px; border-radius: var(--radius-sm);
      }
      .of-chip--salary {
        color: var(--cyan); border-color: rgba(0,212,212,.2);
        background: rgba(0,212,212,.05);
      }
      .of-card-foot {
        display: flex; justify-content: space-between; align-items: center;
        margin-top: auto; padding-top: 8px; border-top: 1px solid var(--border-1);
      }
      .of-card-date  { font-family: var(--font-mono); font-size: 0.66rem; color: var(--text-3); }
      .of-card-arrow { font-size: 0.78rem; color: var(--text-3); transition: color .15s, transform .15s; }
      .of-card:hover  .of-card-arrow,
      .of-card:focus-visible .of-card-arrow { color: var(--accent); transform: translateX(4px); }

      /* Skeleton */
      .of-skel {
        height: 150px; border-radius: var(--radius-lg);
        background: linear-gradient(90deg, var(--bg-2) 25%, var(--bg-3) 50%, var(--bg-2) 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s ease infinite;
      }
    `}</style>
  )
}