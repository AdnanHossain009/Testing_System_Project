const express = require('express');
const router = express.Router();
const {
  listMyNotifications,
  getNotificationSummary,
  markRead,
  markAllRead
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/summary', protect, getNotificationSummary);
router.get('/me', protect, listMyNotifications);
router.patch('/read-all', protect, markAllRead);
router.patch('/:id/read', protect, markRead);

module.exports = router;
