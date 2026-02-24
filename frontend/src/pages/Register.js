import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { toast } from 'react-toastify';
import styles from '../styles/inlineStyles';

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
      toast.error('Password must be at least 6 characters');
      return;
    }

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await authService.register(formData);
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <div style={styles.card}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Register</h1>
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

        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
