const EvidenceArtifact = require('../models/EvidenceArtifact');
const EvidenceSampleSet = require('../models/EvidenceSampleSet');
const ImprovementPlan = require('../models/ImprovementPlan');
const { listBelowTargetOutcomes } = require('./improvementPlanningService');
const { buildCurriculumGovernanceSummary } = require('./curriculumGovernanceService');

const round = (value) => Number((Number(value) || 0).toFixed(2));
const normalizeText = (value = '') => String(value || '').trim();

const REPORT_CATALOG = [
  {
    type: 'program_attainment',
    title: 'Program Attainment Report',
    description: 'Program-level attainment, target alignment, and course contribution summary.',
    formats: ['pdf', 'json', 'csv']
  },
  {
    type: 'plo_summary',
    title: 'PLO Summary Report',
    description: 'PLO coverage, mapped courses, attainment vs target, and governance status.',
    formats: ['pdf', 'json', 'csv']
  },
  {
    type: 'weak_outcome',
    title: 'Weak Outcome Report',
    description: 'Below-target outcomes with linked plans, evidence counts, and immediate governance concerns.',
    formats: ['pdf', 'json', 'csv']
  },
  {
    type: 'improvement_plan_summary',
    title: 'Improvement Plan Summary',
    description: 'Open, overdue, completed, and reviewed improvement plans across the selected scope.',
    formats: ['pdf', 'json', 'csv']
  },
  {
    type: 'evidence_summary',
    title: 'Evidence Summary Report',
    description: 'Evidence repository counts, sample-set coverage, and linked outcome evidence statistics.',
    formats: ['pdf', 'json', 'csv']
  },
  {
    type: 'curriculum_gap',
    title: 'Curriculum Gap Report',
    description: 'Unmapped, under-covered, over-covered, and weakly assessed curriculum areas.',
    formats: ['pdf', 'json', 'csv']
  },
  {
    type: 'self_study_summary',
    title: 'Self-Study Summary Report',
    description: 'Institutional accreditation narrative built from attainment, gaps, plans, evidence, and governance data.',
    formats: ['pdf', 'json', 'csv']
  }
];

const getReportCatalog = () => REPORT_CATALOG;

const getReportDefinition = (type) => REPORT_CATALOG.find((item) => item.type === type);

const normalizeReportFilters = (query = {}) => ({
  academicTerm: normalizeText(query.academicTerm),
  departmentId: normalizeText(query.departmentId),
  programId: normalizeText(query.programId),
  courseId: normalizeText(query.courseId)
});

const buildPlanFilter = (filters = {}) => {
  const filter = {};

  if (filters.academicTerm) {
    filter.academicTerm = filters.academicTerm;
  }

  if (filters.departmentId) {
    filter.department = filters.departmentId;
  }

  if (filters.programId) {
    filter.program = filters.programId;
  }

  if (filters.courseId) {
    filter.course = filters.courseId;
  }

  return filter;
};

const buildEvidenceFilter = (filters = {}) => {
  const filter = {};

  if (filters.academicTerm) {
    filter.academicTerm = filters.academicTerm;
  }

  if (filters.departmentId) {
    filter.department = filters.departmentId;
  }

  if (filters.programId) {
    filter.program = filters.programId;
  }

  if (filters.courseId) {
    filter.course = filters.courseId;
  }

  return filter;
};

const buildFilterItems = (filters = {}) =>
  [
    ['Academic Term', filters.academicTerm || 'All terms'],
    ['Department', filters.departmentId || 'All departments'],
    ['Program', filters.programId || 'All programs'],
    ['Course', filters.courseId || 'All courses']
  ].map(([label, value]) => ({ label, value }));

const buildEvidenceSummaryData = async (filters = {}) => {
  const [artifacts, sampleSets] = await Promise.all([
    EvidenceArtifact.find(buildEvidenceFilter(filters))
      .populate('course', 'name code')
      .populate('program', 'name code')
      .populate('department', 'name code')
      .populate('uploader', 'name role')
      .sort({ createdAt: -1 })
      .lean(),
    EvidenceSampleSet.find(buildPlanFilter(filters))
      .populate('course', 'name code')
      .populate('program', 'name code')
      .populate('department', 'name code')
      .populate('reviewer', 'name role')
      .sort({ updatedAt: -1 })
      .lean()
  ]);

  const artifactsByType = Object.entries(
    artifacts.reduce((accumulator, artifact) => {
      const key = artifact.evidenceType || 'other';
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {})
  ).map(([type, count]) => ({ type, count }));

  const artifactsByOutcomeType = Object.entries(
    artifacts.reduce((accumulator, artifact) => {
      const key = artifact.outcomeType || 'Unlinked';
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {})
  ).map(([outcomeType, count]) => ({ outcomeType, count }));

  return {
    artifacts,
    sampleSets,
    summary: {
      totalArtifacts: artifacts.length,
      activeArtifacts: artifacts.filter((artifact) => artifact.status === 'active').length,
      institutionVisibleArtifacts: artifacts.filter((artifact) => artifact.visibility === 'institution').length,
      totalSampleSets: sampleSets.length,
      inReviewSampleSets: sampleSets.filter((item) => item.status === 'in_review').length,
      reviewedSampleSets: sampleSets.filter((item) => item.status === 'reviewed').length
    },
    artifactsByType,
    artifactsByOutcomeType
  };
};

const buildImprovementPlanSummaryData = async (filters = {}) => {
  const plans = await ImprovementPlan.find(buildPlanFilter(filters))
    .populate('department', 'name code')
    .populate('program', 'name code')
    .populate('course', 'name code')
    .populate('assignedTo', 'name role')
    .sort({ dueDate: 1, createdAt: -1 })
    .lean();

  const now = Date.now();
  return {
    plans,
    summary: {
      totalPlans: plans.length,
      openPlans: plans.filter((item) => item.status === 'open').length,
      inProgressPlans: plans.filter((item) => item.status === 'in_progress').length,
      completedPlans: plans.filter((item) => item.status === 'completed').length,
      reviewedPlans: plans.filter((item) => item.status === 'reviewed').length,
      overduePlans: plans.filter((item) => ['open', 'in_progress'].includes(item.status) && new Date(item.dueDate).getTime() < now).length
    }
  };
};

const buildProgramAttainmentReport = async (filters = {}) => {
  const governance = await buildCurriculumGovernanceSummary(filters);
  const programRows = governance.courseToPloMatrix.map((program) => {
    const programOutcomeRows = governance.outcomeCoverageSummary.filter((item) => item.programId === program.programId);
    const programCourses = governance.courseContributionSummary.filter((item) => item.programCode === program.programCode);
    const averageAttainment = round(
      programOutcomeRows.reduce((sum, item) => sum + (item.currentAttainment || 0), 0) / (programOutcomeRows.length || 1)
    );

    return {
      programCode: program.programCode,
      programName: program.programName,
      departmentCode: program.departmentCode,
      totalCourses: program.courseRows.length,
      averageAttainment,
      belowTargetOutcomes: programOutcomeRows.filter((item) => item.gap > 0).length,
      weakCoverageAreas: governance.weakCoverageAreas.filter((item) => item.programId === program.programId).length,
      averageFuzzy: round(
        programCourses.reduce((sum, item) => sum + (item.averageFuzzy || 0), 0) / (programCourses.length || 1)
      )
    };
  });

  return {
    title: 'Program Attainment Report',
    description: 'Program-level attainment and course contribution summary against the selected accreditation scope.',
    summaryCards: [
      { label: 'Programs', value: governance.summary.totalPrograms },
      { label: 'Courses', value: governance.summary.totalCourses },
      { label: 'Below Target PLOs', value: governance.outcomeCoverageSummary.filter((item) => item.gap > 0).length },
      { label: 'Weak Coverage Areas', value: governance.weakCoverageAreas.length }
    ],
    sections: [
      {
        key: 'filters',
        title: 'Applied Filters',
        type: 'list',
        items: buildFilterItems(filters)
      },
      {
        key: 'program-attainment',
        title: 'Program Attainment Overview',
        type: 'table',
        columns: [
          { key: 'programCode', label: 'Program' },
          { key: 'departmentCode', label: 'Department' },
          { key: 'totalCourses', label: 'Courses' },
          { key: 'averageAttainment', label: 'Avg Attainment' },
          { key: 'averageFuzzy', label: 'Avg Fuzzy' },
          { key: 'belowTargetOutcomes', label: 'Below Target' },
          { key: 'weakCoverageAreas', label: 'Coverage Gaps' }
        ],
        rows: programRows
      },
      {
        key: 'course-contribution',
        title: 'Course Contribution Summary',
        type: 'table',
        columns: [
          { key: 'courseCode', label: 'Course' },
          { key: 'programCode', label: 'Program' },
          { key: 'mappedPloCount', label: 'Mapped PLOs' },
          { key: 'mappedCloCount', label: 'Mapped CLOs' },
          { key: 'totalAssessments', label: 'Assessments' },
          { key: 'averageFuzzy', label: 'Avg Fuzzy' },
          { key: 'weakOutcomeCount', label: 'Weak Outcomes' }
        ],
        rows: governance.courseContributionSummary
      }
    ]
  };
};

const buildPloSummaryReport = async (filters = {}) => {
  const governance = await buildCurriculumGovernanceSummary(filters);

  return {
    title: 'PLO Summary Report',
    description: 'Program-level PLO coverage, attainment, target gap, and governance status.',
    summaryCards: [
      { label: 'Total PLOs', value: governance.summary.totalPlos },
      { label: 'Mapped PLOs', value: governance.summary.mappedPlos },
      { label: 'Unmapped PLOs', value: governance.summary.unmappedPlos },
      { label: 'Weakly Assessed', value: governance.summary.weaklyAssessedAreas }
    ],
    sections: [
      {
        key: 'filters',
        title: 'Applied Filters',
        type: 'list',
        items: buildFilterItems(filters)
      },
      {
        key: 'plo-summary',
        title: 'Outcome Coverage Summary',
        type: 'table',
        columns: [
          { key: 'programCode', label: 'Program' },
          { key: 'ploCode', label: 'PLO' },
          { key: 'coverageCourseCount', label: 'Mapped Courses' },
          { key: 'mappedCloCount', label: 'Mapped CLOs' },
          { key: 'assessmentCoverageCount', label: 'Assessments' },
          { key: 'currentAttainment', label: 'Current' },
          { key: 'targetAttainment', label: 'Target' },
          { key: 'gap', label: 'Gap' },
          { key: 'status', label: 'Status' }
        ],
        rows: governance.outcomeCoverageSummary
      }
    ]
  };
};

const buildWeakOutcomeReport = async (filters = {}) => {
  const [outcomes, evidenceSummary] = await Promise.all([
    listBelowTargetOutcomes({ role: 'admin' }, { ...filters, onlyBelowTarget: 'true' }),
    buildEvidenceSummaryData(filters)
  ]);

  const evidenceKeyMap = new Map();
  evidenceSummary.artifacts.forEach((artifact) => {
    const key = [artifact.outcomeType || '', artifact.outcomeCode || '', String(artifact.course || ''), String(artifact.program || ''), String(artifact.department || '')].join('|');
    evidenceKeyMap.set(key, (evidenceKeyMap.get(key) || 0) + 1);
  });

  const rows = outcomes.map((item) => ({
    outcomeType: item.outcomeType,
    outcomeCode: item.outcomeCode,
    courseCode: item.courseCode || 'N/A',
    programCode: item.programCode || 'N/A',
    currentAttainment: item.currentAttainment,
    targetAttainment: item.targetAttainment,
    gap: item.gap,
    openPlanCount: item.openPlanCount,
    evidenceCount:
      evidenceKeyMap.get(
        [item.outcomeType, item.outcomeCode, item.courseId || '', item.programId || '', item.departmentId || ''].join('|')
      ) || 0
  }));

  return {
    title: 'Weak Outcome Report',
    description: 'Below-target outcomes with linked action pressure and evidence availability.',
    summaryCards: [
      { label: 'Below Target Outcomes', value: outcomes.length },
      { label: 'Total Open Plans', value: rows.reduce((sum, item) => sum + item.openPlanCount, 0) },
      { label: 'Evidence-Linked Outcomes', value: rows.filter((item) => item.evidenceCount > 0).length },
      { label: 'Largest Gap', value: rows[0]?.gap || 0 }
    ],
    sections: [
      {
        key: 'filters',
        title: 'Applied Filters',
        type: 'list',
        items: buildFilterItems(filters)
      },
      {
        key: 'weak-outcomes',
        title: 'Below-Target Outcome Register',
        type: 'table',
        columns: [
          { key: 'outcomeType', label: 'Type' },
          { key: 'outcomeCode', label: 'Outcome' },
          { key: 'courseCode', label: 'Course' },
          { key: 'programCode', label: 'Program' },
          { key: 'currentAttainment', label: 'Current' },
          { key: 'targetAttainment', label: 'Target' },
          { key: 'gap', label: 'Gap' },
          { key: 'openPlanCount', label: 'Plans' },
          { key: 'evidenceCount', label: 'Evidence' }
        ],
        rows
      }
    ]
  };
};

const buildImprovementPlanSummaryReport = async (filters = {}) => {
  const planData = await buildImprovementPlanSummaryData(filters);
  const rows = planData.plans.map((plan) => ({
    outcomeType: plan.outcomeType,
    outcomeCode: plan.outcomeCode,
    status: plan.status,
    assignedTo: plan.assignedTo?.name || 'Unassigned',
    dueDate: plan.dueDate ? new Date(plan.dueDate).toISOString().slice(0, 10) : 'N/A',
    courseCode: plan.course?.code || 'N/A',
    programCode: plan.program?.code || 'N/A',
    gap: round(plan.gap)
  }));

  return {
    title: 'Improvement Plan Summary',
    description: 'Status-oriented view of action plans connected to weak outcomes and curriculum governance.',
    summaryCards: [
      { label: 'Total Plans', value: planData.summary.totalPlans },
      { label: 'Open Plans', value: planData.summary.openPlans },
      { label: 'Overdue Plans', value: planData.summary.overduePlans },
      { label: 'Reviewed Plans', value: planData.summary.reviewedPlans }
    ],
    sections: [
      {
        key: 'filters',
        title: 'Applied Filters',
        type: 'list',
        items: buildFilterItems(filters)
      },
      {
        key: 'improvement-plan-register',
        title: 'Improvement Plan Register',
        type: 'table',
        columns: [
          { key: 'outcomeType', label: 'Type' },
          { key: 'outcomeCode', label: 'Outcome' },
          { key: 'courseCode', label: 'Course' },
          { key: 'programCode', label: 'Program' },
          { key: 'assignedTo', label: 'Assigned To' },
          { key: 'dueDate', label: 'Due Date' },
          { key: 'status', label: 'Status' },
          { key: 'gap', label: 'Gap' }
        ],
        rows
      }
    ]
  };
};

const buildEvidenceSummaryReport = async (filters = {}) => {
  const evidenceData = await buildEvidenceSummaryData(filters);
  const rows = evidenceData.artifacts.map((artifact) => ({
    title: artifact.title,
    evidenceType: artifact.evidenceType,
    courseCode: artifact.course?.code || 'N/A',
    programCode: artifact.program?.code || 'N/A',
    outcomeLink: artifact.outcomeType && artifact.outcomeCode ? `${artifact.outcomeType} ${artifact.outcomeCode}` : 'Unlinked',
    visibility: artifact.visibility,
    status: artifact.status
  }));

  return {
    title: 'Evidence Summary Report',
    description: 'Repository coverage and sampling readiness across the selected institutional scope.',
    summaryCards: [
      { label: 'Artifacts', value: evidenceData.summary.totalArtifacts },
      { label: 'Active Artifacts', value: evidenceData.summary.activeArtifacts },
      { label: 'Sample Sets', value: evidenceData.summary.totalSampleSets },
      { label: 'In Review Sets', value: evidenceData.summary.inReviewSampleSets }
    ],
    sections: [
      {
        key: 'filters',
        title: 'Applied Filters',
        type: 'list',
        items: buildFilterItems(filters)
      },
      {
        key: 'evidence-by-type',
        title: 'Evidence Type Summary',
        type: 'table',
        columns: [
          { key: 'type', label: 'Evidence Type' },
          { key: 'count', label: 'Count' }
        ],
        rows: evidenceData.artifactsByType
      },
      {
        key: 'evidence-register',
        title: 'Evidence Register',
        type: 'table',
        columns: [
          { key: 'title', label: 'Title' },
          { key: 'evidenceType', label: 'Type' },
          { key: 'courseCode', label: 'Course' },
          { key: 'programCode', label: 'Program' },
          { key: 'outcomeLink', label: 'Outcome' },
          { key: 'visibility', label: 'Visibility' },
          { key: 'status', label: 'Status' }
        ],
        rows
      }
    ]
  };
};

const buildCurriculumGapReport = async (filters = {}) => {
  const governance = await buildCurriculumGovernanceSummary(filters);

  return {
    title: 'Curriculum Gap Report',
    description: 'Coverage gaps and weak curriculum governance areas requiring accreditation attention.',
    summaryCards: [
      { label: 'Unmapped PLOs', value: governance.summary.unmappedPlos },
      { label: 'Under-Covered PLOs', value: governance.summary.underCoveredPlos },
      { label: 'Over-Covered PLOs', value: governance.summary.overCoveredPlos },
      { label: 'Weakly Assessed Areas', value: governance.summary.weaklyAssessedAreas }
    ],
    sections: [
      {
        key: 'filters',
        title: 'Applied Filters',
        type: 'list',
        items: buildFilterItems(filters)
      },
      {
        key: 'gap-register',
        title: 'Curriculum Gap Register',
        type: 'table',
        columns: [
          { key: 'issueType', label: 'Issue' },
          { key: 'programCode', label: 'Program' },
          { key: 'outcomeCode', label: 'Outcome' },
          { key: 'coverageCourseCount', label: 'Mapped Courses' },
          { key: 'coverageRatio', label: 'Coverage %' },
          { key: 'assessmentCoverageCount', label: 'Assessments' },
          { key: 'currentAttainment', label: 'Current' },
          { key: 'targetAttainment', label: 'Target' },
          { key: 'gap', label: 'Gap' }
        ],
        rows: governance.weakCoverageAreas
      }
    ]
  };
};

const buildSelfStudySummaryReport = async (filters = {}) => {
  const [governance, weakOutcomeReport, planData, evidenceData] = await Promise.all([
    buildCurriculumGovernanceSummary(filters),
    buildWeakOutcomeReport(filters),
    buildImprovementPlanSummaryData(filters),
    buildEvidenceSummaryData(filters)
  ]);

  const narrative = [
    `The selected scope includes ${governance.summary.totalPrograms} program(s) and ${governance.summary.totalCourses} active course(s).`,
    `${governance.summary.unmappedPlos} PLO(s) remain unmapped, ${governance.summary.underCoveredPlos} are under-covered, and ${governance.summary.weaklyAssessedAreas} curriculum area(s) appear weakly assessed.`,
    `${planData.summary.openPlans + planData.summary.inProgressPlans} improvement plan(s) remain active, with ${planData.summary.overduePlans} currently overdue.`,
    `${evidenceData.summary.totalArtifacts} evidence artifact(s) and ${evidenceData.summary.totalSampleSets} sample set(s) are available to support accreditation review in the selected scope.`
  ];

  return {
    title: 'Self-Study Summary Report',
    description: 'Integrated self-study style summary connecting attainment, gaps, actions, evidence, and governance readiness.',
    summaryCards: [
      { label: 'Programs', value: governance.summary.totalPrograms },
      { label: 'Courses', value: governance.summary.totalCourses },
      { label: 'Active Plans', value: planData.summary.openPlans + planData.summary.inProgressPlans },
      { label: 'Evidence Artifacts', value: evidenceData.summary.totalArtifacts }
    ],
    sections: [
      {
        key: 'filters',
        title: 'Applied Filters',
        type: 'list',
        items: buildFilterItems(filters)
      },
      {
        key: 'narrative',
        title: 'Self-Study Narrative Summary',
        type: 'text',
        body: narrative.join(' ')
      },
      {
        key: 'readiness-overview',
        title: 'Readiness Overview',
        type: 'table',
        columns: [
          { key: 'metric', label: 'Metric' },
          { key: 'value', label: 'Value' }
        ],
        rows: [
          { metric: 'Mapped PLOs', value: governance.summary.mappedPlos },
          { metric: 'Unmapped PLOs', value: governance.summary.unmappedPlos },
          { metric: 'Weak Coverage Areas', value: governance.weakCoverageAreas.length },
          { metric: 'Below Target Outcomes', value: weakOutcomeReport.summaryCards.find((item) => item.label === 'Below Target Outcomes')?.value || 0 },
          { metric: 'Open / In Progress Plans', value: planData.summary.openPlans + planData.summary.inProgressPlans },
          { metric: 'Evidence Sample Sets', value: evidenceData.summary.totalSampleSets }
        ]
      },
      {
        key: 'priority-gaps',
        title: 'Priority Governance Gaps',
        type: 'table',
        columns: [
          { key: 'issueType', label: 'Issue' },
          { key: 'programCode', label: 'Program' },
          { key: 'outcomeCode', label: 'Outcome' },
          { key: 'gap', label: 'Gap' },
          { key: 'openPlanCount', label: 'Plans' },
          { key: 'evidenceCount', label: 'Evidence' }
        ],
        rows: governance.weakCoverageAreas.slice(0, 12)
      }
    ]
  };
};

const buildReportPreview = async (reportType, filters = {}) => {
  const definition = getReportDefinition(reportType);

  if (!definition) {
    const error = new Error('Invalid accreditation report type.');
    error.statusCode = 400;
    throw error;
  }

  let content;
  if (reportType === 'program_attainment') {
    content = await buildProgramAttainmentReport(filters);
  } else if (reportType === 'plo_summary') {
    content = await buildPloSummaryReport(filters);
  } else if (reportType === 'weak_outcome') {
    content = await buildWeakOutcomeReport(filters);
  } else if (reportType === 'improvement_plan_summary') {
    content = await buildImprovementPlanSummaryReport(filters);
  } else if (reportType === 'evidence_summary') {
    content = await buildEvidenceSummaryReport(filters);
  } else if (reportType === 'curriculum_gap') {
    content = await buildCurriculumGapReport(filters);
  } else {
    content = await buildSelfStudySummaryReport(filters);
  }

  return {
    reportType,
    title: content.title,
    description: content.description,
    generatedAt: new Date().toISOString(),
    filters,
    exportBaseName: `${reportType}-${Date.now()}`,
    summaryCards: content.summaryCards || [],
    sections: content.sections || []
  };
};

const buildCsvExport = (report) => {
  const tableSection = (report.sections || []).find((section) => section.type === 'table' && section.rows?.length);

  if (!tableSection) {
    const rows = (report.summaryCards || []).map((item) => [item.label, item.value]);
    return {
      filename: `${report.exportBaseName}.csv`,
      content: ['Metric,Value', ...rows.map((row) => row.map((item) => `"${String(item).replace(/"/g, '""')}"`).join(','))].join('\n')
    };
  }

  const header = tableSection.columns.map((column) => column.label).join(',');
  const lines = tableSection.rows.map((row) =>
    tableSection.columns
      .map((column) => `"${String(row[column.key] ?? '').replace(/"/g, '""')}"`)
      .join(',')
  );

  return {
    filename: `${report.exportBaseName}.csv`,
    content: [header, ...lines].join('\n')
  };
};

module.exports = {
  getReportCatalog,
  getReportDefinition,
  normalizeReportFilters,
  buildReportPreview,
  buildCsvExport
};
