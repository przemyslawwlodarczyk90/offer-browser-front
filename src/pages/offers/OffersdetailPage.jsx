import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { offersApi, userOffersApi } from '@/api/services'
import { useApi, useTitle } from '@/hooks'
import { useAuthStore, toast } from '@/store'
import { Badge } from '@/components/ui'
import { formatDate, formatDateTime, normalizeLevel, formatSalary } from '@/utils'

// ─────────────────────────────────────────────────────────────────
export default function OfferDetailPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const user     = useAuthStore((s) => s.user)

  const { data: offer, loading, error } =
    useApi(() => offersApi.getById(id), { immediate: true, deps: [id] })

  useTitle(offer?.title ?? 'Szczegóły oferty')

  const [applying, setApplying] = useState(false)
  const [marking,  setMarking]  = useState(false)

  const handleApply = async () => {
    if (!user?.id) { toast.warn('Brak ID użytkownika w sesji'); return }
    setApplying(true)
    try {
      await userOffersApi.applyToOffer(user.id, id)
      toast.success('Aplikacja zapisana!')
    } catch (err) {
      toast.error(err?.message ?? 'Błąd zapisu aplikacji')
    } finally {
      setApplying(false)
    }
  }

  const handleMarkDup = async () => {
    setMarking(true)
    try {
      await offersApi.markDuplicateById(id)
      toast.info('Oferta oznaczona jako duplikat')
      navigate(-1)
    } catch (err) {
      toast.error(err?.message ?? 'Błąd oznaczania duplikatu')
    } finally {
      setMarking(false)
    }
  }

  /* ── Loading ── */
  if (loading) return <DetailSkeleton />

  /* ── Błąd ── */
  if (error || !offer) return (
    <div className="detail-page animate-fade-in">
      <button className="detail-back" onClick={() => navigate(-1)}>← Wróć</button>
      <div className="detail-err">
        <span style={{ fontSize: '2.2rem' }}>✕</span>
        <p>{error?.message ?? 'Nie znaleziono oferty.'}</p>
      </div>
    </div>
  )

  const level  = normalizeLevel(offer.level)
  const salary = formatSalary(offer.salary)

  return (
    <div className="detail-page animate-fade-in">
      {/* ── Nawigacja + akcje ── */}
      <div className="detail-nav">
        <button className="detail-back" onClick={() => navigate(-1)}>← Oferty</button>
        <div className="detail-actions">
          <button
            className="btn btn--danger btn--sm"
            onClick={handleMarkDup}
            disabled={marking || offer.duplicate}
            title={offer.duplicate ? 'Już oznaczono' : 'Oznacz jako duplikat'}
          >
            {marking ? '…' : '⊗ Duplikat'}
          </button>
          <button className="btn btn--primary btn--sm" onClick={handleApply} disabled={applying}>
            {applying ? '…' : '✓ Aplikuj'}
          </button>
        </div>
      </div>

      {/* ── Hero ── */}
      <div className="detail-hero">
        <div className="detail-hero-left">
          <div className="detail-badges">
            <Badge level={level} />
            {offer.duplicate && (
              <span className="detail-dup-tag">DUPLIKAT</span>
            )}
          </div>
          <h1 className="detail-title">{offer.title}</h1>
          <p  className="detail-company">{offer.companyName ?? '—'}</p>
        </div>
        {salary && (
          <div className="detail-salary">{salary}</div>
        )}
      </div>

      {/* ── Meta grid ── */}
      <div className="detail-meta">
        <MetaBox icon="◎" label="Miasto"         value={offer.city ?? '—'} />
        <MetaBox icon="⊙" label="Poziom"         value={level} />
        <MetaBox icon="◷" label="Dodano"          value={formatDate(offer.createdAt ?? offer.fetchedAt)} />
        <MetaBox icon="◈" label="Aktualizacja"   value={formatDateTime(offer.updatedAt)} />
        {offer.offerUrl && (
          <div className="meta-box meta-box--wide">
            <span className="meta-label">Źródło</span>
            <a href={offer.offerUrl} target="_blank" rel="noopener noreferrer" className="meta-link">
              {offer.offerUrl}
            </a>
          </div>
        )}
      </div>

      {/* ── Opis ── */}
      {offer.description && (
        <section className="detail-section">
          <h2 className="detail-section-h">Opis oferty</h2>
          <div className="detail-desc">
            {offer.description.split('\n').map((line, i) =>
              line.trim()
                ? <p key={i} style={{ margin: '0 0 .55rem' }}>{line}</p>
                : <br key={i} />
            )}
          </div>
        </section>
      )}

      <DetailStyles />
    </div>
  )
}

function MetaBox({ icon, label, value }) {
  return (
    <div className="meta-box">
      <span className="meta-label">{icon} {label}</span>
      <span className="meta-value">{value}</span>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="detail-page animate-fade-in">
      {[140, 100, 36, 36, 36, 200].map((h, i) => (
        <div key={i} className="d-skel" style={{ height: h, marginBottom: 12, animationDelay: `${i * 60}ms` }} />
      ))}
      <style>{`
        .d-skel {
          border-radius: var(--radius-md);
          background: linear-gradient(90deg, var(--bg-2) 25%, var(--bg-3) 50%, var(--bg-2) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s ease infinite;
        }
      `}</style>
    </div>
  )
}

function DetailStyles() {
  return (
    <style>{`
      .detail-page { max-width: 820px; }

      /* Nawigacja */
      .detail-nav {
        display: flex; align-items: center;
        justify-content: space-between; gap: 12px;
        margin-bottom: 24px; flex-wrap: wrap;
      }
      .detail-back {
        background: none; border: none; color: var(--text-2);
        font-family: var(--font-mono); font-size: 0.78rem; cursor: pointer;
        padding: 0; transition: color .15s;
      }
      .detail-back:hover { color: var(--accent); }
      .detail-actions { display: flex; gap: 8px; }

      /* Hero */
      .detail-hero {
        display: flex; justify-content: space-between;
        align-items: flex-start; gap: 20px; margin-bottom: 20px; flex-wrap: wrap;
      }
      .detail-hero-left { flex: 1; }
      .detail-badges { display: flex; align-items: center; gap: 7px; margin-bottom: 10px; }
      .detail-dup-tag {
        font-family: var(--font-mono); font-size: 0.6rem; font-weight: 700;
        letter-spacing: .1em; color: var(--red);
        border: 1px solid rgba(239,68,68,.4); padding: 2px 7px;
        border-radius: var(--radius-sm);
      }
      .detail-title {
        font-family: var(--font-display); font-weight: 800;
        font-size: 1.6rem; color: var(--text-0);
        line-height: 1.25; margin: 0 0 6px;
      }
      .detail-company { font-size: 0.88rem; color: var(--text-2); margin: 0; }
      .detail-salary {
        font-family: var(--font-mono); font-size: 1rem; font-weight: 700;
        color: var(--cyan); padding: 10px 16px;
        background: rgba(0,212,212,.07);
        border: 1px solid rgba(0,212,212,.25);
        border-radius: var(--radius-lg); white-space: nowrap; align-self: flex-start;
      }

      /* Meta */
      .detail-meta {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
        gap: 8px; margin-bottom: 24px;
      }
      .meta-box {
        background: var(--bg-2); border: 1px solid var(--border-1);
        border-radius: var(--radius-md); padding: 10px 12px;
        display: flex; flex-direction: column; gap: 4px;
      }
      .meta-box--wide { grid-column: 1 / -1; }
      .meta-label {
        font-size: 0.64rem; color: var(--text-3);
        text-transform: uppercase; letter-spacing: .07em; font-weight: 600;
      }
      .meta-value { font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-0); }
      .meta-link  {
        font-family: var(--font-mono); font-size: 0.74rem; color: var(--accent);
        text-decoration: none; word-break: break-all;
      }
      .meta-link:hover { text-decoration: underline; }

      /* Opis */
      .detail-section  { margin-bottom: 20px; }
      .detail-section-h {
        font-family: var(--font-display); font-size: 0.85rem; font-weight: 700;
        color: var(--text-1); text-transform: uppercase; letter-spacing: .08em;
        margin-bottom: 10px; padding-bottom: 8px;
        border-bottom: 1px solid var(--border-1);
      }
      .detail-desc {
        font-size: 0.83rem; color: var(--text-1); line-height: 1.7;
        background: var(--bg-1); border: 1px solid var(--border-1);
        border-radius: var(--radius-md); padding: 14px 16px;
      }

      /* Error */
      .detail-err {
        display: flex; flex-direction: column;
        align-items: center; gap: 12px;
        padding: 48px 24px; color: var(--text-2); text-align: center;
      }
    `}</style>
  )
}