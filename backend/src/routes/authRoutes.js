const express = require('express');
const router = express.Router();
const { setupRegister, login, signup, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/setup-register', setupRegister);
router.post('/login', login);
router.post('/signup', signup);
router.get('/me', protect, getMe);

module.exports = router;
