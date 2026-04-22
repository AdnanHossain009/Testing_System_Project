const fs = require('fs');
const path = require('path');
const multer = require('multer');

const courseRequestUploadRoot = path.join(__dirname, '..', '..', 'uploads', 'course-requests');

const ensureCourseRequestUploadRoot = () => {
  fs.mkdirSync(courseRequestUploadRoot, { recursive: true });
};

const sanitizeBaseName = (filename = 'course-outline') =>
  filename
    .replace(/\.pdf$/i, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'course-outline';

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    ensureCourseRequestUploadRoot();
    callback(null, courseRequestUploadRoot);
  },
  filename: (req, file, callback) => {
    const timestamp = Date.now();
    const uniqueSuffix = Math.round(Math.random() * 1e9);
    const baseName = sanitizeBaseName(file.originalname);
    callback(null, `${timestamp}-${uniqueSuffix}-${baseName}.pdf`);
  }
});

const fileFilter = (req, file, callback) => {
  const isPdf =
    file.mimetype === 'application/pdf' || String(file.originalname || '').toLowerCase().endsWith('.pdf');

  if (!isPdf) {
    callback(new Error('Only PDF files are allowed.'));
    return;
  }

  callback(null, true);
};

const courseRequestPdfUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

module.exports = {
  courseRequestPdfUpload,
  courseRequestUploadRoot,
  ensureCourseRequestUploadRoot
};
