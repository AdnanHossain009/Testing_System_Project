const mongoose = require('mongoose');

const cloSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    bloomLevel: { type: String, default: 'C3' }
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

const proposedCourseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
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
    proposedMappings: [mappingItemSchema],
    note: { type: String, default: '', trim: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date }
  },
  { timestamps: true }
);

courseRequestSchema.index({ type: 1, status: 1 });

module.exports = mongoose.model('CourseRequest', courseRequestSchema);