const User = require('../models/User');
const { generateToken } = require('../utils/jwtUtils');
const { sendSuccess, sendError } = require('../utils/responseUtils');
const { MESSAGES, ROLES } = require('../config/constants');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, department, studentId, facultyId, semester } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return sendError(res, 400, 'User with this email already exists');
  }

  // Create user
  const userData = {
    name,
    email,
    password,
    role: role || ROLES.STUDENT,
    department,
    semester,
  };

  // Add role-specific fields
  if (role === ROLES.STUDENT && studentId) {
    userData.studentId = studentId;
  }
  if (role === ROLES.FACULTY && facultyId) {
    userData.facultyId = facultyId;
  }

  const user = await User.create(userData);

  // Generate token
  const token = generateToken(user._id);

  sendSuccess(res, 201, MESSAGES.SUCCESS.REGISTERED, {
    user,
    token,
  });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if user exists and get password
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return sendError(res, 401, MESSAGES.ERROR.INVALID_CREDENTIALS);
  }

  // Check if account is active
  if (!user.isActive) {
    return sendError(res, 401, 'Your account has been deactivated. Please contact administrator.');
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    return sendError(res, 401, MESSAGES.ERROR.INVALID_CREDENTIALS);
  }

  // Generate token
  const token = generateToken(user._id);

  // Remove password from response
  user.password = undefined;

  sendSuccess(res, 200, MESSAGES.SUCCESS.LOGIN, {
    user,
    token,
  });
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return sendError(res, 404, MESSAGES.ERROR.NOT_FOUND);
  }

  sendSuccess(res, 200, 'Profile fetched successfully', user);
});

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, department, semester } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    return sendError(res, 404, MESSAGES.ERROR.NOT_FOUND);
  }

  // Update allowed fields
  if (name) user.name = name;
  if (department) user.department = department;
  if (semester && user.role === ROLES.STUDENT) user.semester = semester;

  await user.save();

  sendSuccess(res, 200, MESSAGES.SUCCESS.UPDATED, user);
});

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    return sendError(res, 404, MESSAGES.ERROR.NOT_FOUND);
  }

  // Verify current password
  const isPasswordValid = await user.comparePassword(currentPassword);

  if (!isPasswordValid) {
    return sendError(res, 401, 'Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  sendSuccess(res, 200, 'Password changed successfully');
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  // Token invalidation handled on client side
  sendSuccess(res, 200, MESSAGES.SUCCESS.LOGOUT);
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout,
};
