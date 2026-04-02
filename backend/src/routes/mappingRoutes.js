const express = require('express');
const router = express.Router();
const { getMappingByCourse, upsertMapping } = require('../controllers/mappingController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/:courseId', protect, getMappingByCourse);
router.put('/:courseId', protect, authorize('faculty', 'admin', 'head'), upsertMapping);

module.exports = router;
