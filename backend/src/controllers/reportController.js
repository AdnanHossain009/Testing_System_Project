const PDFDocument = require('pdfkit');
const Result = require('../models/Result');
const Course = require('../models/Course');
const Assessment = require('../models/Assessment');
const CLOPLOMapping = require('../models/CLOPLOMapping');
const { buildCourseAnalytics } = require('../services/analyticsService');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');

const studentPdfReport = asyncHandler(async (req, res) => {
  if (req.user.role === 'student' && String(req.user._id) !== String(req.params.studentId)) {
    res.status(403);
    throw new Error('Students can only download their own reports.');
  }

  const result = await Result.findOne({
    student: req.params.studentId,
    course: req.params.courseId
  })
    .populate('student', 'name email studentId')
    .populate('course', 'name code credits semester');

  if (!result) {
    res.status(404);
    throw new Error('Result not found.');
  }

  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=student-report-${result.student.studentId || result.student._id}.pdf`
  );

  doc.pipe(res);

  doc.fontSize(18).text('Student Learning Assessment Report', { underline: true });
  doc.moveDown();

  doc.fontSize(12).text(`Student: ${result.student.name}`);
  doc.text(`Student ID: ${result.student.studentId || 'N/A'}`);
  doc.text(`Email: ${result.student.email}`);
  doc.text(`Course: ${result.course.code} - ${result.course.name}`);
  doc.text(`Semester: ${result.course.semester}`);
  doc.moveDown();

  doc.fontSize(14).text('Marks');
  doc.fontSize(12).text(`Raw Quiz: ${result.rawMarks?.quiz ?? result.marks.quiz}`);
  doc.text(`Raw Assignment: ${result.rawMarks?.assignment ?? result.marks.assignment}`);
  doc.text(`Raw Mid: ${result.rawMarks?.mid ?? result.marks.mid}`);
  doc.text(`Raw Final: ${result.rawMarks?.final ?? result.marks.final}`);
  doc.text(`Normalized Quiz %: ${result.marks.quiz}`);
  doc.text(`Normalized Assignment %: ${result.marks.assignment}`);
  doc.text(`Normalized Mid %: ${result.marks.mid}`);
  doc.text(`Normalized Final %: ${result.marks.final}`);
  doc.moveDown();

  doc.fontSize(14).text('Intelligent Evaluation');
  doc.fontSize(12).text(`Weighted Average: ${result.weightedAverage}`);
  doc.text(`Fuzzy Score: ${result.fuzzyScore}`);
  doc.text(`Attainment Level: ${result.attainmentLevel}`);
  doc.text(`Risk Score: ${result.riskScore}`);
  doc.text(`Risk Band: ${result.riskBand}`);
  doc.moveDown();

  doc.fontSize(14).text('CLO Attainment');
  (result.cloAttainment || []).forEach((item) => {
    doc.fontSize(12).text(
      `${item.code}: ${item.score} (${item.attained ? 'Attained' : 'Not Attained'}) - ${item.explanation || ''}`
    );
  });
  doc.moveDown();

  doc.fontSize(14).text('PLO Attainment');
  result.ploAttainment.forEach((item) => doc.fontSize(12).text(`${item.code}: ${item.score}`));
  doc.moveDown();

  doc.fontSize(14).text('Alerts');
  if (result.alerts.length) {
    result.alerts.forEach((item) => doc.fontSize(12).text(`- ${item}`));
  } else {
    doc.fontSize(12).text('No alerts.');
  }

  doc.end();
});

const courseSummaryReport = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) {
    res.status(404);
    throw new Error('Course not found.');
  }

  const [assessments, mapping] = await Promise.all([
    Assessment.find({ course: req.params.courseId }).lean(),
    CLOPLOMapping.findOne({ course: req.params.courseId }).lean()
  ]);
  const analytics = await buildCourseAnalytics(req.params.courseId);
  return success(res, { course, assessments, mapping, analytics }, 'Course summary report fetched.');
});

module.exports = { studentPdfReport, courseSummaryReport };
