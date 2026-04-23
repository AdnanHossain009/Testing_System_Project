const express = require('express');
const router = express.Router();
const {
  listAttainmentTargets,
  createAttainmentTarget,
  updateAttainmentTarget,
  listDetectedOutcomes,
  listImprovementPlans,
  createImprovementPlan,
  getImprovementPlan,
  updateImprovementPlan,
  updateImprovementPlanStatus,
  deleteImprovementPlan
} = require('../controllers/improvementPlanController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get(
  '/targets',
  protect,
  authorize('admin', 'accreditation_officer', 'head', 'faculty'),
  listAttainmentTargets
);
router.post('/targets', protect, authorize('admin', 'accreditation_officer'), createAttainmentTarget);
router.patch('/targets/:targetId', protect, authorize('admin', 'accreditation_officer'), updateAttainmentTarget);

router.get(
  '/outcomes',
  protect,
  authorize('admin', 'accreditation_officer', 'head', 'faculty'),
  listDetectedOutcomes
);

router.get('/', protect, authorize('admin', 'accreditation_officer', 'head', 'faculty'), listImprovementPlans);
router.post('/', protect, authorize('admin', 'accreditation_officer'), createImprovementPlan);
router.get('/:planId', protect, authorize('admin', 'accreditation_officer', 'head', 'faculty'), getImprovementPlan);
router.patch('/:planId', protect, authorize('admin', 'accreditation_officer'), updateImprovementPlan);
router.patch('/:planId/status', protect, authorize('admin', 'accreditation_officer'), updateImprovementPlanStatus);
router.delete('/:planId', protect, authorize('admin', 'accreditation_officer'), deleteImprovementPlan);

module.exports = router;
