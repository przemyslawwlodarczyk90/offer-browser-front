import { useState, useEffect, useCallback, useRef } from 'react'

// ── useApi ────────────────────────────────────────────────────────
export function useApi(apiFn, { immediate = false, deps = [] } = {}) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(immediate)
  const [error,   setError]   = useState(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const execute = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFn(...args)
      if (mountedRef.current) setData(res.data)
      return res.data
    } catch (err) {
      if (mountedRef.current) setError(err)
      throw err
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (immediate) execute()
  }, [immediate]) // eslint-disable-line react-hooks/exhaustive-deps

  const reset = useCallback(() => {
    setData(null); setError(null); setLoading(false)
  }, [])

  return { data, loading, error, execute, reset }
}

// ── useDebounce ───────────────────────────────────────────────────
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

// ── useTitle ──────────────────────────────────────────────────────
export function useTitle(title) {
  useEffect(() => {
    const prev = document.title
    document.title = title ? `${title} — OfferBrowser` : 'OfferBrowser'
    return () => { document.title = prev }
  }, [title])
}