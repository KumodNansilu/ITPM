import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import styles from '../styles/inlineStyles';
import { showError, showSuccess } from '../utils/alerts';
import AuthIllustration from '../components/Illustrations/AuthIllustration';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate password length
    if (formData.password.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await authService.register(formData);
      showSuccess('Registration successful! Please login.');
      navigate('/login');
    } catch (error) {
      showError(error.response?.data?.message || 'Registration failed');
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
            <h1 style={{ margin: 0, marginBottom: '8px' }}>Create account</h1>
            <p style={{ margin: 0, color: 'rgba(11,31,59,0.7)', marginBottom: '26px' }}>
              Join to plan your studies and book tutoring sessions.
            </p>
            <form onSubmit={handleSubmit}>
              <label style={styles.label}>Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            style={styles.input}
          />

          <label style={styles.label}>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={styles.input}
          />

          <label style={styles.label}>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={styles.input}
          />
          <small style={{ color: formData.password.length < 6 ? '#e74c3c' : '#27ae60', display: 'block', marginTop: '5px' }}>
            {formData.password.length}/6 characters (minimum 6 required)
          </small>

          <label style={styles.label}>Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            style={styles.input}
          />

          <label style={styles.label}>Role</label>
          <select name="role" value={formData.role} onChange={handleChange} style={styles.input}>
            <option value="student">Student</option>
            <option value="tutor">Tutor</option>
          </select>

          <button type="submit" disabled={loading} style={{ ...styles.button, width: '100%' }}>
            {loading ? 'Registering...' : 'Register'}
          </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '20px', marginBottom: 0 }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#1e40af', fontWeight: 700 }}>
                Log in
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
                Build your plan
              </span>
            </div>
            <AuthIllustration />
            <div style={{ padding: '0 18px 18px 18px', color: 'rgba(11,31,59,0.7)' }}>
              Navy/white design with smooth SweetAlert2 popups for a cleaner experience.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
