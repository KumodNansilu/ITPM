import React, { useState, useEffect, useContext } from 'react';
import { materialService, subjectService } from '../services/api';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import styles from '../styles/inlineStyles';

const Materials = () => {
  const [materials, setMaterials] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', description: '', subject: '' });
  const [file, setFile] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchMaterials();
    fetchSubjects();
  }, [selectedSubject]);


  const fetchMaterials = async () => {
    try {
      const response = await materialService.getAllMaterials();
      const filtered = selectedSubject
        ? response.data.filter(m => m.subject._id === selectedSubject)
        : response.data;
      setMaterials(filtered);
    } catch (error) {
      toast.error('Failed to fetch materials');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await subjectService.getAllSubjects();
      setSubjects(response.data);
    } catch (error) {
      toast.error('Failed to fetch subjects');
    }
  };

  

  const handleDownload = async (materialId, fileName) => {
    try {
      const response = await materialService.downloadMaterial(materialId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
    } catch (error) {
      toast.error('Failed to download material');
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', uploadForm.title);
      fd.append('description', uploadForm.description);
      fd.append('subject', uploadForm.subject);
      // no topic field — upload at subject level

      await materialService.uploadMaterial(fd);
      toast.success('Material uploaded');
      setShowUpload(false);
      setUploadForm({ title: '', description: '', subject: '' });
      setFile(null);
      fetchMaterials();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload material');
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

  const tutorSubjects = user?.role === 'tutor' ? subjects.filter(s => s.createdBy && (s.createdBy._id === user.id || s.createdBy._id === user._id)) : [];

  return (
    <div style={{ ...styles.container, marginTop: '30px' }}>
      <h1 style={{ marginBottom: '30px' }}>Study Materials</h1>

      {user?.role === 'tutor' && (
        <div style={{ marginBottom: '20px' }}>
          <button style={styles.button} onClick={() => setShowUpload(!showUpload)}>
            {showUpload ? 'Cancel Upload' : 'Upload Material'}
          </button>

          {showUpload && (
            <div style={{ ...styles.card, marginTop: '15px' }}>
              <h3>Upload Material (PDF)</h3>
              <form onSubmit={handleUploadSubmit}>
                <label style={styles.label}>Title</label>
                <input type="text" value={uploadForm.title} onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))} required style={styles.input} />

                <label style={styles.label}>Description</label>
                <textarea value={uploadForm.description} onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))} style={{ ...styles.input, height: '80px' }} />

                <label style={styles.label}>Subject</label>
                <select value={uploadForm.subject} onChange={(e) => setUploadForm(prev => ({ ...prev, subject: e.target.value }))} required style={styles.input}>
                  <option value="">Select subject</option>
                  {tutorSubjects.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>

                {/* topic removed — uploading at subject level */}

                <label style={styles.label}>File (PDF)</label>
                <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files[0])} style={styles.input} />

                <button type="submit" style={{ ...styles.button, marginTop: '10px' }}>Upload</button>
              </form>
            </div>
          )}
        </div>
      )}

      <div style={{ ...styles.card, marginBottom: '30px' }}>
        <label style={styles.label}>Filter by Subject</label>
        <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} style={styles.input}>
          <option value="">All Subjects</option>
          {subjects.map(subject => (
            <option key={subject._id} value={subject._id}>
              {subject.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gap: '15px' }}>
        {materials && materials.map(material => (
          <div key={material._id} style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div style={{ flex: 1 }}>
                <h3>{material.title}</h3>
                <p><strong>Subject:</strong> {material.subject.name}</p>
                <p><strong>Topic:</strong> {material.topic?.name || '—'}</p>
                <p><strong>File Type:</strong> {material.fileType.toUpperCase()}</p>
                <p><strong>Uploaded by:</strong> {material.uploadedBy.name}</p>
                <p><strong>Downloads:</strong> {material.downloads}</p>
                {material.description && <p>{material.description}</p>}
              </div>
              <button onClick={() => handleDownload(material._id, material.fileName)} style={styles.button}>
                ⬇️ Download
              </button>
            </div>
          </div>
        ))}
      </div>

      {materials.length === 0 && (
        <div style={styles.alertInfo}>
          No materials found. Check back later!
        </div>
      )}
    </div>
  );
};

export default Materials;
