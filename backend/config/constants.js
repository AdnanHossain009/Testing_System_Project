// User Roles
const ROLES = {
  ADMIN: 'admin',
  FACULTY: 'faculty',
  STUDENT: 'student',
};

// Assessment Types
const ASSESSMENT_TYPES = {
  QUIZ: 'quiz',
  ASSIGNMENT: 'assignment',
  MIDTERM: 'midterm',
  FINAL: 'final',
  PROJECT: 'project',
  LAB: 'lab',
  PRESENTATION: 'presentation',
};

// Performance Levels
const PERFORMANCE_LEVELS = {
  POOR: 'Poor',
  AVERAGE: 'Average',
  GOOD: 'Good',
  EXCELLENT: 'Excellent',
};

// Performance Thresholds
const PERFORMANCE_THRESHOLDS = {
  POOR: { min: 0, max: 40 },
  AVERAGE: { min: 40, max: 60 },
  GOOD: { min: 60, max: 80 },
  EXCELLENT: { min: 80, max: 100 },
};

// PLO Domains
const PLO_DOMAINS = {
  COGNITIVE: 'cognitive',
  AFFECTIVE: 'affective',
  PSYCHOMOTOR: 'psychomotor',
};

// Grade System
const GRADE_SYSTEM = [
  { grade: 'A+', min: 90, max: 100, gpa: 4.0 },
  { grade: 'A', min: 85, max: 89, gpa: 3.7 },
  { grade: 'A-', min: 80, max: 84, gpa: 3.3 },
  { grade: 'B+', min: 75, max: 79, gpa: 3.0 },
  { grade: 'B', min: 70, max: 74, gpa: 2.7 },
  { grade: 'B-', min: 65, max: 69, gpa: 2.3 },
  { grade: 'C+', min: 60, max: 64, gpa: 2.0 },
  { grade: 'C', min: 55, max: 59, gpa: 1.7 },
  { grade: 'C-', min: 50, max: 54, gpa: 1.3 },
  { grade: 'D', min: 40, max: 49, gpa: 1.0 },
  { grade: 'F', min: 0, max: 39, gpa: 0.0 },
];

// API Response Messages
const MESSAGES = {
  SUCCESS: {
    CREATED: 'Resource created successfully',
    UPDATED: 'Resource updated successfully',
    DELETED: 'Resource deleted successfully',
    FETCHED: 'Data fetched successfully',
    LOGIN: 'Login successful',
    LOGOUT: 'Logout successful',
    REGISTERED: 'Registration successful',
  },
  ERROR: {
    NOT_FOUND: 'Resource not found',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Access forbidden',
    VALIDATION: 'Validation error',
    SERVER: 'Internal server error',
    DUPLICATE: 'Resource already exists',
    INVALID_CREDENTIALS: 'Invalid credentials',
    INVALID_TOKEN: 'Invalid or expired token',
  },
};

// CLO Attainment Threshold
const CLO_ATTAINMENT_THRESHOLD = 60; // 60% minimum for CLO attainment

// PLO Attainment Threshold
const PLO_ATTAINMENT_THRESHOLD = 60; // 60% minimum for PLO attainment

module.exports = {
  ROLES,
  ASSESSMENT_TYPES,
  PERFORMANCE_LEVELS,
  PERFORMANCE_THRESHOLDS,
  PLO_DOMAINS,
  GRADE_SYSTEM,
  MESSAGES,
  CLO_ATTAINMENT_THRESHOLD,
  PLO_ATTAINMENT_THRESHOLD,
};
