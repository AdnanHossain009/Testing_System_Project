import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import { GlobalProvider } from './context/GlobalContext';

import ErrorBoundary from './components/ErrorBoundary';
import PrivateRoute from './components/PrivateRoute';
import Loading from './components/Loading';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ProgramsPage from './pages/admin/ProgramsPage';
import CoursesPage from './pages/admin/CoursesPage';
import PLOsPage from './pages/admin/PLOsPage';

// Faculty Pages
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import AssessmentsPage from './pages/faculty/AssessmentsPage';
import FacultyAnalyticsPage from './pages/faculty/FacultyAnalyticsPage';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import PerformancePage from './pages/student/PerformancePage';

// Error Pages
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';

import { ROLES } from './utils/constants';
import { TOAST_CONFIG } from './utils/constants';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <GlobalProvider>
            <div className="App">
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/unauthorized" element={<Unauthorized />} />

                {/* Default Route - Redirect to appropriate dashboard */}
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* Admin Routes */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <PrivateRoute allowedRoles={[ROLES.ADMIN]}>
                      <AdminDashboard />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/admin/programs"
                  element={
                    <PrivateRoute allowedRoles={[ROLES.ADMIN]}>
                      <ProgramsPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/admin/courses"
                  element={
                    <PrivateRoute allowedRoles={[ROLES.ADMIN]}>
                      <CoursesPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/admin/plos"
                  element={
                    <PrivateRoute allowedRoles={[ROLES.ADMIN]}>
                      <PLOsPage />
                    </PrivateRoute>
                  }
                />

                {/* Faculty Routes */}
                <Route
                  path="/faculty/dashboard"
                  element={
                    <PrivateRoute allowedRoles={[ROLES.FACULTY]}>
                      <FacultyDashboard />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/faculty/courses"
                  element={
                    <PrivateRoute allowedRoles={[ROLES.FACULTY]}>
                      <FacultyDashboard />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/faculty/assessments"
                  element={
                    <PrivateRoute allowedRoles={[ROLES.FACULTY]}>
                      <AssessmentsPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/faculty/analytics"
                  element={
                    <PrivateRoute allowedRoles={[ROLES.FACULTY]}>
                      <FacultyAnalyticsPage />
                    </PrivateRoute>
                  }
                />

                {/* Student Routes */}
                <Route
                  path="/student/dashboard"
                  element={
                    <PrivateRoute allowedRoles={[ROLES.STUDENT]}>
                      <StudentDashboard />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/student/courses"
                  element={
                    <PrivateRoute allowedRoles={[ROLES.STUDENT]}>
                      <StudentDashboard />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/student/performance"
                  element={
                    <PrivateRoute allowedRoles={[ROLES.STUDENT]}>
                      <PerformancePage />
                    </PrivateRoute>
                  }
                />

                {/* 404 Not Found */}
                <Route path="*" element={<NotFound />} />
              </Routes>

              <ToastContainer {...TOAST_CONFIG} />
            </div>
          </GlobalProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
