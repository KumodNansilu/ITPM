import React, { useState, useEffect, useContext } from 'react';
import { appointmentService, subjectService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import styles from '../styles/inlineStyles';

const StudentAppointments = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' or 'booked'
  
  const [sessions, setSessions] = useState([]);
  const [bookedSessions, setBookedSessions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  const [filters, setFilters] = useState({
    subject: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const init = async () => {
      try {
        const subjectsRes = await subjectService.getAllSubjects();
        setSubjects(subjectsRes.data || []);
      } catch (error) {
        toast.error('Failed to load subjects');
      }
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (activeTab === 'browse') {
      fetchAvailableSessions();
    } else {
      fetchBookedSessions();
    }
  }, [activeTab, filters]);

  const fetchAvailableSessions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.date) params.append('date', filters.date);
      
      const response = await appointmentService.getAvailableSessions(
        filters.subject,
        filters.date
      );
      setSessions(response.data || []);
    } catch (error) {
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookedSessions = async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getStudentBookings();
      setBookedSessions(response.data || []);
    } catch (error) {
      toast.error('Failed to load your sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleBookSession = async (sessionId) => {
    try {
      const response = await appointmentService.bookSession({ sessionId });
      toast.success('Session booked successfully!');
      fetchAvailableSessions();
      fetchBookedSessions();
    } catch (error) {
      if (error.response?.data?.type === 'capacity_full') {
        toast.error('🔴 Session is full! No more slots available.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to book session');
      }
    }
  };

  const handleCancelBooking = async (appointmentId) => {
    if (!window.confirm('Cancel this booking?')) return;

    try {
      await appointmentService.cancelBooking(appointmentId);
      toast.success('Booking cancelled');
      fetchBookedSessions();
      fetchAvailableSessions();
    } catch (error) {
      toast.error('Failed to cancel booking');
    }
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && activeTab === 'browse') {
    return (
      <div style={styles.loading}>
        <svg style={styles.spinnerSvg} viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="20" fill="none" stroke="#e6e6e6" strokeWidth="5"></circle>
          <path d="M45 25a20 20 0 0 1-20 20" stroke="#667eea" strokeWidth="5" strokeLinecap="round" fill="none">
            <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite" />
          </path>
        </svg>
      </div>
    );
  }

  return (
    <div style={{ ...styles.container, marginTop: '30px' }}>
      <h1 style={{ marginBottom: '30px' }}>📅 Study Support Sessions</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '2px solid #e0e0e0' }}>
        <button
          onClick={() => setActiveTab('browse')}
          style={{
            ...styles.button,
            background: activeTab === 'browse' ? '#667eea' : '#999',
            borderRadius: 0,
            borderBottom: activeTab === 'browse' ? '4px solid #1976d2' : 'none'
          }}
        >
          🔍 Browse Sessions
        </button>
        <button
          onClick={() => setActiveTab('booked')}
          style={{
            ...styles.button,
            background: activeTab === 'booked' ? '#667eea' : '#999',
            borderRadius: 0,
            borderBottom: activeTab === 'booked' ? '4px solid #1976d2' : 'none'
          }}
        >
          ✅ My Bookings
        </button>
      </div>

      {activeTab === 'browse' && (
        <>
          {/* Filters */}
          <div style={{ ...styles.card, marginBottom: '30px' }}>
            <h3>Filter Sessions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div>
                <label style={styles.label}>Module/Subject</label>
                <select
                  style={styles.input}
                  value={filters.subject}
                  onChange={(e) => setFilters(p => ({ ...p, subject: e.target.value }))}
                >
                  <option value="">All Subjects</option>
                  {subjects.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={styles.label}>Date</label>
                <input
                  type="date"
                  style={styles.input}
                  value={filters.date}
                  onChange={(e) => setFilters(p => ({ ...p, date: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Sessions List */}
          <div style={{ display: 'grid', gap: '15px' }}>
            {sessions.length === 0 && (
              <div style={styles.alertInfo}>
                No sessions available for the selected filters.
              </div>
            )}

            {sessions.map(session => (
              <div key={session._id} style={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <h3>{session.tutor?.name}</h3>
                    <p><strong>📖 Module:</strong> {session.subject?.name}</p>
                    {session.topic && <p><strong>📝 Lesson:</strong> {session.topic?.name}</p>}
                    <p><strong>📅 Date & Time:</strong> {formatDateTime(session.sessionDate)}</p>
                    <p><strong>⏱️ Duration:</strong> {session.duration} minutes</p>
                    
                    {/* Capacity Display */}
                    <div style={{ marginTop: '10px' }}>
                      <p><strong>Capacity:</strong></p>
                      <div style={{
                        background: '#f0f0f0',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        marginTop: '5px'
                      }}>
                        <div
                          style={{
                            width: `${(session.bookedCount / session.maxCapacity) * 100}%`,
                            background: session.isFull ? '#d32f2f' : '#4caf50',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            transition: 'width 0.3s'
                          }}
                        >
                          {session.bookedCount}/{session.maxCapacity}
                        </div>
                        {session.isFull === false && (
                          <span style={{ marginLeft: '10px', fontSize: '12px', color: '#666' }}>
                            {session.availableSlots} slot{session.availableSlots !== 1 ? 's' : ''} left
                          </span>
                        )}
                      </div>
                    </div>

                    {session.meetingLink && <p><strong>🔗:</strong> <a href={session.meetingLink} target="_blank" rel="noreferrer">Join Link</a></p>}
                    {session.description && <p><strong>Notes:</strong> {session.description}</p>}
                  </div>

                  <button
                    onClick={() => handleBookSession(session._id)}
                    disabled={session.isFull}
                    style={{
                      ...styles.button,
                      background: session.isFull ? '#ccc' : '#4caf50',
                      cursor: session.isFull ? 'not-allowed' : 'pointer',
                      minWidth: '120px',
                      opacity: session.isFull ? 0.6 : 1
                    }}
                  >
                    {session.isFull ? '❌ FULL' : '✅ BOOK'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'booked' && (
        <div style={{ display: 'grid', gap: '15px' }}>
          {bookedSessions.length === 0 && (
            <div style={styles.alertInfo}>
              You haven't booked any sessions yet. Browse available sessions above.
            </div>
          )}

          {bookedSessions.map(booking => (
            <div key={booking._id} style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <h3>{booking.tutor?.name}</h3>
                  <p><strong>📖 Module:</strong> {booking.subject?.name}</p>
                  {booking.topic && <p><strong>📝 Lesson:</strong> {booking.topic?.name}</p>}
                  <p><strong>📅 Date & Time:</strong> {formatDateTime(booking.scheduledDate)}</p>
                  <p><strong>⏱️ Duration:</strong> {booking.duration} minutes</p>
                  <p><strong>📧 Tutor Email:</strong> {booking.tutor?.email}</p>
                  <p><strong>📱 Phone:</strong> {booking.tutor?.phone}</p>
                  {booking.meetingLink && <p><strong>🔗:</strong> <a href={booking.meetingLink} target="_blank" rel="noreferrer">Join Meeting</a></p>}
                  
                  <span style={{ ...styles.badge, ...styles.badgeSuccess, marginTop: '10px' }}>
                    ✓ Booked
                  </span>
                </div>

                <button
                  onClick={() => handleCancelBooking(booking._id)}
                  disabled={new Date() > new Date(booking.scheduledDate)}
                  style={{
                    ...styles.buttonDanger,
                    minWidth: '120px',
                    opacity: new Date() > new Date(booking.scheduledDate) ? 0.5 : 1,
                    cursor: new Date() > new Date(booking.scheduledDate) ? 'not-allowed' : 'pointer'
                  }}
                >
                  ❌ CANCEL
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentAppointments;
