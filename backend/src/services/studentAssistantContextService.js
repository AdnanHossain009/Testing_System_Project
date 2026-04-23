const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Result = require('../models/Result');
const Notification = require('../models/Notification');
const { buildStudentAnalytics } = require('./studentAnalyticsService');

const round = (value) => Number((Number(value) || 0).toFixed(2));

const deriveRiskBand = (score) => {
  const safeScore = Number(score) || 0;

  if (safeScore >= 75) return 'Critical';
  if (safeScore >= 55) return 'High';
  if (safeScore >= 35) return 'Moderate';
  if (safeScore > 0) return 'Low';
  return 'Pending';
};

const average = (values = []) => {
  if (!values.length) return 0;
  return round(values.reduce((sum, value) => sum + (Number(value) || 0), 0) / values.length);
};

const buildAssessmentPatterns = (results = []) => {
  const marks = {
    quiz: [],
    assignment: [],
    mid: [],
    final: []
  };

  results.forEach((result) => {
    Object.keys(marks).forEach((key) => {
      if (result.marks?.[key] !== undefined && result.marks?.[key] !== null) {
        marks[key].push(Number(result.marks[key]) || 0);
      }
    });
  });

  const averages = Object.keys(marks).map((type) => ({
    type,
    score: average(marks[type])
  }));

  const sorted = [...averages].sort((a, b) => a.score - b.score);

  return {
    averages,
    lowestAssessmentType: sorted[0]?.type || null,
    lowestAssessmentScore: sorted[0]?.score || 0,
    strongestAssessmentType: sorted[sorted.length - 1]?.type || null,
    strongestAssessmentScore: sorted[sorted.length - 1]?.score || 0
  };
};

const buildTrendSummary = (results = [], analytics = {}) => {
  const deltas = results
    .map((result) => {
      const history = result.history || [];
      if (history.length < 2) return null;

      const first = Number(history[0]?.fuzzyScore) || 0;
      const last = Number(history[history.length - 1]?.fuzzyScore) || 0;
      return round(last - first);
    })
    .filter((value) => value !== null);

  if (!deltas.length) {
    return {
      direction: 'limited',
      averageDelta: 0,
      note: 'There is not enough historical evaluation data yet to estimate a reliable performance trend.'
    };
  }

  const averageDelta = average(deltas);
  let direction = 'stable';
  let note = 'Your performance trend is relatively stable across the saved evaluation history.';

  if (averageDelta >= 4) {
    direction = 'improving';
    note = 'Your recent evaluated performance trend is improving.';
  } else if (averageDelta <= -4) {
    direction = 'declining';
    note = 'Your recent evaluated performance trend is declining and needs attention.';
  }

  if ((analytics.performance?.stabilityScore || 0) < 55) {
    note += ' Your stability score also suggests inconsistent results across courses.';
  }

  return {
    direction,
    averageDelta,
    note
  };
};

const buildResultAlerts = (results = []) =>
  results
    .flatMap((result) =>
      (result.alerts || []).map((message) => ({
        courseCode: result.course?.code || 'N/A',
        courseName: result.course?.name || 'Unknown course',
        message,
        createdAt: result.lastEvaluatedAt || result.updatedAt || result.createdAt || null
      }))
    )
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 6);

const buildNotificationSummary = (notifications = []) =>
  notifications.map((notification) => ({
    title: notification.title,
    message: notification.message,
    type: notification.type,
    read: notification.read,
    createdAt: notification.createdAt
  }));

const buildCourseSnapshot = (course = null) => {
  if (!course) return null;

  return {
    courseId: course.courseId,
    courseCode: course.courseCode,
    courseName: course.courseName,
    fuzzyScore: course.fuzzyScore,
    courseOutcomeScore: course.courseOutcomeScore,
    riskScore: course.riskScore,
    riskBand: course.riskBand,
    weakClos: course.weakClos || [],
    weakPlos: course.weakPlos || [],
    strongClos: course.strongClos || [],
    strongPlos: course.strongPlos || [],
    insight: course.insight
  };
};

const buildCoursePriorities = (courseAnalytics = []) =>
  courseAnalytics
    .filter((course) => course.hasResult)
    .sort((a, b) => {
      const left = Number(a.courseOutcomeScore || a.fuzzyScore || 0);
      const right = Number(b.courseOutcomeScore || b.fuzzyScore || 0);
      return left - right;
    })
    .slice(0, 3)
    .map((course, index) => ({
      priority: index + 1,
      courseId: course.courseId,
      courseCode: course.courseCode,
      courseName: course.courseName,
      fuzzyScore: course.fuzzyScore,
      courseOutcomeScore: course.courseOutcomeScore,
      riskBand: course.riskBand,
      weakClos: course.weakClos || [],
      weakPlos: course.weakPlos || [],
      insight: course.insight
    }));

const buildPromptContext = (context) => ({
  student: context.student,
  overview: context.overview,
  assessmentPatterns: context.assessmentPatterns,
  weakestCourse: context.weakestCourse,
  strongestCourse: context.strongestCourse,
  weakClos: context.weakClos.slice(0, 5),
  weakPlos: context.weakPlos.slice(0, 5),
  strongClos: context.strongClos.slice(0, 3),
  strongPlos: context.strongPlos.slice(0, 3),
  coursePriorities: context.coursePriorities,
  recentAlerts: context.recentAlerts.slice(0, 5),
  trendSummary: context.trendSummary,
  recentCourses: context.completedCourses.slice(0, 6)
});

const buildStudentAssistantContext = async (studentId) => {
  const [student, enrollments, results, notifications] = await Promise.all([
    User.findById(studentId).select('name email studentId'),
    Enrollment.find({ student: studentId })
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
    Result.find({ student: studentId })
      .populate({
        path: 'course',
        select: 'name code credits semester faculty department program',
        populate: [
          { path: 'faculty', select: 'name email facultyId' },
          { path: 'department', select: 'name code' },
          { path: 'program', select: 'name code' }
        ]
      })
      .sort({ updatedAt: -1 }),
    Notification.find({ user: studentId }).sort({ createdAt: -1 }).limit(8).lean()
  ]);

  if (!student) {
    const error = new Error('Student not found.');
    error.statusCode = 404;
    throw error;
  }

  const analytics = buildStudentAnalytics({ enrollments, results });
  const performance = analytics.performance || {};
  const overallRiskScore = round(performance.riskScore || 0);
  const overallRiskBand = deriveRiskBand(overallRiskScore);
  const resultAlerts = buildResultAlerts(results);
  const notificationSummary = buildNotificationSummary(notifications);

  const completedCourses = (analytics.completedCourses || []).map((course) => buildCourseSnapshot(course));
  const pendingCourses = (analytics.pendingCourses || []).map((course) => ({
    courseId: course.courseId,
    courseCode: course.courseCode,
    courseName: course.courseName,
    semester: course.semester,
    status: course.status
  }));

  const context = {
    student: {
      name: student.name,
      email: student.email,
      studentId: student.studentId || ''
    },
    overview: {
      enrolledCourseCount: performance.courseCount || enrollments.length,
      completedCourseCount: performance.completedCourseCount || completedCourses.length,
      pendingCourseCount: performance.pendingCourseCount || pendingCourses.length,
      averageFuzzy: round(performance.performanceScore || 0),
      averageRiskScore: overallRiskScore,
      riskBand: overallRiskBand,
      masteryScore: round(performance.masteryScore || 0),
      masteryLabel: performance.masteryLabel || 'Pending',
      masteryNarrative: performance.masteryNarrative || 'No mastery summary is available yet.',
      overallCloAverage: round(performance.overallCloAverage || 0),
      overallPloAverage: round(performance.overallPloAverage || 0),
      completionRate: round(performance.completionRate || 0),
      stabilityScore: round(performance.stabilityScore || 0)
    },
    assessmentPatterns: buildAssessmentPatterns(results),
    weakClos: analytics.weakClos || [],
    weakPlos: analytics.weakPlos || [],
    strongClos: analytics.strongClos || [],
    strongPlos: analytics.strongPlos || [],
    weakestCourse: buildCourseSnapshot(analytics.weakestCourse),
    strongestCourse: buildCourseSnapshot(analytics.strongestCourse),
    coursePriorities: buildCoursePriorities(analytics.courseAnalytics || []),
    recentAlerts: resultAlerts,
    recentNotifications: notificationSummary,
    trendSummary: buildTrendSummary(results, analytics),
    completedCourses,
    pendingCourses
  };

  return {
    ...context,
    promptContext: buildPromptContext(context)
  };
};

module.exports = {
  buildStudentAssistantContext
};
