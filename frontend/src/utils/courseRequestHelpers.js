export const createCloRow = () => ({
  code: '',
  description: '',
  bloomLevel: 'C3'
});

export const createPloRow = () => ({
  code: '',
  description: ''
});

export const createMappingRow = () => ({
  cloCode: '',
  ploCode: '',
  weight: 1
});

export const createAssessmentRow = () => ({
  title: '',
  type: 'quiz',
  cloCodesText: '',
  cloDistributionText: '',
  totalMarks: '',
  weightage: '',
  note: ''
});

export const formatCloDistribution = (distribution = []) =>
  (distribution || [])
    .map((item) => `${item.cloCode}:${item.marks}`)
    .join('\n');

export const parseCodeList = (value = '') =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const parseCloDistributionText = (value = '') =>
  String(value || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [cloCode, marks] = line.split(':');
      return {
        cloCode: cloCode?.trim() || '',
        marks: Number(marks)
      };
    })
    .filter((item) => item.cloCode && Number.isFinite(item.marks));

export const assessmentToFormRow = (assessment = {}) => ({
  title: assessment.title || '',
  type: assessment.type || 'quiz',
  cloCodesText: (assessment.cloCodes || []).join(', '),
  cloDistributionText: formatCloDistribution(assessment.cloDistribution),
  totalMarks: assessment.totalMarks ?? '',
  weightage: assessment.weightage ?? '',
  note: assessment.note || ''
});

export const assessmentRowToPayload = (assessment = {}) => ({
  title: String(assessment.title || '').trim(),
  type: String(assessment.type || 'quiz').trim().toLowerCase(),
  cloCodes: parseCodeList(assessment.cloCodesText),
  cloDistribution: parseCloDistributionText(assessment.cloDistributionText),
  totalMarks: Number(assessment.totalMarks),
  weightage: Number(assessment.weightage),
  note: String(assessment.note || '').trim()
});

export const cloneProgramPlos = (program) =>
  (program?.plos || []).map((item) => ({
    code: item.code || '',
    description: item.description || ''
  }));

export const formatFileSize = (value = 0) => {
  const size = Number(value) || 0;

  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }

  if (size >= 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${size} B`;
};

export const getStatusClassName = (status = '') => {
  const normalized = String(status || '').toLowerCase();

  if (normalized === 'approved' || normalized === 'success') return 'badge-success';
  if (normalized === 'rejected' || normalized === 'failed') return 'badge-danger';
  if (normalized === 'partial') return 'badge-warning';
  return 'badge-muted';
};
