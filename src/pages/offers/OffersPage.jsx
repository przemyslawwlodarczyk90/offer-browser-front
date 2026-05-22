import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { offersApi, adminApi } from '@/api/services'
import { useApi, useDebounce, useTitle } from '@/hooks'
import { useAuthStore, toast } from '@/store'
import { Badge, EmptyState, PageHeader, ConfirmModal } from '@/components/ui'
import { formatDate, normalizeLevel, truncate, sortByDate, formatSalary } from '@/utils'

const SORT_OPTS = [
  { value: 'newest', label: '↓ Najnowsze' },
  { value: 'oldest', label: '↑ Najstarsze' },
]

const LEVELS = ['Wszystkie', 'Trainee', 'Junior', 'Mid', 'Senior', 'Expert']
const STATUS_OPTS = ['Wszystkie', 'Duplikaty', 'Nieprzydatne', 'Normalne']
const DATE_KEYS = ['createdAt', 'fetchedAt', 'updatedAt']

function getDate(offer) {
  for (const k of DATE_KEYS) if (offer[k]) return offer[k]
  return null
}

// ─────────────────────────────────────────────────────────────────
export default function OffersPage() {
  useTitle('Oferty pracy')
  const navigate = useNavigate()
  const user    = useAuthStore(s => s.user)
  const isAdmin = user?.role === 'ADMIN'

  const { data: raw, loading, error, execute: reload } =
    useApi(offersApi.getAll, { immediate: true })

  const { data: uselessIdsRaw } = useApi(
    adminApi.getUselessOfferIds,
    { immediate: isAdmin }
  )
  const uselessSet = useMemo(() => new Set(uselessIdsRaw ?? []), [uselessIdsRaw])

  const [search,   setSearch]   = useState('')
  const [sort,     setSort]     = useState('newest')
  const [level,    setLevel]    = useState('Wszystkie')
  const [status,   setStatus]   = useState('Wszystkie')
  const [selected, setSelected] = useState(new Set())
  const [confirm,  setConfirm]  = useState(null)
  const [deleting, setDeleting] = useState(false)
  const q = useDebounce(search, 280)

  const dupCount = useMemo(() =>
    (raw ?? []).filter(o => o.isDuplicate ?? o.duplicate).length,
  [raw])

  const uselessCount = uselessSet.size

  const offers = useMemo(() => {
    let list = raw ?? []
    if (level !== 'Wszystkie')
      list = list.filter(o => normalizeLevel(o.level) === level)
    if (isAdmin && status === 'Duplikaty')
      list = list.filter(o => o.isDuplicate ?? o.duplicate)
    if (isAdmin && status === 'Nieprzydatne')
      list = list.filter(o => uselessSet.has(o.id))
    if (isAdmin && status === 'Normalne')
      list = list.filter(o => !(o.isDuplicate ?? o.duplicate) && !uselessSet.has(o.id))
    if (q.trim()) {
      const lq = q.toLowerCase()
      list = list.filter(o =>
        o.title?.toLowerCase().includes(lq) ||
        (o.companyName ?? o.company)?.toLowerCase().includes(lq) ||
        o.city?.toLowerCase().includes(lq)
      )
    }
    const dateKey = DATE_KEYS.find(k => list.some(o => o[k])) ?? 'createdAt'
    return sortByDate(list, dateKey, sort === 'newest' ? 'desc' : 'asc')
  }, [raw, level, q, sort, isAdmin, status, uselessSet])

  const goToDetail = useCallback((id) => navigate(`/offers/${id}`), [navigate])

  const toggleSelect = useCallback((id, e) => {
    e.stopPropagation()
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const selectAll = () => setSelected(new Set(offers.map(o => o.id)))
  const clearAll  = () => setSelected(new Set())

  const handleBulkDelete = () => {
    const count = selected.size
    setConfirm({
      title: `Usuń ${count} ofert${count === 1 ? 'ę' : count < 5 ? 'y' : ''}?`,
      description: 'Operacja nieodwracalna — oferty znikną z bazy danych na stałe.',
      onConfirm: async () => {
        setDeleting(true)
        let ok = 0, fail = 0
        for (const id of selected) {
          try { await offersApi.delete(id); ok++ }
          catch { fail++ }
        }
        setDeleting(false)
        setSelected(new Set())
        reload()
        if (fail === 0) toast.success(`Usunięto ${ok} ofert`)
        else toast.warn(`Usunięto ${ok}, błąd przy ${fail}`)
      },
    })
  }

  const isFiltered = q.trim() !== '' || level !== 'Wszystkie' || (isAdmin && status !== 'Wszystkie')

  return (
    <div className="offers-page">
      <PageHeader
        title="Oferty pracy"
        subtitle={
          raw
            ? `${raw.length} ofert w bazie${isAdmin && dupCount > 0 ? ` · ${dupCount} duplikat${dupCount === 1 ? '' : 'ów'}` : ''}${isAdmin && uselessCount > 0 ? ` · ${uselessCount} nieprzydatnych` : ''}`
            : ''
        }
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

      {/* ── Status filter (admin only) ── */}
      {isAdmin && (
        <div className="of-levels of-status-row">
          {STATUS_OPTS.map(s => {
            const isDupPill      = s === 'Duplikaty'
            const isUselessPill  = s === 'Nieprzydatne'
            const isFlagged      = isDupPill || isUselessPill
            const count          = isDupPill ? dupCount : isUselessPill ? uselessCount : 0
            return (
              <button
                key={s}
                className={`of-pill${status === s ? ' of-pill--on' : ''}${isFlagged && status !== s ? ' of-pill--dup-idle' : ''}`}
                onClick={() => setStatus(s)}
              >
                {isFlagged ? `⚑ ${s}` : s}
                {isFlagged && count > 0 && (
                  <span className="of-pill-badge">{count}</span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* ── Licznik + admin bulk actions ── */}
      {!loading && !error && raw && (
        <div className="of-count-row">
          <p className="of-count">
            <strong>{offers.length}</strong>
            {isFiltered ? ` z ${raw.length}` : ''} ofert
          </p>
          {isAdmin && (
            <div className="of-bulk-bar">
              {selected.size > 0 ? (
                <>
                  <span className="of-sel-label">{selected.size} zaznaczonych</span>
                  <button className="of-bulk-btn" onClick={clearAll}>Odznacz</button>
                  <button
                    className="of-bulk-btn of-bulk-btn--danger"
                    onClick={handleBulkDelete}
                    disabled={deleting}
                  >
                    {deleting ? '…' : `⊗ Usuń (${selected.size})`}
                  </button>
                </>
              ) : (
                <button
                  className="of-bulk-btn"
                  onClick={selectAll}
                  disabled={offers.length === 0}
                >
                  Zaznacz wszystkie
                </button>
              )}
            </div>
          )}
        </div>
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
                onClick={() => { setSearch(''); setLevel('Wszystkie'); setStatus('Wszystkie') }}>
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
              isAdmin={isAdmin}
              isUseless={isAdmin && uselessSet.has(offer.id)}
              selected={selected.has(offer.id)}
              onSelect={e => toggleSelect(offer.id, e)}
              onClick={() => goToDetail(offer.id)}
              style={{ animationDelay: `${Math.min(i * 28, 400)}ms` }}
            />
          ))}
        </div>
      )}

      {confirm && (
        <ConfirmModal
          title={confirm.title}
          description={confirm.description}
          onConfirm={confirm.onConfirm}
          onClose={() => setConfirm(null)}
        />
      )}

      <OffersStyles />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Karta oferty
// ─────────────────────────────────────────────────────────────────
function OfferCard({ offer, isAdmin, isUseless, selected, onSelect, onClick, style }) {
  const level   = normalizeLevel(offer.level)
  const salary  = formatSalary(offer.salaryRange ?? offer.salary)
  const date    = getDate(offer)
  const isDup   = offer.isDuplicate ?? offer.duplicate ?? false
  const company = offer.companyName ?? offer.company ?? '—'

  let cardClass = 'of-card animate-fade-in'
  if (isAdmin && isDup)     cardClass += ' of-card--admin-dup'
  else if (isAdmin && isUseless) cardClass += ' of-card--admin-useless'
  else if (isDup)           cardClass += ' of-card--dup'
  if (selected)             cardClass += ' of-card--selected'

  return (
    <article
      className={cardClass}
      onClick={onClick}
      style={style}
      tabIndex={0}
      role="button"
      onKeyDown={e => e.key === 'Enter' && onClick()}
    >
      {isAdmin && (
        <span
          className={`of-check${selected ? ' of-check--on' : ''}`}
          onClick={onSelect}
          role="checkbox"
          aria-checked={selected}
          tabIndex={0}
          onKeyDown={e => e.key === ' ' && onSelect(e)}
        >
          {selected ? '▣' : '□'}
        </span>
      )}

      <div className="of-card-top">
        <Badge level={level} />
        <div style={{ display: 'flex', gap: 4 }}>
          {isDup     && <span className="of-dup">DUPLIKAT</span>}
          {isUseless && <span className="of-dup of-dup--useless">NIEPRZYDATNA</span>}
        </div>
      </div>

      <h3 className="of-card-title">{truncate(offer.title, 72)}</h3>

      <p className="of-card-company">
        <span aria-hidden="true" style={{ color: 'var(--text-3)', fontSize: '.72rem' }}>◉</span>
        {company}
      </p>

      <div className="of-chips">
        {offer.city && <span className="of-chip">◎ {offer.city}</span>}
        {salary     && <span className="of-chip of-chip--salary">₿ {salary}</span>}
      </div>

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
      .of-levels { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 10px; }
      .of-status-row { margin-bottom: 16px; }
      .of-pill {
        display: inline-flex; align-items: center; gap: 5px;
        padding: 4px 13px; border-radius: 100px;
        border: 1px solid var(--border-1); background: var(--bg-2);
        color: var(--text-2); font-family: var(--font-mono); font-size: 0.7rem;
        cursor: pointer; transition: border-color .15s, color .15s, background .15s;
        white-space: nowrap;
      }
      .of-pill:hover { border-color: var(--accent); color: var(--accent); }
      .of-pill--on   { background: var(--accent); color: #000; border-color: var(--accent); font-weight: 700; }
      .of-pill--dup-idle { color: var(--red); border-color: rgba(239,68,68,.3); }
      .of-pill--dup-idle:hover { border-color: var(--red); background: rgba(239,68,68,.07); }
      .of-pill-badge {
        font-size: 0.6rem; font-weight: 700;
        background: rgba(239,68,68,.2); color: var(--red);
        border-radius: 100px; padding: 1px 5px;
        min-width: 16px; text-align: center;
      }
      .of-pill--on .of-pill-badge { background: rgba(0,0,0,.2); color: #000; }

      /* Licznik + bulk bar */
      .of-count-row {
        display: flex; align-items: center; justify-content: space-between;
        gap: 8px; margin-bottom: 14px; flex-wrap: wrap;
      }
      .of-count { font-size: 0.73rem; color: var(--text-2); }
      .of-count strong { color: var(--text-0); }
      .of-bulk-bar { display: flex; align-items: center; gap: 8px; }
      .of-sel-label {
        font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-2);
      }
      .of-bulk-btn {
        padding: 5px 12px; border-radius: var(--radius-md); border: 1px solid var(--border-1);
        background: var(--bg-2); color: var(--text-1);
        font-family: var(--font-mono); font-size: 0.72rem; cursor: pointer;
        transition: background .15s, border-color .15s, color .15s;
      }
      .of-bulk-btn:hover:not(:disabled) { background: var(--bg-3); color: var(--text-0); }
      .of-bulk-btn:disabled { opacity: .45; cursor: not-allowed; }
      .of-bulk-btn--danger {
        color: var(--red); border-color: rgba(239,68,68,.35);
        background: rgba(239,68,68,.05);
      }
      .of-bulk-btn--danger:hover:not(:disabled) {
        background: rgba(239,68,68,.12); border-color: var(--red);
      }

      /* Siatka */
      .of-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(288px, 1fr));
        gap: 12px;
      }

      /* Karta */
      .of-card {
        position: relative;
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
      .of-card--admin-dup {
        border-color: rgba(239,68,68,.5);
        background: rgba(239,68,68,.04);
        box-shadow: 0 0 0 1px rgba(239,68,68,.15);
      }
      .of-card--admin-dup:hover,
      .of-card--admin-dup:focus-visible {
        border-color: var(--red);
        box-shadow: 0 4px 16px rgba(239,68,68,.25);
        transform: translateY(-2px);
      }
      .of-card--admin-useless {
        border-color: rgba(245,158,11,.5);
        background: rgba(245,158,11,.04);
        box-shadow: 0 0 0 1px rgba(245,158,11,.15);
      }
      .of-card--admin-useless:hover,
      .of-card--admin-useless:focus-visible {
        border-color: #f59e0b;
        box-shadow: 0 4px 16px rgba(245,158,11,.25);
        transform: translateY(-2px);
      }
      .of-dup--useless {
        color: #f59e0b;
        border-color: rgba(245,158,11,.4);
      }
      .of-card--selected {
        border-color: var(--accent) !important;
        box-shadow: 0 0 0 2px var(--accent-glow) !important;
      }

      /* Checkbox */
      .of-check {
        position: absolute; top: 10px; right: 10px;
        font-size: 0.9rem; color: var(--text-3);
        cursor: pointer; z-index: 2; line-height: 1;
        transition: color .15s;
        user-select: none;
      }
      .of-check:hover { color: var(--accent); }
      .of-check--on   { color: var(--accent); }

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
