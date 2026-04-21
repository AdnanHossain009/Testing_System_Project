const { getLevelInfo } = require('./cloEvaluationService');

const round = (value) => Number((Number(value) || 0).toFixed(2));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const triangle = (x, a, b, c) => {
  if (a === b && x <= a) return 1;
  if (b === c && x >= c) return 1;
  if (x <= a || x >= c) return 0;
  if (x === b) return 1;
  if (x < b) return (x - a) / ((b - a) || 1);
  return (c - x) / ((c - b) || 1);
};

const fuzzifyValue = (value) => {
  const score = clamp(Number(value) || 0, 0, 100);
  return {
    low: round(triangle(score, 0, 0, 50)),
    medium: round(triangle(score, 25, 50, 75)),
    high: round(triangle(score, 50, 100, 100))
  };
};

const outputMembership = {
  low: (x) => triangle(x, 0, 0, 50),
  medium: (x) => triangle(x, 25, 50, 75),
  high: (x) => triangle(x, 50, 100, 100)
};

const ruleStrength = (antecedent, fuzzyInputs) => {
  const values = Object.entries(antecedent)
    .filter(([, label]) => Boolean(label))
    .map(([inputName, label]) => fuzzyInputs[inputName]?.[label] ?? 0);

  if (!values.length) return 0;
  return Math.min(...values);
};

const defuzzify = (activations) => {
  let numerator = 0;
  let denominator = 0;

  for (let x = 0; x <= 100; x += 1) {
    let mu = 0;

    activations.forEach((activation) => {
      const membership = outputMembership[activation.consequent](x);
      mu = Math.max(mu, Math.min(activation.strength, membership));
    });

    numerator += x * mu;
    denominator += mu;
  }

  return denominator === 0 ? 0 : numerator / denominator;
};

const average = (values = []) => {
  if (!values.length) return 0;
  return round(values.reduce((sum, value) => sum + (Number(value) || 0), 0) / values.length);
};

const weightedAverage = (items = []) => {
  let total = 0;
  let weightTotal = 0;

  items.forEach(({ value, weight }) => {
    const safeWeight = Number(weight) || 0;
    total += (Number(value) || 0) * safeWeight;
    weightTotal += safeWeight;
  });

  return weightTotal === 0 ? 0 : round(total / weightTotal);
};

const weightedStdDev = (items = []) => {
  if (!items.length) return 0;

  const mean = weightedAverage(items);
  const totalWeight = items.reduce((sum, item) => sum + (Number(item.weight) || 0), 0) || 1;
  const variance = items.reduce((sum, item) => {
    const weight = Number(item.weight) || 0;
    const delta = (Number(item.value) || 0) - mean;
    return sum + weight * delta * delta;
  }, 0) / totalWeight;

  return round(Math.sqrt(variance));
};

const getCourseField = (course, fieldName, fallback = null) => {
  if (!course) return fallback;
  const value = course[fieldName];
  if (value && typeof value === 'object' && value._id) {
    return value;
  }
  return value || fallback;
};

const buildCourseInsight = ({ courseCode, fuzzyScore, courseCloAverage, coursePloAverage, weakClos, weakPlos }) => {
  if (fuzzyScore === null || fuzzyScore === undefined) {
    return 'Result not evaluated yet.';
  }

  if (weakClos.length && weakPlos.length) {
    return `${courseCode} is weak in ${weakClos.join(', ')} and ${weakPlos.join(', ')}.`;
  }

  if (fuzzyScore >= 70 && courseCloAverage >= 70 && coursePloAverage >= 70) {
    return `${courseCode} is strong across both assessment performance and outcome attainment.`;
  }

  if (fuzzyScore >= 70 && (courseCloAverage < 60 || coursePloAverage < 60)) {
    return `${courseCode} has good marks, but some outcomes still need attention.`;
  }

  if (fuzzyScore < 60 && (courseCloAverage >= 60 || coursePloAverage >= 60)) {
    return `${courseCode} outcomes are acceptable, but the raw performance is pulling the score down.`;
  }

  return `${courseCode} needs improvement in both performance and outcome alignment.`;
};

const evaluateStudentMastery = ({ performanceScore, outcomeScore, alignmentScore, stabilityScore }) => {
  const fuzzyInputs = {
    performance: fuzzifyValue(performanceScore),
    outcome: fuzzifyValue(outcomeScore),
    alignment: fuzzifyValue(alignmentScore),
    stability: fuzzifyValue(stabilityScore)
  };

  const rules = [
    {
      name: 'Weak performance and weak outcomes mean low mastery',
      antecedent: { performance: 'low', outcome: 'low', alignment: 'low' },
      consequent: 'low'
    },
    {
      name: 'Low performance with unstable profile means low mastery',
      antecedent: { performance: 'low', stability: 'low' },
      consequent: 'low'
    },
    {
      name: 'Balanced performance and outcomes mean medium mastery',
      antecedent: { performance: 'medium', outcome: 'medium', alignment: 'medium' },
      consequent: 'medium'
    },
    {
      name: 'Strong performance, outcomes and alignment mean high mastery',
      antecedent: { performance: 'high', outcome: 'high', alignment: 'high', stability: 'high' },
      consequent: 'high'
    },
    {
      name: 'Strong performance with medium outcomes means medium mastery',
      antecedent: { performance: 'high', outcome: 'medium', alignment: 'medium' },
      consequent: 'medium'
    },
    {
      name: 'Weak outcome alignment means the profile is not yet strong',
      antecedent: { outcome: 'low', alignment: 'low' },
      consequent: 'low'
    },
    {
      name: 'Stable performance with decent outcomes means medium mastery',
      antecedent: { stability: 'high', performance: 'medium' },
      consequent: 'medium'
    },
    {
      name: 'Strong performance and outcomes with high stability mean high mastery',
      antecedent: { performance: 'high', outcome: 'high', stability: 'high' },
      consequent: 'high'
    }
  ];

  const activations = rules
    .map((rule) => ({
      name: rule.name,
      consequent: rule.consequent,
      strength: round(ruleStrength(rule.antecedent, fuzzyInputs))
    }))
    .filter((item) => item.strength > 0);

  const score = round(defuzzify(activations));
  const levelInfo = getLevelInfo(score);

  let narrative = 'Overall mastery is developing.';
  if (score >= 80) narrative = 'Overall mastery is excellent across performance and outcome alignment.';
  else if (score >= 65) narrative = 'Overall mastery is good, with a few outcome gaps to monitor.';
  else if (score >= 50) narrative = 'Overall mastery is satisfactory but needs improvement in some areas.';
  else narrative = 'Overall mastery is weak and needs support.';

  return {
    score,
    level: levelInfo.level,
    label: levelInfo.label,
    narrative,
    fuzzyInputs,
    activatedRules: activations
  };
};

const buildStudentAnalytics = ({ enrollments = [], results = [] }) => {
  const resultMap = new Map(
    results.map((result) => [String(result.course?._id || result.course), result])
  );

  const courseAnalytics = enrollments
    .map((enrollment) => {
      const course = enrollment.course || {};
      const courseId = String(course._id || course);
      const result = resultMap.get(courseId);
      const courseCode = course.code || 'N/A';
      const courseName = course.name || 'Unknown course';
      const credits = Number(course.credits) || 1;

      if (!result) {
        return {
          courseId,
          courseCode,
          courseName,
          credits,
          semester: course.semester || 'N/A',
          faculty: getCourseField(course, 'faculty', null),
          department: getCourseField(course, 'department', null),
          program: getCourseField(course, 'program', null),
          enrolledAt: enrollment.enrolledAt,
          approvedBy: enrollment.approvedBy,
          hasResult: false,
          status: 'Pending Evaluation',
          resultUpdatedAt: null,
          assessmentCount: 0,
          weightedAverage: null,
          fuzzyScore: null,
          riskScore: null,
          riskBand: 'Pending',
          attainmentLevel: 'Pending',
          cloAttainment: [],
          ploAttainment: [],
          courseCloAverage: null,
          coursePloAverage: null,
          courseOutcomeScore: null,
          weakClos: [],
          weakPlos: [],
          strongClos: [],
          strongPlos: [],
          insight: 'Result not evaluated yet.'
        };
      }

      const cloAttainment = result.cloAttainment || [];
      const ploAttainment = result.ploAttainment || [];
      const courseCloAverage = average(cloAttainment.map((item) => item.score));
      const coursePloAverage = average(ploAttainment.map((item) => item.score));
      const courseOutcomeScore =
        cloAttainment.length && ploAttainment.length
          ? round((courseCloAverage + coursePloAverage) / 2)
          : round(courseCloAverage || coursePloAverage || result.fuzzyScore || 0);

      const weakClos = cloAttainment.filter((item) => Number(item.score) < 60).map((item) => item.code);
      const weakPlos = ploAttainment.filter((item) => Number(item.score) < 60).map((item) => item.code);
      const strongClos = cloAttainment.filter((item) => Number(item.score) >= 70).map((item) => item.code);
      const strongPlos = ploAttainment.filter((item) => Number(item.score) >= 70).map((item) => item.code);

      return {
        courseId,
        courseCode,
        courseName,
        credits,
        semester: course.semester || 'N/A',
        faculty: getCourseField(course, 'faculty', null),
        department: getCourseField(course, 'department', null),
        program: getCourseField(course, 'program', null),
        enrolledAt: enrollment.enrolledAt,
        approvedBy: enrollment.approvedBy,
        hasResult: true,
        status: result.riskBand || 'Evaluated',
        resultUpdatedAt: result.lastEvaluatedAt || result.updatedAt || null,
        assessmentCount: result.assessmentEvaluations?.length || 0,
        weightedAverage: result.weightedAverage || 0,
        fuzzyScore: result.fuzzyScore || 0,
        riskScore: result.riskScore || 0,
        riskBand: result.riskBand || 'Low',
        attainmentLevel: result.attainmentLevel || 'Low',
        cloAttainment,
        ploAttainment,
        courseCloAverage,
        coursePloAverage,
        courseOutcomeScore,
        weakClos,
        weakPlos,
        strongClos,
        strongPlos,
        insight: buildCourseInsight({
          courseCode,
          fuzzyScore: result.fuzzyScore || 0,
          courseCloAverage,
          coursePloAverage,
          weakClos,
          weakPlos
        })
      };
    })
    .sort((a, b) => String(a.courseCode).localeCompare(String(b.courseCode)));

  const completedCourses = courseAnalytics.filter((item) => item.hasResult);
  const pendingCourses = courseAnalytics.filter((item) => !item.hasResult);

  const performanceScore = weightedAverage(
    completedCourses.map((item) => ({ value: item.fuzzyScore, weight: item.credits }))
  );
  const weightedAverageScore = weightedAverage(
    completedCourses.map((item) => ({ value: item.weightedAverage, weight: item.credits }))
  );
  const riskScore = weightedAverage(
    completedCourses.map((item) => ({ value: item.riskScore, weight: item.credits }))
  );

  const overallCloBucket = {};
  const overallCloWeights = {};
  const overallCloCourseCounts = {};
  const overallCloWeakCounts = {};
  const overallPloBucket = {};
  const overallPloWeights = {};
  const overallPloCourseCounts = {};
  const overallPloWeakCounts = {};

  completedCourses.forEach((course) => {
    const courseWeight = Number(course.credits) || 1;

    (course.cloAttainment || []).forEach((item) => {
      if (!overallCloBucket[item.code]) overallCloBucket[item.code] = 0;
      if (!overallCloWeights[item.code]) overallCloWeights[item.code] = 0;
      overallCloBucket[item.code] += (Number(item.score) || 0) * courseWeight;
      overallCloWeights[item.code] += courseWeight;
      overallCloCourseCounts[item.code] = (overallCloCourseCounts[item.code] || 0) + 1;
      if ((Number(item.score) || 0) < 60) {
        overallCloWeakCounts[item.code] = (overallCloWeakCounts[item.code] || 0) + 1;
      }
    });

    (course.ploAttainment || []).forEach((item) => {
      if (!overallPloBucket[item.code]) overallPloBucket[item.code] = 0;
      if (!overallPloWeights[item.code]) overallPloWeights[item.code] = 0;
      overallPloBucket[item.code] += (Number(item.score) || 0) * courseWeight;
      overallPloWeights[item.code] += courseWeight;
      overallPloCourseCounts[item.code] = (overallPloCourseCounts[item.code] || 0) + 1;
      if ((Number(item.score) || 0) < 60) {
        overallPloWeakCounts[item.code] = (overallPloWeakCounts[item.code] || 0) + 1;
      }
    });
  });

  const overallCloAnalytics = Object.keys(overallCloBucket)
    .sort()
    .map((code) => {
      const score = round(overallCloBucket[code] / (overallCloWeights[code] || 1));
      const levelInfo = getLevelInfo(score);

      return {
        code,
        score,
        averageScore: score,
        percentage: score,
        level: levelInfo.level,
        label: levelInfo.label,
        attained: score >= 60,
        weak: score < 60,
        courseCount: overallCloCourseCounts[code] || 0,
        weakCourseCount: overallCloWeakCounts[code] || 0
      };
    });

  const overallPloAnalytics = Object.keys(overallPloBucket)
    .sort()
    .map((code) => {
      const score = round(overallPloBucket[code] / (overallPloWeights[code] || 1));
      const levelInfo = getLevelInfo(score);

      return {
        code,
        score,
        averageScore: score,
        percentage: score,
        level: levelInfo.level,
        label: levelInfo.label,
        attained: score >= 60,
        weak: score < 60,
        courseCount: overallPloCourseCounts[code] || 0,
        weakCourseCount: overallPloWeakCounts[code] || 0
      };
    });

  const overallCloAverage = average(overallCloAnalytics.map((item) => item.score));
  const overallPloAverage = average(overallPloAnalytics.map((item) => item.score));
  const stabilityScore = completedCourses.length > 1
    ? clamp(100 - weightedStdDev(completedCourses.map((item) => ({ value: item.fuzzyScore, weight: item.credits }))) * 1.25, 0, 100)
    : completedCourses.length === 1
      ? 100
      : 0;

  const mastery = evaluateStudentMastery({
    performanceScore,
    outcomeScore: overallCloAverage,
    alignmentScore: overallPloAverage,
    stabilityScore
  });

  const riskDistribution = ['Low', 'Moderate', 'High', 'Critical'].map((band) => ({
    band,
    count: completedCourses.filter((item) => item.riskBand === band).length
  }));

  const coursePerformanceChart = courseAnalytics.map((course) => ({
    name: course.courseCode,
    fuzzy: course.fuzzyScore || 0,
    outcome: course.courseOutcomeScore || 0,
    weightedAverage: course.weightedAverage || 0,
    risk: course.riskScore || 0,
    status: course.status
  }));

  const courseTimeline = [...courseAnalytics]
    .sort((a, b) => new Date(a.resultUpdatedAt || a.enrolledAt || 0) - new Date(b.resultUpdatedAt || b.enrolledAt || 0))
    .map((course, index) => ({
      label: course.courseCode,
      order: index + 1,
      fuzzyScore: course.fuzzyScore || 0,
      courseOutcomeScore: course.courseOutcomeScore || 0,
      riskScore: course.riskScore || 0
    }));

  const weakestCourse = [...completedCourses]
    .sort((a, b) => (a.courseOutcomeScore || a.fuzzyScore || 0) - (b.courseOutcomeScore || b.fuzzyScore || 0))[0] || null;
  const strongestCourse = [...completedCourses]
    .sort((a, b) => (b.courseOutcomeScore || b.fuzzyScore || 0) - (a.courseOutcomeScore || a.fuzzyScore || 0))[0] || null;

  const weakClos = [...overallCloAnalytics]
    .filter((item) => item.weak)
    .sort((a, b) => a.score - b.score)
    .slice(0, 4);
  const weakPlos = [...overallPloAnalytics]
    .filter((item) => item.weak)
    .sort((a, b) => a.score - b.score)
    .slice(0, 4);

  const strongClos = [...overallCloAnalytics]
    .filter((item) => item.score >= 70)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  const strongPlos = [...overallPloAnalytics]
    .filter((item) => item.score >= 70)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const overallNarrative =
    mastery.score >= 80
      ? 'The student shows strong outcome balance across CLOs, PLOs, and course performance.'
      : mastery.score >= 65
        ? 'The student is doing well, but a few outcome areas need more attention.'
        : mastery.score >= 50
          ? 'The student is at a satisfactory level with visible weak spots in outcomes.'
          : 'The student needs support across course performance and outcome attainment.';

  return {
    courseAnalytics,
    coursePerformanceChart,
    courseTimeline,
    overallCloAnalytics,
    overallPloAnalytics,
    riskDistribution,
    weakClos,
    weakPlos,
    strongClos,
    strongPlos,
    weakestCourse,
    strongestCourse,
    pendingCourses,
    completedCourses,
    performance: {
      courseCount: enrollments.length,
      completedCourseCount: completedCourses.length,
      pendingCourseCount: pendingCourses.length,
      completionRate: enrollments.length ? round((completedCourses.length / enrollments.length) * 100) : 0,
      performanceScore,
      weightedAverageScore,
      riskScore,
      overallCloAverage,
      overallPloAverage,
      stabilityScore,
      masteryScore: mastery.score,
      masteryLabel: mastery.label,
      masteryLevel: mastery.level,
      masteryNarrative: mastery.narrative,
      overallNarrative
    },
    mastery
  };
};

module.exports = { buildStudentAnalytics };