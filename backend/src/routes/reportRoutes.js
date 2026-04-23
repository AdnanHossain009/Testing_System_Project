const express = require('express');
const router = express.Router();
const {
  studentPdfReport,
  courseSummaryReport,
  accreditationReportCatalog,
  accreditationReportPreview,
  accreditationReportExport
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/student/:studentId/:courseId/pdf', protect, authorize('admin', 'faculty', 'head', 'student'), studentPdfReport);
router.get('/course/:courseId/summary', protect, authorize('admin', 'faculty', 'head', 'accreditation_officer'), courseSummaryReport);
router.get('/accreditation/catalog', protect, authorize('accreditation_officer', 'admin', 'head'), accreditationReportCatalog);
router.get('/accreditation/:reportType/preview', protect, authorize('accreditation_officer', 'admin', 'head'), accreditationReportPreview);
router.get('/accreditation/:reportType/export', protect, authorize('accreditation_officer', 'admin', 'head'), accreditationReportExport);

module.exports = router;
