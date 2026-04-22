import React, { useState, useEffect } from 'react';
import { subjectService } from '../services/api';
import styles from '../styles/inlineStyles';
import { showError, showSuccess, confirmDialog } from '../utils/alerts';
import { FaBook, FaBuilding, FaLayerGroup } from 'react-icons/fa';

const FACULTY_OPTIONS = [
  'Faculty of Computing',
  'Faculty of Engineering',
  'Faculty of Business'
];

const DEGREE_OPTIONS_BY_FACULTY = {
  'Faculty of Computing': [
    'BSc (Hons) in Information Technology',
    'BSc (Hons) in Software Engineering',
    'BSc (Hons) in Computer Science',
    'BSc (Hons) in Information Systems Engineering',
    'BSc (Hons) in Cyber Security',
    'BSc (Hons) in Data Science'
  ],
  'Faculty of Engineering': [
    'BSc (Hons) in Civil Engineering',
    'BSc (Hons) in Electrical & Electronic Engineering',
    'BSc (Hons) in Mechanical Engineering',
    'BSc (Hons) in Mechatronics Engineering'
  ],
  'Faculty of Business': []
};

const getDegreeOptions = (faculty, selectedDegree) => {
  const options = DEGREE_OPTIONS_BY_FACULTY[faculty] || [];
  if (selectedDegree && !options.includes(selectedDegree)) {
    return [selectedDegree, ...options];
  }
  return options;
};

const englishLettersAndNumbersRegex = /^[A-Za-z0-9\s]+$/;

const sanitizeToEnglishLettersAndNumbers = (value) => value.replace(/[^A-Za-z0-9\s]/g, '');

const SubjectsManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    academicFaculty: '',
    degreeName: '',
    year: '',
    semester: ''
  });
  const [formErrors, setFormErrors] = useState({ name: '', code: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const availableDegrees = getDegreeOptions(formData.academicFaculty, formData.degreeName);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await subjectService.getAllSubjects();
      setSubjects(response.data);
    } catch (error) {
      showError('Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = formData.name.trim();
    const trimmedCode = formData.code.trim();
    const trimmedDescription = formData.description.trim();
    const nextErrors = { name: '', code: '', description: '' };

    if (!trimmedName) {
      nextErrors.name = 'Subject Name is required.';
    } else if (!englishLettersAndNumbersRegex.test(trimmedName)) {
      nextErrors.name = 'Subject Name can only contain English letters and numbers.';
    }

    if (!trimmedCode) {
      nextErrors.code = 'Subject Code is required.';
    } else if (!englishLettersAndNumbersRegex.test(trimmedCode)) {
      nextErrors.code = 'Subject Code can only contain English letters and numbers.';
    }

    if (trimmedDescription && !englishLettersAndNumbersRegex.test(trimmedDescription)) {
      nextErrors.description = 'Description can only contain English letters and numbers.';
    }

    if (nextErrors.name || nextErrors.code || nextErrors.description) {
      setFormErrors(nextErrors);
      return;
    }

    const payload = {
      ...formData,
      name: trimmedName,
      code: trimmedCode,
      description: trimmedDescription,
      year: formData.year === '' ? null : Number(formData.year),
      semester: formData.semester === '' ? null : Number(formData.semester)
    };

    try {
      if (editingId) {
        await subjectService.updateSubject(editingId, payload);
        showSuccess('Subject updated successfully');
        setEditingId(null);
      } else {
        await subjectService.createSubject(payload);
        showSuccess('Subject created successfully');
      }

      setFormData({
        name: '',
        code: '',
        description: '',
        academicFaculty: '',
        degreeName: '',
        year: '',
        semester: ''
      });
      setFormErrors({ name: '', code: '', description: '' });
      setShowForm(false);
      fetchSubjects();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to save subject');
    }
  };

  const toggleForm = () => {
    if (showForm) {
      // closing form, reset
      setFormData({
        name: '',
        code: '',
        description: '',
        academicFaculty: '',
        degreeName: '',
        year: '',
        semester: ''
      });
      setFormErrors({ name: '', code: '', description: '' });
      setEditingId(null);
      setShowForm(false);
    } else {
      setShowForm(true);
    }
  };

  const handleDelete = async (subjectId) => {
    const confirmed = await confirmDialog({
      title: 'Delete subject?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      confirmButtonText: 'Yes, delete'
    });
    if (confirmed) {
      try {
        await subjectService.deleteSubject(subjectId);
        showSuccess('Subject deleted');
        fetchSubjects();
      } catch (error) {
        showError('Failed to delete subject');
      }
    }
  };

  const handleFacultyChange = (e) => {
    const selectedFaculty = e.target.value;
    setFormData((prev) => ({
      ...prev,
      academicFaculty: selectedFaculty,
      degreeName: ''
    }));
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
      <div style={{ ...styles.card, background: 'linear-gradient(135deg, #0b1f3b 0%, #1e3a8a 100%)', color: 'white', marginBottom: '16px' }}>
        <h1 style={{ margin: 0, marginBottom: '6px' }}>Manage Subjects</h1>
        <p style={{ margin: 0, opacity: 0.9 }}>Organize subjects, degrees, and academic structure for learners.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '18px' }}>
        <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}><FaBook /> Subjects: <strong>{subjects.length}</strong></div>
        <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}><FaBuilding /> Faculties: <strong>{FACULTY_OPTIONS.length}</strong></div>
        <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}><FaLayerGroup /> Topics: <strong>{subjects.reduce((sum, s) => sum + (s.topics?.length || 0), 0)}</strong></div>
      </div>
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
              onChange={(e) => {
                const rawName = e.target.value;
                const cleanedName = sanitizeToEnglishLettersAndNumbers(rawName);
                setFormData({ ...formData, name: cleanedName });
                setFormErrors((prev) => ({
                  ...prev,
                  name: rawName !== cleanedName
                    ? 'Only English letters and numbers are allowed.'
                    : ''
                }));
              }}
              onBlur={() => {
                setFormErrors((prev) => ({
                  ...prev,
                  name: formData.name.trim() ? '' : 'Subject Name is required.'
                }));
              }}
              required
              style={styles.input}
            />
            {formErrors.name && (
              <p style={{ marginTop: '-8px', marginBottom: '10px', color: '#dc2626', fontSize: '0.9rem' }}>
                {formErrors.name}
              </p>
            )}

            <label style={styles.label}>Subject Code</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => {
                const rawCode = e.target.value;
                const cleanedCode = sanitizeToEnglishLettersAndNumbers(rawCode);
                setFormData({ ...formData, code: cleanedCode });
                setFormErrors((prev) => ({
                  ...prev,
                  code: rawCode !== cleanedCode
                    ? 'Only English letters and numbers are allowed.'
                    : ''
                }));
              }}
              onBlur={() => {
                setFormErrors((prev) => ({
                  ...prev,
                  code: formData.code.trim() ? '' : 'Subject Code is required.'
                }));
              }}
              required
              style={styles.input}
            />
            {formErrors.code && (
              <p style={{ marginTop: '-8px', marginBottom: '10px', color: '#dc2626', fontSize: '0.9rem' }}>
                {formErrors.code}
              </p>
            )}

            <label style={styles.label}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => {
                const rawDescription = e.target.value;
                const cleanedDescription = sanitizeToEnglishLettersAndNumbers(rawDescription);
                setFormData({ ...formData, description: cleanedDescription });
                setFormErrors((prev) => ({
                  ...prev,
                  description: rawDescription !== cleanedDescription
                    ? 'Only English letters and numbers are allowed.'
                    : ''
                }));
              }}
              rows="4"
              style={{ ...styles.input, height: '100px' }}
            />
            {formErrors.description && (
              <p style={{ marginTop: '-8px', marginBottom: '10px', color: '#dc2626', fontSize: '0.9rem' }}>
                {formErrors.description}
              </p>
            )}

            <label style={styles.label}>Academic Faculty</label>
            <select
              value={formData.academicFaculty}
              onChange={handleFacultyChange}
              style={styles.input}
            >
              <option value="">Select Faculty</option>
              {FACULTY_OPTIONS.map((faculty) => (
                <option key={faculty} value={faculty}>{faculty}</option>
              ))}
            </select>

            <label style={styles.label}>Degree Name</label>
            <select
              value={formData.degreeName}
              onChange={(e) => setFormData({ ...formData, degreeName: e.target.value })}
              style={styles.input}
              disabled={!formData.academicFaculty}
            >
              <option value="">
                {!formData.academicFaculty ? 'Select Faculty First' : 'Select Degree'}
              </option>
              {availableDegrees.map((degree) => (
                <option key={degree} value={degree}>{degree}</option>
              ))}
            </select>
            {formData.academicFaculty && availableDegrees.length === 0 && (
              <p style={{ fontSize: '12px', color: '#777', marginTop: '6px' }}>
                Degree options for this faculty are not configured yet.
              </p>
            )}

            <label style={styles.label}>Year</label>
            <select
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              style={styles.input}
            >
              <option value="">Select Year</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>

            <label style={styles.label}>Semester</label>
            <select
              value={formData.semester}
              onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
              style={styles.input}
            >
              <option value="">Select Semester</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
            </select>

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
                {subject.academicFaculty && <p><strong>Faculty:</strong> {subject.academicFaculty}</p>}
                {subject.degreeName && <p><strong>Degree:</strong> {subject.degreeName}</p>}
                {subject.year && <p><strong>Year:</strong> {subject.year}</p>}
                {subject.semester && <p><strong>Semester:</strong> {subject.semester}</p>}
                <p><strong>Topics:</strong> {subject.topics?.length || 0}</p>
              </div>
              <div>
                <button style={{ ...styles.button, marginRight: '10px' }} onClick={() => {
                  setFormData({
                    name: subject.name || '',
                    code: subject.code || '',
                    description: subject.description || '',
                    academicFaculty: subject.academicFaculty || '',
                    degreeName: subject.degreeName || '',
                    year: subject.year || '',
                    semester: subject.semester || ''
                  });
                  setFormErrors({ name: '', code: '', description: '' });
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
        <div style={{ ...styles.card, textAlign: 'center' }}>
          <h3 style={{ marginTop: 0 }}>No subjects yet</h3>
          <p style={{ color: 'rgba(11,31,59,0.72)' }}>Create your first subject to begin building the curriculum.</p>
          <button type="button" onClick={() => setShowForm(true)} style={styles.button}>Create First Subject</button>
        </div>
      )}
    </div>
  );
};

export default SubjectsManagement;
