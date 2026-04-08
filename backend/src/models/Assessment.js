const mongoose = require('mongoose');

const cloDistributionSchema = new mongoose.Schema(
  {
    cloCode: { type: String, required: true, trim: true },
    marks: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const rubricLevelSchema = new mongoose.Schema(
  {
    level: { type: Number, required: true, min: 1, max: 4 },
    label: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' }
  },
  { _id: false }
);

const rubricCriterionSchema = new mongoose.Schema(
  {
    cloCode: { type: String, required: true, trim: true },
    criterion: { type: String, required: true, trim: true },
    marks: { type: Number, required: true, min: 0 },
    levels: [rubricLevelSchema]
  },
  { _id: false }
);

const assessmentSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['quiz', 'assignment', 'mid', 'final'],
      required: true
    },
    cloCodes: [{ type: String, trim: true }],
    cloDistribution: [cloDistributionSchema],
    rubricCriteria: [rubricCriterionSchema],
    totalMarks: { type: Number, required: true, min: 1 },
    weightage: { type: Number, required: true, min: 1, max: 100 },
    dueDate: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Assessment', assessmentSchema);
