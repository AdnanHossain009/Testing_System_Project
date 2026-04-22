const SECTION_PATTERNS = {
  clo: /^(course learning outcomes?|learning outcomes?|clos?|clo section)\s*:?\s*$/i,
  plo: /^(program learning outcomes?|program outcomes?|plos?|plo section)\s*:?\s*$/i,
  mapping: /^(clo\s*[-/]?\s*plo mapping|outcome mapping|mapping matrix|mapping table|clo plo mapping)\s*:?\s*$/i,
  assessment: /^(assessment|assessments|evaluation|mark distribution|grading policy|course assessment|assessment structure)\s*:?\s*$/i
};

const EXIT_SECTION_PATTERNS =
  /^(course description|course contents?|weekly schedule|lecture plan|textbooks?|references?|instructor|attendance|grading scale|policies?)\s*:?\s*$/i;
const CLO_REGEX = /\bCLO[\s-]?(\d+)\b/gi;
const PLO_REGEX = /\bPLO[\s-]?(\d+)\b/gi;

const assessmentTypes = [
  { type: 'quiz', regex: /\bquiz(?:es)?\b/i },
  { type: 'assignment', regex: /\bassignment(?:s)?\b/i },
  { type: 'mid', regex: /\bmid(?:term)?(?:\s+exam)?\b/i },
  { type: 'final', regex: /\bfinal(?:\s+exam)?\b/i }
];

const toArray = (value) => (Array.isArray(value) ? value : []);

const cleanLine = (line = '') =>
  String(line)
    .replace(/[\u2022\u25aa\u25cf]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeCode = (prefix, rawValue) => {
  const numericPortion = String(rawValue || '').match(/\d+/)?.[0] || '';
  return `${prefix}${numericPortion}`;
};

const uniqueBy = (items, getKey) => {
  const seen = new Set();

  return items.filter((item) => {
    const key = getKey(item);
    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const stripTrailingPunctuation = (value = '') => String(value).replace(/^[\s:.-]+|[\s:.-]+$/g, '').trim();

const detectBloomLevel = (text = '') => {
  const match =
    text.match(/\bC([1-6])\b/i) || text.match(/\bbloom(?:'s)?(?: level)?\s*[:=-]?\s*C?([1-6])\b/i);
  return match ? `C${match[1]}` : 'C3';
};

const stripBloomFromText = (text = '') =>
  text
    .replace(/\bbloom(?:'s)?(?: level)?\s*[:=-]?\s*C?[1-6]\b/gi, '')
    .replace(/[\[(]?\bC[1-6]\b[\])]?/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

const collectCodes = (line = '', prefix = 'CLO') => {
  const regex = prefix === 'PLO' ? PLO_REGEX : CLO_REGEX;
  const found = [];

  for (const match of line.matchAll(regex)) {
    found.push(normalizeCode(prefix, match[0]));
  }

  return Array.from(new Set(found));
};

const detectSectionHeading = (line = '') => {
  const normalized = cleanLine(line);

  if (!normalized) {
    return null;
  }

  if (SECTION_PATTERNS.clo.test(normalized)) return 'clo';
  if (SECTION_PATTERNS.plo.test(normalized)) return 'plo';
  if (SECTION_PATTERNS.mapping.test(normalized)) return 'mapping';
  if (SECTION_PATTERNS.assessment.test(normalized)) return 'assessment';
  return null;
};

const collectSections = (lines = []) => {
  const sections = {
    clo: [],
    plo: [],
    mapping: [],
    assessment: []
  };

  let activeSection = null;

  lines.forEach((rawLine) => {
    const line = cleanLine(rawLine);

    if (!line) {
      return;
    }

    const heading = detectSectionHeading(line);
    if (heading) {
      activeSection = heading;
      return;
    }

    if (activeSection && EXIT_SECTION_PATTERNS.test(line)) {
      activeSection = null;
      return;
    }

    if (activeSection) {
      sections[activeSection].push(line);
    }
  });

  return sections;
};

const parseOutcomeLine = (line, prefix) => {
  const explicitRegex = new RegExp(
    `^(?:[-*]\\s*)?(?:\\(?\\d+\\)?[.)-]\\s+)?${prefix}[\\s-]?(\\d+)\\b\\s*(?:[:.)\\-]|\\s)\\s*(.+)$`,
    'i'
  );
  const match = cleanLine(line).match(explicitRegex);

  if (!match) {
    return null;
  }

  const description = stripTrailingPunctuation(stripBloomFromText(match[2]));

  if (
    !description ||
    /^(?:->|=>|maps?\s+to|mapped\s+to|corresponds?\s+to|\(?PLO[\s-]?\d+)/i.test(description) ||
    /^(?:->|=>|maps?\s+to|mapped\s+to|corresponds?\s+to|\(?CLO[\s-]?\d+)/i.test(description)
  ) {
    return null;
  }

  return prefix === 'CLO'
    ? {
        code: normalizeCode(prefix, match[1]),
        description,
        bloomLevel: detectBloomLevel(match[2])
      }
    : {
        code: normalizeCode(prefix, match[1]),
        description
      };
};

const parseNumberedSectionOutcome = (line, prefix) => {
  const numberedMatch = cleanLine(line).match(/^(?:[-*]\s*)?(?:\(?(\d+)\)?[.)-])\s+(.+)$/);

  if (!numberedMatch) {
    return null;
  }

  const description = stripTrailingPunctuation(stripBloomFromText(numberedMatch[2]));
  if (!description) {
    return null;
  }

  return prefix === 'CLO'
    ? {
        code: normalizeCode(prefix, numberedMatch[1]),
        description,
        bloomLevel: detectBloomLevel(numberedMatch[2])
      }
    : {
        code: normalizeCode(prefix, numberedMatch[1]),
        description
      };
};

const extractOutcomes = (lines = [], prefix = 'CLO', { sectionMode = false } = {}) => {
  const outcomeItems = [];

  lines.forEach((line) => {
    const explicit = parseOutcomeLine(line, prefix);
    if (explicit) {
      outcomeItems.push(explicit);
      return;
    }

    if (sectionMode) {
      const numbered = parseNumberedSectionOutcome(line, prefix);
      if (numbered) {
        outcomeItems.push(numbered);
      }
    }
  });

  return uniqueBy(outcomeItems, (item) => item.code);
};

const normalizeWeight = (rawWeight = '', line = '') => {
  const numericValue = Number(String(rawWeight).replace('%', ''));

  if (!Number.isFinite(numericValue)) {
    return 1;
  }

  if (String(rawWeight).includes('%') || /%/.test(line)) {
    return Number(Math.min(1, numericValue / 100).toFixed(2));
  }

  if (numericValue <= 1) {
    return numericValue;
  }

  return 1;
};

const extractMappings = (lines = []) => {
  const mappingRows = [];

  lines.forEach((rawLine) => {
    const line = cleanLine(rawLine);
    const cloCodes = collectCodes(line, 'CLO');
    const ploCodes = collectCodes(line, 'PLO');

    if (!cloCodes.length || !ploCodes.length) {
      return;
    }

    const pairRegex = /(CLO[\s-]?\d+)[^.\n\r]{0,50}?(PLO[\s-]?\d+)(?:[^0-9%]{0,15}(\d+(?:\.\d+)?%?))?/gi;
    const directPairs = [];

    for (const match of line.matchAll(pairRegex)) {
      directPairs.push({
        cloCode: normalizeCode('CLO', match[1]),
        ploCode: normalizeCode('PLO', match[2]),
        weight: normalizeWeight(match[3], line)
      });
    }

    if (directPairs.length) {
      mappingRows.push(...directPairs);
      return;
    }

    const fallbackWeightMatch =
      line.match(/(?:weight|score|level)\s*[:=-]?\s*(\d+(?:\.\d+)?%?)/i) || line.match(/\((\d+(?:\.\d+)?%?)\)/);
    const fallbackWeight = normalizeWeight(fallbackWeightMatch?.[1], line);

    cloCodes.forEach((cloCode) => {
      ploCodes.forEach((ploCode) => {
        mappingRows.push({
          cloCode,
          ploCode,
          weight: fallbackWeight
        });
      });
    });
  });

  return uniqueBy(mappingRows, (item) => `${item.cloCode}-${item.ploCode}`);
};

const roundNumber = (value) => Number(Number(value || 0).toFixed(2));

const extractWeightage = (line = '') => {
  const percentageMatch = line.match(/(\d+(?:\.\d+)?)\s*%/);
  if (percentageMatch) {
    return roundNumber(percentageMatch[1]);
  }

  const keywordMatch = line.match(/weight(?:age)?\s*[:=-]?\s*(\d+(?:\.\d+)?)/i);
  if (keywordMatch) {
    return roundNumber(keywordMatch[1]);
  }

  return 0;
};

const extractTotalMarks = (line = '') => {
  const marksMatch =
    line.match(/(?:total\s*)?marks?\s*[:=-]?\s*(\d+(?:\.\d+)?)/i) ||
    line.match(/out of\s*(\d+(?:\.\d+)?)/i);

  if (marksMatch) {
    return roundNumber(marksMatch[1]);
  }

  return 0;
};

const extractAssessmentDistribution = (line = '', totalMarks = 0, cloCodes = []) => {
  const rows = [];
  const pairRegex = /(CLO[\s-]?\d+)\s*[:=]\s*(\d+(?:\.\d+)?)/gi;

  for (const match of line.matchAll(pairRegex)) {
    rows.push({
      cloCode: normalizeCode('CLO', match[1]),
      marks: roundNumber(match[2])
    });
  }

  if (rows.length) {
    return uniqueBy(rows, (item) => item.cloCode);
  }

  if (cloCodes.length && totalMarks > 0) {
    const equalShare = roundNumber(totalMarks / cloCodes.length);
    return cloCodes.map((cloCode) => ({
      cloCode,
      marks: equalShare
    }));
  }

  return [];
};

const formatAssessmentTitle = (type = 'quiz') => {
  if (type === 'mid') return 'Mid';
  if (type === 'final') return 'Final';
  return type.charAt(0).toUpperCase() + type.slice(1);
};

const parseAssessmentLine = (line) => {
  const typeEntry = assessmentTypes.find((item) => item.regex.test(line));
  if (!typeEntry) {
    return null;
  }

  const cloCodes = collectCodes(line, 'CLO');
  const weightage = extractWeightage(line);
  const totalMarks = extractTotalMarks(line) || weightage;
  const cloDistribution = extractAssessmentDistribution(line, totalMarks, cloCodes);

  return {
    title: formatAssessmentTitle(typeEntry.type),
    type: typeEntry.type,
    cloCodes,
    cloDistribution,
    totalMarks,
    weightage,
    note: line
  };
};

const extractAssessments = (lines = []) => {
  const assessments = lines
    .map((line) => parseAssessmentLine(cleanLine(line)))
    .filter((item) => item && item.title && item.type && item.totalMarks > 0 && item.weightage > 0);

  return uniqueBy(
    assessments,
    (item) => `${item.type}-${item.title}-${item.weightage}-${item.cloCodes.join(',')}`
  );
};

const parseCoursePdfText = (text = '') => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => cleanLine(line))
    .filter(Boolean);

  const sections = collectSections(lines);
  const clos = uniqueBy(
    [...extractOutcomes(sections.clo, 'CLO', { sectionMode: true }), ...extractOutcomes(lines, 'CLO')],
    (item) => item.code
  );
  const plos = uniqueBy(
    [...extractOutcomes(sections.plo, 'PLO', { sectionMode: true }), ...extractOutcomes(lines, 'PLO')],
    (item) => item.code
  );
  const mappings = extractMappings([...toArray(sections.mapping), ...lines]);
  const assessments = extractAssessments(sections.assessment.length ? sections.assessment : lines);

  const warnings = [];
  if (!clos.length) warnings.push('No CLOs were detected automatically.');
  if (!plos.length) warnings.push('No PLOs were detected automatically.');
  if (!mappings.length) warnings.push('No CLO-PLO mapping rows were detected automatically.');
  if (!assessments.length) warnings.push('No assessment rows were detected automatically.');

  return {
    clos,
    plos,
    mappings,
    assessments,
    warnings,
    textPreview: lines.slice(0, 80).join('\n')
  };
};

module.exports = {
  parseCoursePdfText
};
