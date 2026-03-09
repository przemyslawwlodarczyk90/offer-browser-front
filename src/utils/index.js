import { format, parseISO, formatDistanceToNow } from 'date-fns'
import { pl } from 'date-fns/locale'

// ── Daty ──────────────────────────────────────────────────────────
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  try { return format(parseISO(dateStr), 'dd.MM.yyyy', { locale: pl }) }
  catch { return dateStr }
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  try { return format(parseISO(dateStr), 'dd.MM.yyyy HH:mm', { locale: pl }) }
  catch { return dateStr }
}

export function timeAgo(dateStr) {
  if (!dateStr) return '—'
  try { return formatDistanceToNow(parseISO(dateStr), { addSuffix: true, locale: pl }) }
  catch { return dateStr }
}

// ── Tekst ─────────────────────────────────────────────────────────
export function truncate(str, len = 120) {
  if (!str) return ''
  return str.length <= len ? str : str.slice(0, len) + '…'
}

// ── Poziom ───────────────────────────────────────────────────────
export function normalizeLevel(level) {
  const map = {
    junior: 'Junior', mid: 'Mid', senior: 'Senior',
    expert: 'Expert', trainee: 'Trainee',
  }
  return map[(level || '').toLowerCase()] ?? level ?? '—'
}

// ── Wynagrodzenie ────────────────────────────────────────────────
export function formatSalary(salary) {
  if (!salary || salary === 'Brak wynagrodzenia') return null
  return salary
}

// ── Sortowanie ───────────────────────────────────────────────────
// key  — nazwa pola daty, np. 'createdAt'
// dir  — 'desc' (najnowsze) | 'asc' (najstarsze)
export function sortByDate(list, key = 'createdAt', dir = 'desc') {
  return [...list].sort((a, b) => {
    const da = a[key] ? new Date(a[key]) : 0
    const db = b[key] ? new Date(b[key]) : 0
    return dir === 'desc' ? db - da : da - db
  })
}






