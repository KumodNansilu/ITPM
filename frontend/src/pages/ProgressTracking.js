import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { planService, examService, appointmentService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import styles from '../styles/inlineStyles';
import { showError } from '../utils/alerts';
import { FaChartLine, FaChartPie, FaFire, FaListAlt, FaMedal, FaCalendarCheck, FaBookOpen, FaClipboardCheck } from 'react-icons/fa';

// Redirect existing toast calls to SweetAlert2.
const toast = {
  error: (message) => showError(message)
};

const toDateKey = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().split('T')[0];
};

const formatShortDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const getProgressStatus = (score) => {
  if (score >= 75) return { label: 'Advanced', color: '#166534', style: styles.badgeSuccess };
  if (score >= 40) return { label: 'Intermediate', color: '#1d4ed8', style: styles.badgePrimary };
  return { label: 'Beginner', color: '#b45309', style: styles.badgeWarning };
};

const ProgressTracking = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [allPlans, setAllPlans] = useState([]);
  const [examAttempts, setExamAttempts] = useState([]);
  const [bookedSessions, setBookedSessions] = useState([]);
  const [rangeDays, setRangeDays] = useState(7);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [plansRes, attemptsRes, bookingsRes] = await Promise.all([
          planService.getStudentPlans(),
          examService.getMyExamAttempts(),
          appointmentService.getStudentBookings()
        ]);

        setAllPlans(plansRes.data || []);
        setExamAttempts(attemptsRes.data || []);
        setBookedSessions(bookingsRes.data || []);
      } catch (error) {
        toast.error('Failed to fetch progress data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const rangeStartDate = useMemo(() => {
    const anchorDate = new Date();
    anchorDate.setHours(0, 0, 0, 0);
    anchorDate.setDate(anchorDate.getDate() - (rangeDays - 1));
    return anchorDate;
  }, [rangeDays]);

  const isWithinRange = useCallback((value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    return date >= rangeStartDate;
  }, [rangeStartDate]);

  const rangePlans = useMemo(() => {
    return allPlans.filter((plan) => isWithinRange(plan.completedAt || plan.plannedDate));
  }, [allPlans, isWithinRange]);

  const rangeCompletedPlans = useMemo(() => {
    return rangePlans.filter((plan) => plan.status === 'completed');
  }, [rangePlans]);

  const rangePendingPlans = useMemo(() => {
    return rangePlans.filter((plan) => plan.status === 'pending');
  }, [rangePlans]);

  const rangeExamAttempts = useMemo(() => {
    return examAttempts.filter((attempt) => isWithinRange(attempt.attemptedAt));
  }, [examAttempts, isWithinRange]);

  const rangeBookedSessions = useMemo(() => {
    return bookedSessions.filter((booking) => isWithinRange(booking.createdAt || booking.scheduledDate));
  }, [bookedSessions, isWithinRange]);

  const completionRate = rangePlans.length > 0 ? Math.round((rangeCompletedPlans.length / rangePlans.length) * 100) : 0;

  const completedTopicCount = useMemo(() => {
    const topicKeys = new Set(
      rangeCompletedPlans
        .map((plan) => plan.topic?._id || plan.topic?.name || '')
        .filter(Boolean)
    );
    return topicKeys.size;
  }, [rangeCompletedPlans]);

  const averageScore = rangeExamAttempts.length > 0
    ? Math.round(rangeExamAttempts.reduce((sum, attempt) => sum + (Number(attempt.scorePercentage) || 0), 0) / rangeExamAttempts.length)
    : 0;

  const studySessionsCount = rangeBookedSessions.filter((booking) => booking.status !== 'cancelled').length;

  const activityDateSet = useMemo(() => {
    const keys = new Set();
    rangeCompletedPlans.forEach((plan) => keys.add(toDateKey(plan.completedAt || plan.plannedDate)));
    rangeExamAttempts.forEach((attempt) => keys.add(toDateKey(attempt.attemptedAt)));
    rangeBookedSessions.forEach((booking) => keys.add(toDateKey(booking.createdAt || booking.scheduledDate)));
    return keys;
  }, [rangeCompletedPlans, rangeExamAttempts, rangeBookedSessions]);

  const streakDays = useMemo(() => {
    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    while (true) {
      const key = toDateKey(cursor);
      if (!activityDateSet.has(key)) break;
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  }, [activityDateSet]);

  const consistencyScore = Math.round(Math.min(100, completionRate * 0.6 + Math.min(streakDays * 12, 100) * 0.4));
  const progressStatus = getProgressStatus(completionRate);

  const lineSeries = useMemo(() => {
    const days = rangeDays;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from({ length: days }, (_, offset) => {
      const current = new Date(today);
      current.setDate(today.getDate() - (days - 1 - offset));
      const key = toDateKey(current);

      const dailyPlans = rangePlans.filter((plan) => toDateKey(plan.plannedDate) === key || toDateKey(plan.completedAt) === key);
      const dailyCompleted = rangeCompletedPlans.filter((plan) => toDateKey(plan.completedAt || plan.plannedDate) === key);
      const dailyCompletionPercent = dailyPlans.length > 0 ? (dailyCompleted.length / dailyPlans.length) * 100 : 0;

      const dailyAttempts = rangeExamAttempts.filter((attempt) => toDateKey(attempt.attemptedAt) === key);
      const dailyScore = dailyAttempts.length > 0
        ? dailyAttempts.reduce((sum, attempt) => sum + (Number(attempt.scorePercentage) || 0), 0) / dailyAttempts.length
        : null;

      let metric = 0;
      if (dailyScore !== null && dailyPlans.length > 0) metric = Math.round((dailyScore + dailyCompletionPercent) / 2);
      else if (dailyScore !== null) metric = Math.round(dailyScore);
      else if (dailyPlans.length > 0) metric = Math.round(dailyCompletionPercent);

      return {
        key,
        label: formatShortDate(current),
        value: Math.max(0, Math.min(100, metric))
      };
    });
  }, [rangeDays, rangePlans, rangeCompletedPlans, rangeExamAttempts]);

  const linePoints = useMemo(() => {
    const width = 560;
    const height = 220;
    const left = 40;
    const right = 20;
    const top = 20;
    const bottom = 36;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;

    return lineSeries.map((entry, index) => {
      const x = left + (lineSeries.length === 1 ? plotWidth / 2 : (index * plotWidth) / (lineSeries.length - 1));
      const y = top + (1 - entry.value / 100) * plotHeight;
      return { ...entry, x, y };
    });
  }, [lineSeries]);

  const linePath = linePoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

  const pieTotal = rangeCompletedPlans.length + rangePendingPlans.length;
  const completedPercent = pieTotal > 0 ? Math.round((rangeCompletedPlans.length / pieTotal) * 100) : 0;

  const recentActivities = useMemo(() => {
    const planActivities = rangeCompletedPlans.map((plan) => ({
      type: 'Completed',
      title: `${plan.subject?.name || 'Subject'}${plan.topic?.name ? ` - ${plan.topic.name}` : ''}`,
      time: plan.completedAt || plan.plannedDate,
      icon: '✅'
    }));

    const examActivities = rangeExamAttempts.map((attempt) => ({
      type: 'Attempted MCQ Test',
      title: `${attempt.exam?.name || 'Mock Exam'} (${attempt.scorePercentage || 0}%)`,
      time: attempt.attemptedAt,
      icon: '📝'
    }));

    const bookingActivities = rangeBookedSessions.map((booking) => ({
      type: 'Booked Session',
      title: `${booking.subject?.name || 'Subject'} with ${booking.tutor?.name || 'Tutor'}`,
      time: booking.createdAt || booking.scheduledDate,
      icon: '📅'
    }));

    return [...planActivities, ...examActivities, ...bookingActivities]
      .filter((item) => item.time)
      .sort((left, right) => new Date(right.time) - new Date(left.time))
      .slice(0, 8);
  }, [rangeCompletedPlans, rangeExamAttempts, rangeBookedSessions]);

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
        {`@keyframes progressHeaderFloat {
          0%, 100% {
            transform: translateY(0px);
            box-shadow: 0 12px 24px rgba(2,6,23,0.3);
          }
          50% {
            transform: translateY(-6px);
            box-shadow: 0 18px 30px rgba(2,6,23,0.4);
          }
        }

        @keyframes progressImagePulse {
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
            <h1 style={{ margin: 0, marginBottom: '6px' }}>Progress Tracking</h1>
            <p style={{ margin: 0, opacity: 0.9 }}>{user?.name ? `${user.name}, review your consistency, completion rate, and study momentum.` : 'Review your consistency, completion rate, and study momentum.'}</p>
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
              animation: 'progressHeaderFloat 5s ease-in-out infinite'
            }}
          >
            <img
              src="/image/PTP.jpeg"
              alt="Progress tracking"
              style={{ width: '168px', height: '89px', objectFit: 'cover', borderRadius: '10px', display: 'block', animation: 'progressImagePulse 5s ease-in-out infinite' }}
            />
          </div>
        </div>
      </div>
      <h1 style={{ marginBottom: '16px' }}>📊 Progress Dashboard</h1>

      <div style={{ ...styles.card, marginBottom: '16px' }}>
        <div style={{ fontWeight: 700, color: '#0b1f3b', marginBottom: '10px' }}>Date Range</div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setRangeDays(7)}
            style={{
              ...styles.button,
              background: rangeDays === 7 ? 'linear-gradient(135deg, #0b3d91 0%, #1e40af 100%)' : '#e2e8f0',
              color: rangeDays === 7 ? '#ffffff' : '#0b1f3b',
              boxShadow: rangeDays === 7 ? styles.button.boxShadow : 'none'
            }}
          >
            Last 7 Days
          </button>
          <button
            type="button"
            onClick={() => setRangeDays(30)}
            style={{
              ...styles.button,
              background: rangeDays === 30 ? 'linear-gradient(135deg, #0b3d91 0%, #1e40af 100%)' : '#e2e8f0',
              color: rangeDays === 30 ? '#ffffff' : '#0b1f3b',
              boxShadow: rangeDays === 30 ? styles.button.boxShadow : 'none'
            }}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      <div style={{ ...styles.card, marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700, color: '#b45309' }}>
          <FaFire color="#ea580c" /> {streakDays} Day Study Streak
        </div>
        <span style={{ ...styles.badge, ...progressStatus.style, fontSize: '13px' }}>
          <FaMedal style={{ marginRight: '6px' }} /> {progressStatus.label}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px', marginBottom: '18px' }}>
        <div style={{ ...styles.card, marginBottom: 0, padding: '16px', borderLeft: '4px solid #16a34a' }}>
          <div style={{ color: '#166534', fontWeight: 700, marginBottom: '4px' }}><FaBookOpen /> Completed Topics</div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: '#0b1f3b' }}>{completedTopicCount}</div>
        </div>
        <div style={{ ...styles.card, marginBottom: 0, padding: '16px', borderLeft: '4px solid #2563eb' }}>
          <div style={{ color: '#1d4ed8', fontWeight: 700, marginBottom: '4px' }}><FaCalendarCheck /> Study Sessions</div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: '#0b1f3b' }}>{studySessionsCount}</div>
        </div>
        <div style={{ ...styles.card, marginBottom: 0, padding: '16px', borderLeft: '4px solid #ca8a04' }}>
          <div style={{ color: '#a16207', fontWeight: 700, marginBottom: '4px' }}><FaClipboardCheck /> Average Score</div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: '#0b1f3b' }}>{averageScore}%</div>
        </div>
        <div style={{ ...styles.card, marginBottom: 0, padding: '16px', borderLeft: '4px solid #dc2626' }}>
          <div style={{ color: '#b91c1c', fontWeight: 700, marginBottom: '4px' }}><FaFire /> Consistency</div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: '#0b1f3b' }}>{consistencyScore}%</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px', marginBottom: '18px' }}>
        <div style={{ ...styles.card, marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ margin: 0 }}>Progress Line Chart</h3>
            <FaChartLine color="#1e3a8a" />
          </div>
          <svg viewBox="0 0 560 220" style={{ width: '100%', height: '240px', display: 'block' }}>
            {[0, 25, 50, 75, 100].map((tick) => (
              <g key={tick}>
                <line x1="40" y1={20 + (1 - tick / 100) * 164} x2="540" y2={20 + (1 - tick / 100) * 164} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
                <text x="8" y={24 + (1 - tick / 100) * 164} fill="#64748b" fontSize="10">{tick}%</text>
              </g>
            ))}
            <line x1="40" y1="20" x2="40" y2="184" stroke="#cbd5e1" strokeWidth="1" />
            <line x1="40" y1="184" x2="540" y2="184" stroke="#cbd5e1" strokeWidth="1" />
            {linePath && <path d={linePath} fill="none" stroke="#1e3a8a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
            {linePoints.map((point, index) => {
              const showLabel = rangeDays === 7 || index % 5 === 0 || index === linePoints.length - 1;
              return (
                <g key={point.key}>
                  <circle cx={point.x} cy={point.y} r="4" fill="#0b1f3b" />
                  {showLabel && <text x={point.x} y="204" fill="#64748b" fontSize="10" textAnchor="middle">{point.label}</text>}
                </g>
              );
            })}
          </svg>
        </div>

        <div style={{ ...styles.card, marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ margin: 0 }}>Completion Rate</h3>
            <FaChartPie color="#1e3a8a" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 10px 0' }}>
            <div
              style={{
                width: '190px',
                height: '190px',
                borderRadius: '50%',
                background: `conic-gradient(#16a34a 0 ${completedPercent}%, #f97316 ${completedPercent}% 100%)`,
                position: 'relative',
                boxShadow: 'inset 0 0 0 8px rgba(255,255,255,0.75)'
              }}
            >
              <div style={{ position: 'absolute', inset: '36px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#0b1f3b' }}>{completedPercent}%</div>
                <div style={{ color: '#64748b', fontSize: '12px' }}>Completed</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#166534', fontWeight: 700 }}>Completed plans</span>
              <strong>{rangeCompletedPlans.length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#c2410c', fontWeight: 700 }}>Pending plans</span>
              <strong>{rangePendingPlans.length}</strong>
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...styles.card, marginBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0 }}>Recent Activity</h3>
          <FaListAlt color="#1e3a8a" />
        </div>

        {recentActivities.length === 0 ? (
          <div style={styles.alertInfo}>No recent activity yet. Start learning to populate your dashboard.</div>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {recentActivities.map((activity, index) => (
              <div
                key={`${activity.type}-${activity.time}-${index}`}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#0b1f3b' }}>{activity.icon} {activity.type}</div>
                  <div style={{ color: '#334155', marginTop: '4px' }}>{activity.title}</div>
                </div>
                <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 600 }}>{formatShortDate(activity.time)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressTracking;
