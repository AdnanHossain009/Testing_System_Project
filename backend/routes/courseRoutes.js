const express = require('express');
const router = express.Router();
const {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  addCLO,
  updateCLO,
  deleteCLO,
} = require('../controllers/courseController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { courseValidation, objectIdValidation } = require('../middleware/validation');
const { ROLES } = require('../config/constants');

// All routes require authentication
router.use(verifyToken);

// Course routes
router
  .route('/')
  .get(getAllCourses)
  .post(authorizeRoles(ROLES.ADMIN, ROLES.FACULTY), courseValidation.create, createCourse);

router
  .route('/:id')
  .get(objectIdValidation, getCourseById)
  .put(authorizeRoles(ROLES.ADMIN, ROLES.FACULTY), objectIdValidation, updateCourse)
  .delete(authorizeRoles(ROLES.ADMIN), objectIdValidation, deleteCourse);

// CLO routes
router.post('/:id/clos', authorizeRoles(ROLES.ADMIN, ROLES.FACULTY), addCLO);
router.put('/:id/clos/:cloId', authorizeRoles(ROLES.ADMIN, ROLES.FACULTY), updateCLO);
router.delete('/:id/clos/:cloId', authorizeRoles(ROLES.ADMIN, ROLES.FACULTY), deleteCLO);

module.exports = router;
