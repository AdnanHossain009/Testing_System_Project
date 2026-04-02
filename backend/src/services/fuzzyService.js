const FuzzyRule = require('../models/FuzzyRule');

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const triangle = (x, a, b, c) => {
  if (a === b && x <= a) return 1;
  if (b === c && x >= c) return 1;
  if (x <= a || x >= c) return 0;
  if (x === b) return 1;
  if (x < b) return (x - a) / (b - a || 1);
  return (c - x) / (c - b || 1);
};

const fuzzifyValue = (x) => {
  const value = clamp(Number(x) || 0, 0, 100);
  return {
    low: Number(triangle(value, 0, 0, 50).toFixed(4)),
    medium: Number(triangle(value, 25, 50, 75).toFixed(4)),
    high: Number(triangle(value, 50, 100, 100).toFixed(4))
  };
};

const outputMembership = {
  low: (x) => triangle(x, 0, 0, 50),
  medium: (x) => triangle(x, 25, 50, 75),
  high: (x) => triangle(x, 50, 100, 100)
};

const DEFAULT_RULES = [
  {
    name: 'All low means low attainment',
    antecedent: { quiz: 'low', assignment: 'low', mid: 'low', final: 'low' },
    consequent: 'low'
  },
  {
    name: 'Weak final and mid means low attainment',
    antecedent: { mid: 'low', final: 'low' },
    consequent: 'low'
  },
  {
    name: 'Low assignment and low quiz means low attainment',
    antecedent: { quiz: 'low', assignment: 'low' },
    consequent: 'low'
  },
  {
    name: 'Balanced medium performance gives medium attainment',
    antecedent: { quiz: 'medium', assignment: 'medium', mid: 'medium', final: 'medium' },
    consequent: 'medium'
  },
  {
    name: 'Strong final with medium internal gives medium attainment',
    antecedent: { quiz: 'medium', assignment: 'medium', final: 'high' },
    consequent: 'medium'
  },
  {
    name: 'Strong mid and final gives high attainment',
    antecedent: { mid: 'high', final: 'high' },
    consequent: 'high'
  },
  {
    name: 'Strong quiz, assignment and final gives high attainment',
    antecedent: { quiz: 'high', assignment: 'high', final: 'high' },
    consequent: 'high'
  },
  {
    name: 'High final alone improves attainment',
    antecedent: { final: 'high' },
    consequent: 'high'
  },
  {
    name: 'Mixed medium and high gives medium attainment',
    antecedent: { quiz: 'medium', mid: 'high', final: 'medium' },
    consequent: 'medium'
  },
  {
    name: 'Very strong overall means high attainment',
    antecedent: { quiz: 'high', assignment: 'high', mid: 'high', final: 'high' },
    consequent: 'high'
  }
];

const getRules = async () => {
  const dbRules = await FuzzyRule.find({ active: true }).lean();
  if (!dbRules.length) return DEFAULT_RULES;
  return dbRules.map((rule) => ({
    name: rule.name,
    antecedent: rule.antecedent,
    consequent: rule.consequent
  }));
};

const ruleStrength = (antecedent, fuzzyInputs) => {
  const scores = Object.entries(antecedent)
    .filter(([, label]) => Boolean(label))
    .map(([key, label]) => fuzzyInputs[key]?.[label] ?? 0);

  if (!scores.length) return 0;
  return Math.min(...scores);
};

const defuzzify = (activations) => {
  let numerator = 0;
  let denominator = 0;

  for (let x = 0; x <= 100; x += 1) {
    let mu = 0;
    activations.forEach((activation) => {
      const outputMu = outputMembership[activation.consequent](x);
      mu = Math.max(mu, Math.min(activation.strength, outputMu));
    });
    numerator += x * mu;
    denominator += mu;
  }

  return denominator === 0 ? 0 : numerator / denominator;
};

const evaluateFuzzy = async (marks) => {
  const normalizedMarks = {
    quiz: clamp(Number(marks.quiz) || 0, 0, 100),
    assignment: clamp(Number(marks.assignment) || 0, 0, 100),
    mid: clamp(Number(marks.mid) || 0, 0, 100),
    final: clamp(Number(marks.final) || 0, 0, 100)
  };

  const fuzzyInputs = {
    quiz: fuzzifyValue(normalizedMarks.quiz),
    assignment: fuzzifyValue(normalizedMarks.assignment),
    mid: fuzzifyValue(normalizedMarks.mid),
    final: fuzzifyValue(normalizedMarks.final)
  };

  const rules = await getRules();
  const activations = rules
    .map((rule) => ({
      name: rule.name,
      consequent: rule.consequent,
      strength: Number(ruleStrength(rule.antecedent, fuzzyInputs).toFixed(4))
    }))
    .filter((item) => item.strength > 0);

  const crispScore = Number(defuzzify(activations).toFixed(2));

  let attainmentLevel = 'Low';
  if (crispScore >= 70) attainmentLevel = 'High';
  else if (crispScore >= 40) attainmentLevel = 'Medium';

  return {
    normalizedMarks,
    fuzzyInputs,
    activatedRules: activations,
    fuzzyScore: crispScore,
    attainmentLevel
  };
};

module.exports = { evaluateFuzzy, DEFAULT_RULES };
