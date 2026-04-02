const CLOPLOMapping = require('../models/CLOPLOMapping');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { logAction } = require('../services/auditService');

const getMappingByCourse = asyncHandler(async (req, res) => {
  const mapping = await CLOPLOMapping.findOne({ course: req.params.courseId }).populate('course', 'name code');
  return success(res, { mapping }, 'Mapping fetched.');
});

const upsertMapping = asyncHandler(async (req, res) => {
  const { mappings = [] } = req.body;

  const normalized = mappings.map((item) => ({
    cloCode: item.cloCode,
    ploCode: item.ploCode,
    weight: Number(item.weight || 0)
  }));

  const mapping = await CLOPLOMapping.findOneAndUpdate(
    { course: req.params.courseId },
    {
      course: req.params.courseId,
      mappings: normalized,
      createdBy: req.user._id
    },
    { new: true, upsert: true }
  );

  await logAction({
    actor: req.user._id,
    action: 'UPSERT_CLO_PLO_MAPPING',
    entityType: 'CLOPLOMapping',
    entityId: mapping._id.toString(),
    metadata: { mappingCount: normalized.length }
  });

  return success(res, { mapping }, 'Mapping saved.');
});

module.exports = { getMappingByCourse, upsertMapping };
