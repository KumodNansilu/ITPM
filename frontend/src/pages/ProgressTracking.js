import React, { useState, useEffect, useContext } from 'react';
import { planService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import styles from '../styles/inlineStyles';

const ProgressTracking = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [allPlans, setAllPlans] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'completed', 'pending'
  const [viewMode, setViewMode] = useState('all'); // 'all', 'today', 'week'

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await planService.getStudentPlans();
      setAllPlans(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // Filter plans by status
  const getFilteredPlans = () => {
    let filtered = allPlans;

    // Filter by status
    if (activeTab === 'completed') {
      filtered = filtered.filter(p => p.status === 'completed');
    } else if (activeTab === 'pending') {
      filtered = filtered.filter(p => p.status === 'pending');
    }

    // Filter by date
    if (viewMode === 'today') {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      filtered = filtered.filter(p => {
        const planDate = new Date(p.plannedDate);
        planDate.setHours(0, 0, 0, 0);
        return planDate.getTime() === today.getTime();
      });
    } else if (viewMode === 'week') {
      filtered = filtered.filter(p => {
        const planDate = new Date(p.plannedDate);
        return planDate >= weekStart && planDate <= weekEnd;
      });
    }

    return filtered.sort((a, b) => new Date(a.plannedDate) - new Date(b.plannedDate));
  };

  const filteredPlans = getFilteredPlans();

  // Calculate statistics
  const completedCount = allPlans.filter(p => p.status === 'completed').length;
  const pendingCount = allPlans.filter(p => p.status === 'pending').length;
  const totalCount = allPlans.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = new Date(date.getTime() + 24 * 60 * 60 * 1000).toDateString() === today.toDateString();
    
    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';
    
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
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
      <h1 style={{ marginBottom: '30px' }}>📊 Progress Tracking</h1>

      {/* Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div style={{ ...styles.card, textAlign: 'center', borderLeft: '4px solid #4caf50' }}>
          <h2 style={{ color: '#4caf50', margin: '10px 0' }}>{completedCount}</h2>
          <p style={{ margin: '0', color: '#666' }}>Completed Tasks</p>
        </div>

        <div style={{ ...styles.card, textAlign: 'center', borderLeft: '4px solid #ff9800' }}>
          <h2 style={{ color: '#ff9800', margin: '10px 0' }}>{pendingCount}</h2>
          <p style={{ margin: '0', color: '#666' }}>Pending Tasks</p>
        </div>

        <div style={{ ...styles.card, textAlign: 'center', borderLeft: '4px solid #667eea' }}>
          <h2 style={{ color: '#667eea', margin: '10px 0' }}>{completionRate}%</h2>
          <p style={{ margin: '0', color: '#666' }}>Completion Rate</p>
        </div>

        <div style={{ ...styles.card, textAlign: 'center', borderLeft: '4px solid #2196f3' }}>
          <h2 style={{ color: '#2196f3', margin: '10px 0' }}>{totalCount}</h2>
          <p style={{ margin: '0', color: '#666' }}>Total Tasks</p>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div style={{ ...styles.card, marginBottom: '30px' }}>
        <h3>📅 Schedule View</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setViewMode('all')}
            style={{
              ...styles.button,
              background: viewMode === 'all' ? '#667eea' : '#ccc',
              cursor: 'pointer'
            }}
          >
            All Tasks
          </button>
          <button
            onClick={() => setViewMode('today')}
            style={{
              ...styles.button,
              background: viewMode === 'today' ? '#667eea' : '#ccc',
              cursor: 'pointer'
            }}
          >
            Today's Tasks
          </button>
          <button
            onClick={() => setViewMode('week')}
            style={{
              ...styles.button,
              background: viewMode === 'week' ? '#667eea' : '#ccc',
              cursor: 'pointer'
            }}
          >
            This Week
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '2px solid #e0e0e0', paddingBottom: '10px' }}>
        <button
          onClick={() => setActiveTab('all')}
          style={{
            ...styles.button,
            background: activeTab === 'all' ? '#667eea' : 'transparent',
            color: activeTab === 'all' ? 'white' : '#666',
            borderRadius: 0,
            borderBottom: activeTab === 'all' ? '3px solid #1976d2' : 'none',
            fontSize: '14px'
          }}
        >
          📋 All Tasks ({allPlans.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          style={{
            ...styles.button,
            background: activeTab === 'completed' ? '#4caf50' : 'transparent',
            color: activeTab === 'completed' ? 'white' : '#666',
            borderRadius: 0,
            borderBottom: activeTab === 'completed' ? '3px solid #388e3c' : 'none',
            fontSize: '14px'
          }}
        >
          ✅ Completed ({completedCount})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          style={{
            ...styles.button,
            background: activeTab === 'pending' ? '#ff9800' : 'transparent',
            color: activeTab === 'pending' ? 'white' : '#666',
            borderRadius: 0,
            borderBottom: activeTab === 'pending' ? '3px solid #f57c00' : 'none',
            fontSize: '14px'
          }}
        >
          ⏳ Pending ({pendingCount})
        </button>
      </div>

      {/* Tasks List */}
      <div style={{ display: 'grid', gap: '15px' }}>
        {filteredPlans.length === 0 && (
          <div style={styles.alertInfo}>
            {activeTab === 'completed' && 'No completed tasks yet!'}
            {activeTab === 'pending' && 'No pending tasks. Great job!'}
            {activeTab === 'all' && viewMode === 'today' && 'No tasks scheduled for today.'}
            {activeTab === 'all' && viewMode === 'week' && 'No tasks scheduled for this week.'}
            {activeTab === 'all' && viewMode === 'all' && 'No study plans yet. Create one to get started!'}
          </div>
        )}

        {filteredPlans.map(plan => {
          const planDate = new Date(plan.plannedDate);
          const isOverdue = plan.status === 'pending' && planDate < today;

          return (
            <div key={plan._id} style={{
              ...styles.card,
              borderLeft: `4px solid ${plan.status === 'completed' ? '#4caf50' : isOverdue ? '#d32f2f' : '#ff9800'}`,
              opacity: plan.status === 'completed' ? 0.7 : 1
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  {/* Completion Status */}
                  {plan.status === 'completed' && (
                    <span style={{ ...styles.badge, ...styles.badgeSuccess, marginRight: '10px' }}>
                      ✅ COMPLETED
                    </span>
                  )}
                  {plan.status === 'pending' && isOverdue && (
                    <span style={{ ...styles.badge, ...styles.badgeDanger, marginRight: '10px' }}>
                      ⚠️ OVERDUE
                    </span>
                  )}
                  {plan.status === 'pending' && !isOverdue && (
                    <span style={{ ...styles.badge, ...styles.badgeWarning, marginRight: '10px' }}>
                      ⏳ PENDING
                    </span>
                  )}

                  {/* Subject & Topic */}
                  <h3 style={{ marginTop: '10px' }}>{plan.subject?.name}</h3>
                  {plan.topic && (
                    <p><strong>📝 Topic:</strong> {plan.topic?.name}</p>
                  )}

                  {/* Date & Time */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginTop: '10px' }}>
                    <div>
                      <strong>📅 Date:</strong>
                      <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
                        {formatDate(plan.plannedDate)}
                      </p>
                    </div>
                    <div>
                      <strong>⏰ Time:</strong>
                      <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
                        {formatTime(plan.plannedDate)}
                      </p>
                    </div>
                    <div>
                      <strong>⏱️ Duration:</strong>
                      <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
                        {plan.duration} minutes
                      </p>
                    </div>
                  </div>

                  {/* Notes */}
                  {plan.notes && (
                    <div style={{ marginTop: '15px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
                      <strong>📌 Notes:</strong>
                      <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#555' }}>
                        {plan.notes}
                      </p>
                    </div>
                  )}

                  {/* Completion Info */}
                  {plan.status === 'completed' && plan.completedAt && (
                    <div style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
                      ✓ Completed on {new Date(plan.completedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Progress Indicator */}
                <div style={{ minWidth: '100px', textAlign: 'center' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: plan.status === 'completed' ? '#e8f5e9' : '#fff3e0',
                    border: `3px solid ${plan.status === 'completed' ? '#4caf50' : '#ff9800'}`
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      {plan.status === 'completed' ? (
                        <div style={{ fontSize: '32px' }}>✅</div>
                      ) : (
                        <div>
                          <div style={{ fontSize: '20px' }}>⏳</div>
                          <div style={{ fontSize: '10px', color: '#666' }}>pending</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressTracking;
