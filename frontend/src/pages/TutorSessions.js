import React, { useState, useEffect, useContext, useMemo } from 'react';
import { appointmentService, subjectService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import styles from '../styles/inlineStyles';
import { showError, showSuccess, confirmDialog } from '../utils/alerts';
import { FaCalendarAlt, FaPlusCircle, FaStar, FaUsers } from 'react-icons/fa';

const toast = {
  success: (message) => showSuccess(message),
  error: (message) => showError(message)
};

const renderStars = (rating) => {
  const safeRating = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return '★'.repeat(safeRating) + '☆'.repeat(5 - safeRating);
};

const parseTopicFromDescription = (description) => {
  if (!description) return '';
  const match = String(description).match(/^Lesson\/Topic:\s*(.+)$/m);
  return match ? match[1].trim() : '';
};

const stripTopicPrefixFromDescription = (description) => {
  if (!description) return '';
  return String(description).replace(/^Lesson\/Topic:\s*.+\n?\n?/m, '').trim();
};

const TutorSessions = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sessions');

  const [sessions, setSessions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionStudents, setSessionStudents] = useState([]);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [tutorAppointments, setTutorAppointments] = useState([]);

  const [createForm, setCreateForm] = useState({
    subject: '',
    topicText: '',
    sessionDate: '',
    sessionTime: '09:00',
    duration: 60,
    maxCapacity: 10,
    meetingLink: '',
    description: ''
  });

  const [editForm, setEditForm] = useState({
    sessionDate: '',
    sessionTime: '',
    maxCapacity: '',
    meetingLink: '',
    description: ''
  });

  const feedbackBySessionId = useMemo(() => {
    const map = {};

    (tutorAppointments || []).forEach((appointment) => {
      const sessionIdRaw = appointment?.tutorSession?._id || appointment?.tutorSession;
      const sessionId = sessionIdRaw ? String(sessionIdRaw) : '';
      const rating = Number(appointment?.feedback?.rating);
      if (!sessionId || !Number.isFinite(rating) || rating < 1 || rating > 5) return;

      if (!map[sessionId]) {
        map[sessionId] = {
          total: 0,
          count: 0,
          items: []
        };
      }

      map[sessionId].total += rating;
      map[sessionId].count += 1;
      map[sessionId].items.push({
        appointmentId: appointment._id,
        rating,
        comment: appointment?.feedback?.comment || '',
        submittedAt: appointment?.feedback?.submittedAt,
        studentName: appointment?.student?.name || 'Student'
      });
    });

    Object.values(map).forEach((entry) => {
      entry.average = entry.count > 0 ? Number((entry.total / entry.count).toFixed(1)) : 0;
      entry.items.sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
    });

    return map;
  }, [tutorAppointments]);

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
    if (activeTab === 'sessions') {
      fetchTutorSessions();
    }
  }, [activeTab]);

  const fetchTutorSessions = async () => {
    setLoading(true);
    try {
      const sessionsRes = await appointmentService.getTutorSessions();
      setSessions(sessionsRes.data || []);
    } catch (error) {
      setSessions([]);
      toast.error('Failed to load sessions');
    }

    try {
      const appointmentsRes = await appointmentService.getTutorAppointments();
      setTutorAppointments(appointmentsRes.data || []);
    } catch (error) {
      setTutorAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();

    if (!createForm.subject || !createForm.sessionDate || !createForm.sessionTime) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const dateTime = new Date(`${createForm.sessionDate}T${createForm.sessionTime}`);
      const finalDescription = createForm.topicText.trim()
        ? `Lesson/Topic: ${createForm.topicText.trim()}${createForm.description ? `\n\n${createForm.description}` : ''}`
        : createForm.description;

      const payload = {
        subject: createForm.subject,
        sessionDate: dateTime.toISOString(),
        duration: Number(createForm.duration) || 60,
        maxCapacity: Number(createForm.maxCapacity) || 10
      };

      if (createForm.meetingLink) payload.meetingLink = createForm.meetingLink;
      if (finalDescription) payload.description = finalDescription;

      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        formData.append(key, value);
      });
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }

      await appointmentService.createTutorSession(formData);

      toast.success('Session created successfully');
      setCreateForm({
        subject: '',
        topicText: '',
        sessionDate: '',
        sessionTime: '09:00',
        duration: 60,
        maxCapacity: 10,
        meetingLink: '',
        description: ''
      });
      setThumbnailFile(null);
      setActiveTab('sessions');
      fetchTutorSessions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create session');
    }
  };

  const handleSelectSession = async (session) => {
    try {
      setLoading(true);
      const response = await appointmentService.getTutorSessionDetails(session._id);
      setSelectedSession(response.data.session);
      setSessionStudents(response.data.bookings || []);
      setShowEditForm(false);
    } catch (error) {
      toast.error('Failed to load session details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSession = async (e) => {
    e.preventDefault();

    try {
      const updateData = { ...editForm };
      if (editForm.sessionDate && editForm.sessionTime) {
        const dateTime = new Date(`${editForm.sessionDate}T${editForm.sessionTime}`);
        updateData.sessionDate = dateTime.toISOString();
        delete updateData.sessionTime;
      }

      await appointmentService.updateTutorSession(selectedSession._id, updateData);
      toast.success('Session updated successfully');
      fetchTutorSessions();
      setSelectedSession(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update session');
    }
  };

  const handleRescheduleSession = async () => {
    const newDate = window.prompt('Enter new date (YYYY-MM-DD):');
    const newTime = window.prompt('Enter new time (HH:mm):');

    if (!newDate || !newTime) return;

    try {
      const dateTime = new Date(`${newDate}T${newTime}`);
      await appointmentService.rescheduleSession(selectedSession._id, {
        newDate: dateTime.toISOString()
      });

      toast.success('Session rescheduled successfully');
      fetchTutorSessions();
      setSelectedSession(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reschedule');
    }
  };

  const handleCancelSession = async () => {
    const confirmed = await confirmDialog({
      title: 'Cancel session?',
      text: 'This will cancel all student bookings. Continue?',
      icon: 'warning',
      confirmButtonText: 'Yes, cancel'
    });
    if (!confirmed) return;

    try {
      await appointmentService.cancelTutorSession(selectedSession._id);
      toast.success('Session cancelled');
      fetchTutorSessions();
      setSelectedSession(null);
    } catch (error) {
      toast.error('Failed to cancel session');
    }
  };

  const handleCompleteSession = async () => {
    try {
      await appointmentService.completeTutorSession(selectedSession._id);
      toast.success('Session marked as completed');
      fetchTutorSessions();
      setSelectedSession(null);
    } catch (error) {
      toast.error('Failed to complete session');
    }
  };

  const handleRemoveStudent = async (appointmentId) => {
    const confirmed = await confirmDialog({
      title: 'Remove student?',
      text: 'This will remove this student from the session.',
      icon: 'warning',
      confirmButtonText: 'Yes, remove'
    });
    if (!confirmed) return;

    try {
      await appointmentService.removeStudentFromSession(selectedSession._id, appointmentId);
      toast.success('Student removed');
      handleSelectSession(selectedSession);
    } catch (error) {
      toast.error('Failed to remove student');
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

  const statusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return styles.badgePrimary;
      case 'completed':
        return styles.badgeSuccess;
      case 'cancelled':
        return styles.badgeDanger;
      default:
        return styles.badgePrimary;
    }
  };

  const getSessionLessonText = (session) => {
    return session?.topic?.name || parseTopicFromDescription(session?.description) || '—';
  };

  const getFeedbackSummary = (sessionId) => {
    return feedbackBySessionId[String(sessionId)] || { average: 0, count: 0, items: [] };
  };

  const completedCount = sessions.filter((s) => s.status === 'completed').length;
  const totalFeedbackCount = Object.values(feedbackBySessionId).reduce((sum, entry) => sum + (entry.count || 0), 0);

  if (loading && !selectedSession) {
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

  if (selectedSession) {
    const selectedFeedback = getFeedbackSummary(selectedSession._id);

    return (
      <div style={{ ...styles.container, marginTop: '30px' }}>
        <div style={{ ...styles.card, background: 'linear-gradient(135deg, #0b1f3b 0%, #1e3a8a 100%)', color: 'white', marginBottom: '16px' }}>
          <h1 style={{ margin: 0, marginBottom: '6px' }}>Session Details</h1>
          <p style={{ margin: 0, opacity: 0.9 }}>Manage attendance and review student feedback for this session.</p>
        </div>

        <button onClick={() => setSelectedSession(null)} style={{ ...styles.button, marginBottom: '20px', background: '#64748b' }}>
          Back to My Sessions
        </button>

        <div style={styles.card}>
          {selectedSession.thumbnailUrl && (
            <img
              src={`http://localhost:5000${selectedSession.thumbnailUrl}`}
              alt="Session thumbnail"
              style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '12px', marginBottom: '15px' }}
            />
          )}

          <h2 style={{ marginTop: 0 }}>{selectedSession.subject?.name || 'Session'}</h2>
          <p><strong>Lesson:</strong> {getSessionLessonText(selectedSession)}</p>
          <p><strong>Date & Time:</strong> {formatDateTime(selectedSession.sessionDate)}</p>
          <p><strong>Duration:</strong> {selectedSession.duration} minutes</p>
          <p><strong>Capacity:</strong> {selectedSession.bookedCount}/{selectedSession.maxCapacity}</p>
          <p>
            <strong>Status:</strong>{' '}
            <span style={{ ...styles.badge, ...statusColor(selectedSession.status) }}>{selectedSession.status}</span>
          </p>
          {selectedSession.meetingLink && (
            <p>
              <strong>Link:</strong>{' '}
              <a href={selectedSession.meetingLink} target="_blank" rel="noreferrer">Join Meeting</a>
            </p>
          )}
          {stripTopicPrefixFromDescription(selectedSession.description) && (
            <p><strong>Description:</strong> {stripTopicPrefixFromDescription(selectedSession.description)}</p>
          )}

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '16px', marginBottom: '18px' }}>
            {selectedSession.status === 'scheduled' && (
              <>
                <button
                  onClick={() => {
                    setEditForm({
                      sessionDate: selectedSession.sessionDate.split('T')[0],
                      sessionTime: selectedSession.sessionDate.split('T')[1].substring(0, 5),
                      maxCapacity: selectedSession.maxCapacity,
                      meetingLink: selectedSession.meetingLink || '',
                      description: selectedSession.description || ''
                    });
                    setShowEditForm(true);
                  }}
                  style={styles.button}
                >
                  Edit
                </button>
                <button onClick={handleRescheduleSession} style={styles.button}>Reschedule</button>
                <button onClick={handleCompleteSession} style={styles.button}>Complete</button>
                <button onClick={handleCancelSession} style={styles.buttonDanger}>Cancel</button>
              </>
            )}
          </div>

          {showEditForm && (
            <form onSubmit={handleUpdateSession} style={{ ...styles.card, background: '#f8fafc', marginBottom: '20px' }}>
              <h3 style={{ marginTop: 0 }}>Edit Session</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={styles.label}>Date</label>
                  <input type="date" style={styles.input} value={editForm.sessionDate} onChange={(e) => setEditForm((p) => ({ ...p, sessionDate: e.target.value }))} />
                </div>
                <div>
                  <label style={styles.label}>Time</label>
                  <input type="time" style={styles.input} value={editForm.sessionTime} onChange={(e) => setEditForm((p) => ({ ...p, sessionTime: e.target.value }))} />
                </div>
                <div>
                  <label style={styles.label}>Max Capacity</label>
                  <input type="number" min="1" style={styles.input} value={editForm.maxCapacity} onChange={(e) => setEditForm((p) => ({ ...p, maxCapacity: e.target.value }))} />
                </div>
                <div>
                  <label style={styles.label}>Meeting Link</label>
                  <input type="url" style={styles.input} value={editForm.meetingLink} onChange={(e) => setEditForm((p) => ({ ...p, meetingLink: e.target.value }))} />
                </div>
              </div>

              <label style={styles.label}>Description</label>
              <textarea style={{ ...styles.input, height: '80px' }} value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} />

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={styles.button}>Save Changes</button>
                <button type="button" style={styles.buttonDanger} onClick={() => setShowEditForm(false)}>Close</button>
              </div>
            </form>
          )}

          <h3 style={{ marginBottom: '8px' }}>Student Feedback ({selectedFeedback.count})</h3>
          {selectedFeedback.count > 0 ? (
            <div style={{ marginBottom: '18px' }}>
              <p style={{ marginTop: 0, color: '#1e3a8a' }}>
                <FaStar /> Average: <strong>{selectedFeedback.average}/5</strong> ({selectedFeedback.count} rating{selectedFeedback.count !== 1 ? 's' : ''})
              </p>
              <div style={{ display: 'grid', gap: '10px' }}>
                {selectedFeedback.items.map((feedbackItem) => (
                  <div key={feedbackItem.appointmentId} style={{ ...styles.card, marginBottom: 0, background: '#f8fafc' }}>
                    <p style={{ marginTop: 0, marginBottom: '6px' }}><strong>{feedbackItem.studentName}</strong></p>
                    <p style={{ marginTop: 0, marginBottom: '6px', color: '#f59e0b' }}>{renderStars(feedbackItem.rating)} ({feedbackItem.rating}/5)</p>
                    <p style={{ marginTop: 0, marginBottom: '6px', color: '#334155' }}>{feedbackItem.comment || 'No comment provided.'}</p>
                    {feedbackItem.submittedAt && (
                      <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>{new Date(feedbackItem.submittedAt).toLocaleString()}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={styles.alertInfo}>No feedback submitted for this session yet.</div>
          )}

          <h3>Booked Students ({sessionStudents.length})</h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            {sessionStudents.length === 0 && <div style={styles.alertInfo}>No students booked yet</div>}
            {sessionStudents.map((booking) => (
              <div key={booking._id} style={{ ...styles.card, background: '#f8fafc', marginBottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0 }}><strong>{booking.student?.name}</strong></p>
                  <p style={{ margin: '3px 0', fontSize: '12px', color: '#64748b' }}>{booking.student?.email}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{booking.student?.phone}</p>
                </div>
                {selectedSession.status === 'scheduled' && (
                  <button onClick={() => handleRemoveStudent(booking._id)} style={{ ...styles.buttonDanger, padding: '6px 12px' }}>
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...styles.container, marginTop: '30px' }}>
      <div style={{ ...styles.card, background: 'linear-gradient(135deg, #0b1f3b 0%, #1e3a8a 100%)', color: 'white', marginBottom: '16px' }}>
        <h1 style={{ margin: 0, marginBottom: '6px' }}>Session Management</h1>
        <p style={{ margin: 0, opacity: 0.9 }}>Create sessions, track bookings, and review student ratings in one place.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '18px' }}>
        <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}><FaCalendarAlt /> Total: <strong>{sessions.length}</strong></div>
        <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}><FaUsers /> Completed: <strong>{completedCount}</strong></div>
        <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}><FaStar /> Feedback: <strong>{totalFeedbackCount}</strong></div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0 }}>Manage Sessions</h1>
        <button style={styles.button} onClick={() => setActiveTab((prev) => (prev === 'create' ? 'sessions' : 'create'))}>
          {activeTab === 'create' ? 'Back to My Sessions' : '+ Create New Session'}
        </button>
      </div>

      {activeTab === 'sessions' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '15px' }}>
          {sessions.length === 0 && (
            <div style={{ ...styles.card, textAlign: 'center' }}>
              <h3 style={{ marginTop: 0 }}>No sessions yet</h3>
              <p style={{ color: 'rgba(11,31,59,0.72)' }}>Create your first tutor session to start accepting bookings.</p>
              <button type="button" onClick={() => setActiveTab('create')} style={styles.button}>Create First Session</button>
            </div>
          )}

          {sessions.map((session) => {
            const feedbackSummary = getFeedbackSummary(session._id);
            const lessonText = getSessionLessonText(session);

            return (
              <div
                key={session._id}
                onClick={() => handleSelectSession(session)}
                style={{ ...styles.card, cursor: 'pointer' }}
              >
                {session.thumbnailUrl && (
                  <img
                    src={`http://localhost:5000${session.thumbnailUrl}`}
                    alt="Session thumbnail"
                    style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '12px', marginBottom: '12px' }}
                  />
                )}

                <h3 style={{ marginTop: 0 }}>{session.subject?.name || 'Session'}</h3>
                <p style={{ marginBottom: '8px', color: '#334155' }}><strong>Lesson:</strong> {lessonText}</p>
                <p style={{ marginBottom: '8px', color: '#334155' }}><strong>Date:</strong> {formatDateTime(session.sessionDate)}</p>
                <p style={{ marginBottom: '8px', color: '#334155' }}><strong>Duration:</strong> {session.duration} minutes</p>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  <span style={{ ...styles.badge, ...statusColor(session.status) }}>{session.status}</span>
                  <span style={{ ...styles.badge, ...styles.badgePrimary }}>Capacity {session.bookedCount}/{session.maxCapacity}</span>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ width: '100%', height: '8px', borderRadius: '999px', background: '#e2e8f0' }}>
                    <div
                      style={{
                        width: `${Math.min(100, (session.bookedCount / Math.max(1, session.maxCapacity)) * 100)}%`,
                        height: '8px',
                        borderRadius: '999px',
                        background: session.bookedCount >= session.maxCapacity ? '#dc2626' : '#16a34a'
                      }}
                    />
                  </div>
                </div>

                <p style={{ marginTop: 0, marginBottom: '6px', color: '#f59e0b' }}>
                  {renderStars(feedbackSummary.average)} <strong>{feedbackSummary.average || 0}/5</strong>
                </p>
                <p style={{ marginTop: 0, marginBottom: 0, color: '#64748b', fontSize: '13px' }}>
                  {feedbackSummary.count} student feedback rating{feedbackSummary.count !== 1 ? 's' : ''}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'create' && (
        <div style={styles.card}>
          <h2 style={{ marginTop: 0 }}>Create New Study Session</h2>
          <form onSubmit={handleCreateSession}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
              <div>
                <label style={styles.label}>Module/Subject *</label>
                <select
                  style={styles.input}
                  value={createForm.subject}
                  onChange={(e) => setCreateForm((p) => ({ ...p, subject: e.target.value }))}
                  required
                >
                  <option value="">Select subject</option>
                  {subjects.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={styles.label}>Lesson/Topic (Keyboard Input)</label>
                <input
                  type="text"
                  style={styles.input}
                  value={createForm.topicText}
                  onChange={(e) => setCreateForm((p) => ({ ...p, topicText: e.target.value }))}
                  placeholder="Type lesson or topic name"
                />
              </div>

              <div>
                <label style={styles.label}>Date *</label>
                <input
                  type="date"
                  style={styles.input}
                  value={createForm.sessionDate}
                  onChange={(e) => setCreateForm((p) => ({ ...p, sessionDate: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label style={styles.label}>Start Time *</label>
                <input
                  type="time"
                  style={styles.input}
                  value={createForm.sessionTime}
                  onChange={(e) => setCreateForm((p) => ({ ...p, sessionTime: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label style={styles.label}>Duration (minutes)</label>
                <input
                  type="number"
                  style={styles.input}
                  value={createForm.duration}
                  onChange={(e) => setCreateForm((p) => ({ ...p, duration: e.target.value }))}
                  min="15"
                  max="300"
                />
              </div>

              <div>
                <label style={styles.label}>Max Capacity *</label>
                <input
                  type="number"
                  style={styles.input}
                  value={createForm.maxCapacity}
                  onChange={(e) => setCreateForm((p) => ({ ...p, maxCapacity: e.target.value }))}
                  min="1"
                  max="100"
                  required
                />
              </div>

              <div>
                <label style={styles.label}>Meeting Link</label>
                <input
                  type="url"
                  style={styles.input}
                  value={createForm.meetingLink}
                  onChange={(e) => setCreateForm((p) => ({ ...p, meetingLink: e.target.value }))}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label style={styles.label}>Session Thumbnail (Image)</label>
                <input
                  type="file"
                  accept="image/*"
                  style={styles.input}
                  onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            <label style={styles.label}>Description</label>
            <textarea
              style={{ ...styles.input, height: '100px' }}
              value={createForm.description}
              onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="What will this session cover?"
            />

            <button type="submit" style={{ ...styles.button, marginTop: '15px' }}>
              <FaPlusCircle style={{ marginRight: '8px' }} />
              Create Session
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default TutorSessions;
