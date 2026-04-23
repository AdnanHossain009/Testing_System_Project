const mongoose = require('mongoose');

const improvementPlanSchema = new mongoose.Schema(
  {
    academicTerm: { type: String, trim: true, default: '' },
    outcomeType: {
      type: String,
      enum: ['CLO', 'PLO'],
      required: true
    },
    outcomeCode: { type: String, required: true, trim: true },
    currentAttainment: { type: Number, required: true, min: 0, max: 100 },
    targetAttainment: { type: Number, required: true, min: 0, max: 100 },
    gap: { type: Number, default: 0 },
    rootCause: { type: String, trim: true, default: '' },
    proposedAction: { type: String, required: true, trim: true },
    improvementNote: { type: String, trim: true, default: '' },
    reviewNote: { type: String, trim: true, default: '' },
    reviewedAttainment: { type: Number, min: 0, max: 100, default: null },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'completed', 'reviewed'],
      default: 'open'
    },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dueDate: { type: Date, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    completedAt: { type: Date },
    reviewedAt: { type: Date }
  },
  { timestamps: true }
);

improvementPlanSchema.pre('save', function updateGap(next) {
  const current = Number(this.currentAttainment) || 0;
  const target = Number(this.targetAttainment) || 0;
  this.gap = Number(Math.max(0, target - current).toFixed(2));
  next();
});

module.exports = mongoose.model('ImprovementPlan', improvementPlanSchema);
