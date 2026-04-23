const mongoose = require('mongoose');

const attainmentTargetSchema = new mongoose.Schema(
  {
    academicTerm: { type: String, trim: true, default: '' },
    outcomeType: {
      type: String,
      enum: ['CLO', 'PLO'],
      required: true
    },
    targetAttainment: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    scopeType: {
      type: String,
      enum: ['institution', 'department', 'program', 'course'],
      default: 'institution'
    },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    notes: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

attainmentTargetSchema.pre('validate', function normalizeScope(next) {
  if (this.scopeType === 'institution') {
    this.department = undefined;
    this.program = undefined;
    this.course = undefined;
  }

  if (this.scopeType === 'department') {
    this.program = undefined;
    this.course = undefined;
  }

  if (this.scopeType === 'program') {
    this.course = undefined;
  }

  next();
});

module.exports = mongoose.model('AttainmentTarget', attainmentTargetSchema);
