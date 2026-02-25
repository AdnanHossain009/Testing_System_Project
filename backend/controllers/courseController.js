const Course = require('../models/Course');
const { sendSuccess, sendError, parsePaginationParams, getPagination } = require('../utils/responseUtils');
const { MESSAGES } = require('../config/constants');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Get all courses
 * @route   GET /api/courses
 * @access  Private
 */
const getAllCourses = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePaginationParams(req.query);
  const { program, faculty, isActive } = req.query;

  const filter = {};
  if (program) filter.program = program;
  if (faculty) filter.faculty = faculty;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const total = await Course.countDocuments(filter);
  const courses = await Course.find(filter)
    .populate('program', 'name code')
    .populate('faculty', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const pagination = getPagination(page, limit, total);

  sendSuccess(res, 200, MESSAGES.SUCCESS.FETCHED, {
    courses,
    pagination,
  });
});

/**
 * @desc    Get single course
 * @route   GET /api/courses/:id
 * @access  Private
 */
const getCourseById = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate('program', 'name code plos')
    .populate('faculty', 'name email');

  if (!course) {
    return sendError(res, 404, MESSAGES.ERROR.NOT_FOUND);
  }

  sendSuccess(res, 200, MESSAGES.SUCCESS.FETCHED, course);
});

/**
 * @desc    Create new course
 * @route   POST /api/courses
 * @access  Private (Admin, Faculty)
 */
const createCourse = asyncHandler(async (req, res) => {
  const course = await Course.create(req.body);
  await course.populate('program', 'name code');
  
  sendSuccess(res, 201, MESSAGES.SUCCESS.CREATED, course);
});

/**
 * @desc    Update course
 * @route   PUT /api/courses/:id
 * @access  Private (Admin, Faculty)
 */
const updateCourse = asyncHandler(async (req, res) => {
  let course = await Course.findById(req.params.id);

  if (!course) {
    return sendError(res, 404, MESSAGES.ERROR.NOT_FOUND);
  }

  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('program', 'name code');

  sendSuccess(res, 200, MESSAGES.SUCCESS.UPDATED, course);
});

/**
 * @desc    Delete course
 * @route   DELETE /api/courses/:id
 * @access  Private (Admin only)
 */
const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return sendError(res, 404, MESSAGES.ERROR.NOT_FOUND);
  }

  await course.deleteOne();
  sendSuccess(res, 200, MESSAGES.SUCCESS.DELETED);
});

/**
 * @desc    Add CLO to course
 * @route   POST /api/courses/:id/clos
 * @access  Private (Admin, Faculty)
 */
const addCLO = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return sendError(res, 404, MESSAGES.ERROR.NOT_FOUND);
  }

  course.clos.push(req.body);
  await course.save();

  sendSuccess(res, 201, 'CLO added successfully', course);
});

/**
 * @desc    Update CLO
 * @route   PUT /api/courses/:id/clos/:cloId
 * @access  Private (Admin, Faculty)
 */
const updateCLO = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return sendError(res, 404, MESSAGES.ERROR.NOT_FOUND);
  }

  const clo = course.clos.id(req.params.cloId);
  if (!clo) {
    return sendError(res, 404, 'CLO not found');
  }

  Object.assign(clo, req.body);
  await course.save();

  sendSuccess(res, 200, 'CLO updated successfully', course);
});

/**
 * @desc    Delete CLO
 * @route   DELETE /api/courses/:id/clos/:cloId
 * @access  Private (Admin, Faculty)
 */
const deleteCLO = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return sendError(res, 404, MESSAGES.ERROR.NOT_FOUND);
  }

  course.clos.pull(req.params.cloId);
  await course.save();

  sendSuccess(res, 200, 'CLO deleted successfully', course);
});

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  addCLO,
  updateCLO,
  deleteCLO,
};
