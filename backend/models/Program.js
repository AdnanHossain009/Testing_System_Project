const mongoose = require('mongoose');
const { PLO_DOMAINS } = require('../config/constants');

const ploSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  domain: {
    type: String,
    enum: Object.values(PLO_DOMAINS),
    required: true,
  },
});

const programSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Please provide a program code'],
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a program name'],
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, 'Please provide program duration'],
      min: 1,
      max: 10,
    },
    description: {
      type: String,
      trim: true,
    },
    plos: [ploSchema],
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
programSchema.index({ code: 1 }, { unique: true });
programSchema.index({ isActive: 1 });

module.exports = mongoose.model('Program', programSchema);
