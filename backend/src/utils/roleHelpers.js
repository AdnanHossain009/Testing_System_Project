const ACCREDITATION_ASSIGNED_ROLE = 'accreditation_officer';

const getAssignedRoles = (user) =>
  Array.isArray(user?.assignedRoles) ? user.assignedRoles.filter(Boolean) : [];

const getUserRoles = (user) =>
  Array.from(new Set([user?.role, ...getAssignedRoles(user)].filter(Boolean)));

const hasRole = (user, ...rolesInput) => {
  const requestedRoles = Array.isArray(rolesInput[0]) ? rolesInput[0] : rolesInput;
  const currentRoles = new Set(getUserRoles(user));

  return requestedRoles.some((role) => currentRoles.has(role));
};

const getPreferredDashboard = (user) => {
  if (!user) return '/login';

  switch (user.role) {
    case 'admin':
      return '/dashboard/admin';
    case 'student':
      return '/dashboard/student';
    case 'head':
      return '/dashboard/head';
    case 'accreditation_officer':
      return '/dashboard/accreditation';
    case 'faculty':
      return hasRole(user, ACCREDITATION_ASSIGNED_ROLE) ? '/dashboard/accreditation' : '/dashboard/faculty';
    default:
      return '/login';
  }
};

module.exports = {
  ACCREDITATION_ASSIGNED_ROLE,
  getAssignedRoles,
  getUserRoles,
  hasRole,
  getPreferredDashboard
};
