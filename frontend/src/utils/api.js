// src/utils/api.js
const BASE_URL = 'http://localhost:4000/api';

async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

  // Solo limpiar sesión en 401 (token inválido) o 403 (sin permisos)
  // 404 NO debe limpiar sesión — es un error de ruta, no de autenticación
  if (res.status === 401 || res.status === 403) {
    localStorage.clear();
    window.location.replace('/');
    throw new Error('Sesión expirada. Redirigiendo...');
  }

  return res;
}

export const api = {
  get:    (endpoint)       => apiFetch(endpoint),
  post:   (endpoint, body) => apiFetch(endpoint, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (endpoint, body) => apiFetch(endpoint, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: (endpoint)       => apiFetch(endpoint, { method: 'DELETE' }),
};