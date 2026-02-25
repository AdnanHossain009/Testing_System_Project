const express = require('express');
const router = express.Router();
const {
  getAdminDashboardAnalytics,
  getFacultyDashboardAnalytics,
  getStudentDashboardAnalytics,
  calculateOutcome,
  getStudentOutcomeResults,
  getCourseOutcomeResults,
  getAtRiskStudents,
  getCLOStatistics,
  getPLOStatistics,
  getPerformanceTrend,
} = require('../controllers/analyticsController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

// All routes require authentication
router.use(verifyToken);

// Dashboard analytics
router.get('/admin/dashboard', authorizeRoles(ROLES.ADMIN), getAdminDashboardAnalytics);
router.get('/faculty/dashboard', authorizeRoles(ROLES.FACULTY), getFacultyDashboardAnalytics);
router.get('/student/dashboard', authorizeRoles(ROLES.STUDENT), getStudentDashboardAnalytics);

// Outcome calculations
router.post(
  '/outcomes/calculate',
  authorizeRoles(ROLES.ADMIN, ROLES.FACULTY),
  calculateOutcome
);

router.get('/outcomes/student/:studentId', getStudentOutcomeResults);

router.get(
  '/outcomes/course/:courseId',
  authorizeRoles(ROLES.ADMIN, ROLES.FACULTY),
  getCourseOutcomeResults
);

// Risk analysis
router.get('/at-risk', authorizeRoles(ROLES.ADMIN, ROLES.FACULTY), getAtRiskStudents);

// Statistics
router.get('/clo/:courseId', authorizeRoles(ROLES.ADMIN, ROLES.FACULTY), getCLOStatistics);

router.get('/plo/:programId', authorizeRoles(ROLES.ADMIN), getPLOStatistics);

// Performance trend
router.get('/performance-trend/:studentId', getPerformanceTrend);

module.exports = router;
