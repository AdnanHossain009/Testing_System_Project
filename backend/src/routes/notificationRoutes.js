const express = require('express');
const router = express.Router();
const { listMyNotifications, markRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/me', protect, listMyNotifications);
router.patch('/:id/read', protect, markRead);

module.exports = router;
