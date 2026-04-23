const express = require('express');
const router = express.Router();
const {
  adminSummary,
  facultySummary,
  studentSummary,
  headSummary,
  accreditationSummary,
  courseAnalytics,
  curriculumGovernance,
  weakStudentsByCourse
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/admin-summary', protect, authorize('admin'), adminSummary);
router.get('/faculty-summary', protect, authorize('faculty'), facultySummary);
router.get('/student-summary', protect, authorize('student'), studentSummary);
router.get('/head-summary', protect, authorize('head', 'admin'), headSummary);
router.get('/accreditation-summary', protect, authorize('accreditation_officer', 'admin'), accreditationSummary);
router.get('/curriculum-governance', protect, authorize('accreditation_officer', 'admin', 'head'), curriculumGovernance);
router.get('/course/:courseId', protect, authorize('faculty', 'admin', 'head', 'accreditation_officer'), courseAnalytics);
router.get('/weak-students/:courseId', protect, authorize('faculty', 'admin', 'head', 'accreditation_officer'), weakStudentsByCourse);

module.exports = router;
