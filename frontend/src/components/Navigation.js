import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaBook,
  FaBookOpen,
  FaChalkboardTeacher,
  FaClipboardList,
  FaComments,
  FaHome,
  FaListAlt,
  FaBell,
  FaSignOutAlt,
  FaTasks,
  FaUserCircle
} from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import { notificationService } from '../services/api';
import styles from '../styles/inlineStyles';

const Navigation = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const response = await notificationService.getUnreadCount();
        setUnreadCount(Number(response.data?.unreadCount || 0));
      } catch (error) {
        setUnreadCount(0);
      }
    };

    if (user) {
      loadUnreadCount();
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

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

  const iconOnlyStyle = {
    ...styles.navLink,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0',
    background: 'transparent',
    border: 'none',
    padding: '4px',
    font: 'inherit',
    fontSize: '16px'
  };

  return (
    <nav style={styles.nav}>
      <style>
        {`.nav-menu-actions button {
          transition: transform 220ms ease, color 220ms ease, text-shadow 220ms ease;
          will-change: transform;
        }

        .nav-menu-actions button:hover {
          transform: translateY(-4px);
          color: #dbeafe;
          text-shadow: 0 6px 14px rgba(15, 23, 42, 0.28);
        }

        .nav-menu-actions button:focus-visible {
          transform: translateY(-4px);
          outline: 2px solid rgba(219, 234, 254, 0.85);
          outline-offset: 3px;
        }

        .nav-top-actions button {
          transition: transform 220ms ease, color 220ms ease, text-shadow 220ms ease;
          will-change: transform;
        }

        .nav-top-actions button:hover {
          transform: translateY(-4px);
          color: #dbeafe;
          text-shadow: 0 6px 14px rgba(15, 23, 42, 0.28);
        }

        .nav-top-actions button:focus-visible {
          transform: translateY(-4px);
          outline: 2px solid rgba(219, 234, 254, 0.85);
          outline-offset: 3px;
        }`}
      </style>
      <div style={{ ...styles.navInner, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Logo on left */}
        <h2
          style={{ margin: 0, cursor: 'pointer', fontSize: '38px', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '8px', order: 1 }}
          onClick={() => navigate('/dashboard')}
        >
          <img
            src="/image/logo.jpeg"
            alt="Learn Bridge logo"
            style={{ height: '56px', width: 'auto', display: 'block' }}
          />
          Learn bridge
        </h2>

        {/* User icons on top right */}
        {user && (
          <div className="nav-top-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center', order: 2 }}>
            <button type="button" onClick={() => navigate('/notifications')} style={iconOnlyStyle} title={`Notifications (${unreadCount})`}>
              <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <FaBell />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: '-8px', right: '-10px', background: '#ef4444', color: 'white', borderRadius: '999px', minWidth: '18px', height: '18px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                    {unreadCount}
                  </span>
                )}
              </span>
            </button>
            <button type="button" onClick={() => navigate('/profile')} style={iconOnlyStyle} title={user.name}>
              <FaUserCircle />
            </button>
            <button onClick={handleLogout} style={{ ...iconOnlyStyle, color: '#ff6b6b' }} title="Logout">
              <FaSignOutAlt />
            </button>
          </div>
        )}

        {/* Navigation menu on bottom right */}
        <div className="nav-menu-actions" style={{ display: 'flex', gap: '14px', alignItems: 'center', justifyContent: 'flex-end', width: '100%', order: 4, marginTop: '2px' }}>
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
                  <button type="button" onClick={() => navigate('/available-exams')} style={navActionStyle}>
                    <FaBookOpen /> Exams
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
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
