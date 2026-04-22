import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import styles from '../styles/inlineStyles';
import { showError, showSuccess } from '../utils/alerts';
import AuthIllustration from '../components/Illustrations/AuthIllustration';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authService.login({ email, password });
      login(response.data.user, response.data.token);
      showSuccess('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      showError(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1100px',
          display: 'flex',
          gap: '22px',
          alignItems: 'stretch',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ flex: '1 1 420px' }}>
          <div style={{ ...styles.card, padding: '28px' }}>
            <h1 style={{ margin: 0, marginBottom: '8px' }}>Welcome back</h1>
            <p style={{ margin: 0, color: 'rgba(11,31,59,0.7)', marginBottom: '26px' }}>
              Sign in to continue your learning journey.
            </p>
            <form onSubmit={handleSubmit}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />

          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />

          <button type="submit" disabled={loading} style={{ ...styles.button, width: '100%' }}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '20px', marginBottom: 0 }}>
              Don&apos;t have an account?{' '}
              <Link to="/register" style={{ color: '#1e40af', fontWeight: 700 }}>
                Create one
              </Link>
            </p>
          </div>
        </div>

        <div
          style={{
            flex: '1 1 360px',
            minWidth: '280px',
            borderRadius: '18px',
            border: '1px solid rgba(255,255,255,0.55)',
            background: 'linear-gradient(135deg, rgba(11,31,59,0.10) 0%, rgba(30,58,138,0.10) 100%)',
            boxShadow: '0 20px 60px rgba(2, 6, 23, 0.12)',
            overflow: 'hidden'
          }}
        >
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                padding: '18px 18px 0 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontWeight: 800,
                  color: '#0b1f3b'
                }}
              >
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '999px',
                    background: 'linear-gradient(135deg, #1e3a8a, #0b1f3b)'
                  }}
                />
                Learn smarter
              </span>
            </div>

            <AuthIllustration />

            <div style={{ padding: '0 18px 18px 18px', color: 'rgba(11,31,59,0.7)' }}>
              Study planner, materials, and progress tracking — all in one place.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
