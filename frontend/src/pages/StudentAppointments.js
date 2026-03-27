import React, { useState, useEffect, useContext } from 'react';
import { appointmentService, subjectService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import styles from '../styles/inlineStyles';
import { showError, showSuccess, confirmDialog } from '../utils/alerts';
import { FaCalendarAlt, FaChalkboardTeacher, FaFilter } from 'react-icons/fa';

// Redirect existing toast calls to SweetAlert2.
const toast = {
  success: (message) => showSuccess(message),
  error: (message) => showError(message)
};

const renderStars = (rating) => '★'.repeat(Math.max(0, Math.min(5, rating))) + '☆'.repeat(5 - Math.max(0, Math.min(5, rating)));

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
  const [subjectSearch, setSubjectSearch] = useState('');
  const [feedbackTarget, setFeedbackTarget] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, comment: '' });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const filteredSubjects = subjects.filter((subject) => {
    if (!subjectSearch.trim()) return true;
    const query = subjectSearch.trim().toLowerCase();
    return (subject.name || '').toLowerCase().includes(query) || (subject.code || '').toLowerCase().includes(query);
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
    const confirmed = await confirmDialog({
      title: 'Cancel booking?',
      text: 'Are you sure you want to cancel this booking?',
      icon: 'warning',
      confirmButtonText: 'Yes, cancel'
    });
    if (!confirmed) return;

    try {
      await appointmentService.cancelBooking(appointmentId);
      toast.success('Booking cancelled');
      fetchBookedSessions();
      fetchAvailableSessions();
    } catch (error) {
      toast.error('Failed to cancel booking');
    }
  };

  const handleOpenFeedback = (booking) => {
    setFeedbackTarget(booking);
    setFeedbackForm({
      rating: booking?.feedback?.rating || 5,
      comment: booking?.feedback?.comment || ''
    });
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackTarget) return;

    setSubmittingFeedback(true);
    try {
      await appointmentService.submitSessionFeedback(feedbackTarget._id, {
        rating: Number(feedbackForm.rating),
        comment: feedbackForm.comment
      });
      toast.success('Feedback submitted successfully');
      setFeedbackTarget(null);
      setFeedbackForm({ rating: 5, comment: '' });
      fetchBookedSessions();
      fetchAvailableSessions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
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
      <div style={{ ...styles.card, background: 'linear-gradient(135deg, #0b1f3b 0%, #1e3a8a 100%)', color: 'white', marginBottom: '16px' }}>
        <h1 style={{ margin: 0, marginBottom: '6px' }}>Study Support Sessions</h1>
        <p style={{ margin: 0, opacity: 0.9 }}>Book tutor sessions, manage bookings, and share feedback after class.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '18px' }}>
        <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}><FaCalendarAlt /> Available: <strong>{sessions.length}</strong></div>
        <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}><FaChalkboardTeacher /> My bookings: <strong>{bookedSessions.length}</strong></div>
        <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}><FaFilter /> Subjects: <strong>{filteredSubjects.length}</strong></div>
      </div>
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
                <input
                  type="text"
                  style={styles.input}
                  placeholder="Search subjects quickly..."
                  value={subjectSearch}
                  onChange={(e) => setSubjectSearch(e.target.value)}
                />
                <select
                  style={styles.input}
                  value={filters.subject}
                  onChange={(e) => setFilters(p => ({ ...p, subject: e.target.value }))}
                >
                  <option value="">All Subjects</option>
                  {filteredSubjects.map(s => (
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
              <div style={{ ...styles.card, textAlign: 'center' }}>
                <h3 style={{ marginTop: 0 }}>No sessions available</h3>
                <p style={{ color: 'rgba(11,31,59,0.72)' }}>Try another subject or date to find available tutor sessions.</p>
              </div>
            )}

            {sessions.map(session => (
              <div key={session._id} style={styles.card}>
                {session.thumbnailUrl && (
                  <img
                    src={`http://localhost:5000${session.thumbnailUrl}`}
                    alt="Session thumbnail"
                    style={{
                      width: '100%',
                      height: '180px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      marginBottom: '12px'
                    }}
                  />
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <h3>{session.tutor?.name}</h3>
                    <p>
                      <strong>⭐ Tutor Rating:</strong> {Number(session.tutor?.ratingAverage || 0).toFixed(1)}
                      {' '}({session.tutor?.ratingCount || 0} reviews)
                    </p>
                    <p><strong>📖 Module:</strong> {session.subject?.name}</p>
                    {session.topic && <p><strong>📝 Lesson:</strong> {session.topic?.name}</p>}
                    <p><strong>📅 Date & Time:</strong> {formatDateTime(session.sessionDate)}</p>
                    <p><strong>⏱️ Duration:</strong> {session.duration} minutes</p>
                    <p>
                      <strong>Slot Status:</strong>{' '}
                      <span style={{ ...styles.badge, ...(session.isFull ? styles.badgeDanger : styles.badgeSuccess) }}>
                        {session.isFull ? 'Unavailable' : 'Available'}
                      </span>
                    </p>
                    
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
                    {session.isFull ? 'Unavailable' : 'Book Now'}
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
            <div style={{ ...styles.card, textAlign: 'center' }}>
              <h3 style={{ marginTop: 0 }}>No bookings yet</h3>
              <p style={{ color: 'rgba(11,31,59,0.72)' }}>Browse sessions and book your first support class.</p>
            </div>
          )}

          {bookedSessions.map(booking => (
            <div key={booking._id} style={styles.card}>
              {booking.tutorSession?.thumbnailUrl && (
                <img
                  src={`http://localhost:5000${booking.tutorSession.thumbnailUrl}`}
                  alt="Session thumbnail"
                  style={{
                    width: '100%',
                    height: '180px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    marginBottom: '12px'
                  }}
                />
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <h3>{booking.tutor?.name}</h3>
                  <p>
                    <strong>⭐ Tutor Rating:</strong> {Number(booking.tutor?.ratingAverage || 0).toFixed(1)}
                    {' '}({booking.tutor?.ratingCount || 0} reviews)
                  </p>
                  <p><strong>📖 Module:</strong> {booking.subject?.name}</p>
                  {booking.topic && <p><strong>📝 Lesson:</strong> {booking.topic?.name}</p>}
                  <p><strong>📅 Date & Time:</strong> {formatDateTime(booking.scheduledDate)}</p>
                  <p><strong>⏱️ Duration:</strong> {booking.duration} minutes</p>
                  <p><strong>📧 Tutor Email:</strong> {booking.tutor?.email}</p>
                  <p><strong>📱 Phone:</strong> {booking.tutor?.phone}</p>
                  {booking.meetingLink && <p><strong>🔗:</strong> <a href={booking.meetingLink} target="_blank" rel="noreferrer">Join Meeting</a></p>}

                  {booking.feedback?.rating && (
                    <div style={{ ...styles.alertInfo, marginTop: '10px', marginBottom: 0 }}>
                      <p><strong>Your Feedback:</strong> {renderStars(booking.feedback.rating)} ({booking.feedback.rating}/5)</p>
                      {booking.feedback.comment && <p>{booking.feedback.comment}</p>}
                    </div>
                  )}

                  <span
                    style={{
                      ...styles.badge,
                      ...(booking.status === 'completed' ? styles.badgeSuccess : styles.badgePrimary),
                      marginTop: '10px'
                    }}
                  >
                    {booking.status === 'completed' ? '✓ Completed' : '✓ Booked'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    onClick={() => handleCancelBooking(booking._id)}
                    disabled={new Date() > new Date(booking.scheduledDate) || booking.status !== 'booked'}
                    style={{
                      ...styles.buttonDanger,
                      minWidth: '120px',
                      opacity: new Date() > new Date(booking.scheduledDate) || booking.status !== 'booked' ? 0.5 : 1,
                      cursor: new Date() > new Date(booking.scheduledDate) || booking.status !== 'booked' ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    onClick={() => handleOpenFeedback(booking)}
                    disabled={!(booking.status === 'completed' || new Date() > new Date(booking.scheduledDate))}
                    style={{
                      ...styles.button,
                      minWidth: '120px',
                      background: booking.feedback?.rating ? '#1976d2' : '#4caf50',
                      opacity: !(booking.status === 'completed' || new Date() > new Date(booking.scheduledDate)) ? 0.5 : 1,
                      cursor: !(booking.status === 'completed' || new Date() > new Date(booking.scheduledDate)) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {booking.feedback?.rating ? 'Edit Feedback' : 'Add Feedback'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {feedbackTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div style={{ ...styles.card, width: '100%', maxWidth: '520px', marginBottom: 0 }}>
            <h2 style={{ marginTop: 0 }}>Session Feedback</h2>
            <p>
              <strong>Tutor:</strong> {feedbackTarget.tutor?.name} | <strong>Subject:</strong> {feedbackTarget.subject?.name}
            </p>
            <form onSubmit={handleSubmitFeedback}>
              <label style={styles.label}>Rating</label>
              <select
                style={styles.input}
                value={feedbackForm.rating}
                onChange={(e) => setFeedbackForm((prev) => ({ ...prev, rating: Number(e.target.value) }))}
              >
                <option value={5}>5 - Excellent</option>
                <option value={4}>4 - Very Good</option>
                <option value={3}>3 - Good</option>
                <option value={2}>2 - Fair</option>
                <option value={1}>1 - Poor</option>
              </select>

              <label style={styles.label}>Comments</label>
              <textarea
                style={{ ...styles.input, height: '100px' }}
                value={feedbackForm.comment}
                onChange={(e) => setFeedbackForm((prev) => ({ ...prev, comment: e.target.value }))}
                placeholder="Share your experience with this tutor"
              />

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button type="submit" style={styles.button} disabled={submittingFeedback}>
                  {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                </button>
                <button
                  type="button"
                  style={styles.buttonDanger}
                  onClick={() => {
                    setFeedbackTarget(null);
                    setFeedbackForm({ rating: 5, comment: '' });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAppointments;
