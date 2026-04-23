const mongoose = require('mongoose');

const sampledArtifactSchema = new mongoose.Schema(
  {
    artifact: { type: mongoose.Schema.Types.ObjectId, ref: 'EvidenceArtifact', required: true },
    reviewStatus: {
      type: String,
      enum: ['pending', 'in_review', 'reviewed', 'flagged'],
      default: 'pending'
    },
    reviewNote: { type: String, trim: true, default: '' },
    reviewedAt: { type: Date }
  },
  { _id: false }
);

const evidenceSampleSetSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    academicTerm: { type: String, trim: true, default: '' },
    groupBy: {
      type: String,
      enum: ['course', 'program', 'term', 'outcome', 'custom'],
      default: 'custom'
    },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    outcomeType: {
      type: String,
      enum: ['', 'CLO', 'PLO'],
      default: ''
    },
    outcomeCode: { type: String, trim: true, default: '' },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['draft', 'in_review', 'reviewed', 'archived'],
      default: 'draft'
    },
    sampledArtifacts: [sampledArtifactSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('EvidenceSampleSet', evidenceSampleSetSchema);
