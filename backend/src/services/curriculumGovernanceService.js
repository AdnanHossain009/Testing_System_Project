const Course = require('../models/Course');
const Program = require('../models/Program');
const Assessment = require('../models/Assessment');
const Result = require('../models/Result');
const CLOPLOMapping = require('../models/CLOPLOMapping');
const ImprovementPlan = require('../models/ImprovementPlan');
const EvidenceArtifact = require('../models/EvidenceArtifact');
const { buildCourseAnalytics } = require('./analyticsService');
const { listTargets, resolveTargetForOutcome } = require('./improvementPlanningService');

const round = (value) => Number((Number(value) || 0).toFixed(2));
const normalizeText = (value = '') => String(value || '').trim();

const buildCourseFilter = (filters = {}) => {
  const filter = { active: true };

  if (filters.departmentId) {
    filter.department = filters.departmentId;
  }

  if (filters.programId) {
    filter.program = filters.programId;
  }

  if (filters.courseId) {
    filter._id = filters.courseId;
  }

  return filter;
};

const buildScopeKeys = ({ departmentId, programId, courseId }) => ({
  departmentKey: String(departmentId || ''),
  programKey: String(programId || ''),
  courseKey: String(courseId || '')
});

const getCellHeatLevel = (cell = {}) => {
  if (!cell.mapped) return 'heat-none';
  if ((cell.averageAttainment || 0) >= 75 || (cell.mappedCloCount || 0) >= 3) return 'heat-strong';
  if ((cell.averageAttainment || 0) >= 60 || (cell.mappedCloCount || 0) >= 2) return 'heat-medium';
  return 'heat-light';
};

const buildProgramPloStatus = (row, totalCourses) => {
  const coverageRatio = totalCourses > 0 ? row.coverageCourseCount / totalCourses : 0;
  const unmapped = row.coverageCourseCount === 0;
  const underCovered = !unmapped && (coverageRatio < 0.35 || row.mappedCloCount <= 1);
  const overCovered =
    !unmapped &&
    totalCourses >= 4 &&
    coverageRatio >= 0.8 &&
    row.mappedCloCount >= Math.max(3, Math.ceil(totalCourses * 0.7));
  const weaklyAssessed =
    !unmapped &&
    (row.assessmentCoverageCount === 0 ||
      row.assessmentCoverageCount < Math.max(1, Math.ceil(row.coverageCourseCount / 2)) ||
      row.gap > 0);

  let status = 'balanced';
  if (unmapped) status = 'unmapped';
  else if (weaklyAssessed) status = 'weakly_assessed';
  else if (underCovered) status = 'under_covered';
  else if (overCovered) status = 'over_covered';

  return {
    coverageRatio: round(coverageRatio * 100),
    unmapped,
    underCovered,
    overCovered,
    weaklyAssessed,
    status
  };
};

const buildScopedPlanFilter = (filters = {}) => {
  const filter = {};

  if (filters.academicTerm) {
    filter.academicTerm = normalizeText(filters.academicTerm);
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

const buildScopedEvidenceFilter = (filters = {}, courseIds = [], programIds = [], departmentIds = []) => {
  const filter = {};

  if (filters.academicTerm) {
    filter.academicTerm = normalizeText(filters.academicTerm);
  }

  if (filters.courseId) {
    filter.course = filters.courseId;
  } else if (courseIds.length) {
    filter.course = { $in: courseIds };
  }

  if (filters.programId) {
    filter.program = filters.programId;
  } else if (programIds.length) {
    filter.program = { $in: programIds };
  }

  if (filters.departmentId) {
    filter.department = filters.departmentId;
  } else if (departmentIds.length) {
    filter.department = { $in: departmentIds };
  }

  return filter;
};

const buildEvidenceAndPlanMaps = ({ plans = [], artifacts = [] }) => {
  const activePlanMap = new Map();
  const evidenceMap = new Map();

  plans
    .filter((plan) => ['open', 'in_progress'].includes(plan.status))
    .forEach((plan) => {
      const keys = [
        ['outcome', plan.outcomeType, plan.outcomeCode, String(plan.department || ''), String(plan.program || ''), String(plan.course || '')],
        ['program', plan.outcomeType, plan.outcomeCode, String(plan.program || '')],
        ['course', plan.outcomeType, plan.outcomeCode, String(plan.course || '')]
      ];

      keys.forEach((parts) => {
        const key = parts.join('|');
        activePlanMap.set(key, (activePlanMap.get(key) || 0) + 1);
      });
    });

  artifacts.forEach((artifact) => {
    const keys = [
      ['outcome', artifact.outcomeType || '', artifact.outcomeCode || '', String(artifact.department || ''), String(artifact.program || ''), String(artifact.course || '')],
      ['program', artifact.outcomeType || '', artifact.outcomeCode || '', String(artifact.program || '')],
      ['course', artifact.outcomeType || '', artifact.outcomeCode || '', String(artifact.course || '')]
    ];

    keys.forEach((parts) => {
      const key = parts.join('|');
      evidenceMap.set(key, (evidenceMap.get(key) || 0) + 1);
    });
  });

  return { activePlanMap, evidenceMap };
};

const buildCurriculumGovernanceSummary = async (filters = {}) => {
  const academicTerm = normalizeText(filters.academicTerm);
  const courseFilter = buildCourseFilter(filters);

  const courses = await Course.find(courseFilter)
    .populate('department', 'name code')
    .populate('program', 'name code plos department')
    .populate('faculty', 'name email facultyId')
    .sort({ code: 1 })
    .lean();

  if (!courses.length) {
    return {
      filters: {
        academicTerm,
        departmentId: filters.departmentId || '',
        programId: filters.programId || '',
        courseId: filters.courseId || ''
      },
      summary: {
        totalPrograms: 0,
        totalCourses: 0,
        totalPlos: 0,
        mappedPlos: 0,
        unmappedPlos: 0,
        underCoveredPlos: 0,
        overCoveredPlos: 0,
        weaklyAssessedAreas: 0,
        totalMappingRows: 0
      },
      outcomeCoverageSummary: [],
      weakCoverageAreas: [],
      courseContributionSummary: [],
      cloPloCoverageSummary: [],
      courseToPloMatrix: [],
      metadata: {
        termMode: academicTerm ? 'metadata_only' : 'none',
        note: academicTerm
          ? 'Academic term filtering is applied to planning and evidence metadata. Curriculum mappings and result analytics remain aggregate because the current schema does not store a dedicated term dimension for those records.'
          : ''
      }
    };
  }

  const courseIds = courses.map((course) => course._id);
  const programIds = Array.from(new Set(courses.map((course) => String(course.program?._id || course.program)).filter(Boolean)));
  const departmentIds = Array.from(new Set(courses.map((course) => String(course.department?._id || course.department)).filter(Boolean)));

  const [mappingDocs, assessments, results, targets, planDocs, evidenceArtifacts, courseAnalyticsEntries] = await Promise.all([
    CLOPLOMapping.find({ course: { $in: courseIds } }).lean(),
    Assessment.find({ course: { $in: courseIds } }).lean(),
    Result.find({ course: { $in: courseIds } }, 'course fuzzyScore ploAttainment').lean(),
    listTargets({}),
    ImprovementPlan.find(buildScopedPlanFilter(filters)).lean(),
    EvidenceArtifact.find(buildScopedEvidenceFilter(filters, courseIds, programIds, departmentIds))
      .select('course program department outcomeType outcomeCode academicTerm')
      .lean(),
    Promise.all(
      courses.map(async (course) => {
        const analytics = await buildCourseAnalytics(course._id);
        return [String(course._id), analytics];
      })
    )
  ]);

  const courseAnalyticsById = new Map(courseAnalyticsEntries);
  const courseById = new Map(courses.map((course) => [String(course._id), course]));
  const mappingsByCourse = new Map(mappingDocs.map((doc) => [String(doc.course), doc.mappings || []]));

  const assessmentIdsByCourse = assessments.reduce((accumulator, assessment) => {
    const key = String(assessment.course);
    if (!accumulator.has(key)) {
      accumulator.set(key, new Set());
    }
    accumulator.get(key).add(String(assessment._id));
    return accumulator;
  }, new Map());

  const courseCloAssessmentMap = new Map();
  const coursePloAssessmentMap = new Map();

  assessments.forEach((assessment) => {
    const courseId = String(assessment.course);
    const touchedClos = Array.from(
      new Set([
        ...(assessment.cloCodes || []),
        ...((assessment.cloDistribution || []).map((item) => item.cloCode).filter(Boolean))
      ])
    );

    touchedClos.forEach((cloCode) => {
      const cloKey = `${courseId}|${cloCode}`;
      if (!courseCloAssessmentMap.has(cloKey)) {
        courseCloAssessmentMap.set(cloKey, new Set());
      }
      courseCloAssessmentMap.get(cloKey).add(String(assessment._id));
    });

    (mappingsByCourse.get(courseId) || []).forEach((mapping) => {
      if (!touchedClos.includes(mapping.cloCode)) {
        return;
      }

      const ploKey = `${courseId}|${mapping.ploCode}`;
      if (!coursePloAssessmentMap.has(ploKey)) {
        coursePloAssessmentMap.set(ploKey, new Set());
      }
      coursePloAssessmentMap.get(ploKey).add(String(assessment._id));
    });
  });

  const coursePloScoreMap = new Map();
  const courseMetricsMap = new Map();

  results.forEach((result) => {
    const courseId = String(result.course);
    if (!courseMetricsMap.has(courseId)) {
      courseMetricsMap.set(courseId, {
        totalFuzzy: 0,
        count: 0
      });
    }

    const metrics = courseMetricsMap.get(courseId);
    metrics.totalFuzzy += Number(result.fuzzyScore) || 0;
    metrics.count += 1;

    (result.ploAttainment || []).forEach((item) => {
      const key = `${courseId}|${item.code}`;
      if (!coursePloScoreMap.has(key)) {
        coursePloScoreMap.set(key, { total: 0, count: 0 });
      }
      const bucket = coursePloScoreMap.get(key);
      bucket.total += Number(item.score) || 0;
      bucket.count += 1;
    });
  });

  const { activePlanMap, evidenceMap } = buildEvidenceAndPlanMaps({
    plans: planDocs,
    artifacts: evidenceArtifacts
  });

  const programMap = new Map();
  courses.forEach((course) => {
    const programId = String(course.program?._id || course.program);
    if (!programMap.has(programId)) {
      programMap.set(programId, {
        programId,
        programCode: course.program?.code || 'N/A',
        programName: course.program?.name || 'Unknown',
        departmentId: String(course.department?._id || course.department || ''),
        departmentCode: course.department?.code || 'N/A',
        plos: course.program?.plos || [],
        courses: []
      });
    }
    programMap.get(programId).courses.push(course);
  });

  const cloPloCoverageSummary = [];
  const outcomeCoverageSummary = [];
  const weakCoverageAreas = [];
  const courseContributionSummary = [];
  const courseToPloMatrix = [];

  Array.from(programMap.values())
    .sort((a, b) => a.programCode.localeCompare(b.programCode))
    .forEach((programRecord) => {
      const programCourses = programRecord.courses.sort((a, b) => a.code.localeCompare(b.code));
      const totalCourses = programCourses.length;
      const ploColumns = (programRecord.plos || []).map((plo) => ({
        code: plo.code,
        description: plo.description
      }));

      const courseRows = programCourses.map((course) => {
        const courseId = String(course._id);
        const mappings = mappingsByCourse.get(courseId) || [];
        const analytics = courseAnalyticsById.get(courseId) || {};
        const classCloAttainment = analytics.classCloAttainment || [];
        const ploChart = analytics.ploChart || [];
        const weakClos = classCloAttainment.filter((item) => !item.attained).length;
        const weakPlos = ploChart.filter((item) => Number(item.score) < 60).length;
        const mappedClos = new Set(mappings.map((item) => item.cloCode));

        const cells = ploColumns.map((plo) => {
          const linkedMappings = mappings.filter((item) => item.ploCode === plo.code);
          const linkedClos = Array.from(new Set(linkedMappings.map((item) => item.cloCode)));
          const assessmentCoverageCount = (coursePloAssessmentMap.get(`${courseId}|${plo.code}`) || new Set()).size;
          const ploScoreBucket = coursePloScoreMap.get(`${courseId}|${plo.code}`);
          const averageAttainment = ploScoreBucket ? round(ploScoreBucket.total / (ploScoreBucket.count || 1)) : 0;
          const cell = {
            ploCode: plo.code,
            mapped: linkedMappings.length > 0,
            mappingCount: linkedMappings.length,
            mappedCloCount: linkedClos.length,
            totalWeight: round(linkedMappings.reduce((sum, item) => sum + (Number(item.weight) || 0), 0)),
            assessmentCoverageCount,
            averageAttainment,
            linkedClos
          };

          return {
            ...cell,
            heatLevel: getCellHeatLevel(cell)
          };
        });

        (course.clos || []).forEach((clo) => {
          const cloMappings = mappings.filter((item) => item.cloCode === clo.code);
          const linkedPloCodes = Array.from(new Set(cloMappings.map((item) => item.ploCode)));
          cloPloCoverageSummary.push({
            courseId,
            courseCode: course.code,
            courseName: course.name,
            departmentCode: course.department?.code || 'N/A',
            programCode: course.program?.code || 'N/A',
            cloCode: clo.code,
            cloDescription: clo.description,
            linkedPloCodes,
            mappedPloCount: linkedPloCodes.length,
            totalWeight: round(cloMappings.reduce((sum, item) => sum + (Number(item.weight) || 0), 0)),
            assessmentCoverageCount: (courseCloAssessmentMap.get(`${courseId}|${clo.code}`) || new Set()).size,
            status: linkedPloCodes.length ? 'mapped' : 'unmapped'
          });
        });

        courseContributionSummary.push({
          courseId,
          courseCode: course.code,
          courseName: course.name,
          departmentCode: course.department?.code || 'N/A',
          programCode: course.program?.code || 'N/A',
          mappedPloCount: cells.filter((cell) => cell.mapped).length,
          mappedCloCount: mappedClos.size,
          unmappedClos: Math.max((course.clos || []).length - mappedClos.size, 0),
          totalAssessments: (assessmentIdsByCourse.get(courseId) || new Set()).size,
          averageFuzzy: round(
            courseMetricsMap.get(courseId)
              ? courseMetricsMap.get(courseId).totalFuzzy / (courseMetricsMap.get(courseId).count || 1)
              : 0
          ),
          weakOutcomeCount: weakClos + weakPlos,
          weakClos,
          weakPlos,
          linkedPloCodes: cells.filter((cell) => cell.mapped).map((cell) => cell.ploCode)
        });

        return {
          courseId,
          courseCode: course.code,
          courseName: course.name,
          averageFuzzy: round(
            courseMetricsMap.get(courseId)
              ? courseMetricsMap.get(courseId).totalFuzzy / (courseMetricsMap.get(courseId).count || 1)
              : 0
          ),
          totalAssessments: (assessmentIdsByCourse.get(courseId) || new Set()).size,
          weakOutcomeCount: weakClos + weakPlos,
          cells
        };
      });

      ploColumns.forEach((plo) => {
        const mappedRows = courseRows.filter((row) => row.cells.find((cell) => cell.ploCode === plo.code && cell.mapped));
        const mappedClos = new Set();
        const assessmentIds = new Set();
        let totalWeight = 0;
        let weightCount = 0;
        let totalAttainment = 0;
        let attainmentCount = 0;

        mappedRows.forEach((row) => {
          const cell = row.cells.find((entry) => entry.ploCode === plo.code);
          (cell?.linkedClos || []).forEach((cloCode) => mappedClos.add(`${row.courseId}|${cloCode}`));
          totalWeight += Number(cell?.totalWeight) || 0;
          weightCount += cell?.mappingCount || 0;
          (coursePloAssessmentMap.get(`${row.courseId}|${plo.code}`) || new Set()).forEach((assessmentId) =>
            assessmentIds.add(String(assessmentId))
          );
          if ((cell?.averageAttainment || 0) > 0) {
            totalAttainment += cell.averageAttainment;
            attainmentCount += 1;
          }
        });

        const targetResolved = resolveTargetForOutcome(
          {
            outcomeType: 'PLO',
            outcomeCode: plo.code,
            currentAttainment: round(attainmentCount ? totalAttainment / attainmentCount : 0),
            academicTerm,
            departmentId: programRecord.departmentId,
            departmentCode: programRecord.departmentCode,
            programId: programRecord.programId,
            programCode: programRecord.programCode,
            courseId: '',
            courseCode: '',
            scopeLabel: `${programRecord.programCode} - ${plo.code}`
          },
          targets
        );

        const statusDetails = buildProgramPloStatus(
          {
            coverageCourseCount: mappedRows.length,
            mappedCloCount: mappedClos.size,
            assessmentCoverageCount: assessmentIds.size,
            gap: targetResolved.gap
          },
          totalCourses
        );

        const outcomeRow = {
          programId: programRecord.programId,
          programCode: programRecord.programCode,
          programName: programRecord.programName,
          departmentId: programRecord.departmentId,
          departmentCode: programRecord.departmentCode,
          ploCode: plo.code,
          ploDescription: plo.description,
          coverageCourseCount: mappedRows.length,
          totalCourses,
          mappedCloCount: mappedClos.size,
          assessmentCoverageCount: assessmentIds.size,
          averageMappingWeight: round(weightCount ? totalWeight / weightCount : 0),
          currentAttainment: targetResolved.currentAttainment,
          targetAttainment: targetResolved.targetAttainment,
          gap: targetResolved.gap,
          coverageRatio: statusDetails.coverageRatio,
          status: statusDetails.status,
          unmapped: statusDetails.unmapped,
          underCovered: statusDetails.underCovered,
          overCovered: statusDetails.overCovered,
          weaklyAssessed: statusDetails.weaklyAssessed,
          openPlanCount:
            activePlanMap.get(['program', 'PLO', plo.code, programRecord.programId].join('|')) ||
            activePlanMap.get(['outcome', 'PLO', plo.code, programRecord.departmentId, programRecord.programId, ''].join('|')) ||
            0,
          evidenceCount:
            evidenceMap.get(['program', 'PLO', plo.code, programRecord.programId].join('|')) ||
            evidenceMap.get(['outcome', 'PLO', plo.code, programRecord.departmentId, programRecord.programId, ''].join('|')) ||
            0
        };

        outcomeCoverageSummary.push(outcomeRow);

        if (outcomeRow.unmapped || outcomeRow.underCovered || outcomeRow.overCovered || outcomeRow.weaklyAssessed || outcomeRow.gap > 0) {
          weakCoverageAreas.push({
            issueType: outcomeRow.unmapped
              ? 'unmapped_plo'
              : outcomeRow.weaklyAssessed
                ? 'weakly_assessed'
                : outcomeRow.underCovered
                  ? 'under_covered_plo'
                  : outcomeRow.overCovered
                    ? 'over_covered_plo'
                    : 'below_target',
            programId: programRecord.programId,
            programCode: programRecord.programCode,
            departmentCode: programRecord.departmentCode,
            outcomeType: 'PLO',
            outcomeCode: plo.code,
            description: plo.description,
            currentAttainment: outcomeRow.currentAttainment,
            targetAttainment: outcomeRow.targetAttainment,
            gap: outcomeRow.gap,
            coverageCourseCount: outcomeRow.coverageCourseCount,
            totalCourses: outcomeRow.totalCourses,
            coverageRatio: outcomeRow.coverageRatio,
            assessmentCoverageCount: outcomeRow.assessmentCoverageCount,
            openPlanCount: outcomeRow.openPlanCount,
            evidenceCount: outcomeRow.evidenceCount,
            status: outcomeRow.status
          });
        }
      });

      courseToPloMatrix.push({
        programId: programRecord.programId,
        programCode: programRecord.programCode,
        programName: programRecord.programName,
        departmentCode: programRecord.departmentCode,
        ploColumns,
        courseRows
      });
    });

  const summary = {
    totalPrograms: courseToPloMatrix.length,
    totalCourses: courses.length,
    totalPlos: outcomeCoverageSummary.length,
    mappedPlos: outcomeCoverageSummary.filter((item) => !item.unmapped).length,
    unmappedPlos: outcomeCoverageSummary.filter((item) => item.unmapped).length,
    underCoveredPlos: outcomeCoverageSummary.filter((item) => item.underCovered).length,
    overCoveredPlos: outcomeCoverageSummary.filter((item) => item.overCovered).length,
    weaklyAssessedAreas: outcomeCoverageSummary.filter((item) => item.weaklyAssessed).length,
    totalMappingRows: mappingDocs.reduce((sum, item) => sum + (item.mappings?.length || 0), 0)
  };

  return {
    filters: {
      academicTerm,
      departmentId: filters.departmentId || '',
      programId: filters.programId || '',
      courseId: filters.courseId || ''
    },
    summary,
    outcomeCoverageSummary: outcomeCoverageSummary.sort((a, b) => {
      if (a.programCode !== b.programCode) {
        return a.programCode.localeCompare(b.programCode);
      }
      return a.ploCode.localeCompare(b.ploCode);
    }),
    weakCoverageAreas: weakCoverageAreas.sort((a, b) => b.gap - a.gap || a.programCode.localeCompare(b.programCode)),
    courseContributionSummary: courseContributionSummary.sort((a, b) => a.courseCode.localeCompare(b.courseCode)),
    cloPloCoverageSummary: cloPloCoverageSummary.sort((a, b) => {
      if (a.courseCode !== b.courseCode) {
        return a.courseCode.localeCompare(b.courseCode);
      }
      return a.cloCode.localeCompare(b.cloCode);
    }),
    courseToPloMatrix,
    metadata: {
      termMode: academicTerm ? 'metadata_only' : 'none',
      note: academicTerm
        ? 'Academic term filtering is applied to planning and evidence metadata. Curriculum mappings and result analytics remain aggregate because the current schema does not store a dedicated term dimension for those records.'
        : ''
    }
  };
};

module.exports = {
  buildCurriculumGovernanceSummary
};
