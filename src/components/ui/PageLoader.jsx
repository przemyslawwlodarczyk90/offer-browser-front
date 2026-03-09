export default function PageLoader() {
  return (
    <>
      <div className="page-loader" role="status" aria-label="Ładowanie">
        <div className="pl-spinner" aria-hidden="true" />
        <span className="pl-text">Ładowanie…</span>
      </div>
      <style>{`
        .page-loader {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 12px; min-height: 60vh;
        }
        .pl-spinner {
          width: 28px; height: 28px;
          border: 2px solid var(--border-1);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin .7s linear infinite;
        }
        .pl-text {
          font-family: var(--font-mono);
          font-size: 0.75rem; color: var(--text-2);
          letter-spacing: 0.08em; text-transform: uppercase;
        }
      `}</style>
    </>
  )
}