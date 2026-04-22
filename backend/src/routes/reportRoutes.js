const express = require('express');
const router = express.Router();
const { studentPdfReport, courseSummaryReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/student/:studentId/:courseId/pdf', protect, authorize('admin', 'faculty', 'head', 'student'), studentPdfReport);
router.get('/course/:courseId/summary', protect, authorize('admin', 'faculty', 'head', 'accreditation_officer'), courseSummaryReport);

module.exports = router;
