const express = require('express');
const router = express.Router();
const { listUsers, createUser, updateUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, authorize('admin', 'faculty', 'head', 'accreditation_officer'), listUsers);
router.post('/', protect, authorize('admin'), createUser);
router.patch('/:id', protect, authorize('admin'), updateUser);

module.exports = router;
