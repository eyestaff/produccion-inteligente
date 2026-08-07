export const API_BASE = '/api';

export function getAuthToken() {
  return localStorage.getItem('auth_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('auth_token', token);
}

export function logout() {
  localStorage.removeItem('auth_token');
  window.location.href = '/login';
}

export async function fetchApi(path: string, options?: RequestInit) {
  const token = getAuthToken();
  if (!token && !path.startsWith('/auth')) {
    logout();
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
    logout();
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    let errorMsg = 'Error en la petición';
    try {
      const errorData = await response.json();
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
