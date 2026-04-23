const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const { logAction } = require('../services/auditService');
const { buildStudentAssistantContext } = require('../services/studentAssistantContextService');
const {
  sanitizeStudentMessage,
  detectStudentIntent,
  buildFallbackReply
} = require('../services/studentAssistantFallbackService');
const { generateStudentAssistantReply } = require('../services/studentAssistantGeminiService');
const { buildAssistantSummary, buildContextSummaryPayload } = require('../services/studentAssistantResponseService');

const chatWithStudentAssistant = asyncHandler(async (req, res) => {
  const message = sanitizeStudentMessage(req.body?.message);

  if (!message) {
    res.status(400);
    throw new Error('A message is required.');
  }

  if (message.length > 500) {
    res.status(400);
    throw new Error('Please keep the question under 500 characters.');
  }

  const context = await buildStudentAssistantContext(req.user._id);
  const intentMatch = detectStudentIntent(message);

  let reply = '';
  let source = 'fallback';
  let fallbackReason = '';

  if (intentMatch.directFallback) {
    reply = buildFallbackReply({ intent: intentMatch.intent, context, message });
  } else {
    try {
      reply = await generateStudentAssistantReply({ message, context });
      source = 'gemini';
    } catch (error) {
      fallbackReason = error.message || 'Gemini unavailable';
      reply = buildFallbackReply({ intent: intentMatch.intent, context, message });
      source = 'fallback';
    }
  }

  await logAction({
    actor: req.user._id,
    action: 'STUDENT_ASSISTANT_CHAT',
    entityType: 'StudentAssistant',
    entityId: req.user._id.toString(),
    metadata: {
      source,
      intent: intentMatch.intent,
      fallbackReason: fallbackReason || null
    }
  });

  return success(
    res,
    {
      reply,
      source,
      intent: intentMatch.intent,
      summary: buildAssistantSummary(context)
    },
    'Student assistant reply generated.'
  );
});

const getStudentAssistantContextSummary = asyncHandler(async (req, res) => {
  const context = await buildStudentAssistantContext(req.user._id);

  return success(
    res,
    {
      ...buildContextSummaryPayload(context)
    },
    'Student assistant context fetched.'
  );
});

module.exports = {
  chatWithStudentAssistant,
  getStudentAssistantContextSummary
};
