import { Navigate, Route, Routes } from 'react-router-dom';
import PublicLayout from './components/PublicLayout';
import HomePage from './pages/HomePage';
import FuzzyPage from './pages/FuzzyPage';
import ObePage from './pages/ObePage';
import CloPloPage from './pages/CloPloPage';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import StudentDashboard from './pages/StudentDashboard';
import HeadDashboard from './pages/HeadDashboard';
import AccreditationDashboard from './pages/AccreditationDashboard';
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
import CourseRequestsPage from './pages/CourseRequestsPage';
import EnrollmentHistoryPage from './pages/EnrollmentHistoryPage';
import HeadCourseRequestsPage from './pages/HeadCourseRequestsPage';
import CourseRequestReviewPage from './pages/CourseRequestReviewPage';
import AccountSettingsPage from './pages/AccountSettingsPage';
import AccreditationModulePlaceholderPage from './pages/AccreditationModulePlaceholderPage';

const App = () => {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="fuzzy" element={<FuzzyPage />} />
        <Route path="obe" element={<ObePage />} />
        <Route path="clo-plo" element={<CloPloPage />} />
      </Route>

      <Route path="/login" element={<LoginPage initialMode="login" />} />
      <Route path="/signup" element={<LoginPage initialMode="signup" />} />

      <Route element={<ProtectedRoute allowedRoles={['faculty']} />}>
        <Route element={<Layout />}>
          <Route path="/course-requests" element={<CourseRequestsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/account" element={<AccountSettingsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin', 'faculty', 'head', 'accreditation_officer']} />}>
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
          <Route path="/enrollments/history" element={<EnrollmentHistoryPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['head']} />}>
        <Route element={<Layout />}>
          <Route path="/dashboard/head" element={<HeadDashboard />} />
          <Route path="/head/course-requests" element={<HeadCourseRequestsPage />} />
          <Route path="/head/course-requests/:requestId" element={<CourseRequestReviewPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['accreditation_officer']} />}>
        <Route element={<Layout />}>
          <Route path="/dashboard/accreditation" element={<AccreditationDashboard />} />
          <Route
            path="/accreditation/improvement-plans"
            element={
              <AccreditationModulePlaceholderPage
                title="Improvement Plans"
                description="Track institution-level corrective actions, monitor weak outcomes, and prepare formal response plans for accreditation cycles."
              />
            }
          />
          <Route
            path="/accreditation/evidence-manager"
            element={
              <AccreditationModulePlaceholderPage
                title="Evidence Manager"
                description="Organize accreditation evidence, map artifacts to outcomes, and prepare a governed repository for future review cycles."
              />
            }
          />
          <Route
            path="/accreditation/curriculum-governance"
            element={
              <AccreditationModulePlaceholderPage
                title="Curriculum Governance"
                description="Review curriculum coverage, outcome alignment, and mapping readiness across active programs and courses."
              />
            }
          />
          <Route
            path="/accreditation/reports"
            element={
              <AccreditationModulePlaceholderPage
                title="Accreditation Reports"
                description="Prepare institution-wide accreditation summaries, evidence-backed narratives, and export-ready reporting workflows."
              />
            }
          />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin', 'head', 'accreditation_officer']} />}>
        <Route element={<Layout />}>
          <Route path="/programs" element={<ProgramsPage />} />
          <Route path="/programs/:programId" element={<ProgramDetailsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin', 'faculty', 'head', 'accreditation_officer']} />}>
        <Route element={<Layout />}>
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
