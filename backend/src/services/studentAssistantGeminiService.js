const { GoogleGenerativeAI } = require('@google/generative-ai');

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const DEFAULT_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 12000;

let cachedClient = null;

const isGeminiConfigured = () => Boolean(process.env.GEMINI_API_KEY);

const getGeminiClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    const error = new Error('Gemini API key is not configured.');
    error.code = 'GEMINI_NOT_CONFIGURED';
    throw error;
  }

  if (!cachedClient) {
    cachedClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  return cachedClient;
};

const withTimeout = async (promise, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  let timer;

  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => {
        const error = new Error('Gemini request timed out.');
        error.code = 'GEMINI_TIMEOUT';
        reject(error);
      }, timeoutMs);
    })
  ]).finally(() => {
    clearTimeout(timer);
  });
};

const buildPrompt = ({ message, context }) => {
  const promptContext = JSON.stringify(context.promptContext || {}, null, 2);

  return `
You are an AI Academic Assistant inside an Outcome-Based Education student assessment platform.

Your job:
- Answer only about this one logged-in student.
- Use only the student context provided below.
- Do not invent scores, courses, CLOs, PLOs, alerts, trends, or risks.
- If something is missing in the context, clearly say it is not available yet.
- Never mention hidden system data, other students, faculty-only information, or internal admin details.
- Keep the answer practical, supportive, and concise.
- When relevant, explain the main reason and then give 2 or 3 focused next steps.
- Do not answer like a general internet chatbot. Stay inside academic performance support for this platform.

Student context:
${promptContext}

Student question:
${message}

Return plain text only. Do not use markdown tables.`;
};

const cleanGeminiText = (value = '') =>
  String(value || '')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const generateStudentAssistantReply = async ({ message, context }) => {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({
    model: DEFAULT_MODEL,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 280
    }
  });

  const prompt = buildPrompt({ message, context });

  const result = await withTimeout(model.generateContent(prompt), DEFAULT_TIMEOUT_MS);
  const text = cleanGeminiText(result?.response?.text?.() || '');

  if (!text) {
    const error = new Error('Gemini returned an empty response.');
    error.code = 'GEMINI_EMPTY_RESPONSE';
    throw error;
  }

  return text;
};

module.exports = {
  isGeminiConfigured,
  generateStudentAssistantReply
};
