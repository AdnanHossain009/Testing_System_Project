import api from '../api/client';
import { formatFileSize } from './courseRequestHelpers';
import { hasRole } from './roleUtils';

export const evidenceTypeOptions = [
  { value: 'report', label: 'Report' },
  { value: 'project', label: 'Project' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'lab_document', label: 'Lab Document' },
  { value: 'capstone', label: 'Capstone' },
  { value: 'assessment_evidence', label: 'Assessment Evidence' },
  { value: 'other', label: 'Other' }
];

export const visibilityOptions = [
  { value: 'private', label: 'Private' },
  { value: 'department', label: 'Department' },
  { value: 'institution', label: 'Institution' }
];

export const sampleGroupOptions = [
  { value: 'course', label: 'Course' },
  { value: 'program', label: 'Program' },
  { value: 'term', label: 'Term' },
  { value: 'outcome', label: 'Outcome' },
  { value: 'custom', label: 'Custom' }
];

export const formatEvidenceDate = (value) => {
  if (!value) return 'N/A';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

export const formatEvidenceDateInput = (value) => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toISOString().slice(0, 10);
};

export const getArtifactStatusClassName = (status = '') => {
  const normalized = String(status || '').toLowerCase();
  return normalized === 'active' ? 'badge-success' : 'badge-muted';
};

export const getVisibilityClassName = (visibility = '') => {
  const normalized = String(visibility || '').toLowerCase();

  if (normalized === 'institution') return 'badge-warning';
  if (normalized === 'private') return 'badge-muted';
  return 'badge-success';
};

export const getSampleSetStatusClassName = (status = '') => {
  const normalized = String(status || '').toLowerCase();

  if (normalized === 'reviewed') return 'badge-success';
  if (normalized === 'in_review') return 'badge-warning';
  if (normalized === 'archived') return 'badge-muted';
  return 'badge-muted';
};

export const getReviewStatusClassName = (status = '') => {
  const normalized = String(status || '').toLowerCase();

  if (normalized === 'reviewed') return 'badge-success';
  if (normalized === 'flagged') return 'badge-danger';
  if (normalized === 'in_review') return 'badge-warning';
  return 'badge-muted';
};

export const buildArtifactScopeText = (artifact = {}) => {
  if (artifact.course?.code) {
    return `${artifact.course.code} - ${artifact.course.name}`;
  }

  if (artifact.program?.code) {
    return `${artifact.program.code} - ${artifact.program.name}`;
  }

  if (artifact.department?.code) {
    return `${artifact.department.code} - ${artifact.department.name}`;
  }

  return 'Unscoped evidence';
};

export const buildArtifactOutcomeText = (artifact = {}) => {
  if (!artifact.outcomeType || !artifact.outcomeCode) {
    return 'Not linked';
  }

  return `${artifact.outcomeType} ${artifact.outcomeCode}`;
};

export const buildSampleSetScopeText = (sampleSet = {}) => {
  if (sampleSet.course?.code) {
    return `${sampleSet.course.code} - ${sampleSet.course.name}`;
  }

  if (sampleSet.program?.code) {
    return `${sampleSet.program.code} - ${sampleSet.program.name}`;
  }

  if (sampleSet.department?.code) {
    return `${sampleSet.department.code} - ${sampleSet.department.name}`;
  }

  if (sampleSet.academicTerm) {
    return sampleSet.academicTerm;
  }

  return 'Institution-wide';
};

export const canReviewSampleSet = (user, sampleSet) => {
  if (!user || !sampleSet) return false;
  if (hasRole(user, 'accreditation_officer')) return true;

  return String(sampleSet.reviewer?._id || sampleSet.reviewer || '') === String(user._id);
};

export const downloadEvidenceArtifact = async (artifactId, fallbackName = 'evidence-file') => {
  const response = await api.get(`/evidence/artifacts/${artifactId}/download`, {
    responseType: 'blob'
  });

  const fileBlob = new Blob([response.data], {
    type: response.headers['content-type'] || 'application/octet-stream'
  });
  const objectUrl = window.URL.createObjectURL(fileBlob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fallbackName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
};

export { formatFileSize };
