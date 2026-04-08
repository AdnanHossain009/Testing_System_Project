import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import StudentDashboard from './pages/StudentDashboard';
import HeadDashboard from './pages/HeadDashboard';
import DepartmentsPage from './pages/DepartmentsPage';
import ProgramsPage from './pages/ProgramsPage';
import CoursesPage from './pages/CoursesPage';
import AssessmentsPage from './pages/AssessmentsPage';
import MappingPage from './pages/MappingPage';
import ResultsPage from './pages/ResultsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import NotificationsPage from './pages/NotificationsPage';
import UsersPage from './pages/UsersPage';
import HighRiskStudentsPage from './pages/HighRiskStudentsPage';
import AssignedCoursesPage from './pages/AssignedCoursesPage';
import WeakStudentsPage from './pages/WeakStudentsPage';
import CourseDetailsPage from './pages/CourseDetailsPage';
import ProgramDetailsPage from './pages/ProgramDetailsPage';
import { useAuth } from './context/AuthContext';

const HomeRedirect = () => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const map = {
    admin: '/dashboard/admin',
    faculty: '/dashboard/faculty',
    student: '/dashboard/student',
    head: '/dashboard/head'
  };

  return <Navigate to={map[user?.role] || '/login'} replace />;
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/courses" element={<CoursesPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin', 'faculty', 'head']} />}>
        <Route element={<Layout />}>
          <Route path="/courses/:courseId" element={<CourseDetailsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<Layout />}>
          <Route path="/dashboard/admin" element={<AdminDashboard />} />
          <Route path="/departments" element={<DepartmentsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/high-risk-students" element={<HighRiskStudentsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['faculty']} />}>
        <Route element={<Layout />}>
          <Route path="/dashboard/faculty" element={<FacultyDashboard />} />
          <Route path="/assessments" element={<AssessmentsPage />} />
          <Route path="/mappings" element={<MappingPage />} />
          <Route path="/faculty/courses" element={<AssignedCoursesPage />} />
          <Route path="/faculty/weak-students" element={<WeakStudentsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route element={<Layout />}>
          <Route path="/dashboard/student" element={<StudentDashboard />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['head']} />}>
        <Route element={<Layout />}>
          <Route path="/dashboard/head" element={<HeadDashboard />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin', 'head']} />}>
        <Route element={<Layout />}>
          <Route path="/programs" element={<ProgramsPage />} />
          <Route path="/programs/:programId" element={<ProgramDetailsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin', 'faculty', 'head']} />}>
        <Route element={<Layout />}>
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
