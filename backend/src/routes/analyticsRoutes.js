const express = require('express');
const router = express.Router();
const {
  adminSummary,
  facultySummary,
  studentSummary,
  headSummary,
  courseAnalytics,
  weakStudentsByCourse
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/admin-summary', protect, authorize('admin'), adminSummary);
router.get('/faculty-summary', protect, authorize('faculty'), facultySummary);
router.get('/student-summary', protect, authorize('student'), studentSummary);
router.get('/head-summary', protect, authorize('head', 'admin'), headSummary);
router.get('/course/:courseId', protect, authorize('faculty', 'admin', 'head'), courseAnalytics);
router.get('/weak-students/:courseId', protect, authorize('faculty', 'admin', 'head'), weakStudentsByCourse);

module.exports = router;
