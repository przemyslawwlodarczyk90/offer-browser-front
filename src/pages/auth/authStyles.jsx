export function AuthStyles() {
  return (
    <style>{`
      .auth-card {
        background: var(--bg-1); border: 1px solid var(--border-1);
        border-radius: var(--radius-xl); padding: 2.2rem 2rem; width: 100%;
        opacity: 0; transform: translateY(14px);
        transition: opacity .35s ease, transform .35s ease;
        position: relative; overflow: hidden;
      }
      .auth-card::before {
        content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
        background: linear-gradient(90deg, transparent, var(--accent), transparent);
      }
      .auth-card--in { opacity: 1; transform: translateY(0); }

      .auth-card-header { margin-bottom: 1.6rem; }
      .auth-card-icon   { font-size: 1.4rem; color: var(--accent); margin-bottom: 6px; display: block; }
      .auth-card-title  { font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: var(--text-0); margin-bottom: 3px; }
      .auth-card-sub    { font-size: 0.8rem; color: var(--text-2); margin: 0; }

      .auth-form  { display: flex; flex-direction: column; gap: 1rem; }
      .auth-field { display: flex; flex-direction: column; gap: 5px; }
      .auth-label { font-size: 0.71rem; font-weight: 600; color: var(--text-1); letter-spacing: 0.07em; text-transform: uppercase; }

      .auth-input-wrap { position: relative; }
      .auth-input {
        width: 100%; padding: 10px 14px;
        background: var(--bg-2); border: 1px solid var(--border-1);
        border-radius: var(--radius-md);
        font-family: var(--font-mono); font-size: 0.84rem; color: var(--text-0);
        outline: none; transition: border-color .15s, box-shadow .15s;
      }
      .auth-input::placeholder { color: var(--text-3); }
      .auth-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); }
      .auth-input--padded { padding-right: 42px; }
      .auth-input--err  { border-color: var(--red) !important; }
      .auth-input--err:focus { box-shadow: 0 0 0 3px rgba(239,68,68,.15) !important; }

      .auth-eye {
        position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
        background: none; border: none; color: var(--text-2); cursor: pointer;
        font-size: 0.85rem; padding: 0; line-height: 1; transition: color .15s;
      }
      .auth-eye:hover { color: var(--accent); }

      .auth-err    { font-size: 0.71rem; color: var(--red); }
      .auth-helper { font-size: 0.71rem; color: var(--text-2); }

      /* Pasek siły hasła */
      .pw-strength { display: flex; flex-direction: column; gap: 4px; }
      .pw-bar  { height: 3px; border-radius: 2px; background: var(--bg-4); overflow: hidden; }
      .pw-fill { height: 100%; border-radius: 2px; transition: width .3s ease, background .3s ease; }
      .pw-label{ font-size: 0.67rem; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; }

      .auth-btn {
        margin-top: 4px; width: 100%; padding: 11px;
        background: var(--accent); color: #000;
        border: none; border-radius: var(--radius-md);
        font-family: var(--font-mono); font-size: 0.84rem; font-weight: 700;
        cursor: pointer; letter-spacing: .03em;
        transition: background .15s, box-shadow .15s, transform .1s;
        position: relative;
      }
      .auth-btn:hover:not(:disabled) { background: var(--accent-dim); box-shadow: var(--shadow-accent); }
      .auth-btn:active:not(:disabled){ transform: scale(.99); }
      .auth-btn:disabled { opacity: .5; cursor: not-allowed; }
      .auth-btn-spin {
        display: inline-block; width: 15px; height: 15px;
        border: 2px solid transparent; border-top-color: #000;
        border-radius: 50%; animation: spin .6s linear infinite; vertical-align: middle;
      }

      .auth-divider { display: flex; align-items: center; gap: 10px; margin: 1.2rem 0 .8rem; }
      .auth-divider-line { flex: 1; height: 1px; background: var(--border-1); }
      .auth-divider-text { font-size: 0.69rem; color: var(--text-3); letter-spacing: .08em; text-transform: uppercase; }

      .auth-switch { text-align: center; font-size: 0.8rem; color: var(--text-2); margin: 0; }
      .auth-link   { color: var(--accent); font-weight: 600; text-decoration: none; transition: color .15s; }
      .auth-link:hover { color: var(--text-0); }

      .auth-banner { border-radius: var(--radius-md); padding: 1rem 1.2rem; margin-bottom: 1rem; font-size: .82rem; line-height: 1.5; }
      .auth-banner--success { background: rgba(34,197,94,.1);  border: 1px solid rgba(34,197,94,.3);  color: #22c55e; }
      .auth-banner--error   { background: rgba(239,68,68,.1);  border: 1px solid rgba(239,68,68,.3);  color: var(--red); }
      .auth-banner--info    { background: var(--accent-glow);  border: 1px solid var(--border-0);     color: var(--accent); }
      .auth-banner-icon { font-size: 1.2rem; margin-bottom: 4px; display: block; }
    `}</style>
  )
}