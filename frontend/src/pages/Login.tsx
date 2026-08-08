import { useState } from 'react';
import { login, getMustChangePassword } from '../services/api';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(email, password);
      // If the user must change their password, redirect to the change screen
      if (getMustChangePassword()) {
        window.location.href = '/change-password';
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setError(err.message || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg)' }}>
      <div className="card" style={{ width: 400, padding: '2rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Producción Inteligente</h2>
        
        {error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Correo electrónico</label>
            <input 
              type="email" 
              required
              value={email} 
              onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '6px' }}
              disabled={loading}
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Contraseña</label>
            <input 
              type="password" 
              required
              value={password} 
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '6px' }}
              disabled={loading}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', padding: '0.75rem', background: 'var(--text)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
