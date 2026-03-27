import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { questionService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import styles from '../styles/inlineStyles';
import { showError, showSuccess, confirmDialog } from '../utils/alerts';

const toast = {
  success: (message) => showSuccess(message),
  error: (message) => showError(message)
};

const QuestionDetails = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { questionId } = useParams();

  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answerContent, setAnswerContent] = useState('');
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
    if (questionId) {
      fetchQuestion();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId]);

  useEffect(() => {
    if (question) {
      setQuestionEdit({
        title: question.title || '',
        description: question.description || ''
      });
      setIsEditingQuestion(false);
      setEditingAnswerId(null);
      setEditingAnswerContent('');
    }
  }, [question]);

  const fetchQuestion = async () => {
    setLoading(true);
    try {
      const response = await questionService.getQuestionById(questionId);
      setQuestion(response.data.question);
      setAnswers(response.data.answers || []);
    } catch (error) {
      toast.error('Failed to load question');
      navigate('/questions');
    } finally {
      setLoading(false);
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
    e.preventDefault();
    const direction = e.deltaY > 0 ? -1 : 1;
    zoomImageViewer(direction * 0.2);
  };

  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    if (!questionId) {
      return;
    }
    try {
      await questionService.createAnswer(questionId, { content: answerContent });
      toast.success('Answer posted successfully');
      setAnswerContent('');
      fetchQuestion();
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
    if (!questionId) {
      return;
    }
    try {
      const response = await questionService.updateQuestion(questionId, {
        title: questionEdit.title,
        description: questionEdit.description
      });
      setQuestion(response.data.question);
      setIsEditingQuestion(false);
      toast.success('Question updated');
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to update question';
      toast.error(message);
    }
  };

  const handleQuestionDelete = async () => {
    if (!questionId) {
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
      await questionService.deleteQuestion(questionId);
      toast.success('Question deleted');
      navigate('/questions');
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
      fetchQuestion();
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

  if (!question) {
    return (
      <div style={{ ...styles.container, marginTop: '30px' }}>
        <div style={styles.card}>
          <h2>Question not found</h2>
          <button type="button" onClick={() => navigate('/questions')} style={styles.button}>Back to Q&A Forum</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...styles.container, marginTop: '30px' }}>
      <div style={{ ...styles.card, marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>Question Details</h1>
        <button type="button" onClick={() => navigate('/questions')}>Back to Q&A Forum</button>
      </div>

      <div style={{ ...styles.card, marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {isEditingQuestion ? (
            <input
              type="text"
              value={questionEdit.title}
              onChange={(e) => setQuestionEdit({ ...questionEdit, title: e.target.value })}
              style={{ ...styles.input, margin: 0, maxWidth: '420px' }}
            />
          ) : (
            <h2 style={{ margin: 0 }}>{question.title}</h2>
          )}

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {question.asker?._id === user?.id && (
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
          </div>
        </div>

        {isEditingQuestion ? (
          <textarea
            value={questionEdit.description}
            onChange={(e) => setQuestionEdit({ ...questionEdit, description: e.target.value })}
            rows="5"
            style={{ ...styles.input, height: '120px', marginTop: '10px' }}
          />
        ) : (
          <p style={{ marginTop: '10px' }}>{question.description}</p>
        )}

        {question.imageUrl && (
          <img
            src={getImageUrl(question.imageUrl)}
            alt="Question"
            style={{ width: '100%', maxHeight: '420px', objectFit: 'contain', background: '#f7f7fb', borderRadius: '6px', marginTop: '10px', cursor: 'zoom-in' }}
            onClick={() => openImageViewer(getImageUrl(question.imageUrl))}
          />
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
          <span style={{ ...styles.badge, ...(question.status === 'answered' ? styles.badgeSuccess : styles.badgePrimary) }}>
            {question.status}
          </span>
          <span style={{ ...styles.badge, ...styles.badgePrimary }}>
            Asker: {question.asker?.name || 'Unknown'}
          </span>
          <span style={{ ...styles.badge, ...styles.badgePrimary }}>
            Views: {question.views || 0}
          </span>
          <span style={{ ...styles.badge, ...styles.badgePrimary }}>
            Type: {question.questionType || 'text'}
          </span>
          {question.subject?.name && (
            <span style={{ ...styles.badge, ...styles.badgePrimary }}>
              Subject: {question.subject.name}
            </span>
          )}
          <span style={{ ...styles.badge, ...styles.badgePrimary }}>
            Posted: {question.createdAt ? new Date(question.createdAt).toLocaleString() : 'N/A'}
          </span>
        </div>
      </div>

      <div style={{ ...styles.card, marginBottom: '20px' }}>
        <h3>Answers ({answers.length})</h3>
        {answers.length === 0 && (
          <div style={styles.alertInfo}>No answers yet. Be the first to answer.</div>
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

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ ...styles.badge, ...(answer.isAccepted ? styles.badgeSuccess : styles.badgePrimary) }}>
                {answer.isAccepted ? 'accepted' : 'answer'}
              </span>
              <span style={{ ...styles.badge, ...styles.badgePrimary }}>
                By: {answer.answerer?.name || 'Unknown'}
              </span>
              <span style={{ ...styles.badge, ...styles.badgePrimary }}>
                Helpful: {answer.helpfulCount || 0}
              </span>
              <span style={{ ...styles.badge, ...styles.badgePrimary }}>
                Posted: {answer.createdAt ? new Date(answer.createdAt).toLocaleString() : 'N/A'}
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

      <div style={styles.card}>
        <h3>Add Your Answer</h3>
        <form onSubmit={handleAnswerSubmit}>
          <textarea
            value={answerContent}
            onChange={(e) => setAnswerContent(e.target.value)}
            required
            rows="4"
            style={{ ...styles.input, height: '110px' }}
            placeholder="Write your answer..."
          />
          <button type="submit" style={styles.button}>Post Answer</button>
        </form>
      </div>

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

export default QuestionDetails;
