const mongoose = require('mongoose');

const mappingItemSchema = new mongoose.Schema(
  {
    cloCode: { type: String, required: true, trim: true },
    ploCode: { type: String, required: true, trim: true },
    weight: { type: Number, required: true, min: 0, max: 1 }
  },
  { _id: false }
);

const mappingSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, unique: true },
    mappings: [mappingItemSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('CLOPLOMapping', mappingSchema);
