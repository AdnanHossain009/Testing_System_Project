const {
  calculateOutcomeResult,
  getStudentOutcomes,
  getCourseOutcomes,
  getStudentsAtRisk,
  getCourseCLOStatistics,
  getProgramPLOStatistics,
  getAdminDashboard,
  getFacultyDashboard,
  getStudentDashboard,
} = require('../services');
const { sendSuccess, sendError } = require('../utils/responseUtils');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Get admin dashboard
 * @route   GET /api/analytics/admin/dashboard
 * @access  Private (Admin only)
 */
const getAdminDashboardAnalytics = asyncHandler(async (req, res) => {
  const stats = await getAdminDashboard();
  sendSuccess(res, 200, 'Dashboard data fetched successfully', stats);
});

/**
 * @desc    Get faculty dashboard
 * @route   GET /api/analytics/faculty/dashboard
 * @access  Private (Faculty only)
 */
const getFacultyDashboardAnalytics = asyncHandler(async (req, res) => {
  const stats = await getFacultyDashboard(req.user._id);
  sendSuccess(res, 200, 'Dashboard data fetched successfully', stats);
});

/**
 * @desc    Get student dashboard
 * @route   GET /api/analytics/student/dashboard
 * @access  Private (Student only)
 */
const getStudentDashboardAnalytics = asyncHandler(async (req, res) => {
  const stats = await getStudentDashboard(req.user._id);
  sendSuccess(res, 200, 'Dashboard data fetched successfully', stats);
});

/**
 * @desc    Calculate outcome result for a student
 * @route   POST /api/analytics/outcomes/calculate
 * @access  Private (Faculty, Admin)
 */
const calculateOutcome = asyncHandler(async (req, res) => {
  const { studentId, courseId, semester } = req.body;

  if (!studentId || !courseId || !semester) {
    return sendError(res, 400, 'Please provide studentId, courseId, and semester');
  }

  const outcome = await calculateOutcomeResult(studentId, courseId, semester);
  sendSuccess(res, 200, 'Outcome calculated successfully', outcome);
});

/**
 * @desc    Get student outcomes
 * @route   GET /api/analytics/outcomes/student/:studentId
 * @access  Private
 */
const getStudentOutcomeResults = asyncHandler(async (req, res) => {
  const outcomes = await getStudentOutcomes(req.params.studentId);
  sendSuccess(res, 200, 'Student outcomes fetched successfully', outcomes);
});

/**
 * @desc    Get course outcomes
 * @route   GET /api/analytics/outcomes/course/:courseId
 * @access  Private (Faculty, Admin)
 */
const getCourseOutcomeResults = asyncHandler(async (req, res) => {
  const outcomes = await getCourseOutcomes(req.params.courseId);
  sendSuccess(res, 200, 'Course outcomes fetched successfully', outcomes);
});

/**
 * @desc    Get students at risk
 * @route   GET /api/analytics/at-risk
 * @access  Private (Faculty, Admin)
 */
const getAtRiskStudents = asyncHandler(async (req, res) => {
  const { courseId } = req.query;
  const students = await getStudentsAtRisk(courseId);
  sendSuccess(res, 200, 'At-risk students fetched successfully', students);
});

/**
 * @desc    Get CLO statistics for a course
 * @route   GET /api/analytics/clo/:courseId
 * @access  Private (Faculty, Admin)
 */
const getCLOStatistics = asyncHandler(async (req, res) => {
  const stats = await getCourseCLOStatistics(req.params.courseId);
  sendSuccess(res, 200, 'CLO statistics fetched successfully', stats);
});

/**
 * @desc    Get PLO statistics for a program
 * @route   GET /api/analytics/plo/:programId
 * @access  Private (Admin)
 */
const getPLOStatistics = asyncHandler(async (req, res) => {
  const stats = await getProgramPLOStatistics(req.params.programId);
  sendSuccess(res, 200, 'PLO statistics fetched successfully', stats);
});

/**
 * @desc    Get performance trend for a student
 * @route   GET /api/analytics/performance-trend/:studentId
 * @access  Private
 */
const getPerformanceTrend = asyncHandler(async (req, res) => {
  const outcomes = await getStudentOutcomes(req.params.studentId);

  const trend = outcomes.map((outcome) => ({
    course: outcome.course.name,
    courseCode: outcome.course.code,
    percentage: outcome.overallPercentage,
    grade: outcome.grade,
    gpa: outcome.gpa,
    date: outcome.createdAt,
  }));

  sendSuccess(res, 200, 'Performance trend fetched successfully', trend);
});

module.exports = {
  getAdminDashboardAnalytics,
  getFacultyDashboardAnalytics,
  getStudentDashboardAnalytics,
  calculateOutcome,
  getStudentOutcomeResults,
  getCourseOutcomeResults,
  getAtRiskStudents,
  getCLOStatistics,
  getPLOStatistics,
  getPerformanceTrend,
};
