import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navigation = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' }}>
      <div>
        <h2 style={{ margin: 0, cursor: 'pointer', fontSize: '20px' }} onClick={() => navigate('/dashboard')}>
          📚 ITPM
        </h2>
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        {user && (
          <>
            <a onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
              Home
            </a>

            {user.role === 'student' && (
              <>
                <a onClick={() => navigate('/study-planner')} style={{ cursor: 'pointer' }}>
                  Planner
                </a>
                <a onClick={() => navigate('/materials')} style={{ cursor: 'pointer' }}>
                  Materials
                </a>
                <a onClick={() => navigate('/questions')} style={{ cursor: 'pointer' }}>
                  Q&A
                </a>
                <a onClick={() => navigate('/mcq')} style={{ cursor: 'pointer' }}>
                  MCQ
                </a>
                <a onClick={() => navigate('/appointments')} style={{ cursor: 'pointer' }}>
                  Sessions
                </a>
                <a onClick={() => navigate('/progress')} style={{ cursor: 'pointer' }}>
                  Progress
                </a>
              </>
            )}

            {user.role === 'tutor' && (
              <>
                <a onClick={() => navigate('/subjects')} style={{ cursor: 'pointer' }}>
                  Subjects
                </a>
                <a onClick={() => navigate('/materials')} style={{ cursor: 'pointer' }}>
                  Materials
                </a>
                <a onClick={() => navigate('/questions')} style={{ cursor: 'pointer' }}>
                  Q&A
                </a>
                <a onClick={() => navigate('/sessions')} style={{ cursor: 'pointer' }}>
                  Sessions
                </a>
              </>
            )}

            <a onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
              {user.name}
            </a>
            <button onClick={handleLogout} style={{ padding: '8px 15px', background: '#d32f2f' }}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
