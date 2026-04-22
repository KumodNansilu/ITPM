import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../services/api';
import styles from '../styles/inlineStyles';
import { showError, showSuccess, confirmDialog } from '../utils/alerts';
import { formatDistanceToNow } from 'date-fns';

const toast = {
  success: (message) => showSuccess(message),
  error: (message) => showError(message)
};

const Notifications = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications();
      setNotifications(response.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const refreshNotification = async (notificationId, updater) => {
    setNotifications((prev) => prev.map((notification) => (
      notification._id === notificationId ? updater(notification) : notification
    )));
  };

  const handleMarkRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      await refreshNotification(notificationId, (notification) => ({ ...notification, isRead: true }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark as read');
    }
  };

  const handleMarkUnread = async (notificationId) => {
    try {
      await notificationService.markAsUnread(notificationId);
      await refreshNotification(notificationId, (notification) => ({ ...notification, isRead: false }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark as unread');
    }
  };

  const handleDelete = async (notificationId) => {
    const confirmed = await confirmDialog({
      title: 'Delete notification?',
      text: 'This will remove the notification from your list.',
      icon: 'warning',
      confirmButtonText: 'Yes, delete'
    });
    if (!confirmed) return;

    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((notification) => notification._id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete notification');
    }
  };

  const handleOpen = async (notification) => {
    if (!notification.isRead) {
      await handleMarkRead(notification._id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark all as read');
    }
  };

  return (
    <div style={{ ...styles.container, marginTop: '30px' }}>
      <div style={{ ...styles.card, background: 'linear-gradient(135deg, #0b1f3b 0%, #1e3a8a 100%)', color: 'white', marginBottom: '16px' }}>
        <h1 style={{ margin: 0, marginBottom: '6px' }}>Notifications</h1>
        <p style={{ margin: 0, opacity: 0.9 }}>Latest updates from your sessions, Q&A, appointments, and MCQ results.</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0 }}>Inbox</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button type="button" style={styles.button} onClick={fetchNotifications}>Refresh</button>
          <button type="button" style={styles.button} onClick={markAllAsRead}>Mark All Read</button>
        </div>
      </div>

      {loading ? (
        <div style={styles.card}>Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div style={{ ...styles.card, textAlign: 'center' }}>
          <h3 style={{ marginTop: 0 }}>No notifications yet</h3>
          <p style={{ color: '#64748b' }}>You’ll see session, Q&A, and MCQ updates here.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {notifications.map((notification) => (
            <div
              key={notification._id}
              style={{
                ...styles.card,
                marginBottom: 0,
                border: notification.isRead ? '1px solid #e2e8f0' : '2px solid #1d4ed8',
                background: notification.isRead ? '#ffffff' : '#eff6ff',
                cursor: 'pointer'
              }}
              onClick={() => handleOpen(notification)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ marginTop: 0, marginBottom: '6px' }}>{notification.title}</h3>
                  <p style={{ margin: 0, color: '#334155' }}>{notification.message}</p>
                  <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '12px' }}>
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <span style={{ ...styles.badge, ...(notification.isRead ? styles.badgePrimary : styles.badgeDanger) }}>
                  {notification.isRead ? 'Read' : 'Unread'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }} onClick={(e) => e.stopPropagation()}>
                {!notification.isRead ? (
                  <button type="button" style={styles.button} onClick={() => handleMarkRead(notification._id)}>Mark Read</button>
                ) : (
                  <button type="button" style={styles.button} onClick={() => handleMarkUnread(notification._id)}>Mark Unread</button>
                )}
                <button type="button" style={styles.buttonDanger} onClick={() => handleDelete(notification._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
