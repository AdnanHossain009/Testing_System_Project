const mongoose = require('mongoose');

const cloSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  mappedPLO: {
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

const courseSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Please provide a course code'],
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a course name'],
      trim: true,
    },
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program',
      required: [true, 'Please provide a program'],
    },
    creditHours: {
      type: Number,
      required: [true, 'Please provide credit hours'],
      min: 0,
      max: 6,
    },
    semester: {
      type: String,
      required: true,
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    clos: [cloSchema],
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
courseSchema.index({ code: 1 }, { unique: true });
courseSchema.index({ program: 1 });
courseSchema.index({ faculty: 1 });
courseSchema.index({ isActive: 1 });

module.exports = mongoose.model('Course', courseSchema);
