const fs = require('fs');
const path = require('path');
const Course = require('../models/Course');
const CourseRequest = require('../models/CourseRequest');
const Enrollment = require('../models/Enrollment');
const CLOPLOMapping = require('../models/CLOPLOMapping');
const Assessment = require('../models/Assessment');
const Program = require('../models/Program');
const User = require('../models/User');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { logAction } = require('../services/auditService');
const { createNotification } = require('../services/notificationService');
const { extractTextFromPdf } = require('../services/pdfExtractionService');
const { parseCoursePdfText } = require('../services/coursePdfParserService');
const { courseRequestUploadRoot } = require('../middleware/uploadMiddleware');

const COURSE_REQUEST_TEXT_PREVIEW_LIMIT = 4000;
const VALID_ASSESSMENT_TYPES = new Set(['quiz', 'assignment', 'mid', 'final']);

const normalizeText = (value = '') => String(value || '').trim();

const normalizeCode = (prefix, value = '') => {
  const numericPortion = String(value || '').match(/\d+/)?.[0] || '';
  return numericPortion ? `${prefix}${numericPortion}` : '';
};

const buildCourseRequestQuery = (filter) =>
  CourseRequest.find(filter)
    .populate('requester', 'name email role studentId facultyId')
    .populate('requestedTo', 'name email role')
    .populate('reviewedBy', 'name email role')
    .populate({
      path: 'course',
      populate: [
        { path: 'faculty', select: 'name email facultyId' },
        { path: 'department', select: 'name code' },
        { path: 'program', select: 'name code plos' }
      ]
    })
    .populate('proposedCourse.department', 'name code')
    .populate('proposedCourse.program', 'name code plos');

const normalizeClos = (clos = []) =>
  (Array.isArray(clos) ? clos : [])
    .map((item) => ({
      code: normalizeCode('CLO', item?.code),
      description: normalizeText(item?.description),
      bloomLevel: normalizeText(item?.bloomLevel) || 'C3'
    }))
    .filter((item) => item.code && item.description);

const normalizePlos = (plos = []) =>
  (Array.isArray(plos) ? plos : [])
    .map((item) => ({
      code: normalizeCode('PLO', item?.code),
      description: normalizeText(item?.description)
    }))
    .filter((item) => item.code && item.description);

const normalizeMappings = (mappings = []) =>
  (Array.isArray(mappings) ? mappings : [])
    .map((item) => ({
      cloCode: normalizeCode('CLO', item?.cloCode),
      ploCode: normalizeCode('PLO', item?.ploCode),
      weight: Number(item?.weight)
    }))
    .filter(
      (item) =>
        item.cloCode &&
        item.ploCode &&
        Number.isFinite(item.weight) &&
        item.weight >= 0 &&
        item.weight <= 1
    );

const normalizeCloDistribution = (distribution = []) =>
  (Array.isArray(distribution) ? distribution : [])
    .map((item) => ({
      cloCode: normalizeCode('CLO', item?.cloCode),
      marks: Number(item?.marks)
    }))
    .filter((item) => item.cloCode && Number.isFinite(item.marks) && item.marks >= 0);

const hasAssessmentInput = (item = {}) =>
  Boolean(
    normalizeText(item?.title) ||
      normalizeText(item?.type) ||
      normalizeText(item?.note) ||
      Number(item?.totalMarks) ||
      Number(item?.weightage) ||
      (Array.isArray(item?.cloCodes) && item.cloCodes.length) ||
      (Array.isArray(item?.cloDistribution) && item.cloDistribution.length)
  );

const normalizeAssessments = (assessments = []) =>
  (Array.isArray(assessments) ? assessments : []).reduce((accumulator, item) => {
    if (!hasAssessmentInput(item)) {
      return accumulator;
    }

    const type = normalizeText(item?.type).toLowerCase();
    const title = normalizeText(item?.title) || (type ? type.charAt(0).toUpperCase() + type.slice(1) : '');
    const cloCodes = Array.from(
      new Set((Array.isArray(item?.cloCodes) ? item.cloCodes : []).map((code) => normalizeCode('CLO', code)).filter(Boolean))
    );
    const cloDistribution = normalizeCloDistribution(item?.cloDistribution);
    const totalMarks = Number(item?.totalMarks);
    const weightage = Number(item?.weightage);

    accumulator.push({
      title,
      type,
      cloCodes: cloCodes.length
        ? cloCodes
        : Array.from(new Set(cloDistribution.map((entry) => entry.cloCode))).filter(Boolean),
      cloDistribution,
      totalMarks,
      weightage,
      note: normalizeText(item?.note)
    });

    return accumulator;
  }, []);

const normalizeUploadedPdfPayload = (uploadedPdf) => {
  if (!uploadedPdf?.filename) {
    return null;
  }

  const filename = path.basename(normalizeText(uploadedPdf.filename));
  const absolutePath = path.join(courseRequestUploadRoot, filename);

  if (!fs.existsSync(absolutePath)) {
    return null;
  }

  return {
    originalName: normalizeText(uploadedPdf.originalName) || filename,
    filename,
    relativePath: `course-requests/${filename}`.replace(/\\/g, '/'),
    mimeType: normalizeText(uploadedPdf.mimeType) || 'application/pdf',
    size: Number(uploadedPdf.size) || 0,
    pageCount: Number(uploadedPdf.pageCount) || 0,
    uploadedAt: uploadedPdf.uploadedAt ? new Date(uploadedPdf.uploadedAt) : new Date()
  };
};

const normalizeExtractionPayload = (extraction, uploadedPdf) => {
  if (!uploadedPdf && !extraction) {
    return {
      status: 'not_started',
      warnings: [],
      textPreview: ''
    };
  }

  const allowedStatuses = new Set(['not_started', 'success', 'partial', 'failed']);
  const requestedStatus = normalizeText(extraction?.status);
  const warnings = (Array.isArray(extraction?.warnings) ? extraction.warnings : [])
    .map((item) => normalizeText(item))
    .filter(Boolean);

  return {
    status: allowedStatuses.has(requestedStatus) ? requestedStatus : uploadedPdf ? 'partial' : 'not_started',
    extractedAt: extraction?.extractedAt ? new Date(extraction.extractedAt) : uploadedPdf ? new Date() : undefined,
    warnings,
    textPreview: normalizeText(extraction?.textPreview).slice(0, COURSE_REQUEST_TEXT_PREVIEW_LIMIT)
  };
};

const buildUploadedPdfPayloadFromFile = (file, pageCount = 0) => ({
  originalName: file.originalname,
  filename: file.filename,
  relativePath: `course-requests/${file.filename}`.replace(/\\/g, '/'),
  mimeType: file.mimetype || 'application/pdf',
  size: file.size || 0,
  pageCount,
  uploadedAt: new Date()
});

const determineExtractionStatus = ({ clos = [], plos = [], mappings = [], assessments = [], warnings = [] }) => {
  const detectedSectionCount = [clos.length, plos.length, mappings.length, assessments.length].filter(Boolean).length;

  if (!detectedSectionCount) {
    return 'failed';
  }

  return warnings.length ? 'partial' : 'success';
};

const attachMappingsToRequests = async (requests) => {
  const courseIds = requests.filter((request) => request.course?._id).map((request) => request.course._id);
  if (!courseIds.length) {
    return requests;
  }

  const mappings = await CLOPLOMapping.find({ course: { $in: courseIds } }).lean();
  const mappingByCourse = new Map(mappings.map((item) => [String(item.course), item]));

  return requests.map((request) => {
    if (!request.course?._id) {
      return typeof request.toObject === 'function' ? request.toObject() : request;
    }

    const requestObject = typeof request.toObject === 'function' ? request.toObject() : request;
    const courseObject = typeof request.course.toObject === 'function' ? request.course.toObject() : request.course;

    return {
      ...requestObject,
      course: {
        ...courseObject,
        cloPloMapping: mappingByCourse.get(String(request.course._id)) || null
      }
    };
  });
};

const validateFacultyCourseSubmission = async ({
  requester,
  name,
  code,
  department,
  program,
  normalizedClos,
  normalizedPlos,
  normalizedMappings,
  normalizedAssessments
}) => {
  if (!name || !code || !department || !program) {
    return 'Course title, code, department and program are required.';
  }

  if (!requester.department || String(requester.department) !== String(department)) {
    return 'Faculty can only request courses for their own department.';
  }

  if (!normalizedClos.length) {
    return 'At least one CLO is required before submitting the request.';
  }

  const programDoc = await Program.findById(program);
  if (!programDoc) {
    return 'Selected program was not found.';
  }

  if (String(programDoc.department) !== String(department)) {
    return 'Selected program does not belong to the selected department.';
  }

  const knownCloCodes = new Set(normalizedClos.map((item) => item.code));
  const knownPloCodes = new Set([
    ...programDoc.plos.map((item) => normalizeCode('PLO', item.code)),
    ...normalizedPlos.map((item) => item.code)
  ]);

  const invalidMapping = normalizedMappings.find(
    (item) => !knownCloCodes.has(item.cloCode) || (knownPloCodes.size && !knownPloCodes.has(item.ploCode))
  );

  if (invalidMapping) {
    if (!knownCloCodes.has(invalidMapping.cloCode)) {
      return `Mapping uses unknown CLO code: ${invalidMapping.cloCode}`;
    }

    return `Mapping uses unknown PLO code: ${invalidMapping.ploCode}`;
  }

  const invalidAssessment = normalizedAssessments.find((item) => {
    if (!item.title || !VALID_ASSESSMENT_TYPES.has(item.type)) {
      return true;
    }

    if (!Number.isFinite(item.totalMarks) || item.totalMarks <= 0) {
      return true;
    }

    if (!Number.isFinite(item.weightage) || item.weightage <= 0 || item.weightage > 100) {
      return true;
    }

    return item.cloCodes.some((cloCode) => !knownCloCodes.has(cloCode));
  });

  if (invalidAssessment) {
    if (!invalidAssessment.title || !VALID_ASSESSMENT_TYPES.has(invalidAssessment.type)) {
      return 'Each assessment row must include a valid title and type.';
    }

    if (!Number.isFinite(invalidAssessment.totalMarks) || invalidAssessment.totalMarks <= 0) {
      return `Assessment "${invalidAssessment.title || invalidAssessment.type}" must include total marks.`;
    }

    if (
      !Number.isFinite(invalidAssessment.weightage) ||
      invalidAssessment.weightage <= 0 ||
      invalidAssessment.weightage > 100
    ) {
      return `Assessment "${invalidAssessment.title || invalidAssessment.type}" must include weightage between 1 and 100.`;
    }

    return `Assessment "${invalidAssessment.title || invalidAssessment.type}" uses an unknown CLO code.`;
  }

  return null;
};

const mergeProgramPlos = async (programId, proposedPlos = []) => {
  const program = await Program.findById(programId);
  if (!program) {
    throw new Error('Program not found for this course request.');
  }

  const existingPloMap = new Map(program.plos.map((item) => [normalizeCode('PLO', item.code), item]));
  let changed = false;

  proposedPlos.forEach((item) => {
    const existing = existingPloMap.get(item.code);

    if (!existing) {
      program.plos.push({
        code: item.code,
        description: item.description
      });
      changed = true;
      return;
    }

    if (!normalizeText(existing.description) && item.description) {
      existing.description = item.description;
      changed = true;
    }
  });

  if (changed) {
    await program.save();
  }

  return program;
};

const listMyRequests = asyncHandler(async (req, res) => {
  const filter = { requester: req.user._id };
  if (req.query.type) filter.type = req.query.type;

  const requests = await buildCourseRequestQuery(filter).sort({ createdAt: -1 });

  return success(res, { requests: await attachMappingsToRequests(requests) }, 'Requests fetched.');
});

const listInboxRequests = asyncHandler(async (req, res) => {
  const filter = {
    requestedTo: req.user._id,
    status: req.query.status || 'pending'
  };

  if (req.user.role === 'faculty') {
    filter.type = 'student_enrollment';
  } else if (req.user.role === 'head') {
    filter.type = 'faculty_course';
  }

  const requests = await buildCourseRequestQuery(filter).sort({ createdAt: -1 });

  return success(res, { requests: await attachMappingsToRequests(requests) }, 'Inbox fetched.');
});

const getRequestDetails = asyncHandler(async (req, res) => {
  const requests = await buildCourseRequestQuery({ _id: req.params.id }).limit(1);
  const request = requests[0];

  if (!request) {
    res.status(404);
    throw new Error('Request not found.');
  }

  const canAccess =
    req.user.role === 'admin' ||
    String(request.requester?._id || request.requester) === String(req.user._id) ||
    String(request.requestedTo?._id || request.requestedTo) === String(req.user._id);

  if (!canAccess) {
    res.status(403);
    throw new Error('You are not allowed to view this request.');
  }

  const [enrichedRequest] = await attachMappingsToRequests([request]);
  return success(res, { request: enrichedRequest }, 'Request details fetched.');
});

const extractFacultyCoursePdf = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('A PDF file is required.');
  }

  const uploadedPdf = buildUploadedPdfPayloadFromFile(req.file);

  try {
    const { text, pageCount } = await extractTextFromPdf(req.file.path);
    const parsed = parseCoursePdfText(text);
    const extraction = {
      status: determineExtractionStatus(parsed),
      extractedAt: new Date(),
      warnings: parsed.warnings,
      textPreview: parsed.textPreview.slice(0, COURSE_REQUEST_TEXT_PREVIEW_LIMIT)
    };

    return success(
      res,
      {
        uploadedPdf: {
          ...uploadedPdf,
          pageCount
        },
        extractedData: {
          clos: parsed.clos,
          plos: parsed.plos,
          mappings: parsed.mappings,
          assessments: parsed.assessments
        },
        extraction
      },
      extraction.status === 'failed'
        ? 'Automatic extraction failed. Please enter data manually.'
        : 'PDF extracted successfully.'
    );
  } catch (error) {
    return success(
      res,
      {
        uploadedPdf,
        extractedData: {
          clos: [],
          plos: [],
          mappings: [],
          assessments: []
        },
        extraction: {
          status: 'failed',
          extractedAt: new Date(),
          warnings: ['Automatic extraction failed. Please enter data manually.'],
          textPreview: ''
        }
      },
      'Automatic extraction failed. Please enter data manually.'
    );
  }
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
    description,
    credits,
    semester,
    department,
    program,
    clos = [],
    plos = [],
    mappings = [],
    assessments = [],
    uploadedPdf,
    extraction,
    note = ''
  } = req.body;

  const normalizedCode = normalizeText(code).toUpperCase();
  const normalizedClos = normalizeClos(clos);
  const normalizedPlos = normalizePlos(plos);
  const normalizedMappings = normalizeMappings(mappings);
  const normalizedAssessments = normalizeAssessments(assessments);
  const normalizedUploadedPdf = normalizeUploadedPdfPayload(uploadedPdf);
  const normalizedExtraction = normalizeExtractionPayload(extraction, normalizedUploadedPdf);

  if (uploadedPdf && !normalizedUploadedPdf) {
    res.status(400);
    throw new Error('Uploaded PDF could not be found. Please upload the file again.');
  }

  const validationError = await validateFacultyCourseSubmission({
    requester: req.user,
    name: normalizeText(name),
    code: normalizedCode,
    department,
    program,
    normalizedClos,
    normalizedPlos,
    normalizedMappings,
    normalizedAssessments
  });

  if (validationError) {
    res.status(400);
    throw new Error(validationError);
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
      name: normalizeText(name),
      code: normalizedCode,
      description: normalizeText(description),
      credits: Number(credits || 3),
      semester: normalizeText(semester) || '8th',
      department,
      program,
      clos: normalizedClos
    },
    proposedPlos: normalizedPlos,
    proposedMappings: normalizedMappings,
    proposedAssessments: normalizedAssessments,
    uploadedPdf: normalizedUploadedPdf || undefined,
    extraction: normalizedExtraction,
    note: normalizeText(note)
  });

  await createNotification({
    user: head._id,
    title: 'New course request',
    message: `${req.user.name} requested ${normalizedCode} - ${normalizeText(name)} for approval.`,
    type: 'info'
  });

  await logAction({
    actor: req.user._id,
    action: 'REQUEST_FACULTY_COURSE',
    entityType: 'CourseRequest',
    entityId: request._id.toString(),
    metadata: {
      code: normalizedCode,
      headId: head._id.toString(),
      clos: normalizedClos.length,
      plos: normalizedPlos.length,
      mappings: normalizedMappings.length,
      assessments: normalizedAssessments.length,
      extractionStatus: normalizedExtraction.status
    }
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
    request.reviewNote = normalizeText(req.body?.reviewNote);
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

  if (req.user.role !== 'head' || request.type !== 'faculty_course' || String(request.requestedTo) !== String(req.user._id)) {
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

  await mergeProgramPlos(proposedCourse.program, request.proposedPlos || []);

  const course = await Course.create({
    name: proposedCourse.name,
    code: proposedCourse.code,
    description: proposedCourse.description || '',
    credits: proposedCourse.credits,
    semester: proposedCourse.semester,
    department: proposedCourse.department,
    program: proposedCourse.program,
    faculty: request.requester._id,
    clos: request.proposedCourse.clos || [],
    active: true
  });

  await CLOPLOMapping.create({
    course: course._id,
    mappings: request.proposedMappings || [],
    createdBy: request.requester._id
  });

  if (request.proposedAssessments?.length) {
    await Assessment.insertMany(
      request.proposedAssessments.map((item) => ({
        course: course._id,
        title: item.title,
        type: item.type,
        cloCodes: item.cloCodes,
        cloDistribution: item.cloDistribution,
        rubricCriteria: [],
        totalMarks: item.totalMarks,
        weightage: item.weightage,
        createdBy: request.requester._id,
        dueDate: undefined
      }))
    );
  }

  request.course = course._id;
  request.status = 'approved';
  request.reviewedBy = req.user._id;
  request.reviewedAt = new Date();
  request.reviewNote = normalizeText(req.body?.reviewNote);
  await request.save();

  await createNotification({
    user: request.requester._id,
    title: 'Course request approved',
    message: `${course.code} - ${course.name} has been approved and is now active in the system.`,
    type: 'success'
  });

  await logAction({
    actor: req.user._id,
    action: 'APPROVE_FACULTY_COURSE',
    entityType: 'CourseRequest',
    entityId: request._id.toString(),
    metadata: {
      courseId: course._id.toString(),
      facultyId: request.requester._id.toString(),
      mappingCount: request.proposedMappings?.length || 0,
      assessmentCount: request.proposedAssessments?.length || 0
    }
  });

  return success(res, { request, course }, 'Course approved and promoted into the official course records.', 201);
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
  request.reviewNote = normalizeText(req.body?.reviewNote);
  await request.save();

  if (request.type === 'student_enrollment') {
    const course = await Course.findById(request.course);
    await createNotification({
      user: request.requester._id,
      title: 'Enrollment request rejected',
      message: course
        ? `Your request for ${course.code} - ${course.name} was rejected.${request.reviewNote ? ` Reason: ${request.reviewNote}` : ''}`
        : `Your enrollment request was rejected.${request.reviewNote ? ` Reason: ${request.reviewNote}` : ''}`,
      type: 'warning'
    });
  } else {
    await createNotification({
      user: request.requester._id,
      title: 'Course request rejected',
      message: request.proposedCourse
        ? `${request.proposedCourse.code} - ${request.proposedCourse.name} was rejected.${request.reviewNote ? ` Reason: ${request.reviewNote}` : ''}`
        : `Your course request was rejected.${request.reviewNote ? ` Reason: ${request.reviewNote}` : ''}`,
      type: 'warning'
    });
  }

  await logAction({
    actor: req.user._id,
    action: 'REJECT_COURSE_REQUEST',
    entityType: 'CourseRequest',
    entityId: request._id.toString(),
    metadata: { type: request.type, reviewNote: request.reviewNote }
  });

  return success(res, { request }, 'Request rejected.');
});

module.exports = {
  listMyRequests,
  listInboxRequests,
  getRequestDetails,
  extractFacultyCoursePdf,
  requestStudentEnrollment,
  requestFacultyCourse,
  approveRequest,
  rejectRequest
};
