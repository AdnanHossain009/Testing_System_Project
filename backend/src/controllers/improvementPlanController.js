const AttainmentTarget = require('../models/AttainmentTarget');
const ImprovementPlan = require('../models/ImprovementPlan');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { logAction } = require('../services/auditService');
const { hasRole } = require('../utils/roleHelpers');
const {
  sanitizeTargetPayload,
  sanitizePlanPayload,
  validateTargetPayload,
  listTargets,
  listBelowTargetOutcomes,
  listPlansForUser,
  getPlanForUser,
  createPlanDocument,
  updatePlanDocument
} = require('../services/improvementPlanningService');

const ensureManagerRole = (user) => {
  if (!hasRole(user, 'admin', 'accreditation_officer')) {
    const error = new Error('Only admin and accreditation officer can manage improvement plans.');
    error.statusCode = 403;
    throw error;
  }
};

const listAttainmentTargets = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.outcomeType) {
    filter.outcomeType = String(req.query.outcomeType).toUpperCase();
  }

  if (req.query.scopeType) {
    filter.scopeType = String(req.query.scopeType).toLowerCase();
  }

  if (req.query.departmentId) {
    filter.department = req.query.departmentId;
  }

  if (req.query.programId) {
    filter.program = req.query.programId;
  }

  if (req.query.courseId) {
    filter.course = req.query.courseId;
  }

  if (req.query.academicTerm) {
    filter.academicTerm = String(req.query.academicTerm).trim();
  }

  const targets = await listTargets(filter);
  return success(res, { targets }, 'Attainment targets fetched.');
});

const createAttainmentTarget = asyncHandler(async (req, res) => {
  ensureManagerRole(req.user);

  const payload = sanitizeTargetPayload(req.body);
  const scope = await validateTargetPayload(payload);

  const target = await AttainmentTarget.create({
    ...payload,
    ...scope,
    createdBy: req.user._id,
    updatedBy: req.user._id
  });

  await logAction({
    actor: req.user._id,
    action: 'CREATE_ATTAINMENT_TARGET',
    entityType: 'AttainmentTarget',
    entityId: target._id.toString(),
    metadata: {
      outcomeType: target.outcomeType,
      scopeType: target.scopeType,
      targetAttainment: target.targetAttainment
    }
  });

  const createdTarget = await AttainmentTarget.findById(target._id)
    .populate('department', 'name code')
    .populate('program', 'name code department')
    .populate('course', 'name code semester')
    .populate('createdBy', 'name email role')
    .populate('updatedBy', 'name email role');

  return success(res, { target: createdTarget }, 'Attainment target created.', 201);
});

const updateAttainmentTarget = asyncHandler(async (req, res) => {
  ensureManagerRole(req.user);

  const target = await AttainmentTarget.findById(req.params.targetId);

  if (!target) {
    res.status(404);
    throw new Error('Attainment target not found.');
  }

  const payload = sanitizeTargetPayload({
    ...target.toObject(),
    ...req.body
  });
  const scope = await validateTargetPayload(payload);

  Object.assign(target, payload, scope, { updatedBy: req.user._id });
  await target.save();

  await logAction({
    actor: req.user._id,
    action: 'UPDATE_ATTAINMENT_TARGET',
    entityType: 'AttainmentTarget',
    entityId: target._id.toString(),
    metadata: {
      outcomeType: target.outcomeType,
      scopeType: target.scopeType,
      targetAttainment: target.targetAttainment
    }
  });

  const updatedTarget = await AttainmentTarget.findById(target._id)
    .populate('department', 'name code')
    .populate('program', 'name code department')
    .populate('course', 'name code semester')
    .populate('createdBy', 'name email role')
    .populate('updatedBy', 'name email role');

  return success(res, { target: updatedTarget }, 'Attainment target updated.');
});

const listDetectedOutcomes = asyncHandler(async (req, res) => {
  const outcomes = await listBelowTargetOutcomes(req.user, req.query);
  return success(res, { outcomes }, 'Outcome monitoring data fetched.');
});

const listImprovementPlans = asyncHandler(async (req, res) => {
  const plans = await listPlansForUser(req.user, req.query);
  return success(res, { plans }, 'Improvement plans fetched.');
});

const createImprovementPlan = asyncHandler(async (req, res) => {
  ensureManagerRole(req.user);

  const payload = sanitizePlanPayload(req.body);
  const plan = await createPlanDocument(payload, req.user._id);

  await logAction({
    actor: req.user._id,
    action: 'CREATE_IMPROVEMENT_PLAN',
    entityType: 'ImprovementPlan',
    entityId: plan._id.toString(),
    metadata: {
      outcomeType: plan.outcomeType,
      outcomeCode: plan.outcomeCode,
      status: plan.status
    }
  });

  return success(res, { plan }, 'Improvement plan created.', 201);
});

const getImprovementPlan = asyncHandler(async (req, res) => {
  const plan = await getPlanForUser(req.user, req.params.planId);
  return success(res, { plan }, 'Improvement plan fetched.');
});

const updateImprovementPlan = asyncHandler(async (req, res) => {
  ensureManagerRole(req.user);

  const plan = await ImprovementPlan.findById(req.params.planId);

  if (!plan) {
    res.status(404);
    throw new Error('Improvement plan not found.');
  }

  const payload = sanitizePlanPayload({
    ...plan.toObject(),
    ...req.body
  });
  const updatedPlan = await updatePlanDocument(plan, payload, req.user._id);

  await logAction({
    actor: req.user._id,
    action: 'UPDATE_IMPROVEMENT_PLAN',
    entityType: 'ImprovementPlan',
    entityId: updatedPlan._id.toString(),
    metadata: {
      outcomeType: updatedPlan.outcomeType,
      outcomeCode: updatedPlan.outcomeCode,
      status: updatedPlan.status
    }
  });

  return success(res, { plan: updatedPlan }, 'Improvement plan updated.');
});

const updateImprovementPlanStatus = asyncHandler(async (req, res) => {
  ensureManagerRole(req.user);

  const plan = await ImprovementPlan.findById(req.params.planId);

  if (!plan) {
    res.status(404);
    throw new Error('Improvement plan not found.');
  }

  const payload = sanitizePlanPayload({
    ...plan.toObject(),
    ...req.body
  });
  const updatedPlan = await updatePlanDocument(plan, payload, req.user._id);

  await logAction({
    actor: req.user._id,
    action: 'UPDATE_IMPROVEMENT_PLAN_STATUS',
    entityType: 'ImprovementPlan',
    entityId: updatedPlan._id.toString(),
    metadata: {
      status: updatedPlan.status,
      reviewedAttainment: updatedPlan.reviewedAttainment
    }
  });

  return success(res, { plan: updatedPlan }, 'Improvement plan status updated.');
});

const deleteImprovementPlan = asyncHandler(async (req, res) => {
  ensureManagerRole(req.user);

  const plan = await ImprovementPlan.findById(req.params.planId);

  if (!plan) {
    res.status(404);
    throw new Error('Improvement plan not found.');
  }

  await plan.deleteOne();

  await logAction({
    actor: req.user._id,
    action: 'DELETE_IMPROVEMENT_PLAN',
    entityType: 'ImprovementPlan',
    entityId: plan._id.toString(),
    metadata: {
      outcomeType: plan.outcomeType,
      outcomeCode: plan.outcomeCode
    }
  });

  return success(res, {}, 'Improvement plan deleted.');
});

module.exports = {
  listAttainmentTargets,
  createAttainmentTarget,
  updateAttainmentTarget,
  listDetectedOutcomes,
  listImprovementPlans,
  createImprovementPlan,
  getImprovementPlan,
  updateImprovementPlan,
  updateImprovementPlanStatus,
  deleteImprovementPlan
};
