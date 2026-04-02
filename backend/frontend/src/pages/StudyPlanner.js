import React, { useState, useContext, useEffect } from 'react';
import { planService, subjectService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import styles from '../styles/inlineStyles';
import { showError, showSuccess, confirmDialog } from '../utils/alerts';
import { FaCalendarAlt, FaCheckCircle, FaClock } from 'react-icons/fa';

// Redirect existing toast calls to SweetAlert2.
const toast = {
  success: (message) => showSuccess(message),
  error: (message) => showError(message)
};

const TOPIC_ALLOWED_REGEX = /^[A-Za-z0-9 ]+$/;

const StudyPlanner = () => {
  const [plans, setPlans] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [topicError, setTopicError] = useState('');
  const [formData, setFormData] = useState({
    subject: '',
    topic: '',
    plannedDate: '',
    duration: 60,
    notes: ''
  });

  useEffect(() => {
    fetchPlans();
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await subjectService.getAllSubjects();
      setSubjects(response.data || []);
    } catch (error) {
      toast.error('Failed to load subjects');
    }
  };

  useEffect(() => {
    if (!formData.subject) {
      setTopics([]);
      return;
    }

    const fetchTopics = async () => {
      try {
        const response = await subjectService.getTopicsBySubject(formData.subject);
        setTopics(response.data || []);
      } catch (error) {
        toast.error('Failed to load topics');
      }
    };

    fetchTopics();
  }, [formData.subject]);

  const fetchPlans = async () => {
    try {
      const response = await planService.getStudentPlans();
      setPlans(response.data);
    } catch (error) {
      toast.error('Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  const handleCompletePlan = async (planId) => {
    try {
      await planService.completePlan(planId);
      toast.success('Plan marked as completed');
      fetchPlans();
    } catch (error) {
      toast.error('Failed to complete plan');
    }
  };

  const handleDeletePlan = async (planId) => {
    const confirmed = await confirmDialog({
      title: 'Delete this plan?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      confirmButtonText: 'Yes, delete'
    });
    if (confirmed) {
      try {
        await planService.deletePlan(planId);
        toast.success('Plan deleted');
        fetchPlans();
      } catch (error) {
        toast.error('Failed to delete plan');
      }
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();

    if (!formData.subject || !formData.plannedDate || !formData.duration) {
      toast.error('Please fill in all required fields');
      return;
    }

    const normalizedTopicInput = (formData.topic || '').trim();
    if (topicError) {
      return;
    }

    const matchedTopic = normalizedTopicInput
      ? topics.find((topic) => topic.name.toLowerCase() === normalizedTopicInput.toLowerCase())
      : null;

    try {
      if (thumbnailFile) {
        const payload = new FormData();
        payload.append('subject', formData.subject);
        if (matchedTopic) {
          payload.append('topic', matchedTopic._id);
        } else if (normalizedTopicInput) {
          payload.append('topicName', normalizedTopicInput);
        }
        payload.append('plannedDate', formData.plannedDate);
        payload.append('duration', String(Number(formData.duration) || 60));
        payload.append('notes', formData.notes || '');
        payload.append('thumbnail', thumbnailFile);
        await planService.createPlan(payload);
      } else {
        await planService.createPlan({
          subject: formData.subject,
          topic: matchedTopic ? matchedTopic._id : undefined,
          topicName: matchedTopic ? undefined : (normalizedTopicInput || undefined),
          plannedDate: formData.plannedDate,
          duration: Number(formData.duration) || 60,
          notes: formData.notes || ''
        });
      }

      toast.success('Study plan created successfully!');
      setFormData({
        subject: '',
        topic: '',
        plannedDate: '',
        duration: 60,
        notes: ''
      });
      setThumbnailFile(null);
      setShowForm(false);
      fetchPlans();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create plan');
    }
  };

  const handleTopicChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, topic: value }));

    const normalizedValue = value.trim();
    if (normalizedValue && !TOPIC_ALLOWED_REGEX.test(normalizedValue)) {
      setTopicError('Topic accepts only English letters, numbers, and spaces');
      return;
    }

    setTopicError('');
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

  const pendingCount = plans.filter((plan) => plan.status === 'pending').length;
  const completedCount = plans.filter((plan) => plan.status === 'completed').length;
  const upcomingCount = plans.filter((plan) => new Date(plan.plannedDate) > new Date()).length;

  return (
    <div style={{ ...styles.container, marginTop: '30px' }}>
      <style>
        {`@keyframes plannerHeaderFloat {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
            box-shadow: 0 12px 24px rgba(2,6,23,0.28);
          }
          25% {
            transform: translateY(-3px) rotate(-0.6deg);
            box-shadow: 0 16px 28px rgba(2,6,23,0.34);
          }
          50% {
            transform: translateY(-1px) rotate(0deg);
            box-shadow: 0 14px 26px rgba(2,6,23,0.32);
          }
          75% {
            transform: translateY(-3px) rotate(0.6deg);
            box-shadow: 0 16px 28px rgba(2,6,23,0.34);
          }
        }

        @keyframes plannerImagePulse {
          0%, 100% {
            transform: scale(1);
            filter: saturate(100%) brightness(100%);
          }
          30% {
            transform: scale(1.02);
            filter: saturate(110%) brightness(104%);
          }
          60% {
            transform: scale(0.995);
            filter: saturate(103%) brightness(101%);
          }
        }`}
      </style>
      <div style={{ ...styles.card, background: 'linear-gradient(135deg, #0b1f3b 0%, #1e3a8a 100%)', color: 'white', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, marginBottom: '6px' }}>Study Planner</h1>
            <p style={{ margin: 0, opacity: 0.9 }}>Plan sessions, stay consistent, and track what you complete.</p>
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
              animation: 'plannerHeaderFloat 5s ease-in-out infinite'
            }}
          >
            <img
              src="/image/SDP.jpeg"
              alt="Study planner"
              style={{ width: '168px', height: '89px', objectFit: 'cover', borderRadius: '10px', display: 'block', animation: 'plannerImagePulse 5s ease-in-out infinite' }}
            />
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '18px' }}>
        <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}><FaClock /> Pending: <strong>{pendingCount}</strong></div>
        <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}><FaCheckCircle /> Completed: <strong>{completedCount}</strong></div>
        <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}><FaCalendarAlt /> Upcoming: <strong>{upcomingCount}</strong></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Study Planner</h1>
        <button onClick={() => setShowForm(!showForm)} style={styles.button}>
          {showForm ? 'Cancel' : '+ New Plan'}
        </button>
      </div>

      {showForm && (
        <div style={{ ...styles.card, marginBottom: '30px' }}>
          <h2>Create Study Plan</h2>
          <form onSubmit={handleCreatePlan}>
            <label style={styles.label}>Subject *</label>
            <select
              style={styles.input}
              value={formData.subject}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, subject: e.target.value, topic: '' }));
                setTopicError('');
              }}
              required
            >
              <option value="">Select a subject</option>
              {subjects.map(subject => (
                <option key={subject._id} value={subject._id}>{subject.name}</option>
              ))}
            </select>

            <label style={styles.label}>Topic</label>
            <input
              type="text"
              list="study-plan-topics"
              placeholder="Type a topic (optional)"
              style={styles.input}
              value={formData.topic}
              onChange={handleTopicChange}
              pattern="[A-Za-z0-9 ]*"
              title="Use only English letters, numbers, and spaces"
            />
            {topicError && (
              <p style={{ margin: '6px 0 0 0', color: '#dc2626', fontSize: '13px' }}>{topicError}</p>
            )}
            <datalist id="study-plan-topics">
              {topics.map((topic) => (
                <option key={topic._id} value={topic.name} />
              ))}
            </datalist>

            <label style={styles.label}>Planned Date & Time *</label>
            <input
              type="datetime-local"
              style={styles.input}
              value={formData.plannedDate}
              onChange={(e) => setFormData(prev => ({ ...prev, plannedDate: e.target.value }))}
              required
            />

            <label style={styles.label}>Duration (minutes) *</label>
            <input
              type="number"
              placeholder="60"
              style={styles.input}
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
              min="15"
              max="480"
              required
            />

            <label style={styles.label}>Notes</label>
            <textarea
              placeholder="Add additional notes..."
              style={{ ...styles.input, height: '100px' }}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />

            <label style={styles.label}>Thumbnail Photo</label>
            <input
              type="file"
              accept="image/*"
              style={styles.input}
              onChange={(e) => setThumbnailFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
            />

            <button type="submit" style={styles.button}>Create Plan</button>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
        {plans && plans.map(plan => (
          <div key={plan._id} style={{ ...styles.card, marginBottom: 0 }}>
            <div>
              {plan.thumbnailUrl && (
                <img
                  src={`http://localhost:5000${plan.thumbnailUrl}`}
                  alt="Study plan thumbnail"
                  style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '10px', marginBottom: '10px' }}
                />
              )}
              <h3 style={{ marginTop: 0, marginBottom: '8px' }}>{plan.subject?.name || 'General Study'}</h3>
              <p style={{ margin: '0 0 8px 0', color: 'rgba(11,31,59,0.78)' }}>
                {(plan.notes || '').trim()
                  ? ((plan.notes || '').length > 120 ? `${plan.notes.substring(0, 120)}...` : plan.notes)
                  : 'No notes added for this plan yet.'}
              </p>
              <p style={{ margin: '0 0 6px 0' }}><strong>Topic:</strong> {plan.topic?.name || 'Not selected'}</p>
              <p style={{ margin: '0 0 6px 0' }}><strong>Date:</strong> {new Date(plan.plannedDate).toLocaleString()}</p>
              <p style={{ margin: '0 0 10px 0' }}><strong>Duration:</strong> {plan.duration} minutes</p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                <span style={{ ...styles.badge, ...(plan.status === 'completed' ? styles.badgeSuccess : styles.badgePrimary) }}>
                  {plan.status}
                </span>
                <span style={{ ...styles.badge, ...styles.badgePrimary }}>
                  {new Date(plan.plannedDate) > new Date() ? 'upcoming' : 'scheduled'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {plan.status === 'pending' && (
                  <button onClick={() => handleCompletePlan(plan._id)} style={styles.button}>
                    Mark Complete
                  </button>
                )}
                <button onClick={() => handleDeletePlan(plan._id)} style={styles.buttonDanger}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div style={{ ...styles.card, textAlign: 'center' }}>
          <h3 style={{ marginTop: 0 }}>No study plans yet</h3>
          <p style={{ color: 'rgba(11,31,59,0.7)' }}>Create your first plan to build a clear weekly routine.</p>
          <button type="button" onClick={() => setShowForm(true)} style={styles.button}>Create First Plan</button>
        </div>
      )}
    </div>
  );
};

export default StudyPlanner;
