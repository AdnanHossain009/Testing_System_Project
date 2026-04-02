const Course = require('../models/Course');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { logAction } = require('../services/auditService');

const listCourses = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.programId) filter.program = req.query.programId;
  if (req.query.departmentId) filter.department = req.query.departmentId;

  if (req.user.role === 'faculty') {
    filter.faculty = req.user._id;
  }
  if (req.user.role === 'student' && req.user.program) {
    filter.program = req.user.program;
  }

  const courses = await Course.find(filter)
    .populate('department', 'name code')
    .populate('program', 'name code')
    .populate('faculty', 'name email facultyId');

  return success(res, { courses }, 'Courses fetched.');
});

const createCourse = asyncHandler(async (req, res) => {
  const { name, code, credits, semester, department, program, faculty, clos = [] } = req.body;

  if (!name || !code || !department || !program) {
    res.status(400);
    throw new Error('Course name, code, department and program are required.');
  }

  const course = await Course.create({
    name,
    code,
    credits,
    semester,
    department,
    program,
    faculty,
    clos
  });

  await logAction({
    actor: req.user._id,
    action: 'CREATE_COURSE',
    entityType: 'Course',
    entityId: course._id.toString()
  });

  return success(res, { course }, 'Course created.', 201);
});

const addClos = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    res.status(404);
    throw new Error('Course not found.');
  }

  const { clos = [] } = req.body;
  course.clos = clos.map((item) => ({
    code: item.code,
    description: item.description,
    bloomLevel: item.bloomLevel || 'C3'
  }));

  await course.save();

  await logAction({
    actor: req.user._id,
    action: 'UPDATE_CLOS',
    entityType: 'Course',
    entityId: course._id.toString(),
    metadata: { cloCount: course.clos.length }
  });

  return success(res, { course }, 'CLOs updated.');
});

module.exports = { listCourses, createCourse, addClos };
