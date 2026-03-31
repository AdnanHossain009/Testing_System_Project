const express = require('express');
const router = express.Router();
const { listPrograms, createProgram } = require('../controllers/programController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, listPrograms);
router.post('/', protect, authorize('admin', 'head'), createProgram);

module.exports = router;
