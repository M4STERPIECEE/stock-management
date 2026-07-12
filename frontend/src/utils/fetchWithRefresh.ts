/**
 * fetchWithRefresh — HTTP fetch wrapper that automatically retries on 401
 * by refreshing the JWT access token using the stored refresh token.
 *
 * Usage:
 *   const data = await fetchWithRefresh('http://localhost:3005/api/v1/products');
 *
 * The function:
 * 1. Reads access_token from localStorage or sessionStorage (respects "Remember Me")
 * 2. Makes the fetch request with the Authorization header
 * 3. If the response is 401, attempts to refresh the token via POST /auth/refresh
 * 4. On success, retries the original request with the new access token
 * 5. On refresh failure, clears tokens and redirects to /login
 */

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3005';

interface FetchWithRefreshOptions extends RequestInit {
  noAuth?: boolean;
}

export async function fetchWithRefresh(
  url: string,
  options: FetchWithRefreshOptions = {},
): Promise<Response> {
  const { noAuth, ...fetchOptions } = options;

  const fullUrl = url.startsWith('http') ? url : `${API_BASE}/api/v1${url.startsWith('/') ? url : `/${url}`}`;

  const getAccessToken = () =>
    localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

  const getRefreshToken = () =>
    localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');

  const setTokens = (access: string, refresh: string) => {
    if (localStorage.getItem('access_token')) {
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
    } else {
      sessionStorage.setItem('access_token', access);
      sessionStorage.setItem('refresh_token', refresh);
    }
  };

  const clearTokens = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
  };

  const headers = new Headers(fetchOptions.headers || {});
  if (!noAuth) {
    const token = getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }
  if (!headers.has('Content-Type') && !noAuth) {
    headers.set('Content-Type', 'application/json');
  }

  let response = await fetch(fullUrl, { ...fetchOptions, headers });

  if (response.status === 401 && !noAuth) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setTokens(data.access_token, data.refresh_token);

          const retryHeaders = new Headers(fetchOptions.headers || {});
          retryHeaders.set('Authorization', `Bearer ${data.access_token}`);
          if (!(fetchOptions.headers as Record<string, string>)?.['Content-Type']) {
            retryHeaders.set('Content-Type', 'application/json');
          }

          response = await fetch(fullUrl, { ...fetchOptions, headers: retryHeaders });
        } else {
          clearTokens();
          window.location.href = '/login';
          throw new Error('Session expired. Please log in again.');
        }
      } catch {
        clearTokens();
        window.location.href = '/login';
        throw new Error('Session expired. Please log in again.');
      }
    } else {
      clearTokens();
      window.location.href = '/login';
      throw new Error('Session expired. Please log in again.');
    }
  }

  return response;
}
