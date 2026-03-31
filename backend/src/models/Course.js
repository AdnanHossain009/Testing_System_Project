const mongoose = require('mongoose');

const cloSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    bloomLevel: { type: String, default: 'C3' }
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    credits: { type: Number, default: 3 },
    semester: { type: String, default: '8th' },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    clos: [cloSchema],
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Course', courseSchema);
