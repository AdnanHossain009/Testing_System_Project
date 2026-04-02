const mongoose = require('mongoose');

const ploSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const programSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    plos: [ploSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Program', programSchema);
