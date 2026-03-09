export function AuthStyles() {
  return (
    <style>{`
      .auth-card {
        background: #111;
        border-radius: 16px;
        padding: 2rem;
      }

      .auth-input {
        width: 100%;
        padding: 10px;
        border-radius: 8px;
        border: 1px solid #333;
      }

      .auth-btn {
        margin-top: 1rem;
        width: 100%;
        padding: 12px;
        background: orange;
        border: none;
        border-radius: 8px;
        font-weight: bold;
        cursor: pointer;
      }
    `}</style>
  )
}