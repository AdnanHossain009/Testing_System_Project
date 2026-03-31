const express = require('express');
const router = express.Router();
const { upsertResult, getCourseResults, getMyResults } = require('../controllers/resultController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('faculty', 'admin'), upsertResult);
router.get('/course/:courseId', protect, authorize('faculty', 'admin', 'head'), getCourseResults);
router.get('/me', protect, authorize('student'), getMyResults);

module.exports = router;
