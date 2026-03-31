const mongoose = require('mongoose');

const fuzzyRuleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    antecedent: {
      quiz: { type: String, enum: ['low', 'medium', 'high'] },
      assignment: { type: String, enum: ['low', 'medium', 'high'] },
      mid: { type: String, enum: ['low', 'medium', 'high'] },
      final: { type: String, enum: ['low', 'medium', 'high'] }
    },
    consequent: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true
    },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('FuzzyRule', fuzzyRuleSchema);
