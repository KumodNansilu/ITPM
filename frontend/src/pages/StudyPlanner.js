import React, { useState, useEffect, useMemo } from 'react';
import { planService, subjectService } from '../services/api';
import styles from '../styles/inlineStyles';
import { showError, showSuccess, confirmDialog } from '../utils/alerts';
import { FaCheckCircle, FaPlus, FaTrash, FaFilter } from 'react-icons/fa';

// Redirect existing toast calls to SweetAlert2.
const toast = {
  success: (message) => showSuccess(message),
  error: (message) => showError(message)
};

const TOPIC_ALLOWED_REGEX = /^[A-Za-z0-9 ]+$/;

const getStatusColor = (status, plannedDate) => {
  if (status === 'completed') return { label: '✔ Completed', color: '#16a34a', bg: '#dcfce7' };
  if (status === 'cancelled') return { label: '⛔ Missed', color: '#dc2626', bg: '#fee2e2' };
  if (new Date(plannedDate) < new Date() && status === 'pending') return { label: '⛔ Missed', color: '#dc2626', bg: '#fee2e2' };
  if (new Date(plannedDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && status === 'pending') return { label: '🟡 In Progress', color: '#ea580c', bg: '#ffedd5' };
  return { label: '⏳ Pending', color: '#2563eb', bg: '#dbeafe' };
};

const formatDateToWeekday = (date) => {
  const d = new Date(date);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[d.getDay()];
};

const formatDateShort = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const StudyPlanner = () => {
  const [plans, setPlans] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [topicError, setTopicError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
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

  // Filtered and sorted plans
  const filteredAndSortedPlans = useMemo(() => {
    let result = [...plans];

    // Filter by status
    if (filterStatus !== 'all') {
      if (filterStatus === 'pending') {
        result = result.filter(plan => plan.status === 'pending' && new Date(plan.plannedDate) >= new Date(new Date().setHours(0, 0, 0, 0)));
      } else if (filterStatus === 'inprogress') {
        result = result.filter(plan => plan.status === 'pending' && new Date(plan.plannedDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
      } else if (filterStatus === 'completed') {
        result = result.filter(plan => plan.status === 'completed');
      } else if (filterStatus === 'missed') {
        result = result.filter(plan => plan.status === 'cancelled' || (plan.status === 'pending' && new Date(plan.plannedDate) < new Date(new Date().setHours(0, 0, 0, 0))));
      }
    }

    // Sort
    if (sortBy === 'date') {
      result.sort((a, b) => new Date(a.plannedDate) - new Date(b.plannedDate));
    } else if (sortBy === 'latest') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return result;
  }, [plans, filterStatus, sortBy]);

  // Weekly view data
  const weeklyData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monday = new Date(today);
    const mondayOffset = today.getDay() === 0 ? -6 : 1 - today.getDay();
    monday.setDate(today.getDate() + mondayOffset);

    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      return day;
    });

    return weekDays.map(day => ({
      date: day,
      plans: plans.filter(plan => {
        const planDate = new Date(plan.plannedDate);
        planDate.setHours(0, 0, 0, 0);
        return planDate.getTime() === day.getTime();
      })
    }));
  }, [plans]);

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

  const pendingCount = plans.filter((plan) => plan.status === 'pending').length;
  const completedCount = plans.filter((plan) => plan.status === 'completed').length;
  const upcomingCount = plans.filter((plan) => new Date(plan.plannedDate) > new Date()).length;

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
    <div style={{ ...styles.container, marginTop: '30px', marginBottom: '100px' }}>
      <style>
        {`@keyframes floatingButton {
          0%, 100% {
            transform: translateY(0px);
            box-shadow: 0 8px 20px rgba(30, 58, 138, 0.35);
          }
          50% {
            transform: translateY(-8px);
            box-shadow: 0 12px 28px rgba(30, 58, 138, 0.45);
          }
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .planner-card {
          animation: slideInUp 0.4s ease-out forwards;
        }
        `}
      </style>

      {/* Header */}
      <div style={{ ...styles.card, background: 'linear-gradient(135deg, #0b1f3b 0%, #1e3a8a 100%)', color: 'white', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, marginBottom: '8px', fontSize: '32px' }}>📅 Study Planner</h1>
            <p style={{ margin: 0, opacity: 0.9 }}>Plan your study sessions and stay on track with your learning goals</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 800 }}>{pendingCount}</div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>⏳ Pending</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 800 }}>{completedCount}</div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>✔ Completed</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 800 }}>{upcomingCount}</div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>📌 Upcoming</div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Plan Form */}
      {showForm && (
        <div style={{ ...styles.card, marginBottom: '24px', background: '#f8fafc', border: '2px dashed #1e3a8a' }}>
          <h2 style={{ marginTop: 0, color: '#0b1f3b' }}>Create New Study Plan</h2>
          <form onSubmit={handleCreatePlan}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              <div>
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
              </div>

              <div>
                <label style={styles.label}>Topic</label>
                <input
                  type="text"
                  list="study-plan-topics"
                  placeholder="e.g., Object Oriented Programming"
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
              </div>

              <div>
                <label style={styles.label}>Planned Date & Time *</label>
                <input
                  type="datetime-local"
                  style={styles.input}
                  value={formData.plannedDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, plannedDate: e.target.value }))}
                  required
                />
              </div>

              <div>
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
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <label style={styles.label}>Notes</label>
              <textarea
                placeholder="Add additional notes or goals for this study session..."
                style={{ ...styles.input, height: '80px', resize: 'vertical' }}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <div style={{ marginTop: '16px' }}>
              <label style={styles.label}>Thumbnail Photo</label>
              <input
                type="file"
                accept="image/*"
                style={styles.input}
                onChange={(e) => setThumbnailFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
              />
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button type="submit" style={styles.button}>Create Plan</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ ...styles.button, background: '#e2e8f0', color: '#0b1f3b', border: 'none' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filter & Sort Options */}
      <div style={{ ...styles.card, marginBottom: '24px', background: '#f8fafc' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaFilter color="#1e3a8a" />
            <strong style={{ color: '#0b1f3b' }}>Filter by Status:</strong>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['all', 'pending', 'inprogress', 'completed', 'missed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: 'none',
                  background: filterStatus === status ? '#1e3a8a' : '#e2e8f0',
                  color: filterStatus === status ? 'white' : '#0b1f3b',
                  fontWeight: filterStatus === status ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {status === 'all' && 'All'}
                {status === 'pending' && '⏳ Pending'}
                {status === 'inprogress' && '🟡 In Progress'}
                {status === 'completed' && '✔ Completed'}
                {status === 'missed' && '⛔ Missed'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <strong style={{ color: '#0b1f3b' }}>Sort by:</strong>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['date', 'latest'].map((sort) => (
              <button
                key={sort}
                onClick={() => setSortBy(sort)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: 'none',
                  background: sortBy === sort ? '#1e3a8a' : '#e2e8f0',
                  color: sortBy === sort ? 'white' : '#0b1f3b',
                  fontWeight: sortBy === sort ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {sort === 'date' && '📅 Date'}
                {sort === 'latest' && '⏱ Latest'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly View */}
      <div style={{ ...styles.card, marginBottom: '24px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#0b1f3b' }}>📆 This Week</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '10px', marginBottom: '10px' }}>
          {weeklyData.map((day, idx) => (
            <div
              key={idx}
              style={{
                background: day.plans.length > 0 ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' : '#f1f5f9',
                padding: '12px',
                borderRadius: '12px',
                textAlign: 'center',
                border: day.plans.length > 0 ? '2px solid #1e3a8a' : '1px solid #e2e8f0'
              }}
            >
              <div style={{ fontWeight: 700, color: '#0b1f3b', marginBottom: '4px' }}>
                {formatDateToWeekday(day.date)}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                {formatDateShort(day.date)}
              </div>
              {day.plans.length > 0 ? (
                <div>
                  {day.plans.map((plan, pIdx) => (
                    <div
                      key={pIdx}
                      style={{
                        fontSize: '11px',
                        background: 'white',
                        padding: '4px',
                        borderRadius: '6px',
                        marginTop: pIdx === 0 ? 0 : '4px',
                        color: '#0b1f3b',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {plan.topic?.name || plan.subject?.name}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '20px' }}>-</div>
              )}
            </div>
          ))}
        </div>
        <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center' }}>Mon - Sun • Current week overview</div>
      </div>

      {/* Plans List */}
      {filteredAndSortedPlans.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {filteredAndSortedPlans.map((plan, idx) => {
            const statusInfo = getStatusColor(plan.status, plan.plannedDate);
            const planDate = new Date(plan.plannedDate);
            const today = new Date();
            const daysUntil = Math.ceil((planDate - today) / (1000 * 60 * 60 * 24));
            const progress = plan.status === 'completed' ? 100 : (daysUntil <= 0 && plan.status === 'pending' ? 100 : Math.max(0, 100 - Math.max(0, daysUntil) * 10));

            return (
              <div
                key={plan._id}
                className="planner-card"
                style={{
                  ...styles.card,
                  marginBottom: 0,
                  borderLeft: `4px solid ${statusInfo.color}`,
                  background: statusInfo.bg,
                  opacity: plan.status === 'cancelled' ? 0.7 : 1
                }}
              >
                {/* Plan Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h4 style={{ margin: 0, color: '#0b1f3b', fontSize: '16px', fontWeight: 700 }}>
                      📘 {plan.topic?.name || plan.subject?.name || 'Study Session'}
                    </h4>
                  </div>
                  {plan.completedAt && (
                    <span style={{ background: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: '#16a34a' }}>
                      ⏰ Reminder
                    </span>
                  )}
                </div>

                {/* Plan Details */}
                <div style={{ background: 'rgba(255,255,255,0.6)', padding: '10px 12px', borderRadius: '10px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '13px', color: '#0b1f3b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>📅</span> {planDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <div style={{ fontSize: '13px', color: '#0b1f3b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>⏰</span> {plan.duration} mins
                  </div>
                </div>

                {/* Status Badge */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'inline-block', background: statusInfo.color, color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                    {statusInfo.label}
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#0b1f3b', marginBottom: '4px' }}>
                    Progress: {progress}%
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.1)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        background: statusInfo.color,
                        width: `${progress}%`,
                        transition: 'width 0.3s ease',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                </div>

                {/* Notes */}
                {plan.notes && (
                  <div style={{ background: 'rgba(255,255,255,0.5)', padding: '10px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px', color: '#334155', fontStyle: 'italic', lineHeight: '1.4' }}>
                    "{plan.notes}"
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  {plan.status === 'pending' && (
                    <button
                      onClick={() => handleCompletePlan(plan._id)}
                      style={{
                        background: '#16a34a',
                        color: 'white',
                        border: 'none',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'background 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#15803d'}
                      onMouseLeave={(e) => e.target.style.background = '#16a34a'}
                    >
                      <FaCheckCircle /> Complete
                    </button>
                  )}
                  <button
                    onClick={() => handleDeletePlan(plan._id)}
                    style={{
                      background: '#dc2626',
                      color: 'white',
                      border: 'none',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#b91c1c'}
                    onMouseLeave={(e) => e.target.style.background = '#dc2626'}
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ ...styles.card, textAlign: 'center', padding: '40px 20px' }}>
          <h3 style={{ marginTop: 0, color: '#0b1f3b' }}>No study plans {filterStatus !== 'all' ? `with status "${filterStatus}"` : 'yet'}</h3>
          <p style={{ color: 'rgba(11,31,59,0.7)', marginBottom: '20px' }}>
            Create your first plan to build a clear weekly routine and stay organized!
          </p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            style={{
              background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Create First Plan
          </button>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
          color: 'white',
          border: 'none',
          fontSize: '28px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 20px rgba(30, 58, 138, 0.35)',
          animation: 'floatingButton 2s ease-in-out infinite',
          zIndex: 100,
          transition: 'transform 0.2s ease'
        }}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
      >
        <FaPlus />
      </button>
    </div>
  );
};

export default StudyPlanner;
