const Marks = require('../models/Marks');
const Assessment = require('../models/Assessment');
const { sendSuccess, sendError, parsePaginationParams, getPagination } = require('../utils/responseUtils');
const { MESSAGES } = require('../config/constants');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Get all marks
 * @route   GET /api/marks
 * @access  Private
 */
const getAllMarks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePaginationParams(req.query);
  const { student, assessment } = req.query;

  const filter = {};
  if (student) filter.student = student;
  if (assessment) filter.assessment = assessment;

  const total = await Marks.countDocuments(filter);
  const marks = await Marks.find(filter)
    .populate('student', 'name email studentId')
    .populate('assessment', 'title type totalMarks course')
    .populate({
      path: 'assessment',
      populate: { path: 'course', select: 'name code' }
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const pagination = getPagination(page, limit, total);

  sendSuccess(res, 200, MESSAGES.SUCCESS.FETCHED, {
    marks,
    pagination,
  });
});

/**
 * @desc    Get marks by student
 * @route   GET /api/marks/student/:studentId
 * @access  Private
 */
const getMarksByStudent = asyncHandler(async (req, res) => {
  const marks = await Marks.find({ student: req.params.studentId })
    .populate('assessment', 'title type totalMarks course date weightage')
    .populate({
      path: 'assessment',
      populate: { path: 'course', select: 'name code' }
    })
    .sort({ createdAt: -1 });

  sendSuccess(res, 200, MESSAGES.SUCCESS.FETCHED, marks);
});

/**
 * @desc    Get marks by assessment
 * @route   GET /api/marks/assessment/:assessmentId
 * @access  Private (Faculty only)
 */
const getMarksByAssessment = asyncHandler(async (req, res) => {
  const marks = await Marks.find({ assessment: req.params.assessmentId })
    .populate('student', 'name email studentId')
    .sort({ 'student.name': 1 });

  sendSuccess(res, 200, MESSAGES.SUCCESS.FETCHED, marks);
});

/**
 * @desc    Submit marks
 * @route   POST /api/marks
 * @access  Private (Faculty only)
 */
const submitMarks = asyncHandler(async (req, res) => {
  // Add submittedBy field
  req.body.submittedBy = req.user._id;

  const marks = await Marks.create(req.body);
  await marks.populate('student', 'name email studentId');
  await marks.populate('assessment', 'title type totalMarks');

  sendSuccess(res, 201, 'Marks submitted successfully', marks);
});

/**
 * @desc    Update marks
 * @route   PUT /api/marks/:id
 * @access  Private (Faculty only)
 */
const updateMarks = asyncHandler(async (req, res) => {
  let marks = await Marks.findById(req.params.id);

  if (!marks) {
    return sendError(res, 404, MESSAGES.ERROR.NOT_FOUND);
  }

  marks = await Marks.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate('student', 'name email studentId')
    .populate('assessment', 'title type totalMarks');

  sendSuccess(res, 200, MESSAGES.SUCCESS.UPDATED, marks);
});

/**
 * @desc    Delete marks
 * @route   DELETE /api/marks/:id
 * @access  Private (Faculty only)
 */
const deleteMarks = asyncHandler(async (req, res) => {
  const marks = await Marks.findById(req.params.id);

  if (!marks) {
    return sendError(res, 404, MESSAGES.ERROR.NOT_FOUND);
  }

  await marks.deleteOne();
  sendSuccess(res, 200, MESSAGES.SUCCESS.DELETED);
});

/**
 * @desc    Bulk submit marks
 * @route   POST /api/marks/bulk
 * @access  Private (Faculty only)
 */
const bulkSubmitMarks = asyncHandler(async (req, res) => {
  const { assessmentId, marksData } = req.body;

  if (!assessmentId || !marksData || !Array.isArray(marksData)) {
    return sendError(res, 400, 'Invalid request data');
  }

  // Verify assessment exists
  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) {
    return sendError(res, 404, 'Assessment not found');
  }

  const marksToInsert = marksData.map(mark => ({
    ...mark,
    assessment: assessmentId,
    submittedBy: req.user._id,
  }));

  const marks = await Marks.insertMany(marksToInsert, { ordered: false });

  sendSuccess(res, 201, `${marks.length} marks submitted successfully`, marks);
});

module.exports = {
  getAllMarks,
  getMarksByStudent,
  getMarksByAssessment,
  submitMarks,
  updateMarks,
  deleteMarks,
  bulkSubmitMarks,
};
