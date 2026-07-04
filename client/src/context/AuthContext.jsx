import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('hrms_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  // Re-validate the stored session on mount.
  useEffect(() => {
    const token = localStorage.getItem('hrms_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem('hrms_user', JSON.stringify(res.data.user));
      })
      .catch(() => {
        localStorage.removeItem('hrms_token');
        localStorage.removeItem('hrms_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  function persist(token, user) {
    localStorage.setItem('hrms_token', token);
    localStorage.setItem('hrms_user', JSON.stringify(user));
    setUser(user);
  }

  async function login(email, password) {
    const { data } = await api.post('/auth/signin', { email, password });
    persist(data.token, data.user);
    return data.user;
  }

  async function signup(payload) {
    const { data } = await api.post('/auth/signup', payload);
    persist(data.token, data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('hrms_token');
    localStorage.removeItem('hrms_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
