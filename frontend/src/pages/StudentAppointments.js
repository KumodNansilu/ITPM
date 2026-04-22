import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { appointmentService, subjectService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import SessionChatPanel from '../components/SessionChatPanel';
import styles from '../styles/inlineStyles';
import { showError, showSuccess, confirmDialog } from '../utils/alerts';
import { FaCalendarAlt, FaChalkboardTeacher, FaFilter, FaSearch, FaCalendarWeek, FaClock, FaStar, FaComments, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaUser } from 'react-icons/fa';

// Redirect existing toast calls to SweetAlert2.
const toast = {
  success: (message) => showSuccess(message),
  error: (message) => showError(message)
};

const renderStars = (rating) => '★'.repeat(Math.max(0, Math.min(5, rating))) + '☆'.repeat(5 - Math.max(0, Math.min(5, rating)));

const toDateKey = (dateValue) => {
  if (!dateValue) return '';
  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) return '';
  const localDate = new Date(parsedDate.getTime() - parsedDate.getTimezoneOffset() * 60000);
  return localDate.toISOString().split('T')[0];
};

const formatShortDate = (dateValue) => {
  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) return '';
  return parsedDate.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

const formatTimeLabel = (dateValue) => {
  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) return '';
  return parsedDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const timeLabelToMinutes = (timeLabel) => {
  const match = (timeLabel || '').match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return Number.MAX_SAFE_INTEGER;

  let hours = Number(match[1]) % 12;
  const minutes = Number(match[2]);
  if (match[3].toUpperCase() === 'PM') {
    hours += 12;
  }

  return hours * 60 + minutes;
};

const getStatusMeta = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'completed':
      return { label: 'Completed', style: styles.badgeSuccess, icon: FaCheckCircle };
    case 'cancelled':
      return { label: 'Cancelled', style: styles.badgeDanger, icon: FaTimesCircle };
    case 'booked':
      return { label: 'Pending', style: styles.badgeWarning, icon: FaHourglassHalf };
    case 'pending':
      return { label: 'Pending', style: styles.badgeWarning, icon: FaHourglassHalf };
    case 'approved':
      return { label: 'Booked', style: styles.badgePrimary, icon: FaCheckCircle };
    default:
      return { label: status ? status.replace(/^[a-z]/, (character) => character.toUpperCase()) : 'Booked', style: styles.badgePrimary, icon: FaHourglassHalf };
  }
};

const getAvailabilityMeta = (session) => {
  if (session?.isFull) {
    return { label: 'Full', style: styles.badgeDanger, icon: FaTimesCircle };
  }

  if ((session?.availableSlots || 0) <= 2) {
    return { label: 'Few spots left', style: styles.badgeWarning, icon: FaHourglassHalf };
  }

  return { label: 'Available', style: styles.badgeSuccess, icon: FaCheckCircle };
};

const StudentAppointments = () => {
  const { user } = useContext(AuthContext);
  const todayLocalDate = toDateKey(new Date());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' or 'booked'
  
  const [sessions, setSessions] = useState([]);
  const [bookedSessions, setBookedSessions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  const [filters, setFilters] = useState({
    subject: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [tutorSearch, setTutorSearch] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [feedbackTarget, setFeedbackTarget] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, comment: '' });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [openChatSessionId, setOpenChatSessionId] = useState('');
  const [myBookingFilters, setMyBookingFilters] = useState({
    subject: '',
    date: ''
  });
  const filteredSubjects = subjects;

  const visibleSessions = useMemo(() => {
    const query = tutorSearch.trim().toLowerCase();

    return sessions.filter((session) => {
      const tutorName = (session.tutor?.name || '').toLowerCase();
      const timeLabel = formatTimeLabel(session.sessionDate);

      if (query && !tutorName.includes(query)) return false;
      if (selectedTimeSlot && timeLabel !== selectedTimeSlot) return false;

      return true;
    });
  }, [sessions, tutorSearch, selectedTimeSlot]);

  const availableTimeSlots = useMemo(() => {
    return [...new Set(sessions.map((session) => formatTimeLabel(session.sessionDate)).filter(Boolean))].sort((left, right) => timeLabelToMinutes(left) - timeLabelToMinutes(right));
  }, [sessions]);

  const weeklyAvailability = useMemo(() => {
    const currentDate = new Date();
    const dayOfWeek = currentDate.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() + mondayOffset);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const key = toDateKey(date);
      const sessionsForDay = visibleSessions.filter((session) => toDateKey(session.sessionDate) === key);

      return {
        label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index],
        date: key,
        count: sessionsForDay.length,
        hasAvailability: sessionsForDay.length > 0
      };
    });
  }, [visibleSessions]);

  const filteredBookedSessions = bookedSessions.filter((booking) => {
    if (myBookingFilters.subject && String(booking.subject?._id) !== myBookingFilters.subject) return false;
    if (myBookingFilters.date) {
      const bookingDate = toDateKey(booking.scheduledDate);
      if (bookingDate !== myBookingFilters.date) return false;
    }
    return true;
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

  const fetchAvailableSessions = useCallback(async () => {
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
  }, [filters.date, filters.subject]);

  const fetchBookedSessions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getStudentBookings();
      setBookedSessions(response.data || []);
    } catch (error) {
      toast.error('Failed to load your sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'browse') {
      fetchAvailableSessions();
    } else {
      fetchBookedSessions();
    }
  }, [activeTab, fetchAvailableSessions, fetchBookedSessions]);

  const handleBookSession = async (sessionId) => {
    try {
      await appointmentService.bookSession({ sessionId });
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

  if (loading) {
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
      <style>
        {`@keyframes supportHeaderFloat {
          0%, 100% {
            transform: translateY(0px);
            box-shadow: 0 12px 24px rgba(2,6,23,0.3);
          }
          50% {
            transform: translateY(-6px);
            box-shadow: 0 18px 30px rgba(2,6,23,0.4);
          }
        }

        @keyframes supportImagePulse {
          0%, 100% {
            transform: scale(1);
            filter: saturate(100%);
          }
          50% {
            transform: scale(1.03);
            filter: saturate(114%);
          }
        }`}
      </style>
      <div style={{ ...styles.card, background: 'linear-gradient(135deg, #0b1f3b 0%, #1e3a8a 100%)', color: 'white', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, marginBottom: '6px' }}>Study Support Sessions</h1>
            <p style={{ margin: 0, opacity: 0.9 }}>Book tutor sessions, manage bookings, and share feedback after class.</p>
          </div>
          <div
            style={{
              padding: '8px',
              borderRadius: '14px',
              border: '1px solid rgba(255,255,255,0.28)',
              background: 'rgba(255,255,255,0.14)',
              backdropFilter: 'blur(10px) saturate(145%)',
              WebkitBackdropFilter: 'blur(10px) saturate(145%)',
              boxShadow: '0 12px 24px rgba(2,6,23,0.3)',
              animation: 'supportHeaderFloat 5s ease-in-out infinite'
            }}
          >
            <img
              src="/image/SS.jpeg"
              alt="Study support sessions"
              style={{ width: '168px', height: '89px', objectFit: 'cover', borderRadius: '10px', display: 'block', animation: 'supportImagePulse 5s ease-in-out infinite' }}
            />
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '18px' }}>
        <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}><FaCalendarAlt /> <span>Available: <strong>{visibleSessions.length}</strong></span></div>
        <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}><FaChalkboardTeacher /> <span>My bookings: <strong>{bookedSessions.length}</strong></span></div>
        <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}><FaFilter /> <span>Subjects: <strong>{filteredSubjects.length}</strong></span></div>
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
          <div style={{ ...styles.card, marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <h3 style={{ marginTop: 0, marginBottom: '6px' }}>Find a session</h3>
                <p style={{ margin: 0, color: 'rgba(11,31,59,0.72)' }}>Filter by tutor, subject, date, and quick time-slot buttons.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTutorSearch('');
                  setSelectedTimeSlot('');
                  setFilters({ subject: '', date: todayLocalDate });
                }}
                style={{ ...styles.button, minWidth: '140px' }}
              >
                Reset Filters
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginTop: '18px' }}>
              <div>
                <label style={styles.label}>Search Tutor</label>
                <div style={{ position: 'relative' }}>
                  <FaSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type="text"
                    style={{ ...styles.input, paddingLeft: '40px', marginTop: 0 }}
                    placeholder="Search by tutor name"
                    value={tutorSearch}
                    onChange={(e) => setTutorSearch(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={styles.label}>Filter by subject</label>
                <select
                  style={{ ...styles.input, marginTop: 0 }}
                  value={filters.subject}
                  onChange={(e) => setFilters((p) => ({ ...p, subject: e.target.value }))}
                >
                  <option value="">All Subjects</option>
                  {filteredSubjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>{subject.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={styles.label}>Filter by date</label>
                <input
                  type="date"
                  style={{ ...styles.input, marginTop: 0 }}
                  value={filters.date}
                  min={todayLocalDate}
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    if (selectedDate && selectedDate < todayLocalDate) {
                      toast.error('Date cannot be before today');
                      return;
                    }
                    setFilters((p) => ({ ...p, date: selectedDate }));
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <FaClock color="#1e3a8a" />
                <strong>Quick time slots</strong>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedTimeSlot('')}
                  style={{
                    ...styles.button,
                    minWidth: '100px',
                    background: selectedTimeSlot ? '#e2e8f0' : 'linear-gradient(135deg, #0b3d91 0%, #1e40af 100%)',
                    color: selectedTimeSlot ? '#0b1f3b' : 'white',
                    boxShadow: selectedTimeSlot ? 'none' : styles.button.boxShadow
                  }}
                >
                  All Times
                </button>
                {availableTimeSlots.map((timeSlot) => (
                  <button
                    key={timeSlot}
                    type="button"
                    onClick={() => setSelectedTimeSlot(timeSlot)}
                    style={{
                      ...styles.button,
                      minWidth: '100px',
                      background: selectedTimeSlot === timeSlot ? '#0f766e' : '#eaf1ff',
                      color: selectedTimeSlot === timeSlot ? 'white' : '#1e3a8a',
                      boxShadow: selectedTimeSlot === timeSlot ? '0 12px 25px rgba(15,118,110,0.22)' : 'none'
                    }}
                  >
                    {timeSlot}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <FaCalendarWeek color="#1e3a8a" />
                <strong>Weekly availability</strong>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '10px' }}>
                {weeklyAvailability.map((day) => (
                  <div
                    key={day.label}
                    style={{
                      borderRadius: '14px',
                      padding: '12px 10px',
                      border: `1px solid ${day.hasAvailability ? 'rgba(22,163,74,0.2)' : 'rgba(148,163,184,0.2)'}`,
                      background: day.hasAvailability ? '#effaf3' : '#f8fafc',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontWeight: 800, color: '#0b1f3b' }}>{day.label}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(11,31,59,0.7)', marginTop: '4px' }}>{day.date}</div>
                    <div style={{ marginTop: '8px' }}>
                      <span style={{ ...styles.badge, ...(day.hasAvailability ? styles.badgeSuccess : styles.badgePrimary) }}>
                        {day.hasAvailability ? `✔ ${day.count}` : '—'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {visibleSessions.length === 0 && (
              <div style={{ ...styles.card, textAlign: 'center', marginBottom: 0 }}>
                <h3 style={{ marginTop: 0 }}>No sessions match your filters</h3>
                <p style={{ color: 'rgba(11,31,59,0.72)' }}>Try another tutor, subject, date, or time slot.</p>
              </div>
            )}

            {visibleSessions.map((session) => {
              const availabilityMeta = getAvailabilityMeta(session);
              const AvailabilityIcon = availabilityMeta.icon;

              return (
                <div key={session._id} style={{ ...styles.card, marginBottom: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                        <span style={{ ...styles.badge, ...styles.badgePrimary }}>{session.subject?.name || 'Subject'}</span>
                        <span style={{ ...styles.badge, ...(session.topic ? styles.badgeWarning : styles.badgePrimary) }}>{session.topic?.name || 'General support'}</span>
                      </div>
                      <h3 style={{ margin: 0, marginBottom: '8px' }}>{session.tutor?.name || 'Tutor'}</h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', color: 'rgba(11,31,59,0.78)' }}>
                        <span><FaStar color="#f59e0b" style={{ marginRight: '6px' }} />{Number(session.tutor?.ratingAverage || 0).toFixed(1)} ({session.tutor?.ratingCount || 0})</span>
                        <span><FaUser style={{ marginRight: '6px' }} />Tutor</span>
                      </div>
                    </div>

                    <span style={{ ...styles.badge, ...availabilityMeta.style, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <AvailabilityIcon /> {availabilityMeta.label}
                    </span>
                  </div>

                  {session.thumbnailUrl && (
                    <img
                      src={`http://localhost:5000${session.thumbnailUrl}`}
                      alt="Session thumbnail"
                      style={{ width: '100%', height: '170px', objectFit: 'cover', borderRadius: '14px' }}
                    />
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                    <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '12px' }}>
                      <div style={{ fontSize: '12px', color: 'rgba(11,31,59,0.68)', marginBottom: '4px' }}>Date</div>
                      <div style={{ fontWeight: 700 }}>{formatShortDate(session.sessionDate)}</div>
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '12px' }}>
                      <div style={{ fontSize: '12px', color: 'rgba(11,31,59,0.68)', marginBottom: '4px' }}>Time</div>
                      <div style={{ fontWeight: 700 }}>{formatTimeLabel(session.sessionDate)}</div>
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '12px' }}>
                      <div style={{ fontSize: '12px', color: 'rgba(11,31,59,0.68)', marginBottom: '4px' }}>Duration</div>
                      <div style={{ fontWeight: 700 }}>{session.duration} minutes</div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <strong>Capacity</strong>
                      <span style={{ color: 'rgba(11,31,59,0.7)' }}>{session.bookedCount}/{session.maxCapacity}</span>
                    </div>
                    <div style={{ background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden', height: '12px' }}>
                      <div
                        style={{
                          width: `${Math.min(100, (session.bookedCount / session.maxCapacity) * 100)}%`,
                          height: '100%',
                          background: session.isFull ? 'linear-gradient(135deg, #b91c1c 0%, #ef4444 100%)' : 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)'
                        }}
                      />
                    </div>
                    <div style={{ marginTop: '6px', fontSize: '12px', color: 'rgba(11,31,59,0.68)' }}>
                      {session.isFull ? 'No slots left' : `${session.availableSlots} slot${session.availableSlots === 1 ? '' : 's'} remaining`}
                    </div>
                  </div>

                  {session.description && (
                    <p style={{ margin: 0, color: 'rgba(11,31,59,0.8)' }}>{session.description}</p>
                  )}

                  {session.meetingLink && (
                    <div style={{ fontSize: '14px' }}>
                      <strong>Meeting link:</strong> <a href={session.meetingLink} target="_blank" rel="noreferrer">Join session</a>
                    </div>
                  )}

                  <button
                    onClick={() => handleBookSession(session._id)}
                    disabled={session.isFull}
                    style={{
                      ...styles.button,
                      background: session.isFull ? '#cbd5e1' : 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
                      opacity: session.isFull ? 0.7 : 1,
                      cursor: session.isFull ? 'not-allowed' : 'pointer',
                      minWidth: '140px',
                      alignSelf: 'flex-start'
                    }}
                  >
                    {session.isFull ? 'Unavailable' : 'Book Session'}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {activeTab === 'booked' && (
        <>
          {/* My Bookings Filters */}
          <div style={{ ...styles.card, marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <h3 style={{ marginTop: 0, marginBottom: '6px' }}>My Booked Sessions</h3>
                <p style={{ margin: 0, color: 'rgba(11,31,59,0.72)' }}>Track active bookings, open chat, leave feedback, or cancel future sessions.</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ ...styles.badge, ...styles.badgePrimary }}>Booked {bookedSessions.filter((booking) => booking.status === 'booked').length}</span>
                <span style={{ ...styles.badge, ...styles.badgeSuccess }}>Completed {bookedSessions.filter((booking) => booking.status === 'completed').length}</span>
                <span style={{ ...styles.badge, ...styles.badgeDanger }}>Cancelled {bookedSessions.filter((booking) => booking.status === 'cancelled').length}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginTop: '18px' }}>
              <div>
                <label style={styles.label}>Filter by subject</label>
                <select
                  style={{ ...styles.input, marginTop: 0 }}
                  value={myBookingFilters.subject}
                  onChange={(e) => setMyBookingFilters((p) => ({ ...p, subject: e.target.value }))}
                >
                  <option value="">All Subjects</option>
                  {filteredSubjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>{subject.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={styles.label}>Filter by date</label>
                <input
                  type="date"
                  style={{ ...styles.input, marginTop: 0 }}
                  value={myBookingFilters.date}
                  onChange={(e) => setMyBookingFilters((p) => ({ ...p, date: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {bookedSessions.length === 0 && (
              <div style={{ ...styles.card, textAlign: 'center', marginBottom: 0 }}>
                <h3 style={{ marginTop: 0 }}>No bookings yet</h3>
                <p style={{ color: 'rgba(11,31,59,0.72)' }}>Browse sessions and book your first support class.</p>
              </div>
            )}

            {bookedSessions.length > 0 && filteredBookedSessions.length === 0 && (
              <div style={{ ...styles.card, marginBottom: 0 }}>
                <div style={{ ...styles.alertInfo, marginBottom: 0 }}>No bookings match your filters.</div>
              </div>
            )}

            {filteredBookedSessions.map((booking) => {
              const statusMeta = getStatusMeta(booking.status);
              const StatusIcon = statusMeta.icon;
              const canCancel = new Date() <= new Date(booking.scheduledDate) && booking.status === 'booked';
              const canLeaveFeedback = booking.status === 'completed' || new Date() > new Date(booking.scheduledDate);

              return (
                <div key={booking._id} style={{ ...styles.card, marginBottom: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {booking.tutorSession?.thumbnailUrl && (
                    <img
                      src={`http://localhost:5000${booking.tutorSession.thumbnailUrl}`}
                      alt="Session thumbnail"
                      style={{ width: '100%', height: '170px', objectFit: 'cover', borderRadius: '14px' }}
                    />
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                        <span style={{ ...styles.badge, ...styles.badgePrimary }}>{booking.subject?.name || 'Subject'}</span>
                        {booking.topic && <span style={{ ...styles.badge, ...styles.badgeWarning }}>{booking.topic?.name}</span>}
                      </div>
                      <h3 style={{ margin: 0, marginBottom: '8px' }}>{booking.tutor?.name || 'Tutor'}</h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', color: 'rgba(11,31,59,0.78)' }}>
                        <span><FaStar color="#f59e0b" style={{ marginRight: '6px' }} />{Number(booking.tutor?.ratingAverage || 0).toFixed(1)} ({booking.tutor?.ratingCount || 0})</span>
                        <span><FaComments style={{ marginRight: '6px' }} />{booking.meetingLink ? 'Chat ready' : 'Chat available in session'}</span>
                      </div>
                    </div>

                    <span style={{ ...styles.badge, ...statusMeta.style, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <StatusIcon /> {statusMeta.label}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px' }}>
                    <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '12px' }}>
                      <div style={{ fontSize: '12px', color: 'rgba(11,31,59,0.68)', marginBottom: '4px' }}>Date</div>
                      <div style={{ fontWeight: 700 }}>{formatShortDate(booking.scheduledDate)}</div>
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '12px' }}>
                      <div style={{ fontSize: '12px', color: 'rgba(11,31,59,0.68)', marginBottom: '4px' }}>Time</div>
                      <div style={{ fontWeight: 700 }}>{formatTimeLabel(booking.scheduledDate)}</div>
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '12px' }}>
                      <div style={{ fontSize: '12px', color: 'rgba(11,31,59,0.68)', marginBottom: '4px' }}>Duration</div>
                      <div style={{ fontWeight: 700 }}>{booking.duration} minutes</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', fontSize: '14px' }}>
                    <div><strong>Tutor Email:</strong> {booking.tutor?.email}</div>
                    <div><strong>Phone:</strong> {booking.tutor?.phone || 'Not shared'}</div>
                    {booking.meetingLink && (
                      <div><strong>Join link:</strong> <a href={booking.meetingLink} target="_blank" rel="noreferrer">Open meeting</a></div>
                    )}
                  </div>

                  {booking.feedback?.rating ? (
                    <div style={{ ...styles.alertSuccess, marginBottom: 0 }}>
                      <strong>Your feedback:</strong> {renderStars(booking.feedback.rating)} ({booking.feedback.rating}/5)
                      {booking.feedback.comment && <p style={{ margin: '8px 0 0 0' }}>{booking.feedback.comment}</p>}
                    </div>
                  ) : null}

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleCancelBooking(booking._id)}
                      disabled={!canCancel}
                      style={{
                        ...styles.buttonDanger,
                        minWidth: '140px',
                        opacity: canCancel ? 1 : 0.5,
                        cursor: canCancel ? 'pointer' : 'not-allowed'
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      onClick={() => handleOpenFeedback(booking)}
                      disabled={!canLeaveFeedback}
                      style={{
                        ...styles.button,
                        minWidth: '140px',
                        background: booking.feedback?.rating ? '#0f766e' : '#1e3a8a',
                        opacity: canLeaveFeedback ? 1 : 0.5,
                        cursor: canLeaveFeedback ? 'pointer' : 'not-allowed'
                      }}
                    >
                      {booking.feedback?.rating ? 'Edit Feedback' : 'Leave Feedback'}
                    </button>

                    <button
                      onClick={() => setOpenChatSessionId((prev) => prev === String(booking.tutorSession?._id) ? '' : String(booking.tutorSession?._id || ''))}
                      disabled={!booking.tutorSession?._id}
                      style={{
                        ...styles.button,
                        minWidth: '170px',
                        background: openChatSessionId === String(booking.tutorSession?._id) ? '#0f766e' : 'linear-gradient(135deg, #0b3d91 0%, #1e40af 100%)'
                      }}
                    >
                      {openChatSessionId === String(booking.tutorSession?._id) ? 'Close Chat' : 'Join Session Chat'}
                    </button>
                  </div>

                  {openChatSessionId === String(booking.tutorSession?._id) && (
                    <div style={{ marginTop: '4px' }}>
                      <SessionChatPanel
                        sessionId={booking.tutorSession?._id}
                        currentUser={user}
                        headerTitle={`Session Chat - ${booking.subject?.name || 'Subject'}`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
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
          <div style={{ ...styles.card, width: '100%', maxWidth: '560px', marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ marginTop: 0, marginBottom: '8px' }}>Session Feedback</h2>
                <p style={{ margin: 0, color: 'rgba(11,31,59,0.72)' }}>
                  Share a quick rating and comment after the session.
                </p>
              </div>
              <span style={{ ...styles.badge, ...styles.badgePrimary }}>⭐ {feedbackForm.rating}/5</span>
            </div>
            <div style={{ marginTop: '14px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ ...styles.badge, ...styles.badgePrimary }}>{feedbackTarget.subject?.name || 'Subject'}</span>
              <span style={{ ...styles.badge, ...styles.badgeWarning }}>{feedbackTarget.tutor?.name || 'Tutor'}</span>
            </div>
            <form onSubmit={handleSubmitFeedback}>
              <label style={styles.label}>Rating</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {[1, 2, 3, 4, 5].map((ratingValue) => (
                  <button
                    key={ratingValue}
                    type="button"
                    onClick={() => setFeedbackForm((prev) => ({ ...prev, rating: ratingValue }))}
                    style={{
                      ...styles.button,
                      minWidth: '52px',
                      padding: '10px 12px',
                      background: feedbackForm.rating >= ratingValue ? 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' : '#e2e8f0',
                      color: feedbackForm.rating >= ratingValue ? '#0b1f3b' : '#334155',
                      boxShadow: 'none'
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
              <div style={{ color: 'rgba(11,31,59,0.72)', fontSize: '14px', marginBottom: '10px' }}>
                {renderStars(feedbackForm.rating)}
              </div>

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
