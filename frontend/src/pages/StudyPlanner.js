import React, { useState, useEffect, useMemo } from 'react';
import { planService, subjectService } from '../services/api';
import styles from '../styles/inlineStyles';
import { showError, showSuccess, confirmDialog } from '../utils/alerts';
import { FaCheckCircle, FaPlus, FaTrash, FaEdit, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const toast = {
  success: (message) => showSuccess(message),
  error: (message) => showError(message)
};

const TOPIC_ALLOWED_REGEX = /^[A-Za-z0-9 ]+$/;

const getStatusInfo = (status, plannedDate) => {
  if (status === 'completed') return { label: 'Completed', color: '#16a34a', bgColor: '#dcfce7', icon: '✔' };
  if (status === 'cancelled') return { label: 'Missed', color: '#dc2626', bgColor: '#fee2e2', icon: '⛔' };
  if (new Date(plannedDate) < new Date() && status === 'pending') return { label: 'Missed', color: '#dc2626', bgColor: '#fee2e2', icon: '⛔' };
  if (new Date(plannedDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && status === 'pending') return { label: 'In Progress', color: '#1d4ed8', bgColor: '#dbeafe', icon: '🟡' };
  return { label: 'Pending', color: '#1d4ed8', bgColor: '#dbeafe', icon: '⏳' };
};

// Professional color palette - subtle black and white theme
const dayColorPalette = [
  '#f5f5f5', '#fafafa', '#f9f9f9', '#f3f3f3', '#f7f7f7',
  '#f0f0f0', '#fcfcfc', '#f8f8f8', '#f2f2f2', '#f6f6f6',
  '#f4f4f4', '#fbfbfb', '#f1f1f1', '#f5f5f5', '#fafafa',
  '#f9f9f9', '#f3f3f3', '#f7f7f7', '#f0f0f0', '#fcfcfc',
  '#f8f8f8', '#f2f2f2', '#f6f6f6', '#f4f4f4', '#fbfbfb',
  '#f1f1f1', '#f5f5f5', '#fafafa', '#f9f9f9', '#f3f3f3',
  '#f7f7f7'
];

const getColorForDay = (day) => {
  return dayColorPalette[(day - 1) % dayColorPalette.length];
};

const getShortenedSubject = (subject) => {
  if (!subject) return '';
  const words = subject.split(' ');
  if (words.length > 1) {
    return words.map(w => w[0]).join('').toUpperCase();
  }
  return subject.substring(0, 3).toUpperCase();
};

const formatDateTimeLocal = (date) => {
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';
  const localDate = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

const Calendar = ({ currentDate, selectedDate, onDateClick, plans, onAddActivityClick }) => {
  const [hoveredDate, setHoveredDate] = useState(null);
  
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const prevLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
  const nextDays = 7 - lastDay.getDay() - 1;
  
  const prevDays = [];
  for (let i = prevLastDay.getDate() - firstDay.getDay() + 1; i <= prevLastDay.getDate(); i++) {
    prevDays.push({
      date: new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, i),
      isCurrentMonth: false
    });
  }

  const currentDays = [];
  for (let i = 1; i <= lastDay.getDate(); i++) {
    currentDays.push({
      date: new Date(currentDate.getFullYear(), currentDate.getMonth(), i),
      isCurrentMonth: true
    });
  }

  const nextDaysList = [];
  for (let i = 1; i <= nextDays; i++) {
    nextDaysList.push({
      date: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i),
      isCurrentMonth: false
    });
  }

  const allDays = [...prevDays, ...currentDays, ...nextDaysList];
  const weeks = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  const getPlansForDate = (date) => {
    const dateStr = date.toDateString();
    return plans.filter(plan => new Date(plan.plannedDate).toDateString() === dateStr);
  };

  const getStatusIndicatorForDate = (date) => {
    const datePlans = getPlansForDate(date);
    if (datePlans.length === 0) return null;
    
    const completed = datePlans.filter(p => p.status === 'completed').length;
    if (completed === datePlans.length) return { color: '#16a34a', label: 'completed' };
    
    const missed = datePlans.filter(p => p.status === 'cancelled' || (p.status === 'pending' && new Date(p.plannedDate) < new Date())).length;
    if (missed > 0) return { color: '#dc2626', label: 'missed' };
    
    return { color: '#1d4ed8', label: 'inprogress' };
  };

  return (
    <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
        {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
          <div key={day} style={{ textAlign: 'center', fontWeight: 700, color: '#374151', padding: '8px 4px', fontSize: '11px', letterSpacing: '0.5px' }}>
            {day}
          </div>
        ))}
        {weeks.map((week, weekIdx) => 
          week.map((dayObj, dayIdx) => {
            const dateKey = dayObj.date.toDateString();
            const datePlans = getPlansForDate(dayObj.date);
            const statusIndicator = getStatusIndicatorForDate(dayObj.date);
            const dayColor = dayObj.isCurrentMonth ? getColorForDay(dayObj.date.getDate()) : '#f0f0f0';
            const borderColor = statusIndicator?.color || '#d1d5db';
            const isToday = new Date().toDateString() === dayObj.date.toDateString();
            const isHovered = hoveredDate === dateKey;
            const isSelected = dayObj.isCurrentMonth && selectedDate && selectedDate.toDateString() === dateKey;
            const hasEvents = datePlans.length > 0;
            const cardBackground = isSelected ? 'linear-gradient(135deg, #0b1f3b 0%, #2563eb 100%)' : isToday ? '#dbeafe' : dayColor;
            const cardBorder = isSelected ? '#1d4ed8' : isToday ? '#2563eb' : (hasEvents ? borderColor : '#d1d5db');
            
            return (
              <div
                key={`${weekIdx}-${dayIdx}`}
                onMouseEnter={() => dayObj.isCurrentMonth && setHoveredDate(dateKey)}
                onMouseLeave={() => setHoveredDate(null)}
                style={{
                  aspectRatio: '1/1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  borderRadius: '12px',
                  background: cardBackground,
                  border: `2px solid ${cardBorder}`,
                  opacity: dayObj.isCurrentMonth ? 1 : 0.3,
                  cursor: dayObj.isCurrentMonth ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  padding: '6px',
                  overflow: 'visible',
                  boxShadow: isSelected ? '0 0 0 4px rgba(37, 99, 235, 0.30)' : (isHovered && dayObj.isCurrentMonth ? '0 4px 12px rgba(0,0,0,0.08)' : 'none')
                }}
                onClick={() => dayObj.isCurrentMonth && onDateClick(dayObj.date)}
              >
                {/* Date Number */}
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: 700, 
                  color: isSelected ? 'white' : (dayObj.isCurrentMonth ? '#1f2937' : '#9ca3af'),
                  textAlign: 'center',
                  lineHeight: '1.2',
                  marginBottom: '3px'
                }}>
                  {dayObj.date.getDate()}
                </div>
                
                {/* Activity Titles */}
                {datePlans.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '100%', flex: 1, alignItems: 'flex-start', justifyContent: 'center', paddingLeft: '4px' }}>
                    {datePlans.slice(0, 2).map((plan, idx) => {
                      const subject = plan.topic?.name || plan.subject?.name || 'Study';
                      const shortened = getShortenedSubject(subject);
                      const bulletColors = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];
                      const bulletColor = bulletColors[idx % bulletColors.length];
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '5px', width: '100%', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }} title={subject}>
                          <span style={{ display: 'inline-block', width: '6px', height: '6px', background: bulletColor, borderRadius: '50%' }} />
                          <span style={{ fontSize: '11px', fontWeight: 700, color: dayObj.isCurrentMonth ? (isSelected ? 'white' : '#1f2937') : '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {shortened}
                          </span>
                        </div>
                      );
                    })}
                    {datePlans.length > 2 && (
                      <div style={{ fontSize: '8px', color: dayObj.isCurrentMonth ? (isSelected ? 'rgba(255,255,255,0.85)' : '#6b7280') : '#9ca3af', fontWeight: 600, paddingLeft: '10px' }}>
                        +{datePlans.length - 2}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Add Activity Button on Hover */}
                {isHovered && dayObj.isCurrentMonth && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddActivityClick(dayObj.date);
                    }}
                    style={{
                      position: 'absolute',
                      bottom: '4px',
                      right: '4px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'white',
                      color: '#2563eb',
                      border: '1px solid #2563eb',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(37, 99, 235, 0.18)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#eff6ff';
                      e.currentTarget.style.color = '#1d4ed8';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.color = '#2563eb';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.18)';
                    }}
                    title="Add activity"
                  >
                    +
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const Modal = ({ isOpen, title, onClose, children, size = 'medium' }) => {
  if (!isOpen) return null;

  const maxWidth = size === 'small' ? '400px' : size === 'medium' ? '600px' : '800px';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        maxWidth,
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ margin: 0, color: '#0b1f3b', fontSize: '20px' }}>{title}</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}
          >
            <FaTimes />
          </button>
        </div>
        <div style={{ padding: '24px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

const StudyPlanner = () => {
  const [plans, setPlans] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [topicError, setTopicError] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);

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

  const handleCreatePlan = async (e) => {
    e.preventDefault();

    if (!formData.subject || !formData.plannedDate || !formData.duration) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (topicError) return;

    const normalizedTopicInput = (formData.topic || '').trim();
    const matchedTopic = normalizedTopicInput
      ? topics.find((topic) => topic.name.toLowerCase() === normalizedTopicInput.toLowerCase())
      : null;

    try {
      const submitPayload = thumbnailFile ? new FormData() : {
        subject: formData.subject,
        topic: matchedTopic ? matchedTopic._id : undefined,
        topicName: matchedTopic ? undefined : (normalizedTopicInput || undefined),
        plannedDate: formData.plannedDate,
        duration: Number(formData.duration) || 60,
        notes: formData.notes || ''
      };

      if (thumbnailFile) {
        submitPayload.append('subject', formData.subject);
        if (matchedTopic) {
          submitPayload.append('topic', matchedTopic._id);
        } else if (normalizedTopicInput) {
          submitPayload.append('topicName', normalizedTopicInput);
        }
        submitPayload.append('plannedDate', formData.plannedDate);
        submitPayload.append('duration', String(Number(formData.duration) || 60));
        submitPayload.append('notes', formData.notes || '');
        submitPayload.append('thumbnail', thumbnailFile);
      }

      if (isEditMode && editingPlanId) {
        await planService.updatePlan(editingPlanId, submitPayload);
        toast.success('Study plan updated successfully!');
      } else {
        await planService.createPlan(submitPayload);
        toast.success('Study plan created successfully!');
      }

      resetForm();
      setShowCreateModal(false);
      fetchPlans();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save plan');
    }
  };

  const handleCompletePlan = async (planId) => {
    try {
      await planService.completePlan(planId);
      toast.success('Plan marked as completed');
      fetchPlans();
      setShowDetailsModal(false);
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
        setShowDetailsModal(false);
      } catch (error) {
        toast.error('Failed to delete plan');
      }
    }
  };

  const handleEditPlan = (plan) => {
    setSelectedPlan(plan);
    setEditingPlanId(plan._id);
    setIsEditMode(true);
    setFormData({
      subject: plan.subject?._id || plan.subject || '',
      topic: plan.topic?.name || plan.topic || '',
      plannedDate: formatDateTimeLocal(plan.plannedDate),
      duration: plan.duration || 60,
      notes: plan.notes || ''
    });
    setThumbnailFile(null);
    setShowDetailsModal(false);
    setShowCreateModal(true);
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

  const resetForm = () => {
    setFormData({
      subject: '',
      topic: '',
      plannedDate: '',
      duration: 60,
      notes: ''
    });
    setThumbnailFile(null);
    setIsEditMode(false);
    setEditingPlanId(null);
    setSelectedPlan(null);
  };

  const latestPlans = useMemo(() => {
    return [...plans]
      .sort((a, b) => new Date(b.plannedDate) - new Date(a.plannedDate))
      .slice(0, 6);
  }, [plans]);

  const plansForDate = useMemo(() => {
    const targetDate = selectedDate || currentDate;
    const dateStr = targetDate.toDateString();
    return plans.filter(plan => new Date(plan.plannedDate).toDateString() === dateStr);
  }, [selectedDate, currentDate, plans]);

  const stats = useMemo(() => {
    return {
      total: plans.length,
      completed: plans.filter(p => p.status === 'completed').length,
      pending: plans.filter(p => p.status === 'pending').length,
      missed: plans.filter(p => p.status === 'cancelled' || (p.status === 'pending' && new Date(p.plannedDate) < new Date())).length
    };
  }, [plans]);

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
    <div style={{ ...styles.container, marginTop: '30px', marginBottom: '40px' }}>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .plan-item { animation: slideIn 0.3s ease-out; }
      `}</style>

      {(() => {
        const selectedDateToShow = selectedDate || currentDate;
        const selectedPlans = plansForDate;
        const selectedComplete = selectedPlans.filter(plan => plan.status === 'completed').length;
        const selectedDuration = selectedPlans.reduce((sum, plan) => sum + (Number(plan.duration) || 0), 0);
        const latestActivities = plans
          .filter(plan => plan.status !== 'cancelled')
          .sort((a, b) => new Date(b.plannedDate) - new Date(a.plannedDate))
          .slice(0, 5);

        return (
          <>
            <div style={{ display: 'grid', gap: '24px' }}>
              <div style={{ background: 'linear-gradient(135deg, #0b1f3b 0%, #1e3a8a 100%)', borderRadius: '28px', padding: '34px', color: 'white', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.8 }}>StudyFlow</div>
                    <h1 style={{ margin: '10px 0 10px', fontSize: '40px', lineHeight: 1.05 }}>Smart study planning with your calendar</h1>
                    <p style={{ maxWidth: '620px', fontSize: '16px', opacity: 0.8, lineHeight: 1.6 }}>View your study schedule, track progress, and manage sessions in one polished planner built for productivity.</p>
                  </div>
                  <div style={{ minWidth: '220px', background: 'rgba(255,255,255,0.08)', borderRadius: '24px', padding: '18px 22px' }}>
                    <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px', opacity: 0.85 }}>Today</div>
                    <div style={{ marginTop: '10px', fontSize: '18px', fontWeight: 700 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                    <div style={{ marginTop: '10px', fontSize: '14px', opacity: 0.8 }}>{selectedPlans.length} tasks scheduled</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '18px', marginTop: '28px' }}>
                  {[
                    { label: 'Total Tasks', value: stats.total },
                    { label: 'Completed', value: stats.completed },
                    { label: 'Pending', value: stats.pending },
                    { label: 'Missed', value: stats.missed }
                  ].map(stat => (
                    <div key={stat.label} style={{ background: 'rgba(255,255,255,0.12)', padding: '20px', borderRadius: '20px', minHeight: '110px' }}>
                      <div style={{ fontSize: '28px', fontWeight: 800 }}>{stat.value}</div>
                      <div style={{ marginTop: '8px', color: 'rgba(255,255,255,0.85)', fontSize: '13px', letterSpacing: '0.5px' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gap: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Latest Activities</div>
                  <div style={{ color: '#64748b', fontSize: '14px' }}>Showing the newest 5 active sessions</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  {latestActivities.length > 0 ? latestActivities.map((activity) => (
                    <div
                      key={activity._id}
                      onClick={() => { setSelectedPlan(activity); setShowDetailsModal(true); }}
                      style={{
                        cursor: 'pointer',
                        background: 'linear-gradient(135deg, #dbeafe 0%, #c7d2fe 100%)',
                        border: '1px solid #93c5fd',
                        borderRadius: '20px',
                        padding: '20px',
                        minHeight: '140px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 16px 30px rgba(14, 165, 233, 0.12)',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(15, 23, 42, 0.12)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 16px 30px rgba(15, 23, 42, 0.06)'; }}
                    >
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px', color: '#000000', textTransform: 'uppercase', letterSpacing: '0.7px' }}>{activity.status === 'completed' ? 'Completed' : 'Pending'}</div>
                        <div style={{ fontSize: '20px', fontWeight: 900, color: '#000000', marginBottom: '10px', letterSpacing: '0.2px', lineHeight: 1.2 }}>{activity.topic?.name || activity.subject?.name || 'Study Session'}</div>
                        <div style={{ fontSize: '14px', color: '#000000', lineHeight: 1.5 }}>{activity.notes ? activity.notes.substring(0, 70) + (activity.notes.length > 70 ? '...' : '') : 'Planned study session'}</div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '7px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 700 }}>{new Date(activity.plannedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{activity.duration} mins</span>
                      </div>
                    </div>
                  )) : (
                    <div style={{ gridColumn: '1 / -1', background: '#f8fafc', borderRadius: '20px', padding: '18px', color: '#64748b' }}>
                      No recent active activities found.
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
                <div style={{ background: 'white', borderRadius: '28px', padding: '26px', boxShadow: '0 20px 55px rgba(15, 23, 42, 0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ textTransform: 'uppercase', letterSpacing: '1.2px', color: '#475569', fontSize: '12px', marginBottom: '8px' }}>Study Calendar</div>
                      <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                        style={{ background: '#e2e8f0', border: 'none', color: '#0f172a', borderRadius: '14px', padding: '10px 14px', cursor: 'pointer', fontWeight: 700 }}
                      >
                        Prev
                      </button>
                      <select
                        value={currentDate.getMonth()}
                        onChange={(e) => setCurrentDate(new Date(currentDate.getFullYear(), Number(e.target.value), 1))}
                        style={{ padding: '10px 12px', borderRadius: '14px', border: '1px solid #cbd5e1', color: '#0f172a', fontWeight: 700, background: 'white', cursor: 'pointer' }}
                      >
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, idx) => (
                          <option key={month} value={idx}>{month}</option>
                        ))}
                      </select>
                      <select
                        value={currentDate.getFullYear()}
                        onChange={(e) => setCurrentDate(new Date(Number(e.target.value), currentDate.getMonth(), 1))}
                        style={{ padding: '10px 12px', borderRadius: '14px', border: '1px solid #cbd5e1', color: '#0f172a', fontWeight: 700, background: 'white', cursor: 'pointer' }}
                      >
                        {Array.from({ length: 11 }, (_, i) => currentDate.getFullYear() - 5 + i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                        style={{ background: 'linear-gradient(135deg, #0b1f3b 0%, #2563eb 100%)', border: 'none', color: 'white', borderRadius: '14px', padding: '10px 14px', cursor: 'pointer', fontWeight: 700, boxShadow: '0 12px 24px rgba(37, 99, 235, 0.18)' }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                  <div style={{ marginTop: '24px' }}>
                    <Calendar
                      currentDate={currentDate}
                      selectedDate={selectedDate}
                      onDateClick={(date) => setSelectedDate(date)}
                      onAddActivityClick={(date) => {
                        resetForm();
                        setSelectedDate(date);
                        const dateStr = formatDateTimeLocal(date);
                        setFormData(prev => ({ ...prev, plannedDate: dateStr }));
                        setShowCreateModal(true);
                      }}
                      plans={plans}
                    />
                  </div>
                </div>

                <div style={{ background: 'white', borderRadius: '28px', padding: '26px', boxShadow: '0 20px 55px rgba(15, 23, 42, 0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ textTransform: 'uppercase', letterSpacing: '1.2px', color: '#475569', fontSize: '12px' }}>Selected Date</div>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '10px' }}>{selectedDateToShow.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                    </div>
                    <button
                      onClick={() => { resetForm(); setFormData(prev => ({ ...prev, plannedDate: formatDateTimeLocal(selectedDateToShow) })); setShowCreateModal(true); }}
                      style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #0b1f3b 0%, #2563eb 100%)', color: 'white', padding: '12px 18px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 12px 24px rgba(37, 99, 235, 0.16)' }}
                    >
                      Add New
                    </button>
                  </div>

                  <div style={{ display: 'grid', gap: '14px', marginTop: '24px' }}>
                    {[
                      { label: 'Tasks', value: selectedPlans.length },
                      { label: 'Completed', value: selectedComplete },
                      { label: 'Study Time', value: `${Math.floor(selectedDuration / 60)}h ${selectedDuration % 60}m` }
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderRadius: '18px', background: '#f8fafc' }}>
                        <span style={{ color: '#475569', fontWeight: 700 }}>{item.label}</span>
                        <span style={{ fontWeight: 800, color: '#0f172a' }}>{item.value}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '24px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>Sessions on this date</div>
                    {selectedPlans.length === 0 ? (
                      <div style={{ color: '#64748b', background: '#f8fafc', borderRadius: '20px', padding: '18px' }}>No study sessions scheduled yet. Click a calendar day or use the Add New button.</div>
                    ) : (
                      <div style={{ display: 'grid', gap: '14px' }}>
                        {selectedPlans.map(plan => {
                          const planStatus = getStatusInfo(plan.status, plan.plannedDate);
                          return (
                            <div key={plan._id} style={{ padding: '18px', borderRadius: '18px', background: '#eff6ff', borderLeft: '4px solid #2563eb', border: '1px solid #dbeafe', boxShadow: '0 8px 18px rgba(37, 99, 235, 0.08)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                                <div style={{ minWidth: 0, flex: '1 1 0%' }}>
                                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '8px', wordBreak: 'break-word', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: '1.25', maxHeight: '42px' }}>{plan.topic?.name || plan.subject?.name || 'Study Session'}</div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                                    <span style={{ color: '#475569', fontSize: '13px' }}>⏰ {plan.duration} mins</span>
                                    <span style={{ background: planStatus.color, color: 'white', padding: '5px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 700 }}>{planStatus.icon} {planStatus.label}</span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => { setSelectedPlan(plan); setShowDetailsModal(true); }}
                                  style={{ border: 'none', background: 'linear-gradient(135deg, #0b1f3b 0%, #2563eb 100%)', color: 'white', borderRadius: '14px', padding: '10px 14px', cursor: 'pointer', fontWeight: 700, boxShadow: '0 12px 22px rgba(37, 99, 235, 0.18)' }}
                                >
                                  Details
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        title={isEditMode ? 'Edit Study Plan' : 'Create New Study Plan'}
        onClose={() => { setShowCreateModal(false); resetForm(); }}
        size="medium"
      >
        <form onSubmit={handleCreatePlan}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '16px' }}>
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
                list="topics-list"
                placeholder="Enter topic"
                style={styles.input}
                value={formData.topic}
                onChange={handleTopicChange}
              />
              {topicError && <p style={{ margin: '6px 0 0 0', color: '#dc2626', fontSize: '13px' }}>{topicError}</p>}
              <datalist id="topics-list">
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

          <div style={{ marginBottom: '16px' }}>
            <label style={styles.label}>Notes</label>
            <textarea
              placeholder="Add notes..."
              style={{ ...styles.input, height: '80px', resize: 'vertical' }}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={styles.label}>Thumbnail Photo</label>
            <input
              type="file"
              accept="image/*"
              style={styles.input}
              onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" style={styles.button}>{isEditMode ? 'Update Plan' : 'Create Plan'}</button>
            <button
              type="button"
              onClick={() => { setShowCreateModal(false); resetForm(); }}
              style={{ ...styles.button, background: '#e2e8f0', color: '#0b1f3b' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* View Details Modal */}
      {selectedPlan && (
        <Modal
          isOpen={showDetailsModal}
          title="Activity Details"
          onClose={() => { setShowDetailsModal(false); setSelectedPlan(null); }}
          size="medium"
        >
          {(() => {
            const planStatus = getStatusInfo(selectedPlan.status, selectedPlan.plannedDate);
            return (
              <div style={{ display: 'grid', gap: '20px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '18px', padding: '20px', borderRadius: '24px', background: '#eef2ff', border: '1px solid #c7d2fe' }}>
                  <div style={{ minWidth: 0, flex: '1 1 320px' }}>
                    <div style={{ fontSize: '12px', color: '#2563eb', marginBottom: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Activity Summary</div>
                    <div style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', lineHeight: 1.15 }}>{selectedPlan.topic?.name || selectedPlan.subject?.name || 'Study Session'}</div>
                    <div style={{ marginTop: '10px', fontSize: '14px', color: '#475569', lineHeight: 1.7 }}>{selectedPlan.notes ? selectedPlan.notes.substring(0, 120) + (selectedPlan.notes.length > 120 ? '...' : '') : 'A planned study session with all the details in one place.'}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '200px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 14px', borderRadius: '999px', background: planStatus.color, color: 'white', fontWeight: 700, fontSize: '13px' }}>
                      {planStatus.icon} {planStatus.label}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 14px', borderRadius: '999px', background: '#e0f2fe', color: '#0c4a6e', fontWeight: 700, fontSize: '13px' }}>
                      {selectedPlan.duration} minutes
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0', background: 'white' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' }}>Date & Time</div>
                    <div style={{ fontSize: '15px', color: '#0f172a', lineHeight: 1.7 }}>{new Date(selectedPlan.plannedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div style={{ padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0', background: 'white' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' }}>Topic / Subject</div>
                    <div style={{ fontSize: '15px', color: '#0f172a', lineHeight: 1.7 }}>{selectedPlan.topic?.name || selectedPlan.subject?.name || 'Study Session'}</div>
                  </div>
                </div>

                {selectedPlan.notes && (
                  <div style={{ padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0', background: 'white' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' }}>Notes</div>
                    <div style={{ fontSize: '15px', color: '#0f172a', lineHeight: 1.8 }}>{selectedPlan.notes}</div>
                  </div>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'flex-end', paddingTop: '10px' }}>
                  <button
                    onClick={() => handleEditPlan(selectedPlan)}
                    style={{
                      background: '#2563eb',
                      color: 'white',
                      border: 'none',
                      padding: '12px 18px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 14px 28px rgba(37, 99, 235, 0.18)'
                    }}
                  >
                    <FaEdit /> Edit
                  </button>
                  {selectedPlan.status === 'pending' && (
                    <button
                      onClick={() => handleCompletePlan(selectedPlan._id)}
                      style={{
                        background: '#16a34a',
                        color: 'white',
                        border: 'none',
                        padding: '12px 18px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <FaCheckCircle /> Mark Complete
                    </button>
                  )}
                  <button
                    onClick={() => handleDeletePlan(selectedPlan._id)}
                    style={{
                      background: '#dc2626',
                      color: 'white',
                      border: 'none',
                      padding: '12px 18px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

    </div>
  );
};

export default StudyPlanner;

