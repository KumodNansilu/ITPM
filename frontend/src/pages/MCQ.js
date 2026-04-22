import React, { useCallback, useContext, useEffect, useState } from 'react';
import { examService, mcqService, subjectService } from '../services/api';
import styles from '../styles/inlineStyles';
import { AuthContext } from '../context/AuthContext';
import { showError, showInfo, showSuccess, confirmDialog } from '../utils/alerts';
import { FaArrowDown, FaArrowUp, FaChartBar, FaChartLine, FaChartPie, FaCheckCircle, FaClipboardList, FaDownload, FaLayerGroup, FaMinus, FaUsers } from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const [currentExamQuestionIndex, setCurrentExamQuestionIndex] = useState(0);
  const [examTimeLeftSeconds, setExamTimeLeftSeconds] = useState(0);
  const [showExamInstructions, setShowExamInstructions] = useState(false);
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const [examAttemptHistory, setExamAttemptHistory] = useState([]);
  const [performanceVisible, setPerformanceVisible] = useState(false);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [tutorPerformance, setTutorPerformance] = useState({
    summary: null,
    students: [],
    attempts: [],
    subjectBreakdown: [],
    topicBreakdown: [],
    bestAttempt: null,
    lowestAttempt: null
  });
  const [performanceSubjectId, setPerformanceSubjectId] = useState('');
  const [performanceTopicId, setPerformanceTopicId] = useState('');
  const [performanceTopics, setPerformanceTopics] = useState([]);
  const [selectedPerformanceStudentId, setSelectedPerformanceStudentId] = useState('');
  
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

  const fetchSubjects = useCallback(async () => {
    try {
      const response = await subjectService.getAllSubjects();
      setSubjects(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch subjects');
    }
  }, []);

  const fetchTopics = useCallback(async (subjectId) => {
    try {
      const response = await subjectService.getTopicsBySubject(subjectId);
      setTopics(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch topics');
    }
  }, []);

  const fetchAvailableMCQs = useCallback(async () => {
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
  }, [selectedSubject, selectedTopic]);

  const fetchCreatedMCQs = useCallback(async () => {
    try {
      const response = await mcqService.getAllMCQs({ mine: 'true' });
      setCreatedMCQs(response.data || []);
    } catch (error) {
      setCreatedMCQs([]);
    }
  }, []);

  const fetchExams = useCallback(async () => {
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
  }, [isStudent, isTutor]);

  const fetchStudentExams = useCallback(async () => {
    try {
      const response = await examService.getAllExams({ isPublished: 'true' });
      setStudentExams(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch exams');
    }
  }, []);

  const fetchExamAttemptHistory = useCallback(async () => {
    try {
      const response = await examService.getMyExamAttempts();
      setExamAttemptHistory(response.data || []);
    } catch (error) {
      setExamAttemptHistory([]);
    }
  }, []);

  const fetchTutorPerformance = useCallback(async () => {
    try {
      setPerformanceLoading(true);
      const params = {};
      if (performanceSubjectId) params.subjectId = performanceSubjectId;
      if (performanceTopicId) params.topicId = performanceTopicId;

      const response = await mcqService.getTutorPerformance(params);
      const nextPerformance = response.data || {
        summary: null,
        students: [],
        attempts: [],
        subjectBreakdown: [],
        topicBreakdown: [],
        bestAttempt: null,
        lowestAttempt: null
      };

      setTutorPerformance(nextPerformance);

      if (!selectedPerformanceStudentId && nextPerformance.students?.length) {
        setSelectedPerformanceStudentId(nextPerformance.students[0].studentId);
      }
    } catch (error) {
      setTutorPerformance({
        summary: null,
        students: [],
        attempts: [],
        subjectBreakdown: [],
        topicBreakdown: [],
        bestAttempt: null,
        lowestAttempt: null
      });
      toast.error(error.response?.data?.message || 'Failed to load student performance');
    } finally {
      setPerformanceLoading(false);
    }
  }, [performanceSubjectId, performanceTopicId, selectedPerformanceStudentId]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  useEffect(() => {
    if (selectedSubject) {
      fetchTopics(selectedSubject);
    } else {
      setTopics([]);
      setSelectedTopic('');
    }
  }, [fetchTopics, selectedSubject]);

  useEffect(() => {
    if (!performanceSubjectId) {
      setPerformanceTopics([]);
      setPerformanceTopicId('');
      return;
    }

    const fetchPerformanceTopics = async () => {
      try {
        const response = await subjectService.getTopicsBySubject(performanceSubjectId);
        setPerformanceTopics(response.data || []);
      } catch (error) {
        setPerformanceTopics([]);
      }
    };

    fetchPerformanceTopics();
  }, [performanceSubjectId]);

  useEffect(() => {
    if (isTutor) {
      fetchTutorPerformance();
    }
  }, [fetchTutorPerformance, isTutor, performanceSubjectId, performanceTopicId]);

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
  }, [fetchAvailableMCQs, fetchCreatedMCQs, fetchExams, fetchExamAttemptHistory, fetchStudentExams, isStudent, isTutor, creatingExam, editingExamId, selectedSubject, selectedTopic]);

  const handleDownloadPerformanceReport = () => {
    const summary = tutorPerformance.summary || {};
    const reportDate = new Date();
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

    // Header template
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, 595, 82, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('MCQ Performance Report', 40, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Generated: ${reportDate.toLocaleString()}`, 40, 62);

    const summaryData = [
      { label: 'Average Class Score', value: `${summary.averageScore || 0}%` },
      { label: 'Highest Score', value: `${summary.highestScore || 0}%` },
      { label: 'Lowest Score', value: `${summary.lowestScore || 0}%` },
      { label: 'Total Students', value: `${summary.totalStudents || 0}` },
      { label: 'Total Attempts', value: `${summary.totalAttempts || 0}` }
    ];

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Summary', 40, 108);

    autoTable(doc, {
      startY: 118,
      margin: { left: 40, right: 40 },
      head: [['Metric', 'Value']],
      body: summaryData.map((row) => [row.label, row.value]),
      styles: {
        font: 'helvetica',
        fontSize: 10,
        textColor: [30, 41, 59],
        cellPadding: 8
      },
      headStyles: {
        fillColor: [15, 118, 110],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      }
    });

    const students = tutorPerformance.students || [];
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Student Breakdown', 40, (doc.lastAutoTable?.finalY || 260) + 26);

    autoTable(doc, {
      startY: (doc.lastAutoTable?.finalY || 260) + 36,
      margin: { left: 40, right: 40 },
      head: [['Student', 'Attempts', 'Average', 'Highest', 'Lowest', 'Latest']],
      body: students.length > 0
        ? students.map((student) => [
          student.studentName || 'Student',
          String(student.attemptsCount || 0),
          `${student.averageScore || 0}%`,
          `${student.highestScore || 0}%`,
          `${student.lowestScore || 0}%`,
          `${student.latestScore || 0}%`
        ])
        : [['No student attempts available', '-', '-', '-', '-', '-']],
      styles: {
        font: 'helvetica',
        fontSize: 9,
        textColor: [30, 41, 59],
        cellPadding: 7
      },
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      didDrawPage: () => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text('ITPM Study Support System - MCQ Analytics', 40, 820);
      }
    });

    doc.save(`mcq-performance-report-${reportDate.toISOString().slice(0, 10)}.pdf`);
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
      setCurrentExamQuestionIndex(0);
      setExamTimeLeftSeconds((Number(exam?.duration) || 30) * 60);
      setShowExamInstructions(true);
      setShowSubmitConfirmation(false);
      toast.success(`Exam started: ${exam.name}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start exam');
    }
  };

  const handleSelectExamAnswer = (mcqId, optionIndex) => {
    setExamAnswers(prev => ({ ...prev, [mcqId]: optionIndex }));
  };

  const handleGoToExamQuestion = (index) => {
    if (index < 0 || index >= examQuestions.length) return;
    setCurrentExamQuestionIndex(index);
  };

  const handlePreviousExamQuestion = () => {
    setCurrentExamQuestionIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextExamQuestion = () => {
    setCurrentExamQuestionIndex((prev) => Math.min(examQuestions.length - 1, prev + 1));
  };

  const handleSubmitExamClick = async () => {
    const confirmed = await confirmDialog({
      title: 'Submit exam?',
      text: 'Are you sure you want to submit your exam now?',
      icon: 'warning',
      confirmButtonText: 'Yes, submit'
    });

    if (!confirmed) return;
    await handleSubmitExamAttempt();
  };

  const handleSubmitExamAttempt = useCallback(async () => {
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
      setExamTimeLeftSeconds(0);
      setShowExamInstructions(false);
      setShowSubmitConfirmation(false);
      fetchExamAttemptHistory();
      toast.success('Exam submitted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit exam');
    } finally {
      setSubmittingExam(false);
    }
  }, [examAnswers, examQuestions, fetchExamAttemptHistory, selectedExamForAttempt]);

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

  const formatExamTimer = (seconds) => {
    const total = Math.max(0, Number(seconds) || 0);
    const minutes = Math.floor(total / 60);
    const remainingSeconds = total % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (examQuestions.length === 0 || examResult || submittingExam) return;
    if (examTimeLeftSeconds <= 0) {
      toast.info('Time is up. Submitting your exam automatically.');
      handleSubmitExamAttempt();
      return;
    }

    const timerId = window.setTimeout(() => {
      setExamTimeLeftSeconds((previousSeconds) => Math.max(0, previousSeconds - 1));
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [examQuestions.length, examResult, submittingExam, examTimeLeftSeconds, handleSubmitExamAttempt]);

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
  const tutorStudents = tutorPerformance.students || [];
  const tutorAttempts = tutorPerformance.attempts || [];
  const selectedPerformanceStudent = tutorStudents.find((student) => String(student.studentId) === String(selectedPerformanceStudentId)) || null;
  const visiblePerformanceAttempts = selectedPerformanceStudent?.attempts || tutorAttempts;
  const visiblePerformanceAttemptsChronological = [...visiblePerformanceAttempts].sort((left, right) => new Date(left.attemptedAt) - new Date(right.attemptedAt));
  const visiblePerformanceLineSeries = visiblePerformanceAttemptsChronological.map((attempt, index) => ({
    index: index + 1,
    label: new Date(attempt.attemptedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    score: Number(attempt.scorePercentage) || 0,
    correct: Number(attempt.correctAnswers) || 0,
    wrong: Number(attempt.wrongAnswers) || 0,
    examName: attempt.exam?.name || 'Exam',
    subjectName: attempt.subject?.name || attempt.exam?.subject?.name || 'Subject',
    topicName: attempt.topic?.name || attempt.exam?.topic?.name || 'General'
  }));
  const visiblePerformanceMaxScore = Math.max(100, ...visiblePerformanceLineSeries.map((entry) => entry.score), 10);
  const visiblePerformancePoints = visiblePerformanceLineSeries.map((entry, index) => {
    const x = visiblePerformanceLineSeries.length === 1 ? 50 : 10 + (index * 80) / (visiblePerformanceLineSeries.length - 1);
    const y = 180 - (entry.score / visiblePerformanceMaxScore) * 140;
    return { x, y, ...entry };
  });
  const visiblePerformancePath = visiblePerformancePoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const visibleCorrectTotal = visiblePerformanceAttemptsChronological.reduce((sum, attempt) => sum + (Number(attempt.correctAnswers) || 0), 0);
  const visibleWrongTotal = visiblePerformanceAttemptsChronological.reduce((sum, attempt) => sum + (Number(attempt.wrongAnswers) || 0), 0);
  const visibleTotalAnswers = visibleCorrectTotal + visibleWrongTotal || 1;
  const visibleCorrectPercent = (visibleCorrectTotal / visibleTotalAnswers) * 100;
  const summaryAverage = tutorPerformance.summary?.averageScore || 0;
  const summaryHighest = tutorPerformance.summary?.highestScore || 0;
  const summaryLowest = tutorPerformance.summary?.lowestScore || 0;
  const summaryTotalAttempts = tutorPerformance.summary?.totalAttempts || 0;
  const summaryTotalStudents = tutorPerformance.summary?.totalStudents || 0;
  const answeredExamCount = examQuestions.filter((question) => Number.isInteger(examAnswers[question._id]) && examAnswers[question._id] >= 0).length;
  const examProgressPercentage = examQuestions.length > 0 ? Math.round((answeredExamCount / examQuestions.length) * 100) : 0;
  const currentExamQuestion = examQuestions[currentExamQuestionIndex] || null;

  const getExamResultFeedback = (percentage) => {
    if (percentage >= 80) return 'Excellent work';
    if (percentage >= 60) return 'Good job';
    return 'Needs improvement';
  };

  const getExamResultColor = (percentage) => {
    if (percentage >= 80) return '#16a34a';
    if (percentage >= 60) return '#ca8a04';
    return '#dc2626';
  };

  return (
    <div style={{ ...styles.container, marginTop: '30px' }}>
      <style>
        {`@keyframes mcqHeaderFloat {
          0%, 100% {
            transform: translateY(0px);
            box-shadow: 0 12px 24px rgba(2,6,23,0.3);
          }
          50% {
            transform: translateY(-6px);
            box-shadow: 0 18px 30px rgba(2,6,23,0.4);
          }
        }

        @keyframes mcqImagePulse {
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
            <h1 style={{ margin: 0, marginBottom: '6px' }}>MCQ Mock Exams</h1>
            <p style={{ margin: 0, opacity: 0.9 }}>
              {isTutor ? 'Create question banks and publish exams with confidence.' : 'Practice timed exams and improve your score with feedback.'}
            </p>
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
              animation: 'mcqHeaderFloat 5s ease-in-out infinite'
            }}
          >
            <img
              src="/image/MCQ.jpeg"
              alt="MCQ mock exams"
              style={{ width: '168px', height: '89px', objectFit: 'cover', borderRadius: '10px', display: 'block', animation: 'mcqImagePulse 5s ease-in-out infinite' }}
            />
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '18px' }}>
        <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}><FaClipboardList /> Exams: <strong>{totalExamsForView}</strong></div>
        <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}><FaLayerGroup /> MCQs: <strong>{totalMCQsCreated}</strong></div>
        <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}><FaChartLine /> Attempts: <strong>{totalAttempts}</strong></div>
        {isTutor && (
          <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div><FaUsers /> Student Performance</div>
            <button type="button" style={styles.button} onClick={() => setPerformanceVisible((visible) => !visible)}>
              {performanceVisible ? 'Hide analytics' : 'View analytics'}
            </button>
          </div>
        )}
      </div>
      <h1 style={{ marginBottom: '30px' }}>MCQ Mock Exams</h1>

      {isTutor && performanceVisible && (
        <div style={{ ...styles.card, marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ marginTop: 0, marginBottom: '6px' }}>Student MCQ Performance Monitoring</h2>
              <p style={{ marginTop: 0, color: 'rgba(11,31,59,0.72)' }}>
                View student scores, track progress over time, and analyze subject/topic strengths and weaknesses.
              </p>
            </div>
            <button type="button" style={styles.button} onClick={handleDownloadPerformanceReport}>
              <FaDownload /> Download PDF Report
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}>
              <div style={{ fontSize: '12px', color: 'rgba(11,31,59,0.65)', marginBottom: '6px' }}>Average class score</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#0b1f3b' }}>{summaryAverage}%</div>
            </div>
            <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}>
              <div style={{ fontSize: '12px', color: 'rgba(11,31,59,0.65)', marginBottom: '6px' }}>Highest score</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#166534' }}>{summaryHighest}%</div>
            </div>
            <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}>
              <div style={{ fontSize: '12px', color: 'rgba(11,31,59,0.65)', marginBottom: '6px' }}>Lowest score</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#be123c' }}>{summaryLowest}%</div>
            </div>
            <div style={{ ...styles.card, marginBottom: 0, padding: '14px 16px' }}>
              <div style={{ fontSize: '12px', color: 'rgba(11,31,59,0.65)', marginBottom: '6px' }}>Students / attempts</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#0b1f3b' }}>{summaryTotalStudents} / {summaryTotalAttempts}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', gap: '18px', alignItems: 'start' }}>
            <aside style={{ ...styles.card, marginBottom: 0 }}>
              <h3 style={{ marginTop: 0 }}>Filters</h3>
              <label style={styles.label}>Subject</label>
              <select value={performanceSubjectId} onChange={(e) => setPerformanceSubjectId(e.target.value)} style={styles.input}>
                <option value="">All subjects</option>
                {subjects.map((subject) => (
                  <option key={subject._id} value={subject._id}>{subject.name}</option>
                ))}
              </select>

              <label style={styles.label}>Topic</label>
              <select value={performanceTopicId} onChange={(e) => setPerformanceTopicId(e.target.value)} style={styles.input} disabled={!performanceSubjectId}>
                <option value="">All topics</option>
                {performanceTopics.map((topic) => (
                  <option key={topic._id} value={topic._id}>{topic.name}</option>
                ))}
              </select>

              <label style={styles.label}>Student</label>
              <select value={selectedPerformanceStudentId} onChange={(e) => setSelectedPerformanceStudentId(e.target.value)} style={styles.input}>
                <option value="">All students</option>
                {tutorStudents.map((student) => (
                  <option key={student.studentId} value={student.studentId}>{student.studentName} ({student.averageScore}%)</option>
                ))}
              </select>

              <button type="button" style={styles.button} onClick={fetchTutorPerformance} disabled={performanceLoading}>
                {performanceLoading ? 'Refreshing...' : 'Refresh data'}
              </button>

              <div style={{ marginTop: '14px', padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 800, marginBottom: '4px' }}>Best performer</div>
                <div>{tutorPerformance.students?.[0]?.studentName || 'N/A'}</div>
                <div style={{ color: '#475569', fontSize: '13px' }}>{tutorPerformance.students?.[0] ? `${tutorPerformance.students[0].averageScore}% average` : 'No attempts yet'}</div>
              </div>
              <div style={{ marginTop: '12px', padding: '12px', borderRadius: '12px', background: '#fff7ed', border: '1px solid #fed7aa' }}>
                <div style={{ fontWeight: 800, marginBottom: '4px' }}>Needs attention</div>
                <div>{tutorPerformance.students?.at(-1)?.studentName || 'N/A'}</div>
                <div style={{ color: '#475569', fontSize: '13px' }}>{tutorPerformance.students?.at(-1) ? `${tutorPerformance.students.at(-1).averageScore}% average` : 'No attempts yet'}</div>
              </div>
            </aside>

            <section style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div style={{ ...styles.card, marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0 }}>Line chart</h3>
                    <FaChartLine />
                  </div>
                  {visiblePerformancePoints.length === 0 ? (
                    <div style={styles.alertInfo}>No performance data yet.</div>
                  ) : (
                    <svg viewBox="0 0 100 220" style={{ width: '100%', height: '220px', display: 'block' }}>
                      <line x1="10" y1="20" x2="10" y2="180" stroke="#cbd5e1" strokeWidth="1" />
                      <line x1="10" y1="180" x2="90" y2="180" stroke="#cbd5e1" strokeWidth="1" />
                      {[0, 25, 50, 75, 100].map((tick) => (
                        <g key={tick}>
                          <line x1="10" y1={180 - (tick / 100) * 140} x2="90" y2={180 - (tick / 100) * 140} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2 2" />
                          <text x="2" y={184 - (tick / 100) * 140} fill="#64748b" fontSize="6">{tick}%</text>
                        </g>
                      ))}
                      {visiblePerformancePath && <path d={visiblePerformancePath} fill="none" stroke="#1e3a8a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
                      {visiblePerformancePoints.map((point) => (
                        <g key={`${point.index}-${point.label}`}>
                          <circle cx={point.x} cy={point.y} r="2.8" fill="#0b1f3b" />
                          <text x={point.x} y="196" fill="#64748b" fontSize="6" textAnchor="middle">{point.label}</text>
                        </g>
                      ))}
                    </svg>
                  )}
                </div>

                <div style={{ ...styles.card, marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0 }}>Bar chart</h3>
                    <FaChartBar />
                  </div>
                  {tutorStudents.length === 0 ? (
                    <div style={styles.alertInfo}>No student scores yet.</div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', minHeight: '220px', paddingTop: '8px' }}>
                      {tutorStudents.slice(0, 8).map((student) => {
                        const height = Math.max(18, (Number(student.averageScore) / 100) * 160);
                        return (
                          <div key={student.studentId} style={{ flex: 1, minWidth: '34px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 800, color: '#0b1f3b' }}>{student.averageScore}%</div>
                            <div style={{ width: '100%', maxWidth: '46px', height: '170px', display: 'flex', alignItems: 'flex-end', background: '#eff6ff', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(30,64,175,0.12)' }}>
                              <div style={{ width: '100%', height: `${height}px`, background: 'linear-gradient(180deg, #60a5fa 0%, #1e3a8a 100%)', borderRadius: '12px 12px 0 0' }} />
                            </div>
                            <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'center' }}>{student.studentName}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div style={{ ...styles.card, marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0 }}>Pie chart</h3>
                    <FaChartPie />
                  </div>
                  {visiblePerformanceAttemptsChronological.length === 0 ? (
                    <div style={styles.alertInfo}>No attempt history selected.</div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px 0 18px 0' }}>
                        <div style={{ width: '190px', height: '190px', borderRadius: '50%', background: `conic-gradient(#16a34a 0 ${visibleCorrectPercent}%, #ef4444 ${visibleCorrectPercent}% 100%)`, position: 'relative', boxShadow: 'inset 0 0 0 8px rgba(255,255,255,0.75)' }}>
                          <div style={{ position: 'absolute', inset: '34px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center', boxShadow: '0 10px 22px rgba(2,6,23,0.10)' }}>
                            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0b1f3b' }}>{Math.round(visibleCorrectPercent)}%</div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>Correct</div>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', color: '#0b1f3b' }}>
                          <span>Correct answers</span>
                          <strong>{visibleCorrectTotal}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', color: '#0b1f3b' }}>
                          <span>Incorrect answers</span>
                          <strong>{visibleWrongTotal}</strong>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <div style={{ ...styles.card, marginBottom: 0, padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(11,31,59,0.65)', marginBottom: '6px' }}>Strongest subject</div>
                  <div style={{ fontWeight: 800, color: '#0b1f3b' }}>{tutorPerformance.subjectBreakdown?.[0]?.subjectName || 'N/A'}</div>
                  <div style={{ color: '#475569', marginTop: '6px' }}>Avg {tutorPerformance.subjectBreakdown?.[0]?.averageScore || 0}%</div>
                </div>
                <div style={{ ...styles.card, marginBottom: 0, padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(11,31,59,0.65)', marginBottom: '6px' }}>Weakest subject</div>
                  <div style={{ fontWeight: 800, color: '#0b1f3b' }}>{tutorPerformance.subjectBreakdown?.at(-1)?.subjectName || 'N/A'}</div>
                  <div style={{ color: '#475569', marginTop: '6px' }}>Avg {tutorPerformance.subjectBreakdown?.at(-1)?.averageScore || 0}%</div>
                </div>
                <div style={{ ...styles.card, marginBottom: 0, padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(11,31,59,0.65)', marginBottom: '6px' }}>Strongest topic</div>
                  <div style={{ fontWeight: 800, color: '#0b1f3b' }}>{tutorPerformance.topicBreakdown?.[0]?.topicName || 'N/A'}</div>
                  <div style={{ color: '#475569', marginTop: '6px' }}>Avg {tutorPerformance.topicBreakdown?.[0]?.averageScore || 0}%</div>
                </div>
                <div style={{ ...styles.card, marginBottom: 0, padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(11,31,59,0.65)', marginBottom: '6px' }}>Weakest topic</div>
                  <div style={{ fontWeight: 800, color: '#0b1f3b' }}>{tutorPerformance.topicBreakdown?.at(-1)?.topicName || 'N/A'}</div>
                  <div style={{ color: '#475569', marginTop: '6px' }}>Avg {tutorPerformance.topicBreakdown?.at(-1)?.averageScore || 0}%</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <div style={{ ...styles.card, marginBottom: 0, padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(11,31,59,0.65)', marginBottom: '6px' }}>Best score</div>
                  <div style={{ fontWeight: 800, color: '#0b1f3b' }}>{tutorPerformance.bestAttempt?.student?.name || 'N/A'}</div>
                  <div style={{ color: '#475569', marginTop: '6px' }}>{tutorPerformance.bestAttempt ? `${tutorPerformance.bestAttempt.scorePercentage}% on ${tutorPerformance.bestAttempt.exam?.name || 'Exam'}` : 'No attempts yet'}</div>
                </div>
                <div style={{ ...styles.card, marginBottom: 0, padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(11,31,59,0.65)', marginBottom: '6px' }}>Lowest score</div>
                  <div style={{ fontWeight: 800, color: '#0b1f3b' }}>{tutorPerformance.lowestAttempt?.student?.name || 'N/A'}</div>
                  <div style={{ color: '#475569', marginTop: '6px' }}>{tutorPerformance.lowestAttempt ? `${tutorPerformance.lowestAttempt.scorePercentage}% on ${tutorPerformance.lowestAttempt.exam?.name || 'Exam'}` : 'No attempts yet'}</div>
                </div>
                <div style={{ ...styles.card, marginBottom: 0, padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(11,31,59,0.65)', marginBottom: '6px' }}>Selected student trend</div>
                  <div style={{ fontWeight: 800, color: '#0b1f3b' }}>{selectedPerformanceStudent?.studentName || 'All students'}</div>
                  <div style={{ color: selectedPerformanceStudent?.scoreDelta > 0 ? '#166534' : selectedPerformanceStudent?.scoreDelta < 0 ? '#be123c' : '#475569', marginTop: '6px' }}>
                    {selectedPerformanceStudent ? `${selectedPerformanceStudent.scoreDelta > 0 ? '+' : ''}${selectedPerformanceStudent.scoreDelta || 0}% from previous attempt` : 'Select a student to compare attempts'}
                  </div>
                </div>
                <div style={{ ...styles.card, marginBottom: 0, padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(11,31,59,0.65)', marginBottom: '6px' }}>Selected score</div>
                  <div style={{ fontWeight: 800, color: '#0b1f3b' }}>{selectedPerformanceStudent ? `${selectedPerformanceStudent.latestScore}%` : `${summaryAverage}%`}</div>
                  <div style={{ color: '#475569', marginTop: '6px' }}>{selectedPerformanceStudent ? `${selectedPerformanceStudent.attemptsCount} attempts` : 'Class average shown'}</div>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: '#475569' }}>
                      <th style={{ padding: '10px' }}>Student</th>
                      <th style={{ padding: '10px' }}>Attempts</th>
                      <th style={{ padding: '10px' }}>Avg score</th>
                      <th style={{ padding: '10px' }}>Highest</th>
                      <th style={{ padding: '10px' }}>Lowest</th>
                      <th style={{ padding: '10px' }}>Latest</th>
                      <th style={{ padding: '10px' }}>Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tutorStudents.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>No student attempts found.</td>
                      </tr>
                    )}
                    {tutorStudents.map((student) => (
                      <tr key={student.studentId} style={{ background: selectedPerformanceStudentId === student.studentId ? '#eff6ff' : '#fafafa' }}>
                        <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>{student.studentName}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>{student.attemptsCount}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb', fontWeight: 800 }}>{student.averageScore}%</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>{student.highestScore}%</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>{student.lowestScore}%</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>{student.latestScore}%</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>
                          <button type="button" style={styles.button} onClick={() => setSelectedPerformanceStudentId(student.studentId)}>
                            {student.scoreDelta > 0 ? <FaArrowUp /> : student.scoreDelta < 0 ? <FaArrowDown /> : <FaMinus />} {student.scoreDelta === null ? 'First' : `${student.scoreDelta > 0 ? '+' : ''}${student.scoreDelta}%`}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ overflowX: 'auto', marginTop: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: '#475569' }}>
                      <th style={{ padding: '10px' }}>Date</th>
                      <th style={{ padding: '10px' }}>Exam</th>
                      <th style={{ padding: '10px' }}>Student</th>
                      <th style={{ padding: '10px' }}>Subject</th>
                      <th style={{ padding: '10px' }}>Topic</th>
                      <th style={{ padding: '10px' }}>Score</th>
                      <th style={{ padding: '10px' }}>Correct / Wrong</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visiblePerformanceAttemptsChronological.slice().reverse().map((attempt) => (
                      <tr key={attempt._id} style={{ background: '#fafafa' }}>
                        <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>{new Date(attempt.attemptedAt).toLocaleString()}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>{attempt.exam?.name || 'Exam'}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>{attempt.student?.name || 'Student'}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>{attempt.subject?.name || attempt.exam?.subject?.name || 'N/A'}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>{attempt.topic?.name || attempt.exam?.topic?.name || 'General'}</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb', fontWeight: 800 }}>{attempt.scorePercentage}%</td>
                        <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>{attempt.correctAnswers} / {attempt.wrongAnswers}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      )}

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
            <div style={{ ...styles.card, marginBottom: '20px', background: examResult.isPassed ? '#f0fdf4' : '#fef2f2', border: `2px solid ${examResult.isPassed ? '#16a34a' : '#dc2626'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ marginTop: 0, marginBottom: '6px' }}>{examResult.isPassed ? '✓ Passed' : '✗ Failed'}</h2>
                  <p style={{ margin: 0, color: '#475569' }}><strong>Exam:</strong> {examResult.examName}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', color: '#475569' }}>Score</div>
                  <div style={{ fontSize: '34px', fontWeight: 800, color: getExamResultColor(Number(examResult.scorePercentage) || 0) }}>
                    {examResult.correctAnswers}/{examResult.totalQuestions}
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: getExamResultColor(Number(examResult.scorePercentage) || 0) }}>
                    {examResult.scorePercentage}%
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '14px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#475569' }}>
                  <span>Result progress</span>
                  <strong>{examResult.scorePercentage}%</strong>
                </div>
                <div style={{ width: '100%', height: '10px', borderRadius: '999px', background: '#e2e8f0', overflow: 'hidden' }}>
                  <div style={{ width: `${examResult.scorePercentage}%`, height: '100%', background: getExamResultColor(Number(examResult.scorePercentage) || 0) }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                <div style={{ ...styles.card, marginBottom: 0, background: 'white' }}><strong>Required:</strong> {examResult.passingPercentage}%</div>
                <div style={{ ...styles.card, marginBottom: 0, background: 'white' }}><strong>Correct:</strong> {examResult.correctAnswers}</div>
                <div style={{ ...styles.card, marginBottom: 0, background: 'white' }}><strong>Wrong:</strong> {examResult.totalQuestions - examResult.correctAnswers}</div>
              </div>

              <p style={{ fontSize: '18px', fontWeight: 700, color: getExamResultColor(Number(examResult.scorePercentage) || 0) }}>
                {examResult.feedback || getExamResultFeedback(Number(examResult.scorePercentage) || 0)}
              </p>
              
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
            <div style={{ ...styles.card, marginBottom: '20px', paddingBottom: '92px', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
                <div>
                  <h2 style={{ marginTop: 0, marginBottom: '8px' }}>{selectedExamForAttempt?.name}</h2>
                  <p style={{ margin: 0, color: '#475569' }}>Time: {selectedExamForAttempt?.duration} minutes | Questions: {examQuestions.length}</p>
                  <div style={{ marginTop: '10px' }}>
                    <span
                      style={{
                        ...styles.badge,
                        ...(examTimeLeftSeconds <= 60 ? styles.badgeDanger : examTimeLeftSeconds <= 300 ? styles.badgeWarning : styles.badgePrimary),
                        fontSize: '14px',
                        padding: '6px 12px'
                      }}
                    >
                      Time Left: {formatExamTimer(examTimeLeftSeconds)}
                    </span>
                  </div>
                </div>
                <div style={{ minWidth: '220px', flex: '0 0 260px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#475569' }}>
                    <span>Answered {answeredExamCount} / {examQuestions.length}</span>
                    <strong>{examProgressPercentage}%</strong>
                  </div>
                  <div style={{ width: '100%', height: '10px', borderRadius: '999px', background: '#e2e8f0', overflow: 'hidden' }}>
                    <div style={{ width: `${examProgressPercentage}%`, height: '100%', background: '#1e3a8a' }} />
                  </div>
                </div>
              </div>

              <div style={{ ...styles.card, marginBottom: '14px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowExamInstructions(true);
                      setShowSubmitConfirmation(false);
                    }}
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '999px',
                      border: showExamInstructions ? '2px solid #1e3a8a' : '1px solid #cbd5e1',
                      background: showExamInstructions ? '#1e3a8a' : '#ffffff',
                      color: showExamInstructions ? '#ffffff' : '#0f172a',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                    title="Exam Instructions"
                  >
                    I
                  </button>

                  {examQuestions.map((question, index) => {
                    const isAnswered = Number.isInteger(examAnswers[question._id]) && examAnswers[question._id] >= 0;
                    const isActive = !showExamInstructions && !showSubmitConfirmation && index === currentExamQuestionIndex;

                    return (
                      <button
                        key={`step-${question._id}`}
                        type="button"
                        onClick={() => {
                          handleGoToExamQuestion(index);
                          setShowExamInstructions(false);
                          setShowSubmitConfirmation(false);
                        }}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '999px',
                          border: isActive ? '2px solid #0b3d91' : '1px solid #cbd5e1',
                          background: isAnswered ? '#16a34a' : '#ffffff',
                          color: isAnswered ? '#ffffff' : '#0f172a',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          boxShadow: isActive ? '0 6px 14px rgba(15,23,42,0.12)' : 'none'
                        }}
                        title={`Question ${index + 1}`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => {
                      setShowExamInstructions(false);
                      setShowSubmitConfirmation(true);
                    }}
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '999px',
                      border: showSubmitConfirmation ? '2px solid #0f766e' : '1px solid #cbd5e1',
                      background: showSubmitConfirmation ? '#0f766e' : '#ffffff',
                      color: showSubmitConfirmation ? '#ffffff' : '#0f172a',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                    title="Submit Step"
                  >
                    S
                  </button>
                </div>

                {showExamInstructions && (
                  <div style={{ marginTop: '14px' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '10px' }}>Exam Instructions</h3>
                    <div style={{ display: 'grid', gap: '8px', color: '#334155', marginBottom: '14px' }}>
                      <div>1. Review each question carefully before selecting an answer.</div>
                      <div>2. Use the small numbered buttons to move between questions.</div>
                      <div>3. Track your progress and finish before time ends.</div>
                      <div>4. Use the S step to confirm and submit your exam.</div>
                    </div>
                    <button
                      type="button"
                      style={{ ...styles.button, minWidth: '180px' }}
                      onClick={() => {
                        setCurrentExamQuestionIndex(0);
                        setShowExamInstructions(false);
                        setShowSubmitConfirmation(false);
                      }}
                    >
                      Next: Question 1
                    </button>
                  </div>
                )}

                {showSubmitConfirmation && (
                  <div style={{ marginTop: '14px' }}>
                    <div style={{ ...styles.alertWarning, marginBottom: '12px' }}>
                      <strong>Confirmation:</strong> You are on the final step (S). Check your answers and click Confirm & Submit to finish the exam.
                    </div>
                    <button
                      type="button"
                      style={{ ...styles.button, minWidth: '180px', background: '#0f766e' }}
                      onClick={handleSubmitExamClick}
                      disabled={submittingExam}
                    >
                      {submittingExam ? 'Submitting...' : 'Confirm & Submit'}
                    </button>
                  </div>
                )}
              </div>

              {!showExamInstructions && !showSubmitConfirmation && currentExamQuestion && (
                <div style={{ ...styles.card, marginBottom: 0, background: '#ffffff', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    <div style={{ color: '#64748b', fontWeight: 700 }}>
                      Question {currentExamQuestionIndex + 1} of {examQuestions.length}
                    </div>
                    <span style={{ ...styles.badge, ...(Number.isInteger(examAnswers[currentExamQuestion._id]) && examAnswers[currentExamQuestion._id] >= 0 ? styles.badgeSuccess : styles.badgePrimary) }}>
                      {Number.isInteger(examAnswers[currentExamQuestion._id]) && examAnswers[currentExamQuestion._id] >= 0 ? 'Answered' : 'Not answered'}
                    </span>
                  </div>

                  <h3 style={{ marginTop: 0, paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>{currentExamQuestion.question}</h3>

                  <div style={{ display: 'grid', gap: '12px', marginTop: '14px' }}>
                    {(currentExamQuestion.options || []).map((option, optIdx) => {
                      const isSelected = examAnswers[currentExamQuestion._id] === optIdx;
                      return (
                        <label
                          key={`${currentExamQuestion._id}-${optIdx}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '14px 16px',
                            borderRadius: '12px',
                            border: isSelected ? '2px solid #1e3a8a' : '1px solid #cbd5e1',
                            background: isSelected ? '#eff6ff' : '#f8fafc',
                            cursor: 'pointer',
                            transition: 'all 160ms ease'
                          }}
                        >
                          <input
                            type="radio"
                            name={`answer-${currentExamQuestion._id}`}
                            checked={isSelected}
                            onChange={() => handleSelectExamAnswer(currentExamQuestion._id, optIdx)}
                            style={{ transform: 'scale(1.1)' }}
                          />
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', fontWeight: isSelected ? 800 : 600, color: '#0f172a' }}>
                            <span style={{ width: '26px', height: '26px', borderRadius: '999px', background: isSelected ? '#1e3a8a' : '#cbd5e1', color: isSelected ? 'white' : '#334155', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            {option.text}
                          </span>
                          {isSelected && <FaCheckCircle style={{ color: '#16a34a', marginLeft: 'auto' }} />}
                        </label>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginTop: '18px' }}>
                    <button type="button" style={styles.button} onClick={handlePreviousExamQuestion} disabled={currentExamQuestionIndex === 0}>
                      Previous
                    </button>
                    <button type="button" style={styles.button} onClick={handleNextExamQuestion} disabled={currentExamQuestionIndex >= examQuestions.length - 1}>
                      Next
                    </button>
                  </div>
                </div>
              )}
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
