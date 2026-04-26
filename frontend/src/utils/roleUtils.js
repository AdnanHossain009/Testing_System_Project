const roleLabels = {
  admin: 'Admin',
  faculty: 'Faculty',
  student: 'Student',
  head: 'Department Head',
  accreditation_officer: 'Accreditation Officer'
};

export const getEffectiveRoles = (user) => {
  if (!user) return [];

  const roles = [
    user.role,
    ...(Array.isArray(user.assignedRoles) ? user.assignedRoles : []),
    ...(Array.isArray(user.effectiveRoles) ? user.effectiveRoles : [])
  ].filter(Boolean);

  return Array.from(new Set(roles));
};

export const hasRole = (user, rolesInput) => {
  const requestedRoles = Array.isArray(rolesInput) ? rolesInput : [rolesInput];
  const currentRoles = new Set(getEffectiveRoles(user));
  return requestedRoles.some((role) => currentRoles.has(role));
};

export const getDashboardPath = (user) => {
  if (!user) return '/login';

  if (user.preferredDashboard) {
    return user.preferredDashboard;
  }

  if (user.role === 'faculty' && hasRole(user, 'accreditation_officer')) {
    return '/dashboard/accreditation';
  }

  switch (user.role) {
    case 'admin':
      return '/dashboard/admin';
    case 'faculty':
      return '/dashboard/faculty';
    case 'student':
      return '/dashboard/student';
    case 'head':
      return '/dashboard/head';
    case 'accreditation_officer':
      return '/dashboard/accreditation';
    default:
      return '/login';
  }
};

export const getRoleLabel = (user) => {
  if (!user) return 'User';

  const orderedRoles = [user.role, ...getEffectiveRoles(user).filter((role) => role !== user.role)];
  return orderedRoles.map((role) => roleLabels[role] || role).join(' / ');
};

export const getRoleOptions = () => roleLabels;
