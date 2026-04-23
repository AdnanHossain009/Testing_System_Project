const STARTER_PROMPTS = [
  'Which CLO am I weak in?',
  'What should I improve first?',
  'Why is my risk high?',
  'Which course is hurting my performance?',
  'How can I improve before the next exam?'
];

const INTENTS = {
  WEAK_CLO: 'weak_clo',
  WEAK_PLO: 'weak_plo',
  STRONG_CLO: 'strong_clo',
  STRONG_PLO: 'strong_plo',
  RISK: 'risk',
  FUZZY: 'fuzzy',
  WEAKEST_COURSE: 'weakest_course',
  STRONGEST_COURSE: 'strongest_course',
  IMPROVEMENT: 'improvement',
  COURSE_PRIORITY: 'course_priority',
  PROGRESS_SUMMARY: 'progress_summary',
  ALERTS: 'alerts',
  EXAM_STRATEGY: 'exam_strategy',
  GENERAL: 'general'
};

const sanitizeStudentMessage = (value = '') =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim();

const toSentenceList = (items = [], formatter) => {
  const formatted = items.map((item) => formatter(item)).filter(Boolean);
  return formatted.length ? formatted.join(', ') : null;
};

const buildWeakAreaText = (items = [], label = 'areas') => {
  if (!items.length) {
    return `You do not currently have any clearly weak ${label} in the saved analytics.`;
  }

  return items.map((item) => `${item.code} (${item.score}%)`).join(', ');
};

const detectStudentIntent = (message = '') => {
  const text = sanitizeStudentMessage(message).toLowerCase();

  if (!text) {
    return { intent: INTENTS.GENERAL, directFallback: true };
  }

  const checks = [
    {
      intent: INTENTS.WEAK_CLO,
      directFallback: true,
      patterns: [/weak.*clo/, /lowest.*clo/, /clo.*weak/, /clo.*lacking/, /which clo.*(weak|lowest|lack)/]
    },
    {
      intent: INTENTS.WEAK_PLO,
      directFallback: true,
      patterns: [/weak.*plo/, /lowest.*plo/, /plo.*weak/, /which plo.*(weak|lowest|lack)/]
    },
    {
      intent: INTENTS.STRONG_CLO,
      directFallback: true,
      patterns: [/strong.*clo/, /best.*clo/, /highest.*clo/, /which clo.*strong/]
    },
    {
      intent: INTENTS.STRONG_PLO,
      directFallback: true,
      patterns: [/strong.*plo/, /best.*plo/, /highest.*plo/, /which plo.*strong/]
    },
    {
      intent: INTENTS.RISK,
      directFallback: true,
      patterns: [/risk/, /at risk/, /why.*risk/, /risk band/]
    },
    {
      intent: INTENTS.FUZZY,
      directFallback: true,
      patterns: [/fuzzy/, /why.*score low/, /why.*fuzzy/, /performance score/]
    },
    {
      intent: INTENTS.WEAKEST_COURSE,
      directFallback: true,
      patterns: [/weakest course/, /lowest course/, /which course.*worst/, /which course.*hurting/, /course.*improve first/]
    },
    {
      intent: INTENTS.STRONGEST_COURSE,
      directFallback: true,
      patterns: [/strongest course/, /best course/, /highest course/]
    },
    {
      intent: INTENTS.COURSE_PRIORITY,
      directFallback: true,
      patterns: [/priorit/i, /focus first/, /which course should i improve/, /what should i improve first/]
    },
    {
      intent: INTENTS.EXAM_STRATEGY,
      directFallback: true,
      patterns: [/next exam/, /exam strategy/, /assessment strategy/, /before the next exam/, /quiz/, /mid/, /final/]
    },
    {
      intent: INTENTS.ALERTS,
      directFallback: true,
      patterns: [/alert/, /notification/, /warning/]
    },
    {
      intent: INTENTS.PROGRESS_SUMMARY,
      directFallback: true,
      patterns: [/summary/, /overall performance/, /progress/, /how am i doing/]
    },
    {
      intent: INTENTS.IMPROVEMENT,
      directFallback: true,
      patterns: [/improve/, /improvement/, /study suggestion/, /how can i do better/, /what should i focus on/]
    }
  ];

  const match = checks.find((entry) => entry.patterns.some((pattern) => pattern.test(text)));
  if (match) return match;

  return {
    intent: INTENTS.GENERAL,
    directFallback: false
  };
};

const buildActionPlan = (context) => {
  const actions = [];

  if (context.weakestCourse?.courseCode) {
    actions.push(`Start with ${context.weakestCourse.courseCode}, because it is currently your lowest-performing course.`);
  }

  if (context.weakClos?.length) {
    actions.push(
      `Review the topics behind ${context.weakClos.slice(0, 2).map((item) => item.code).join(', ')} and practice questions mapped to those outcomes.`
    );
  }

  if (context.weakPlos?.length) {
    actions.push(
      `Pay extra attention to work that strengthens ${context.weakPlos.slice(0, 2).map((item) => item.code).join(', ')} because those program outcomes are currently lagging.`
    );
  }

  if (context.assessmentPatterns?.lowestAssessmentType) {
    actions.push(
      `Your weakest assessment area is ${context.assessmentPatterns.lowestAssessmentType}, so focus on improving preparation for that format first.`
    );
  }

  if (!actions.length) {
    actions.push('Keep maintaining your stronger areas while continuing consistent revision across current courses.');
  }

  return actions.slice(0, 3);
};

const buildGenericReply = (context) => {
  const actions = buildActionPlan(context);

  return [
    `Your current average fuzzy score is ${context.overview.averageFuzzy}, and your overall risk status is ${context.overview.riskBand}${context.overview.averageRiskScore ? ` (${context.overview.averageRiskScore})` : ''}.`,
    context.weakestCourse?.courseCode
      ? `${context.weakestCourse.courseCode} is the course that needs the most attention right now.`
      : 'There is not enough evaluated course data yet to identify a weakest course.',
    actions.join(' ')
  ].join(' ');
};

const buildFallbackReply = ({ intent, context }) => {
  const weakClosText = buildWeakAreaText(context.weakClos, 'CLOs');
  const weakPlosText = buildWeakAreaText(context.weakPlos, 'PLOs');
  const strongClosText = buildWeakAreaText(context.strongClos, 'CLOs').replace('weak', 'strong');
  const strongPlosText = buildWeakAreaText(context.strongPlos, 'PLOs').replace('weak', 'strong');
  const actions = buildActionPlan(context);

  switch (intent) {
    case INTENTS.WEAK_CLO:
      return context.weakClos.length
        ? `Your weakest CLOs right now are ${weakClosText}. Start with ${context.weakestCourse?.courseCode || 'the course that feels hardest'} and review the topics mapped to those outcomes.`
        : 'You do not currently have any weak CLOs in the saved analytics.';

    case INTENTS.WEAK_PLO:
      return context.weakPlos.length
        ? `Your lowest PLOs are ${weakPlosText}. These are the program-level outcomes that need the most attention across your evaluated courses.`
        : 'You do not currently have any weak PLOs in the saved analytics.';

    case INTENTS.STRONG_CLO:
      return context.strongClos.length
        ? `Your strongest CLOs are ${strongClosText}. Keep using the same study habits that helped you perform well in those outcomes.`
        : 'There is not enough strong CLO data yet to identify a clear strength.';

    case INTENTS.STRONG_PLO:
      return context.strongPlos.length
        ? `Your strongest PLOs are ${strongPlosText}. Those program-level outcomes currently look like your most stable strengths.`
        : 'There is not enough strong PLO data yet to identify a clear strength.';

    case INTENTS.RISK:
      return `Your overall risk status is ${context.overview.riskBand}${context.overview.averageRiskScore ? ` with an average risk score of ${context.overview.averageRiskScore}` : ''}. ${
        context.recentAlerts.length
          ? `The latest alert is from ${context.recentAlerts[0].courseCode}: ${context.recentAlerts[0].message}`
          : 'There are no recent risk alerts saved for you right now.'
      }`;

    case INTENTS.FUZZY:
      return `Your current average fuzzy score is ${context.overview.averageFuzzy}. ${
        context.weakClos.length || context.weakPlos.length
          ? `It appears lower mainly because of weak outcomes like ${context.weakClos[0]?.code || context.weakPlos[0]?.code}.`
          : 'There are no major weak outcome flags right now.'
      } ${
        context.assessmentPatterns?.lowestAssessmentType
          ? `Your lowest assessment category is ${context.assessmentPatterns.lowestAssessmentType}, which is likely contributing to the score.`
          : ''
      }`;

    case INTENTS.WEAKEST_COURSE:
      return context.weakestCourse?.courseCode
        ? `${context.weakestCourse.courseCode} - ${context.weakestCourse.courseName} is currently your weakest course. It has a fuzzy score of ${context.weakestCourse.fuzzyScore}, a course outcome score of ${context.weakestCourse.courseOutcomeScore}, and the current insight is: ${context.weakestCourse.insight}`
        : 'There is not enough evaluated course data yet to identify your weakest course.';

    case INTENTS.STRONGEST_COURSE:
      return context.strongestCourse?.courseCode
        ? `${context.strongestCourse.courseCode} - ${context.strongestCourse.courseName} is currently your strongest course. Its fuzzy score is ${context.strongestCourse.fuzzyScore}, and the system insight is: ${context.strongestCourse.insight}`
        : 'There is not enough evaluated course data yet to identify your strongest course.';

    case INTENTS.COURSE_PRIORITY:
      return context.coursePriorities.length
        ? `You should improve these courses first: ${context.coursePriorities
            .map((item) => `${item.priority}. ${item.courseCode}`)
            .join(', ')}. ${actions[0] || ''}`
        : 'There is not enough evaluated course data yet to build a course priority list.';

    case INTENTS.EXAM_STRATEGY:
      return `Before the next exam, focus on ${context.assessmentPatterns?.lowestAssessmentType || 'the assessment format that feels most difficult'} first. ${
        context.weakClos.length
          ? `Revise the material behind ${context.weakClos.slice(0, 2).map((item) => item.code).join(', ')} because those outcomes are currently weak.`
          : ''
      } ${context.weakestCourse?.courseCode ? `Also spend extra time on ${context.weakestCourse.courseCode}.` : ''}`;

    case INTENTS.ALERTS:
      return context.recentAlerts.length
        ? `Your most recent alerts are: ${context.recentAlerts
            .slice(0, 3)
            .map((item) => `${item.courseCode}: ${item.message}`)
            .join(' | ')}`
        : 'You do not have any recent academic alerts right now.';

    case INTENTS.PROGRESS_SUMMARY:
      return `You are currently enrolled in ${context.overview.enrolledCourseCount} course(s), with ${context.overview.completedCourseCount} evaluated course(s). Your average fuzzy score is ${context.overview.averageFuzzy}, your mastery level is ${context.overview.masteryLabel}, and your overall risk status is ${context.overview.riskBand}. ${context.trendSummary.note}`;

    case INTENTS.IMPROVEMENT:
      return `The best improvement focus right now is to address ${context.weakClos.length ? context.weakClos[0].code : 'your weakest evaluated outcomes'} and prioritize ${context.weakestCourse?.courseCode || 'your lowest course'}. ${actions.join(' ')}`;

    default:
      return buildGenericReply(context);
  }
};

module.exports = {
  INTENTS,
  STARTER_PROMPTS,
  sanitizeStudentMessage,
  detectStudentIntent,
  buildFallbackReply
};
