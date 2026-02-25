const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const programRoutes = require('./programRoutes');
const courseRoutes = require('./courseRoutes');
const assessmentRoutes = require('./assessmentRoutes');
const marksRoutes = require('./marksRoutes');
const analyticsRoutes = require('./analyticsRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/programs', programRoutes);
router.use('/courses', courseRoutes);
router.use('/assessments', assessmentRoutes);
router.use('/marks', marksRoutes);
router.use('/analytics', analyticsRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
