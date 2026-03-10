// ╔══════════════════════════════════════════════╗
// ║  ŚCIEŻKA:  src/pages/NotesPage.jsx           ║
// ║  AKCJA:    NADPISZ istniejący plik (stub)    ║
// ╚══════════════════════════════════════════════╝

import { useState, useMemo, useCallback } from 'react'
import { notesApi } from '@/api/services'
import { useApi, useTitle, useDebounce } from '@/hooks'
import { useAuthStore, toast } from '@/store'
import { PageHeader, EmptyState } from '@/components/ui'
import { formatDate, formatDateTime, truncate } from '@/utils'

// ─────────────────────────────────────────────────────────────────
// Stałe
// ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'notes',     label: 'Notatki',       icon: '◷' },
  { id: 'companies', label: 'Firmy i daty',  icon: '◉' },
]

// ─────────────────────────────────────────────────────────────────
// Modal — Nowa notatka zewnętrzna
// ─────────────────────────────────────────────────────────────────
function NewNoteModal({ userId, onClose, onCreated }) {
  const [form,    setForm]    = useState({ companyName: '', offerUrl: '' })
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.companyName.trim()) e.companyName = 'Pole wymagane'
    return e
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (errors[name]) setErrors(er => ({ ...er, [name]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      await notesApi.createExternal(
        userId,
        form.companyName.trim(),
        form.offerUrl.trim() || undefined
      )
      toast.success(`Notatka dla "${form.companyName.trim()}" dodana`)
      onCreated()
      onClose()
    } catch (err) {
      toast.error(err?.message ?? 'Błąd tworzenia notatki')
    } finally {
      setLoading(false)
    }
  }

  // Zamknij na Escape
  const handleKeyDown = (e) => { if (e.key === 'Escape') onClose() }

  return (
    <div className="n-modal-backdrop" onClick={onClose} onKeyDown={handleKeyDown}>
      <div
        className="n-modal animate-fade-in"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Nowa notatka zewnętrzna"
      >
        {/* Nagłówek */}
        <div className="n-modal-head">
          <div>
            <h2 className="n-modal-title">Nowa notatka zewnętrzna</h2>
            <p className="n-modal-sub">Aplikacja spoza systemu (własne źródło)</p>
          </div>
          <button className="n-modal-close" onClick={onClose} aria-label="Zamknij">✕</button>
        </div>

        {/* Formularz */}
        <form onSubmit={handleSubmit} className="n-modal-body" noValidate>
          <div className="n-field">
            <label className="n-label" htmlFor="nm-company">
              Nazwa firmy <span className="n-required">*</span>
            </label>
            <input
              id="nm-company"
              name="companyName"
              className={`n-input${errors.companyName ? ' n-input--err' : ''}`}
              placeholder="np. Acme Corp"
              value={form.companyName}
              onChange={handleChange}
              autoFocus
              disabled={loading}
            />
            {errors.companyName && <span className="n-err">{errors.companyName}</span>}
          </div>

          <div className="n-field">
            <label className="n-label" htmlFor="nm-url">
              URL oferty <span className="n-optional">(opcjonalnie)</span>
            </label>
            <input
              id="nm-url"
              name="offerUrl"
              type="url"
              className="n-input"
              placeholder="https://example.com/job/123"
              value={form.offerUrl}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="n-modal-foot">
            <button type="button" className="btn-ghost" onClick={onClose} disabled={loading}>
              Anuluj
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading
                ? <><span className="n-spin" />Zapisywanie…</>
                : '✓ Dodaj notatkę'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Karta notatki
// ─────────────────────────────────────────────────────────────────
function NoteCard({ note, style }) {
  const [expanded, setExpanded] = useState(false)
  const hasContent = note.content?.trim()

  return (
    <article className="n-card animate-fade-in" style={style}>
      <div className="n-card-head">
        <div className="n-card-meta">
          <span className="n-card-company">
            <span className="n-card-dot">◉</span>
            {note.companyName ?? '—'}
          </span>
          {note.external && (
            <span className="n-badge n-badge--ext">zewnętrzna</span>
          )}
        </div>
        <time className="n-card-date">{formatDateTime(note.applicationDate ?? note.createdAt)}</time>
      </div>

      {note.offerTitle && (
        <p className="n-card-offer">{truncate(note.offerTitle, 80)}</p>
      )}

      {note.offerUrl && (
        <a
          href={note.offerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="n-card-link"
          onClick={e => e.stopPropagation()}
        >
          ↗ {truncate(note.offerUrl, 60)}
        </a>
      )}

      {hasContent && (
        <div className="n-card-content-wrap">
          <p className={`n-card-content${expanded ? '' : ' n-card-content--clamped'}`}>
            {note.content}
          </p>
          {note.content.length > 120 && (
            <button
              className="n-card-expand"
              onClick={() => setExpanded(v => !v)}
            >
              {expanded ? '▲ Zwiń' : '▼ Rozwiń'}
            </button>
          )}
        </div>
      )}
    </article>
  )
}

// ─────────────────────────────────────────────────────────────────
// Zakładka: Notatki
// ─────────────────────────────────────────────────────────────────
function NotesTab({ notes, loading, error, reload }) {
  const [search,  setSearch]  = useState('')
  const [company, setCompany] = useState('Wszystkie')
  const q = useDebounce(search, 250)

  const companies = useMemo(() => {
    if (!notes) return []
    const set = new Set(notes.map(n => n.companyName).filter(Boolean))
    return ['Wszystkie', ...Array.from(set).sort()]
  }, [notes])

  const filtered = useMemo(() => {
    let list = notes ?? []
    if (company !== 'Wszystkie')
      list = list.filter(n => n.companyName === company)
    if (q.trim()) {
      const lq = q.toLowerCase()
      list = list.filter(n =>
        n.companyName?.toLowerCase().includes(lq) ||
        n.offerTitle?.toLowerCase().includes(lq) ||
        n.content?.toLowerCase().includes(lq)
      )
    }
    return list
  }, [notes, company, q])

  const isFiltered = q.trim() !== '' || company !== 'Wszystkie'

  if (loading) return (
    <div className="n-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="n-skel" style={{ animationDelay: `${i * 40}ms` }} />
      ))}
    </div>
  )

  if (error) return (
    <EmptyState
      icon="✕"
      title="Błąd ładowania notatek"
      description={error.message ?? 'Nie udało się pobrać notatek.'}
      action={<button className="btn-primary btn-sm" onClick={reload}>Spróbuj ponownie</button>}
    />
  )

  return (
    <>
      {/* Toolbar */}
      <div className="n-toolbar">
        <div className="n-search-wrap">
          <span className="n-search-ico">⊘</span>
          <input
            className="n-search"
            type="search"
            placeholder="Szukaj po firmie, tytule, treści…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="n-search-clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>

        <select
          className="n-select"
          value={company}
          onChange={e => setCompany(e.target.value)}
        >
          {companies.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Licznik */}
      {notes && (
        <p className="n-count">
          <strong>{filtered.length}</strong>
          {isFiltered ? ` z ${notes.length}` : ''} notatek
        </p>
      )}

      {/* Pusta lista */}
      {filtered.length === 0 && (
        <EmptyState
          icon="◷"
          title="Brak notatek"
          description={
            isFiltered
              ? 'Żadna notatka nie pasuje do kryteriów.'
              : 'Nie masz jeszcze żadnych notatek aplikacyjnych.'
          }
          action={
            isFiltered
              ? <button className="btn-ghost btn-sm"
                  onClick={() => { setSearch(''); setCompany('Wszystkie') }}>
                  Wyczyść filtry
                </button>
              : null
          }
        />
      )}

      {/* Siatka */}
      {filtered.length > 0 && (
        <div className="n-grid">
          {filtered.map((note, i) => (
            <NoteCard
              key={note.id ?? i}
              note={note}
              style={{ animationDelay: `${Math.min(i * 30, 350)}ms` }}
            />
          ))}
        </div>
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────
// Zakładka: Firmy z datami
// ─────────────────────────────────────────────────────────────────
function CompaniesTab({ userId }) {
  const {
    data: companies,
    loading,
    error,
    execute: reload,
  } = useApi(
    useCallback(() => notesApi.getCompaniesWithDates(userId), [userId]),
    { immediate: !!userId }
  )

  if (loading) return (
    <div className="n-companies-grid">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="n-skel n-skel--company" style={{ animationDelay: `${i * 35}ms` }} />
      ))}
    </div>
  )

  if (error) return (
    <EmptyState
      icon="✕"
      title="Błąd ładowania"
      description={error.message ?? 'Nie udało się pobrać listy firm.'}
      action={<button className="btn-primary btn-sm" onClick={reload}>Spróbuj ponownie</button>}
    />
  )

  if (!companies?.length) return (
    <EmptyState
      icon="◉"
      title="Brak firm"
      description="Gdy zaczniesz aplikować, firmy pojawią się tutaj wraz z datami."
    />
  )

  // Posortuj wg najnowszej daty
  const sorted = [...companies].sort((a, b) => {
    const da = new Date(a.lastApplicationDate ?? a.applicationDate ?? 0)
    const db = new Date(b.lastApplicationDate ?? b.applicationDate ?? 0)
    return db - da
  })

  return (
    <>
      <p className="n-count"><strong>{sorted.length}</strong> firm</p>
      <div className="n-companies-grid">
        {sorted.map((company, i) => (
          <div
            key={company.companyName ?? i}
            className="n-company-card animate-fade-in"
            style={{ animationDelay: `${Math.min(i * 30, 350)}ms` }}
          >
            <div className="n-company-head">
              <span className="n-company-dot">◉</span>
              <span className="n-company-name">{company.companyName ?? '—'}</span>
            </div>

            {/* Daty aplikacji */}
            <div className="n-company-dates">
              {company.applicationDates?.length > 0
                ? company.applicationDates.map((d, j) => (
                    <span key={j} className="n-company-date-chip">
                      {formatDate(d)}
                    </span>
                  ))
                : (company.applicationDate || company.lastApplicationDate)
                    ? <span className="n-company-date-chip">
                        {formatDate(company.applicationDate ?? company.lastApplicationDate)}
                      </span>
                    : <span className="n-company-date-chip n-company-date-chip--empty">brak daty</span>
              }
            </div>

            {/* Liczba aplikacji jeśli backend zwraca */}
            {company.count != null && (
              <p className="n-company-count">
                {company.count} {company.count === 1 ? 'aplikacja' : 'aplikacji'}
              </p>
            )}
          </div>
        ))}
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────
// Strona główna
// ─────────────────────────────────────────────────────────────────
export default function NotesPage() {
  useTitle('Notatki aplikacyjne')
  const user   = useAuthStore(s => s.user)
  const userId = user?.id

  const [activeTab,  setActiveTab]  = useState('notes')
  const [showModal,  setShowModal]  = useState(false)

  const {
    data: notes,
    loading,
    error,
    execute: reloadNotes,
  } = useApi(
    useCallback(() => notesApi.getAll(userId), [userId]),
    { immediate: !!userId }
  )

  const notesCount = notes?.length ?? 0

  if (!userId) return (
    <div className="notes-page animate-fade-in">
      <PageHeader title="Notatki aplikacyjne" subtitle="Twoje aplikacje" />
      <EmptyState
        icon="⊙"
        title="Brak danych sesji"
        description="Wyloguj się i zaloguj ponownie."
      />
      <NotesStyles />
    </div>
  )

  return (
    <div className="notes-page animate-fade-in">

      {/* Nagłówek */}
      <PageHeader
        title="Notatki aplikacyjne"
        subtitle={notesCount > 0 ? `${notesCount} notatek łącznie` : 'Twoje aplikacje'}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost btn-sm" onClick={reloadNotes} disabled={loading}>
              ↻ Odśwież
            </button>
            <button className="btn-primary btn-sm" onClick={() => setShowModal(true)}>
              ⊕ Nowa notatka
            </button>
          </div>
        }
      />

      {/* Zakładki */}
      <div className="n-tabs" role="tablist">
        {TABS.map(tab => {
          const count = tab.id === 'notes' ? notesCount : null
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`n-tab${activeTab === tab.id ? ' n-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span>
              {tab.label}
              {count !== null && count > 0 && (
                <span className={`n-tab-count${activeTab === tab.id ? ' n-tab-count--active' : ''}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Treść zakładki */}
      {activeTab === 'notes'
        ? <NotesTab notes={notes} loading={loading} error={error} reload={reloadNotes} />
        : <CompaniesTab userId={userId} />
      }

      {/* Modal */}
      {showModal && (
        <NewNoteModal
          userId={userId}
          onClose={() => setShowModal(false)}
          onCreated={reloadNotes}
        />
      )}

      <NotesStyles />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Style
// ─────────────────────────────────────────────────────────────────
function NotesStyles() {
  return (
    <style>{`
      .notes-page { max-width: 1080px; }

      /* ── Zakładki ── */
      .n-tabs {
        display: flex; gap: 4px; margin-bottom: 20px;
        border-bottom: 1px solid var(--border-1);
      }
      .n-tab {
        display: flex; align-items: center; gap: 7px;
        padding: 9px 16px; background: none; border: none;
        border-bottom: 2px solid transparent; margin-bottom: -1px;
        font-family: var(--font-mono); font-size: 0.78rem; color: var(--text-2);
        cursor: pointer; transition: color .15s, border-color .15s; white-space: nowrap;
      }
      .n-tab:hover { color: var(--text-0); }
      .n-tab--active { color: var(--accent); border-bottom-color: var(--accent); }
      .n-tab-count {
        font-size: 0.65rem; font-weight: 700;
        background: var(--bg-3); color: var(--text-2);
        border: 1px solid var(--border-1);
        padding: 1px 6px; border-radius: 100px;
        transition: background .15s, color .15s;
      }
      .n-tab-count--active {
        background: var(--accent-glow); color: var(--accent); border-color: var(--border-0);
      }

      /* ── Toolbar ── */
      .n-toolbar {
        display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap;
      }
      .n-search-wrap { position: relative; flex: 1; min-width: 200px; }
      .n-search-ico {
        position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
        color: var(--text-3); font-size: 0.82rem; pointer-events: none;
      }
      .n-search {
        width: 100%; padding: 8px 32px 8px 32px;
        background: var(--bg-2); border: 1px solid var(--border-1);
        border-radius: var(--radius-md); font-family: var(--font-mono);
        font-size: 0.81rem; color: var(--text-0); outline: none;
        transition: border-color .15s, box-shadow .15s;
      }
      .n-search::placeholder { color: var(--text-3); }
      .n-search::-webkit-search-cancel-button { display: none; }
      .n-search:focus { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-glow); }
      .n-search-clear {
        position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
        background: none; border: none; color: var(--text-3); cursor: pointer;
        font-size: 0.68rem; padding: 2px; transition: color .15s;
      }
      .n-search-clear:hover { color: var(--text-0); }
      .n-select {
        background: var(--bg-2); border: 1px solid var(--border-1);
        border-radius: var(--radius-md); padding: 8px 12px;
        font-family: var(--font-mono); font-size: 0.78rem; color: var(--text-1);
        outline: none; cursor: pointer; transition: border-color .15s;
      }
      .n-select:focus { border-color: var(--accent); }

      /* Licznik */
      .n-count { font-size: 0.73rem; color: var(--text-2); margin-bottom: 14px; }
      .n-count strong { color: var(--text-0); }

      /* ── Siatka notatek ── */
      .n-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 12px;
      }

      /* ── Karta notatki ── */
      .n-card {
        display: flex; flex-direction: column; gap: 8px;
        background: var(--bg-1); border: 1px solid var(--border-1);
        border-radius: var(--radius-lg); padding: 14px 16px;
        transition: border-color .15s;
      }
      .n-card:hover { border-color: var(--border-0); }

      .n-card-head {
        display: flex; justify-content: space-between;
        align-items: flex-start; gap: 8px;
      }
      .n-card-meta { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
      .n-card-company {
        display: flex; align-items: center; gap: 5px;
        font-family: var(--font-display); font-weight: 700;
        font-size: 0.84rem; color: var(--text-0);
      }
      .n-card-dot { color: var(--accent); font-size: 0.7rem; }
      .n-badge {
        font-family: var(--font-mono); font-size: 0.6rem; font-weight: 700;
        letter-spacing: .07em; padding: 2px 7px;
        border-radius: 100px; border: 1px solid; white-space: nowrap;
      }
      .n-badge--ext {
        color: var(--cyan); border-color: rgba(0,212,212,.3);
        background: rgba(0,212,212,.07);
      }
      .n-card-date {
        font-family: var(--font-mono); font-size: 0.65rem;
        color: var(--text-3); white-space: nowrap; flex-shrink: 0;
      }
      .n-card-offer {
        font-size: 0.78rem; color: var(--text-1);
        padding: 6px 8px; background: var(--bg-2);
        border-radius: var(--radius-sm); border-left: 2px solid var(--border-0);
      }
      .n-card-link {
        font-family: var(--font-mono); font-size: 0.7rem; color: var(--accent);
        text-decoration: none; word-break: break-all;
        transition: opacity .15s;
      }
      .n-card-link:hover { opacity: .75; }
      .n-card-content-wrap { display: flex; flex-direction: column; gap: 4px; }
      .n-card-content {
        font-size: 0.79rem; color: var(--text-1); line-height: 1.6; margin: 0;
      }
      .n-card-content--clamped {
        display: -webkit-box; -webkit-line-clamp: 3;
        -webkit-box-orient: vertical; overflow: hidden;
      }
      .n-card-expand {
        background: none; border: none; color: var(--text-3);
        font-family: var(--font-mono); font-size: 0.68rem;
        cursor: pointer; padding: 0; align-self: flex-start;
        transition: color .15s;
      }
      .n-card-expand:hover { color: var(--accent); }

      /* ── Skeleton ── */
      .n-skel {
        height: 120px; border-radius: var(--radius-lg);
        background: linear-gradient(90deg, var(--bg-2) 25%, var(--bg-3) 50%, var(--bg-2) 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s ease infinite;
      }
      .n-skel--company { height: 80px; }

      /* ── Firmy ── */
      .n-companies-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 10px;
      }
      .n-company-card {
        background: var(--bg-1); border: 1px solid var(--border-1);
        border-radius: var(--radius-lg); padding: 14px 16px;
        display: flex; flex-direction: column; gap: 8px;
        transition: border-color .15s;
      }
      .n-company-card:hover { border-color: var(--border-0); }
      .n-company-head { display: flex; align-items: center; gap: 7px; }
      .n-company-dot { color: var(--accent); font-size: 0.8rem; flex-shrink: 0; }
      .n-company-name {
        font-family: var(--font-display); font-weight: 700;
        font-size: 0.85rem; color: var(--text-0);
      }
      .n-company-dates { display: flex; flex-wrap: wrap; gap: 5px; }
      .n-company-date-chip {
        font-family: var(--font-mono); font-size: 0.67rem; color: var(--text-2);
        background: var(--bg-2); border: 1px solid var(--border-1);
        padding: 2px 8px; border-radius: var(--radius-sm);
      }
      .n-company-date-chip--empty { color: var(--text-3); font-style: italic; }
      .n-company-count {
        font-family: var(--font-mono); font-size: 0.68rem; color: var(--text-3);
      }

      /* ── Modal ── */
      .n-modal-backdrop {
        position: fixed; inset: 0; z-index: 200;
        background: rgba(0,0,0,0.65); backdrop-filter: blur(4px);
        display: flex; align-items: center; justify-content: center;
        padding: 16px;
      }
      .n-modal {
        background: var(--bg-1); border: 1px solid var(--border-1);
        border-radius: var(--radius-xl); width: 100%; max-width: 440px;
        box-shadow: var(--shadow-lg);
      }
      .n-modal-head {
        display: flex; justify-content: space-between; align-items: flex-start;
        padding: 20px 20px 16px; border-bottom: 1px solid var(--border-1);
      }
      .n-modal-title {
        font-family: var(--font-display); font-weight: 800;
        font-size: 1rem; color: var(--text-0); margin-bottom: 3px;
      }
      .n-modal-sub { font-size: 0.76rem; color: var(--text-2); }
      .n-modal-close {
        background: none; border: none; color: var(--text-3);
        cursor: pointer; font-size: 0.8rem; padding: 4px;
        transition: color .15s; flex-shrink: 0;
      }
      .n-modal-close:hover { color: var(--text-0); }

      .n-modal-body { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
      .n-field { display: flex; flex-direction: column; gap: 6px; }
      .n-label {
        font-family: var(--font-mono); font-size: 0.73rem; color: var(--text-2);
      }
      .n-required { color: var(--accent); }
      .n-optional { color: var(--text-3); font-size: 0.68rem; }
      .n-input {
        padding: 9px 12px;
        background: var(--bg-2); border: 1px solid var(--border-1);
        border-radius: var(--radius-md);
        font-family: var(--font-mono); font-size: 0.82rem; color: var(--text-0);
        outline: none; transition: border-color .15s, box-shadow .15s;
      }
      .n-input::placeholder { color: var(--text-3); }
      .n-input:focus { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-glow); }
      .n-input--err { border-color: var(--red); }
      .n-err { font-family: var(--font-mono); font-size: 0.7rem; color: var(--red); }

      .n-modal-foot {
        display: flex; justify-content: flex-end; gap: 8px;
        padding-top: 4px;
      }

      /* Przyciski lokalne */
      .btn-primary, .btn-ghost {
        display: inline-flex; align-items: center; gap: 6px;
        font-family: var(--font-mono); font-weight: 600;
        border-radius: var(--radius-md); border: 1px solid;
        cursor: pointer; transition: background .15s, border-color .15s, box-shadow .15s;
        white-space: nowrap;
      }
      .btn-primary {
        padding: 8px 16px; font-size: 0.8rem;
        background: var(--accent); color: #000; border-color: var(--accent);
      }
      .btn-primary:hover:not(:disabled) { background: var(--accent-dim); box-shadow: var(--shadow-accent); }
      .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
      .btn-ghost {
        padding: 8px 14px; font-size: 0.8rem;
        background: transparent; color: var(--text-1); border-color: var(--border-1);
      }
      .btn-ghost:hover:not(:disabled) { background: var(--bg-2); color: var(--text-0); }
      .btn-ghost:disabled { opacity: .5; cursor: not-allowed; }
      .btn-sm { padding: 6px 12px !important; font-size: 0.74rem !important; }

      /* Spinner */
      .n-spin {
        display: inline-block; width: 12px; height: 12px;
        border: 2px solid transparent; border-top-color: currentColor;
        border-radius: 50%; animation: spin .6s linear infinite;
      }
    `}</style>
  )
}