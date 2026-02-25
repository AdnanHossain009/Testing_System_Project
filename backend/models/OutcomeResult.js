const mongoose = require('mongoose');
const { PERFORMANCE_LEVELS } = require('../config/constants');

const cloAchievementSchema = new mongoose.Schema({
  clo: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  cloCode: {
    type: String,
    required: true,
  },
  achievement: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  isAttained: {
    type: Boolean,
    default: false,
  },
});

const ploAchievementSchema = new mongoose.Schema({
  plo: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  ploCode: {
    type: String,
    required: true,
  },
  achievement: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  isAttained: {
    type: Boolean,
    default: false,
  },
});

const outcomeResultSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide a student'],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Please provide a course'],
    },
    semester: {
      type: String,
      required: true,
    },
    cloAchievements: [cloAchievementSchema],
    ploAchievements: [ploAchievementSchema],
    overallPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    grade: {
      type: String,
    },
    gpa: {
      type: Number,
      min: 0,
      max: 4.0,
    },
    performanceLevel: {
      type: String,
      enum: Object.values(PERFORMANCE_LEVELS),
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    isAtRisk: {
      type: Boolean,
      default: false,
    },
    recommendations: [String],
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
outcomeResultSchema.index({ student: 1, course: 1 }, { unique: true });
outcomeResultSchema.index({ course: 1 });
outcomeResultSchema.index({ student: 1 });
outcomeResultSchema.index({ performanceLevel: 1 });
outcomeResultSchema.index({ isAtRisk: 1 });

module.exports = mongoose.model('OutcomeResult', outcomeResultSchema);
