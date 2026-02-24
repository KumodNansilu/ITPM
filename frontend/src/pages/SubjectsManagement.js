import React, { useState, useEffect } from 'react';
import { subjectService } from '../services/api';
import { toast } from 'react-toastify';
import styles from '../styles/inlineStyles';

const SubjectsManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await subjectService.getAllSubjects();
      setSubjects(response.data);
    } catch (error) {
      toast.error('Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await subjectService.updateSubject(editingId, formData);
        toast.success('Subject updated successfully');
        setEditingId(null);
      } else {
        await subjectService.createSubject(formData);
        toast.success('Subject created successfully');
      }

      setFormData({ name: '', code: '', description: '' });
      setShowForm(false);
      fetchSubjects();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save subject');
    }
  };

  const toggleForm = () => {
    if (showForm) {
      // closing form, reset
      setFormData({ name: '', code: '', description: '' });
      setEditingId(null);
      setShowForm(false);
    } else {
      setShowForm(true);
    }
  };

  const handleDelete = async (subjectId) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      try {
        await subjectService.deleteSubject(subjectId);
        toast.success('Subject deleted');
        fetchSubjects();
      } catch (error) {
        toast.error('Failed to delete subject');
      }
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <svg style={styles.spinnerSvg} viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="20" fill="none" stroke="#e6e6e6" strokeWidth="5"></circle>
          <path d="M45 25a20 20 0 0 1-20 20" stroke="#667eea" strokeWidth="5" strokeLinecap="round" fill="none">
            <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite" />
          </path>
        </svg>
      </div>
    );
  }

  return (
    <div style={{ ...styles.container, marginTop: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Manage Subjects</h1>
        <button onClick={toggleForm} style={styles.button}>
          {showForm ? 'Cancel' : '+ New Subject'}
        </button>
      </div>

      {showForm && (
        <div style={{ ...styles.card, marginBottom: '30px' }}>
          <h2>Create Subject</h2>
          <form onSubmit={handleSubmit}>
            <label style={styles.label}>Subject Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              style={styles.input}
            />

            <label style={styles.label}>Subject Code</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({...formData, code: e.target.value})}
              required
              style={styles.input}
            />

            <label style={styles.label}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows="4"
              style={{ ...styles.input, height: '100px' }}
            />

            <button type="submit" style={styles.button}>{editingId ? 'Update Subject' : 'Create Subject'}</button>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gap: '15px' }}>
        {subjects && subjects.map(subject => (
          <div key={subject._id} style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <h3>{subject.name}</h3>
                <p><strong>Code:</strong> {subject.code}</p>
                {subject.description && <p>{subject.description}</p>}
                <p><strong>Topics:</strong> {subject.topics?.length || 0}</p>
              </div>
              <div>
                <button style={{ ...styles.button, marginRight: '10px' }} onClick={() => {
                  setFormData({ name: subject.name || '', code: subject.code || '', description: subject.description || '' });
                  setEditingId(subject._id);
                  setShowForm(true);
                }}>Edit</button>
                <button onClick={() => handleDelete(subject._id)} style={styles.buttonDanger}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {subjects.length === 0 && (
        <div style={styles.alertInfo}>
          No subjects yet. Create one to get started!
        </div>
      )}
    </div>
  );
};

export default SubjectsManagement;
