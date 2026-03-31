const Department = require('../models/Department');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { logAction } = require('../services/auditService');

const listDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find().populate('head', 'name email');
  return success(res, { departments }, 'Departments fetched.');
});

const createDepartment = asyncHandler(async (req, res) => {
  const { name, code, description, head } = req.body;

  if (!name || !code) {
    res.status(400);
    throw new Error('Department name and code are required.');
  }

  const department = await Department.create({ name, code, description, head });

  await logAction({
    actor: req.user._id,
    action: 'CREATE_DEPARTMENT',
    entityType: 'Department',
    entityId: department._id.toString()
  });

  return success(res, { department }, 'Department created.', 201);
});

module.exports = { listDepartments, createDepartment };
