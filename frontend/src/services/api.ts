export const API_BASE = '/api';

export function getAuthToken() {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

export function setAuthToken(token: string) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem('auth_token', token);
}

export function getMustChangePassword(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem('must_change_password') === '1';
}

export function clearMustChangePassword() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem('must_change_password');
}

export async function login(email: string, passwordPlain: string) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: passwordPlain }),
  });

  const data = (await response.json()) as any;
  if (!response.ok) {
    throw new Error(data.error || 'Error de autenticación');
  }

  if (data.token) {
    setAuthToken(data.token);
    // Persist the must_change_password flag so the router can redirect
    if (data.user?.mustChangePassword) {
      localStorage.setItem('must_change_password', '1');
    } else {
      localStorage.removeItem('must_change_password');
    }
  }
  return data;
}

export async function logout() {
  if (typeof localStorage === 'undefined') return;

  const token = localStorage.getItem('auth_token');
  if (token) {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (e) {
      // Ignore network errors on logout
    }
  }

  localStorage.removeItem('auth_token');
  localStorage.removeItem('must_change_password');
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

export async function changePassword(
  newPassword: string,
  confirmPassword: string,
): Promise<{ success: boolean; message: string }> {
  return fetchApi('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ newPassword, confirmPassword }),
  });
}

export async function fetchApi(path: string, options?: RequestInit) {
  const token = getAuthToken();
  if (!token && !path.startsWith('/auth')) {
    await logout();
    throw new Error('No token found');
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...options?.headers,
    },
  });

  if (response.status === 401) {
    await logout();
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    let errorMsg = 'Error en la petición';
    try {
      const errorData = (await response.json()) as any;
      errorMsg = errorData.error || errorMsg;
    } catch (e) {
      /* ignore */
    }
    throw new Error(errorMsg);
  }

  // If response is null/empty (204 or just no content)
  if (response.status === 204) return null;

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
