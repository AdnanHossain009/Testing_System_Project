const express = require('express');
const router = express.Router();
const { setupRegister, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/setup-register', setupRegister);
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;
