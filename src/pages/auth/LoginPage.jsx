// ╔══════════════════════════════════════════════════════════════╗
// ║  ŚCIEŻKA:  src/pages/auth/LoginPage.jsx                    ║
// ║  AKCJA:    NADPISZ — POPRAWKA KRYTYCZNA                    ║
// ║  FIX:      Wyciąga userId z JWT i zapisuje w store         ║
// ╚══════════════════════════════════════════════════════════════╝

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '@/api/services'
import { useAuthStore, toast, decodeJwtPayload } from '@/store'
import { useTitle } from '@/hooks'
import { AuthStyles } from './authStyles'

function validate(f) {
  const e = {}
  if (!f.username.trim()) e.username = 'Pole wymagane'
  if (!f.password)        e.password = 'Pole wymagane'
  return e
}

export default function LoginPage() {
  useTitle('Logowanie')
  const navigate = useNavigate()
  const setAuth  = useAuthStore((s) => s.setAuth)

  const [form,    setForm]    = useState({ username: '', password: '' })
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)
  const [showPw,  setShowPw]  = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

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
      const res   = await authApi.login(form)
      const token = res.data?.token

      // Wyciągnij userId z payloadu JWT (pole "sub" lub "userId")
      const payload = decodeJwtPayload(token)
      const userId  = payload?.userId ?? payload?.sub ?? res.data?.userId ?? null

      setAuth(token, {
        id:       userId,
        username: form.username,
        email:    res.data?.email ?? null,
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(err?.message ?? 'Nieprawidłowe dane logowania')
      setErrors({ password: ' ' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`auth-card${mounted ? ' auth-card--in' : ''}`}>
      <div className="auth-card-header">
        <span className="auth-card-icon">⊙</span>
        <h2 className="auth-card-title">Zaloguj się</h2>
        <p className="auth-card-sub">Wpisz dane swojego konta</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="auth-form">
        <div className="auth-field">
          <label className="auth-label" htmlFor="l-user">Nazwa użytkownika</label>
          <input
            id="l-user" name="username"
            className={`auth-input${errors.username ? ' auth-input--err' : ''}`}
            value={form.username} onChange={handleChange}
            autoComplete="username" autoFocus placeholder="np. jan_kowalski"
          />
          {errors.username && <span className="auth-err">{errors.username}</span>}
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="l-pass">Hasło</label>
          <div className="auth-input-wrap">
            <input
              id="l-pass" name="password"
              type={showPw ? 'text' : 'password'}
              className={`auth-input auth-input--padded${errors.password ? ' auth-input--err' : ''}`}
              value={form.password} onChange={handleChange}
              autoComplete="current-password" placeholder="••••••••"
            />
            <button type="button" className="auth-eye"
              onClick={() => setShowPw(v => !v)}
              aria-label={showPw ? 'Ukryj hasło' : 'Pokaż hasło'}>
              {showPw ? '◎' : '●'}
            </button>
          </div>
          {errors.password?.trim() && <span className="auth-err">{errors.password}</span>}
        </div>

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? <span className="auth-btn-spin" aria-hidden="true" /> : 'Zaloguj się →'}
        </button>
      </form>

      <div className="auth-divider">
        <span className="auth-divider-line" />
        <span className="auth-divider-text">lub</span>
        <span className="auth-divider-line" />
      </div>
      <p className="auth-switch">
        Nie masz konta? <Link to="/register" className="auth-link">Zarejestruj się</Link>
      </p>
      <AuthStyles />
    </div>
  )
}