import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import styles from '../styles/inlineStyles';
import {
  FaBookOpen,
  FaCalendarAlt,
  FaChartLine,
  FaClipboardList,
  FaQuestionCircle,
  FaRegFileAlt,
  FaChalkboardTeacher,
  FaLayerGroup,
  FaUserCircle,
  FaArrowRight,
  FaCheckCircle
} from 'react-icons/fa';

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  const role = user?.role || 'student';
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  const iconBox = {
    width: '48px',
    height: '48px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #0b3d91 0%, #1e40af 100%)',
    boxShadow: '0 14px 30px rgba(2, 6, 23, 0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    flex: '0 0 auto'
  };

  const quickCard = {
    ...styles.card,
    cursor: 'pointer',
    marginBottom: 0,
    padding: '18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '14px',
    minHeight: '104px'
  };

  const roleActions = {
    student: [
      { to: '/study-planner', title: 'Study Planner', desc: 'Plan weekly study and stay consistent.', icon: FaClipboardList },
      { to: '/progress', title: 'Progress Tracking', desc: 'Check completed work and learning pace.', icon: FaChartLine },
      { to: '/materials', title: 'Study Materials', desc: 'Open notes and learning resources quickly.', icon: FaRegFileAlt },
      { to: '/questions', title: 'Q&A Forum', desc: 'Ask questions and learn from answers.', icon: FaQuestionCircle },
      { to: '/mcq', title: 'MCQ Practice', desc: 'Take practice tests and build confidence.', icon: FaLayerGroup },
      { to: '/appointments', title: 'Book Tutor', desc: 'Schedule one-to-one support sessions.', icon: FaCalendarAlt }
    ],
    tutor: [
      { to: '/subjects', title: 'Manage Subjects', desc: 'Create and update subjects and topics.', icon: FaChalkboardTeacher },
      { to: '/materials/upload', title: 'Upload Materials', desc: 'Share notes and resources for students.', icon: FaRegFileAlt },
      { to: '/mcq/create', title: 'Create MCQ', desc: 'Build quizzes and mock exam questions.', icon: FaLayerGroup },
      { to: '/appointments', title: 'My Appointments', desc: 'Review and manage student sessions.', icon: FaCalendarAlt },
      { to: '/questions', title: 'Q&A Forum', desc: 'Answer student questions and guide them.', icon: FaQuestionCircle }
    ],
    admin: [
      { to: '/admin/users', title: 'Manage Users', desc: 'Handle accounts, roles, and access.', icon: FaUserCircle },
      { to: '/admin/subjects', title: 'Manage Subjects', desc: 'Organize curriculum and topics.', icon: FaChalkboardTeacher },
      { to: '/admin/analytics', title: 'Analytics', desc: 'Track usage and platform performance.', icon: FaChartLine }
    ]
  };

  const actions = roleActions[role] || roleActions.student;

  return (
    <div
      style={{
        width: '100%',
        minHeight: 'calc(100vh - 86px)',
        padding: '24px 26px 34px 26px',
        boxSizing: 'border-box',
        background: 'linear-gradient(180deg, #f6f8ff 0%, #eef2ff 100%)'
      }}
    >
      <div
        style={{
          maxWidth: '1500px',
          margin: '0 auto',
          display: 'flex',
          gap: '20px',
          alignItems: 'stretch',
          flexWrap: 'wrap'
        }}
      >
        <div
          style={{
            flex: '1 1 520px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #0b1f3b 0%, #1e3a8a 100%)',
              color: 'white',
              borderRadius: '18px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <p style={{ margin: 0, fontSize: '13px', letterSpacing: '0.4px', opacity: 0.9 }}>HOME</p>
            <h1 style={{ margin: 0, fontSize: '32px' }}>Welcome back, {user?.name || 'Learner'}.</h1>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)', maxWidth: '620px' }}>
              Continue where you left off. This home screen is split into two clear sections: your overview on the left and quick actions on the right.
            </p>
            <div style={{ marginTop: '4px', fontSize: '13px', color: 'rgba(255,255,255,0.86)' }}>{today}</div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px'
            }}
          >
            <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}>
              <div style={{ fontSize: '12px', color: 'rgba(11,31,59,0.65)', marginBottom: '6px' }}>Status</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: '#0b1f3b' }}>
                <FaCheckCircle color="#16a34a" /> Ready to learn
              </div>
            </div>
            <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}>
              <div style={{ fontSize: '12px', color: 'rgba(11,31,59,0.65)', marginBottom: '6px' }}>Role</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: '#0b1f3b' }}>
                <FaUserCircle /> {role}
              </div>
            </div>
            <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}>
              <div style={{ fontSize: '12px', color: 'rgba(11,31,59,0.65)', marginBottom: '6px' }}>Quick Access</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 800, color: '#0b1f3b' }}>
                <FaBookOpen /> {actions.length} tools
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            flex: '1 1 520px',
            ...styles.card,
            marginBottom: 0,
            padding: '20px'
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: '6px', color: '#0b1f3b' }}>Quick Actions</h2>
          <p style={{ marginTop: 0, color: 'rgba(11,31,59,0.7)', marginBottom: '14px' }}>
            Open any feature from the right side.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '14px'
            }}
          >
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.to} to={action.to} style={{ textDecoration: 'none' }}>
                  <div style={quickCard}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={iconBox}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, color: '#0b1f3b', fontSize: '17px' }}>{action.title}</h3>
                        <p style={{ margin: '6px 0 0 0', color: 'rgba(11,31,59,0.72)', fontWeight: 600, fontSize: '13px' }}>
                          {action.desc}
                        </p>
                      </div>
                    </div>
                    <div style={{ color: '#1e40af', marginTop: '2px' }}>
                      <FaArrowRight />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
