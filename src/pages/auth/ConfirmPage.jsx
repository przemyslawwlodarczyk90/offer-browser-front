import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { authApi } from '@/api/services'
import { useTitle } from '@/hooks'
import { AuthStyles } from './authStyles'

export default function ConfirmPage() {
  useTitle('Potwierdzenie konta')
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [status,  setStatus]  = useState('loading')
  const [message, setMessage] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!token) { setStatus('notoken'); return }
    authApi.confirmRegistration(token)
      .then(() => {
        setStatus('success')
        setMessage('Twoje konto zostało aktywowane. Możesz się teraz zalogować.')
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err?.message ?? 'Token jest nieprawidłowy lub wygasł.')
      })
  }, [token])

  return (
    <div className={`auth-card${mounted ? ' auth-card--in' : ''}`}>
      <div className="auth-card-header">
        <span className="auth-card-icon">
          {status === 'success' ? '✓' : status === 'error' || status === 'notoken' ? '✕' : '◷'}
        </span>
        <h2 className="auth-card-title">Potwierdzenie konta</h2>
        <p className="auth-card-sub">Weryfikacja tokenu rejestracyjnego</p>
      </div>

      {status === 'loading'  && (
        <div className="auth-banner auth-banner--info">
          <span className="auth-banner-icon">◷</span>
          Trwa weryfikacja tokenu…
        </div>
      )}
      {status === 'notoken'  && (
        <div className="auth-banner auth-banner--error">
          <span className="auth-banner-icon">✕</span>
          Brak tokenu potwierdzającego w adresie URL.
        </div>
      )}
      {status === 'success'  && (
        <div className="auth-banner auth-banner--success">
          <span className="auth-banner-icon">✓</span>
          {message}
        </div>
      )}
      {status === 'error'    && (
        <div className="auth-banner auth-banner--error">
          <span className="auth-banner-icon">✕</span>
          {message}
        </div>
      )}

      <div style={{ marginTop: '1rem' }}>
        {status === 'success' && (
          <Link to="/login" className="auth-btn"
            style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            Przejdź do logowania →
          </Link>
        )}
        {(status === 'error' || status === 'notoken') && (
          <p className="auth-switch">
            Wróć do <Link to="/register" className="auth-link">rejestracji</Link>{' '}
            lub <Link to="/login" className="auth-link">logowania</Link>
          </p>
        )}
      </div>
      <AuthStyles />
    </div>
  )
}