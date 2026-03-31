const mongoose = require('mongoose');

const attainmentSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true },
    score: { type: Number, required: true, min: 0, max: 100 }
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
    evaluatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastEvaluatedAt: { type: Date }
  },
  { timestamps: true }
);

resultSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Result', resultSchema);
