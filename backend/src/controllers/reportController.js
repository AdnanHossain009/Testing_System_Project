const PDFDocument = require('pdfkit');
const Result = require('../models/Result');
const Course = require('../models/Course');
const Assessment = require('../models/Assessment');
const CLOPLOMapping = require('../models/CLOPLOMapping');
const { buildCourseAnalytics } = require('../services/analyticsService');
const { logAction } = require('../services/auditService');
const {
  getReportCatalog,
  normalizeReportFilters,
  buildReportPreview,
  buildCsvExport
} = require('../services/accreditationReportingService');
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

const accreditationReportCatalog = asyncHandler(async (req, res) => {
  return success(res, { reports: getReportCatalog() }, 'Accreditation report catalog fetched.');
});

const accreditationReportPreview = asyncHandler(async (req, res) => {
  const filters = normalizeReportFilters(req.query);
  const preview = await buildReportPreview(req.params.reportType, filters);

  await logAction({
    actor: req.user._id,
    action: 'PREVIEW_ACCREDITATION_REPORT',
    entityType: 'AccreditationReport',
    entityId: preview.reportType,
    metadata: {
      filters
    }
  });

  return success(res, { report: preview }, 'Accreditation report preview fetched.');
});

const writePdfSection = (doc, section) => {
  doc.moveDown(0.5);
  doc.fontSize(14).text(section.title, { underline: true });

  if (section.description) {
    doc.moveDown(0.2);
    doc.fontSize(10).fillColor('#475569').text(section.description);
    doc.fillColor('black');
  }

  if (section.type === 'text') {
    doc.moveDown(0.3);
    doc.fontSize(11).text(section.body || 'No narrative provided.');
    return;
  }

  if (section.type === 'list') {
    (section.items || []).forEach((item) => {
      doc.moveDown(0.15);
      doc.fontSize(11).text(`${item.label}: ${item.value}`);
    });
    return;
  }

  if (section.type === 'table') {
    const columns = section.columns || [];
    const rows = section.rows || [];

    if (!rows.length) {
      doc.moveDown(0.2);
      doc.fontSize(11).text('No rows available.');
      return;
    }

    rows.slice(0, 30).forEach((row, index) => {
      const line = columns.map((column) => `${column.label}: ${row[column.key] ?? ''}`).join(' | ');
      doc.moveDown(index === 0 ? 0.25 : 0.15);
      doc.fontSize(10).text(line, {
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right
      });
    });

    if (rows.length > 30) {
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor('#64748b').text(`Additional ${rows.length - 30} row(s) omitted in PDF export preview.`).fillColor('black');
    }
  }
};

const accreditationReportExport = asyncHandler(async (req, res) => {
  const filters = normalizeReportFilters(req.query);
  const format = String(req.query.format || 'pdf').toLowerCase();
  const preview = await buildReportPreview(req.params.reportType, filters);

  await logAction({
    actor: req.user._id,
    action: 'EXPORT_ACCREDITATION_REPORT',
    entityType: 'AccreditationReport',
    entityId: preview.reportType,
    metadata: {
      format,
      filters
    }
  });

  if (format === 'json') {
    res.setHeader('Content-Disposition', `attachment; filename=${preview.exportBaseName}.json`);
    return res.json(preview);
  }

  if (format === 'csv') {
    const csvExport = buildCsvExport(preview);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${csvExport.filename}`);
    return res.send(csvExport.content);
  }

  if (format !== 'pdf') {
    res.status(400);
    throw new Error('Unsupported export format.');
  }

  const doc = new PDFDocument({ margin: 45 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${preview.exportBaseName}.pdf`);
  doc.pipe(res);

  doc.fontSize(18).text(preview.title, { underline: true });
  doc.moveDown(0.3);
  doc.fontSize(11).fillColor('#475569').text(preview.description || '').fillColor('black');
  doc.moveDown(0.5);
  doc.fontSize(10).text(`Generated: ${new Date(preview.generatedAt).toLocaleString()}`);

  if (preview.summaryCards?.length) {
    doc.moveDown(0.4);
    doc.fontSize(14).text('Summary Metrics', { underline: true });
    preview.summaryCards.forEach((item) => {
      doc.moveDown(0.15);
      doc.fontSize(11).text(`${item.label}: ${item.value}`);
    });
  }

  (preview.sections || []).forEach((section) => {
    if (doc.y > doc.page.height - 120) {
      doc.addPage();
    }
    writePdfSection(doc, section);
  });

  doc.end();
});

module.exports = {
  studentPdfReport,
  courseSummaryReport,
  accreditationReportCatalog,
  accreditationReportPreview,
  accreditationReportExport
};
