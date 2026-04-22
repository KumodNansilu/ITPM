import React, { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { appointmentService } from '../services/api';
import styles from '../styles/inlineStyles';
import { showError } from '../utils/alerts';

const SOCKET_URL = 'http://localhost:5000';

const formatChatTime = (dateValue) => {
  if (!dateValue) return '';
  return new Date(dateValue).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const SessionChatPanel = ({ sessionId, currentUser, headerTitle = 'Live Chat' }) => {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState('');
  const [editingText, setEditingText] = useState('');
  const [presence, setPresence] = useState({ tutorOnline: false, tutorId: '', activeUserIds: [] });

  const socketRef = useRef(null);
  const listRef = useRef(null);

  const currentUserId = String(currentUser?._id || currentUser?.id || '');

  const isCurrentUserOnline = useMemo(() => {
    return presence.activeUserIds.includes(currentUserId);
  }, [presence.activeUserIds, currentUserId]);

  useEffect(() => {
    if (!sessionId) return;

    const loadHistory = async () => {
      try {
        setLoading(true);
        const [messagesRes, presenceRes] = await Promise.all([
          appointmentService.getSessionChatMessages(sessionId),
          appointmentService.getSessionChatPresence(sessionId)
        ]);
        setMessages(messagesRes.data || []);
        setPresence(presenceRes.data || { tutorOnline: false, tutorId: '', activeUserIds: [] });
      } catch (error) {
        showError(error.response?.data?.message || 'Failed to load session chat');
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token }
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('chat:join_session', { sessionId });
    });

    socket.on('chat:new_message', (payload) => {
      if (String(payload?.session) !== String(sessionId)) return;
      setMessages((prev) => [...prev, payload]);
    });

    socket.on('chat:presence', (payload) => {
      if (String(payload?.sessionId) !== String(sessionId)) return;
      setPresence({
        tutorOnline: Boolean(payload?.tutorOnline),
        tutorId: String(payload?.tutorId || ''),
        activeUserIds: Array.isArray(payload?.activeUserIds) ? payload.activeUserIds : []
      });
    });

    socket.on('chat:message_updated', (payload) => {
      if (String(payload?.session) !== String(sessionId)) return;
      setMessages((prev) => prev.map((message) => (
        message._id === payload._id ? payload : message
      )));
    });

    socket.on('chat:message_deleted', (payload) => {
      if (String(payload?.sessionId) !== String(sessionId)) return;
      setMessages((prev) => prev.filter((message) => message._id !== payload?.messageId));
      setEditingMessageId((prev) => {
        if (prev === payload?.messageId) {
          setEditingText('');
          return '';
        }
        return prev;
      });
    });

    socket.on('chat:error', (payload) => {
      showError(payload?.message || 'Chat error');
    });

    return () => {
      socket.emit('chat:leave_session', { sessionId });
      socket.disconnect();
    };
  }, [sessionId]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || !socketRef.current) return;

    socketRef.current.emit('chat:send_message', {
      sessionId,
      text
    });
    setInputText('');
  };

  const handleEditMessage = async (messageId) => {
    const text = editingText.trim();
    if (!text) return;

    try {
      const response = await appointmentService.editSessionChatMessage(messageId, { text });
      setMessages((prev) => prev.map((message) => (
        message._id === messageId ? response.data : message
      )));
      setEditingMessageId('');
      setEditingText('');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to edit message');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    const confirmed = window.confirm('Delete this message?');
    if (!confirmed) return;

    try {
      await appointmentService.deleteSessionChatMessage(messageId);
      setMessages((prev) => prev.filter((message) => message._id !== messageId));
      if (editingMessageId === messageId) {
        setEditingMessageId('');
        setEditingText('');
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to delete message');
    }
  };

  const isTutorView = currentUser?.role === 'tutor';
  const hasActiveStudent = presence.activeUserIds.some((userId) => String(userId) !== String(presence.tutorId));

  return (
    <div style={{ ...styles.card, marginBottom: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <h3 style={{ margin: 0 }}>{headerTitle}</h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {isTutorView ? (
            <span style={{ ...styles.badge, ...(hasActiveStudent ? styles.badgeSuccess : styles.badgePrimary) }}>
              Students: {hasActiveStudent ? 'Active' : 'Offline'}
            </span>
          ) : (
            <span style={{ ...styles.badge, ...(presence.tutorOnline ? styles.badgeSuccess : styles.badgeDanger) }}>
              Tutor: {presence.tutorOnline ? 'Online' : 'Offline'}
            </span>
          )}
          <span style={{ ...styles.badge, ...(isCurrentUserOnline ? styles.badgeSuccess : styles.badgePrimary) }}>
            You: {isCurrentUserOnline ? 'Active' : 'Idle'}
          </span>
        </div>
      </div>

      <div
        ref={listRef}
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          height: '260px',
          overflowY: 'auto',
          padding: '10px',
          marginBottom: '10px',
          background: '#f8fafc'
        }}
      >
        {loading ? (
          <p style={{ margin: 0, color: '#64748b' }}>Loading chat...</p>
        ) : messages.length === 0 ? (
          <p style={{ margin: 0, color: '#64748b' }}>No messages yet. Start the conversation.</p>
        ) : (
          messages.map((message) => {
            const isOwn = String(message?.sender?._id) === currentUserId;
            const isEditing = editingMessageId === message._id;

            return (
              <div
                key={message._id}
                style={{
                  marginBottom: '10px',
                  background: isOwn ? '#dbeafe' : '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ color: '#0f172a' }}>{message?.sender?.name || 'User'}</strong>
                  <small style={{ color: '#64748b' }}>{formatChatTime(message.createdAt)}</small>
                </div>

                {isEditing ? (
                  <div style={{ marginTop: '6px' }}>
                    <input
                      type="text"
                      style={styles.input}
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button type="button" style={{ ...styles.button, padding: '6px 10px' }} onClick={() => handleEditMessage(message._id)}>
                        Save
                      </button>
                      <button type="button" style={{ ...styles.buttonDanger, padding: '6px 10px' }} onClick={() => { setEditingMessageId(''); setEditingText(''); }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p style={{ margin: '6px 0', whiteSpace: 'pre-wrap', color: '#1e293b' }}>
                    {message.text}
                    {message.editedAt ? <span style={{ color: '#64748b', marginLeft: '6px' }}>(edited)</span> : null}
                  </p>
                )}

                {isOwn && !isEditing && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      style={{ ...styles.button, padding: '4px 8px', fontSize: '12px' }}
                      onClick={() => {
                        setEditingMessageId(message._id);
                        setEditingText(message.text || '');
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      style={{ ...styles.buttonDanger, padding: '4px 8px', fontSize: '12px' }}
                      onClick={() => handleDeleteMessage(message._id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          style={styles.input}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button type="button" style={styles.button} onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default SessionChatPanel;
