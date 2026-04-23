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
import StudentAssistantPage from './pages/StudentAssistantPage';
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
import ImprovementPlansPage from './pages/ImprovementPlansPage';
import ImprovementPlanFormPage from './pages/ImprovementPlanFormPage';
import ImprovementPlanDetailsPage from './pages/ImprovementPlanDetailsPage';
import FacultyEvidencePage from './pages/FacultyEvidencePage';
import EvidenceManagerPage from './pages/EvidenceManagerPage';
import EvidenceSampleSetDetailsPage from './pages/EvidenceSampleSetDetailsPage';
import CurriculumGovernancePage from './pages/CurriculumGovernancePage';
import AccreditationReportsPage from './pages/AccreditationReportsPage';
import AccreditationReportPreviewPage from './pages/AccreditationReportPreviewPage';

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
          <Route path="/faculty/evidence" element={<FacultyEvidencePage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route element={<Layout />}>
          <Route path="/dashboard/student" element={<StudentDashboard />} />
          <Route path="/student/assistant" element={<StudentAssistantPage />} />
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

      <Route element={<ProtectedRoute allowedRoles={['accreditation_officer', 'admin', 'head']} />}>
        <Route element={<Layout />}>
          <Route path="/dashboard/accreditation" element={<AccreditationDashboard />} />
          <Route path="/accreditation/curriculum-governance" element={<CurriculumGovernancePage />} />
          <Route path="/accreditation/reports" element={<AccreditationReportsPage />} />
          <Route path="/accreditation/reports/:reportType" element={<AccreditationReportPreviewPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin', 'accreditation_officer', 'head', 'faculty']} />}>
        <Route element={<Layout />}>
          <Route path="/accreditation/improvement-plans" element={<ImprovementPlansPage />} />
          <Route path="/accreditation/improvement-plans/:planId" element={<ImprovementPlanDetailsPage />} />
          <Route path="/accreditation/evidence-manager/sample-sets/:sampleSetId" element={<EvidenceSampleSetDetailsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin', 'head', 'accreditation_officer']} />}>
        <Route element={<Layout />}>
          <Route path="/accreditation/evidence-manager" element={<EvidenceManagerPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin', 'accreditation_officer']} />}>
        <Route element={<Layout />}>
          <Route path="/accreditation/improvement-plans/new" element={<ImprovementPlanFormPage />} />
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
