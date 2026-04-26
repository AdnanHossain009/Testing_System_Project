const express = require('express');
const router = express.Router();
const {
  listUsers,
  createUser,
  updateUser,
  listPendingApprovals,
  reviewPendingUser,
  assignAccreditationOfficer
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/pending-approvals', protect, authorize('admin', 'head'), listPendingApprovals);
router.get('/', protect, authorize('admin', 'faculty', 'head', 'accreditation_officer'), listUsers);
router.post('/', protect, authorize('admin'), createUser);
router.patch('/:id/review-approval', protect, authorize('admin', 'head'), reviewPendingUser);
router.patch('/:id/assign-accreditation-officer', protect, authorize('head'), assignAccreditationOfficer);
router.patch('/:id', protect, authorize('admin'), updateUser);

module.exports = router;
