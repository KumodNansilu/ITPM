import React, { useContext, useEffect, useState } from 'react';
import { examService, mcqService, subjectService } from '../services/api';
import styles from '../styles/inlineStyles';
import { AuthContext } from '../context/AuthContext';
import { showError, showInfo, showSuccess, confirmDialog } from '../utils/alerts';
import { FaChartLine, FaClipboardList, FaLayerGroup } from 'react-icons/fa';

// Keep existing `toast.*(...)` calls, but route them to SweetAlert2.
const toast = {
  success: (message) => showSuccess(message),
  error: (message) => showError(message),
  info: (message) => showInfo(message)
};

const MCQ = () => {
  const { user } = useContext(AuthContext);

  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  
  // Tutor exam management
  const [exams, setExams] = useState([]);
  const [creatingExam, setCreatingExam] = useState(false);
  const [editingExamId, setEditingExamId] = useState(null);
  const [examFormData, setExamFormData] = useState({
    name: '',
    description: '',
    difficulty: 'mixed',
    duration: 30,
    passingPercentage: 60,
    questions: []
  });
  const [examThumbnailFile, setExamThumbnailFile] = useState(null);
  
  // Tutor MCQ list for exam creation
  const [availableMCQs, setAvailableMCQs] = useState([]);
  const [selectedMCQs, setSelectedMCQs] = useState(new Set());

  // Tutor's previously created MCQs
  const [createdMCQs, setCreatedMCQs] = useState([]);

  // Tutor MCQ creation form
  const [creatingMCQ, setCreatingMCQ] = useState(false);
  const [mcqFormData, setMcqFormData] = useState({
    question: '',
    explanation: '',
    difficulty: 'medium',
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ]
  });

  // Student exam attempt
  const [studentExams, setStudentExams] = useState([]);
  const [selectedExamForAttempt, setSelectedExamForAttempt] = useState(null);
  const [examQuestions, setExamQuestions] = useState([]);
  const [examAnswers, setExamAnswers] = useState({});
  const [examResult, setExamResult] = useState(null);
  const [examAttemptHistory, setExamAttemptHistory] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [submittingExam, setSubmittingExam] = useState(false);

  const isTutor = user?.role === 'tutor' || user?.role === 'admin';
  const isStudent = user?.role === 'student';
  const apiBaseUrl = 'http://localhost:5000';

  const resolveUploadUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${apiBaseUrl}${url}`;
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchTopics(selectedSubject);
    } else {
      setTopics([]);
      setSelectedTopic('');
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (isTutor) {
      fetchExams();
      fetchCreatedMCQs();
      if (creatingExam || editingExamId) {
        fetchAvailableMCQs();
      }
    }
    if (isStudent) {
      fetchStudentExams();
      fetchExamAttemptHistory();
    }
    setLoading(false);
    // Intentional: data reload is keyed off role/form/filter state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTutor, isStudent, creatingExam, editingExamId, selectedSubject, selectedTopic]);

  const fetchSubjects = async () => {
    try {
      const response = await subjectService.getAllSubjects();
      setSubjects(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch subjects');
    }
  };

  const fetchTopics = async (subjectId) => {
    try {
      const response = await subjectService.getTopicsBySubject(subjectId);
      setTopics(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch topics');
    }
  };

  const fetchAvailableMCQs = async () => {
    try {
      const params = {
        subjectId: selectedSubject || undefined,
        topicId: selectedTopic || undefined
      };
      const response = await mcqService.getAllMCQs(params);
      setAvailableMCQs(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch MCQs');
    }
  };

  const fetchCreatedMCQs = async () => {
    try {
      const response = await mcqService.getAllMCQs({ mine: 'true' });
      setCreatedMCQs(response.data || []);
    } catch (error) {
      setCreatedMCQs([]);
    }
  };

  const fetchExams = async () => {
    try {
      const params = {
        mine: isTutor ? 'true' : undefined,
        isPublished: isStudent ? 'true' : undefined
      };
      const response = await examService.getAllExams(params);
      setExams(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch exams');
    }
  };

  const fetchStudentExams = async () => {
    try {
      const response = await examService.getAllExams({ isPublished: 'true' });
      setStudentExams(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch exams');
    }
  };

  const fetchExamAttemptHistory = async () => {
    try {
      const response = await examService.getMyExamAttempts();
      setExamAttemptHistory(response.data || []);
    } catch (error) {
      setExamAttemptHistory([]);
    }
  };

  // TUTOR EXAM MANAGEMENT
  const handleToggleMCQSelection = (mcqId) => {
    const newSelected = new Set(selectedMCQs);
    if (newSelected.has(mcqId)) {
      newSelected.delete(mcqId);
    } else {
      newSelected.add(mcqId);
    }
    setSelectedMCQs(newSelected);
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();

    if (!selectedSubject) {
      toast.error('Please select a subject');
      return;
    }

    if (selectedMCQs.size !== 10) {
      toast.error(`Select exactly 10 MCQs. You selected ${selectedMCQs.size}`);
      return;
    }

    if (!examFormData.name.trim()) {
      toast.error('Exam name is required');
      return;
    }

    const payload = new FormData();
    payload.append('name', examFormData.name);
    payload.append('description', examFormData.description || '');
    payload.append('subject', selectedSubject);
    if (selectedTopic) payload.append('topic', selectedTopic);
    payload.append('questions', JSON.stringify(Array.from(selectedMCQs)));
    payload.append('difficulty', examFormData.difficulty);
    payload.append('duration', String(examFormData.duration));
    payload.append('passingPercentage', String(examFormData.passingPercentage));
    if (examThumbnailFile) {
      payload.append('thumbnail', examThumbnailFile);
    }

    try {
      if (editingExamId) {
        await examService.updateExam(editingExamId, payload);
        toast.success('Exam updated successfully');
      } else {
        await examService.createExam(payload);
        toast.success('Exam created successfully with 10 MCQs');
      }

      resetExamForm();
      fetchExams();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save exam');
    }
  };

  const resetExamForm = () => {
    setCreatingExam(false);
    setEditingExamId(null);
    setExamFormData({
      name: '',
      description: '',
      difficulty: 'mixed',
      duration: 30,
      passingPercentage: 60,
      questions: []
    });
    setSelectedMCQs(new Set());
    setExamThumbnailFile(null);
  };

  const handleEditExam = (exam) => {
    setEditingExamId(exam._id);
    setSelectedSubject(exam.subject?._id || exam.subject || '');
    setSelectedTopic(exam.topic?._id || exam.topic || '');
    setExamFormData({
      name: exam.name,
      description: exam.description || '',
      difficulty: exam.difficulty || 'mixed',
      duration: exam.duration || 30,
      passingPercentage: exam.passingPercentage || 60,
      questions: exam.questions || []
    });
    setSelectedMCQs(new Set(exam.questions.map(q => q._id || q)));
    setExamThumbnailFile(null);
    setCreatingExam(true);
  };

  const handleDeleteExam = async (examId) => {
    const confirmed = await confirmDialog({
      title: 'Delete this exam?',
      text: 'All student attempts will be deleted. Continue?',
      icon: 'warning',
      confirmButtonText: 'Yes, delete'
    });
    if (!confirmed) return;

    try {
      await examService.deleteExam(examId);
      toast.success('Exam deleted successfully');
      fetchExams();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete exam');
    }
  };

  // STUDENT EXAM ATTEMPT
  const handleStartExamAttempt = async (exam) => {
    try {
      const response = await examService.getExamQuestions(exam._id);
      setExamQuestions(response.data.questions || []);
      setSelectedExamForAttempt(exam);
      setExamAnswers({});
      setExamResult(null);
      toast.success(`Exam started: ${exam.name}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start exam');
    }
  };

  const handleSelectExamAnswer = (mcqId, optionIndex) => {
    setExamAnswers(prev => ({ ...prev, [mcqId]: optionIndex }));
  };

  const handleSubmitExamAttempt = async () => {
    if (!selectedExamForAttempt || examQuestions.length === 0) {
      return;
    }

    setSubmittingExam(true);

    const payload = {
      answers: examQuestions.map(question => ({
        mcqId: question._id,
        selectedOption: Number.isInteger(examAnswers[question._id]) ? examAnswers[question._id] : -1
      }))
    };

    try {
      const response = await examService.submitExamAttempt(selectedExamForAttempt._id, payload);
      setExamResult(response.data.result);
      setExamQuestions([]);
      setExamAnswers({});
      fetchExamAttemptHistory();
      toast.success('Exam submitted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit exam');
    } finally {
      setSubmittingExam(false);
    }
  };

  // MCQ MANAGEMENT (EDIT/DELETE INDIVIDUAL MCQs)
  const handleEditMCQ = (mcq) => {
    toast.info('Edit MCQ feature coming soon');
    // TODO: Implement MCQ editing functionality
  };

  const handleDeleteMCQ = async (mcqId) => {
    const confirmed = await confirmDialog({
      title: 'Delete this MCQ?',
      text: 'It will be removed from all exams.',
      icon: 'warning',
      confirmButtonText: 'Yes, delete'
    });
    if (!confirmed) return;

    try {
      await mcqService.deleteMCQ(mcqId);
      toast.success('MCQ deleted successfully');
      fetchCreatedMCQs();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete MCQ');
    }
  };

  // MCQ CREATION HANDLERS
  const resetMCQForm = () => {
    setCreatingMCQ(false);
    setMcqFormData({
      question: '',
      explanation: '',
      difficulty: 'medium',
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ]
    });
  };

  const handleMCQQuestionChange = (e) => {
    setMcqFormData(prev => ({ ...prev, question: e.target.value }));
  };

  const handleMCQOptionChange = (index, text) => {
    const newOptions = [...mcqFormData.options];
    newOptions[index].text = text;
    setMcqFormData(prev => ({ ...prev, options: newOptions }));
  };

  const handleMCQCorrectAnswerChange = (index) => {
    const newOptions = mcqFormData.options.map((opt, idx) => ({
      ...opt,
      isCorrect: idx === index
    }));
    setMcqFormData(prev => ({ ...prev, options: newOptions }));
  };

  const handleCreateMCQ = async (e) => {
    e.preventDefault();

    if (!mcqFormData.question.trim()) {
      toast.error('Question is required');
      return;
    }

    if (!selectedSubject) {
      toast.error('Please select a subject');
      return;
    }

    const emptyOption = mcqFormData.options.some(opt => !opt.text.trim());
    if (emptyOption) {
      toast.error('All options must have text');
      return;
    }

    const correctCount = mcqFormData.options.filter(opt => opt.isCorrect).length;
    if (correctCount !== 1) {
      toast.error('Exactly one option must be marked as correct');
      return;
    }

    const payload = {
      question: mcqFormData.question,
      subject: selectedSubject,
      topic: selectedTopic || undefined,
      options: mcqFormData.options,
      explanation: mcqFormData.explanation,
      difficulty: mcqFormData.difficulty
    };

    try {
      await mcqService.createMCQ(payload);
      toast.success('MCQ created successfully');
      resetMCQForm();
      fetchCreatedMCQs();
      fetchAvailableMCQs();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create MCQ');
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

  const totalExamsForView = isTutor ? exams.length : studentExams.length;
  const totalAttempts = examAttemptHistory.length;
  const totalMCQsCreated = createdMCQs.length;

  return (
    <div style={{ ...styles.container, marginTop: '30px' }}>
      <div style={{ ...styles.card, background: 'linear-gradient(135deg, #0b1f3b 0%, #1e3a8a 100%)', color: 'white', marginBottom: '16px' }}>
        <h1 style={{ margin: 0, marginBottom: '6px' }}>MCQ Mock Exams</h1>
        <p style={{ margin: 0, opacity: 0.9 }}>
          {isTutor ? 'Create question banks and publish exams with confidence.' : 'Practice timed exams and improve your score with feedback.'}
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '18px' }}>
        <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}><FaClipboardList /> Exams: <strong>{totalExamsForView}</strong></div>
        <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}><FaLayerGroup /> MCQs: <strong>{totalMCQsCreated}</strong></div>
        <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}><FaChartLine /> Attempts: <strong>{totalAttempts}</strong></div>
      </div>
      <h1 style={{ marginBottom: '30px' }}>MCQ Mock Exams</h1>

      {/* TUTOR: CREATE & MANAGE EXAMS */}
      {isTutor && (
        <div>
          {/* CREATE MCQ SECTION */}
          <div style={{ ...styles.card, marginBottom: '20px', background: '#f5f5f5' }}>
            <button
              style={styles.button}
              onClick={() => setCreatingMCQ(!creatingMCQ)}
            >
              {creatingMCQ ? 'Cancel' : '+ Create MCQ Question'}
            </button>
          </div>

          {creatingMCQ && (
            <div style={{ ...styles.card, marginBottom: '30px', border: '2px solid #ff6b6b' }}>
              <h2>Create New MCQ Question</h2>
              
              <form onSubmit={handleCreateMCQ}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <label style={styles.label}>Subject *</label>
                    <select style={styles.input} value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                      <option value="">Select Subject</option>
                      {subjects.map(subject => (
                        <option key={subject._id} value={subject._id}>{subject.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={styles.label}>Topic (Optional)</label>
                    <select style={styles.input} value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)}>
                      <option value="">Select Topic</option>
                      {topics.map(topic => (
                        <option key={topic._id} value={topic._id}>{topic.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={styles.label}>Question *</label>
                  <textarea
                    style={{ ...styles.input, minHeight: '80px', fontFamily: 'Arial' }}
                    value={mcqFormData.question}
                    onChange={handleMCQQuestionChange}
                    placeholder="Enter the MCQ question"
                  />
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={styles.label}>Options (A, B, C, D) *</label>
                  {mcqFormData.options.map((option, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                      <label style={{ minWidth: '30px', fontWeight: 'bold' }}>{String.fromCharCode(65 + idx)}.</label>
                      <input
                        type="text"
                        style={{ ...styles.input, flex: 1 }}
                        value={option.text}
                        onChange={(e) => handleMCQOptionChange(idx, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      />
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={option.isCorrect}
                          onChange={() => handleMCQCorrectAnswerChange(idx)}
                        />
                        Correct
                      </label>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <label style={styles.label}>Difficulty</label>
                    <select
                      style={styles.input}
                      value={mcqFormData.difficulty}
                      onChange={(e) => setMcqFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={styles.label}>Explanation (Optional)</label>
                  <textarea
                    style={{ ...styles.input, minHeight: '60px', fontFamily: 'Arial' }}
                    value={mcqFormData.explanation}
                    onChange={(e) => setMcqFormData(prev => ({ ...prev, explanation: e.target.value }))}
                    placeholder="Explain why this is the correct answer"
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button type="submit" style={styles.button}>Create MCQ</button>
                  <button type="button" style={styles.buttonDanger} onClick={resetMCQForm}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div style={{ ...styles.card, marginBottom: '20px', background: '#f5f5f5' }}>
            <button
              style={styles.button}
              onClick={() => setCreatingExam(!creatingExam)}
            >
              {creatingExam ? 'Cancel' : '+ Create New Exam'}
            </button>
          </div>

          {(creatingExam || editingExamId) && (
            <div style={{ ...styles.card, marginBottom: '30px', border: '2px solid #667eea' }}>
              <h2>{editingExamId ? 'Edit Exam' : 'Create New Exam (10 MCQs)'}</h2>
              
              <form onSubmit={handleCreateExam}>
                <label style={styles.label}>Exam Name</label>
                <input
                  type="text"
                  style={styles.input}
                  value={examFormData.name}
                  onChange={(e) => setExamFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Mid-term Physics Exam"
                />

                <label style={styles.label}>Description</label>
                <textarea
                  style={{ ...styles.input, minHeight: '60px' }}
                  value={examFormData.description}
                  onChange={(e) => setExamFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional exam description"
                />

                <label style={styles.label}>Thumbnail (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setExamThumbnailFile(e.target.files?.[0] || null)}
                  style={styles.input}
                />
                {editingExamId && (
                  <p style={{ marginTop: '-4px', color: '#666', fontSize: '13px' }}>
                    Leave empty to keep the current thumbnail.
                  </p>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={styles.label}>Subject</label>
                    <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} style={styles.input}>
                      <option value="">Select Subject</option>
                      {subjects.map(subject => (
                        <option key={subject._id} value={subject._id}>{subject.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={styles.label}>Topic (Optional)</label>
                    <select value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)} style={styles.input}>
                      <option value="">All Topics</option>
                      {topics.map(topic => (
                        <option key={topic._id} value={topic._id}>{topic.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={styles.label}>Difficulty</label>
                    <select value={examFormData.difficulty} onChange={(e) => setExamFormData(prev => ({ ...prev, difficulty: e.target.value }))} style={styles.input}>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </div>

                  <div>
                    <label style={styles.label}>Duration (minutes)</label>
                    <input type="number" style={styles.input} value={examFormData.duration} onChange={(e) => setExamFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))} />
                  </div>

                  <div>
                    <label style={styles.label}>Passing %</label>
                    <input type="number" style={styles.input} min="0" max="100" value={examFormData.passingPercentage} onChange={(e) => setExamFormData(prev => ({ ...prev, passingPercentage: parseInt(e.target.value) }))} />
                  </div>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <h3>Select Exactly 10 MCQs ({selectedMCQs.size}/10)</h3>
                  <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px', marginBottom: '15px' }}>
                    {availableMCQs.length === 0 && <div style={styles.alertInfo}>No MCQs available. Create MCQs first.</div>}
                    {availableMCQs.map(mcq => (
                      <label key={mcq._id} style={{ display: 'block', marginBottom: '10px', padding: '8px', border: '1px solid #eee', borderRadius: '4px' }}>
                        <input
                          type="checkbox"
                          checked={selectedMCQs.has(mcq._id)}
                          onChange={() => handleToggleMCQSelection(mcq._id)}
                          disabled={!selectedMCQs.has(mcq._id) && selectedMCQs.size >= 10}
                          style={{ marginRight: '8px' }}
                        />
                        <strong>{mcq.question.substring(0, 60)}...</strong>
                        <span style={{ fontSize: '12px', color: '#999', marginLeft: '10px' }}>
                          ({String.fromCharCode(65 + (mcq.options || []).findIndex(opt => opt.isCorrect))})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" style={styles.button}>
                    {editingExamId ? 'Update Exam' : 'Create Exam'}
                  </button>
                  <button type="button" style={styles.buttonDanger} onClick={resetExamForm}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tutor's Exams List */}
          <div style={styles.card}>
            <h2>My Exams</h2>
            {exams.length === 0 && (
              <div style={{ ...styles.card, textAlign: 'center', marginTop: '10px' }}>
                <h3 style={{ marginTop: 0 }}>No exams created yet</h3>
                <p style={{ color: 'rgba(11,31,59,0.7)' }}>Create your first exam to publish a mock test.</p>
                <button type="button" style={styles.button} onClick={() => setCreatingExam(true)}>Create First Exam</button>
              </div>
            )}
            <div style={{ display: 'grid', gap: '15px' }}>
              {exams.map(exam => (
                <div key={exam._id} style={{ ...styles.card, background: '#fafafa', border: '1px solid #ddd' }}>
                  {exam.thumbnailUrl && (
                    <img
                      src={resolveUploadUrl(exam.thumbnailUrl)}
                      alt={`${exam.name} thumbnail`}
                      style={{ width: '100%', height: '170px', objectFit: 'cover', borderRadius: '12px', marginBottom: '12px' }}
                    />
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <h3>{exam.name}</h3>
                      <p>{exam.description}</p>
                      <p><strong>Questions:</strong> {exam.totalQuestions} | <strong>Duration:</strong> {exam.duration}min | <strong>Pass:</strong> {exam.passingPercentage}%</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button style={styles.button} onClick={() => handleEditExam(exam)}>Edit</button>
                      <button style={styles.buttonDanger} onClick={() => handleDeleteExam(exam._id)}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Previously Created MCQs */}
          <div style={styles.card}>
            <h2>Previously Created MCQs</h2>
            {createdMCQs.length === 0 && (
              <div style={{ ...styles.card, textAlign: 'center', marginTop: '10px' }}>
                <h3 style={{ marginTop: 0 }}>No MCQs created yet</h3>
                <p style={{ color: 'rgba(11,31,59,0.7)' }}>Create your first MCQ to start building exam sets.</p>
                <button type="button" style={styles.button} onClick={() => setCreatingMCQ(true)}>Create First MCQ</button>
              </div>
            )}
            <div style={{ display: 'grid', gap: '15px' }}>
              {createdMCQs.map((mcq, idx) => (
                <div key={mcq._id} style={{ ...styles.card, background: '#fafafa', border: '1px solid #ddd' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <h4>Q{idx + 1}: {mcq.question}</h4>
                      <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                        {(mcq.options || []).map((option, optIdx) => (
                          <div key={optIdx} style={{ 
                            padding: '8px', 
                            marginBottom: '5px', 
                            background: option.isCorrect ? '#c8e6c9' : '#f5f5f5',
                            border: `1px solid ${option.isCorrect ? '#81c784' : '#ddd'}`,
                            borderRadius: '4px'
                          }}>
                            <strong>{String.fromCharCode(65 + optIdx)}.</strong> {option.text}
                            {option.isCorrect && <span style={{ color: '#2e7d32', marginLeft: '10px' }}>✓ Correct</span>}
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        <strong>Subject:</strong> {mcq.subject?.name || 'N/A'} | 
                        <strong style={{ marginLeft: '10px' }}>Topic:</strong> {mcq.topic?.name || 'N/A'} | 
                        <strong style={{ marginLeft: '10px' }}>Difficulty:</strong> {mcq.difficulty || 'Medium'}
                      </div>
                      {mcq.explanation && (
                        <div style={{ marginTop: '10px', padding: '10px', background: '#fff3cd', borderRadius: '4px' }}>
                          <strong>Explanation:</strong> {mcq.explanation}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '15px' }}>
                      <button style={styles.button} onClick={() => handleEditMCQ(mcq)}>
                        Edit
                      </button>
                      <button style={styles.buttonDanger} onClick={() => handleDeleteMCQ(mcq._id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STUDENT: BROWSE & ATTEMPT EXAMS */}
      {isStudent && (
        <div>
          {/* Exam Result Display */}
          {examResult && (
            <div style={{ ...styles.card, marginBottom: '20px', background: examResult.isPassed ? '#e8f5e9' : '#ffebee' }}>
              <h2>{examResult.isPassed ? '✓ Passed' : '✗ Failed'}</h2>
              <p><strong>Exam:</strong> {examResult.examName}</p>
              <p><strong>Score:</strong> {examResult.correctAnswers}/{examResult.totalQuestions} ({examResult.scorePercentage}%)</p>
              <p><strong>Required:</strong> {examResult.passingPercentage}%</p>
              <p><strong>Feedback:</strong> {examResult.feedback}</p>
              
              <h3 style={{ marginTop: '20px' }}>Review Answers</h3>
              {(examResult.answers || []).map((answer, idx) => (
                <div
                  key={`${answer.mcq}-${idx}`}
                  style={{
                    border: `1px solid ${answer.isCorrect ? '#c8e6c9' : '#ffcdd2'}`,
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '10px',
                    background: answer.isCorrect ? '#f1f8e9' : '#ffebee'
                  }}
                >
                  <p><strong>Q{idx + 1}:</strong> {answer.question}</p>
                  <p>
                    <strong>Your:</strong> {answer.selectedOption >= 0 ? String.fromCharCode(65 + answer.selectedOption) : 'Not answered'} | 
                    <strong> Correct:</strong> {String.fromCharCode(65 + answer.correctOption)} ✓
                  </p>
                  {answer.explanation && <p><strong>Why:</strong> {answer.explanation}</p>}
                </div>
              ))}
              
              <button style={styles.button} onClick={() => setExamResult(null)}>Back to Exams</button>
            </div>
          )}

          {/* Exam Questions Display (In Progress) */}
          {examQuestions.length > 0 && !examResult && (
            <div style={{ ...styles.card, marginBottom: '20px' }}>
              <h2>{selectedExamForAttempt?.name}</h2>
              <p>Time: {selectedExamForAttempt?.duration} minutes | Questions: {examQuestions.length}</p>
              
              {examQuestions.map((question, qIdx) => (
                <div key={question._id} style={{ ...styles.card, marginBottom: '15px', background: '#fafafa' }}>
                  <h3>{qIdx + 1}. {question.question}</h3>
                  <div style={{ marginTop: '10px' }}>
                    {(question.options || []).map((option, optIdx) => (
                      <label key={`${question._id}-${optIdx}`} style={{ display: 'block', marginBottom: '10px' }}>
                        <input
                          type="radio"
                          name={`answer-${question._id}`}
                          checked={examAnswers[question._id] === optIdx}
                          onChange={() => handleSelectExamAnswer(question._id, optIdx)}
                          style={{ marginRight: '8px' }}
                        />
                        {String.fromCharCode(65 + optIdx)}. {option.text}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              
              <button style={styles.button} onClick={handleSubmitExamAttempt} disabled={submittingExam}>
                {submittingExam ? 'Submitting...' : 'Submit Exam'}
              </button>
            </div>
          )}

          {/* Available Exams List */}
          {examQuestions.length === 0 && !examResult && (
            <div>
              <div style={styles.card}>
                <h2>Available Exams</h2>
                {studentExams.length === 0 && (
                  <div style={{ ...styles.card, textAlign: 'center', marginTop: '10px' }}>
                    <h3 style={{ marginTop: 0 }}>No exams available yet</h3>
                    <p style={{ color: 'rgba(11,31,59,0.7)' }}>Your tutor has not published exams yet. Check back soon.</p>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
                  {studentExams.map(exam => (
                    <div key={exam._id} style={{ ...styles.card, background: '#fafafa', border: '1px solid #ddd' }}>
                      {exam.thumbnailUrl && (
                        <img
                          src={resolveUploadUrl(exam.thumbnailUrl)}
                          alt={`${exam.name} thumbnail`}
                          style={{ width: '100%', height: '170px', objectFit: 'cover', borderRadius: '12px', marginBottom: '12px' }}
                        />
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <h3>{exam.name}</h3>
                          <p>{exam.description}</p>
                          <p><strong>By:</strong> {exam.createdBy?.name} | <strong>Questions:</strong> {exam.totalQuestions} | <strong>Duration:</strong> {exam.duration}min | <strong>Pass:</strong> {exam.passingPercentage}%</p>
                        </div>
                        <button style={{ ...styles.button, alignSelf: 'flex-start' }} onClick={() => handleStartExamAttempt(exam)}>
                          Start Exam
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Previous Attempts */}
              <div style={{ ...styles.card, marginTop: '20px' }}>
                <h2>Previous Attempts</h2>
                {examAttemptHistory.length === 0 && (
                  <div style={{ ...styles.card, textAlign: 'center', marginTop: '10px' }}>
                    <h3 style={{ marginTop: 0 }}>No attempts yet</h3>
                    <p style={{ color: 'rgba(11,31,59,0.7)' }}>Start an exam to see your score history here.</p>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
                  {(examAttemptHistory || []).map(attempt => (
                    <div key={attempt._id} style={{ ...styles.card, background: '#fafafa', border: '1px solid #ddd', marginBottom: 0 }}>
                      <p><strong>Exam:</strong> {attempt.exam?.name || 'N/A'}</p>
                      <p><strong>Date:</strong> {new Date(attempt.attemptedAt).toLocaleString()}</p>
                      <p><strong>Score:</strong> {attempt.correctAnswers}/{attempt.totalQuestions} ({attempt.scorePercentage}%) - {attempt.isPassed ? '✓ Passed' : '✗ Failed'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!isStudent && !isTutor && (
        <div style={styles.alertWarning}>
          Your role does not have MCQ exam access.
        </div>
      )}
    </div>
  );
};

export default MCQ;
