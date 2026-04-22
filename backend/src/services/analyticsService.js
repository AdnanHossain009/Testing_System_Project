const Result = require('../models/Result');
const Assessment = require('../models/Assessment');
const CLOPLOMapping = require('../models/CLOPLOMapping');
const Program = require('../models/Program');
const Course = require('../models/Course');
const { buildClassCloAttainment } = require('./cloEvaluationService');

const round = (value) => Number((value || 0).toFixed(2));

const computeWeightedAverage = (marks) => {
  const weights = {
    quiz: 0.15,
    assignment: 0.15,
    mid: 0.30,
    final: 0.40
  };

  const score =
    (Number(marks.quiz) || 0) * weights.quiz +
    (Number(marks.assignment) || 0) * weights.assignment +
    (Number(marks.mid) || 0) * weights.mid +
    (Number(marks.final) || 0) * weights.final;

  return round(score);
};

const computeRisk = ({ marks, fuzzyScore, previousHistory = [] }) => {
  const weightedAverage = computeWeightedAverage(marks);
  const currentFinal = Number(marks.final) || 0;
  const currentMid = Number(marks.mid) || 0;

  const previousFuzzy = previousHistory.length
    ? previousHistory[previousHistory.length - 1].fuzzyScore
    : fuzzyScore;

  const decline = Math.max(0, previousFuzzy - fuzzyScore);

  const deficitComponent = 100 - weightedAverage;
  const fuzzyGap = 100 - fuzzyScore;
  const examRisk = currentFinal < 40 ? 20 : currentFinal < 50 ? 10 : 0;
  const midRisk = currentMid < 40 ? 10 : 0;
  const declineRisk = decline > 10 ? 12 : decline > 5 ? 6 : 0;

  const riskScore = round(
    0.45 * deficitComponent +
      0.35 * fuzzyGap +
      0.10 * examRisk +
      0.05 * midRisk +
      0.05 * declineRisk
  );

  let riskBand = 'Low';
  if (riskScore >= 75) riskBand = 'Critical';
  else if (riskScore >= 55) riskBand = 'High';
  else if (riskScore >= 35) riskBand = 'Moderate';

  const alerts = [];
  if (riskBand === 'High' || riskBand === 'Critical') {
    alerts.push('Immediate academic support recommended.');
  }
  if (currentFinal < 40) {
    alerts.push('Final exam score is below safe threshold.');
  }
  if (decline > 5) {
    alerts.push('Performance trend is declining compared to previous evaluation.');
  }

  return {
    weightedAverage,
    riskScore: clampScore(riskScore),
    riskBand,
    alerts
  };
};

const clampScore = (value) => Math.max(0, Math.min(100, round(value)));

const computeOBEAttainment = async ({ courseId, marks }) => {
  const assessments = await Assessment.find({ course: courseId }).lean();
  const mapping = await CLOPLOMapping.findOne({ course: courseId }).lean();

  const cloBucket = {};
  const cloWeightBucket = {};

  assessments.forEach((assessment) => {
    const rawMark = Number(marks[assessment.type] || 0);
    const normalized = assessment.totalMarks
      ? Math.min(100, (rawMark / assessment.totalMarks) * 100)
      : rawMark;

    assessment.cloCodes.forEach((cloCode) => {
      const contribution = normalized * (assessment.weightage / 100);
      cloBucket[cloCode] = (cloBucket[cloCode] || 0) + contribution;
      cloWeightBucket[cloCode] = (cloWeightBucket[cloCode] || 0) + assessment.weightage / 100;
    });
  });

  const cloAttainment = Object.keys(cloBucket).map((code) => ({
    code,
    score: round(cloBucket[code] / (cloWeightBucket[code] || 1))
  }));

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

  const ploAttainment = Object.keys(ploBucket).map((code) => ({
    code,
    score: round(ploBucket[code] / (ploWeightBucket[code] || 1))
  }));

  return { cloAttainment, ploAttainment };
};


const normalizeMarksForEvaluation = async (courseId, marks) => {
  const assessments = await Assessment.find({ course: courseId }).lean();

  const totals = {};
  assessments.forEach((assessment) => {
    if (totals[assessment.type] === undefined) {
      totals[assessment.type] = assessment.totalMarks;
    }
  });

  return {
    quiz: round(((Number(marks.quiz) || 0) / (totals.quiz || 100)) * 100),
    assignment: round(((Number(marks.assignment) || 0) / (totals.assignment || 100)) * 100),
    mid: round(((Number(marks.mid) || 0) / (totals.mid || 100)) * 100),
    final: round(((Number(marks.final) || 0) / (totals.final || 100)) * 100)
  };
};

const buildCourseAnalytics = async (courseId) => {
  const results = await Result.find({ course: courseId }).populate('student', 'name email studentId');
  const totalStudents = results.length || 1;

  const averageFuzzy = round(
    results.reduce((sum, result) => sum + (result.fuzzyScore || 0), 0) / totalStudents
  );

  const riskDistribution = ['Low', 'Moderate', 'High', 'Critical'].map((band) => ({
    band,
    count: results.filter((result) => result.riskBand === band).length
  }));

  const cloTotals = {};
  const cloCounts = {};
  const ploTotals = {};
  const ploCounts = {};

  results.forEach((result) => {
    (result.cloAttainment || []).forEach((item) => {
      cloTotals[item.code] = (cloTotals[item.code] || 0) + item.score;
      cloCounts[item.code] = (cloCounts[item.code] || 0) + 1;
    });
    (result.ploAttainment || []).forEach((item) => {
      ploTotals[item.code] = (ploTotals[item.code] || 0) + item.score;
      ploCounts[item.code] = (ploCounts[item.code] || 0) + 1;
    });
  });

  const cloChart = Object.keys(cloTotals).map((code) => ({
    code,
    score: round(cloTotals[code] / (cloCounts[code] || 1))
  }));

  const classCloAttainment = await buildClassCloAttainment(courseId);

  const cloInsights = cloChart.map((item) => {
    const classItem = classCloAttainment.find((entry) => entry.code === item.code);
    const diagnostics = results
      .flatMap((result) => result.cloDiagnostics || [])
      .filter((entry) => entry.code === item.code && entry.explanation);

    return {
      code: item.code,
      averageScore: item.score,
      classAttainmentPercent: classItem?.attainmentPercent || 0,
      attained: (classItem?.attainmentPercent || 0) >= 60,
      explanation:
        diagnostics[0]?.explanation ||
        (classItem?.attained ? 'CLO is being attained by most students.' : 'CLO needs closer review.')
    };
  });

  const ploChart = Object.keys(ploTotals).map((code) => ({
    code,
    score: round(ploTotals[code] / (ploCounts[code] || 1))
  }));

  const weakStudents = results
    .filter((result) => ['High', 'Critical'].includes(result.riskBand))
    .sort((a, b) => b.riskScore - a.riskScore)
    .map((result) => ({
      id: result._id,
      student: result.student,
      fuzzyScore: result.fuzzyScore,
      riskScore: result.riskScore,
      riskBand: result.riskBand
    }));

  return {
    averageFuzzy,
    riskDistribution,
    cloChart,
    ploChart,
    weakStudents,
    totalStudents: results.length,
    classCloAttainment,
    cloInsights
  };
};

const buildProgramAnalytics = async (departmentId) => {
  const programs = await Program.find({ department: departmentId }).lean();
  const programIds = programs.map((program) => program._id);

  const results = await Result.find()
    .populate({
      path: 'course',
      select: 'program code name',
      match: { program: { $in: programIds } }
    })
    .populate('student', 'name email');

  const filtered = results.filter((result) => result.course);

  const programBucket = {};

  filtered.forEach((result) => {
    const key = String(result.course.program);
    if (!programBucket[key]) {
      const program = programs.find((item) => String(item._id) === key);
      programBucket[key] = {
        programId: key,
        programCode: program?.code || 'N/A',
        programName: program?.name || 'Unknown',
        totalFuzzy: 0,
        count: 0
      };
    }

    programBucket[key].totalFuzzy += result.fuzzyScore || 0;
    programBucket[key].count += 1;
  });

  return Object.values(programBucket).map((item) => ({
    ...item,
    averageFuzzy: round(item.totalFuzzy / (item.count || 1))
  }));
};

const buildInstitutionAnalytics = async () => {
  const [programs, courses, mappings, results] = await Promise.all([
    Program.find().populate('department', 'name code').lean(),
    Course.find({ active: true })
      .populate('department', 'name code')
      .populate('program', 'name code')
      .lean(),
    CLOPLOMapping.find().lean(),
    Result.find({}, 'course fuzzyScore updatedAt').lean()
  ]);

  const courseById = new Map(courses.map((course) => [String(course._id), course]));
  const mappingByCourse = new Map(mappings.map((item) => [String(item.course), item]));
  const latestResultByCourse = new Map();
  const programBucket = new Map(
    programs.map((program) => [
      String(program._id),
      {
        programId: String(program._id),
        programCode: program.code,
        programName: program.name,
        departmentCode: program.department?.code || 'N/A',
        totalFuzzy: 0,
        count: 0
      }
    ])
  );

  results.forEach((result) => {
    const course = courseById.get(String(result.course));
    if (!course) {
      return;
    }

    const programKey = String(course.program?._id || course.program);
    const bucket = programBucket.get(programKey);

    if (bucket) {
      bucket.totalFuzzy += result.fuzzyScore || 0;
      bucket.count += 1;
    }

    const currentLatest = latestResultByCourse.get(String(result.course));
    if (!currentLatest || new Date(result.updatedAt).getTime() > new Date(currentLatest).getTime()) {
      latestResultByCourse.set(String(result.course), result.updatedAt);
    }
  });

  const recentSnapshots = await Promise.all(
    courses.map(async (course) => {
      const analytics = await buildCourseAnalytics(course._id);
      const mapping = mappingByCourse.get(String(course._id));
      const weakClos = (analytics.classCloAttainment || []).filter((item) => !item.attained).length;
      const weakPlos = (analytics.ploChart || []).filter((item) => Number(item.score) < 60).length;

      return {
        courseId: String(course._id),
        courseCode: course.code,
        courseName: course.name,
        departmentCode: course.department?.code || 'N/A',
        programCode: course.program?.code || 'N/A',
        averageFuzzy: analytics.averageFuzzy,
        totalStudents: analytics.totalStudents,
        weakClos,
        weakPlos,
        weakStudents: analytics.weakStudents.length,
        mappingRows: mapping?.mappings?.length || 0,
        lastEvaluatedAt: latestResultByCourse.get(String(course._id)) || course.updatedAt
      };
    })
  );

  const weakClos = recentSnapshots.reduce((sum, item) => sum + item.weakClos, 0);
  const weakPlos = recentSnapshots.reduce((sum, item) => sum + item.weakPlos, 0);
  const totalClos = courses.reduce((sum, course) => sum + (course.clos?.length || 0), 0);
  const totalPlos = programs.reduce((sum, program) => sum + (program.plos?.length || 0), 0);
  const mappedCourses = recentSnapshots.filter((item) => item.mappingRows > 0).length;

  return {
    totalPrograms: programs.length,
    totalCourses: courses.length,
    totalWeakOutcomes: weakClos + weakPlos,
    totalPendingActionItems: 0,
    recentSnapshots: recentSnapshots
      .sort((a, b) => new Date(b.lastEvaluatedAt).getTime() - new Date(a.lastEvaluatedAt).getTime())
      .slice(0, 6),
    mappingSummary: {
      mappedCourses,
      unmappedCourses: Math.max(courses.length - mappedCourses, 0),
      totalMappingRows: mappings.reduce((sum, item) => sum + (item.mappings?.length || 0), 0)
    },
    outcomeSummary: {
      totalClos,
      totalPlos,
      weakClos,
      weakPlos
    },
    programAnalytics: Array.from(programBucket.values())
      .map((item) => ({
        ...item,
        averageFuzzy: round(item.totalFuzzy / (item.count || 1))
      }))
      .sort((a, b) => a.programCode.localeCompare(b.programCode))
  };
};

module.exports = {
  computeWeightedAverage,
  computeRisk,
  computeOBEAttainment,
  normalizeMarksForEvaluation,
  buildCourseAnalytics,
  buildProgramAnalytics,
  buildInstitutionAnalytics
};
