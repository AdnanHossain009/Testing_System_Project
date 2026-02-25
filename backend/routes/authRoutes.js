const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout,
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { userValidation } = require('../middleware/validation');

// Public routes
router.post('/register', userValidation.register, register);
router.post('/login', userValidation.login, login);

// Protected routes
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.put('/change-password', verifyToken, changePassword);
router.post('/logout', verifyToken, logout);

module.exports = router;
