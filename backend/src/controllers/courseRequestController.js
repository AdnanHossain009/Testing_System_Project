const Course = require('../models/Course');
const CourseRequest = require('../models/CourseRequest');
const Enrollment = require('../models/Enrollment');
const CLOPLOMapping = require('../models/CLOPLOMapping');
const User = require('../models/User');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { logAction } = require('../services/auditService');
const { createNotification } = require('../services/notificationService');

const normalizeClos = (clos = []) =>
  clos
    .map((item) => ({
      code: String(item.code || '').trim().toUpperCase(),
      description: String(item.description || '').trim(),
      bloomLevel: String(item.bloomLevel || 'C3').trim() || 'C3'
    }))
    .filter((item) => item.code && item.description);

const normalizeMappings = (mappings = []) =>
  mappings
    .map((item) => ({
      cloCode: String(item.cloCode || '').trim().toUpperCase(),
      ploCode: String(item.ploCode || '').trim().toUpperCase(),
      weight: Number(item.weight)
    }))
    .filter((item) => item.cloCode && item.ploCode && Number.isFinite(item.weight));

const attachMappingsToRequests = async (requests) => {
  const courseIds = requests.filter((request) => request.course?._id).map((request) => request.course._id);
  if (!courseIds.length) {
    return requests;
  }

  const mappings = await CLOPLOMapping.find({ course: { $in: courseIds } }).lean();
  const mappingByCourse = new Map(mappings.map((item) => [String(item.course), item]));

  return requests.map((request) => {
    if (!request.course?._id) {
      return request;
    }

    return {
      ...request,
      course: {
        ...request.course.toObject(),
        cloPloMapping: mappingByCourse.get(String(request.course._id)) || null
      }
    };
  });
};

const listMyRequests = asyncHandler(async (req, res) => {
  const filter = { requester: req.user._id };
  if (req.query.type) filter.type = req.query.type;

  const requests = await CourseRequest.find(filter)
    .populate({
      path: 'course',
      populate: [
        { path: 'faculty', select: 'name email facultyId' },
        { path: 'department', select: 'name code' },
        { path: 'program', select: 'name code' }
      ]
    })
    .populate('requestedTo', 'name email role')
    .populate('reviewedBy', 'name email role')
    .sort({ createdAt: -1 });

  return success(res, { requests: await attachMappingsToRequests(requests) }, 'Requests fetched.');
});

const listInboxRequests = asyncHandler(async (req, res) => {
  const filter = { status: 'pending' };

  if (req.user.role === 'faculty') {
    filter.type = 'student_enrollment';
    filter.requestedTo = req.user._id;
  } else if (req.user.role === 'head') {
    filter.type = 'faculty_course';
    filter.requestedTo = req.user._id;
  } else {
    filter.requestedTo = req.user._id;
  }

  const requests = await CourseRequest.find(filter)
    .populate('requester', 'name email role studentId facultyId')
    .populate('requestedTo', 'name email role')
    .populate({
      path: 'course',
      populate: [
        { path: 'faculty', select: 'name email facultyId' },
        { path: 'department', select: 'name code' },
        { path: 'program', select: 'name code' }
      ]
    })
    .sort({ createdAt: -1 });

  return success(res, { requests: await attachMappingsToRequests(requests) }, 'Inbox fetched.');
});

const requestStudentEnrollment = asyncHandler(async (req, res) => {
  const { courseId } = req.body;

  if (!courseId) {
    res.status(400);
    throw new Error('Course is required.');
  }

  const course = await Course.findById(courseId).populate('faculty', 'name email role');

  if (!course || !course.active || !course.faculty) {
    res.status(400);
    throw new Error('Course is not available for enrollment.');
  }

  if (req.user.program && String(req.user.program) !== String(course.program)) {
    res.status(403);
    throw new Error('This course is not in your program.');
  }

  const enrolled = await Enrollment.findOne({ student: req.user._id, course: course._id });
  if (enrolled) {
    res.status(400);
    throw new Error('You are already enrolled in this course.');
  }

  const existingRequest = await CourseRequest.findOne({
    type: 'student_enrollment',
    requester: req.user._id,
    course: course._id,
    status: 'pending'
  });

  if (existingRequest) {
    res.status(400);
    throw new Error('Enrollment request already exists for this course.');
  }

  const request = await CourseRequest.create({
    type: 'student_enrollment',
    requester: req.user._id,
    requestedTo: course.faculty._id,
    course: course._id,
    note: ''
  });

  await createNotification({
    user: course.faculty._id,
    title: 'New enrollment request',
    message: `${req.user.name} requested enrollment in ${course.code} - ${course.name}.`,
    type: 'info'
  });

  await logAction({
    actor: req.user._id,
    action: 'REQUEST_COURSE_ENROLLMENT',
    entityType: 'CourseRequest',
    entityId: request._id.toString(),
    metadata: { courseId: course._id.toString(), facultyId: course.faculty._id.toString() }
  });

  return success(res, { request }, 'Enrollment request submitted.', 201);
});

const requestFacultyCourse = asyncHandler(async (req, res) => {
  const {
    name,
    code,
    credits,
    semester,
    department,
    program,
    clos = [],
    mappings = [],
    note = ''
  } = req.body;

  if (!name || !code || !department || !program) {
    res.status(400);
    throw new Error('Course name, code, department and program are required.');
  }

  if (!req.user.department || String(req.user.department) !== String(department)) {
    res.status(403);
    throw new Error('Faculty can only request courses for their own department.');
  }

  const normalizedCode = String(code).trim().toUpperCase();
  const normalizedClos = normalizeClos(clos);
  const normalizedMappings = normalizeMappings(mappings);

  if (!normalizedClos.length) {
    res.status(400);
    throw new Error('At least one CLO is required.');
  }

  if (!normalizedMappings.length) {
    res.status(400);
    throw new Error('At least one CLO-PLO mapping is required.');
  }

  const cloSet = new Set(normalizedClos.map((item) => item.code));
  const invalidMapping = normalizedMappings.find((item) => !cloSet.has(item.cloCode));
  if (invalidMapping) {
    res.status(400);
    throw new Error(`Mapping uses unknown CLO code: ${invalidMapping.cloCode}`);
  }

  const courseExists = await Course.findOne({ code: normalizedCode });
  if (courseExists) {
    res.status(400);
    throw new Error('A course with this code already exists.');
  }

  const duplicateRequest = await CourseRequest.findOne({
    type: 'faculty_course',
    status: 'pending',
    'proposedCourse.code': normalizedCode
  });

  if (duplicateRequest) {
    res.status(400);
    throw new Error('A pending request already exists for this course code.');
  }

  const head = await User.findOne({ role: 'head', department: req.user.department });
  if (!head) {
    res.status(400);
    throw new Error('No department head is assigned for this department.');
  }

  const request = await CourseRequest.create({
    type: 'faculty_course',
    requester: req.user._id,
    requestedTo: head._id,
    proposedCourse: {
      name,
      code: normalizedCode,
      credits: Number(credits || 3),
      semester: semester || '8th',
      department,
      program,
      clos: normalizedClos
    },
    proposedMappings: normalizedMappings,
    note: note || ''
  });

  await createNotification({
    user: head._id,
    title: 'New course request',
    message: `${req.user.name} requested ${normalizedCode} - ${name} for approval.`,
    type: 'info'
  });

  await logAction({
    actor: req.user._id,
    action: 'REQUEST_FACULTY_COURSE',
    entityType: 'CourseRequest',
    entityId: request._id.toString(),
    metadata: { code: normalizedCode, headId: head._id.toString() }
  });

  return success(res, { request }, 'Course request submitted.', 201);
});

const approveRequest = asyncHandler(async (req, res) => {
  const request = await CourseRequest.findById(req.params.id).populate('requester', 'name email role department program');

  if (!request) {
    res.status(404);
    throw new Error('Request not found.');
  }

  if (request.status !== 'pending') {
    res.status(400);
    throw new Error('This request has already been reviewed.');
  }

  if (req.user.role === 'faculty') {
    if (request.type !== 'student_enrollment' || String(request.requestedTo) !== String(req.user._id)) {
      res.status(403);
      throw new Error('You are not allowed to approve this request.');
    }

    const course = await Course.findById(request.course).populate('faculty', 'name email role');
    if (!course) {
      res.status(404);
      throw new Error('Course not found for this request.');
    }

    const existingEnrollment = await Enrollment.findOne({ student: request.requester._id, course: course._id });
    if (!existingEnrollment) {
      await Enrollment.create({
        student: request.requester._id,
        course: course._id,
        request: request._id,
        approvedBy: req.user._id
      });
    }

    request.status = 'approved';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    await createNotification({
      user: request.requester._id,
      title: 'Enrollment approved',
      message: `Your request for ${course.code} - ${course.name} has been approved.`,
      type: 'success'
    });

    await logAction({
      actor: req.user._id,
      action: 'APPROVE_COURSE_ENROLLMENT',
      entityType: 'CourseRequest',
      entityId: request._id.toString(),
      metadata: { courseId: course._id.toString(), studentId: request.requester._id.toString() }
    });

    return success(res, { request }, 'Enrollment approved.');
  }

  if (req.user.role === 'head') {
    if (request.type !== 'faculty_course' || String(request.requestedTo) !== String(req.user._id)) {
      res.status(403);
      throw new Error('You are not allowed to approve this request.');
    }

    const proposedCourse = request.proposedCourse;
    if (!proposedCourse) {
      res.status(400);
      throw new Error('Requested course payload is missing.');
    }

    const existingCourse = await Course.findOne({ code: proposedCourse.code });
    if (existingCourse) {
      res.status(400);
      throw new Error('A course with this code already exists.');
    }

    const course = await Course.create({
      name: proposedCourse.name,
      code: proposedCourse.code,
      credits: proposedCourse.credits,
      semester: proposedCourse.semester,
      department: proposedCourse.department,
      program: proposedCourse.program,
      faculty: request.requester._id,
      clos: proposedCourse.clos,
      active: true
    });

    await CLOPLOMapping.create({
      course: course._id,
      mappings: request.proposedMappings,
      createdBy: request.requester._id
    });

    request.course = course._id;
    request.status = 'approved';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    await createNotification({
      user: request.requester._id,
      title: 'Course request approved',
      message: `${course.code} - ${course.name} has been approved and assigned to you.`,
      type: 'success'
    });

    await logAction({
      actor: req.user._id,
      action: 'APPROVE_FACULTY_COURSE',
      entityType: 'CourseRequest',
      entityId: request._id.toString(),
      metadata: { courseId: course._id.toString(), facultyId: request.requester._id.toString() }
    });

    return success(res, { request, course }, 'Course approved and attached to faculty.', 201);
  }

  res.status(403);
  throw new Error('You are not allowed to approve this request.');
});

const rejectRequest = asyncHandler(async (req, res) => {
  const request = await CourseRequest.findById(req.params.id).populate('requester', 'name email role');

  if (!request) {
    res.status(404);
    throw new Error('Request not found.');
  }

  if (request.status !== 'pending') {
    res.status(400);
    throw new Error('This request has already been reviewed.');
  }

  if (req.user.role === 'faculty') {
    if (request.type !== 'student_enrollment' || String(request.requestedTo) !== String(req.user._id)) {
      res.status(403);
      throw new Error('You are not allowed to reject this request.');
    }
  } else if (req.user.role === 'head') {
    if (request.type !== 'faculty_course' || String(request.requestedTo) !== String(req.user._id)) {
      res.status(403);
      throw new Error('You are not allowed to reject this request.');
    }
  } else {
    res.status(403);
    throw new Error('You are not allowed to reject this request.');
  }

  request.status = 'rejected';
  request.reviewedBy = req.user._id;
  request.reviewedAt = new Date();
  await request.save();

  if (request.type === 'student_enrollment') {
    const course = await Course.findById(request.course);
    await createNotification({
      user: request.requester._id,
      title: 'Enrollment request rejected',
      message: course
        ? `Your request for ${course.code} - ${course.name} was rejected.`
        : 'Your enrollment request was rejected.',
      type: 'warning'
    });
  } else {
    await createNotification({
      user: request.requester._id,
      title: 'Course request rejected',
      message: request.proposedCourse
        ? `${request.proposedCourse.code} - ${request.proposedCourse.name} was rejected.`
        : 'Your course request was rejected.',
      type: 'warning'
    });
  }

  await logAction({
    actor: req.user._id,
    action: 'REJECT_COURSE_REQUEST',
    entityType: 'CourseRequest',
    entityId: request._id.toString(),
    metadata: { type: request.type }
  });

  return success(res, { request }, 'Request rejected.');
});

module.exports = {
  listMyRequests,
  listInboxRequests,
  requestStudentEnrollment,
  requestFacultyCourse,
  approveRequest,
  rejectRequest
};