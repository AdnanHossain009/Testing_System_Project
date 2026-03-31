const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['quiz', 'assignment', 'mid', 'final'],
      required: true
    },
    cloCodes: [{ type: String, trim: true }],
    totalMarks: { type: Number, required: true, min: 1 },
    weightage: { type: Number, required: true, min: 1, max: 100 },
    dueDate: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Assessment', assessmentSchema);
