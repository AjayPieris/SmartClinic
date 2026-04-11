import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import pusherClient from '../lib/pusherClient';
import { getMyNotificationsApi, markNotificationAsReadApi, markAllNotificationsAsReadApi } from '../api/notificationsApi';

export default function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // We need a stable ref so Pusher callback always has latest notifications array
  const notificationsRef = useRef(notifications);
  useEffect(() => {
    notificationsRef.current = notifications;
    setUnreadCount(notifications.filter(n => !n.isRead).length);
  }, [notifications]);

  // Load initial from HTTP
  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const data = await getMyNotificationsApi();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Subscribe to Pusher
  useEffect(() => {
    if (!user) return;
    
    // Using simple public channels for MVP. In production, use private channels!
    const channelName = `private-user-${user.userId}-notifications`;
    const channel = pusherClient.subscribe(channelName);

    channel.bind('new-notification', (data) => {
      // Normalize camelCase exactly like usePusherChat does!
      const normalized = Object.keys(data).reduce((acc, key) => {
        const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
        acc[camelKey] = data[key];
        return acc;
      }, {});

      setNotifications((prev) => [normalized, ...prev]);
    });

    return () => {
      channel.unbind('new-notification');
      pusherClient.unsubscribe(channelName);
    };
  }, [user]);

  const markAsRead = async (id) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    try {
      await markNotificationAsReadApi(id);
    } catch {
      // Revert if API fails
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: false } : n));
    }
  };

  const markAllAsRead = async () => {
    const previous = [...notifications];
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      await markAllNotificationsAsReadApi();
    } catch {
      setNotifications(previous);
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refresh: loadNotifications
  };
}
