export const ROLES = {
  ADMIN: 'admin',
  FACULTY: 'faculty',
  STUDENT: 'student',
};

export const ASSESSMENT_TYPES = [
  { value: 'quiz', label: 'Quiz' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'midterm', label: 'Midterm Exam' },
  { value: 'final', label: 'Final Exam' },
  { value: 'project', label: 'Project' },
  { value: 'lab', label: 'Lab Work' },
  { value: 'presentation', label: 'Presentation' },
];

export const PERFORMANCE_THRESHOLDS = {
  EXCELLENT: 80,
  GOOD: 70,
  SATISFACTORY: 60,
  NEEDS_IMPROVEMENT: 50,
  POOR: 0,
};

export const CHART_COLORS = [
  '#0ea5e9',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#6366f1',
  '#14b8a6',
];

export const NAVBAR_HEIGHT = 64;
export const SIDEBAR_WIDTH = 256;
export const SIDEBAR_COLLAPSED_WIDTH = 80;

export const API_ENDPOINTS = {
  AUTH: '/auth',
  PROGRAMS: '/programs',
  COURSES: '/courses',
  PLOS: '/plos',
  CLOS: '/clos',
  ASSESSMENTS: '/assessments',
  MARKS: '/marks',
  ANALYTICS: '/analytics',
  STUDENTS: '/students',
  FACULTY: '/faculty',
};

export const TOAST_CONFIG = {
  position: 'top-right',
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};
