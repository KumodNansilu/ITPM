import React, { useState, useContext, useEffect } from 'react';
import { userService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import styles from '../styles/inlineStyles';
import { showError, showSuccess } from '../utils/alerts';
import { FaEnvelope, FaIdBadge, FaUserCircle } from 'react-icons/fa';

// Redirect existing toast calls to SweetAlert2.
const toast = {
  success: (message) => showSuccess(message),
  error: (message) => showError(message)
};

const Profile = () => {
  const { user } = useContext(AuthContext);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
    university: user?.university || '',
    specialization: user?.specialization || ''
  });
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await userService.updateProfile(profileData);
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ ...styles.container, marginTop: '30px', maxWidth: '900px' }}>
      <div style={{ ...styles.card, background: 'linear-gradient(135deg, #0b1f3b 0%, #1e3a8a 100%)', color: 'white', marginBottom: '16px' }}>
        <h1 style={{ margin: 0, marginBottom: '6px' }}>My Profile</h1>
        <p style={{ margin: 0, opacity: 0.9 }}>Manage your identity and account details in one place.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '18px' }}>
        <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}><FaUserCircle /> Name: <strong>{profileData.name || 'N/A'}</strong></div>
        <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}><FaEnvelope /> Email: <strong>{profileData.email || 'N/A'}</strong></div>
        <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}><FaIdBadge /> Role: <strong>{user?.role || 'N/A'}</strong></div>
      </div>
      <h1 style={{ marginBottom: '30px' }}>My Profile</h1>

      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>{user?.name}</h2>
          <button onClick={() => setIsEditing(!isEditing)} style={styles.button}>
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit}>
            <label style={styles.label}>Name</label>
            <input
              type="text"
              name="name"
              value={profileData.name}
              onChange={handleChange}
              style={styles.input}
            />

            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={profileData.email}
              disabled
              style={{ ...styles.input, cursor: 'not-allowed', opacity: 0.6 }}
            />

            <label style={styles.label}>Role</label>
            <input
              type="text"
              value={user?.role}
              disabled
              style={{ ...styles.input, cursor: 'not-allowed', opacity: 0.6 }}
            />

            <label style={styles.label}>Bio</label>
            <textarea
              name="bio"
              value={profileData.bio}
              onChange={handleChange}
              rows="3"
              style={{ ...styles.input, height: '90px' }}
            />

            <label style={styles.label}>Phone</label>
            <input
              type="tel"
              name="phone"
              value={profileData.phone}
              onChange={handleChange}
              style={styles.input}
            />

            <label style={styles.label}>University</label>
            <input
              type="text"
              name="university"
              value={profileData.university}
              onChange={handleChange}
              style={styles.input}
            />

            {user?.role === 'tutor' && (
              <>
                <label style={styles.label}>Specialization</label>
                <input
                  type="text"
                  name="specialization"
                  value={profileData.specialization}
                  onChange={handleChange}
                  style={styles.input}
                />
              </>
            )}

            <button type="submit" disabled={loading} style={{ ...styles.button, width: '100%' }}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        ) : (
          <div>
            <p><strong>Email:</strong> {profileData.email}</p>
            <p><strong>Role:</strong> <span style={{ ...styles.badge, ...styles.badgePrimary }}>{user?.role}</span></p>
            {profileData.bio && <p><strong>Bio:</strong> {profileData.bio}</p>}
            {profileData.phone && <p><strong>Phone:</strong> {profileData.phone}</p>}
            {profileData.university && <p><strong>University:</strong> {profileData.university}</p>}
            {profileData.specialization && <p><strong>Specialization:</strong> {profileData.specialization}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
