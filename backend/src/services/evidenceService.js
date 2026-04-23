const fs = require('fs');
const path = require('path');
const Course = require('../models/Course');
const Assessment = require('../models/Assessment');
const Program = require('../models/Program');
const User = require('../models/User');
const EvidenceArtifact = require('../models/EvidenceArtifact');
const EvidenceSampleSet = require('../models/EvidenceSampleSet');
const { evidenceUploadRoot } = require('../middleware/uploadMiddleware');

const normalizeText = (value = '') => String(value || '').trim();
const normalizeCode = (value = '') => normalizeText(value).toUpperCase();
const parseId = (value) => {
  if (!value) return undefined;

  if (typeof value === 'object') {
    if (value._id) {
      return String(value._id);
    }

    return undefined;
  }

  const next = normalizeText(value);
  return next || undefined;
};

const populateArtifactQuery = (query) =>
  query
    .populate('course', 'name code semester department program faculty')
    .populate('assessment', 'title type course')
    .populate('student', 'name email studentId')
    .populate('department', 'name code')
    .populate('program', 'name code department')
    .populate('uploader', 'name email role facultyId')
    .populate('updatedBy', 'name email role');

const populateSampleSetQuery = (query) =>
  query
    .populate('department', 'name code')
    .populate('program', 'name code department')
    .populate('course', 'name code semester')
    .populate('reviewer', 'name email role facultyId')
    .populate('createdBy', 'name email role')
    .populate('updatedBy', 'name email role')
    .populate({
      path: 'sampledArtifacts.artifact',
      populate: [
        { path: 'course', select: 'name code semester department program faculty' },
        { path: 'assessment', select: 'title type course' },
        { path: 'student', select: 'name email studentId' },
        { path: 'uploader', select: 'name email role facultyId' },
        { path: 'department', select: 'name code' },
        { path: 'program', select: 'name code department' }
      ]
    });

const sanitizeArtifactPayload = (payload = {}) => ({
  title: normalizeText(payload.title),
  description: normalizeText(payload.description),
  evidenceType: normalizeText(payload.evidenceType || 'other').toLowerCase(),
  academicTerm: normalizeText(payload.academicTerm),
  course: parseId(payload.course),
  assessment: parseId(payload.assessment),
  student: parseId(payload.student),
  department: parseId(payload.department),
  program: parseId(payload.program),
  outcomeType: normalizeCode(payload.outcomeType),
  outcomeCode: normalizeCode(payload.outcomeCode),
  status: normalizeText(payload.status || 'active').toLowerCase(),
  visibility: normalizeText(payload.visibility || 'department').toLowerCase()
});

const sanitizeSampleSetPayload = (payload = {}) => ({
  title: normalizeText(payload.title),
  description: normalizeText(payload.description),
  academicTerm: normalizeText(payload.academicTerm),
  groupBy: normalizeText(payload.groupBy || 'custom').toLowerCase(),
  department: parseId(payload.department),
  program: parseId(payload.program),
  course: parseId(payload.course),
  outcomeType: normalizeCode(payload.outcomeType),
  outcomeCode: normalizeCode(payload.outcomeCode),
  reviewer: parseId(payload.reviewer),
  status: normalizeText(payload.status || 'draft').toLowerCase(),
  artifactIds: Array.from(new Set((Array.isArray(payload.artifactIds) ? payload.artifactIds : []).map((item) => parseId(item)).filter(Boolean))),
  sampledArtifacts: Array.isArray(payload.sampledArtifacts)
    ? payload.sampledArtifacts
        .map((item) => ({
          artifact: parseId(item?.artifact),
          reviewStatus: normalizeText(item?.reviewStatus || 'pending').toLowerCase(),
          reviewNote: normalizeText(item?.reviewNote),
          reviewedAt: item?.reviewedAt ? new Date(item.reviewedAt) : undefined
        }))
        .filter((item) => item.artifact)
    : []
});

const hydrateArtifactScope = async (payload) => {
  const scoped = {
    course: payload.course,
    assessment: payload.assessment,
    student: payload.student,
    department: payload.department,
    program: payload.program
  };

  if (scoped.assessment) {
    const assessment = await Assessment.findById(scoped.assessment).select('course');

    if (!assessment) {
      const error = new Error('Linked assessment not found.');
      error.statusCode = 404;
      throw error;
    }

    scoped.course = String(assessment.course || scoped.course || '');
  }

  if (scoped.course) {
    const course = await Course.findById(scoped.course).select('department program faculty');

    if (!course) {
      const error = new Error('Linked course not found.');
      error.statusCode = 404;
      throw error;
    }

    scoped.department = String(course.department || scoped.department || '');
    scoped.program = String(course.program || scoped.program || '');
    scoped.courseFaculty = course.faculty ? String(course.faculty) : '';
  }

  if (scoped.program) {
    const program = await Program.findById(scoped.program).select('department');

    if (!program) {
      const error = new Error('Linked program not found.');
      error.statusCode = 404;
      throw error;
    }

    scoped.department = String(program.department || scoped.department || '');
  }

  if (scoped.student) {
    const student = await User.findById(scoped.student).select('role');

    if (!student || student.role !== 'student') {
      const error = new Error('Linked student not found.');
      error.statusCode = 404;
      throw error;
    }
  }

  return scoped;
};

const validateArtifactPayload = async (payload, { requireFile = false } = {}) => {
  if (!payload.title) {
    const error = new Error('Evidence title is required.');
    error.statusCode = 400;
    throw error;
  }

  if (!['report', 'project', 'presentation', 'lab_document', 'capstone', 'assessment_evidence', 'other'].includes(payload.evidenceType)) {
    const error = new Error('Invalid evidence type.');
    error.statusCode = 400;
    throw error;
  }

  if (!['active', 'archived'].includes(payload.status)) {
    const error = new Error('Evidence status must be active or archived.');
    error.statusCode = 400;
    throw error;
  }

  if (!['private', 'department', 'institution'].includes(payload.visibility)) {
    const error = new Error('Visibility must be private, department, or institution.');
    error.statusCode = 400;
    throw error;
  }

  if (!['', 'CLO', 'PLO'].includes(payload.outcomeType)) {
    const error = new Error('Outcome type must be blank, CLO, or PLO.');
    error.statusCode = 400;
    throw error;
  }

  if (payload.outcomeType && !payload.outcomeCode) {
    const error = new Error('Outcome code is required when outcome type is selected.');
    error.statusCode = 400;
    throw error;
  }

  if (requireFile === true && !payload.file) {
    const error = new Error('An evidence file is required.');
    error.statusCode = 400;
    throw error;
  }

  return hydrateArtifactScope(payload);
};

const buildArtifactFilePayloadFromFile = (file) => ({
  originalName: file.originalname,
  filename: file.filename,
  relativePath: `evidence/${file.filename}`.replace(/\\/g, '/'),
  mimeType: file.mimetype || 'application/octet-stream',
  size: file.size || 0,
  uploadedAt: new Date()
});

const buildArtifactVisibilityFilter = async (user) => {
  if (user.role === 'accreditation_officer') {
    return {};
  }

  if (user.role === 'admin') {
    return {};
  }

  if (user.role === 'head') {
    return user.department
      ? {
          $or: [
            { department: user.department },
            { visibility: 'institution' }
          ]
        }
      : { visibility: 'institution' };
  }

  if (user.role === 'faculty') {
    const ownedCourses = await Course.find({ faculty: user._id }).select('_id');
    const reviewerSets = await EvidenceSampleSet.find({ reviewer: user._id }).select('sampledArtifacts.artifact').lean();
    const reviewerArtifactIds = reviewerSets.flatMap((set) => (set.sampledArtifacts || []).map((item) => item.artifact));

    return {
      $or: [
        { uploader: user._id },
        { course: { $in: ownedCourses.map((item) => item._id) } },
        { _id: { $in: reviewerArtifactIds } }
      ]
    };
  }

  const error = new Error('You are not allowed to access evidence artifacts.');
  error.statusCode = 403;
  throw error;
};

const applyArtifactFilters = (baseFilter, query = {}) => {
  const filter = { ...baseFilter };

  if (query.departmentId) filter.department = query.departmentId;
  if (query.programId) filter.program = query.programId;
  if (query.courseId) filter.course = query.courseId;
  if (query.assessmentId) filter.assessment = query.assessmentId;
  if (query.studentId) filter.student = query.studentId;
  if (query.evidenceType) filter.evidenceType = String(query.evidenceType).toLowerCase();
  if (query.outcomeType) filter.outcomeType = String(query.outcomeType).toUpperCase();
  if (query.outcomeCode) filter.outcomeCode = normalizeCode(query.outcomeCode);
  if (query.status) filter.status = String(query.status).toLowerCase();
  if (query.visibility) filter.visibility = String(query.visibility).toLowerCase();
  if (query.academicTerm) filter.academicTerm = normalizeText(query.academicTerm);
  if (query.uploaderId) filter.uploader = query.uploaderId;

  return filter;
};

const buildSampleSetVisibilityFilter = async (user) => {
  if (user.role === 'accreditation_officer') {
    return {};
  }

  if (user.role === 'admin') {
    return {};
  }

  if (user.role === 'head') {
    return user.department
      ? {
          $or: [
            { department: user.department },
            { reviewer: user._id }
          ]
        }
      : { reviewer: user._id };
  }

  if (user.role === 'faculty') {
    const ownedCourses = await Course.find({ faculty: user._id }).select('_id');

    return {
      $or: [
        { reviewer: user._id },
        { course: { $in: ownedCourses.map((item) => item._id) } }
      ]
    };
  }

  const error = new Error('You are not allowed to access sample sets.');
  error.statusCode = 403;
  throw error;
};

const applySampleSetFilters = (baseFilter, query = {}) => {
  const filter = { ...baseFilter };

  if (query.departmentId) filter.department = query.departmentId;
  if (query.programId) filter.program = query.programId;
  if (query.courseId) filter.course = query.courseId;
  if (query.reviewerId) filter.reviewer = query.reviewerId;
  if (query.groupBy) filter.groupBy = String(query.groupBy).toLowerCase();
  if (query.status) filter.status = String(query.status).toLowerCase();
  if (query.outcomeType) filter.outcomeType = String(query.outcomeType).toUpperCase();
  if (query.outcomeCode) filter.outcomeCode = normalizeCode(query.outcomeCode);
  if (query.academicTerm) filter.academicTerm = normalizeText(query.academicTerm);

  return filter;
};

const listArtifactsForUser = async (user, query = {}) => {
  const baseFilter = await buildArtifactVisibilityFilter(user);
  const filter = applyArtifactFilters(baseFilter, query);
  const artifacts = await populateArtifactQuery(EvidenceArtifact.find(filter)).sort({ createdAt: -1 });

  return artifacts.map((artifact) => ({
    ...artifact.toObject(),
    canEdit: user.role === 'accreditation_officer' || String(artifact.uploader?._id || artifact.uploader) === String(user._id)
  }));
};

const getArtifactForUser = async (user, id) => {
  const baseFilter = await buildArtifactVisibilityFilter(user);
  const artifact = await populateArtifactQuery(EvidenceArtifact.findOne({ ...baseFilter, _id: id }));

  if (!artifact) {
    const error = new Error('Evidence artifact not found.');
    error.statusCode = 404;
    throw error;
  }

  return artifact;
};

const buildStoredArtifactPath = (artifact) => path.join(evidenceUploadRoot, path.basename(artifact.file.filename));

const validateFacultyArtifactWrite = (user, scoped) => {
  if (user.role !== 'faculty') {
    return;
  }

  if (!scoped.course) {
    const error = new Error('Faculty evidence must be linked to one of your assigned courses or assessments.');
    error.statusCode = 400;
    throw error;
  }

  if (!scoped.courseFaculty || scoped.courseFaculty !== String(user._id)) {
    const error = new Error('Faculty can only upload evidence for their own courses.');
    error.statusCode = 403;
    throw error;
  }
};

const validateSampleSetPayload = async (payload) => {
  if (!payload.title) {
    const error = new Error('Sample set title is required.');
    error.statusCode = 400;
    throw error;
  }

  if (!['course', 'program', 'term', 'outcome', 'custom'].includes(payload.groupBy)) {
    const error = new Error('Invalid sample grouping selection.');
    error.statusCode = 400;
    throw error;
  }

  if (!['draft', 'in_review', 'reviewed', 'archived'].includes(payload.status)) {
    const error = new Error('Invalid sample set status.');
    error.statusCode = 400;
    throw error;
  }

  if (!['', 'CLO', 'PLO'].includes(payload.outcomeType)) {
    const error = new Error('Outcome type must be blank, CLO, or PLO.');
    error.statusCode = 400;
    throw error;
  }

  if (payload.outcomeType && !payload.outcomeCode) {
    const error = new Error('Outcome code is required when outcome type is selected.');
    error.statusCode = 400;
    throw error;
  }

  if (payload.reviewer) {
    const reviewer = await User.findById(payload.reviewer).select('role isActive');

    if (!reviewer || reviewer.isActive === false) {
      const error = new Error('Assigned reviewer was not found.');
      error.statusCode = 404;
      throw error;
    }

    if (reviewer.role === 'student') {
      const error = new Error('Students cannot be assigned as evidence reviewers.');
      error.statusCode = 400;
      throw error;
    }
  }

  const hydrated = await hydrateArtifactScope(payload);

  return {
    department: hydrated.department || payload.department,
    program: hydrated.program || payload.program,
    course: hydrated.course || payload.course
  };
};

const buildSampledArtifacts = (payload) => {
  if (payload.sampledArtifacts.length) {
    return payload.sampledArtifacts.map((item) => ({
      artifact: item.artifact,
      reviewStatus: ['pending', 'in_review', 'reviewed', 'flagged'].includes(item.reviewStatus)
        ? item.reviewStatus
        : 'pending',
      reviewNote: item.reviewNote,
      reviewedAt:
        item.reviewStatus === 'reviewed' || item.reviewStatus === 'flagged'
          ? item.reviewedAt || new Date()
          : undefined
    }));
  }

  return payload.artifactIds.map((artifactId) => ({
    artifact: artifactId,
    reviewStatus: 'pending',
    reviewNote: ''
  }));
};

const validateArtifactSelection = async (artifactIds = []) => {
  const normalizedIds = Array.from(new Set((artifactIds || []).map((item) => parseId(item)).filter(Boolean)));

  if (!normalizedIds.length) {
    const error = new Error('At least one artifact must be selected for a sample set.');
    error.statusCode = 400;
    throw error;
  }

  const artifacts = await EvidenceArtifact.find({ _id: { $in: normalizedIds } }).select('_id');

  if (artifacts.length !== normalizedIds.length) {
    const error = new Error('One or more selected artifacts were not found.');
    error.statusCode = 404;
    throw error;
  }
};

const listSampleSetsForUser = async (user, query = {}) => {
  const baseFilter = await buildSampleSetVisibilityFilter(user);
  const filter = applySampleSetFilters(baseFilter, query);
  const sampleSets = await populateSampleSetQuery(EvidenceSampleSet.find(filter)).sort({ updatedAt: -1 });

  return sampleSets.map((item) => {
    const sampledArtifacts = item.sampledArtifacts || [];
    const reviewedCount = sampledArtifacts.filter((entry) => entry.reviewStatus === 'reviewed').length;
    const flaggedCount = sampledArtifacts.filter((entry) => entry.reviewStatus === 'flagged').length;

    return {
      ...item.toObject(),
      totalArtifacts: sampledArtifacts.length,
      reviewedCount,
      flaggedCount
    };
  });
};

const getSampleSetForUser = async (user, id) => {
  const baseFilter = await buildSampleSetVisibilityFilter(user);
  const sampleSet = await populateSampleSetQuery(EvidenceSampleSet.findOne({ ...baseFilter, _id: id }));

  if (!sampleSet) {
    const error = new Error('Evidence sample set not found.');
    error.statusCode = 404;
    throw error;
  }

  return sampleSet;
};

const validateReviewerAccess = (user, sampleSet) => {
  if (user.role === 'accreditation_officer') {
    return;
  }

  if (String(sampleSet.reviewer?._id || sampleSet.reviewer) === String(user._id)) {
    return;
  }

  const error = new Error('You are not allowed to update this review workflow.');
  error.statusCode = 403;
  throw error;
};

module.exports = {
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
};
