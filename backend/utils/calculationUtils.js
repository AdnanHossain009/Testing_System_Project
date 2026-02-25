const {
  PERFORMANCE_THRESHOLDS,
  PERFORMANCE_LEVELS,
  GRADE_SYSTEM,
  CLO_ATTAINMENT_THRESHOLD,
  PLO_ATTAINMENT_THRESHOLD,
} = require('../config/constants');

/**
 * Calculate weighted score
 * @param {Number} obtainedMarks - Marks obtained by student
 * @param {Number} totalMarks - Total marks of assessment
 * @param {Number} weightage - Weightage of assessment (0-100)
 * @returns {Number} Weighted score
 */
const calculateWeightedScore = (obtainedMarks, totalMarks, weightage) => {
  if (totalMarks === 0) return 0;
  const percentage = (obtainedMarks / totalMarks) * 100;
  return (percentage * weightage) / 100;
};

/**
 * Calculate CLO attainment percentage
 * @param {Array} marks - Array of marks objects
 * @param {String} cloId - CLO ID
 * @returns {Number} CLO attainment percentage
 */
const calculateCLOAttainment = (marks, cloId) => {
  if (!marks || marks.length === 0) return 0;

  const cloMarks = marks.filter((mark) => {
    const assessment = mark.assessment;
    return assessment.cloMapping?.some((mapping) => mapping.clo.toString() === cloId.toString());
  });

  if (cloMarks.length === 0) return 0;

  let totalWeightedScore = 0;
  let totalWeight = 0;

  cloMarks.forEach((mark) => {
    const assessment = mark.assessment;
    const cloMapping = assessment.cloMapping.find(
      (mapping) => mapping.clo.toString() === cloId.toString()
    );

    if (cloMapping) {
      const weightedScore = calculateWeightedScore(
        mark.obtainedMarks,
        assessment.totalMarks,
        cloMapping.weight
      );
      totalWeightedScore += weightedScore;
      totalWeight += cloMapping.weight;
    }
  });

  return totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0;
};

/**
 * Calculate PLO attainment by aggregating CLO achievements
 * @param {Array} cloAchievements - Array of CLO achievements
 * @param {String} ploId - PLO ID
 * @returns {Number} PLO attainment percentage
 */
const calculatePLOAttainment = (cloAchievements, ploId) => {
  if (!cloAchievements || cloAchievements.length === 0) return 0;

  const ploCLOs = cloAchievements.filter(
    (clo) => clo.mappedPLO && clo.mappedPLO.toString() === ploId.toString()
  );

  if (ploCLOs.length === 0) return 0;

  const totalAchievement = ploCLOs.reduce((sum, clo) => sum + clo.achievement, 0);
  return totalAchievement / ploCLOs.length;
};

/**
 * Determine performance level based on percentage
 * @param {Number} percentage - Achievement percentage
 * @returns {String} Performance level
 */
const getPerformanceLevel = (percentage) => {
  if (percentage >= PERFORMANCE_THRESHOLDS.EXCELLENT.min) {
    return PERFORMANCE_LEVELS.EXCELLENT;
  } else if (percentage >= PERFORMANCE_THRESHOLDS.GOOD.min) {
    return PERFORMANCE_LEVELS.GOOD;
  } else if (percentage >= PERFORMANCE_THRESHOLDS.AVERAGE.min) {
    return PERFORMANCE_LEVELS.AVERAGE;
  } else {
    return PERFORMANCE_LEVELS.POOR;
  }
};

/**
 * Calculate grade based on percentage
 * @param {Number} percentage - Achievement percentage
 * @returns {Object} Grade object with grade and GPA
 */
const calculateGrade = (percentage) => {
  const gradeInfo = GRADE_SYSTEM.find(
    (g) => percentage >= g.min && percentage <= g.max
  );
  return gradeInfo || { grade: 'F', gpa: 0.0 };
};

/**
 * Check if CLO/PLO is attained
 * @param {Number} achievement - Achievement percentage
 * @param {String} type - 'CLO' or 'PLO'
 * @returns {Boolean} True if attained
 */
const isAttained = (achievement, type = 'CLO') => {
  const threshold = type === 'CLO' ? CLO_ATTAINMENT_THRESHOLD : PLO_ATTAINMENT_THRESHOLD;
  return achievement >= threshold;
};

/**
 * Calculate overall percentage from weighted assessments
 * @param {Array} marks - Array of marks with assessments
 * @returns {Number} Overall percentage
 */
const calculateOverallPercentage = (marks) => {
  if (!marks || marks.length === 0) return 0;

  let totalWeightedScore = 0;
  let totalWeightage = 0;

  marks.forEach((mark) => {
    const assessment = mark.assessment;
    const weightedScore = calculateWeightedScore(
      mark.obtainedMarks,
      assessment.totalMarks,
      assessment.weightage
    );
    totalWeightedScore += weightedScore;
    totalWeightage += assessment.weightage;
  });

  return totalWeightage > 0 ? totalWeightedScore : 0;
};

/**
 * Calculate risk score for student
 * @param {Number} overallPercentage - Student's overall percentage
 * @param {Array} cloAchievements - CLO achievements
 * @param {Number} attendanceRate - Attendance percentage
 * @returns {Number} Risk score (0-100, higher = more at risk)
 */
const calculateRiskScore = (overallPercentage, cloAchievements = [], attendanceRate = 100) => {
  let riskScore = 0;

  // Factor 1: Overall performance (40% weight)
  if (overallPercentage < 40) {
    riskScore += 40;
  } else if (overallPercentage < 60) {
    riskScore += 20;
  }

  // Factor 2: CLO attainment (40% weight)
  const failedCLOs = cloAchievements.filter((clo) => !clo.isAttained).length;
  const cloFailureRate = cloAchievements.length > 0 ? failedCLOs / cloAchievements.length : 0;
  riskScore += cloFailureRate * 40;

  // Factor 3: Attendance (20% weight)
  if (attendanceRate < 75) {
    riskScore += 20;
  } else if (attendanceRate < 85) {
    riskScore += 10;
  }

  return Math.min(Math.round(riskScore), 100);
};

/**
 * Generate recommendations based on performance
 * @param {Object} outcomeResult - Outcome result object
 * @returns {Array} Array of recommendation strings
 */
const generateRecommendations = (outcomeResult) => {
  const recommendations = [];

  // Overall performance recommendations
  if (outcomeResult.overallPercentage < 40) {
    recommendations.push('Immediate academic intervention required');
    recommendations.push('Schedule one-on-one tutoring sessions');
  } else if (outcomeResult.overallPercentage < 60) {
    recommendations.push('Additional practice exercises recommended');
    recommendations.push('Attend office hours for clarification');
  }

  // CLO-specific recommendations
  const failedCLOs = outcomeResult.cloAchievements.filter((clo) => !clo.isAttained);
  if (failedCLOs.length > 0) {
    recommendations.push(
      `Focus on improving ${failedCLOs.map((c) => c.cloCode).join(', ')}`
    );
  }

  // PLO-specific recommendations
  const failedPLOs = outcomeResult.ploAchievements.filter((plo) => !plo.isAttained);
  if (failedPLOs.length > 0) {
    recommendations.push('Review fundamental concepts related to failed PLOs');
  }

  // Risk-based recommendations
  if (outcomeResult.isAtRisk) {
    recommendations.push('Consider peer study groups');
    recommendations.push('Utilize online learning resources');
  }

  return recommendations;
};

module.exports = {
  calculateWeightedScore,
  calculateCLOAttainment,
  calculatePLOAttainment,
  getPerformanceLevel,
  calculateGrade,
  isAttained,
  calculateOverallPercentage,
  calculateRiskScore,
  generateRecommendations,
};
