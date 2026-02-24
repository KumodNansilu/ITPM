import React, { useState, useEffect } from 'react';
import { mcqService, subjectService } from '../services/api';
import { toast } from 'react-toastify';
import styles from '../styles/inlineStyles';

const MCQ = () => {
  const [mcqs, setMcqs] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [userScore, setUserScore] = useState(null);

  useEffect(() => {
    fetchMCQs();
    fetchSubjects();
    fetchUserScore();
  }, [selectedSubject]);

  const fetchMCQs = async () => {
    try {
      const response = selectedSubject
        ? await mcqService.getMCQsBySubject(selectedSubject)
        : await mcqService.getMCQsBySubject('');
      setMcqs(response.data);
    } catch (error) {
      toast.error('Failed to fetch MCQs');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await subjectService.getAllSubjects();
      setSubjects(response.data);
    } catch (error) {
      toast.error('Failed to fetch subjects');
    }
  };

  const fetchUserScore = async () => {
    try {
      const response = await mcqService.getQuizScore({
        subjectId: selectedSubject || undefined
      });
      setUserScore(response.data);
    } catch (error) {
      // Score not yet available
    }
  };

  const handleAttemptMCQ = async (mcqId) => {
    // This would navigate to an attempt page
    toast.info('MCQ attempt feature coming soon');
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
      <h1 style={{ marginBottom: '30px' }}>MCQ Mock Exams</h1>

      {userScore && (
        <div style={{ ...styles.card, marginBottom: '30px', background: '#e8f5e9' }}>
          <h2>Your Score</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px', marginTop: '20px' }}>
            <div>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#388e3c' }}>
                {userScore.correctAttempts} / {userScore.totalAttempts}
              </p>
              <p>Correct Answers</p>
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
                {userScore.scorePercentage}%
              </p>
              <p>Percentage</p>
            </div>
          </div>
        </div>
      )}

      <div style={{ ...styles.card, marginBottom: '30px' }}>
        <label style={styles.label}>Filter by Subject</label>
        <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} style={styles.input}>
          <option value="">All Subjects</option>
          {subjects.map(subject => (
            <option key={subject._id} value={subject._id}>
              {subject.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gap: '15px' }}>
        {mcqs && mcqs.map(mcq => (
          <div key={mcq._id} style={styles.card}>
            <h3>{mcq.question}</h3>
            <div style={{ margin: '15px 0' }}>
              {mcq.options && mcq.options.map((option, idx) => (
                <div key={idx} style={{ padding: '8px', marginBottom: '8px', border: '1px solid #ddd', borderRadius: '4px' }}>
                  {String.fromCharCode(65 + idx)}. {option.text}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ ...styles.badge, ...(mcq.difficulty === 'easy' ? styles.badgeSuccess : mcq.difficulty === 'medium' ? styles.badgeWarning : styles.badgeDanger) }}>
                  {mcq.difficulty.toUpperCase()}
                </span>
              </div>
              <button onClick={() => handleAttemptMCQ(mcq._id)} style={styles.button}>
                Attempt Question
              </button>
            </div>
          </div>
        ))}
      </div>

      {mcqs.length === 0 && (
        <div style={styles.alertInfo}>
          No MCQ questions available. Check back later!
        </div>
      )}
    </div>
  );
};

export default MCQ;
