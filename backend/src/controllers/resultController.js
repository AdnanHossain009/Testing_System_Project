const User = require('../models/User');
const Course = require('../models/Course');
const Result = require('../models/Result');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { evaluateFuzzy } = require('../services/fuzzyService');
const {
  computeRisk,
  computeOBEAttainment,
  normalizeMarksForEvaluation
} = require('../services/analyticsService');
const { logAction } = require('../services/auditService');
const { createNotification } = require('../services/notificationService');

const upsertResult = asyncHandler(async (req, res) => {
  const { studentId, courseId, marks } = req.body;

  if (!studentId || !courseId || !marks) {
    res.status(400);
    throw new Error('studentId, courseId and marks are required.');
  }

  const student = await User.findById(studentId);
  const course = await Course.findById(courseId).populate('faculty');
  if (!student || student.role !== 'student') {
    res.status(404);
    throw new Error('Student not found.');
  }
  if (!course) {
    res.status(404);
    throw new Error('Course not found.');
  }

  if (req.user.role === 'faculty' && String(course.faculty?._id || course.faculty) !== String(req.user._id)) {
    res.status(403);
    throw new Error('You can only submit results for your own course.');
  }

  const existing = await Result.findOne({ student: studentId, course: courseId });

  const normalizedForEvaluation = await normalizeMarksForEvaluation(courseId, marks);

  const fuzzy = await evaluateFuzzy(normalizedForEvaluation);
  const risk = computeRisk({
    marks: normalizedForEvaluation,
    fuzzyScore: fuzzy.fuzzyScore,
    previousHistory: existing?.history || []
  });

  const obe = await computeOBEAttainment({ courseId, marks });

  const historyEntry = {
    label: new Date().toISOString().slice(0, 10),
    weightedAverage: risk.weightedAverage,
    fuzzyScore: fuzzy.fuzzyScore,
    riskScore: risk.riskScore
  };

  const result = await Result.findOneAndUpdate(
    { student: studentId, course: courseId },
    {
      student: studentId,
      course: courseId,
      rawMarks: {
        quiz: Number(marks.quiz) || 0,
        assignment: Number(marks.assignment) || 0,
        mid: Number(marks.mid) || 0,
        final: Number(marks.final) || 0
      },
      marks: fuzzy.normalizedMarks,
      weightedAverage: risk.weightedAverage,
      fuzzyScore: fuzzy.fuzzyScore,
      attainmentLevel: fuzzy.attainmentLevel,
      riskScore: risk.riskScore,
      riskBand: risk.riskBand,
      alerts: risk.alerts,
      cloAttainment: obe.cloAttainment,
      ploAttainment: obe.ploAttainment,
      history: [...(existing?.history || []), historyEntry].slice(-8),
      evaluatedBy: req.user._id,
      lastEvaluatedAt: new Date()
    },
    { new: true, upsert: true }
  )
    .populate('student', 'name email studentId')
    .populate('course', 'name code');

  if (['High', 'Critical'].includes(risk.riskBand)) {
    await createNotification({
      user: student._id,
      title: 'Academic risk alert',
      message: `Your risk score in ${course.code} is ${risk.riskScore}. Please review feedback and contact your faculty mentor.`,
      type: 'warning'
    });

    if (course.faculty) {
      await createNotification({
        user: course.faculty._id || course.faculty,
        title: 'Weak student detected',
        message: `${student.name} requires attention in ${course.code}. Risk score: ${risk.riskScore}.`,
        type: 'warning'
      });
    }
  }

  await logAction({
    actor: req.user._id,
    action: 'UPSERT_RESULT',
    entityType: 'Result',
    entityId: result._id.toString(),
    metadata: { studentId, courseId, riskBand: result.riskBand }
  });

  return success(
    res,
    {
      result,
      fuzzy: {
        fuzzyInputs: fuzzy.fuzzyInputs,
        activatedRules: fuzzy.activatedRules
      }
    },
    'Result saved and evaluated.'
  );
});

const getCourseResults = asyncHandler(async (req, res) => {
  const results = await Result.find({ course: req.params.courseId })
    .populate('student', 'name email studentId')
    .populate('course', 'name code');

  return success(res, { results }, 'Course results fetched.');
});

const getMyResults = asyncHandler(async (req, res) => {
  const results = await Result.find({ student: req.user._id }).populate('course', 'name code credits semester');
  return success(res, { results }, 'Student results fetched.');
});

module.exports = { upsertResult, getCourseResults, getMyResults };
