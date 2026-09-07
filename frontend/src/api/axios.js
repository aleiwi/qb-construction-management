import axios from 'axios';
import { toast } from '../utils/alerts';

// VITE_API_URL is injected at build time.
// For GitHub Pages: set via repo Variable/Secret VITE_API_URL (e.g. https://your-backend.koyeb.app/api/v1)
// For Docker/Caddy: VITE_API_URL=/api/v1 (same-origin via Caddy)
// Can be overridden at runtime via window.__QB_API_URL__ or localStorage QB_API_URL (see index.html)
const runtimeApiUrl = typeof window !== 'undefined' ? (window.__QB_API_URL__ || (()=>{ try{return localStorage.getItem('QB_API_URL')}catch{return null} })()) : undefined;
const envApiUrl = import.meta.env.VITE_API_URL;
// When built for GitHub Pages without VITE_API_URL, envApiUrl will be "" (empty) -> use runtime or fallback.
// Avoid localhost fallback on github.io (visitor's localhost is meaningless).
const isGhPagesHost = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
const fallbackUrl = isGhPagesHost ? '' : 'http://127.0.0.1:8000/api/v1';
const API_BASE = runtimeApiUrl || envApiUrl || fallbackUrl;

// Expose for debugging (window.__QB_API_BASE__)
if (typeof window !== 'undefined') window.__QB_API_BASE__ = API_BASE;
if (!API_BASE && isGhPagesHost) {
  console.warn('[QB] VITE_API_URL not configured for GitHub Pages. Landing page works without backend; login requires backend setup (Neon + Koyeb). See deploy/DEPLOYMENT.md & koyeb.yaml');
}

const api = axios.create({
  baseURL: API_BASE,
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '15000', 10),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    // Friendly guard: GitHub Pages without backend configured -> abort API calls that would 404 on Pages
    if (!API_BASE && typeof window !== 'undefined' && window.location.hostname.includes('github.io')) {
      // Allow the request to fail fast with a clear message; callers (login) will show error toast
      // For background checks (/auth/me) we just want silent failure, so mark it
      if (config.url && config.url.includes('/auth/me')) {
        return Promise.reject({ __qbNoBackend: true, message: 'Backend not configured for GitHub Pages' });
      }
    }
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Silent for background auth check when backend not configured on GitHub Pages
    if (error && error.__qbNoBackend) return Promise.reject(error);
    // Network error with no response and no backend on GH Pages -> helpful message (only for explicit actions like login)
    if (!error.response && !API_BASE && typeof window !== 'undefined' && window.location.hostname.includes('github.io')) {
      // Let callers handle; login page will show its own error. Don't toast globally to avoid spamming landing.
      return Promise.reject(error);
    }
    const originalRequest = error.config;
    if (error.response && error.response.status === 403) {
      const detail = error.response?.data?.error?.message;
      toast('error', 'لا توجد صلاحية', detail || 'ليس لديك صلاحية الوصول لهذا المورد');
      return Promise.reject(error);
    }
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE}/auth/refresh`, { refresh_token: refreshToken }, { timeout: 5000 });
          if (res.data.success) {
            const { access_token, refresh_token: new_refresh } = res.data.data;
            localStorage.setItem('access_token', access_token);
            if (new_refresh) {
              localStorage.setItem('refresh_token', new_refresh);
            }
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return api(originalRequest);
          }
        } catch (refreshErr) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
        }
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
