import axios from 'axios';

// API base URL:
//  - Production build reads VITE_API_URL (the deployed backend, e.g. Render).
//  - Local dev falls back to '/api', which Vite proxies to localhost:5000.
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL });

// Attach the JWT to every request if present.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hrms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear the session and bounce to login.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !location.pathname.startsWith('/login') && !location.pathname.startsWith('/signup')) {
      localStorage.removeItem('hrms_token');
      localStorage.removeItem('hrms_user');
      location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
