const { STARTER_PROMPTS } = require('./studentAssistantFallbackService');

const buildAssistantSummary = (context = {}) => ({
  weakClos: (context.weakClos || []).slice(0, 3).map((item) => ({
    code: item.code,
    score: item.score
  })),
  weakPlos: (context.weakPlos || []).slice(0, 3).map((item) => ({
    code: item.code,
    score: item.score
  })),
  strongClos: (context.strongClos || []).slice(0, 2).map((item) => ({
    code: item.code,
    score: item.score
  })),
  strongPlos: (context.strongPlos || []).slice(0, 2).map((item) => ({
    code: item.code,
    score: item.score
  })),
  fuzzyScore: context.overview?.averageFuzzy ?? 0,
  riskScore: context.overview?.averageRiskScore ?? 0,
  riskBand: context.overview?.riskBand || 'Pending',
  masteryLabel: context.overview?.masteryLabel || 'Pending',
  weakestCourse: context.weakestCourse
    ? {
        courseCode: context.weakestCourse.courseCode,
        courseName: context.weakestCourse.courseName,
        fuzzyScore: context.weakestCourse.fuzzyScore
      }
    : null,
  strongestCourse: context.strongestCourse
    ? {
        courseCode: context.strongestCourse.courseCode,
        courseName: context.strongestCourse.courseName,
        fuzzyScore: context.strongestCourse.fuzzyScore
      }
    : null,
  assessmentFocus: context.assessmentPatterns?.lowestAssessmentType || null
});

const buildContextSummaryPayload = (context = {}) => ({
  student: context.student,
  overview: context.overview,
  summary: buildAssistantSummary(context),
  coursePriorities: context.coursePriorities || [],
  recentAlerts: context.recentAlerts || [],
  starterPrompts: STARTER_PROMPTS
});

module.exports = {
  buildAssistantSummary,
  buildContextSummaryPayload
};
