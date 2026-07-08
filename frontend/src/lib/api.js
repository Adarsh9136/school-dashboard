import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('resonance_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      const url = err?.config?.url || '';
      // Don't force-logout on /auth/me — let AuthProvider decide.
      if (!url.includes('/auth/me') && !url.includes('/auth/login')) {
        localStorage.removeItem('resonance_token');
      }
    }
    return Promise.reject(err);
  }
);

export default api;
