import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaBook,
  FaChalkboardTeacher,
  FaClipboardList,
  FaComments,
  FaGraduationCap,
  FaHome,
  FaListAlt,
  FaSignOutAlt,
  FaTasks,
  FaUserCircle
} from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import styles from '../styles/inlineStyles';

const Navigation = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navActionStyle = {
    ...styles.navLink,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'transparent',
    border: 'none',
    padding: 0,
    font: 'inherit'
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.navInner}>
        <h2
          style={{ margin: 0, cursor: 'pointer', fontSize: '20px', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          onClick={() => navigate('/dashboard')}
        >
          <FaGraduationCap /> Learn bridge
        </h2>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        {user && (
          <>
            <button type="button" onClick={() => navigate('/dashboard')} style={navActionStyle}>
              <FaHome /> Home
            </button>

            {user.role === 'student' && (
              <>
                <button type="button" onClick={() => navigate('/study-planner')} style={navActionStyle}>
                  <FaTasks /> Planner
                </button>
                <button type="button" onClick={() => navigate('/materials')} style={navActionStyle}>
                  <FaBook /> Materials
                </button>
                <button type="button" onClick={() => navigate('/questions')} style={navActionStyle}>
                  <FaComments /> Q&A
                </button>
                <button type="button" onClick={() => navigate('/mcq')} style={navActionStyle}>
                  <FaClipboardList /> MCQ
                </button>
                <button type="button" onClick={() => navigate('/appointments')} style={navActionStyle}>
                  <FaChalkboardTeacher /> Sessions
                </button>
                <button type="button" onClick={() => navigate('/progress')} style={navActionStyle}>
                  <FaListAlt /> Progress
                </button>
              </>
            )}

            {user.role === 'tutor' && (
              <>
                <button type="button" onClick={() => navigate('/subjects')} style={navActionStyle}>
                  <FaListAlt /> Subjects
                </button>
                <button type="button" onClick={() => navigate('/materials')} style={navActionStyle}>
                  <FaBook /> Materials
                </button>
                <button type="button" onClick={() => navigate('/questions')} style={navActionStyle}>
                  <FaComments /> Q&A
                </button>
                <button type="button" onClick={() => navigate('/sessions')} style={navActionStyle}>
                  <FaChalkboardTeacher /> Sessions
                </button>
              </>
            )}

            <button type="button" onClick={() => navigate('/profile')} style={navActionStyle}>
              <FaUserCircle /> {user.name}
            </button>
            <button onClick={handleLogout} style={{ ...styles.buttonDanger, padding: '8px 16px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><FaSignOutAlt /> Logout</span>
            </button>
          </>
        )}
      </div>
      </div>
    </nav>
  );
};

export default Navigation;
