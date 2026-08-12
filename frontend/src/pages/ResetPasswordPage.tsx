import { useState } from 'react';
import { resetPassword } from '../services/api';

export function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const token =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('token') || ''
      : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('El enlace de recuperación no es válido.');
      return;
    }

    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, newPassword, confirmPassword);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'No se pudo restablecer la contraseña.');
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
        <div className="card" style={{ width: 420, padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>

          <h2 style={{ margin: '0 0 0.75rem' }}>Contraseña actualizada</h2>

          <p style={{ color: 'var(--muted)', lineHeight: 1.5 }}>
            Tu contraseña se ha actualizado correctamente.
          </p>

          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              window.location.href = '/login';
            }}
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '0.75rem',
              marginTop: '1rem',
            }}
          >
            Ir al inicio de sesión
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

          <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.35rem' }}>Nueva contraseña</h2>

          <p
            style={{
              margin: 0,
              color: 'var(--muted)',
              fontSize: '0.9rem',
            }}
          >
            Introduce tu nueva contraseña de acceso.
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
              htmlFor="reset-new-password"
              style={{
                display: 'block',
                fontWeight: 600,
                marginBottom: '0.4rem',
                fontSize: '0.875rem',
              }}
            >
              Nueva contraseña *
            </label>

            <input
              id="reset-new-password"
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              placeholder="Mín. 8 caracteres"
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '0.9rem',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="reset-confirm-password"
              style={{
                display: 'block',
                fontWeight: 600,
                marginBottom: '0.4rem',
                fontSize: '0.875rem',
              }}
            >
              Confirmar contraseña *
            </label>

            <input
              id="reset-confirm-password"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              placeholder="Repite la contraseña"
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
            {loading ? 'Guardando…' : 'Restablecer contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
