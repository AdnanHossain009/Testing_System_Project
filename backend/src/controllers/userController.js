const User = require('../models/User');
const Department = require('../models/Department');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { logAction } = require('../services/auditService');
const { createNotification } = require('../services/notificationService');
const { ACCREDITATION_ASSIGNED_ROLE, getAssignedRoles, hasRole } = require('../utils/roleHelpers');

const normalizeRoleFields = ({ role, studentId, facultyId, ...rest }) => ({
  ...rest,
  role,
  studentId: role === 'student' ? studentId : '',
  facultyId: role === 'faculty' ? facultyId : ''
});

const populateUserQuery = (query) =>
  query
    .select('-password')
    .populate('department', 'name code')
    .populate('program', 'name code');

const ensureDesignatedDepartmentHead = async (user) => {
  if (user.role !== 'head' || !user.department) {
    const error = new Error('Only the assigned department head can perform this action.');
    error.statusCode = 403;
    throw error;
  }

  const department = await Department.findById(user.department).select('head code name');
  if (!department || String(department.head || '') !== String(user._id)) {
    const error = new Error('You are not the designated department head for this department.');
    error.statusCode = 403;
    throw error;
  }

  return department;
};

const listUsers = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.role === ACCREDITATION_ASSIGNED_ROLE) {
    filter.$or = [{ role: ACCREDITATION_ASSIGNED_ROLE }, { assignedRoles: ACCREDITATION_ASSIGNED_ROLE }];
  } else if (req.query.role) {
    filter.role = req.query.role;
  }

  if (req.query.programId) filter.program = req.query.programId;
  if (req.query.departmentId) filter.department = req.query.departmentId;

  if (req.user.role === 'head' && req.user.department) {
    filter.department = req.user.department;
  }

  if (req.user.role === 'faculty' && !hasRole(req.user, ACCREDITATION_ASSIGNED_ROLE) && req.user.department) {
    filter.department = req.user.department;
  }

  const users = await populateUserQuery(User.find(filter));

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

  const user = await User.create(
    normalizeRoleFields({
      name,
      email,
      password,
      role,
      department,
      program,
      studentId,
      facultyId,
      approvalStatus: 'approved',
      isActive: true
    })
  );

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

  if (user.role !== 'student') {
    user.studentId = '';
  }

  if (user.role !== 'faculty') {
    user.facultyId = '';
    user.assignedRoles = [];
  }

  await user.save();

  await logAction({
    actor: req.user._id,
    action: 'UPDATE_USER',
    entityType: 'User',
    entityId: user._id.toString()
  });

  return success(res, { user }, 'User updated.');
});

const listPendingApprovals = asyncHandler(async (req, res) => {
  const filter = { approvalStatus: req.query.status || 'pending' };

  if (req.user.role === 'admin') {
    filter.role = 'head';
  } else if (req.user.role === 'head') {
    await ensureDesignatedDepartmentHead(req.user);
    filter.role = { $in: ['faculty', 'student'] };
    filter.department = req.user.department;
  } else {
    res.status(403);
    throw new Error('You are not allowed to review pending accounts.');
  }

  const users = await populateUserQuery(User.find(filter).sort({ createdAt: -1 }));
  return success(res, { users }, 'Pending approvals fetched.');
});

const reviewPendingUser = asyncHandler(async (req, res) => {
  const { decision, note = '' } = req.body;

  if (!['approve', 'reject'].includes(decision)) {
    res.status(400);
    throw new Error('Decision must be either approve or reject.');
  }

  const user = await User.findById(req.params.id).populate('department', 'name code head');

  if (!user) {
    res.status(404);
    throw new Error('User not found.');
  }

  if (user.approvalStatus !== 'pending') {
    res.status(400);
    throw new Error('This signup request has already been reviewed.');
  }

  if (user.role === 'head') {
    if (req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Only admin can review department head signups.');
    }
  } else if (['faculty', 'student'].includes(user.role)) {
    if (req.user.role !== 'head') {
      res.status(403);
      throw new Error('Only the department head can review faculty and student signups.');
    }

    await ensureDesignatedDepartmentHead(req.user);

    if (String(user.department?._id || user.department) !== String(req.user.department)) {
      res.status(403);
      throw new Error('You can only review signup requests for your own department.');
    }
  } else {
    res.status(400);
    throw new Error('This account type is not managed through the signup approval workflow.');
  }

  user.approvalStatus = decision === 'approve' ? 'approved' : 'rejected';
  user.isActive = decision === 'approve';
  user.approvalReviewedBy = req.user._id;
  user.approvalReviewedAt = new Date();
  user.approvalNote = String(note || '').trim();
  await user.save();

  if (decision === 'approve' && user.role === 'head' && user.department?._id) {
    await Department.findByIdAndUpdate(user.department._id, { head: user._id });
  }

  await createNotification({
    user: user._id,
    title: decision === 'approve' ? 'Account approved' : 'Account request reviewed',
    message:
      decision === 'approve'
        ? `Your ${user.role} account has been approved. You can now sign in.`
        : user.approvalNote
          ? `Your account request was rejected. ${user.approvalNote}`
          : 'Your account request was rejected.',
    type: decision === 'approve' ? 'success' : 'warning'
  });

  await logAction({
    actor: req.user._id,
    action: decision === 'approve' ? 'APPROVE_SIGNUP_REQUEST' : 'REJECT_SIGNUP_REQUEST',
    entityType: 'User',
    entityId: user._id.toString(),
    metadata: {
      reviewedRole: user.role,
      departmentId: user.department?._id?.toString?.() || user.department?.toString?.() || null
    }
  });

  const updatedUser = await populateUserQuery(User.findById(user._id));
  return success(res, { user: updatedUser }, `Signup request ${decision}d.`);
});

const assignAccreditationOfficer = asyncHandler(async (req, res) => {
  const department = await ensureDesignatedDepartmentHead(req.user);
  const facultyUser = await User.findById(req.params.id).populate('department', 'name code');

  if (!facultyUser) {
    res.status(404);
    throw new Error('Faculty member not found.');
  }

  if (facultyUser.role !== 'faculty') {
    res.status(400);
    throw new Error('Only approved faculty accounts can be assigned as accreditation officer.');
  }

  if ((facultyUser.approvalStatus || 'approved') !== 'approved' || !facultyUser.isActive) {
    res.status(400);
    throw new Error('This faculty account must be approved and active before assignment.');
  }

  if (String(facultyUser.department?._id || facultyUser.department) !== String(req.user.department)) {
    res.status(403);
    throw new Error('You can only assign accreditation officer access within your own department.');
  }

  const currentOfficers = await User.find({
    _id: { $ne: facultyUser._id },
    role: 'faculty',
    department: req.user.department,
    assignedRoles: ACCREDITATION_ASSIGNED_ROLE
  });

  await Promise.all(
    currentOfficers.map(async (officer) => {
      officer.assignedRoles = getAssignedRoles(officer).filter((role) => role !== ACCREDITATION_ASSIGNED_ROLE);
      await officer.save();

      await createNotification({
        user: officer._id,
        title: 'Accreditation assignment updated',
        message: `Your accreditation officer assignment for ${department.code} has been removed.`,
        type: 'warning'
      });
    })
  );

  facultyUser.assignedRoles = Array.from(new Set([...getAssignedRoles(facultyUser), ACCREDITATION_ASSIGNED_ROLE]));
  await facultyUser.save();

  await createNotification({
    user: facultyUser._id,
    title: 'Assigned as accreditation officer',
    message: `You were assigned as accreditation officer for ${department.code} by the department head.`,
    type: 'success'
  });

  await logAction({
    actor: req.user._id,
    action: 'ASSIGN_ACCREDITATION_OFFICER',
    entityType: 'User',
    entityId: facultyUser._id.toString(),
    metadata: {
      departmentId: req.user.department.toString(),
      replacedOfficerCount: currentOfficers.length
    }
  });

  const updatedUser = await populateUserQuery(User.findById(facultyUser._id));
  return success(res, { user: updatedUser }, 'Accreditation officer assigned successfully.');
});

module.exports = {
  listUsers,
  createUser,
  updateUser,
  listPendingApprovals,
  reviewPendingUser,
  assignAccreditationOfficer
};
