// ╔══════════════════════════════════════════════╗
// ║  ŚCIEŻKA:  src/pages/ProfilePage.jsx         ║
// ║  AKCJA:    NADPISZ istniejący plik (stub)    ║
// ╚══════════════════════════════════════════════╝

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/api/services'
import { useAuthStore, toast } from '@/store'
import { useTitle } from '@/hooks'
import { PageHeader } from '@/components/ui'

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
function validateProfile(f) {
  const e = {}
  if (!f.username.trim())       e.username = 'Pole wymagane'
  else if (f.username.length < 3) e.username = 'Min. 3 znaki'
  if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email))
    e.email = 'Nieprawidłowy adres e-mail'
  return e
}

function validatePassword(f) {
  const e = {}
  if (!f.currentPassword)        e.currentPassword = 'Pole wymagane'
  if (!f.newPassword)            e.newPassword = 'Pole wymagane'
  else if (f.newPassword.length < 6) e.newPassword = 'Min. 6 znaków'
  if (!f.confirmPassword)        e.confirmPassword = 'Pole wymagane'
  else if (f.newPassword !== f.confirmPassword)
    e.confirmPassword = 'Hasła nie są zgodne'
  return e
}

function strengthLabel(pw) {
  if (!pw) return null
  let score = 0
  if (pw.length >= 8)          score++
  if (/[A-Z]/.test(pw))        score++
  if (/[0-9]/.test(pw))        score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return ['Bardzo słabe', 'Słabe', 'Średnie', 'Silne', 'Bardzo silne'][score]
}

function strengthColor(pw) {
  const s = strengthLabel(pw)
  return {
    'Bardzo słabe': 'var(--red)',
    'Słabe':        'var(--red)',
    'Średnie':      'var(--yellow)',
    'Silne':        'var(--green)',
    'Bardzo silne': 'var(--green)',
  }[s] ?? 'var(--text-3)'
}

function strengthWidth(pw) {
  if (!pw) return '0%'
  let score = 0
  if (pw.length >= 8)          score++
  if (/[A-Z]/.test(pw))        score++
  if (/[0-9]/.test(pw))        score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return `${(score / 4) * 100}%`
}

// ─────────────────────────────────────────────────────────────────
// Sekcja: Avatar + info
// ─────────────────────────────────────────────────────────────────
function AvatarSection({ user }) {
  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : '??'

  return (
    <div className="pf-avatar-section">
      <div className="pf-avatar">{initials}</div>
      <div className="pf-avatar-info">
        <p className="pf-avatar-name">{user?.username ?? '—'}</p>
        <p className="pf-avatar-email">{user?.email ?? 'brak adresu e-mail'}</p>
        {user?.id && (
          <p className="pf-avatar-id">ID: {user.id}</p>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Sekcja: Edycja profilu
// ─────────────────────────────────────────────────────────────────
function ProfileSection({ user, onUpdated }) {
  const [form,    setForm]    = useState({
    username: user?.username ?? '',
    email:    user?.email    ?? '',
  })
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)
  const [saved,   setSaved]   = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    setSaved(false)
    if (errors[name]) setErrors(er => ({ ...er, [name]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validateProfile(form)
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      await authApi.updateProfile({
        username: form.username.trim(),
        email:    form.email.trim() || undefined,
      })
      onUpdated({ username: form.username.trim(), email: form.email.trim() || null })
      toast.success('Profil zaktualizowany')
      setSaved(true)
    } catch (err) {
      toast.error(err?.message ?? 'Błąd aktualizacji profilu')
    } finally {
      setLoading(false)
    }
  }

  const isDirty = form.username !== (user?.username ?? '') ||
                  form.email    !== (user?.email    ?? '')

  return (
    <section className="pf-section">
      <div className="pf-section-head">
        <span className="pf-section-icon">⊙</span>
        <div>
          <h2 className="pf-section-title">Dane profilu</h2>
          <p className="pf-section-sub">Zmień nazwę użytkownika lub adres e-mail</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="pf-section-body" noValidate>
        <div className="pf-field">
          <label className="pf-label" htmlFor="pf-username">
            Nazwa użytkownika <span className="pf-required">*</span>
          </label>
          <input
            id="pf-username" name="username"
            className={`pf-input${errors.username ? ' pf-input--err' : ''}`}
            value={form.username}
            onChange={handleChange}
            disabled={loading}
            autoComplete="username"
          />
          {errors.username && <span className="pf-err">{errors.username}</span>}
        </div>

        <div className="pf-field">
          <label className="pf-label" htmlFor="pf-email">
            Adres e-mail <span className="pf-optional">(opcjonalnie)</span>
          </label>
          <input
            id="pf-email" name="email" type="email"
            className={`pf-input${errors.email ? ' pf-input--err' : ''}`}
            value={form.email}
            onChange={handleChange}
            disabled={loading}
            autoComplete="email"
            placeholder="np. jan@example.com"
          />
          {errors.email && <span className="pf-err">{errors.email}</span>}
        </div>

        <div className="pf-foot">
          {saved && !isDirty && (
            <span className="pf-saved">✓ Zapisano</span>
          )}
          <button
            type="submit"
            className="pf-btn pf-btn--primary"
            disabled={loading || !isDirty}
          >
            {loading
              ? <><span className="pf-spin" />Zapisywanie…</>
              : 'Zapisz zmiany'
            }
          </button>
        </div>
      </form>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────
// Sekcja: Zmiana hasła
// ─────────────────────────────────────────────────────────────────
function PasswordSection() {
  const [form,    setForm]    = useState({
    currentPassword: '',
    newPassword:     '',
    confirmPassword: '',
  })
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)
  const [show,    setShow]    = useState({
    current: false, newPw: false, confirm: false,
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (errors[name]) setErrors(er => ({ ...er, [name]: undefined }))
  }

  const toggleShow = (key) => setShow(s => ({ ...s, [key]: !s[key] }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validatePassword(form)
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      await authApi.changePassword({
        currentPassword: form.currentPassword,
        newPassword:     form.newPassword,
      })
      toast.success('Hasło zostało zmienione')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setErrors({})
    } catch (err) {
      toast.error(err?.message ?? 'Błąd zmiany hasła')
      if (err?.status === 400 || err?.status === 401) {
        setErrors({ currentPassword: 'Nieprawidłowe aktualne hasło' })
      }
    } finally {
      setLoading(false)
    }
  }

  const strength = strengthLabel(form.newPassword)
  const sColor   = strengthColor(form.newPassword)
  const sWidth   = strengthWidth(form.newPassword)

  return (
    <section className="pf-section">
      <div className="pf-section-head">
        <span className="pf-section-icon">◈</span>
        <div>
          <h2 className="pf-section-title">Zmiana hasła</h2>
          <p className="pf-section-sub">Ustaw nowe hasło do konta</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="pf-section-body" noValidate>
        {/* Aktualne hasło */}
        <div className="pf-field">
          <label className="pf-label" htmlFor="pf-cur-pw">Aktualne hasło</label>
          <div className="pf-input-wrap">
            <input
              id="pf-cur-pw" name="currentPassword"
              type={show.current ? 'text' : 'password'}
              className={`pf-input pf-input--pw${errors.currentPassword ? ' pf-input--err' : ''}`}
              value={form.currentPassword}
              onChange={handleChange}
              disabled={loading}
              autoComplete="current-password"
              placeholder="••••••••"
            />
            <button type="button" className="pf-eye"
              onClick={() => toggleShow('current')}
              aria-label={show.current ? 'Ukryj' : 'Pokaż'}>
              {show.current ? '◎' : '●'}
            </button>
          </div>
          {errors.currentPassword && <span className="pf-err">{errors.currentPassword}</span>}
        </div>

        {/* Nowe hasło */}
        <div className="pf-field">
          <label className="pf-label" htmlFor="pf-new-pw">Nowe hasło</label>
          <div className="pf-input-wrap">
            <input
              id="pf-new-pw" name="newPassword"
              type={show.newPw ? 'text' : 'password'}
              className={`pf-input pf-input--pw${errors.newPassword ? ' pf-input--err' : ''}`}
              value={form.newPassword}
              onChange={handleChange}
              disabled={loading}
              autoComplete="new-password"
              placeholder="min. 6 znaków"
            />
            <button type="button" className="pf-eye"
              onClick={() => toggleShow('newPw')}
              aria-label={show.newPw ? 'Ukryj' : 'Pokaż'}>
              {show.newPw ? '◎' : '●'}
            </button>
          </div>
          {errors.newPassword && <span className="pf-err">{errors.newPassword}</span>}

          {/* Pasek siły hasła */}
          {form.newPassword && (
            <div className="pf-strength">
              <div className="pf-strength-track">
                <div
                  className="pf-strength-fill"
                  style={{ width: sWidth, background: sColor }}
                />
              </div>
              <span className="pf-strength-label" style={{ color: sColor }}>
                {strength}
              </span>
            </div>
          )}
        </div>

        {/* Potwierdź hasło */}
        <div className="pf-field">
          <label className="pf-label" htmlFor="pf-conf-pw">Powtórz nowe hasło</label>
          <div className="pf-input-wrap">
            <input
              id="pf-conf-pw" name="confirmPassword"
              type={show.confirm ? 'text' : 'password'}
              className={`pf-input pf-input--pw${errors.confirmPassword ? ' pf-input--err' : ''}`}
              value={form.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              autoComplete="new-password"
              placeholder="••••••••"
            />
            <button type="button" className="pf-eye"
              onClick={() => toggleShow('confirm')}
              aria-label={show.confirm ? 'Ukryj' : 'Pokaż'}>
              {show.confirm ? '◎' : '●'}
            </button>
          </div>
          {errors.confirmPassword && <span className="pf-err">{errors.confirmPassword}</span>}
        </div>

        <div className="pf-foot">
          <button
            type="submit"
            className="pf-btn pf-btn--primary"
            disabled={loading || !form.currentPassword || !form.newPassword || !form.confirmPassword}
          >
            {loading
              ? <><span className="pf-spin" />Zapisywanie…</>
              : 'Zmień hasło'
            }
          </button>
        </div>
      </form>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────
// Sekcja: Wylogowanie / Strefa niebezpieczna
// ─────────────────────────────────────────────────────────────────
function DangerSection({ onLogout }) {
  const [confirming, setConfirming] = useState(false)

  return (
    <section className="pf-section pf-section--danger">
      <div className="pf-section-head">
        <span className="pf-section-icon pf-section-icon--danger">⊘</span>
        <div>
          <h2 className="pf-section-title">Sesja i konto</h2>
          <p className="pf-section-sub">Wylogowanie z aplikacji</p>
        </div>
      </div>

      <div className="pf-section-body">
        {!confirming ? (
          <div className="pf-danger-row">
            <div>
              <p className="pf-danger-title">Wyloguj się</p>
              <p className="pf-danger-desc">
                Zakończy bieżącą sesję i usunie token JWT z przeglądarki.
              </p>
            </div>
            <button
              className="pf-btn pf-btn--danger"
              onClick={() => setConfirming(true)}
            >
              ⊘ Wyloguj
            </button>
          </div>
        ) : (
          <div className="pf-confirm animate-fade-in">
            <p className="pf-confirm-text">Czy na pewno chcesz się wylogować?</p>
            <div className="pf-confirm-actions">
              <button className="pf-btn pf-btn--ghost" onClick={() => setConfirming(false)}>
                Anuluj
              </button>
              <button className="pf-btn pf-btn--danger" onClick={onLogout}>
                ⊘ Tak, wyloguj
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────
// Strona główna
// ─────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  useTitle('Profil')
  const navigate   = useNavigate()
  const user       = useAuthStore(s => s.user)
  const logout     = useAuthStore(s => s.logout)
  const updateUser = useAuthStore(s => s.updateUser)

  const handleUpdated = (updates) => {
    updateUser(updates)
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="profile-page animate-fade-in">
      <PageHeader
        title="Profil"
        subtitle="Ustawienia konta"
      />

      <div className="pf-layout">
        {/* Lewa kolumna — avatar */}
        <aside className="pf-sidebar">
          <AvatarSection user={user} />
        </aside>

        {/* Prawa kolumna — sekcje */}
        <div className="pf-main">
          <ProfileSection  user={user} onUpdated={handleUpdated} />
          <PasswordSection />
          <DangerSection   onLogout={handleLogout} />
        </div>
      </div>

      <ProfileStyles />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Style
// ─────────────────────────────────────────────────────────────────
function ProfileStyles() {
  return (
    <style>{`
      .profile-page { max-width: 900px; }

      /* ── Layout ── */
      .pf-layout {
        display: grid;
        grid-template-columns: 220px 1fr;
        gap: 20px; align-items: flex-start;
      }
      @media (max-width: 640px) {
        .pf-layout { grid-template-columns: 1fr; }
      }

      /* ── Avatar sidebar ── */
      .pf-sidebar {
        position: sticky; top: 24px;
      }
      .pf-avatar-section {
        display: flex; flex-direction: column; align-items: center; gap: 14px;
        background: var(--bg-1); border: 1px solid var(--border-1);
        border-radius: var(--radius-lg); padding: 24px 16px; text-align: center;
      }
      .pf-avatar {
        width: 72px; height: 72px; border-radius: 50%;
        background: var(--accent-glow); border: 2px solid var(--border-0);
        display: flex; align-items: center; justify-content: center;
        font-family: var(--font-display); font-weight: 800;
        font-size: 1.5rem; color: var(--accent);
      }
      .pf-avatar-name {
        font-family: var(--font-display); font-weight: 700;
        font-size: 0.95rem; color: var(--text-0);
      }
      .pf-avatar-email {
        font-family: var(--font-mono); font-size: 0.7rem;
        color: var(--text-2); word-break: break-all;
      }
      .pf-avatar-id {
        font-family: var(--font-mono); font-size: 0.65rem; color: var(--text-3);
      }

      /* ── Główna kolumna ── */
      .pf-main { display: flex; flex-direction: column; gap: 14px; }

      /* ── Sekcja ── */
      .pf-section {
        background: var(--bg-1); border: 1px solid var(--border-1);
        border-radius: var(--radius-lg); overflow: hidden;
      }
      .pf-section--danger { border-color: rgba(239,68,68,.2); }

      .pf-section-head {
        display: flex; align-items: flex-start; gap: 12px;
        padding: 16px 20px; border-bottom: 1px solid var(--border-1);
        background: var(--bg-2);
      }
      .pf-section--danger .pf-section-head {
        background: rgba(239,68,68,.04);
        border-bottom-color: rgba(239,68,68,.15);
      }
      .pf-section-icon {
        font-size: 1.1rem; color: var(--accent);
        flex-shrink: 0; margin-top: 2px;
      }
      .pf-section-icon--danger { color: var(--red); }
      .pf-section-title {
        font-family: var(--font-display); font-weight: 700;
        font-size: 0.92rem; color: var(--text-0); margin-bottom: 2px;
      }
      .pf-section-sub { font-size: 0.75rem; color: var(--text-2); }

      .pf-section-body {
        padding: 20px; display: flex; flex-direction: column; gap: 14px;
      }

      /* ── Pola formularza ── */
      .pf-field { display: flex; flex-direction: column; gap: 6px; }
      .pf-label {
        font-family: var(--font-mono); font-size: 0.73rem; color: var(--text-2);
      }
      .pf-required { color: var(--accent); }
      .pf-optional { color: var(--text-3); font-size: 0.67rem; }
      .pf-input {
        padding: 9px 12px;
        background: var(--bg-2); border: 1px solid var(--border-1);
        border-radius: var(--radius-md);
        font-family: var(--font-mono); font-size: 0.82rem; color: var(--text-0);
        outline: none; transition: border-color .15s, box-shadow .15s;
      }
      .pf-input::placeholder { color: var(--text-3); }
      .pf-input:focus { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-glow); }
      .pf-input--err { border-color: var(--red) !important; }
      .pf-input--pw  { padding-right: 40px; }
      .pf-err {
        font-family: var(--font-mono); font-size: 0.7rem; color: var(--red);
      }

      /* Input z okiem */
      .pf-input-wrap { position: relative; }
      .pf-eye {
        position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
        background: none; border: none; color: var(--text-3);
        cursor: pointer; font-size: 0.8rem; padding: 2px;
        transition: color .15s;
      }
      .pf-eye:hover { color: var(--text-0); }

      /* Siła hasła */
      .pf-strength {
        display: flex; align-items: center; gap: 10px; margin-top: 2px;
      }
      .pf-strength-track {
        flex: 1; height: 3px; background: var(--bg-3); border-radius: 2px; overflow: hidden;
      }
      .pf-strength-fill {
        height: 100%; border-radius: 2px; transition: width .3s ease, background .3s ease;
      }
      .pf-strength-label {
        font-family: var(--font-mono); font-size: 0.67rem;
        white-space: nowrap; transition: color .3s ease;
      }

      /* Stopka formularza */
      .pf-foot {
        display: flex; justify-content: flex-end; align-items: center; gap: 10px;
        padding-top: 4px; border-top: 1px solid var(--border-1);
      }
      .pf-saved {
        font-family: var(--font-mono); font-size: 0.72rem; color: var(--green);
      }

      /* ── Przyciski ── */
      .pf-btn {
        display: inline-flex; align-items: center; gap: 6px;
        font-family: var(--font-mono); font-weight: 600;
        border-radius: var(--radius-md); border: 1px solid;
        cursor: pointer; white-space: nowrap;
        transition: background .15s, border-color .15s, box-shadow .15s, transform .1s;
        padding: 8px 16px; font-size: 0.8rem;
      }
      .pf-btn:active:not(:disabled) { transform: scale(.98); }
      .pf-btn:disabled { opacity: .45; cursor: not-allowed; }

      .pf-btn--primary {
        background: var(--accent); color: #000; border-color: var(--accent);
      }
      .pf-btn--primary:hover:not(:disabled) {
        background: var(--accent-dim); box-shadow: var(--shadow-accent);
      }
      .pf-btn--ghost {
        background: transparent; color: var(--text-1); border-color: var(--border-1);
      }
      .pf-btn--ghost:hover:not(:disabled) { background: var(--bg-2); color: var(--text-0); }
      .pf-btn--danger {
        background: transparent; color: var(--red); border-color: rgba(239,68,68,.3);
      }
      .pf-btn--danger:hover:not(:disabled) { background: rgba(239,68,68,.1); }

      /* Spinner */
      .pf-spin {
        display: inline-block; width: 12px; height: 12px;
        border: 2px solid transparent; border-top-color: currentColor;
        border-radius: 50%; animation: spin .6s linear infinite;
      }

      /* ── Strefa niebezpieczna ── */
      .pf-danger-row {
        display: flex; align-items: center;
        justify-content: space-between; gap: 16px; flex-wrap: wrap;
      }
      .pf-danger-title {
        font-family: var(--font-display); font-weight: 700;
        font-size: 0.85rem; color: var(--text-0); margin-bottom: 3px;
      }
      .pf-danger-desc { font-size: 0.77rem; color: var(--text-2); }

      .pf-confirm { display: flex; flex-direction: column; gap: 12px; }
      .pf-confirm-text {
        font-family: var(--font-mono); font-size: 0.82rem; color: var(--text-1);
      }
      .pf-confirm-actions { display: flex; gap: 8px; }
    `}</style>
  )
}