const Enrollment = require('../models/Enrollment');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const listMyEnrollments = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ student: req.user._id })
    .populate({
      path: 'course',
      populate: [
        { path: 'faculty', select: 'name email facultyId' },
        { path: 'department', select: 'name code' },
        { path: 'program', select: 'name code' }
      ]
    })
    .populate('approvedBy', 'name email role')
    .sort({ enrolledAt: -1 });

  return success(res, { enrollments }, 'Enrollments fetched.');
});

module.exports = { listMyEnrollments };