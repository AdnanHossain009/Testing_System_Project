const Assessment = require('../models/Assessment');
const { sendSuccess, sendError, parsePaginationParams, getPagination } = require('../utils/responseUtils');
const { MESSAGES } = require('../config/constants');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Get all assessments
 * @route   GET /api/assessments
 * @access  Private
 */
const getAllAssessments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePaginationParams(req.query);
  const { course, type, isPublished } = req.query;

  const filter = {};
  if (course) filter.course = course;
  if (type) filter.type = type;
  if (isPublished !== undefined) filter.isPublished = isPublished === 'true';

  const total = await Assessment.countDocuments(filter);
  const assessments = await Assessment.find(filter)
    .populate('course', 'name code')
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit);

  const pagination = getPagination(page, limit, total);

  sendSuccess(res, 200, MESSAGES.SUCCESS.FETCHED, {
    assessments,
    pagination,
  });
});

/**
 * @desc    Get single assessment
 * @route   GET /api/assessments/:id
 * @access  Private
 */
const getAssessmentById = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findById(req.params.id)
    .populate('course', 'name code clos');

  if (!assessment) {
    return sendError(res, 404, MESSAGES.ERROR.NOT_FOUND);
  }

  sendSuccess(res, 200, MESSAGES.SUCCESS.FETCHED, assessment);
});

/**
 * @desc    Create new assessment
 * @route   POST /api/assessments
 * @access  Private (Faculty only)
 */
const createAssessment = asyncHandler(async (req, res) => {
  const assessment = await Assessment.create(req.body);
  await assessment.populate('course', 'name code');
  
  sendSuccess(res, 201, MESSAGES.SUCCESS.CREATED, assessment);
});

/**
 * @desc    Update assessment
 * @route   PUT /api/assessments/:id
 * @access  Private (Faculty only)
 */
const updateAssessment = asyncHandler(async (req, res) => {
  let assessment = await Assessment.findById(req.params.id);

  if (!assessment) {
    return sendError(res, 404, MESSAGES.ERROR.NOT_FOUND);
  }

  assessment = await Assessment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('course', 'name code');

  sendSuccess(res, 200, MESSAGES.SUCCESS.UPDATED, assessment);
});

/**
 * @desc    Delete assessment
 * @route   DELETE /api/assessments/:id
 * @access  Private (Faculty only)
 */
const deleteAssessment = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findById(req.params.id);

  if (!assessment) {
    return sendError(res, 404, MESSAGES.ERROR.NOT_FOUND);
  }

  await assessment.deleteOne();
  sendSuccess(res, 200, MESSAGES.SUCCESS.DELETED);
});

/**
 * @desc    Publish assessment
 * @route   PATCH /api/assessments/:id/publish
 * @access  Private (Faculty only)
 */
const publishAssessment = asyncHandler(async (req, res) => {
  const assessment = await Assessment.findById(req.params.id);

  if (!assessment) {
    return sendError(res, 404, MESSAGES.ERROR.NOT_FOUND);
  }

  assessment.isPublished = true;
  await assessment.save();

  sendSuccess(res, 200, 'Assessment published successfully', assessment);
});

module.exports = {
  getAllAssessments,
  getAssessmentById,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  publishAssessment,
};
