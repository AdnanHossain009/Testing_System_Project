const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide a student'],
    },
    assessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment',
      required: [true, 'Please provide an assessment'],
    },
    obtainedMarks: {
      type: Number,
      required: [true, 'Please provide obtained marks'],
      min: 0,
    },
    remarks: {
      type: String,
      trim: true,
    },
    isAbsent: {
      type: Boolean,
      default: false,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
marksSchema.index({ student: 1, assessment: 1 }, { unique: true });
marksSchema.index({ assessment: 1 });
marksSchema.index({ student: 1 });

// Validate obtained marks don't exceed total marks
marksSchema.pre('save', async function (next) {
  try {
    const Assessment = mongoose.model('Assessment');
    const assessment = await Assessment.findById(this.assessment);
    
    if (!assessment) {
      return next(new Error('Assessment not found'));
    }
    
    if (this.obtainedMarks > assessment.totalMarks) {
      return next(new Error('Obtained marks cannot exceed total marks'));
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Marks', marksSchema);
