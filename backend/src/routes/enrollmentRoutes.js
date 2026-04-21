const express = require('express');
const router = express.Router();
const { listMyEnrollments } = require('../controllers/enrollmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/me', protect, authorize('student', 'faculty', 'head', 'admin'), listMyEnrollments);

module.exports = router;