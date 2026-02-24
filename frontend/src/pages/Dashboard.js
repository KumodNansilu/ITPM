import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import styles from '../styles/inlineStyles';

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  return (
    <div style={styles.container}>
      <h1 style={{ marginTop: '30px', marginBottom: '30px' }}>
        Welcome, {user?.name}!
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        {user?.role === 'student' && (
          <>
            <Link to="/study-planner" style={{ textDecoration: 'none' }}>
              <div style={{ ...styles.card, cursor: 'pointer', textAlign: 'center' }}>
                <h2>📚 Study Planner</h2>
                <p>Create and manage your study plans</p>
              </div>
            </Link>

            <Link to="/progress" style={{ textDecoration: 'none' }}>
              <div style={{ ...styles.card, cursor: 'pointer', textAlign: 'center' }}>
                <h2>📊 Progress Tracking</h2>
                <p>View your learning progress</p>
              </div>
            </Link>

            <Link to="/materials" style={{ textDecoration: 'none' }}>
              <div style={{ ...styles.card, cursor: 'pointer', textAlign: 'center' }}>
                <h2>📖 Study Materials</h2>
                <p>Download study materials</p>
              </div>
            </Link>

            <Link to="/questions" style={{ textDecoration: 'none' }}>
              <div style={{ ...styles.card, cursor: 'pointer', textAlign: 'center' }}>
                <h2>❓ Q&A Forum</h2>
                <p>Ask and answer questions</p>
              </div>
            </Link>

            <Link to="/mcq" style={{ textDecoration: 'none' }}>
              <div style={{ ...styles.card, cursor: 'pointer', textAlign: 'center' }}>
                <h2>📝 MCQ Practice</h2>
                <p>Take mock exams</p>
              </div>
            </Link>

            <Link to="/appointments" style={{ textDecoration: 'none' }}>
              <div style={{ ...styles.card, cursor: 'pointer', textAlign: 'center' }}>
                <h2>📅 Book Tutor</h2>
                <p>Schedule sessions with tutors</p>
              </div>
            </Link>
          </>
        )}

        {user?.role === 'tutor' && (
          <>
            <Link to="/subjects" style={{ textDecoration: 'none' }}>
              <div style={{ ...styles.card, cursor: 'pointer', textAlign: 'center' }}>
                <h2>📚 Manage Subjects</h2>
                <p>Create and manage subjects and topics</p>
              </div>
            </Link>

            <Link to="/materials/upload" style={{ textDecoration: 'none' }}>
              <div style={{ ...styles.card, cursor: 'pointer', textAlign: 'center' }}>
                <h2>📤 Upload Materials</h2>
                <p>Upload study materials</p>
              </div>
            </Link>

            <Link to="/mcq/create" style={{ textDecoration: 'none' }}>
              <div style={{ ...styles.card, cursor: 'pointer', textAlign: 'center' }}>
                <h2>📝 Create MCQ</h2>
                <p>Create mock exam questions</p>
              </div>
            </Link>

            <Link to="/appointments" style={{ textDecoration: 'none' }}>
              <div style={{ ...styles.card, cursor: 'pointer', textAlign: 'center' }}>
                <h2>📅 My Appointments</h2>
                <p>Manage student appointments</p>
              </div>
            </Link>
          </>
        )}

        {user?.role === 'admin' && (
          <>
            <Link to="/admin/users" style={{ textDecoration: 'none' }}>
              <div style={{ ...styles.card, cursor: 'pointer', textAlign: 'center' }}>
                <h2>👥 Manage Users</h2>
                <p>View and manage all users</p>
              </div>
            </Link>

            <Link to="/admin/subjects" style={{ textDecoration: 'none' }}>
              <div style={{ ...styles.card, cursor: 'pointer', textAlign: 'center' }}>
                <h2>📚 Manage Subjects</h2>
                <p>Manage all subjects and topics</p>
              </div>
            </Link>

            <Link to="/admin/analytics" style={{ textDecoration: 'none' }}>
              <div style={{ ...styles.card, cursor: 'pointer', textAlign: 'center' }}>
                <h2>📊 Analytics</h2>
                <p>View platform analytics</p>
              </div>
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
