export const formatDisplayDate = (value) => {
  if (!value) return 'N/A';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

export const getGovernanceStatusClassName = (status = '') => {
  const normalized = String(status || '').toLowerCase();

  if (normalized === 'balanced') return 'badge-success';
  if (normalized === 'unmapped') return 'badge-danger';
  if (normalized === 'weakly_assessed') return 'badge-warning';
  if (normalized === 'under_covered') return 'badge-warning';
  if (normalized === 'over_covered') return 'badge-muted';
  return 'badge-muted';
};

export const getHeatLevelClassName = (level = '') => {
  const normalized = String(level || '').toLowerCase();

  if (normalized === 'heat-strong') return 'heat-strong';
  if (normalized === 'heat-medium') return 'heat-medium';
  if (normalized === 'heat-light') return 'heat-light';
  return 'heat-none';
};

export const buildReportQueryString = (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.academicTerm) params.set('academicTerm', filters.academicTerm);
  if (filters.departmentId) params.set('departmentId', filters.departmentId);
  if (filters.programId) params.set('programId', filters.programId);
  if (filters.courseId) params.set('courseId', filters.courseId);

  return params.toString();
};

export const getIssueTypeLabel = (issueType = '') => {
  const normalized = String(issueType || '').toLowerCase();

  if (normalized === 'unmapped_plo') return 'Unmapped PLO';
  if (normalized === 'under_covered_plo') return 'Under-Covered PLO';
  if (normalized === 'over_covered_plo') return 'Over-Covered PLO';
  if (normalized === 'weakly_assessed') return 'Weakly Assessed';
  if (normalized === 'below_target') return 'Below Target';
  return issueType || 'Issue';
};
