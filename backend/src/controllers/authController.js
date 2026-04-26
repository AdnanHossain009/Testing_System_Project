const User = require('../models/User');
const Department = require('../models/Department');
const Program = require('../models/Program');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');
const { logAction } = require('../services/auditService');
const { createNotification } = require('../services/notificationService');
const { getAssignedRoles, getPreferredDashboard, getUserRoles } = require('../utils/roleHelpers');

const SIGNUP_ROLES = new Set(['faculty', 'student', 'head']);
const getApprovalStatus = (user) => user?.approvalStatus || 'approved';

const buildUserPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  assignedRoles: getAssignedRoles(user),
  effectiveRoles: getUserRoles(user),
  preferredDashboard: getPreferredDashboard(user),
  department: user.department,
  program: user.program,
  studentId: user.studentId,
  facultyId: user.facultyId,
  isActive: user.isActive,
  approvalStatus: getApprovalStatus(user)
});

const getPopulatedUserById = (id) => User.findById(id).select('-password').populate('department program');

const buildPendingApprovalMessage = (role) =>
  role === 'head'
    ? 'Signup request submitted. An admin must approve your department head account before you can sign in.'
    : 'Signup request submitted. Your department head must approve your account before you can sign in.';

const buildApprovalBlockedMessage = (user) => {
  if (getApprovalStatus(user) === 'pending') {
    return user.role === 'head'
      ? 'Your department head account is awaiting admin approval.'
      : 'Your account is awaiting approval from your department head.';
  }

  if (getApprovalStatus(user) === 'rejected') {
    return user.approvalNote
      ? `Your account request was rejected. ${user.approvalNote}`
      : 'Your account request was rejected.';
  }

  return 'Your account is not currently allowed to sign in.';
};

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

  if (getApprovalStatus(user) !== 'approved') {
    res.status(403);
    throw new Error(buildApprovalBlockedMessage(user));
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('Your account is currently inactive.');
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

  if (!department) {
    res.status(400);
    throw new Error('Department is required for faculty, student, and head signup.');
  }

  if (role === 'student' && !studentId) {
    res.status(400);
    throw new Error('Student ID is required for student signup.');
  }

  if (role === 'faculty' && !facultyId) {
    res.status(400);
    throw new Error('Faculty ID is required for faculty signup.');
  }

  const normalizedEmail = String(email || '').trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    res.status(400);
    throw new Error('User already exists.');
  }

  const departmentDoc = await Department.findById(department).populate('head', 'name email isActive approvalStatus');

  if (!departmentDoc) {
    res.status(404);
    throw new Error('Selected department was not found.');
  }

  let programDoc = null;
  if (program) {
    programDoc = await Program.findById(program);

    if (!programDoc) {
      res.status(404);
      throw new Error('Selected program was not found.');
    }

    if (String(programDoc.department) !== String(departmentDoc._id)) {
      res.status(400);
      throw new Error('Selected program does not belong to the chosen department.');
    }
  }

  let approvalRecipients = [];

  if (role === 'head') {
    approvalRecipients = await User.find({
      role: 'admin',
      isActive: true
    }).select('_id name');

    if (!approvalRecipients.length) {
      res.status(400);
      throw new Error('No active admin is available to approve this department head signup.');
    }
  } else {
    if (!departmentDoc.head?._id) {
      res.status(400);
      throw new Error('This department does not have an assigned department head yet.');
    }

    if (getApprovalStatus(departmentDoc.head) !== 'approved' || !departmentDoc.head.isActive) {
      res.status(400);
      throw new Error('The assigned department head is not currently available to approve new accounts.');
    }

    approvalRecipients = [departmentDoc.head];
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    role,
    department: departmentDoc._id,
    program: programDoc?._id,
    studentId: role === 'student' ? studentId : undefined,
    facultyId: role === 'faculty' ? facultyId : undefined,
    isActive: false,
    approvalStatus: 'pending'
  });

  await user.populate('department program');

  await Promise.all(
    approvalRecipients.map((recipient) =>
      createNotification({
        user: recipient._id,
        title: role === 'head' ? 'New department head signup request' : 'New account approval request',
        message:
          role === 'head'
            ? `${user.name} requested department head access for ${departmentDoc.code}.`
            : `${user.name} requested a ${role} account for ${departmentDoc.code}.`,
        type: 'info'
      })
    )
  );

  await logAction({
    actor: user._id,
    action: 'SIGNUP_REQUEST',
    entityType: 'User',
    entityId: user._id.toString(),
    metadata: {
      email: user.email,
      role: user.role,
      departmentId: departmentDoc._id.toString(),
      programId: programDoc?._id?.toString() || null
    }
  });

  return success(
    res,
    {
      requiresApproval: true,
      approvalStatus: getApprovalStatus(user),
      user: buildUserPayload(user)
    },
    buildPendingApprovalMessage(role),
    201
  );
});

const getMe = asyncHandler(async (req, res) => {
  const user = await getPopulatedUserById(req.user._id);
  return success(res, { user: buildUserPayload(user) }, 'Profile fetched.');
});

const updateMe = asyncHandler(async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found.');
  }

  const normalizedEmail = email?.trim().toLowerCase();
  const hasEmailChange = normalizedEmail && normalizedEmail !== user.email;
  const hasPasswordChange = Boolean(newPassword);

  if (!hasEmailChange && !hasPasswordChange) {
    res.status(400);
    throw new Error('Provide a new email or password to update your account.');
  }

  if (hasEmailChange) {
    const existingUser = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
    if (existingUser) {
      res.status(400);
      throw new Error('Another account already uses this email.');
    }

    user.email = normalizedEmail;
  }

  if (hasPasswordChange) {
    if (!currentPassword) {
      res.status(400);
      throw new Error('Current password is required to set a new password.');
    }

    const passwordMatches = await user.matchPassword(currentPassword);
    if (!passwordMatches) {
      res.status(400);
      throw new Error('Current password is incorrect.');
    }

    if (String(newPassword).length < 6) {
      res.status(400);
      throw new Error('New password must be at least 6 characters long.');
    }

    user.password = newPassword;
  }

  await user.save();
  const updatedUser = await getPopulatedUserById(user._id);

  await logAction({
    actor: user._id,
    action: 'UPDATE_OWN_ACCOUNT',
    entityType: 'User',
    entityId: user._id.toString(),
    metadata: {
      emailChanged: hasEmailChange,
      passwordChanged: hasPasswordChange
    }
  });

  return success(res, { user: buildUserPayload(updatedUser) }, 'Account updated successfully.');
});

module.exports = { setupRegister, login, signup, getMe, updateMe };
