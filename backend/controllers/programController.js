const Program = require('../models/Program');
const { sendSuccess, sendError, parsePaginationParams, getPagination } = require('../utils/responseUtils');
const { MESSAGES } = require('../config/constants');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Get all programs
 * @route   GET /api/programs
 * @access  Private
 */
const getAllPrograms = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePaginationParams(req.query);
  const { isActive } = req.query;

  const filter = {};
  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }

  const total = await Program.countDocuments(filter);
  const programs = await Program.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const pagination = getPagination(page, limit, total);

  sendSuccess(res, 200, MESSAGES.SUCCESS.FETCHED, {
    programs,
    pagination,
  });
});

/**
 * @desc    Get single program
 * @route   GET /api/programs/:id
 * @access  Private
 */
const getProgramById = asyncHandler(async (req, res) => {
  const program = await Program.findById(req.params.id);

  if (!program) {
    return sendError(res, 404, MESSAGES.ERROR.NOT_FOUND);
  }

  sendSuccess(res, 200, MESSAGES.SUCCESS.FETCHED, program);
});

/**
 * @desc    Create new program
 * @route   POST /api/programs
 * @access  Private (Admin only)
 */
const createProgram = asyncHandler(async (req, res) => {
  const program = await Program.create(req.body);
  sendSuccess(res, 201, MESSAGES.SUCCESS.CREATED, program);
});

/**
 * @desc    Update program
 * @route   PUT /api/programs/:id
 * @access  Private (Admin only)
 */
const updateProgram = asyncHandler(async (req, res) => {
  let program = await Program.findById(req.params.id);

  if (!program) {
    return sendError(res, 404, MESSAGES.ERROR.NOT_FOUND);
  }

  program = await Program.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  sendSuccess(res, 200, MESSAGES.SUCCESS.UPDATED, program);
});

/**
 * @desc    Delete program
 * @route   DELETE /api/programs/:id
 * @access  Private (Admin only)
 */
const deleteProgram = asyncHandler(async (req, res) => {
  const program = await Program.findById(req.params.id);

  if (!program) {
    return sendError(res, 404, MESSAGES.ERROR.NOT_FOUND);
  }

  await program.deleteOne();
  sendSuccess(res, 200, MESSAGES.SUCCESS.DELETED);
});

/**
 * @desc    Add PLO to program
 * @route   POST /api/programs/:id/plos
 * @access  Private (Admin only)
 */
const addPLO = asyncHandler(async (req, res) => {
  const program = await Program.findById(req.params.id);

  if (!program) {
    return sendError(res, 404, MESSAGES.ERROR.NOT_FOUND);
  }

  program.plos.push(req.body);
  await program.save();

  sendSuccess(res, 201, 'PLO added successfully', program);
});

/**
 * @desc    Update PLO
 * @route   PUT /api/programs/:id/plos/:ploId
 * @access  Private (Admin only)
 */
const updatePLO = asyncHandler(async (req, res) => {
  const program = await Program.findById(req.params.id);

  if (!program) {
    return sendError(res, 404, MESSAGES.ERROR.NOT_FOUND);
  }

  const plo = program.plos.id(req.params.ploId);
  if (!plo) {
    return sendError(res, 404, 'PLO not found');
  }

  Object.assign(plo, req.body);
  await program.save();

  sendSuccess(res, 200, 'PLO updated successfully', program);
});

/**
 * @desc    Delete PLO
 * @route   DELETE /api/programs/:id/plos/:ploId
 * @access  Private (Admin only)
 */
const deletePLO = asyncHandler(async (req, res) => {
  const program = await Program.findById(req.params.id);

  if (!program) {
    return sendError(res, 404, MESSAGES.ERROR.NOT_FOUND);
  }

  program.plos.pull(req.params.ploId);
  await program.save();

  sendSuccess(res, 200, 'PLO deleted successfully', program);
});

module.exports = {
  getAllPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
  addPLO,
  updatePLO,
  deletePLO,
};
