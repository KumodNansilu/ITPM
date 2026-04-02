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
    cursor: 'pointer',
    marginBottom: 0,
    padding: '18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '14px',
    minHeight: '104px',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.35)',
    background: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(10px) saturate(140%)',
    WebkitBackdropFilter: 'blur(10px) saturate(140%)',
    boxShadow: '0 10px 24px rgba(2, 6, 23, 0.2)'
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
          <style>
            {`@keyframes dashboardHeroImageIn {
              0% {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
              92% {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
              96% {
                opacity: 0.9;
                transform: translateY(-4px) scale(1.01);
              }
              100% {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }`}
          </style>
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
            <img
              src="/image/home.jfif"
              alt="Home banner"
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: '14px',
                animation: 'dashboardHeroImageIn 3s ease-in-out infinite'
              }}
            />
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
            padding: '20px',
            position: 'relative',
            overflow: 'hidden',
            background: 'rgba(11, 31, 59, 0.74)'
          }}
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 0
            }}
          >
            <source src="https://www.pexels.com/download/video/5676118/" type="video/mp4" />
          </video>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(11,31,59,0.72) 0%, rgba(30,64,175,0.45) 100%)',
              zIndex: 1
            }}
          />

          <div style={{ position: 'relative', zIndex: 2 }}>
          <h2 style={{ marginTop: 0, marginBottom: '6px', color: 'white' }}>Quick Actions</h2>
          <p style={{ marginTop: 0, color: 'rgba(255,255,255,0.9)', marginBottom: '14px' }}>
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
                        <h3 style={{ margin: 0, color: '#f8fbff', fontSize: '17px' }}>{action.title}</h3>
                        <p style={{ margin: '6px 0 0 0', color: 'rgba(241,245,255,0.95)', fontWeight: 600, fontSize: '13px' }}>
                          {action.desc}
                        </p>
                      </div>
                    </div>
                    <div style={{ color: '#dbeafe', marginTop: '2px' }}>
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
    </div>
  );
};

export default Dashboard;
