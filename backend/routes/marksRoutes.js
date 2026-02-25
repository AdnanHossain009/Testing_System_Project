const express = require('express');
const router = express.Router();
const {
  getAllMarks,
  getMarksByStudent,
  getMarksByAssessment,
  submitMarks,
  updateMarks,
  deleteMarks,
  bulkSubmitMarks,
} = require('../controllers/marksController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { marksValidation, objectIdValidation } = require('../middleware/validation');
const { ROLES } = require('../config/constants');

// All routes require authentication
router.use(verifyToken);

// Marks routes
router
  .route('/')
  .get(getAllMarks)
  .post(authorizeRoles(ROLES.FACULTY), marksValidation.create, submitMarks);

router.post('/bulk', authorizeRoles(ROLES.FACULTY), bulkSubmitMarks);

router.get('/student/:studentId', getMarksByStudent);
router.get('/assessment/:assessmentId', authorizeRoles(ROLES.FACULTY), getMarksByAssessment);

router
  .route('/:id')
  .put(authorizeRoles(ROLES.FACULTY), objectIdValidation, updateMarks)
  .delete(authorizeRoles(ROLES.FACULTY), objectIdValidation, deleteMarks);

module.exports = router;
