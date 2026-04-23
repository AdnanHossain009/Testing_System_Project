const express = require('express');
const router = express.Router();
const {
  listEvidenceArtifacts,
  createEvidenceArtifact,
  getEvidenceArtifact,
  updateEvidenceArtifact,
  downloadEvidenceArtifact,
  listEvidenceSampleSets,
  createEvidenceSampleSet,
  getEvidenceSampleSet,
  updateEvidenceSampleSet,
  updateEvidenceSampleReview,
  deleteEvidenceSampleSet
} = require('../controllers/evidenceController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { evidenceArtifactUpload } = require('../middleware/uploadMiddleware');

router.get('/artifacts', protect, authorize('faculty', 'admin', 'head', 'accreditation_officer'), listEvidenceArtifacts);
router.post(
  '/artifacts',
  protect,
  authorize('faculty', 'accreditation_officer'),
  evidenceArtifactUpload.single('artifact'),
  createEvidenceArtifact
);
router.get('/artifacts/:artifactId', protect, authorize('faculty', 'admin', 'head', 'accreditation_officer'), getEvidenceArtifact);
router.patch('/artifacts/:artifactId', protect, authorize('faculty', 'accreditation_officer'), updateEvidenceArtifact);
router.get(
  '/artifacts/:artifactId/download',
  protect,
  authorize('faculty', 'admin', 'head', 'accreditation_officer'),
  downloadEvidenceArtifact
);

router.get('/sample-sets', protect, authorize('faculty', 'admin', 'head', 'accreditation_officer'), listEvidenceSampleSets);
router.post('/sample-sets', protect, authorize('accreditation_officer'), createEvidenceSampleSet);
router.get('/sample-sets/:sampleSetId', protect, authorize('faculty', 'admin', 'head', 'accreditation_officer'), getEvidenceSampleSet);
router.patch('/sample-sets/:sampleSetId', protect, authorize('accreditation_officer'), updateEvidenceSampleSet);
router.patch(
  '/sample-sets/:sampleSetId/review',
  protect,
  authorize('faculty', 'head', 'admin', 'accreditation_officer'),
  updateEvidenceSampleReview
);
router.delete('/sample-sets/:sampleSetId', protect, authorize('accreditation_officer'), deleteEvidenceSampleSet);

module.exports = router;
