const express = require('express');
const router = express.Router();
const { listAssessments, createAssessment } = require('../controllers/assessmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, listAssessments);
router.post('/', protect, authorize('faculty', 'admin'), createAssessment);

module.exports = router;
