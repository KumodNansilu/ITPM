import React, { useState, useEffect, useContext } from 'react';
import { appointmentService, subjectService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import styles from '../styles/inlineStyles';

const TutorSessions = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sessions'); // 'sessions' or 'create'
  
  const [sessions, setSessions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionStudents, setSessionStudents] = useState([]);
  
  const [createForm, setCreateForm] = useState({
    subject: '',
    topic: '',
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

  useEffect(() => {
    if (!createForm.subject) {
      setTopics([]);
      return;
    }

    const fetchTopics = async () => {
      try {
        const response = await subjectService.getTopicsBySubject(createForm.subject);
        setTopics(response.data || []);
      } catch (error) {
        toast.error('Failed to load topics');
      }
    };

    fetchTopics();
  }, [createForm.subject]);

  const fetchTutorSessions = async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getTutorSessions();
      setSessions(response.data || []);
    } catch (error) {
      toast.error('Failed to load sessions');
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
      
      const payload = {
        subject: createForm.subject,
        sessionDate: dateTime.toISOString(),
        duration: Number(createForm.duration) || 60,
        maxCapacity: Number(createForm.maxCapacity) || 10
      };

      if (createForm.topic) payload.topic = createForm.topic;
      if (createForm.meetingLink) payload.meetingLink = createForm.meetingLink;
      if (createForm.description) payload.description = createForm.description;

      await appointmentService.createTutorSession(payload);

      toast.success('Session created successfully!');
      setCreateForm({
        subject: '',
        topic: '',
        sessionDate: '',
        sessionTime: '09:00',
        duration: 60,
        maxCapacity: 10,
        meetingLink: '',
        description: ''
      });
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
      setSessionStudents(response.data.bookings);
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
      toast.success('Session updated successfully!');
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

      toast.success('Session rescheduled successfully!');
      fetchTutorSessions();
      setSelectedSession(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reschedule');
    }
  };

  const handleCancelSession = async () => {
    if (!window.confirm('This will cancel all student bookings. Continue?')) return;

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
    if (!window.confirm('Remove this student from the session?')) return;

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
      case 'scheduled': return styles.badgePrimary;
      case 'completed': return styles.badgeSuccess;
      case 'cancelled': return styles.badgeDanger;
      default: return styles.badgePrimary;
    }
  };

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
    return (
      <div style={{ ...styles.container, marginTop: '30px' }}>
        <button
          onClick={() => setSelectedSession(null)}
          style={{ ...styles.button, marginBottom: '20px', background: '#999' }}
        >
          ← Back to Sessions
        </button>

        <div style={styles.card}>
          <h2>Session Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <p><strong>Module:</strong> {selectedSession.subject?.name}</p>
              <p><strong>Lesson:</strong> {selectedSession.topic?.name || '—'}</p>
              <p><strong>Date & Time:</strong> {formatDateTime(selectedSession.sessionDate)}</p>
              <p><strong>Duration:</strong> {selectedSession.duration} minutes</p>
            </div>
            <div>
              <p><strong>Capacity:</strong> {selectedSession.bookedCount}/{selectedSession.maxCapacity}</p>
              <p><strong>Status:</strong> <span style={{ ...styles.badge, ...statusColor(selectedSession.status) }}>{selectedSession.status}</span></p>
              <p><strong>Available:</strong> {selectedSession.isAvailable ? 'Yes ✅' : 'No ❌'}</p>
              {selectedSession.meetingLink && <p><strong>Link:</strong> <a href={selectedSession.meetingLink} target="_blank" rel="noreferrer">Join</a></p>}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '30px' }}>
            {selectedSession.status === 'scheduled' && (
              <>
                <button onClick={() => {
                  setEditForm({
                    sessionDate: selectedSession.sessionDate.split('T')[0],
                    sessionTime: selectedSession.sessionDate.split('T')[1].substring(0, 5),
                    maxCapacity: selectedSession.maxCapacity,
                    meetingLink: selectedSession.meetingLink || '',
                    description: selectedSession.description || ''
                  });
                  // Show edit form
                  const el = document.getElementById('editForm');
                  if (el) el.style.display = 'block';
                }} style={{ ...styles.button }}>
                  ✏️ Edit
                </button>
                <button onClick={handleRescheduleSession} style={{ ...styles.button }}>
                  📅 Reschedule
                </button>
                <button onClick={handleCompleteSession} style={{ ...styles.button }}>
                  ✓ Complete
                </button>
                <button onClick={handleCancelSession} style={{ ...styles.buttonDanger }}>
                  ❌ Cancel
                </button>
              </>
            )}
          </div>

          {/* Edit Form */}
          <form id="editForm" onSubmit={handleUpdateSession} style={{ ...styles.card, background: '#f9f9f9', marginBottom: '30px', display: 'none' }}>
            <h3>Edit Session</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div>
                <label style={styles.label}>Date</label>
                <input
                  type="date"
                  style={styles.input}
                  value={editForm.sessionDate}
                  onChange={(e) => setEditForm(p => ({ ...p, sessionDate: e.target.value }))}
                />
              </div>
              <div>
                <label style={styles.label}>Time</label>
                <input
                  type="time"
                  style={styles.input}
                  value={editForm.sessionTime}
                  onChange={(e) => setEditForm(p => ({ ...p, sessionTime: e.target.value }))}
                />
              </div>
              <div>
                <label style={styles.label}>Max Capacity</label>
                <input
                  type="number"
                  style={styles.input}
                  value={editForm.maxCapacity}
                  onChange={(e) => setEditForm(p => ({ ...p, maxCapacity: e.target.value }))}
                  min="1"
                />
              </div>
              <div>
                <label style={styles.label}>Meeting Link</label>
                <input
                  type="url"
                  style={styles.input}
                  value={editForm.meetingLink}
                  onChange={(e) => setEditForm(p => ({ ...p, meetingLink: e.target.value }))}
                />
              </div>
            </div>
            <label style={styles.label}>Description</label>
            <textarea
              style={{ ...styles.input, height: '80px' }}
              value={editForm.description}
              onChange={(e) => setEditForm(p => ({ ...p, description: e.target.value }))}
            />
            <button type="submit" style={{ ...styles.button, marginTop: '10px' }}>Save Changes</button>
          </form>

          {/* Students List */}
          <h3>Booked Students ({sessionStudents.length})</h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            {sessionStudents.length === 0 && (
              <div style={styles.alertInfo}>No students booked yet</div>
            )}
            {sessionStudents.map(booking => (
              <div key={booking._id} style={{ ...styles.card, background: '#f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p><strong>{booking.student?.name}</strong></p>
                  <p style={{ fontSize: '12px', color: '#666' }}>{booking.student?.email}</p>
                  <p style={{ fontSize: '12px', color: '#666' }}>{booking.student?.phone}</p>
                </div>
                {selectedSession.status === 'scheduled' && (
                  <button
                    onClick={() => handleRemoveStudent(booking._id)}
                    style={{ ...styles.buttonDanger, padding: '6px 12px' }}
                  >
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
      <h1 style={{ marginBottom: '30px' }}>📅 Manage Sessions</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '2px solid #e0e0e0' }}>
        <button
          onClick={() => setActiveTab('sessions')}
          style={{
            ...styles.button,
            background: activeTab === 'sessions' ? '#667eea' : '#999',
            borderRadius: 0,
            borderBottom: activeTab === 'sessions' ? '4px solid #1976d2' : 'none'
          }}
        >
          📋 My Sessions
        </button>
        <button
          onClick={() => setActiveTab('create')}
          style={{
            ...styles.button,
            background: activeTab === 'create' ? '#667eea' : '#999',
            borderRadius: 0,
            borderBottom: activeTab === 'create' ? '4px solid #1976d2' : 'none'
          }}
        >
          ➕ Create Session
        </button>
      </div>

      {activeTab === 'sessions' && (
        <div style={{ display: 'grid', gap: '15px' }}>
          {sessions.length === 0 && (
            <div style={styles.alertInfo}>
              You haven't created any sessions yet. Create one to get started!
            </div>
          )}

          {sessions.map(session => (
            <div
              key={session._id}
              onClick={() => handleSelectSession(session)}
              style={{
                ...styles.card,
                cursor: 'pointer',
                transition: 'box-shadow 0.3s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                '&:hover': { boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h3>{session.subject?.name}</h3>
                  <p><strong>Lesson:</strong> {session.topic?.name || '—'}</p>
                  <p><strong>Date & Time:</strong> {formatDateTime(session.sessionDate)}</p>
                  <p><strong>Duration:</strong> {session.duration} minutes</p>
                  
                  {/* Capacity Bar */}
                  <div style={{ marginTop: '10px' }}>
                    <p><strong>Capacity: {session.bookedCount}/{session.maxCapacity}</strong></p>
                    <div style={{
                      background: '#e0e0e0',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      height: '20px',
                      marginTop: '5px'
                    }}>
                      <div
                        style={{
                          width: `${(session.bookedCount / session.maxCapacity) * 100}%`,
                          background: session.bookedCount >= session.maxCapacity ? '#d32f2f' : '#4caf50',
                          height: '100%'
                        }}
                      />
                    </div>
                  </div>
                </div>
                <span style={{ ...styles.badge, ...statusColor(session.status) }}>
                  {session.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'create' && (
        <div style={styles.card}>
          <h2>Create New Study Session</h2>
          <form onSubmit={handleCreateSession}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
              <div>
                <label style={styles.label}>Module/Subject *</label>
                <select
                  style={styles.input}
                  value={createForm.subject}
                  onChange={(e) => setCreateForm(p => ({ ...p, subject: e.target.value }))}
                  required
                >
                  <option value="">Select subject</option>
                  {subjects.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={styles.label}>Lesson/Topic</label>
                <select
                  style={styles.input}
                  value={createForm.topic}
                  onChange={(e) => setCreateForm(p => ({ ...p, topic: e.target.value }))}
                >
                  <option value="">Select topic</option>
                  {topics.map(t => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={styles.label}>Date *</label>
                <input
                  type="date"
                  style={styles.input}
                  value={createForm.sessionDate}
                  onChange={(e) => setCreateForm(p => ({ ...p, sessionDate: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label style={styles.label}>Start Time *</label>
                <input
                  type="time"
                  style={styles.input}
                  value={createForm.sessionTime}
                  onChange={(e) => setCreateForm(p => ({ ...p, sessionTime: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label style={styles.label}>Duration (minutes)</label>
                <input
                  type="number"
                  style={styles.input}
                  value={createForm.duration}
                  onChange={(e) => setCreateForm(p => ({ ...p, duration: e.target.value }))}
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
                  onChange={(e) => setCreateForm(p => ({ ...p, maxCapacity: e.target.value }))}
                  min="1"
                  max="100"
                  required
                />
              </div>

              <div>
                <label style={styles.label}>Meeting Link (Zoom/Google Meet)</label>
                <input
                  type="url"
                  style={styles.input}
                  value={createForm.meetingLink}
                  onChange={(e) => setCreateForm(p => ({ ...p, meetingLink: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </div>

            <label style={styles.label}>Description</label>
            <textarea
              style={{ ...styles.input, height: '100px' }}
              value={createForm.description}
              onChange={(e) => setCreateForm(p => ({ ...p, description: e.target.value }))}
              placeholder="What will this session cover?"
            />

            <button type="submit" style={{ ...styles.button, marginTop: '15px' }}>
              ➕ Create Session
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default TutorSessions;
