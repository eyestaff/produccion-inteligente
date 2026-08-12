import { useState } from 'react';
import { requestPasswordReset } from '../services/api';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await requestPasswordReset(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'No se pudo solicitar la recuperación');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: 'var(--bg)',
        }}
      >
        <div
          className="card"
          style={{ width: 420, padding: '2.5rem', textAlign: 'center' }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✉️</div>
          <h2 style={{ margin: '0 0 0.75rem' }}>Revisa tu correo</h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.5 }}>
            Si el correo está registrado, recibirás un enlace para restablecer
            tu contraseña.
          </p>
          <button
            type="button"
            onClick={() => {
              window.location.href = '/login';
            }}
            className="btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '0.75rem',
              marginTop: '1rem',
            }}
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'var(--bg)',
      }}
    >
      <div className="card" style={{ width: 420, padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'var(--accent)',
              color: 'white',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              marginBottom: '1rem',
            }}
          >
            PI
          </div>

          <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.35rem' }}>
            Recuperar contraseña
          </h2>

          <p
            style={{
              margin: 0,
              color: 'var(--muted)',
              fontSize: '0.9rem',
              lineHeight: 1.5,
            }}
          >
            Introduce tu correo electrónico y te enviaremos un enlace para
            crear una nueva contraseña.
          </p>
        </div>

        {error && (
          <div
            style={{
              background: '#fee2e2',
              color: '#991b1b',
              padding: '0.75rem',
              borderRadius: '6px',
              marginBottom: '1rem',
              fontSize: '0.875rem',
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          <div>
            <label
              htmlFor="reset-email"
              style={{
                display: 'block',
                fontWeight: 600,
                marginBottom: '0.4rem',
                fontSize: '0.875rem',
              }}
            >
              Correo electrónico
            </label>

            <input
              id="reset-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              placeholder="tu@email.com"
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '0.9rem',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '0.75rem',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Enviando…' : 'Enviar enlace'}
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => {
              window.location.href = '/login';
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              textDecoration: 'underline',
            }}
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    </div>
  );
}
