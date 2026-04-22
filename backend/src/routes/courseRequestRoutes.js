const express = require('express');
const router = express.Router();
const {
  listMyRequests,
  listInboxRequests,
  getRequestDetails,
  extractFacultyCoursePdf,
  requestStudentEnrollment,
  requestFacultyCourse,
  approveRequest,
  rejectRequest
} = require('../controllers/courseRequestController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { courseRequestPdfUpload } = require('../middleware/uploadMiddleware');

router.get('/my', protect, listMyRequests);
router.get('/inbox', protect, authorize('faculty', 'head'), listInboxRequests);
router.get('/:id', protect, getRequestDetails);
router.post(
  '/extract-pdf',
  protect,
  authorize('faculty'),
  courseRequestPdfUpload.single('pdf'),
  extractFacultyCoursePdf
);
router.post('/student-enrollment', protect, authorize('student'), requestStudentEnrollment);
router.post('/faculty-course', protect, authorize('faculty'), requestFacultyCourse);
router.patch('/:id/approve', protect, authorize('faculty', 'head'), approveRequest);
router.patch('/:id/reject', protect, authorize('faculty', 'head'), rejectRequest);

module.exports = router;
