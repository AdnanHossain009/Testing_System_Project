const express = require('express');
const router = express.Router();
const { listDepartments, createDepartment } = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', listDepartments);
router.post('/', protect, authorize('admin'), createDepartment);

module.exports = router;
