const Assessment = require('../models/Assessment');
const Course = require('../models/Course');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { logAction } = require('../services/auditService');

const listAssessments = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.courseId) filter.course = req.query.courseId;

  const assessments = await Assessment.find(filter)
    .populate('course', 'name code')
    .populate('createdBy', 'name email');

  return success(res, { assessments }, 'Assessments fetched.');
});

const createAssessment = asyncHandler(async (req, res) => {
  const {
    course,
    title,
    type,
    cloCodes = [],
    cloDistribution = [],
    rubricCriteria = [],
    totalMarks,
    weightage,
    dueDate
  } = req.body;

  if (!course || !title || !type || !totalMarks || !weightage) {
    res.status(400);
    throw new Error('Course, title, type, totalMarks and weightage are required.');
  }

  const courseDoc = await Course.findById(course);
  if (!courseDoc) {
    res.status(404);
    throw new Error('Course not found.');
  }

  if (req.user.role === 'faculty' && String(courseDoc.faculty) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only create assessments for your own course.');
  }

  const assessment = await Assessment.create({
    course,
    title,
    type,
    cloCodes,
    cloDistribution,
    rubricCriteria,
    totalMarks,
    weightage,
    dueDate,
    createdBy: req.user._id
  });

  await logAction({
    actor: req.user._id,
    action: 'CREATE_ASSESSMENT',
    entityType: 'Assessment',
    entityId: assessment._id.toString(),
    metadata: { type, cloCodes }
  });

  return success(res, { assessment }, 'Assessment created.', 201);
});

module.exports = { listAssessments, createAssessment };
