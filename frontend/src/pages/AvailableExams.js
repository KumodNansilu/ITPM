import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowDown, FaArrowUp, FaBookOpen, FaCalendarAlt, FaChartBar, FaChartLine, FaChartPie, FaClock, FaLayerGroup, FaMinus, FaPlay, FaSearch, FaTags, FaTrophy } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import { examService, subjectService } from '../services/api';
import styles from '../styles/inlineStyles';
import { showError } from '../utils/alerts';

const difficultyBadgeStyle = {
  easy: styles.badgeSuccess,
  medium: styles.badgePrimary,
  hard: styles.badgeDanger,
  mixed: styles.badgeWarning
};

const AvailableExams = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [performanceVisible, setPerformanceVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const apiBaseUrl = 'http://localhost:5000';

  const resolveUploadUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${apiBaseUrl}${url}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [subjectsResponse, examsResponse, attemptsResponse] = await Promise.allSettled([
          subjectService.getAllSubjects(),
          examService.getAllExams({ isPublished: 'true' }),
          examService.getMyExamAttempts()
        ]);

        if (subjectsResponse.status === 'fulfilled') {
          setSubjects(subjectsResponse.value.data || []);
        } else {
          showError(subjectsResponse.reason?.response?.data?.message || 'Failed to load subjects');
        }

        if (examsResponse.status === 'fulfilled') {
          setExams(examsResponse.value.data || []);
        } else {
          showError(examsResponse.reason?.response?.data?.message || 'Failed to load available exams');
        }

        if (attemptsResponse.status === 'fulfilled') {
          setAttempts(attemptsResponse.value.data || []);
        } else {
          setAttempts([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredExams = useMemo(() => {
    return (exams || [])
      .filter((exam) => {
        const examSubjectId = String(exam.subject?._id || exam.subject || '');
        const matchesSubject = !selectedSubjectId || examSubjectId === String(selectedSubjectId);
        const searchBlob = [
          exam.name,
          exam.description,
          exam.subject?.name,
          exam.topic?.name,
          exam.difficulty
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        const matchesSearch = !normalizedSearch || searchBlob.includes(normalizedSearch);
        return matchesSubject && matchesSearch;
      })
      .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));
  }, [exams, normalizedSearch, selectedSubjectId]);

  const groupedSections = useMemo(() => {
    const grouped = new Map();

    filteredExams.forEach((exam) => {
      const subjectId = String(exam.subject?._id || exam.subject || '');
      if (!subjectId) return;

      if (!grouped.has(subjectId)) {
        grouped.set(subjectId, []);
      }

      grouped.get(subjectId).push(exam);
    });

    return (subjects || [])
      .map((subject) => ({
        subject,
        exams: grouped.get(String(subject._id)) || []
      }))
      .filter((section) => section.exams.length > 0);
  }, [filteredExams, subjects]);

  const selectedSubject = useMemo(() => {
    return (subjects || []).find((subject) => String(subject._id) === String(selectedSubjectId));
  }, [selectedSubjectId, subjects]);

  const averageDuration = filteredExams.length
    ? Math.round(filteredExams.reduce((sum, exam) => sum + (Number(exam.duration) || 0), 0) / filteredExams.length)
    : 0;

  const attemptsChronological = useMemo(() => {
    return [...(attempts || [])].sort((left, right) => new Date(left.attemptedAt || 0) - new Date(right.attemptedAt || 0));
  }, [attempts]);

  const latestAttempt = attemptsChronological.at(-1) || null;
  const previousAttempt = attemptsChronological.at(-2) || null;
  const latestDelta = latestAttempt && previousAttempt ? Number((latestAttempt.scorePercentage - previousAttempt.scorePercentage).toFixed(2)) : null;

  const averageScore = attemptsChronological.length
    ? Number((attemptsChronological.reduce((sum, attempt) => sum + (Number(attempt.scorePercentage) || 0), 0) / attemptsChronological.length).toFixed(2))
    : 0;

  const bestAttempt = attemptsChronological.reduce((best, attempt) => {
    if (!best) return attempt;
    return Number(attempt.scorePercentage) > Number(best.scorePercentage) ? attempt : best;
  }, null);

  const lowestAttempt = attemptsChronological.reduce((lowest, attempt) => {
    if (!lowest) return attempt;
    return Number(attempt.scorePercentage) < Number(lowest.scorePercentage) ? attempt : lowest;
  }, null);

  const subjectPerformance = useMemo(() => {
    const map = new Map();

    attemptsChronological.forEach((attempt) => {
      const subjectName = attempt.subject?.name || 'Unknown subject';
      const key = String(attempt.subject?._id || subjectName);
      const existing = map.get(key) || {
        name: subjectName,
        totalScore: 0,
        attemptsCount: 0,
        bestScore: 0
      };

      const score = Number(attempt.scorePercentage) || 0;
      existing.totalScore += score;
      existing.attemptsCount += 1;
      existing.bestScore = Math.max(existing.bestScore, score);
      map.set(key, existing);
    });

    return [...map.values()]
      .map((entry) => ({
        ...entry,
        averageScore: Number((entry.totalScore / entry.attemptsCount).toFixed(2))
      }))
      .sort((left, right) => right.averageScore - left.averageScore);
  }, [attemptsChronological]);

  const topicPerformance = useMemo(() => {
    const map = new Map();

    attemptsChronological.forEach((attempt) => {
      const topicName = attempt.topic?.name || 'General';
      const key = String(attempt.topic?._id || topicName);
      const existing = map.get(key) || {
        name: topicName,
        totalScore: 0,
        attemptsCount: 0,
        bestScore: 0
      };

      const score = Number(attempt.scorePercentage) || 0;
      existing.totalScore += score;
      existing.attemptsCount += 1;
      existing.bestScore = Math.max(existing.bestScore, score);
      map.set(key, existing);
    });

    return [...map.values()]
      .map((entry) => ({
        ...entry,
        averageScore: Number((entry.totalScore / entry.attemptsCount).toFixed(2))
      }))
      .sort((left, right) => right.averageScore - left.averageScore);
  }, [attemptsChronological]);

  const chartSeries = useMemo(() => {
    return attemptsChronological.map((attempt, index) => ({
      index: index + 1,
      label: new Date(attempt.attemptedAt || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      score: Number(attempt.scorePercentage) || 0,
      correct: Number(attempt.correctAnswers) || 0,
      wrong: Number(attempt.wrongAnswers) || 0,
      examName: attempt.exam?.name || 'Exam',
      subjectName: attempt.subject?.name || 'Unknown subject',
      topicName: attempt.topic?.name || 'General'
    }));
  }, [attemptsChronological]);

  const chartMaxScore = Math.max(100, ...chartSeries.map((entry) => entry.score), 10);

  const performanceComparison = useMemo(() => {
    if (!latestAttempt) return null;

    const previousSameExam = [...attemptsChronological]
      .reverse()
      .find((attempt) => String(attempt.exam?._id || attempt.exam) === String(latestAttempt.exam?._id || latestAttempt.exam) && String(attempt._id) !== String(latestAttempt._id));

    const compareTo = previousSameExam || previousAttempt;
    if (!compareTo) {
      return {
        change: 0,
        label: 'First attempt'
      };
    }

    const change = Number((latestAttempt.scorePercentage - compareTo.scorePercentage).toFixed(2));

    return {
      change,
      label: previousSameExam ? 'vs previous attempt on same exam' : 'vs previous attempt'
    };
  }, [attemptsChronological, latestAttempt, previousAttempt]);

  const linePoints = chartSeries.map((entry, index) => {
    const x = chartSeries.length === 1 ? 50 : 10 + (index * 80) / (chartSeries.length - 1);
    const y = 180 - (entry.score / chartMaxScore) * 140;
    return { x, y, ...entry };
  });

  const linePath = linePoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

  const latestCorrect = latestAttempt ? Number(latestAttempt.correctAnswers) || 0 : 0;
  const latestWrong = latestAttempt ? Number(latestAttempt.wrongAnswers) || 0 : 0;
  const latestTotal = latestCorrect + latestWrong || 1;
  const latestCorrectPercent = (latestCorrect / latestTotal) * 100;

  const handleOpenExamCenter = () => {
    navigate('/mcq');
  };

  const openPerformancePanel = () => {
    setPerformanceVisible(true);
    window.setTimeout(() => {
      document.getElementById('performance-tracking-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const renderExamCard = (exam) => (
    <div
      key={exam._id}
      style={{
        ...styles.card,
        marginBottom: 0,
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}
    >
      {exam.thumbnailUrl ? (
        <img
          src={resolveUploadUrl(exam.thumbnailUrl)}
          alt={exam.name}
          style={{ width: '100%', height: '170px', objectFit: 'cover', borderRadius: '14px' }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            minHeight: '170px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #0b1f3b 0%, #1e3a8a 60%, #60a5fa 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'flex-end',
            padding: '16px',
            boxSizing: 'border-box',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: '-18px',
              top: '-18px',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.12)'
            }}
          />
          <div>
            <div style={{ fontSize: '12px', letterSpacing: '0.6px', opacity: 0.8, marginBottom: '6px' }}>AVAILABLE EXAM</div>
            <div style={{ fontSize: '20px', fontWeight: 800, lineHeight: 1.2 }}>{exam.name}</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 220px' }}>
          <h3 style={{ margin: 0, marginBottom: '6px', color: '#0b1f3b' }}>{exam.name}</h3>
          <p style={{ margin: 0, color: '#475569', lineHeight: 1.6 }}>
            {(exam.description || '').trim()
              ? exam.description
              : 'This exam is ready to attempt and grouped under its subject for quick browsing.'}
          </p>
        </div>
        <span style={{ ...styles.badge, background: '#e0f2fe', color: '#075985', whiteSpace: 'nowrap' }}>
          <FaTrophy /> Published
        </span>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ ...styles.badge, ...styles.badgePrimary }}>
          <FaBookOpen /> {exam.subject?.name || 'Subject'}
        </span>
        <span style={{ ...styles.badge, ...(difficultyBadgeStyle[exam.difficulty] || styles.badgePrimary) }}>
          <FaTags /> {exam.difficulty || 'mixed'}
        </span>
        <span style={{ ...styles.badge, ...styles.badgePrimary }}>
          <FaLayerGroup /> {exam.totalQuestions || 10} questions
        </span>
        <span style={{ ...styles.badge, ...styles.badgePrimary }}>
          <FaClock /> {exam.duration || 30} min
        </span>
        <span style={{ ...styles.badge, ...styles.badgePrimary }}>
          <FaCalendarAlt /> Pass {exam.passingPercentage || 60}%
        </span>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" style={styles.button} onClick={handleOpenExamCenter}>
          <FaPlay /> Open Exam Center
        </button>
        <div style={{ color: '#64748b', fontSize: '13px' }}>
          Created by {exam.createdBy?.name || 'Tutor'}
        </div>
      </div>
    </div>
  );

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

  const totalSubjectsWithExams = groupedSections.length;

  return (
    <div style={{ ...styles.container, marginTop: '30px' }}>
      <style>
        {`@keyframes availableExamsFloat {
          0%, 100% {
            transform: translateY(0px);
            box-shadow: 0 12px 24px rgba(2,6,23,0.3);
          }
          50% {
            transform: translateY(-6px);
            box-shadow: 0 18px 30px rgba(2,6,23,0.4);
          }
        }`}
      </style>

      <div style={{ ...styles.card, background: 'linear-gradient(135deg, #0b1f3b 0%, #1e3a8a 100%)', color: 'white', marginBottom: '16px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top right, rgba(96,165,250,0.26), transparent 35%), radial-gradient(circle at bottom left, rgba(255,255,255,0.12), transparent 30%)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <div>
            <p style={{ margin: 0, marginBottom: '6px', letterSpacing: '0.4px', fontSize: '13px', opacity: 0.9 }}>AVAILABLE EXAMS</p>
            <h1 style={{ margin: 0, marginBottom: '8px' }}>Browse exams subject wise</h1>
            <p style={{ margin: 0, opacity: 0.9, maxWidth: '720px' }}>
              Published exams are grouped by subject so students can quickly find the right assessment and jump into the exam center.
            </p>
          </div>
          <div
            style={{
              padding: '10px',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.28)',
              background: 'rgba(255,255,255,0.14)',
              backdropFilter: 'blur(10px) saturate(145%)',
              WebkitBackdropFilter: 'blur(10px) saturate(145%)',
              boxShadow: '0 12px 24px rgba(2,6,23,0.3)',
              animation: 'availableExamsFloat 5s ease-in-out infinite'
            }}
          >
            <div style={{ width: '160px', minHeight: '84px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))' }}>
              <FaBookOpen style={{ fontSize: '34px' }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '18px' }}>
        <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}>
          <div style={{ fontSize: '12px', color: 'rgba(11,31,59,0.65)', marginBottom: '6px' }}>Published exams</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: '#0b1f3b' }}>
            <FaLayerGroup /> {filteredExams.length}
          </div>
        </div>
        <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}>
          <div style={{ fontSize: '12px', color: 'rgba(11,31,59,0.65)', marginBottom: '6px' }}>Subjects</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: '#0b1f3b' }}>
            <FaBookOpen /> {subjects.length}
          </div>
        </div>
        <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}>
          <div style={{ fontSize: '12px', color: 'rgba(11,31,59,0.65)', marginBottom: '6px' }}>Subjects with exams</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: '#0b1f3b' }}>
            <FaTrophy /> {totalSubjectsWithExams}
          </div>
        </div>
        <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}>
          <div style={{ fontSize: '12px', color: 'rgba(11,31,59,0.65)', marginBottom: '6px' }}>Avg. duration</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: '#0b1f3b' }}>
            <FaClock /> {averageDuration || 0} min
          </div>
        </div>
        <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '12px', color: 'rgba(11,31,59,0.65)' }}>Performance Tracking</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: '#0b1f3b' }}>
            <FaChartLine /> {attemptsChronological.length} attempts
          </div>
          <button type="button" onClick={openPerformancePanel} style={{ ...styles.button, width: '100%', padding: '8px 12px' }}>
            View performance
          </button>
        </div>
      </div>

      {performanceVisible && (
        <section id="performance-tracking-section" style={{ ...styles.card, marginBottom: '18px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <div>
              <h2 style={{ margin: 0, marginBottom: '6px', color: '#0b1f3b' }}>MCQ Performance Tracking and Visualization</h2>
              <p style={{ margin: 0, color: '#475569', lineHeight: 1.6 }}>
                Track exam results, compare attempts, and review your improvement across subjects and topics.
              </p>
            </div>
            <button type="button" onClick={() => setPerformanceVisible(false)} style={styles.button}>
              Hide performance
            </button>
          </div>

          {attemptsChronological.length > 0 ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(11,31,59,0.65)', marginBottom: '6px' }}>Average score</div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#0b1f3b' }}>{averageScore}%</div>
                </div>
                <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(11,31,59,0.65)', marginBottom: '6px' }}>Best score</div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#166534' }}>{bestAttempt ? `${bestAttempt.scorePercentage}%` : '0%'}</div>
                </div>
                <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(11,31,59,0.65)', marginBottom: '6px' }}>Lowest score</div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#be123c' }}>{lowestAttempt ? `${lowestAttempt.scorePercentage}%` : '0%'}</div>
                </div>
                <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(11,31,59,0.65)', marginBottom: '6px' }}>Latest trend</div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: latestDelta > 0 ? '#166534' : latestDelta < 0 ? '#be123c' : '#0b1f3b', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {latestDelta > 0 ? <FaArrowUp /> : latestDelta < 0 ? <FaArrowDown /> : <FaMinus />}
                    {latestDelta === null ? 'First attempt' : `${latestDelta > 0 ? '+' : ''}${latestDelta}%`}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div style={{ ...styles.card, marginBottom: 0, padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0, color: '#0b1f3b' }}>Line chart</h3>
                    <FaChartLine color="#1e3a8a" />
                  </div>
                  <svg viewBox="0 0 100 220" style={{ width: '100%', height: '220px', display: 'block' }}>
                    <line x1="10" y1="20" x2="10" y2="180" stroke="#cbd5e1" strokeWidth="1" />
                    <line x1="10" y1="180" x2="90" y2="180" stroke="#cbd5e1" strokeWidth="1" />
                    {[0, 25, 50, 75, 100].map((tick) => (
                      <g key={tick}>
                        <line x1="10" y1={180 - (tick / 100) * 140} x2="90" y2={180 - (tick / 100) * 140} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2 2" />
                        <text x="2" y={184 - (tick / 100) * 140} fill="#64748b" fontSize="6">{tick}%</text>
                      </g>
                    ))}
                    {linePath && <path d={linePath} fill="none" stroke="#1e3a8a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
                    {linePoints.map((point) => (
                      <g key={`${point.index}-${point.label}`}>
                        <circle cx={point.x} cy={point.y} r="2.8" fill="#0b1f3b" />
                        <text x={point.x} y="196" fill="#64748b" fontSize="6" textAnchor="middle">{point.label}</text>
                      </g>
                    ))}
                  </svg>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                    {chartSeries.slice(-6).map((entry) => (
                      <span key={`${entry.index}-${entry.label}`} style={{ ...styles.badge, ...styles.badgePrimary, marginRight: 0 }}>
                        {entry.examName}: {entry.score}%
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ ...styles.card, marginBottom: 0, padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0, color: '#0b1f3b' }}>Bar chart</h3>
                    <FaChartBar color="#1e3a8a" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', minHeight: '220px', paddingTop: '8px' }}>
                    {chartSeries.map((entry) => {
                      const height = Math.max(18, (entry.score / 100) * 160);
                      return (
                        <div key={`${entry.index}-${entry.examName}`} style={{ flex: 1, minWidth: '34px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 800, color: '#0b1f3b' }}>{entry.score}%</div>
                          <div style={{ width: '100%', maxWidth: '46px', height: '170px', display: 'flex', alignItems: 'flex-end', background: '#eff6ff', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(30,64,175,0.12)' }}>
                            <div style={{ width: '100%', height: `${height}px`, background: 'linear-gradient(180deg, #60a5fa 0%, #1e3a8a 100%)', borderRadius: '12px 12px 0 0' }} />
                          </div>
                          <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'center' }}>{entry.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ ...styles.card, marginBottom: 0, padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0, color: '#0b1f3b' }}>Pie chart</h3>
                    <FaChartPie color="#1e3a8a" />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px 0 18px 0' }}>
                    <div style={{ width: '190px', height: '190px', borderRadius: '50%', background: `conic-gradient(#16a34a 0 ${latestCorrectPercent}%, #ef4444 ${latestCorrectPercent}% 100%)`, position: 'relative', boxShadow: 'inset 0 0 0 8px rgba(255,255,255,0.75)' }}>
                      <div style={{ position: 'absolute', inset: '34px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center', boxShadow: '0 10px 22px rgba(2,6,23,0.10)' }}>
                        <div style={{ fontSize: '28px', fontWeight: 800, color: '#0b1f3b' }}>{Math.round(latestCorrectPercent)}%</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>Correct answers</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', color: '#0b1f3b' }}>
                      <span>Correct</span>
                      <strong>{latestCorrect}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', color: '#0b1f3b' }}>
                      <span>Incorrect</span>
                      <strong>{latestWrong}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div style={{ ...styles.card, marginBottom: 0, padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(11,31,59,0.65)', marginBottom: '6px' }}>Strongest subject</div>
                  <div style={{ fontWeight: 800, color: '#0b1f3b' }}>{subjectPerformance[0]?.name || 'N/A'}</div>
                  <div style={{ color: '#475569', marginTop: '6px' }}>
                    Avg {subjectPerformance[0]?.averageScore || 0}% across {subjectPerformance[0]?.attemptsCount || 0} attempt{(subjectPerformance[0]?.attemptsCount || 0) === 1 ? '' : 's'}
                  </div>
                </div>
                <div style={{ ...styles.card, marginBottom: 0, padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(11,31,59,0.65)', marginBottom: '6px' }}>Weakest subject</div>
                  <div style={{ fontWeight: 800, color: '#0b1f3b' }}>{subjectPerformance.at(-1)?.name || 'N/A'}</div>
                  <div style={{ color: '#475569', marginTop: '6px' }}>
                    Avg {subjectPerformance.at(-1)?.averageScore || 0}% across {subjectPerformance.at(-1)?.attemptsCount || 0} attempt{(subjectPerformance.at(-1)?.attemptsCount || 0) === 1 ? '' : 's'}
                  </div>
                </div>
                <div style={{ ...styles.card, marginBottom: 0, padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(11,31,59,0.65)', marginBottom: '6px' }}>Strongest topic</div>
                  <div style={{ fontWeight: 800, color: '#0b1f3b' }}>{topicPerformance[0]?.name || 'N/A'}</div>
                  <div style={{ color: '#475569', marginTop: '6px' }}>
                    Avg {topicPerformance[0]?.averageScore || 0}% across {topicPerformance[0]?.attemptsCount || 0} attempt{(topicPerformance[0]?.attemptsCount || 0) === 1 ? '' : 's'}
                  </div>
                </div>
                <div style={{ ...styles.card, marginBottom: 0, padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(11,31,59,0.65)', marginBottom: '6px' }}>Weakest topic</div>
                  <div style={{ fontWeight: 800, color: '#0b1f3b' }}>{topicPerformance.at(-1)?.name || 'N/A'}</div>
                  <div style={{ color: '#475569', marginTop: '6px' }}>
                    Avg {topicPerformance.at(-1)?.averageScore || 0}% across {topicPerformance.at(-1)?.attemptsCount || 0} attempt{(topicPerformance.at(-1)?.attemptsCount || 0) === 1 ? '' : 's'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div style={{ ...styles.card, marginBottom: 0, padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(11,31,59,0.65)', marginBottom: '6px' }}>Latest comparison</div>
                  <div style={{ fontWeight: 800, color: '#0b1f3b', marginBottom: '6px' }}>
                    {latestAttempt?.exam?.name || 'Latest attempt'}
                  </div>
                  <div style={{ color: latestDelta > 0 ? '#166534' : latestDelta < 0 ? '#be123c' : '#0b1f3b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {performanceComparison?.change > 0 ? <FaArrowUp /> : performanceComparison?.change < 0 ? <FaArrowDown /> : <FaMinus />}
                    {performanceComparison?.change === null || performanceComparison?.change === undefined
                      ? 'No previous attempt'
                      : `${performanceComparison.change > 0 ? '+' : ''}${performanceComparison.change}% ${performanceComparison.label}`}
                  </div>
                </div>
                <div style={{ ...styles.card, marginBottom: 0, padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(11,31,59,0.65)', marginBottom: '6px' }}>Best score</div>
                  <div style={{ fontWeight: 800, color: '#0b1f3b' }}>{bestAttempt?.exam?.name || 'N/A'}</div>
                  <div style={{ color: '#475569', marginTop: '6px' }}>{bestAttempt ? `${bestAttempt.scorePercentage}% on ${new Date(bestAttempt.attemptedAt).toLocaleDateString()}` : 'No data'}</div>
                </div>
                <div style={{ ...styles.card, marginBottom: 0, padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(11,31,59,0.65)', marginBottom: '6px' }}>Lowest score</div>
                  <div style={{ fontWeight: 800, color: '#0b1f3b' }}>{lowestAttempt?.exam?.name || 'N/A'}</div>
                  <div style={{ color: '#475569', marginTop: '6px' }}>{lowestAttempt ? `${lowestAttempt.scorePercentage}% on ${new Date(lowestAttempt.attemptedAt).toLocaleDateString()}` : 'No data'}</div>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
                  <thead>
                    <tr style={{ color: '#475569', textAlign: 'left' }}>
                      <th style={{ padding: '0 12px 4px 12px' }}>Attempt</th>
                      <th style={{ padding: '0 12px 4px 12px' }}>Exam</th>
                      <th style={{ padding: '0 12px 4px 12px' }}>Subject</th>
                      <th style={{ padding: '0 12px 4px 12px' }}>Topic</th>
                      <th style={{ padding: '0 12px 4px 12px' }}>Score</th>
                      <th style={{ padding: '0 12px 4px 12px' }}>Correct / Wrong</th>
                      <th style={{ padding: '0 12px 4px 12px' }}>Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...attemptsChronological].reverse().map((attempt, index) => {
                      const previousSameExam = attemptsChronological
                        .slice(0, attemptsChronological.length - index - 1)
                        .reverse()
                        .find((pastAttempt) => String(pastAttempt.exam?._id || pastAttempt.exam) === String(attempt.exam?._id || attempt.exam));
                      const change = previousSameExam ? Number((attempt.scorePercentage - previousSameExam.scorePercentage).toFixed(2)) : null;
                      const progressLabel = change === null ? 'First attempt' : change > 0 ? 'Improved' : change < 0 ? 'Decreased' : 'No change';
                      const progressColor = change > 0 ? '#166534' : change < 0 ? '#be123c' : '#0b1f3b';

                      return (
                        <tr key={attempt._id} style={{ background: 'white', boxShadow: '0 10px 24px rgba(2,6,23,0.06)' }}>
                          <td style={{ padding: '12px', borderTopLeftRadius: '14px', borderBottomLeftRadius: '14px' }}>{new Date(attempt.attemptedAt).toLocaleDateString()}</td>
                          <td style={{ padding: '12px' }}>{attempt.exam?.name || 'Exam'}</td>
                          <td style={{ padding: '12px' }}>{attempt.subject?.name || 'Unknown'}</td>
                          <td style={{ padding: '12px' }}>{attempt.topic?.name || 'General'}</td>
                          <td style={{ padding: '12px', fontWeight: 800 }}>{attempt.scorePercentage}%</td>
                          <td style={{ padding: '12px' }}>{attempt.correctAnswers} / {attempt.wrongAnswers}</td>
                          <td style={{ padding: '12px', borderTopRightRadius: '14px', borderBottomRightRadius: '14px', color: progressColor, fontWeight: 700 }}>
                            {change === null ? 'No previous data' : `${change > 0 ? '+' : ''}${change}% ${progressLabel}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '26px 12px' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0b1f3b', marginBottom: '6px' }}>No performance history yet</div>
              <p style={{ margin: 0, color: '#475569' }}>Take a mock exam to start tracking scores, trends, and improvement over time.</p>
            </div>
          )}
        </section>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', gap: '18px', alignItems: 'start' }}>
        <aside style={{ ...styles.card, marginBottom: 0, position: 'sticky', top: '108px' }}>
          <h2 style={{ marginTop: 0, marginBottom: '10px', color: '#0b1f3b' }}>Subjects</h2>
          <p style={{ marginTop: 0, color: '#475569', lineHeight: 1.6 }}>
            Narrow the list to a single subject or browse every published exam in one place.
          </p>

          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <FaSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search exams"
              style={{ ...styles.input, margin: 0, paddingLeft: '40px' }}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedSubjectId('');
              setSearchTerm('');
            }}
            style={{ ...styles.button, width: '100%', marginBottom: '12px' }}
          >
            Show all subjects
          </button>

          <div style={{ display: 'grid', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setSelectedSubjectId('')}
              style={{
                ...styles.button,
                justifyContent: 'space-between',
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                background: selectedSubjectId ? 'linear-gradient(135deg, #0b3d91 0%, #1e40af 100%)' : 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)'
              }}
            >
              <span>All subjects</span>
              <span style={{ fontWeight: 800 }}>{filteredExams.length}</span>
            </button>

            {subjects.map((subject) => {
              const count = filteredExams.filter((exam) => String(exam.subject?._id || exam.subject || '') === String(subject._id)).length;
              const isActive = String(selectedSubjectId) === String(subject._id);

              return (
                <button
                  key={subject._id}
                  type="button"
                  onClick={() => setSelectedSubjectId(subject._id)}
                  style={{
                    ...styles.card,
                    marginBottom: 0,
                    padding: '14px 16px',
                    border: isActive ? '1px solid rgba(30,64,175,0.55)' : styles.card.border,
                    background: isActive ? 'linear-gradient(135deg, rgba(30,64,175,0.14), rgba(255,255,255,0.95))' : styles.card.background,
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, color: '#0b1f3b', marginBottom: '4px' }}>{subject.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {(subject.degreeName || subject.academicFaculty || 'General').toString()}
                      {subject.year ? ` • Year ${subject.year}` : ''}
                      {subject.semester ? ` • Sem ${subject.semester}` : ''}
                    </div>
                  </div>
                  <span style={{ ...styles.badge, ...styles.badgePrimary, marginRight: 0 }}>{count}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <main style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ ...styles.card, marginBottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0, marginBottom: '4px', color: '#0b1f3b' }}>
                {selectedSubject ? selectedSubject.name : 'All subjects'}
              </h2>
              <div style={{ color: '#64748b' }}>
                {filteredExams.length} exam{filteredExams.length === 1 ? '' : 's'} ready to view
              </div>
            </div>
            <button type="button" style={styles.button} onClick={handleOpenExamCenter}>
              Open exam center
            </button>
          </div>

          {groupedSections.length > 0 ? (
            groupedSections.map(({ subject, exams: subjectExams }) => (
              <section key={subject._id} style={{ ...styles.card, marginBottom: 0, padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  <div>
                    <h3 style={{ margin: 0, marginBottom: '6px', color: '#0b1f3b' }}>{subject.name}</h3>
                    <p style={{ margin: 0, color: '#475569' }}>
                      {subject.code ? `${subject.code} • ` : ''}
                      {subject.degreeName || subject.academicFaculty || 'General'}
                      {subject.year ? ` • Year ${subject.year}` : ''}
                      {subject.semester ? ` • Semester ${subject.semester}` : ''}
                    </p>
                  </div>
                  <span style={{ ...styles.badge, ...styles.badgePrimary, marginRight: 0 }}>
                    {subjectExams.length} exam{subjectExams.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  {subjectExams.map(renderExamCard)}
                </div>
              </section>
            ))
          ) : (
            <div style={{ ...styles.card, marginBottom: 0, textAlign: 'center', padding: '44px 24px' }}>
              <FaBookOpen style={{ fontSize: '36px', color: '#1e3a8a', marginBottom: '12px' }} />
              <h2 style={{ marginTop: 0, color: '#0b1f3b' }}>No exams found</h2>
              <p style={{ marginTop: 0, color: '#475569', maxWidth: '520px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
                Try another subject or clear the search box to see every published exam.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button type="button" style={styles.button} onClick={() => setSelectedSubjectId('')}>
                  Clear subject filter
                </button>
                <button type="button" style={styles.button} onClick={handleOpenExamCenter}>
                  Open exam center
                </button>
              </div>
            </div>
          )}

          <div style={{ ...styles.card, marginBottom: 0, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 800, color: '#0b1f3b', marginBottom: '4px' }}>Student access</div>
              <div style={{ color: '#64748b' }}>
                Logged in as {user?.name || 'student'}
              </div>
            </div>
            <button type="button" style={styles.button} onClick={() => navigate('/mcq')}>
              <FaPlay /> Go to MCQ area
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AvailableExams;