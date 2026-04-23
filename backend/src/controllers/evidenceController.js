const fs = require('fs');
const EvidenceArtifact = require('../models/EvidenceArtifact');
const EvidenceSampleSet = require('../models/EvidenceSampleSet');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { logAction } = require('../services/auditService');
const {
  sanitizeArtifactPayload,
  sanitizeSampleSetPayload,
  validateArtifactPayload,
  validateFacultyArtifactWrite,
  validateSampleSetPayload,
  validateArtifactSelection,
  buildArtifactFilePayloadFromFile,
  listArtifactsForUser,
  getArtifactForUser,
  listSampleSetsForUser,
  getSampleSetForUser,
  buildStoredArtifactPath,
  populateArtifactQuery,
  populateSampleSetQuery,
  buildSampledArtifacts,
  validateReviewerAccess
} = require('../services/evidenceService');

const deleteUploadedFileIfExists = (file) => {
  if (!file?.path) {
    return;
  }

  try {
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  } catch (error) {
    // Ignore cleanup failures so the original validation error can surface.
  }
};

const ensureEvidenceManager = (user) => {
  if (user.role !== 'accreditation_officer') {
    const error = new Error('Only accreditation officer can manage sample sets and repository-wide evidence.');
    error.statusCode = 403;
    throw error;
  }
};

const listEvidenceArtifacts = asyncHandler(async (req, res) => {
  const artifacts = await listArtifactsForUser(req.user, req.query);
  return success(res, { artifacts }, 'Evidence artifacts fetched.');
});

const createEvidenceArtifact = asyncHandler(async (req, res) => {
  if (!['faculty', 'accreditation_officer'].includes(req.user.role)) {
    res.status(403);
    throw new Error('You are not allowed to upload evidence.');
  }

  try {
    const payload = sanitizeArtifactPayload(req.body);
    payload.file = req.file ? buildArtifactFilePayloadFromFile(req.file) : null;

    const scoped = await validateArtifactPayload(payload, { requireFile: true });
    validateFacultyArtifactWrite(req.user, scoped);

    const artifact = await EvidenceArtifact.create({
      ...payload,
      ...scoped,
      file: payload.file,
      uploader: req.user._id,
      updatedBy: req.user._id
    });

    await logAction({
      actor: req.user._id,
      action: 'UPLOAD_EVIDENCE_ARTIFACT',
      entityType: 'EvidenceArtifact',
      entityId: artifact._id.toString(),
      metadata: {
        evidenceType: artifact.evidenceType,
        courseId: artifact.course?.toString() || null,
        assessmentId: artifact.assessment?.toString() || null
      }
    });

    const createdArtifact = await populateArtifactQuery(EvidenceArtifact.findById(artifact._id));

    return success(res, { artifact: createdArtifact }, 'Evidence artifact uploaded.', 201);
  } catch (error) {
    deleteUploadedFileIfExists(req.file);
    throw error;
  }
});

const getEvidenceArtifact = asyncHandler(async (req, res) => {
  const artifact = await getArtifactForUser(req.user, req.params.artifactId);
  return success(res, { artifact }, 'Evidence artifact fetched.');
});

const updateEvidenceArtifact = asyncHandler(async (req, res) => {
  const artifact = await getArtifactForUser(req.user, req.params.artifactId);
  const canEdit =
    req.user.role === 'accreditation_officer' ||
    (req.user.role === 'faculty' && String(artifact.uploader?._id || artifact.uploader) === String(req.user._id));

  if (!canEdit) {
    res.status(403);
    throw new Error('You are not allowed to update this artifact.');
  }

  const payload = sanitizeArtifactPayload({
    title: req.body.title ?? artifact.title,
    description: req.body.description ?? artifact.description,
    evidenceType: req.body.evidenceType ?? artifact.evidenceType,
    academicTerm: req.body.academicTerm ?? artifact.academicTerm,
    course: req.body.course ?? artifact.course?._id ?? artifact.course,
    assessment: req.body.assessment ?? artifact.assessment?._id ?? artifact.assessment,
    student: req.body.student ?? artifact.student?._id ?? artifact.student,
    department: req.body.department ?? artifact.department?._id ?? artifact.department,
    program: req.body.program ?? artifact.program?._id ?? artifact.program,
    outcomeType: req.body.outcomeType ?? artifact.outcomeType,
    outcomeCode: req.body.outcomeCode ?? artifact.outcomeCode,
    status: req.body.status ?? artifact.status,
    visibility: req.body.visibility ?? artifact.visibility
  });
  payload.file = artifact.file;

  const scoped = await validateArtifactPayload(payload, { requireFile: false });
  validateFacultyArtifactWrite(req.user, scoped);

  Object.assign(artifact, payload, scoped, { updatedBy: req.user._id });
  await artifact.save();

  await logAction({
    actor: req.user._id,
    action: 'UPDATE_EVIDENCE_ARTIFACT',
    entityType: 'EvidenceArtifact',
    entityId: artifact._id.toString(),
    metadata: {
      status: artifact.status,
      visibility: artifact.visibility
    }
  });

  const updatedArtifact = await populateArtifactQuery(EvidenceArtifact.findById(artifact._id));
  return success(res, { artifact: updatedArtifact }, 'Evidence artifact updated.');
});

const downloadEvidenceArtifact = asyncHandler(async (req, res) => {
  const artifact = await getArtifactForUser(req.user, req.params.artifactId);
  const absolutePath = buildStoredArtifactPath(artifact);

  if (!fs.existsSync(absolutePath)) {
    res.status(404);
    throw new Error('Stored evidence file was not found.');
  }

  await logAction({
    actor: req.user._id,
    action: 'DOWNLOAD_EVIDENCE_ARTIFACT',
    entityType: 'EvidenceArtifact',
    entityId: artifact._id.toString(),
    metadata: {
      filename: artifact.file.originalName
    }
  });

  res.download(absolutePath, artifact.file.originalName);
});

const listEvidenceSampleSets = asyncHandler(async (req, res) => {
  const sampleSets = await listSampleSetsForUser(req.user, req.query);
  return success(res, { sampleSets }, 'Evidence sample sets fetched.');
});

const createEvidenceSampleSet = asyncHandler(async (req, res) => {
  ensureEvidenceManager(req.user);

  const payload = sanitizeSampleSetPayload(req.body);
  const scoped = await validateSampleSetPayload(payload);
  const sampledArtifacts = buildSampledArtifacts(payload);
  await validateArtifactSelection(sampledArtifacts.map((item) => item.artifact));

  const sampleSet = await EvidenceSampleSet.create({
    ...payload,
    ...scoped,
    sampledArtifacts,
    createdBy: req.user._id,
    updatedBy: req.user._id
  });

  await logAction({
    actor: req.user._id,
    action: 'CREATE_EVIDENCE_SAMPLE_SET',
    entityType: 'EvidenceSampleSet',
    entityId: sampleSet._id.toString(),
    metadata: {
      artifactCount: sampledArtifacts.length,
      groupBy: sampleSet.groupBy,
      reviewer: sampleSet.reviewer?.toString() || null
    }
  });

  const createdSampleSet = await populateSampleSetQuery(EvidenceSampleSet.findById(sampleSet._id));
  return success(res, { sampleSet: createdSampleSet }, 'Evidence sample set created.', 201);
});

const getEvidenceSampleSet = asyncHandler(async (req, res) => {
  const sampleSet = await getSampleSetForUser(req.user, req.params.sampleSetId);
  return success(res, { sampleSet }, 'Evidence sample set fetched.');
});

const updateEvidenceSampleSet = asyncHandler(async (req, res) => {
  ensureEvidenceManager(req.user);

  const sampleSet = await getSampleSetForUser(req.user, req.params.sampleSetId);
  const payload = sanitizeSampleSetPayload({
    title: req.body.title ?? sampleSet.title,
    description: req.body.description ?? sampleSet.description,
    academicTerm: req.body.academicTerm ?? sampleSet.academicTerm,
    groupBy: req.body.groupBy ?? sampleSet.groupBy,
    department: req.body.department ?? sampleSet.department?._id ?? sampleSet.department,
    program: req.body.program ?? sampleSet.program?._id ?? sampleSet.program,
    course: req.body.course ?? sampleSet.course?._id ?? sampleSet.course,
    outcomeType: req.body.outcomeType ?? sampleSet.outcomeType,
    outcomeCode: req.body.outcomeCode ?? sampleSet.outcomeCode,
    reviewer: req.body.reviewer ?? sampleSet.reviewer?._id ?? sampleSet.reviewer,
    status: req.body.status ?? sampleSet.status,
    artifactIds:
      req.body.artifactIds ??
      (sampleSet.sampledArtifacts || []).map((item) => item.artifact?._id || item.artifact),
    sampledArtifacts:
      req.body.sampledArtifacts ??
      (sampleSet.sampledArtifacts || []).map((item) => ({
        artifact: item.artifact?._id || item.artifact,
        reviewStatus: item.reviewStatus,
        reviewNote: item.reviewNote,
        reviewedAt: item.reviewedAt
      }))
  });
  const scoped = await validateSampleSetPayload(payload);
  const sampledArtifacts = buildSampledArtifacts(payload);
  await validateArtifactSelection(sampledArtifacts.map((item) => item.artifact));

  Object.assign(sampleSet, payload, scoped, {
    sampledArtifacts,
    updatedBy: req.user._id
  });
  await sampleSet.save();

  await logAction({
    actor: req.user._id,
    action: 'UPDATE_EVIDENCE_SAMPLE_SET',
    entityType: 'EvidenceSampleSet',
    entityId: sampleSet._id.toString(),
    metadata: {
      artifactCount: sampledArtifacts.length,
      status: sampleSet.status
    }
  });

  const updatedSampleSet = await populateSampleSetQuery(EvidenceSampleSet.findById(sampleSet._id));
  return success(res, { sampleSet: updatedSampleSet }, 'Evidence sample set updated.');
});

const updateEvidenceSampleReview = asyncHandler(async (req, res) => {
  const sampleSet = await getSampleSetForUser(req.user, req.params.sampleSetId);
  validateReviewerAccess(req.user, sampleSet);

  if (sampleSet.status === 'archived') {
    res.status(400);
    throw new Error('Archived sample sets cannot be reviewed.');
  }

  const artifactId = String(req.body?.artifactId || '');
  const reviewStatus = String(req.body?.reviewStatus || '').toLowerCase();
  const reviewNote = String(req.body?.reviewNote || '').trim();

  if (!artifactId) {
    res.status(400);
    throw new Error('artifactId is required.');
  }

  if (!['pending', 'in_review', 'reviewed', 'flagged'].includes(reviewStatus)) {
    res.status(400);
    throw new Error('Invalid review status.');
  }

  const item = sampleSet.sampledArtifacts.find((entry) => String(entry.artifact?._id || entry.artifact) === artifactId);

  if (!item) {
    res.status(404);
    throw new Error('Artifact is not part of this sample set.');
  }

  item.reviewStatus = reviewStatus;
  item.reviewNote = reviewNote;
  item.reviewedAt = reviewStatus === 'reviewed' || reviewStatus === 'flagged' ? new Date() : null;

  if (sampleSet.sampledArtifacts.every((entry) => entry.reviewStatus === 'reviewed')) {
    sampleSet.status = 'reviewed';
  } else if (
    sampleSet.sampledArtifacts.some((entry) =>
      ['in_review', 'reviewed', 'flagged'].includes(entry.reviewStatus)
    )
  ) {
    sampleSet.status = 'in_review';
  } else {
    sampleSet.status = 'draft';
  }

  sampleSet.updatedBy = req.user._id;
  await sampleSet.save();

  await logAction({
    actor: req.user._id,
    action: 'REVIEW_EVIDENCE_SAMPLE_ARTIFACT',
    entityType: 'EvidenceSampleSet',
    entityId: sampleSet._id.toString(),
    metadata: {
      artifactId,
      reviewStatus
    }
  });

  const updatedSampleSet = await populateSampleSetQuery(EvidenceSampleSet.findById(sampleSet._id));
  return success(res, { sampleSet: updatedSampleSet }, 'Evidence sample review updated.');
});

const deleteEvidenceSampleSet = asyncHandler(async (req, res) => {
  ensureEvidenceManager(req.user);

  const sampleSet = await getSampleSetForUser(req.user, req.params.sampleSetId);
  await sampleSet.deleteOne();

  await logAction({
    actor: req.user._id,
    action: 'DELETE_EVIDENCE_SAMPLE_SET',
    entityType: 'EvidenceSampleSet',
    entityId: sampleSet._id.toString()
  });

  return success(res, {}, 'Evidence sample set deleted.');
});

module.exports = {
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
};
