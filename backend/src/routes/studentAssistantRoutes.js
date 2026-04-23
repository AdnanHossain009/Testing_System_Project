const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  chatWithStudentAssistant,
  getStudentAssistantContextSummary
} = require('../controllers/studentAssistantController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

const studentAssistantLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many assistant requests. Please wait a few minutes and try again.'
  }
});

router.get('/context-summary', protect, authorize('student'), studentAssistantLimiter, getStudentAssistantContextSummary);
router.post('/chat', protect, authorize('student'), studentAssistantLimiter, chatWithStudentAssistant);

module.exports = router;
