import { useState } from 'react';
import { changePassword, clearMustChangePassword, logout } from '../services/api';

interface Props {
  /** If true, this is a forced first-login flow. Shows different copy. */
  forced?: boolean;
}

export function ChangePasswordPage({ forced = false }: Props) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateClient = (): string | null => {
    if (!newPassword) return 'La nueva contraseña es obligatoria';
    if (newPassword.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
    if (newPassword !== confirmPassword) return 'Las contraseñas no coinciden';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateClient();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await changePassword(newPassword, confirmPassword);
      clearMustChangePassword();
      setSuccess(true);
      // Brief pause so the user sees the success state, then redirect
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error al cambiar la contraseña');
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
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ margin: '0 0 0.5rem' }}>Contraseña actualizada</h2>
          <p style={{ color: 'var(--muted)', margin: '0 0 1.5rem' }}>Redirigiendo al dashboard…</p>
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
        {/* Header */}
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
            {forced ? 'Establece tu contraseña' : 'Cambiar contraseña'}
          </h2>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>
            {forced
              ? 'Por seguridad, debes crear una contraseña personal antes de continuar.'
              : 'Introduce tu nueva contraseña de acceso.'}
          </p>
        </div>

        {/* Error banner */}
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
          style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >
          {/* New password */}
          <div>
            <label
              htmlFor="new-password"
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
              id="new-password"
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

          {/* Confirm password */}
          <div>
            <label
              htmlFor="confirm-password"
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
              id="confirm-password"
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

          {/* Password strength indicator */}
          {newPassword.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', marginTop: '-0.5rem' }}>
              {[
                newPassword.length >= 8,
                /[A-Z]/.test(newPassword),
                /[0-9]/.test(newPassword),
                /[^a-zA-Z0-9]/.test(newPassword),
              ].map((met, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    background: met ? '#10b981' : 'var(--border)',
                    transition: 'background 0.2s',
                  }}
                />
              ))}
            </div>
          )}

          {/* Submit */}
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
            {loading ? 'Guardando…' : forced ? 'Establecer contraseña' : 'Cambiar contraseña'}
          </button>
        </form>

        {/* Escape hatch: log out */}
        <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => logout()}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              textDecoration: 'underline',
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
