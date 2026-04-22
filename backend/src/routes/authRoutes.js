const express = require('express');
const router = express.Router();
const { setupRegister, login, signup, getMe, updateMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/setup-register', setupRegister);
router.post('/login', login);
router.post('/signup', signup);
router.get('/me', protect, getMe);
router.patch('/me', protect, updateMe);

module.exports = router;
