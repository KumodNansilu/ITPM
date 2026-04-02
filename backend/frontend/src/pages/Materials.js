import React, { useState, useEffect, useContext, useMemo } from 'react';
import { materialService, subjectService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import styles from '../styles/inlineStyles';
import { showError, showSuccess } from '../utils/alerts';
import { FaBookOpen, FaCloudUploadAlt, FaDownload, FaLayerGroup } from 'react-icons/fa';

const Materials = () => {
  const [materials, setMaterials] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [selectedStudentSubjectId, setSelectedStudentSubjectId] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', description: '', subject: '' });
  const [file, setFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const { user } = useContext(AuthContext);
  const apiBaseUrl = 'http://localhost:5000';

  const resolveUploadUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${apiBaseUrl}${url}`;
  };

  const materialCountBySubject = useMemo(() => {
    const counts = {};
    (materials || []).forEach((material) => {
      const subjectId = material?.subject?._id;
      if (!subjectId) return;
      const key = String(subjectId);
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [materials]);

  const subjectsForSelectedYearSemester = useMemo(() => {
    if (!selectedYear || !selectedSemester) return [];

    return (subjects || [])
      .filter((subject) => Number(subject.year) === selectedYear && Number(subject.semester) === selectedSemester)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [subjects, selectedYear, selectedSemester]);

  const selectedStudentSubject = useMemo(() => {
    return (subjects || []).find((subject) => String(subject._id) === String(selectedStudentSubjectId));
  }, [subjects, selectedStudentSubjectId]);

  const documentsForSelectedStudentSubject = useMemo(() => {
    if (!selectedStudentSubjectId) return [];
    return (materials || []).filter((material) => String(material?.subject?._id) === String(selectedStudentSubjectId));
  }, [materials, selectedStudentSubjectId]);

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
      showError('Failed to fetch materials');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await subjectService.getAllSubjects();
      setSubjects(response.data);
    } catch (error) {
      showError('Failed to fetch subjects');
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
      showError('Failed to download material');
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      showError('Please select a file to upload');
      return;
    }

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', uploadForm.title);
      fd.append('description', uploadForm.description);
      fd.append('subject', uploadForm.subject);
      if (thumbnailFile) {
        fd.append('thumbnail', thumbnailFile);
      }
      // no topic field — upload at subject level

      await materialService.uploadMaterial(fd);
      showSuccess('Material uploaded');
      setShowUpload(false);
      setUploadForm({ title: '', description: '', subject: '' });
      setFile(null);
      setThumbnailFile(null);
      fetchMaterials();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to upload material');
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
  const isStudent = user?.role === 'student';
  const totalDownloads = (materials || []).reduce((sum, material) => sum + (material.downloads || 0), 0);

  const renderMaterialCard = (material) => (
    <div key={material._id} style={{ ...styles.card, cursor: 'default' }}>
      {material.thumbnailUrl && (
        <img
          src={resolveUploadUrl(material.thumbnailUrl)}
          alt={`${material.title} thumbnail`}
          style={{ width: '100%', height: '170px', objectFit: 'cover', borderRadius: '12px', marginBottom: '12px' }}
        />
      )}
      <h3 style={{ marginTop: 0 }}>{material.title}</h3>
      <p style={{ marginTop: 0, color: '#475569' }}>
        {(material.description || '').length > 140
          ? `${material.description.substring(0, 140)}...`
          : (material.description || 'No description available.')}
      </p>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px', marginBottom: '12px' }}>
        <span style={{ ...styles.badge, ...styles.badgePrimary }}>Subject: {material.subject?.name || 'N/A'}</span>
        <span style={{ ...styles.badge, ...styles.badgePrimary }}>Type: {(material.fileType || '-').toUpperCase()}</span>
        <span style={{ ...styles.badge, ...styles.badgePrimary }}>Downloads: {material.downloads || 0}</span>
      </div>
      <p style={{ marginTop: 0, marginBottom: '8px', color: '#334155' }}><strong>Topic:</strong> {material.topic?.name || '—'}</p>
      <p style={{ marginTop: 0, marginBottom: '14px', color: '#334155' }}><strong>Uploaded by:</strong> {material.uploadedBy?.name || 'Unknown'}</p>
      <button onClick={() => handleDownload(material._id, material.fileName)} style={styles.button}>
        Download
      </button>
    </div>
  );

  return (
    <div style={{ ...styles.container, marginTop: '30px' }}>
      <style>
        {`@keyframes materialsHeaderFloat {
          0%, 100% {
            transform: translateY(0px);
            box-shadow: 0 12px 24px rgba(2,6,23,0.3);
          }
          50% {
            transform: translateY(-6px);
            box-shadow: 0 18px 30px rgba(2,6,23,0.4);
          }
        }

        @keyframes materialsImagePulse {
          0%, 100% {
            transform: scale(1);
            filter: saturate(100%);
          }
          50% {
            transform: scale(1.03);
            filter: saturate(114%);
          }
        }`}
      </style>
      <div style={{ ...styles.card, background: 'linear-gradient(135deg, #0b1f3b 0%, #1e3a8a 100%)', color: 'white', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, marginBottom: '6px' }}>Study Materials</h1>
            <p style={{ margin: 0, opacity: 0.9 }}>Find, upload, and download resources in one organized place.</p>
          </div>
          <div
            style={{
              padding: '8px',
              borderRadius: '14px',
              border: '1px solid rgba(255,255,255,0.28)',
              background: 'rgba(255,255,255,0.14)',
              backdropFilter: 'blur(10px) saturate(145%)',
              WebkitBackdropFilter: 'blur(10px) saturate(145%)',
              boxShadow: '0 12px 24px rgba(2,6,23,0.3)',
              animation: 'materialsHeaderFloat 5s ease-in-out infinite'
            }}
          >
            <img
              src="/image/SDP.jpeg"
              alt="Study materials"
              style={{ width: '168px', height: '89px', objectFit: 'cover', borderRadius: '10px', display: 'block', animation: 'materialsImagePulse 5s ease-in-out infinite' }}
            />
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '18px' }}>
        <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}><FaBookOpen /> Materials: <strong>{materials.length}</strong></div>
        <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}><FaLayerGroup /> Subjects: <strong>{subjects.length}</strong></div>
        <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}><FaDownload /> Downloads: <strong>{totalDownloads}</strong></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0 }}>Study Materials</h1>
        {user?.role === 'tutor' && (
          <button style={styles.button} onClick={() => setShowUpload(!showUpload)}>
            {showUpload ? 'Cancel' : '+ Upload Material'}
          </button>
        )}
      </div>

      {user?.role === 'tutor' && (
        <div style={{ marginBottom: '20px' }}>
          {showUpload && (
            <div style={{ ...styles.card, marginTop: 0, marginBottom: '30px' }}>
              <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaCloudUploadAlt /> Upload Material
              </h2>
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

                <label style={styles.label}>Thumbnail (Optional)</label>
                <input type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)} style={styles.input} />

                <button type="submit" style={{ ...styles.button, marginTop: '10px' }}>Upload</button>
              </form>
            </div>
          )}
        </div>
      )}

      {!isStudent && (
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
      )}

      {isStudent ? (
        <div>
          {!selectedYear && (
            <div style={styles.card}>
              <h2 style={{ marginBottom: '16px' }}>Select Academic Year</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
                {[1, 2, 3, 4].map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => {
                      setSelectedYear(year);
                      setSelectedSemester(null);
                      setSelectedStudentSubjectId('');
                    }}
                    style={{ ...styles.card, marginBottom: 0, cursor: 'pointer', border: '2px solid #667eea', textAlign: 'center' }}
                  >
                    <h3 style={{ marginBottom: '6px' }}>Year {year}</h3>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedYear && !selectedSemester && (
            <div style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ margin: 0 }}>Year {selectedYear} - Select Semester</h2>
                <button
                  type="button"
                  style={styles.buttonDanger}
                  onClick={() => {
                    setSelectedYear(null);
                    setSelectedSemester(null);
                    setSelectedStudentSubjectId('');
                  }}
                >
                  Back
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
                {[1, 2].map((semester) => (
                  <button
                    key={semester}
                    type="button"
                    onClick={() => {
                      setSelectedSemester(semester);
                      setSelectedStudentSubjectId('');
                    }}
                    style={{ ...styles.card, marginBottom: 0, cursor: 'pointer', border: '2px solid #764ba2', textAlign: 'center' }}
                  >
                    <h3 style={{ marginBottom: '6px' }}>Semester {semester}</h3>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedYear && selectedSemester && !selectedStudentSubjectId && (
            <div style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ margin: 0 }}>Year {selectedYear} - Semester {selectedSemester} - Subjects</h2>
                <button
                  type="button"
                  style={styles.buttonDanger}
                  onClick={() => {
                    setSelectedSemester(null);
                    setSelectedStudentSubjectId('');
                  }}
                >
                  Back
                </button>
              </div>

              {subjectsForSelectedYearSemester.length === 0 ? (
                <div style={styles.alertInfo}>No subjects found for this year and semester.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '15px' }}>
                  {subjectsForSelectedYearSemester.map((subject) => {
                    const docCount = materialCountBySubject[String(subject._id)] || 0;
                    return (
                      <button
                        key={subject._id}
                        type="button"
                        onClick={() => setSelectedStudentSubjectId(subject._id)}
                        style={{ ...styles.card, marginBottom: 0, cursor: 'pointer', border: '1px solid #ddd', textAlign: 'left' }}
                      >
                        <h3 style={{ marginBottom: '6px' }}>{subject.name}</h3>
                        <p style={{ margin: 0, color: '#555' }}>{subject.code}</p>
                        <p style={{ marginTop: '8px', color: '#1a73e8', fontWeight: 600 }}>{docCount} document(s)</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {selectedStudentSubjectId && (
            <div style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ margin: 0 }}>
                  {selectedStudentSubject?.name || 'Subject'} Documents
                </h2>
                <button
                  type="button"
                  style={styles.buttonDanger}
                  onClick={() => setSelectedStudentSubjectId('')}
                >
                  Back to Subjects
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
                {documentsForSelectedStudentSubject.map((material) => (
                  renderMaterialCard(material)
                ))}
              </div>

              {documentsForSelectedStudentSubject.length === 0 && (
                <div style={styles.alertInfo}>No documents available for this subject yet.</div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
          {materials && materials.map(material => (
            renderMaterialCard(material)
          ))}
        </div>
      )}

      {!isStudent && materials.length === 0 && (
        <div style={{ ...styles.card, textAlign: 'center' }}>
          <h3 style={{ marginTop: 0 }}>No materials found</h3>
          <p style={{ color: 'rgba(11,31,59,0.7)' }}>
            {user?.role === 'tutor' ? 'Upload your first material to help students learn faster.' : 'Check back later for new study resources.'}
          </p>
          {user?.role === 'tutor' && (
            <button type="button" onClick={() => setShowUpload(true)} style={styles.button}>Upload First Material</button>
          )}
        </div>
      )}
    </div>
  );
};

export default Materials;
