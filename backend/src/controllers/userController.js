const User = require('../models/User');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { logAction } = require('../services/auditService');

const listUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.programId) filter.program = req.query.programId;
  if (req.query.departmentId) filter.department = req.query.departmentId;

  const users = await User.find(filter)
    .select('-password')
    .populate('department', 'name code')
    .populate('program', 'name code');

  return success(res, { users }, 'Users fetched.');
});

const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, department, program, studentId, facultyId } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error('Name, email, password and role are required.');
  }

  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error('User already exists.');
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    department,
    program,
    studentId,
    facultyId
  });

  await logAction({
    actor: req.user._id,
    action: 'CREATE_USER',
    entityType: 'User',
    entityId: user._id.toString(),
    metadata: { role: user.role, email: user.email }
  });

  return success(res, { user }, 'User created.', 201);
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found.');
  }

  const allowedFields = ['name', 'role', 'department', 'program', 'isActive', 'studentId', 'facultyId'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      user[field] = req.body[field];
    }
  });

  await user.save();

  await logAction({
    actor: req.user._id,
    action: 'UPDATE_USER',
    entityType: 'User',
    entityId: user._id.toString()
  });

  return success(res, { user }, 'User updated.');
});

module.exports = { listUsers, createUser, updateUser };
