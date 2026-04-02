const express = require('express');
const router = express.Router();
const { listCourses, createCourse, addClos } = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, listCourses);
router.post('/', protect, authorize('admin', 'head'), createCourse);
router.post('/:id/clos', protect, authorize('faculty', 'admin', 'head'), addClos);

module.exports = router;
