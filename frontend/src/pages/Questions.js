import React, { useState, useEffect, useContext } from 'react';
import { questionService, subjectService } from '../services/api';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import styles from '../styles/inlineStyles';

const Questions = () => {
  const { user } = useContext(AuthContext);
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

  const openQuestion = async (questionId) => {
    setSelectedQuestionId(questionId);
    setSelectedQuestion(null);
    setAnswers([]);
    setDetailLoading(true);
    try {
      const response = await questionService.getQuestionById(questionId);
      setSelectedQuestion(response.data.question);
      setAnswers(response.data.answers || []);
    } catch (error) {
      toast.error('Failed to load question');
    } finally {
      setDetailLoading(false);
    }
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
    const confirmed = window.confirm('Delete this question? This will remove all answers.');
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
    const confirmed = window.confirm('Delete this answer?');
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

  return (
    <div style={{ ...styles.container, marginTop: '30px' }}>
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

      <div style={{ display: 'grid', gap: '15px' }}>
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
                  style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', borderRadius: '6px', marginBottom: '10px' }}
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
                  style={{ width: '100%', maxHeight: '320px', objectFit: 'cover', borderRadius: '6px', marginTop: '10px' }}
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
        <div style={styles.alertInfo}>
          No questions yet. Be the first to ask!
        </div>
      )}
    </div>
  );
};

export default Questions;
