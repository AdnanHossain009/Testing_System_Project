const mongoose = require('mongoose');

const storedFileSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true, trim: true },
    filename: { type: String, required: true, trim: true },
    relativePath: { type: String, required: true, trim: true },
    mimeType: { type: String, trim: true, default: 'application/octet-stream' },
    size: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const evidenceArtifactSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    evidenceType: {
      type: String,
      enum: ['report', 'project', 'presentation', 'lab_document', 'capstone', 'assessment_evidence', 'other'],
      default: 'other'
    },
    academicTerm: { type: String, trim: true, default: '' },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    assessment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment' },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
    outcomeType: {
      type: String,
      enum: ['', 'CLO', 'PLO'],
      default: ''
    },
    outcomeCode: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active'
    },
    visibility: {
      type: String,
      enum: ['private', 'department', 'institution'],
      default: 'department'
    },
    file: { type: storedFileSchema, required: true },
    uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('EvidenceArtifact', evidenceArtifactSchema);
