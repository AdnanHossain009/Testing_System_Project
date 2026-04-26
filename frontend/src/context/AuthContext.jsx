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

  const storeSession = (payload) => {
    setToken(payload.token);
    setUser(payload.user);
    localStorage.setItem('obe_token', payload.token);
    localStorage.setItem('obe_user', JSON.stringify(payload.user));
  };

  const syncUser = (nextUser) => {
    setUser(nextUser);
    localStorage.setItem('obe_user', JSON.stringify(nextUser));
  };

  const refreshUser = async () => {
    const response = await api.get('/auth/me');
    syncUser(response.data.data.user);
    return response.data.data.user;
  };

  useEffect(() => {
    const verify = async () => {
      if (!token) return;
      try {
        await refreshUser();
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
      storeSession(payload);
      return {
        ok: true,
        role: payload.user.role,
        dashboard: payload.user.preferredDashboard
      };
    } catch (error) {
      return {
        ok: false,
        message: error?.response?.data?.message || 'Login failed.'
      };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/signup', data);
      const payload = response.data.data;

      if (payload.token && payload.user) {
        storeSession(payload);
      }

      return {
        ok: true,
        role: payload.user?.role,
        dashboard: payload.user?.preferredDashboard,
        requiresApproval: Boolean(payload.requiresApproval),
        message: response.data.message
      };
    } catch (error) {
      return {
        ok: false,
        message: error?.response?.data?.message || 'Signup failed.'
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
      signup,
      syncUser,
      refreshUser,
      logout
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
