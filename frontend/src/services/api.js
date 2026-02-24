import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Auth Services
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/current')
};

// User Services
export const userService = {
  getProfile: (id) => api.get(`/users/${id}`),
  updateProfile: (data) => api.put('/users/profile/update', data),
  getAllUsers: () => api.get('/users/all/users'),
  getAllTutors: () => api.get('/users/tutors/all'),
  deactivateAccount: () => api.delete('/users/account/deactivate')
};

// Subject & Topic Services
export const subjectService = {
  createSubject: (data) => api.post('/subjects', data),
  getAllSubjects: () => api.get('/subjects'),
  getSubjectById: (id) => api.get(`/subjects/${id}`),
  updateSubject: (id, data) => api.put(`/subjects/${id}`, data),
  deleteSubject: (id) => api.delete(`/subjects/${id}`),
  createTopic: (data) => api.post('/subjects/topics/create', data),
  getTopicsBySubject: (subjectId) => api.get(`/subjects/${subjectId}/topics`),
  updateTopic: (id, data) => api.put(`/subjects/topics/${id}`, data),
  deleteTopic: (id) => api.delete(`/subjects/topics/${id}`)
};

// Study Material Services
export const materialService = {
  uploadMaterial: (formData) => api.post('/materials/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAllMaterials: () => api.get('/materials'),
  getMaterialsBySubject: (subjectId) => api.get(`/materials/subject/${subjectId}`),
  getMaterialsByTopic: (topicId) => api.get(`/materials/topic/${topicId}`),
  getMaterialById: (id) => api.get(`/materials/${id}`),
  updateMaterial: (id, data) => api.put(`/materials/${id}`, data),
  deleteMaterial: (id) => api.delete(`/materials/${id}`),
  downloadMaterial: (id) => api.get(`/materials/${id}/download`, { responseType: 'blob' })
};

// Study Plan Services
export const planService = {
  createPlan: (data) => api.post('/plans', data),
  getStudentPlans: () => api.get('/plans'),
  getPlansByDateRange: (startDate, endDate) => 
    api.get('/plans/range', { params: { startDate, endDate } }),
  updatePlan: (id, data) => api.put(`/plans/${id}`, data),
  completePlan: (id) => api.patch(`/plans/${id}/complete`),
  deletePlan: (id) => api.delete(`/plans/${id}`),
  getLearningProgress: () => api.get('/plans/progress/summary')
};

// Question & Answer Services
export const questionService = {
  createQuestion: (data) => {
    if (typeof FormData !== 'undefined' && data instanceof FormData) {
      return api.post('/questions', data);
    }
    return api.post('/questions', data);
  },
  getAllQuestions: (filters) => api.get('/questions', { params: filters }),
  getQuestionById: (id) => api.get(`/questions/${id}`),
  updateQuestion: (id, data) => api.put(`/questions/${id}`, data),
  deleteQuestion: (id) => api.delete(`/questions/${id}`),
  createAnswer: (questionId, data) => api.post(`/questions/${questionId}/answers`, data),
  updateAnswer: (id, data) => api.put(`/questions/answers/${id}`, data),
  deleteAnswer: (id) => api.delete(`/questions/answers/${id}`),
  markAnswerHelpful: (id) => api.patch(`/questions/answers/${id}/helpful`),
  markAnswerAccepted: (id) => api.patch(`/questions/answers/${id}/accept`)
};

// MCQ Services
export const mcqService = {
  createMCQ: (data) => api.post('/mcq', data),
  getMCQsBySubject: (subjectId) => api.get(`/mcq/subject/${subjectId}`),
  getMCQsByTopic: (topicId) => api.get(`/mcq/topic/${topicId}`),
  getMCQById: (id, hideAnswers = true) => api.get(`/mcq/${id}`, { params: { hideAnswers } }),
  updateMCQ: (id, data) => api.put(`/mcq/${id}`, data),
  deleteMCQ: (id) => api.delete(`/mcq/${id}`),
  submitMCQAnswer: (mcqId, data) => api.post(`/mcq/${mcqId}/submit`, data),
  getUserMCQAttempts: (filters) => api.get('/mcq/attempts/my', { params: filters }),
  getQuizScore: (params) => api.get('/mcq/score/summary', { params })
};

// Appointment Services
export const appointmentService = {
  // Legacy
  createAppointment: (data) => api.post('/appointments', data),
  getStudentAppointments: () => api.get('/appointments/my/appointments'),
  getTutorAppointments: () => api.get('/appointments/tutor/appointments'),
  getAppointmentById: (id) => api.get(`/appointments/${id}`),
  approveAppointment: (id, data) => api.patch(`/appointments/${id}/approve`, data),
  rejectAppointment: (id, data) => api.patch(`/appointments/${id}/reject`, data),
  cancelAppointment: (id) => api.patch(`/appointments/${id}/cancel`),
  completeAppointment: (id) => api.patch(`/appointments/${id}/complete`),
  getAvailableSlots: (tutorId, date) => 
    api.get(`/appointments/tutor/${tutorId}/available-slots`, { params: { date } }),
  
  // New Tutor Session System
  // Student endpoints
  getAvailableSessions: (subject, date) => 
    api.get('/appointments/sessions/available', { params: { subject, date } }),
  getSessionDetails: (sessionId) => 
    api.get(`/appointments/sessions/${sessionId}`),
  bookSession: (data) => 
    api.post('/appointments/book', data),
  getStudentBookings: () => 
    api.get('/appointments/my/bookings'),
  cancelBooking: (appointmentId) => 
    api.patch(`/appointments/bookings/${appointmentId}/cancel`),
  
  // Tutor endpoints
  createTutorSession: (data) => 
    api.post('/appointments/sessions/create', data),
  getTutorSessions: () => 
    api.get('/appointments/tutor/sessions'),
  getTutorSessionDetails: (sessionId) => 
    api.get(`/appointments/tutor/sessions/${sessionId}`),
  updateTutorSession: (sessionId, data) => 
    api.patch(`/appointments/tutor/sessions/${sessionId}`, data),
  rescheduleSession: (sessionId, data) => 
    api.patch(`/appointments/tutor/sessions/${sessionId}/reschedule`, data),
  completeSession: (sessionId) => 
    api.patch(`/appointments/tutor/sessions/${sessionId}/complete`),
  completeTutorSession: (sessionId) => 
    api.patch(`/appointments/tutor/sessions/${sessionId}/complete`),
  cancelTutorSession: (sessionId) => 
    api.patch(`/appointments/tutor/sessions/${sessionId}/cancel`),
  removeStudentFromSession: (sessionId, appointmentId) => 
    api.patch(`/appointments/tutor/sessions/${sessionId}/remove/${appointmentId}`)
};

export default api;
