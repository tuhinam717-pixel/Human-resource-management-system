import axios from 'axios';

// Axios instance pointed at the API (proxied by Vite in dev).
const api = axios.create({ baseURL: '/api' });

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
