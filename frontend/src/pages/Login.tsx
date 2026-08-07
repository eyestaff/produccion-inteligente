import { useState } from 'react';
import { setAuthToken } from '../services/api';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // En la v1 mockearemos la auth con el token esperado por RequestContext.
    // Ej: "1-1" (companyId=1, userId=1)
    setAuthToken('1-1');
    window.location.href = '/dashboard';
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg)' }}>
      <div className="card" style={{ width: 400, padding: '2rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Producción Inteligente</h2>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Usuario</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '6px' }}
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Contraseña</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '6px' }}
            />
          </div>
          <button type="submit" style={{ width: '100%', padding: '0.75rem', background: 'var(--text)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
}
