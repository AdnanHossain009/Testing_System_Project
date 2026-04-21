const User = require('../models/User');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');
const { logAction } = require('../services/auditService');

const SIGNUP_ROLES = new Set(['faculty', 'student', 'head']);

const buildUserPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department,
  program: user.program,
  studentId: user.studentId,
  facultyId: user.facultyId
});

const setupRegister = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'admin' } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email and password are required.');
  }

  const userCount = await User.countDocuments();

  if (userCount > 0) {
    const providedKey = req.headers['x-admin-secret'];
    if (!providedKey || providedKey !== process.env.ADMIN_SETUP_KEY) {
      res.status(403);
      throw new Error('Initial setup is already complete. Use admin account to create new users.');
    }
  }

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(400);
    throw new Error('User already exists.');
  }

  const user = await User.create({ name, email, password, role });
  await logAction({
    actor: user._id,
    action: 'SETUP_REGISTER',
    entityType: 'User',
    entityId: user._id.toString(),
    metadata: { email: user.email, role: user.role }
  });

  return success(
    res,
    {
      token: generateToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    },
    'Setup registration completed.',
    201
  );
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required.');
  }

  const user = await User.findOne({ email }).populate('department program');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password.');
  }

  return success(res, {
    token: generateToken(user),
    user: buildUserPayload(user)
  }, 'Login successful.');
});

const signup = asyncHandler(async (req, res) => {
  const { name, email, password, role, department, program, studentId, facultyId } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error('Name, email, password and role are required.');
  }

  if (!SIGNUP_ROLES.has(role)) {
    res.status(400);
    throw new Error('Signup is only available for faculty, student, and head accounts.');
  }

  if (role === 'student' && !studentId) {
    res.status(400);
    throw new Error('Student ID is required for student signup.');
  }

  if (role === 'faculty' && !facultyId) {
    res.status(400);
    throw new Error('Faculty ID is required for faculty signup.');
  }

  const existing = await User.findOne({ email });
  if (existing) {
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
    studentId: role === 'student' ? studentId : undefined,
    facultyId: role === 'faculty' ? facultyId : undefined
  });

  await user.populate('department program');

  await logAction({
    actor: user._id,
    action: 'SIGNUP',
    entityType: 'User',
    entityId: user._id.toString(),
    metadata: { email: user.email, role: user.role }
  });

  return success(
    res,
    {
      token: generateToken(user),
      user: buildUserPayload(user)
    },
    'Signup successful.',
    201
  );
});

const getMe = asyncHandler(async (req, res) => {
  return success(res, { user: req.user }, 'Profile fetched.');
});

module.exports = { setupRegister, login, signup, getMe };
