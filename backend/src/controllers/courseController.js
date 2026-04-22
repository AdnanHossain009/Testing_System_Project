const Course = require('../models/Course');
const CLOPLOMapping = require('../models/CLOPLOMapping');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { logAction } = require('../services/auditService');

const listCourses = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const isAccreditationOfficer = req.user.role === 'accreditation_officer';
  const filter = isAdmin ? {} : { active: true };

  if (!isAdmin && !isAccreditationOfficer) {
    if (req.user.role === 'faculty' && req.query.scope === 'assigned') {
      filter.faculty = req.user._id;
    }

    if (req.user.department) {
      filter.department = req.user.department;
    }

    if (req.user.program) {
      filter.program = req.user.program;
    }

    if (req.user.role === 'student') {
      filter.faculty = { $ne: null };
    }
  }

  if (isAdmin || isAccreditationOfficer) {
    if (req.query.programId) filter.program = req.query.programId;
    if (req.query.departmentId) filter.department = req.query.departmentId;
  } else {
    if (!filter.program && req.query.programId) filter.program = req.query.programId;
    if (!filter.department && req.query.departmentId) filter.department = req.query.departmentId;
  }

  const courses = await Course.find(filter)
    .populate('department', 'name code')
    .populate('program', 'name code plos')
    .populate('faculty', 'name email facultyId');

  const mappings = await CLOPLOMapping.find({ course: { $in: courses.map((course) => course._id) } }).lean();
  const mappingByCourse = new Map(mappings.map((item) => [String(item.course), item]));

  const searchTerm = (req.query.search || req.query.q || '').trim().toLowerCase();
  const filteredCourses = searchTerm
    ? courses.filter((course) => {
        const facultyText = [course.faculty?.name, course.faculty?.email, course.faculty?.facultyId]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return (
          course.name.toLowerCase().includes(searchTerm) ||
          course.code.toLowerCase().includes(searchTerm) ||
          (course.description || '').toLowerCase().includes(searchTerm) ||
          facultyText.includes(searchTerm)
        );
      })
    : courses;

  const enrichedCourses = filteredCourses.map((course) => ({
    ...course.toObject(),
    cloPloMapping: mappingByCourse.get(String(course._id)) || null
  }));

  return success(res, { courses: enrichedCourses }, 'Courses fetched.');
});

const createCourse = asyncHandler(async (req, res) => {
  const { name, code, description, credits, semester, department, program, faculty, clos = [] } = req.body;

  if (!name || !code || !department || !program) {
    res.status(400);
    throw new Error('Course name, code, department and program are required.');
  }

  const course = await Course.create({
    name,
    code,
    description,
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
