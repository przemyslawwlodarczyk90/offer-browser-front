// ╔══════════════════════════════════════════════╗
// ║  ŚCIEŻKA:  src/pages/ImportPage.jsx          ║
// ║  AKCJA:    NADPISZ istniejący plik (stub)    ║
// ╚══════════════════════════════════════════════╝

import { useState, useRef } from 'react'
import { importApi } from '@/api/services'
import { useTitle } from '@/hooks'
import { PageHeader } from '@/components/ui'
import { toast } from '@/store'

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
function parseLog(data) {
  // Backend może zwrócić różne kształty — normalizujemy do czytelnego logu
  if (!data) return null
  if (typeof data === 'string') return { message: data }
  return data
}

function StatusLog({ log, error }) {
  if (error) return (
    <div className="imp-log imp-log--error">
      <span className="imp-log-icon">✕</span>
      <div className="imp-log-body">
        <p className="imp-log-title">Błąd operacji</p>
        <p className="imp-log-msg">{error?.message ?? 'Nieznany błąd'}</p>
      </div>
    </div>
  )
  if (!log) return null

  const rows = [
    log.imported   != null && { label: 'Zaimportowano',  value: log.imported,   color: 'var(--green)' },
    log.skipped    != null && { label: 'Pominięto',      value: log.skipped,    color: 'var(--yellow)' },
    log.duplicates != null && { label: 'Duplikaty',      value: log.duplicates, color: 'var(--red)' },
    log.total      != null && { label: 'Łącznie',        value: log.total,      color: 'var(--text-0)' },
  ].filter(Boolean)

  return (
    <div className="imp-log imp-log--success">
      <span className="imp-log-icon">✓</span>
      <div className="imp-log-body">
        <p className="imp-log-title">Operacja zakończona</p>
        {log.message && <p className="imp-log-msg">{log.message}</p>}
        {rows.length > 0 && (
          <div className="imp-log-stats">
            {rows.map(({ label, value, color }) => (
              <div key={label} className="imp-log-stat">
                <span className="imp-log-stat-val" style={{ color }}>{value}</span>
                <span className="imp-log-stat-label">{label}</span>
              </div>
            ))}
          </div>
        )}
        {/* Surowy JSON jeśli brak znanych pól */}
        {rows.length === 0 && (
          <pre className="imp-log-raw">{JSON.stringify(log, null, 2)}</pre>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Sekcja: Uruchom skrypt
// ─────────────────────────────────────────────────────────────────
function ScriptSection() {
  const [status,  setStatus]  = useState(null) // 'idle'|'running'|'done'|'error'
  const [log,     setLog]     = useState(null)
  const [error,   setError]   = useState(null)

  const handleRun = async () => {
    setStatus('running')
    setLog(null)
    setError(null)
    try {
      const res = await importApi.runScript()
      setLog(parseLog(res.data))
      setStatus('done')
      toast.success('Skrypt zakończony pomyślnie')
    } catch (err) {
      setError(err)
      setStatus('error')
      toast.error(err?.message ?? 'Błąd uruchamiania skryptu')
    }
  }

  const isRunning = status === 'running'

  return (
    <section className="imp-section">
      <div className="imp-section-head">
        <span className="imp-section-icon">⊕</span>
        <div>
          <h2 className="imp-section-title">Uruchom skrypt Python</h2>
          <p className="imp-section-sub">
            Ręczne wywołanie skryptu importującego — normalnie uruchamia się automatycznie przez cron.
          </p>
        </div>
      </div>

      <div className="imp-section-body">
        <button
          className="imp-run-btn"
          onClick={handleRun}
          disabled={isRunning}
        >
          {isRunning
            ? <><span className="imp-spin" />Uruchamianie…</>
            : '▶ Uruchom skrypt'
          }
        </button>

        {status === 'running' && (
          <div className="imp-running-info">
            <span className="imp-spin imp-spin--sm" />
            <span>Skrypt działa — może to potrwać kilka minut…</span>
          </div>
        )}

        <StatusLog log={log} error={status === 'error' ? error : null} />
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────
// Sekcja: Import z pliku JSON
// ─────────────────────────────────────────────────────────────────
function JsonSection() {
  const [file,    setFile]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [log,     setLog]     = useState(null)
  const [error,   setError]   = useState(null)
  const inputRef = useRef()

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.name.endsWith('.json')) {
      toast.warn('Wybierz plik z rozszerzeniem .json')
      return
    }
    setFile(f)
    setLog(null)
    setError(null)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) {
      if (!f.name.endsWith('.json')) { toast.warn('Tylko pliki .json'); return }
      setFile(f)
      setLog(null)
      setError(null)
    }
  }

  const handleImport = async () => {
    if (!file) return
    setLoading(true)
    setLog(null)
    setError(null)
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      const res  = await importApi.importFromJson(json)
      setLog(parseLog(res.data))
      toast.success('Import z JSON zakończony')
    } catch (err) {
      if (err instanceof SyntaxError) {
        const e = { message: 'Nieprawidłowy JSON — sprawdź format pliku' }
        setError(e)
        toast.error(e.message)
      } else {
        setError(err)
        toast.error(err?.message ?? 'Błąd importu')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setFile(null)
    setLog(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <section className="imp-section">
      <div className="imp-section-head">
        <span className="imp-section-icon">◈</span>
        <div>
          <h2 className="imp-section-title">Import z pliku JSON</h2>
          <p className="imp-section-sub">
            Wgraj plik .json z listą ofert — zostanie przetworzone przez backend.
          </p>
        </div>
      </div>

      <div className="imp-section-body">
        {/* Drop zone */}
        <div
          className={`imp-drop${file ? ' imp-drop--has-file' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          aria-label="Wybierz plik JSON"
        >
          <input
            ref={inputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFile}
          />
          {file ? (
            <div className="imp-drop-file">
              <span className="imp-drop-file-icon">◉</span>
              <div>
                <p className="imp-drop-file-name">{file.name}</p>
                <p className="imp-drop-file-size">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                className="imp-drop-clear"
                onClick={(e) => { e.stopPropagation(); handleClear() }}
                aria-label="Usuń plik"
              >✕</button>
            </div>
          ) : (
            <div className="imp-drop-placeholder">
              <span className="imp-drop-ico">⊕</span>
              <p>Kliknij lub przeciągnij plik <strong>.json</strong></p>
            </div>
          )}
        </div>

        <button
          className="imp-action-btn"
          onClick={handleImport}
          disabled={!file || loading}
        >
          {loading
            ? <><span className="imp-spin" />Importowanie…</>
            : '↑ Importuj plik'
          }
        </button>

        <StatusLog log={log} error={error} />
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────
// Sekcja: Import z URL
// ─────────────────────────────────────────────────────────────────
function UrlSection() {
  const [url,     setUrl]     = useState('')
  const [loading, setLoading] = useState(false)
  const [log,     setLog]     = useState(null)
  const [error,   setError]   = useState(null)

  const isValidUrl = (s) => {
    try { return ['http:', 'https:'].includes(new URL(s).protocol) }
    catch { return false }
  }

  const handleImport = async () => {
    if (!isValidUrl(url)) {
      toast.warn('Wpisz poprawny adres URL (http:// lub https://)')
      return
    }
    setLoading(true)
    setLog(null)
    setError(null)
    try {
      const res = await importApi.importFromUrl(url.trim())
      setLog(parseLog(res.data))
      toast.success('Import z URL zakończony')
    } catch (err) {
      setError(err)
      toast.error(err?.message ?? 'Błąd importu z URL')
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !loading) handleImport()
  }

  return (
    <section className="imp-section">
      <div className="imp-section-head">
        <span className="imp-section-icon">◎</span>
        <div>
          <h2 className="imp-section-title">Import z URL</h2>
          <p className="imp-section-sub">
            Podaj adres URL do pliku JSON z ofertami — backend pobierze i przetworzy dane.
          </p>
        </div>
      </div>

      <div className="imp-section-body">
        <div className="imp-url-row">
          <div className="imp-url-wrap">
            <span className="imp-url-prefix">https://</span>
            <input
              className="imp-url-input"
              type="url"
              placeholder="example.com/offers.json"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setLog(null); setError(null) }}
              onKeyDown={handleKey}
              disabled={loading}
              spellCheck={false}
            />
            {url && (
              <button
                className="imp-url-clear"
                onClick={() => { setUrl(''); setLog(null); setError(null) }}
                aria-label="Wyczyść URL"
              >✕</button>
            )}
          </div>
          <button
            className="imp-action-btn imp-action-btn--inline"
            onClick={handleImport}
            disabled={!url.trim() || loading}
          >
            {loading
              ? <><span className="imp-spin" />Pobieranie…</>
              : '↓ Importuj'
            }
          </button>
        </div>

        {url && !isValidUrl(url) && (
          <p className="imp-url-hint">⚠ Wpisz pełny adres zaczynający się od http:// lub https://</p>
        )}

        <StatusLog log={log} error={error} />
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────
// Strona główna
// ─────────────────────────────────────────────────────────────────
export default function ImportPage() {
  useTitle('Import ofert')

  return (
    <div className="import-page animate-fade-in">
      <PageHeader
        title="Import ofert"
        subtitle="Zarządzaj źródłami danych"
      />

      <div className="imp-grid">
        <ScriptSection />
        <JsonSection />
        <UrlSection />
      </div>

      <ImportStyles />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Style
// ─────────────────────────────────────────────────────────────────
function ImportStyles() {
  return (
    <style>{`
      .import-page { max-width: 820px; }

      /* Grid sekcji */
      .imp-grid { display: flex; flex-direction: column; gap: 16px; }

      /* Sekcja */
      .imp-section {
        background: var(--bg-1); border: 1px solid var(--border-1);
        border-radius: var(--radius-lg); overflow: hidden;
      }

      .imp-section-head {
        display: flex; align-items: flex-start; gap: 14px;
        padding: 18px 20px; border-bottom: 1px solid var(--border-1);
        background: var(--bg-2);
      }
      .imp-section-icon {
        font-size: 1.2rem; color: var(--accent);
        width: 28px; text-align: center; flex-shrink: 0; margin-top: 2px;
      }
      .imp-section-title {
        font-family: var(--font-display); font-weight: 700;
        font-size: 0.95rem; color: var(--text-0); margin-bottom: 3px;
      }
      .imp-section-sub {
        font-size: 0.77rem; color: var(--text-2); line-height: 1.5;
      }

      .imp-section-body {
        padding: 20px; display: flex; flex-direction: column; gap: 14px;
      }

      /* ── Przycisk skryptu ── */
      .imp-run-btn {
        display: inline-flex; align-items: center; gap: 8px;
        padding: 10px 20px; background: var(--accent); color: #000;
        border: 1px solid var(--accent); border-radius: var(--radius-md);
        font-family: var(--font-mono); font-size: 0.82rem; font-weight: 700;
        cursor: pointer; transition: background .15s, box-shadow .15s;
        align-self: flex-start;
      }
      .imp-run-btn:hover:not(:disabled) {
        background: var(--accent-dim); box-shadow: var(--shadow-accent);
      }
      .imp-run-btn:disabled { opacity: .5; cursor: not-allowed; }

      .imp-running-info {
        display: flex; align-items: center; gap: 8px;
        font-family: var(--font-mono); font-size: 0.76rem; color: var(--text-2);
      }

      /* ── Spinner ── */
      .imp-spin {
        display: inline-block; width: 14px; height: 14px;
        border: 2px solid transparent; border-top-color: currentColor;
        border-radius: 50%; animation: spin .6s linear infinite; flex-shrink: 0;
      }
      .imp-spin--sm { width: 12px; height: 12px; }

      /* ── Drop zone ── */
      .imp-drop {
        border: 1.5px dashed var(--border-1); border-radius: var(--radius-md);
        padding: 28px 20px; cursor: pointer; text-align: center;
        transition: border-color .15s, background .15s;
        background: var(--bg-2);
      }
      .imp-drop:hover,
      .imp-drop:focus-visible { border-color: var(--accent); background: var(--accent-glow); outline: none; }
      .imp-drop--has-file { border-style: solid; border-color: var(--accent); }

      .imp-drop-placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; }
      .imp-drop-ico { font-size: 1.8rem; color: var(--text-3); }
      .imp-drop-placeholder p { font-size: 0.8rem; color: var(--text-2); }
      .imp-drop-placeholder strong { color: var(--accent); }

      .imp-drop-file {
        display: flex; align-items: center; gap: 12px; text-align: left;
      }
      .imp-drop-file-icon { font-size: 1.4rem; color: var(--accent); flex-shrink: 0; }
      .imp-drop-file-name {
        font-family: var(--font-mono); font-size: 0.82rem; color: var(--text-0);
        word-break: break-all;
      }
      .imp-drop-file-size { font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-3); }
      .imp-drop-clear {
        margin-left: auto; background: none; border: none;
        color: var(--text-3); cursor: pointer; font-size: 0.75rem;
        padding: 4px; transition: color .15s; flex-shrink: 0;
      }
      .imp-drop-clear:hover { color: var(--red); }

      /* ── Przycisk akcji ── */
      .imp-action-btn {
        display: inline-flex; align-items: center; gap: 8px;
        padding: 9px 18px; background: var(--bg-3); color: var(--text-0);
        border: 1px solid var(--border-1); border-radius: var(--radius-md);
        font-family: var(--font-mono); font-size: 0.8rem; font-weight: 600;
        cursor: pointer; transition: background .15s, border-color .15s;
        align-self: flex-start; white-space: nowrap;
      }
      .imp-action-btn:hover:not(:disabled) {
        background: var(--bg-4); border-color: var(--border-0);
      }
      .imp-action-btn:disabled { opacity: .45; cursor: not-allowed; }
      .imp-action-btn--inline { align-self: auto; flex-shrink: 0; }

      /* ── URL input ── */
      .imp-url-row { display: flex; gap: 8px; align-items: stretch; flex-wrap: wrap; }
      .imp-url-wrap {
        position: relative; flex: 1; min-width: 240px;
        display: flex; align-items: center;
        background: var(--bg-2); border: 1px solid var(--border-1);
        border-radius: var(--radius-md);
        transition: border-color .15s, box-shadow .15s;
      }
      .imp-url-wrap:focus-within {
        border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-glow);
      }
      .imp-url-prefix {
        padding: 0 10px; font-family: var(--font-mono); font-size: 0.75rem;
        color: var(--text-3); border-right: 1px solid var(--border-1);
        white-space: nowrap; flex-shrink: 0;
      }
      .imp-url-input {
        flex: 1; padding: 9px 32px 9px 10px;
        background: none; border: none; outline: none;
        font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-0);
      }
      .imp-url-input::placeholder { color: var(--text-3); }
      .imp-url-clear {
        position: absolute; right: 10px;
        background: none; border: none; color: var(--text-3);
        cursor: pointer; font-size: 0.68rem; padding: 2px;
        transition: color .15s;
      }
      .imp-url-clear:hover { color: var(--text-0); }
      .imp-url-hint {
        font-family: var(--font-mono); font-size: 0.72rem; color: var(--yellow);
      }

      /* ── Log wynikowy ── */
      .imp-log {
        display: flex; gap: 12px; align-items: flex-start;
        padding: 14px 16px; border-radius: var(--radius-md); border: 1px solid;
      }
      .imp-log--success {
        background: rgba(34,197,94,0.06); border-color: rgba(34,197,94,0.25);
      }
      .imp-log--error {
        background: rgba(239,68,68,0.06); border-color: rgba(239,68,68,0.25);
      }
      .imp-log-icon {
        font-size: 1rem; flex-shrink: 0; margin-top: 1px;
      }
      .imp-log--success .imp-log-icon { color: var(--green); }
      .imp-log--error   .imp-log-icon { color: var(--red); }

      .imp-log-body { flex: 1; display: flex; flex-direction: column; gap: 8px; }
      .imp-log-title {
        font-family: var(--font-display); font-weight: 700;
        font-size: 0.82rem; color: var(--text-0);
      }
      .imp-log-msg { font-size: 0.78rem; color: var(--text-2); }

      .imp-log-stats {
        display: flex; gap: 16px; flex-wrap: wrap; margin-top: 4px;
      }
      .imp-log-stat {
        display: flex; flex-direction: column; align-items: center; gap: 2px;
      }
      .imp-log-stat-val {
        font-family: var(--font-display); font-size: 1.4rem;
        font-weight: 800; line-height: 1;
      }
      .imp-log-stat-label {
        font-family: var(--font-mono); font-size: 0.62rem;
        color: var(--text-3); text-transform: uppercase; letter-spacing: .07em;
      }
      .imp-log-raw {
        font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-1);
        background: var(--bg-3); border-radius: var(--radius-sm);
        padding: 10px; overflow-x: auto; white-space: pre-wrap; word-break: break-all;
      }
    `}</style>
  )
}