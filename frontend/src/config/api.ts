export const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || 'http://localhost:3005/api/v1';

export function authHeaders(): HeadersInit {
  const token =
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
