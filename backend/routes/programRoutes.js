const express = require('express');
const router = express.Router();
const {
  getAllPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
  addPLO,
  updatePLO,
  deletePLO,
} = require('../controllers/programController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { programValidation, objectIdValidation } = require('../middleware/validation');
const { ROLES } = require('../config/constants');

// All routes require authentication
router.use(verifyToken);

// Program routes
router
  .route('/')
  .get(getAllPrograms)
  .post(authorizeRoles(ROLES.ADMIN), programValidation.create, createProgram);

router
  .route('/:id')
  .get(objectIdValidation, getProgramById)
  .put(authorizeRoles(ROLES.ADMIN), objectIdValidation, updateProgram)
  .delete(authorizeRoles(ROLES.ADMIN), objectIdValidation, deleteProgram);

// PLO routes
router.post('/:id/plos', authorizeRoles(ROLES.ADMIN), addPLO);
router.put('/:id/plos/:ploId', authorizeRoles(ROLES.ADMIN), updatePLO);
router.delete('/:id/plos/:ploId', authorizeRoles(ROLES.ADMIN), deletePLO);

module.exports = router;
