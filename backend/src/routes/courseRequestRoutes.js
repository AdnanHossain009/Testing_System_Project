const express = require('express');
const router = express.Router();
const {
  listMyRequests,
  listInboxRequests,
  requestStudentEnrollment,
  requestFacultyCourse,
  approveRequest,
  rejectRequest
} = require('../controllers/courseRequestController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/my', protect, listMyRequests);
router.get('/inbox', protect, authorize('faculty', 'head'), listInboxRequests);
router.post('/student-enrollment', protect, authorize('student'), requestStudentEnrollment);
router.post('/faculty-course', protect, authorize('faculty'), requestFacultyCourse);
router.patch('/:id/approve', protect, authorize('faculty', 'head'), approveRequest);
router.patch('/:id/reject', protect, authorize('faculty', 'head'), rejectRequest);

module.exports = router;