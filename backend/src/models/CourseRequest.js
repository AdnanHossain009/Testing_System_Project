const mongoose = require('mongoose');

const cloSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    bloomLevel: { type: String, default: 'C3' }
  },
  { _id: false }
);

const ploSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const mappingItemSchema = new mongoose.Schema(
  {
    cloCode: { type: String, required: true, trim: true },
    ploCode: { type: String, required: true, trim: true },
    weight: { type: Number, required: true, min: 0, max: 1 }
  },
  { _id: false }
);

const cloDistributionSchema = new mongoose.Schema(
  {
    cloCode: { type: String, required: true, trim: true },
    marks: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const proposedAssessmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['quiz', 'assignment', 'mid', 'final'],
      required: true
    },
    cloCodes: [{ type: String, trim: true }],
    cloDistribution: [cloDistributionSchema],
    totalMarks: { type: Number, default: 0, min: 0 },
    weightage: { type: Number, default: 0, min: 0, max: 100 },
    note: { type: String, default: '', trim: true }
  },
  { _id: false }
);

const uploadedPdfSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true, trim: true },
    filename: { type: String, required: true, trim: true },
    relativePath: { type: String, required: true, trim: true },
    mimeType: { type: String, default: 'application/pdf', trim: true },
    size: { type: Number, default: 0, min: 0 },
    pageCount: { type: Number, default: 0, min: 0 },
    uploadedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const extractionSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['not_started', 'success', 'partial', 'failed'],
      default: 'not_started'
    },
    extractedAt: { type: Date },
    warnings: [{ type: String, trim: true }],
    textPreview: { type: String, default: '', trim: true }
  },
  { _id: false }
);

const proposedCourseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    description: { type: String, default: '', trim: true },
    credits: { type: Number, default: 3 },
    semester: { type: String, default: '8th' },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
    clos: [cloSchema]
  },
  { _id: false }
);

const courseRequestSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['student_enrollment', 'faculty_course'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    requestedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    proposedCourse: proposedCourseSchema,
    proposedPlos: [ploSchema],
    proposedMappings: [mappingItemSchema],
    proposedAssessments: [proposedAssessmentSchema],
    uploadedPdf: uploadedPdfSchema,
    extraction: extractionSchema,
    note: { type: String, default: '', trim: true },
    reviewNote: { type: String, default: '', trim: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date }
  },
  { timestamps: true }
);

courseRequestSchema.index({ type: 1, status: 1 });
courseRequestSchema.index({ 'proposedCourse.code': 1, type: 1 });

module.exports = mongoose.model('CourseRequest', courseRequestSchema);
