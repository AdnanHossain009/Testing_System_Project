const fs = require('fs');
const path = require('path');
const multer = require('multer');

const courseRequestUploadRoot = path.join(__dirname, '..', '..', 'uploads', 'course-requests');
const evidenceUploadRoot = path.join(__dirname, '..', '..', 'uploads', 'evidence');

const ensureUploadRoot = (targetPath) => {
  fs.mkdirSync(targetPath, { recursive: true });
};

const ensureCourseRequestUploadRoot = () => {
  ensureUploadRoot(courseRequestUploadRoot);
};

const ensureEvidenceUploadRoot = () => {
  ensureUploadRoot(evidenceUploadRoot);
};

const sanitizeBaseName = (filename = 'course-outline') =>
  filename
    .replace(/\.pdf$/i, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'course-outline';

const buildStorage = ({ rootPath, extensionResolver }) =>
  multer.diskStorage({
    destination: (req, file, callback) => {
      ensureUploadRoot(rootPath);
      callback(null, rootPath);
    },
    filename: (req, file, callback) => {
      const timestamp = Date.now();
      const uniqueSuffix = Math.round(Math.random() * 1e9);
      const baseName = sanitizeBaseName(file.originalname);
      const extension = extensionResolver(file);
      callback(null, `${timestamp}-${uniqueSuffix}-${baseName}${extension}`);
    }
  });

const courseRequestStorage = buildStorage({
  rootPath: courseRequestUploadRoot,
  extensionResolver: () => '.pdf'
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
  storage: courseRequestStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

const evidenceAllowedExtensions = new Set([
  '.pdf',
  '.doc',
  '.docx',
  '.ppt',
  '.pptx',
  '.xls',
  '.xlsx',
  '.csv',
  '.txt',
  '.zip',
  '.rar',
  '.7z',
  '.png',
  '.jpg',
  '.jpeg'
]);

const evidenceAllowedMimeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-zip-compressed',
  'application/vnd.rar',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'image/png',
  'image/jpeg'
]);

const evidenceStorage = buildStorage({
  rootPath: evidenceUploadRoot,
  extensionResolver: (file) => path.extname(file.originalname || '').toLowerCase() || ''
});

const evidenceFileFilter = (req, file, callback) => {
  const extension = path.extname(String(file.originalname || '')).toLowerCase();
  const isAllowedType = evidenceAllowedMimeTypes.has(file.mimetype) || evidenceAllowedExtensions.has(extension);

  if (!isAllowedType) {
    callback(new Error('Unsupported evidence file type.'));
    return;
  }

  callback(null, true);
};

const evidenceArtifactUpload = multer({
  storage: evidenceStorage,
  fileFilter: evidenceFileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024
  }
});

module.exports = {
  courseRequestPdfUpload,
  courseRequestUploadRoot,
  ensureCourseRequestUploadRoot,
  evidenceArtifactUpload,
  evidenceUploadRoot,
  ensureEvidenceUploadRoot
};
