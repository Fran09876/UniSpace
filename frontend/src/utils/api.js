// Obtenemos la URL del backend desde las variables de entorno de Vite.
// Si no existe (ej. en desarrollo local), usamos el localhost por defecto.
const API_DOMAIN = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Concatenamos el prefijo /api para mantener la estructura de tus endpoints
const BASE_URL = `${API_DOMAIN}/api`;

async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

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
