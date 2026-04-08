const Assessment = require('../models/Assessment');
const CLOPLOMapping = require('../models/CLOPLOMapping');
const Result = require('../models/Result');

const round = (value) => Number((Number(value) || 0).toFixed(2));

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const getLevelInfo = (percentage) => {
  if (percentage >= 80) {
    return { level: 4, label: 'Excellent' };
  }

  if (percentage >= 65) {
    return { level: 3, label: 'Good' };
  }

  if (percentage >= 50) {
    return { level: 2, label: 'Satisfactory' };
  }

  return { level: 1, label: 'Poor' };
};

const normalizeDistribution = (assessment) => {
  if (assessment.cloDistribution?.length) {
    const totalDistributionMarks = assessment.cloDistribution.reduce(
      (sum, item) => sum + (Number(item.marks) || 0),
      0
    );
    const scalingFactor = totalDistributionMarks > 0 ? assessment.totalMarks / totalDistributionMarks : 1;

    return assessment.cloDistribution.map((item) => ({
      cloCode: item.cloCode,
      marks: round((Number(item.marks) || 0) * scalingFactor)
    }));
  }

  if (!assessment.cloCodes?.length) {
    return [];
  }

  const equalSplit = assessment.totalMarks / assessment.cloCodes.length;

  return assessment.cloCodes.map((cloCode) => ({
    cloCode,
    marks: round(equalSplit)
  }));
};

const normalizeRubricCriteria = (assessment, rubricEvaluation = []) => {
  const evaluationMap = new Map((rubricEvaluation || []).map((item) => [item.criterion, item]));

  return (assessment.rubricCriteria || []).map((criterion) => {
    const submitted = evaluationMap.get(criterion.criterion) || {};
    const level = clamp(Number(submitted.level ?? submitted.score ?? 1) || 1, 1, 4);
    const marks = submitted.marks !== undefined
      ? clamp(Number(submitted.marks) || 0, 0, criterion.marks)
      : round((level / 4) * (Number(criterion.marks) || 0));

    const levelDefinition = (criterion.levels || []).find((item) => Number(item.level) === level);

    return {
      criterion: criterion.criterion,
      cloCode: criterion.cloCode,
      level,
      marks,
      maxMarks: Number(criterion.marks) || 0,
      comment: submitted.comment || submitted.remarks || '',
      signal: level <= 2 ? levelDefinition?.description || `${criterion.criterion} needs improvement.` : ''
    };
  });
};

const buildExplanation = ({ cloCode, percentage, assessmentBreakdown, rubricSignals }) => {
  const signals = [...new Set((rubricSignals || []).filter(Boolean))];

  if (percentage >= 80) {
    const highlights = assessmentBreakdown
      .filter((item) => item.percentage >= 80)
      .slice(0, 2)
      .map((item) => item.assessmentTitle)
      .filter(Boolean);

    return `${cloCode} is strong because students consistently performed well in ${
      highlights.length ? highlights.join(' and ') : 'the underlying assessments'
    }.`;
  }

  if (percentage >= 65) {
    return `${cloCode} is good, but some rubric criteria still need attention: ${
      signals.length ? signals.join('; ') : 'a few assessment allocations remained below the top band'
    }.`;
  }

  if (percentage >= 50) {
    return `${cloCode} is satisfactory, yet weak because ${
      signals.length ? signals.join('; ') : 'several criteria stayed below level 3'
    }.`;
  }

  return `${cloCode} is weak because ${
    signals.length ? signals.join('; ') : 'the allocated CLO marks were not achieved across the assessments'
  }.`;
};

const calculateAssessmentEvaluations = (assessment, rawMark, rubricEvaluation) => {
  const rubricScores = normalizeRubricCriteria(assessment, rubricEvaluation?.scores || []);

  if (rubricScores.length && rubricEvaluation) {
    const rubricTotal = rubricScores.reduce((sum, item) => sum + item.marks, 0);
    const cloBuckets = {};

    rubricScores.forEach((item) => {
      if (!cloBuckets[item.cloCode]) {
        cloBuckets[item.cloCode] = {
          cloCode: item.cloCode,
          allocatedMarks: 0,
          earnedMarks: 0,
          percentage: 0,
          signals: []
        };
      }

      cloBuckets[item.cloCode].allocatedMarks += item.maxMarks;
      cloBuckets[item.cloCode].earnedMarks += item.marks;
      if (item.signal) {
        cloBuckets[item.cloCode].signals.push(item.signal);
      }
    });

    Object.values(cloBuckets).forEach((bucket) => {
      bucket.percentage = bucket.allocatedMarks > 0 ? round((bucket.earnedMarks / bucket.allocatedMarks) * 100) : 0;
    });

    return {
      mode: 'rubric',
      obtainedMarks: round(rubricTotal),
      percentage: assessment.totalMarks > 0 ? round((rubricTotal / assessment.totalMarks) * 100) : 0,
      rubricScores,
      cloAllocations: Object.values(cloBuckets)
    };
  }

  const distribution = normalizeDistribution(assessment);
  const clampedRawMark = clamp(Number(rawMark) || 0, 0, assessment.totalMarks || Number(rawMark) || 0);

  const cloAllocations = distribution.map((item) => {
    const earnedMarks = assessment.totalMarks > 0
      ? round((clampedRawMark / assessment.totalMarks) * item.marks)
      : 0;

    return {
      cloCode: item.cloCode,
      allocatedMarks: round(item.marks),
      earnedMarks,
      percentage: item.marks > 0 ? round((earnedMarks / item.marks) * 100) : 0,
      signals: []
    };
  });

  return {
    mode: 'marks',
    obtainedMarks: round(clampedRawMark),
    percentage: assessment.totalMarks > 0 ? round((clampedRawMark / assessment.totalMarks) * 100) : 0,
    rubricScores: [],
    cloAllocations
  };
};

const computeOBEAttainment = async ({ courseId, marks = {}, rubricEvaluations = [] }) => {
  const assessments = await Assessment.find({ course: courseId }).lean();
  const mapping = await CLOPLOMapping.findOne({ course: courseId }).lean();
  const rubricMap = new Map((rubricEvaluations || []).map((item) => [String(item.assessmentId), item]));

  const cloBucket = {};
  const assessmentEvaluations = [];

  assessments.forEach((assessment) => {
    const rubricEvaluation = rubricMap.get(String(assessment._id));
    const rawMark = Number(marks[assessment.type]) || 0;
    const evaluation = calculateAssessmentEvaluations(assessment, rawMark, rubricEvaluation);

    assessmentEvaluations.push({
      assessment: assessment._id,
      assessmentTitle: assessment.title,
      type: assessment.type,
      mode: evaluation.mode,
      totalMarks: assessment.totalMarks,
      obtainedMarks: evaluation.obtainedMarks,
      percentage: evaluation.percentage,
      rubricScores: evaluation.rubricScores,
      cloAllocations: evaluation.cloAllocations
    });

    evaluation.cloAllocations.forEach((item) => {
      if (!cloBucket[item.cloCode]) {
        cloBucket[item.cloCode] = {
          earnedMarks: 0,
          allocatedMarks: 0,
          assessmentBreakdown: [],
          rubricSignals: []
        };
      }

      cloBucket[item.cloCode].earnedMarks += item.earnedMarks;
      cloBucket[item.cloCode].allocatedMarks += item.allocatedMarks;
      cloBucket[item.cloCode].assessmentBreakdown.push({
        assessment: assessment._id,
        assessmentTitle: assessment.title,
        obtainedMarks: evaluation.obtainedMarks,
        allocatedMarks: item.allocatedMarks,
        percentage: item.percentage,
        rubricSignals: item.signals || []
      });
      cloBucket[item.cloCode].rubricSignals.push(...(item.signals || []));
    });
  });

  const cloAttainment = Object.keys(cloBucket)
    .sort()
    .map((code) => {
      const bucket = cloBucket[code];
      const percentage = bucket.allocatedMarks > 0 ? round((bucket.earnedMarks / bucket.allocatedMarks) * 100) : 0;
      const levelInfo = getLevelInfo(percentage);

      return {
        code,
        score: percentage,
        percentage,
        level: levelInfo.level,
        attained: percentage >= 60,
        explanation: buildExplanation({
          cloCode: code,
          percentage,
          assessmentBreakdown: bucket.assessmentBreakdown,
          rubricSignals: bucket.rubricSignals
        })
      };
    });

  const ploBucket = {};
  const ploWeightBucket = {};

  if (mapping?.mappings?.length) {
    mapping.mappings.forEach((item) => {
      const clo = cloAttainment.find((entry) => entry.code === item.cloCode);
      const sourceScore = clo ? clo.score : 0;
      ploBucket[item.ploCode] = (ploBucket[item.ploCode] || 0) + sourceScore * item.weight;
      ploWeightBucket[item.ploCode] = (ploWeightBucket[item.ploCode] || 0) + item.weight;
    });
  }

  const ploAttainment = Object.keys(ploBucket)
    .sort()
    .map((code) => {
      const score = round(ploBucket[code] / (ploWeightBucket[code] || 1));
      const levelInfo = getLevelInfo(score);

      return {
        code,
        score,
        percentage: score,
        level: levelInfo.level,
        attained: score >= 60,
        explanation: `PLO ${code} is derived from mapped CLO scores.`
      };
    });

  const cloDiagnostics = cloAttainment.map((item) => ({
    code: item.code,
    score: item.score,
    percentage: item.percentage,
    level: item.level,
    attained: item.attained,
    explanation: item.explanation,
    assessmentBreakdown: cloBucket[item.code]?.assessmentBreakdown || []
  }));

  return {
    cloAttainment,
    ploAttainment,
    assessmentEvaluations,
    cloDiagnostics
  };
};

const buildClassCloAttainment = async (courseId) => {
  const aggregation = await Result.aggregate([
    { $match: { course: courseId } },
    { $unwind: '$cloAttainment' },
    {
      $group: {
        _id: '$cloAttainment.code',
        averageScore: { $avg: '$cloAttainment.score' },
        attainedStudents: {
          $sum: {
            $cond: [{ $gte: ['$cloAttainment.score', 60] }, 1, 0]
          }
        },
        totalStudents: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return aggregation.map((item) => {
    const attainmentPercent = item.totalStudents > 0 ? round((item.attainedStudents / item.totalStudents) * 100) : 0;
    const levelInfo = getLevelInfo(attainmentPercent);

    return {
      code: item._id,
      averageScore: round(item.averageScore),
      attainmentPercent,
      attainedStudents: item.attainedStudents,
      totalStudents: item.totalStudents,
      attained: attainmentPercent >= 60,
      level: levelInfo.level,
      label: levelInfo.label
    };
  });
};

module.exports = {
  computeOBEAttainment,
  buildClassCloAttainment,
  getLevelInfo,
  normalizeDistribution,
  normalizeRubricCriteria
};