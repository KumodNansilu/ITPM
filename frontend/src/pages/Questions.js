import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { questionService, subjectService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import styles from '../styles/inlineStyles';
import { showError, showSuccess, confirmDialog } from '../utils/alerts';
import { FaCheckCircle, FaComments, FaQuestionCircle } from 'react-icons/fa';

// Redirect existing toast calls to SweetAlert2.
const toast = {
  success: (message) => showSuccess(message),
  error: (message) => showError(message)
};

const Questions = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    topic: '',
    questionType: 'text'
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [answerContent, setAnswerContent] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [questionEdit, setQuestionEdit] = useState({ title: '', description: '' });
  const [editingAnswerId, setEditingAnswerId] = useState(null);
  const [editingAnswerContent, setEditingAnswerContent] = useState('');
  const [imageViewer, setImageViewer] = useState({
    isOpen: false,
    src: null,
    zoom: 1
  });

  useEffect(() => {
    fetchQuestions();
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedQuestion) {
      setQuestionEdit({
        title: selectedQuestion.title || '',
        description: selectedQuestion.description || ''
      });
      setIsEditingQuestion(false);
      setEditingAnswerId(null);
      setEditingAnswerContent('');
    }
  }, [selectedQuestionId, selectedQuestion]);

  const fetchQuestions = async () => {
    try {
      const response = await questionService.getAllQuestions();
      setQuestions(response.data);
    } catch (error) {
      toast.error('Failed to fetch questions');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (imageFile) {
        const payload = new FormData();
        payload.append('title', formData.title);
        payload.append('description', formData.description);
        payload.append('subject', formData.subject);
        if (formData.topic) {
          payload.append('topic', formData.topic);
        }
        payload.append('questionType', formData.questionType);
        payload.append('image', imageFile);

        await questionService.createQuestion(payload);
      } else {
        const payload = {
          title: formData.title,
          description: formData.description,
          subject: formData.subject,
          questionType: formData.questionType
        };

        if (formData.topic) {
          payload.topic = formData.topic;
        }

        await questionService.createQuestion(payload);
      }
      toast.success('Question posted successfully');
      setFormData({ title: '', description: '', subject: '', topic: '', questionType: 'text' });
      setImageFile(null);
      setShowForm(false);
      fetchQuestions();
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to post question';
      toast.error(message);
    }
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) {
      return null;
    }
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    return `http://localhost:5000${imageUrl}`;
  };

  const openImageViewer = (src) => {
    if (!src) {
      return;
    }
    setImageViewer({ isOpen: true, src, zoom: 1 });
  };

  const closeImageViewer = () => {
    setImageViewer({ isOpen: false, src: null, zoom: 1 });
  };

  const zoomImageViewer = (delta) => {
    setImageViewer((prev) => {
      const nextZoom = Math.min(5, Math.max(1, (prev.zoom || 1) + delta));
      return { ...prev, zoom: nextZoom };
    });
  };

  const handleViewerWheel = (e) => {
    // Prevent the page from scrolling while zooming the image.
    e.preventDefault();
    const direction = e.deltaY > 0 ? -1 : 1;
    zoomImageViewer(direction * 0.2);
  };

  const openQuestion = (questionId) => {
    navigate(`/questions/${questionId}`);
  };

  const closeQuestion = () => {
    setSelectedQuestionId(null);
    setSelectedQuestion(null);
    setAnswers([]);
    setAnswerContent('');
  };

  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    if (!selectedQuestionId) {
      return;
    }
    try {
      await questionService.createAnswer(selectedQuestionId, { content: answerContent });
      toast.success('Answer posted successfully');
      setAnswerContent('');
      openQuestion(selectedQuestionId);
      fetchQuestions();
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to post answer';
      toast.error(message);
    }
  };

  const handleHelpfulToggle = async (answerId) => {
    try {
      const response = await questionService.markAnswerHelpful(answerId);
      setAnswers((prev) =>
        prev.map((answer) => (answer._id === answerId ? response.data.answer : answer))
      );
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to update like';
      toast.error(message);
    }
  };

  const handleQuestionUpdate = async () => {
    if (!selectedQuestionId) {
      return;
    }
    try {
      const response = await questionService.updateQuestion(selectedQuestionId, {
        title: questionEdit.title,
        description: questionEdit.description
      });
      setSelectedQuestion(response.data.question);
      setIsEditingQuestion(false);
      fetchQuestions();
      toast.success('Question updated');
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to update question';
      toast.error(message);
    }
  };

  const handleQuestionDelete = async () => {
    if (!selectedQuestionId) {
      return;
    }
    const confirmed = await confirmDialog({
      title: 'Delete question?',
      text: 'This will remove all answers.',
      icon: 'warning',
      confirmButtonText: 'Yes, delete'
    });
    if (!confirmed) {
      return;
    }
    try {
      await questionService.deleteQuestion(selectedQuestionId);
      closeQuestion();
      fetchQuestions();
      toast.success('Question deleted');
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to delete question';
      toast.error(message);
    }
  };

  const startAnswerEdit = (answer) => {
    setEditingAnswerId(answer._id);
    setEditingAnswerContent(answer.content || '');
  };

  const cancelAnswerEdit = () => {
    setEditingAnswerId(null);
    setEditingAnswerContent('');
  };

  const handleAnswerUpdate = async (answerId) => {
    try {
      const response = await questionService.updateAnswer(answerId, {
        content: editingAnswerContent
      });
      setAnswers((prev) =>
        prev.map((answer) => (answer._id === answerId ? response.data.answer : answer))
      );
      cancelAnswerEdit();
      toast.success('Answer updated');
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to update answer';
      toast.error(message);
    }
  };

  const handleAnswerDelete = async (answerId) => {
    const confirmed = await confirmDialog({
      title: 'Delete answer?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      confirmButtonText: 'Yes, delete'
    });
    if (!confirmed) {
      return;
    }
    try {
      await questionService.deleteAnswer(answerId);
      setAnswers((prev) => prev.filter((answer) => answer._id !== answerId));
      fetchQuestions();
      toast.success('Answer deleted');
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to delete answer';
      toast.error(message);
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

  const answeredCount = questions.filter((q) => q.status === 'answered').length;
  const openCount = questions.length - answeredCount;
  const totalViews = questions.reduce((sum, q) => sum + (q.views || 0), 0);

  return (
    <div style={{ ...styles.container, marginTop: '30px' }}>
      <div style={{ ...styles.card, background: 'linear-gradient(135deg, #0b1f3b 0%, #1e3a8a 100%)', color: 'white', marginBottom: '16px' }}>
        <h1 style={{ margin: 0, marginBottom: '6px' }}>Q&A Forum</h1>
        <p style={{ margin: 0, opacity: 0.9 }}>Ask faster, answer better, and learn from the community.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '18px' }}>
        <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}><FaQuestionCircle /> Open: <strong>{openCount}</strong></div>
        <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}><FaCheckCircle /> Answered: <strong>{answeredCount}</strong></div>
        <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}><FaComments /> Views: <strong>{totalViews}</strong></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Q&A Forum</h1>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Ask Question'}
        </button>
      </div>

      {showForm && (
        <div style={{ ...styles.card, marginBottom: '30px' }}>
          <h2>Ask a Question</h2>
          <form onSubmit={handleSubmit}>
            <label style={styles.label}>Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
              style={styles.input}
            />

            <label style={styles.label}>Question</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              required
              rows="5"
              style={{ ...styles.input, height: '120px' }}
            />

            <label style={styles.label}>Subject</label>
            <select
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
              required
              style={styles.input}
            >
              <option value="">Select a subject</option>
              {subjects.map(subject => (
                <option key={subject._id} value={subject._id}>
                  {subject.name}
                </option>
              ))}
            </select>

            <label style={styles.label}>Question Type</label>
            <select
              value={formData.questionType}
              onChange={(e) => setFormData({ ...formData, questionType: e.target.value })}
              style={styles.input}
            >
              <option value="text">Text</option>
              <option value="mcq">MCQ</option>
            </select>

            <label style={styles.label}>Upload Photo (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
              style={styles.input}
            />

            <button type="submit" style={styles.button}>Post Question</button>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
        {questions && questions.map(question => (
          <div
            key={question._id}
            style={{ ...styles.card, cursor: 'pointer' }}
            onClick={() => openQuestion(question._id)}
          >
            <div>
              <h3>{question.title}</h3>
              {question.imageUrl && (
                <img
                  src={getImageUrl(question.imageUrl)}
                  alt="Question"
                  style={{ width: '100%', maxHeight: '220px', objectFit: 'contain', background: '#f7f7fb', borderRadius: '6px', marginBottom: '10px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    openImageViewer(getImageUrl(question.imageUrl));
                  }}
                />
              )}
              <p>
                {(question.description || '').length > 150
                  ? `${question.description.substring(0, 150)}...`
                  : question.description}
              </p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <span style={{ ...styles.badge, ...(question.status === 'answered' ? styles.badgeSuccess : styles.badgePrimary) }}>
                  {question.status}
                </span>
                <span style={{ ...styles.badge, ...styles.badgePrimary }}>
                  👤 {question.asker?.name || 'Unknown'}
                </span>
                <span style={{ ...styles.badge, ...styles.badgePrimary }}>
                  👁️ {question.views} views
                </span>
                <span style={{ ...styles.badge, ...styles.badgePrimary }}>
                  🏷️ {question.questionType}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedQuestion && (
        <div style={{ ...styles.card, marginTop: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {isEditingQuestion ? (
              <input
                type="text"
                value={questionEdit.title}
                onChange={(e) => setQuestionEdit({ ...questionEdit, title: e.target.value })}
                style={{ ...styles.input, margin: 0, maxWidth: '420px' }}
              />
            ) : (
              <h2 style={{ margin: 0 }}>{selectedQuestion.title}</h2>
            )}

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {selectedQuestion.asker?._id === user?.id && (
                <>
                  {isEditingQuestion ? (
                    <>
                      <button type="button" onClick={handleQuestionUpdate} style={styles.button}>
                        Save
                      </button>
                      <button type="button" onClick={() => setIsEditingQuestion(false)}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => setIsEditingQuestion(true)}>
                        Edit
                      </button>
                      <button type="button" onClick={handleQuestionDelete} style={styles.buttonDanger}>
                        Delete
                      </button>
                    </>
                  )}
                </>
              )}
              <button onClick={closeQuestion}>Close</button>
            </div>
          </div>

          {detailLoading ? (
            <div style={styles.loading}>Loading question...</div>
          ) : (
            <>
              {isEditingQuestion ? (
                <textarea
                  value={questionEdit.description}
                  onChange={(e) => setQuestionEdit({ ...questionEdit, description: e.target.value })}
                  rows="5"
                  style={{ ...styles.input, height: '120px', marginTop: '10px' }}
                />
              ) : (
                <p style={{ marginTop: '10px' }}>{selectedQuestion.description}</p>
              )}
              {selectedQuestion.imageUrl && (
                <img
                  src={getImageUrl(selectedQuestion.imageUrl)}
                  alt="Question"
                  style={{ width: '100%', maxHeight: '420px', objectFit: 'contain', background: '#f7f7fb', borderRadius: '6px', marginTop: '10px', cursor: 'zoom-in' }}
                  onClick={() => openImageViewer(getImageUrl(selectedQuestion.imageUrl))}
                />
              )}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <span style={{ ...styles.badge, ...(selectedQuestion.status === 'answered' ? styles.badgeSuccess : styles.badgePrimary) }}>
                  {selectedQuestion.status}
                </span>
                <span style={{ ...styles.badge, ...styles.badgePrimary }}>
                  👤 {selectedQuestion.asker?.name || 'Unknown'}
                </span>
                <span style={{ ...styles.badge, ...styles.badgePrimary }}>
                  👁️ {selectedQuestion.views} views
                </span>
                <span style={{ ...styles.badge, ...styles.badgePrimary }}>
                  🏷️ {selectedQuestion.questionType}
                </span>
              </div>

              <div style={{ marginTop: '20px' }}>
                <h3>Answers</h3>
                {answers.length === 0 && (
                  <div style={styles.alertInfo}>No answers yet. Be the first to answer!</div>
                )}
                {answers.map((answer) => (
                  <div key={answer._id} style={{ ...styles.card, marginTop: '10px' }}>
                    {editingAnswerId === answer._id ? (
                      <textarea
                        value={editingAnswerContent}
                        onChange={(e) => setEditingAnswerContent(e.target.value)}
                        rows="3"
                        style={{ ...styles.input, height: '90px', marginBottom: '10px' }}
                      />
                    ) : (
                      <p style={{ marginBottom: '10px' }}>{answer.content}</p>
                    )}
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <span style={{ ...styles.badge, ...(answer.isAccepted ? styles.badgeSuccess : styles.badgePrimary) }}>
                        {answer.isAccepted ? 'accepted' : 'answer'}
                      </span>
                      <span style={{ ...styles.badge, ...styles.badgePrimary }}>
                        👤 {answer.answerer?.name || 'Unknown'}
                      </span>
                      <span style={{ ...styles.badge, ...styles.badgePrimary }}>
                        👍 {answer.helpfulCount}
                      </span>
                      {answer.answerer?._id === user?.id && (
                        <>
                          {editingAnswerId === answer._id ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleAnswerUpdate(answer._id)}
                                style={{ ...styles.button, padding: '6px 12px' }}
                              >
                                Save
                              </button>
                              <button type="button" onClick={cancelAnswerEdit}>
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button type="button" onClick={() => startAnswerEdit(answer)}>
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAnswerDelete(answer._id)}
                                style={styles.buttonDanger}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => handleHelpfulToggle(answer._id)}
                        style={{ ...styles.button, padding: '6px 12px' }}
                      >
                        Like
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '20px' }}>
                <h3>Your Answer</h3>
                <form onSubmit={handleAnswerSubmit}>
                  <textarea
                    value={answerContent}
                    onChange={(e) => setAnswerContent(e.target.value)}
                    required
                    rows="4"
                    style={{ ...styles.input, height: '100px' }}
                    placeholder="Write your answer..."
                  />
                  <button type="submit" style={styles.button}>Post Answer</button>
                </form>
              </div>
            </>
          )}
        </div>
      )}

      {questions.length === 0 && (
        <div style={{ ...styles.card, textAlign: 'center' }}>
          <h3 style={{ marginTop: 0 }}>No questions yet</h3>
          <p style={{ color: 'rgba(11,31,59,0.7)' }}>Start the discussion by asking your first question.</p>
          <button type="button" onClick={() => setShowForm(true)} style={styles.button}>Ask First Question</button>
        </div>
      )}

      {imageViewer.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={closeImageViewer}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(1100px, 100%)',
              maxHeight: '90vh',
              background: '#0f1220',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.06)',
                borderBottom: '1px solid rgba(255,255,255,0.08)'
              }}
            >
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px' }}>
                Zoom: {Math.round((imageViewer.zoom || 1) * 100)}%
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => zoomImageViewer(-0.2)}>
                  -
                </button>
                <button type="button" onClick={() => setImageViewer((prev) => ({ ...prev, zoom: 1 }))}>
                  Reset
                </button>
                <button type="button" onClick={() => zoomImageViewer(0.2)}>
                  +
                </button>
                <button type="button" onClick={closeImageViewer}>
                  Close
                </button>
              </div>
            </div>

            <div
              onWheel={handleViewerWheel}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'auto',
                padding: '18px'
              }}
            >
              <img
                src={imageViewer.src || ''}
                alt="Full size"
                draggable={false}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  transform: `scale(${imageViewer.zoom || 1})`,
                  transformOrigin: 'center center',
                  transition: 'transform 80ms linear',
                  background: 'transparent'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Questions;
