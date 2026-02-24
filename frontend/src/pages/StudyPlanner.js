import React, { useState, useContext, useEffect } from 'react';
import { planService, subjectService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import styles from '../styles/inlineStyles';

const StudyPlanner = () => {
  const [plans, setPlans] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
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
    if (window.confirm('Are you sure you want to delete this plan?')) {
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

    try {
      await planService.createPlan({
        subject: formData.subject,
        topic: formData.topic || undefined,
        plannedDate: formData.plannedDate,
        duration: Number(formData.duration) || 60,
        notes: formData.notes || ''
      });

      toast.success('Study plan created successfully!');
      setFormData({
        subject: '',
        topic: '',
        plannedDate: '',
        duration: 60,
        notes: ''
      });
      setShowForm(false);
      fetchPlans();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create plan');
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
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value, topic: '' }))}
              required
            >
              <option value="">Select a subject</option>
              {subjects.map(subject => (
                <option key={subject._id} value={subject._id}>{subject.name}</option>
              ))}
            </select>

            <label style={styles.label}>Topic</label>
            <select
              style={styles.input}
              value={formData.topic}
              onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
            >
              <option value="">Select a topic (optional)</option>
              {topics.map(topic => (
                <option key={topic._id} value={topic._id}>{topic.name}</option>
              ))}
            </select>

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

            <button type="submit" style={styles.button}>Create Plan</button>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gap: '15px' }}>
        {plans && plans.map(plan => (
          <div key={plan._id} style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h3>{plan.subject?.name}</h3>
                <p><strong>Topic:</strong> {plan.topic?.name}</p>
                <p><strong>Date:</strong> {new Date(plan.plannedDate).toLocaleDateString()}</p>
                <p><strong>Duration:</strong> {plan.duration} minutes</p>
                <span style={{ ...styles.badge, ...(plan.status === 'completed' ? styles.badgeSuccess : styles.badgePrimary) }}>
                  {plan.status}
                </span>
              </div>
              <div>
                {plan.status === 'pending' && (
                  <>
                    <button onClick={() => handleCompletePlan(plan._id)} style={{ ...styles.button, marginRight: '10px' }}>
                      Mark Complete
                    </button>
                  </>
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
        <div style={styles.alertInfo}>
          No study plans yet. Create one to get started!
        </div>
      )}
    </div>
  );
};

export default StudyPlanner;
