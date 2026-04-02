const Program = require('../models/Program');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { logAction } = require('../services/auditService');

const listPrograms = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.departmentId) filter.department = req.query.departmentId;

  const programs = await Program.find(filter).populate('department', 'name code');
  return success(res, { programs }, 'Programs fetched.');
});

const createProgram = asyncHandler(async (req, res) => {
  const { name, code, department, plos = [] } = req.body;

  if (!name || !code || !department) {
    res.status(400);
    throw new Error('Program name, code and department are required.');
  }

  const normalizedPLOs = plos.map((item) => ({
    code: item.code,
    description: item.description
  }));

  const program = await Program.create({
    name,
    code,
    department,
    plos: normalizedPLOs
  });

  await logAction({
    actor: req.user._id,
    action: 'CREATE_PROGRAM',
    entityType: 'Program',
    entityId: program._id.toString(),
    metadata: { ploCount: normalizedPLOs.length }
  });

  return success(res, { program }, 'Program created.', 201);
});

module.exports = { listPrograms, createProgram };
