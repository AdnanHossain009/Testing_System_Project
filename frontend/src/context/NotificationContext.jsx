import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const [notifications, setNotifications] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const resetNotifications = () => {
    setNotifications(null);
    setUnreadCount(0);
  };

  const refreshSummary = async () => {
    if (!isAuthenticated) {
      resetNotifications();
      return 0;
    }

    const response = await api.get('/notifications/summary');
    const nextUnreadCount = response.data.data.unreadCount || 0;
    setUnreadCount(nextUnreadCount);
    return nextUnreadCount;
  };

  const loadNotifications = async () => {
    if (!isAuthenticated) {
      resetNotifications();
      return [];
    }

    const response = await api.get('/notifications/me');
    const nextNotifications = response.data.data.notifications || [];
    setNotifications(nextNotifications);
    setUnreadCount(response.data.data.unreadCount || 0);
    return nextNotifications;
  };

  const markRead = async (id) => {
    const response = await api.patch(`/notifications/${id}/read`);
    const nextUnreadCount = response.data.data.unreadCount || 0;
    setUnreadCount(nextUnreadCount);
    setNotifications((current) =>
      Array.isArray(current)
        ? current.map((item) => (item._id === id ? { ...item, read: true } : item))
        : current
    );
  };

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    setUnreadCount(0);
    setNotifications((current) =>
      Array.isArray(current) ? current.map((item) => ({ ...item, read: true })) : current
    );
  };

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      resetNotifications();
      return;
    }

    refreshSummary().catch(() => {
      setUnreadCount(0);
    });
  }, [isAuthenticated, user?.id, location.pathname]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      refreshSummary,
      loadNotifications,
      markRead,
      markAllRead,
      resetNotifications
    }),
    [notifications, unreadCount, isAuthenticated, user?.id]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => useContext(NotificationContext);
