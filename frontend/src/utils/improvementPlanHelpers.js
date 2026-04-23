export const getImprovementStatusClassName = (status) => {
  const normalized = String(status || '').toLowerCase();

  if (normalized === 'reviewed' || normalized === 'completed') {
    return 'badge-success';
  }

  if (normalized === 'in_progress') {
    return 'badge-warning';
  }

  if (normalized === 'open') {
    return 'badge-danger';
  }

  return 'badge-muted';
};

export const formatDisplayDate = (value) => {
  if (!value) return 'N/A';

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
};

export const formatDateInput = (value) => {
  if (!value) return '';

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};

export const buildScopeText = (item) => {
  if (item?.course?.code) {
    return `${item.course.code} (${item.course.name || 'Course'})`;
  }

  if (item?.program?.code) {
    return `${item.program.code} (${item.program.name || 'Program'})`;
  }

  if (item?.department?.code) {
    return `${item.department.code} (${item.department.name || 'Department'})`;
  }

  return 'Institution-wide';
};

export const buildOutcomeScopeText = (item) => {
  if (item?.courseCode) {
    return `${item.courseCode} - ${item.courseName || 'Course'}`;
  }

  if (item?.programCode) {
    return `${item.programCode} - ${item.departmentCode || 'Program'}`;
  }

  return item?.departmentCode || 'Institution-wide';
};
