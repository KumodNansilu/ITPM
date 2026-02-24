import React, { useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthContext, AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import StudyPlanner from './pages/StudyPlanner';
import Materials from './pages/Materials';
import Questions from './pages/Questions';
import MCQ from './pages/MCQ';
import Profile from './pages/Profile';
import SubjectsManagement from './pages/SubjectsManagement';
import StudentAppointments from './pages/StudentAppointments';
import TutorSessions from './pages/TutorSessions';
import ProgressTracking from './pages/ProgressTracking';

import styles from './styles/inlineStyles';

const AppContent = () => {
  const { isAuthenticated, loading } = useContext(AuthContext);

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
    <>
      {isAuthenticated && <Navigation />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/study-planner"
          element={
            <ProtectedRoute requiredRole="student">
              <StudyPlanner />
            </ProtectedRoute>
          }
        />

        <Route
          path="/materials"
          element={
            <ProtectedRoute>
              <Materials />
            </ProtectedRoute>
          }
        />

        <Route
          path="/questions"
          element={
            <ProtectedRoute>
              <Questions />
            </ProtectedRoute>
          }
        />

        <Route
          path="/mcq"
          element={
            <ProtectedRoute requiredRole="student">
              <MCQ />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/subjects"
          element={
            <ProtectedRoute requiredRole="tutor">
              <SubjectsManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/appointments"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentAppointments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/sessions"
          element={
            <ProtectedRoute requiredRole="tutor">
              <TutorSessions />
            </ProtectedRoute>
          }
        />

        <Route
          path="/progress"
          element={
            <ProtectedRoute requiredRole="student">
              <ProgressTracking />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
        <ToastContainer position="bottom-right" autoClose={3000} />
      </AuthProvider>
    </Router>
  );
}

export default App;
