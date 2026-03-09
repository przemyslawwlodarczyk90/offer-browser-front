// ╔══════════════════════════════════════════════════════════╗
// ║  ŚCIEŻKA:  src/hooks/index.js                          ║
// ║  AKCJA:    NADPISZ — POPRAWKA useApi                   ║
// ║  FIX:      immediate+deps teraz poprawnie re-triggeruje ║
// ╚══════════════════════════════════════════════════════════╝

import { useState, useEffect, useCallback, useRef } from 'react'

// ── useApi ────────────────────────────────────────────────────────
//
// POPRAWKA:
//   Stary kod: useEffect(() => execute(), [immediate])
//   Problem:   `immediate` to boolean — nigdy się nie zmienia,
//              więc execute() nie re-triggerowało się gdy zmieniły
//              się deps (np. id w OfferDetailPage, userId w MyOffersPage)
//
//   Nowy kod:  useEffect(() => execute(), [execute])
//              execute jest memoizowany przez `deps` (useCallback),
//              więc zmiana deps → nowe execute → re-fetch ✓
//
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

  // ← POPRAWKA: reaguj na zmianę execute (= zmianę deps), nie tylko immediate
  useEffect(() => {
    if (immediate) execute()
  }, [execute]) // eslint-disable-line react-hooks/exhaustive-deps

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