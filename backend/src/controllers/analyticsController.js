const User = require('../models/User');
const Department = require('../models/Department');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Result = require('../models/Result');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const {
  buildCourseAnalytics,
  buildProgramAnalytics,
  buildInstitutionAnalytics
} = require('../services/analyticsService');
const { buildStudentAnalytics } = require('../services/studentAnalyticsService');
const { buildPlanDashboardStats } = require('../services/improvementPlanningService');
const { buildCurriculumGovernanceSummary } = require('../services/curriculumGovernanceService');

const adminSummary = asyncHandler(async (req, res) => {
  const [userCount, courseCount, departmentCount, highRiskCount, roleStats] = await Promise.all([
    User.countDocuments(),
    Course.countDocuments(),
    Department.countDocuments(),
    Result.countDocuments({ riskBand: { $in: ['High', 'Critical'] } }),
    User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ])
  ]);

  const highRiskStudents = await Result.find({ riskBand: { $in: ['High', 'Critical'] } })
    .sort({ riskScore: -1 })
    .limit(20)
    .populate('student', 'name email studentId role')
    .populate('course', 'name code');

  return success(res, {
    userCount,
    courseCount,
    departmentCount,
    highRiskCount,
    roleStats,
    highRiskStudents
  }, 'Admin analytics fetched.');
});

const facultySummary = asyncHandler(async (req, res) => {
  const courses = await Course.find({ faculty: req.user._id });
  const courseIds = courses.map((course) => course._id);

  const results = await Result.find({ course: { $in: courseIds } })
    .populate('student', 'name email studentId')
    .populate('course', 'name code');

  const weakStudents = results
    .filter((result) => ['High', 'Critical'].includes(result.riskBand))
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 10);

  const coursePerformance = await Promise.all(
    courseIds.map(async (id) => {
      const analytics = await buildCourseAnalytics(id);
      const course = courses.find((item) => String(item._id) === String(id));
      return {
        courseId: id,
        courseCode: course?.code,
        courseName: course?.name,
        averageFuzzy: analytics.averageFuzzy,
        totalStudents: analytics.totalStudents
      };
    })
  );

  return success(res, {
    totalCourses: courses.length,
    weakStudents,
    coursePerformance
  }, 'Faculty analytics fetched.');
});

const studentSummary = asyncHandler(async (req, res) => {
  const [enrollments, results] = await Promise.all([
    Enrollment.find({ student: req.user._id })
      .populate({
        path: 'course',
        select: 'name code credits semester faculty department program active',
        populate: [
          { path: 'faculty', select: 'name email facultyId' },
          { path: 'department', select: 'name code' },
          { path: 'program', select: 'name code' }
        ]
      })
      .populate('approvedBy', 'name email role')
      .sort({ enrolledAt: -1 }),
    Result.find({ student: req.user._id })
      .populate({
        path: 'course',
        select: 'name code credits semester faculty department program',
        populate: [
          { path: 'faculty', select: 'name email facultyId' },
          { path: 'department', select: 'name code' },
          { path: 'program', select: 'name code' }
        ]
      })
      .sort({ updatedAt: -1 })
  ]);

  const averageFuzzy =
    results.length > 0
      ? Number((results.reduce((sum, item) => sum + item.fuzzyScore, 0) / results.length).toFixed(2))
      : 0;

  const alerts = results.flatMap((item) =>
    item.alerts.map((alert) => ({ course: item.course.code, message: alert }))
  );

  const analytics = buildStudentAnalytics({ enrollments, results });

  return success(res, {
    totalCourses: results.length,
    enrolledCourses: enrollments.length,
    averageFuzzy,
    results,
    enrollments,
    alerts,
    analytics
  }, 'Student analytics fetched.');
});

const headSummary = asyncHandler(async (req, res) => {
  const departmentId = req.user.department;
  const department = await Department.findById(departmentId);
  const programAnalytics = await buildProgramAnalytics(departmentId);

  const courses = await Course.find({ department: departmentId });
  const courseIds = courses.map((item) => item._id);
  const results = await Result.find({ course: { $in: courseIds } });

  const averageDepartmentFuzzy =
    results.length > 0
      ? Number((results.reduce((sum, item) => sum + item.fuzzyScore, 0) / results.length).toFixed(2))
      : 0;

  return success(res, {
    department,
    totalCourses: courses.length,
    totalResults: results.length,
    averageDepartmentFuzzy,
    programAnalytics
  }, 'Head analytics fetched.');
});

const accreditationSummary = asyncHandler(async (req, res) => {
  const [summary, planStats] = await Promise.all([
    buildInstitutionAnalytics(),
    buildPlanDashboardStats()
  ]);

  return success(
    res,
    {
      ...summary,
      planSummary: {
        openPlans: planStats.openPlans,
        inProgressPlans: planStats.inProgressPlans,
        overduePlans: planStats.overduePlans,
        completedPlans: planStats.completedPlans
      },
      totalPendingActionItems: planStats.openPlans + planStats.inProgressPlans,
      belowTargetOutcomes: planStats.belowTargetOutcomes,
      highlightedOutcomes: planStats.highlightedOutcomes,
      recentPlans: planStats.recentPlans
    },
    'Accreditation analytics fetched.'
  );
});

const courseAnalytics = asyncHandler(async (req, res) => {
  const analytics = await buildCourseAnalytics(req.params.courseId);
  return success(res, analytics, 'Course analytics fetched.');
});

const curriculumGovernance = asyncHandler(async (req, res) => {
  const governance = await buildCurriculumGovernanceSummary(req.query);
  return success(res, governance, 'Curriculum governance analytics fetched.');
});

const weakStudentsByCourse = asyncHandler(async (req, res) => {
  const analytics = await buildCourseAnalytics(req.params.courseId);
  return success(res, { weakStudents: analytics.weakStudents }, 'Weak students fetched.');
});

module.exports = {
  adminSummary,
  facultySummary,
  studentSummary,
  headSummary,
  accreditationSummary,
  courseAnalytics,
  curriculumGovernance,
  weakStudentsByCourse
};
