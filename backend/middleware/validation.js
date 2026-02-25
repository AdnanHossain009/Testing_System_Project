const { body, param, query, validationResult } = require('express-validator');

// Validation middleware to check for errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

// User validation rules
const userValidation = {
  register: [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['admin', 'faculty', 'student']),
    validate,
  ],
  login: [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
  ],
};

// Program validation rules
const programValidation = {
  create: [
    body('code').trim().notEmpty().withMessage('Program code is required'),
    body('name').trim().notEmpty().withMessage('Program name is required'),
    body('duration')
      .isInt({ min: 1, max: 10 })
      .withMessage('Duration must be between 1 and 10 years'),
    validate,
  ],
};

// Course validation rules
const courseValidation = {
  create: [
    body('code').trim().notEmpty().withMessage('Course code is required'),
    body('name').trim().notEmpty().withMessage('Course name is required'),
    body('program').isMongoId().withMessage('Valid program ID is required'),
    body('creditHours')
      .isInt({ min: 0, max: 6 })
      .withMessage('Credit hours must be between 0 and 6'),
    body('semester').notEmpty().withMessage('Semester is required'),
    validate,
  ],
};

// Assessment validation rules
const assessmentValidation = {
  create: [
    body('title').trim().notEmpty().withMessage('Assessment title is required'),
    body('course').isMongoId().withMessage('Valid course ID is required'),
    body('type')
      .isIn(['quiz', 'assignment', 'midterm', 'final', 'project', 'lab', 'presentation'])
      .withMessage('Invalid assessment type'),
    body('totalMarks').isFloat({ min: 0 }).withMessage('Total marks must be positive'),
    body('weightage')
      .isFloat({ min: 0, max: 100 })
      .withMessage('Weightage must be between 0 and 100'),
    validate,
  ],
};

// Marks validation rules
const marksValidation = {
  create: [
    body('student').isMongoId().withMessage('Valid student ID is required'),
    body('assessment').isMongoId().withMessage('Valid assessment ID is required'),
    body('obtainedMarks').isFloat({ min: 0 }).withMessage('Obtained marks must be positive'),
    validate,
  ],
};

// ObjectId validation
const objectIdValidation = [
  param('id').isMongoId().withMessage('Invalid ID format'),
  validate,
];

module.exports = {
  validate,
  userValidation,
  programValidation,
  courseValidation,
  assessmentValidation,
  marksValidation,
  objectIdValidation,
};
