const mongoose = require('mongoose');

const attainmentSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    percentage: { type: Number, min: 0, max: 100, default: 0 },
    level: { type: Number, min: 1, max: 4, default: 1 },
    attained: { type: Boolean, default: false },
    explanation: { type: String, default: '' }
  },
  { _id: false }
);

const rubricScoreSchema = new mongoose.Schema(
  {
    criterion: { type: String, required: true, trim: true },
    cloCode: { type: String, required: true, trim: true },
    level: { type: Number, required: true, min: 1, max: 4 },
    marks: { type: Number, required: true, min: 0 },
    maxMarks: { type: Number, required: true, min: 0 },
    comment: { type: String, default: '' },
    signal: { type: String, default: '' }
  },
  { _id: false }
);

const cloAllocationSchema = new mongoose.Schema(
  {
    cloCode: { type: String, required: true, trim: true },
    allocatedMarks: { type: Number, required: true, min: 0 },
    earnedMarks: { type: Number, required: true, min: 0 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    signals: [{ type: String }]
  },
  { _id: false }
);

const assessmentEvaluationSchema = new mongoose.Schema(
  {
    assessment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
    assessmentTitle: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    mode: {
      type: String,
      enum: ['marks', 'rubric'],
      default: 'marks'
    },
    totalMarks: { type: Number, required: true, min: 0 },
    obtainedMarks: { type: Number, required: true, min: 0 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    rubricScores: [rubricScoreSchema],
    cloAllocations: [cloAllocationSchema]
  },
  { _id: false }
);

const cloDiagnosticSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    level: { type: Number, required: true, min: 1, max: 4 },
    attained: { type: Boolean, default: false },
    explanation: { type: String, default: '' },
    assessmentBreakdown: [cloAllocationSchema]
  },
  { _id: false }
);

const historySchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    weightedAverage: { type: Number, required: true },
    fuzzyScore: { type: Number, required: true },
    riskScore: { type: Number, required: true }
  },
  { _id: false }
);

const resultSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    rawMarks: {
      quiz: { type: Number, default: 0, min: 0 },
      assignment: { type: Number, default: 0, min: 0 },
      mid: { type: Number, default: 0, min: 0 },
      final: { type: Number, default: 0, min: 0 }
    },
    marks: {
      quiz: { type: Number, default: 0, min: 0, max: 100 },
      assignment: { type: Number, default: 0, min: 0, max: 100 },
      mid: { type: Number, default: 0, min: 0, max: 100 },
      final: { type: Number, default: 0, min: 0, max: 100 }
    },
    weightedAverage: { type: Number, default: 0 },
    fuzzyScore: { type: Number, default: 0 },
    attainmentLevel: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
    riskScore: { type: Number, default: 0 },
    riskBand: { type: String, enum: ['Low', 'Moderate', 'High', 'Critical'], default: 'Low' },
    alerts: [{ type: String }],
    cloAttainment: [attainmentSchema],
    ploAttainment: [attainmentSchema],
    history: [historySchema],
    assessmentEvaluations: [assessmentEvaluationSchema],
    cloDiagnostics: [cloDiagnosticSchema],
    evaluatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastEvaluatedAt: { type: Date }
  },
  { timestamps: true }
);

resultSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Result', resultSchema);
