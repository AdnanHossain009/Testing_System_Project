const express = require('express');
const router = express.Router();
const {
  getAllAssessments,
  getAssessmentById,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  publishAssessment,
} = require('../controllers/assessmentController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { assessmentValidation, objectIdValidation } = require('../middleware/validation');
const { ROLES } = require('../config/constants');

// All routes require authentication
router.use(verifyToken);

// Assessment routes
router
  .route('/')
  .get(getAllAssessments)
  .post(authorizeRoles(ROLES.FACULTY), assessmentValidation.create, createAssessment);

router
  .route('/:id')
  .get(objectIdValidation, getAssessmentById)
  .put(authorizeRoles(ROLES.FACULTY), objectIdValidation, updateAssessment)
  .delete(authorizeRoles(ROLES.FACULTY), objectIdValidation, deleteAssessment);

// Publish assessment
router.patch('/:id/publish', authorizeRoles(ROLES.FACULTY), objectIdValidation, publishAssessment);

module.exports = router;
