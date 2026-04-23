const Course = require('../models/Course');
const Program = require('../models/Program');
const Result = require('../models/Result');
const AttainmentTarget = require('../models/AttainmentTarget');
const ImprovementPlan = require('../models/ImprovementPlan');
const { buildCourseAnalytics } = require('./analyticsService');

const DEFAULT_TARGETS = {
  CLO: 60,
  PLO: 60
};

const round = (value) => Number((Number(value) || 0).toFixed(2));

const normalizeText = (value) => String(value || '').trim();

const parseId = (value) => {
  const next = normalizeText(value);
  return next || undefined;
};

const populatePlanQuery = (query) =>
  query
    .populate('department', 'name code')
    .populate('program', 'name code department')
    .populate('course', 'name code semester department program faculty')
    .populate('assignedTo', 'name email role facultyId')
    .populate('createdBy', 'name email role')
    .populate('updatedBy', 'name email role')
    .populate('reviewedBy', 'name email role');

const formatScopeLabel = ({ scopeType, department, program, course }) => {
  if (scopeType === 'course') {
    return course?.code ? `Course ${course.code}` : 'Course';
  }

  if (scopeType === 'program') {
    return program?.code ? `Program ${program.code}` : 'Program';
  }

  if (scopeType === 'department') {
    return department?.code ? `Department ${department.code}` : 'Department';
  }

  return 'Institution';
};

const sanitizeTargetPayload = (payload = {}) => ({
  academicTerm: normalizeText(payload.academicTerm),
  outcomeType: normalizeText(payload.outcomeType || '').toUpperCase(),
  targetAttainment: Number(payload.targetAttainment),
  scopeType: normalizeText(payload.scopeType || 'institution').toLowerCase(),
  department: parseId(payload.department),
  program: parseId(payload.program),
  course: parseId(payload.course),
  notes: normalizeText(payload.notes)
});

const sanitizePlanPayload = (payload = {}) => ({
  academicTerm: normalizeText(payload.academicTerm),
  outcomeType: normalizeText(payload.outcomeType || '').toUpperCase(),
  outcomeCode: normalizeText(payload.outcomeCode).toUpperCase(),
  currentAttainment: Number(payload.currentAttainment),
  targetAttainment: Number(payload.targetAttainment),
  rootCause: normalizeText(payload.rootCause),
  proposedAction: normalizeText(payload.proposedAction),
  improvementNote: normalizeText(payload.improvementNote),
  reviewNote: normalizeText(payload.reviewNote),
  reviewedAttainment:
    payload.reviewedAttainment === '' || payload.reviewedAttainment === null || payload.reviewedAttainment === undefined
      ? null
      : Number(payload.reviewedAttainment),
  status: normalizeText(payload.status || 'open').toLowerCase(),
  department: parseId(payload.department),
  program: parseId(payload.program),
  course: parseId(payload.course),
  assignedTo: parseId(payload.assignedTo),
  dueDate: payload.dueDate ? new Date(payload.dueDate) : null
});

const hydrateScopeContext = async ({ department, program, course }) => {
  const context = {
    department: department || undefined,
    program: program || undefined,
    course: course || undefined
  };

  if (context.course) {
    const courseDoc = await Course.findById(context.course).select('department program');

    if (!courseDoc) {
      const error = new Error('Linked course not found.');
      error.statusCode = 404;
      throw error;
    }

    context.department = String(courseDoc.department || context.department || '');
    context.program = String(courseDoc.program || context.program || '');
  }

  if (context.program) {
    const programDoc = await Program.findById(context.program).select('department');

    if (!programDoc) {
      const error = new Error('Linked program not found.');
      error.statusCode = 404;
      throw error;
    }

    context.department = String(programDoc.department || context.department || '');
  }

  return {
    department: context.department || undefined,
    program: context.program || undefined,
    course: context.course || undefined
  };
};

const validateTargetPayload = async (payload) => {
  if (!['CLO', 'PLO'].includes(payload.outcomeType)) {
    const error = new Error('Outcome type must be CLO or PLO.');
    error.statusCode = 400;
    throw error;
  }

  if (!['institution', 'department', 'program', 'course'].includes(payload.scopeType)) {
    const error = new Error('Scope type must be institution, department, program, or course.');
    error.statusCode = 400;
    throw error;
  }

  if (Number.isNaN(payload.targetAttainment) || payload.targetAttainment < 0 || payload.targetAttainment > 100) {
    const error = new Error('Target attainment must be between 0 and 100.');
    error.statusCode = 400;
    throw error;
  }

  if (payload.scopeType === 'department' && !payload.department) {
    const error = new Error('Department scope requires a department.');
    error.statusCode = 400;
    throw error;
  }

  if (payload.scopeType === 'program' && !payload.program) {
    const error = new Error('Program scope requires a program.');
    error.statusCode = 400;
    throw error;
  }

  if (payload.scopeType === 'course' && !payload.course) {
    const error = new Error('Course scope requires a course.');
    error.statusCode = 400;
    throw error;
  }

  return hydrateScopeContext(payload);
};

const validatePlanPayload = async (payload) => {
  if (!['CLO', 'PLO'].includes(payload.outcomeType)) {
    const error = new Error('Outcome type must be CLO or PLO.');
    error.statusCode = 400;
    throw error;
  }

  if (!payload.outcomeCode) {
    const error = new Error('Outcome code is required.');
    error.statusCode = 400;
    throw error;
  }

  if (Number.isNaN(payload.currentAttainment) || payload.currentAttainment < 0 || payload.currentAttainment > 100) {
    const error = new Error('Current attainment must be between 0 and 100.');
    error.statusCode = 400;
    throw error;
  }

  if (Number.isNaN(payload.targetAttainment) || payload.targetAttainment < 0 || payload.targetAttainment > 100) {
    const error = new Error('Target attainment must be between 0 and 100.');
    error.statusCode = 400;
    throw error;
  }

  if (!payload.proposedAction) {
    const error = new Error('Proposed action is required.');
    error.statusCode = 400;
    throw error;
  }

  if (!payload.dueDate || Number.isNaN(payload.dueDate.getTime())) {
    const error = new Error('A valid due date is required.');
    error.statusCode = 400;
    throw error;
  }

  if (!['open', 'in_progress', 'completed', 'reviewed'].includes(payload.status)) {
    const error = new Error('Status must be open, in_progress, completed, or reviewed.');
    error.statusCode = 400;
    throw error;
  }

  if (payload.reviewedAttainment !== null && (payload.reviewedAttainment < 0 || payload.reviewedAttainment > 100)) {
    const error = new Error('Reviewed attainment must be between 0 and 100.');
    error.statusCode = 400;
    throw error;
  }

  return hydrateScopeContext(payload);
};

const listTargets = (filter = {}) =>
  AttainmentTarget.find(filter)
    .populate('department', 'name code')
    .populate('program', 'name code department')
    .populate('course', 'name code semester')
    .populate('createdBy', 'name email role')
    .populate('updatedBy', 'name email role')
    .sort({ scopeType: 1, targetAttainment: -1, createdAt: -1 });

const buildPlanVisibilityFilter = async (user) => {
  if (['admin', 'accreditation_officer'].includes(user.role)) {
    return {};
  }

  if (user.role === 'head') {
    return user.department ? { department: user.department } : { _id: null };
  }

  if (user.role === 'faculty') {
    const courses = await Course.find({ faculty: user._id }).select('_id');
    return {
      $or: [
        { course: { $in: courses.map((item) => item._id) } },
        { assignedTo: user._id }
      ]
    };
  }

  const error = new Error('You are not allowed to access improvement plans.');
  error.statusCode = 403;
  throw error;
};

const applyPlanFilters = (baseFilter, query = {}) => {
  const filter = { ...baseFilter };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.departmentId) {
    filter.department = query.departmentId;
  }

  if (query.programId) {
    filter.program = query.programId;
  }

  if (query.courseId) {
    filter.course = query.courseId;
  }

  if (query.outcomeType) {
    filter.outcomeType = String(query.outcomeType).toUpperCase();
  }

  if (query.academicTerm) {
    filter.academicTerm = normalizeText(query.academicTerm);
  }

  if (query.assignedTo) {
    filter.assignedTo = query.assignedTo;
  }

  if (query.overdue === 'true') {
    filter.status = { $in: ['open', 'in_progress'] };
    filter.dueDate = { $lt: new Date() };
  }

  return filter;
};

const scoreTargetMatch = (target, outcome) => {
  if (target.outcomeType !== outcome.outcomeType) {
    return -1;
  }

  const outcomeTerm = normalizeText(outcome.academicTerm);
  const targetTerm = normalizeText(target.academicTerm);

  if (targetTerm && targetTerm !== outcomeTerm) {
    return -1;
  }

  let score = target.targetAttainment;

  if (targetTerm && targetTerm === outcomeTerm) {
    score += 1000;
  }

  if (target.scopeType === 'course') {
    return String(target.course?._id || target.course) === String(outcome.courseId) ? score + 400 : -1;
  }

  if (target.scopeType === 'program') {
    return String(target.program?._id || target.program) === String(outcome.programId) ? score + 300 : -1;
  }

  if (target.scopeType === 'department') {
    return String(target.department?._id || target.department) === String(outcome.departmentId) ? score + 200 : -1;
  }

  return score + 100;
};

const resolveTargetForOutcome = (outcome, targets = []) => {
  let bestTarget = null;
  let bestScore = -1;

  targets.forEach((target) => {
    const score = scoreTargetMatch(target, outcome);

    if (score > bestScore) {
      bestScore = score;
      bestTarget = target;
    }
  });

  const targetAttainment = bestTarget?.targetAttainment ?? DEFAULT_TARGETS[outcome.outcomeType] ?? 60;
  const gap = round(Math.max(0, targetAttainment - outcome.currentAttainment));

  return {
    ...outcome,
    targetAttainment,
    gap,
    belowTarget: gap > 0,
    benchmark: bestTarget
      ? {
          id: String(bestTarget._id),
          scopeType: bestTarget.scopeType,
          academicTerm: bestTarget.academicTerm,
          label: formatScopeLabel(bestTarget)
        }
      : {
          id: null,
          scopeType: 'institution',
          academicTerm: '',
          label: 'Default benchmark'
        }
  };
};

const buildOutcomeRowsForCourse = async (course, academicTerm = '') => {
  const analytics = await buildCourseAnalytics(course._id);
  const cloInsightByCode = new Map((analytics.cloInsights || []).map((item) => [item.code, item]));

  const cloRows = (analytics.classCloAttainment || []).map((item) => ({
    typeKey: 'CLO',
    outcomeType: 'CLO',
    outcomeCode: item.code,
    currentAttainment: round(item.averageScore),
    attainmentPercent: round(item.attainmentPercent),
    explanation: cloInsightByCode.get(item.code)?.explanation || '',
    courseId: String(course._id),
    courseCode: course.code,
    courseName: course.name,
    programId: String(course.program?._id || course.program || ''),
    programCode: course.program?.code || 'N/A',
    departmentId: String(course.department?._id || course.department || ''),
    departmentCode: course.department?.code || 'N/A',
    academicTerm,
    scopeLabel: `${course.code} - ${item.code}`,
    sourceType: 'course_analytics'
  }));

  const ploRows = (analytics.ploChart || []).map((item) => ({
    typeKey: 'PLO',
    outcomeType: 'PLO',
    outcomeCode: item.code,
    currentAttainment: round(item.score),
    attainmentPercent: round(item.score),
    explanation: `Program-level outcome snapshot derived from mapped course results in ${course.code}.`,
    courseId: String(course._id),
    courseCode: course.code,
    courseName: course.name,
    programId: String(course.program?._id || course.program || ''),
    programCode: course.program?.code || 'N/A',
    departmentId: String(course.department?._id || course.department || ''),
    departmentCode: course.department?.code || 'N/A',
    academicTerm,
    scopeLabel: `${course.code} - ${item.code}`,
    sourceType: 'course_analytics'
  }));

  return [...cloRows, ...ploRows];
};

const buildOutcomeVisibility = async (user, query = {}) => {
  const filter = { active: true };

  if (query.departmentId) {
    filter.department = query.departmentId;
  }

  if (query.programId) {
    filter.program = query.programId;
  }

  if (query.courseId) {
    filter._id = query.courseId;
  }

  if (user.role === 'head' && user.department) {
    filter.department = user.department;
  }

  if (user.role === 'faculty') {
    filter.faculty = user._id;
  }

  return Course.find(filter)
    .populate('department', 'name code')
    .populate('program', 'name code plos department')
    .populate('faculty', 'name email facultyId')
    .sort({ code: 1 });
};

const listOutcomeTargets = async (query = {}) => {
  const filter = {};

  if (query.outcomeType) {
    filter.outcomeType = String(query.outcomeType).toUpperCase();
  }

  if (query.departmentId) {
    filter.$or = [{ department: query.departmentId }, { department: { $exists: false } }, { department: null }];
  }

  if (query.programId) {
    filter.$or = [...(filter.$or || []), { program: query.programId }];
  }

  if (query.courseId) {
    filter.$or = [...(filter.$or || []), { course: query.courseId }];
  }

  return listTargets(filter);
};

const listBelowTargetOutcomes = async (user, query = {}) => {
  const academicTerm = normalizeText(query.academicTerm);
  const onlyBelowTarget = query.onlyBelowTarget !== 'false';
  const requestedType = query.outcomeType ? String(query.outcomeType).toUpperCase() : '';

  const [courses, targets, plans] = await Promise.all([
    buildOutcomeVisibility(user, query),
    listTargets({}),
    ImprovementPlan.find().select('outcomeType outcomeCode course program department status')
  ]);

  const outcomeRows = await Promise.all(courses.map((course) => buildOutcomeRowsForCourse(course, academicTerm)));

  const planCountByKey = new Map();

  plans.forEach((plan) => {
    const key = [
      plan.outcomeType,
      plan.outcomeCode,
      String(plan.course || ''),
      String(plan.program || ''),
      String(plan.department || '')
    ].join('|');

    planCountByKey.set(key, (planCountByKey.get(key) || 0) + 1);
  });

  return outcomeRows
    .flat()
    .filter((item) => !requestedType || item.outcomeType === requestedType)
    .map((item) => resolveTargetForOutcome(item, targets))
    .filter((item) => (onlyBelowTarget ? item.belowTarget : true))
    .map((item) => ({
      ...item,
      openPlanCount:
        planCountByKey.get(
          [item.outcomeType, item.outcomeCode, item.courseId || '', item.programId || '', item.departmentId || ''].join('|')
        ) || 0
    }))
    .sort((a, b) => b.gap - a.gap || a.outcomeCode.localeCompare(b.outcomeCode));
};

const listPlansForUser = async (user, query = {}) => {
  const baseFilter = await buildPlanVisibilityFilter(user);
  const filter = applyPlanFilters(baseFilter, query);
  const plans = await populatePlanQuery(ImprovementPlan.find(filter)).sort({ dueDate: 1, createdAt: -1 });

  return plans.map((plan) => ({
    ...plan.toObject(),
    overdue: ['open', 'in_progress'].includes(plan.status) && new Date(plan.dueDate).getTime() < Date.now(),
    scopeLabel:
      plan.course?.code ||
      plan.program?.code ||
      plan.department?.code ||
      'Institution',
    reviewGap:
      plan.reviewedAttainment === null || plan.reviewedAttainment === undefined
        ? null
        : round(Math.max(0, plan.targetAttainment - plan.reviewedAttainment))
  }));
};

const getPlanForUser = async (user, id) => {
  const baseFilter = await buildPlanVisibilityFilter(user);
  const plan = await populatePlanQuery(ImprovementPlan.findOne({ ...baseFilter, _id: id }));

  if (!plan) {
    const error = new Error('Improvement plan not found.');
    error.statusCode = 404;
    throw error;
  }

  return {
    ...plan.toObject(),
    overdue: ['open', 'in_progress'].includes(plan.status) && new Date(plan.dueDate).getTime() < Date.now(),
    reviewGap:
      plan.reviewedAttainment === null || plan.reviewedAttainment === undefined
        ? null
        : round(Math.max(0, plan.targetAttainment - plan.reviewedAttainment))
  };
};

const createPlanDocument = async (payload, actorId) => {
  const scope = await validatePlanPayload(payload);
  const plan = await ImprovementPlan.create({
    ...payload,
    ...scope,
    createdBy: actorId,
    updatedBy: actorId
  });

  return populatePlanQuery(ImprovementPlan.findById(plan._id));
};

const updatePlanDocument = async (plan, payload, actorId) => {
  const scope = await validatePlanPayload(payload);

  Object.assign(plan, payload, scope, { updatedBy: actorId });

  if (plan.status === 'completed' && !plan.completedAt) {
    plan.completedAt = new Date();
  }

  if (plan.status !== 'completed') {
    plan.completedAt = undefined;
  }

  if (plan.status === 'reviewed') {
    plan.reviewedAt = new Date();
    plan.reviewedBy = actorId;
  }

  if (plan.status !== 'reviewed') {
    plan.reviewedAt = undefined;
    plan.reviewedBy = undefined;
  }

  await plan.save();
  return populatePlanQuery(ImprovementPlan.findById(plan._id));
};

const buildPlanDashboardStats = async () => {
  const [plans, outcomes] = await Promise.all([
    populatePlanQuery(ImprovementPlan.find({})).sort({ updatedAt: -1 }),
    listBelowTargetOutcomes({ role: 'admin' }, { onlyBelowTarget: 'true' })
  ]);

  const now = Date.now();
  const openPlans = plans.filter((plan) => plan.status === 'open').length;
  const inProgressPlans = plans.filter((plan) => plan.status === 'in_progress').length;
  const overduePlans = plans.filter(
    (plan) => ['open', 'in_progress'].includes(plan.status) && new Date(plan.dueDate).getTime() < now
  ).length;
  const completedPlans = plans.filter((plan) => ['completed', 'reviewed'].includes(plan.status)).length;

  return {
    openPlans,
    inProgressPlans,
    overduePlans,
    completedPlans,
    belowTargetOutcomes: outcomes.length,
    highlightedOutcomes: outcomes.slice(0, 6),
    recentPlans: plans.slice(0, 6).map((plan) => ({
      _id: String(plan._id),
      outcomeType: plan.outcomeType,
      outcomeCode: plan.outcomeCode,
      status: plan.status,
      dueDate: plan.dueDate,
      assignedTo: plan.assignedTo,
      course: plan.course,
      program: plan.program,
      department: plan.department,
      gap: plan.gap
    }))
  };
};

module.exports = {
  sanitizeTargetPayload,
  sanitizePlanPayload,
  validateTargetPayload,
  validatePlanPayload,
  listTargets,
  listBelowTargetOutcomes,
  listPlansForUser,
  getPlanForUser,
  createPlanDocument,
  updatePlanDocument,
  buildPlanDashboardStats,
  buildPlanVisibilityFilter,
  applyPlanFilters,
  populatePlanQuery,
  formatScopeLabel
};
