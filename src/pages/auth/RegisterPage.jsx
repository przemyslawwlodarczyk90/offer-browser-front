import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '@/api/services'
import { toast } from '@/store'
import { useTitle } from '@/hooks'
import { AuthStyles } from './authStyles'

function scorePassword(pw) {
  if (!pw) return { label: '', color: '', pct: 0 }
  let s = 0
  if (pw.length >= 6)           s++
  if (pw.length >= 10)          s++
  if (/[A-Z]/.test(pw))         s++
  if (/[0-9]/.test(pw))         s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  const lvl = [
    { label: '',        color: 'transparent',  pct: 0   },
    { label: 'Słabe',   color: 'var(--red)',    pct: 25  },
    { label: 'Słabe',   color: 'var(--red)',    pct: 40  },
    { label: 'Średnie', color: 'var(--yellow)', pct: 60  },
    { label: 'Dobre',   color: 'var(--cyan)',   pct: 80  },
    { label: 'Silne',   color: 'var(--green)',  pct: 100 },
  ]
  return lvl[s] ?? lvl[0]
}

function validate(f) {
  const e = {}
  if (!f.username.trim())         e.username = 'Pole wymagane'
  else if (f.username.length < 3) e.username = 'Min. 3 znaki'
  if (!f.email.includes('@'))     e.email    = 'Nieprawidłowy email'
  if (f.password.length < 6)      e.password = 'Min. 6 znaków'
  if (f.password !== f.confirm)   e.confirm  = 'Hasła nie są zgodne'
  return e
}

export default function RegisterPage() {
  useTitle('Rejestracja')
  const navigate = useNavigate()

  const [form,    setForm]    = useState({ username: '', email: '', password: '', confirm: '' })
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)
  const [showPw,  setShowPw]  = useState(false)
  const [showCf,  setShowCf]  = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const strength = useMemo(() => scorePassword(form.password), [form.password])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      await authApi.register({ username: form.username, email: form.email, password: form.password })
      toast.success('Konto utworzone! Sprawdź email w celu aktywacji.')
      navigate('/login')
    } catch (err) {
      toast.error(err?.message ?? 'Błąd rejestracji')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`auth-card${mounted ? ' auth-card--in' : ''}`}>
      <div className="auth-card-header">
        <span className="auth-card-icon">⊕</span>
        <h2 className="auth-card-title">Utwórz konto</h2>
        <p className="auth-card-sub">Wypełnij formularz rejestracji</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="auth-form">
        <div className="auth-field">
          <label className="auth-label" htmlFor="r-user">Nazwa użytkownika</label>
          <input id="r-user" name="username"
            className={`auth-input${errors.username ? ' auth-input--err' : ''}`}
            value={form.username} onChange={handleChange}
            autoComplete="username" autoFocus placeholder="min. 3 znaki" />
          {errors.username && <span className="auth-err">{errors.username}</span>}
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="r-email">Email</label>
          <input id="r-email" name="email" type="email"
            className={`auth-input${errors.email ? ' auth-input--err' : ''}`}
            value={form.email} onChange={handleChange}
            autoComplete="email" placeholder="adres@email.com" />
          {errors.email && <span className="auth-err">{errors.email}</span>}
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="r-pass">Hasło</label>
          <div className="auth-input-wrap">
            <input id="r-pass" name="password"
              type={showPw ? 'text' : 'password'}
              className={`auth-input auth-input--padded${errors.password ? ' auth-input--err' : ''}`}
              value={form.password} onChange={handleChange}
              autoComplete="new-password" placeholder="min. 6 znaków" />
            <button type="button" className="auth-eye"
              onClick={() => setShowPw(v => !v)}>
              {showPw ? '◎' : '●'}
            </button>
          </div>
          {form.password && (
            <div className="pw-strength">
              <div className="pw-bar">
                <div className="pw-fill" style={{ width: `${strength.pct}%`, background: strength.color }} />
              </div>
              <span className="pw-label" style={{ color: strength.color }}>{strength.label}</span>
            </div>
          )}
          {errors.password && <span className="auth-err">{errors.password}</span>}
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="r-confirm">Powtórz hasło</label>
          <div className="auth-input-wrap">
            <input id="r-confirm" name="confirm"
              type={showCf ? 'text' : 'password'}
              className={`auth-input auth-input--padded${errors.confirm ? ' auth-input--err' : ''}`}
              value={form.confirm} onChange={handleChange}
              autoComplete="new-password" placeholder="••••••••" />
            <button type="button" className="auth-eye"
              onClick={() => setShowCf(v => !v)}>
              {showCf ? '◎' : '●'}
            </button>
          </div>
          {errors.confirm && <span className="auth-err">{errors.confirm}</span>}
        </div>

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? <span className="auth-btn-spin" aria-hidden="true" /> : 'Zarejestruj się →'}
        </button>
      </form>

      <div className="auth-divider">
        <span className="auth-divider-line" />
        <span className="auth-divider-text">lub</span>
        <span className="auth-divider-line" />
      </div>
      <p className="auth-switch">
        Masz już konto? <Link to="/login" className="auth-link">Zaloguj się</Link>
      </p>
      <AuthStyles />
    </div>
  )
}