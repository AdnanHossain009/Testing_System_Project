const mongoose = require('mongoose');
const { ASSESSMENT_TYPES } = require('../config/constants');

const cloMappingSchema = new mongoose.Schema({
  clo: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  weight: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
});

const assessmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide assessment title'],
      trim: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Please provide a course'],
    },
    type: {
      type: String,
      enum: Object.values(ASSESSMENT_TYPES),
      required: [true, 'Please provide assessment type'],
    },
    totalMarks: {
      type: Number,
      required: [true, 'Please provide total marks'],
      min: 0,
    },
    weightage: {
      type: Number,
      required: [true, 'Please provide weightage'],
      min: 0,
      max: 100,
    },
    cloMapping: [cloMappingSchema],
    date: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
      trim: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
assessmentSchema.index({ course: 1 });
assessmentSchema.index({ type: 1 });
assessmentSchema.index({ date: -1 });

// Validate that total CLO weights equal 100
assessmentSchema.pre('save', function (next) {
  if (this.cloMapping && this.cloMapping.length > 0) {
    const totalWeight = this.cloMapping.reduce((sum, mapping) => sum + mapping.weight, 0);
    if (totalWeight !== 100) {
      return next(new Error('Total CLO mapping weights must equal 100'));
    }
  }
  next();
});

module.exports = mongoose.model('Assessment', assessmentSchema);
