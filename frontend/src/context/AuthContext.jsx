import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('obe_token'));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('obe_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const verify = async () => {
      if (!token) return;
      try {
        const response = await api.get('/auth/me');
        setUser(response.data.data.user);
        localStorage.setItem('obe_user', JSON.stringify(response.data.data.user));
      } catch (error) {
        logout();
      }
    };

    verify();
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const payload = response.data.data;
      setToken(payload.token);
      setUser(payload.user);
      localStorage.setItem('obe_token', payload.token);
      localStorage.setItem('obe_user', JSON.stringify(payload.user));
      return { ok: true, role: payload.user.role };
    } catch (error) {
      return {
        ok: false,
        message: error?.response?.data?.message || 'Login failed.'
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('obe_token');
    localStorage.removeItem('obe_user');
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token),
      login,
      logout
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
