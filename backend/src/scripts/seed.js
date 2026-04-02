require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Department = require('../models/Department');
const Program = require('../models/Program');
const User = require('../models/User');
const Course = require('../models/Course');
const Assessment = require('../models/Assessment');
const CLOPLOMapping = require('../models/CLOPLOMapping');
const FuzzyRule = require('../models/FuzzyRule');
const Result = require('../models/Result');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { DEFAULT_RULES } = require('../services/fuzzyService');

const run = async () => {
  await connectDB();

  await Promise.all([
    Department.deleteMany(),
    Program.deleteMany(),
    User.deleteMany(),
    Course.deleteMany(),
    Assessment.deleteMany(),
    CLOPLOMapping.deleteMany(),
    FuzzyRule.deleteMany(),
    Result.deleteMany(),
    Notification.deleteMany(),
    AuditLog.deleteMany()
  ]);

  const department = await Department.create({
    name: 'Computer Science and Engineering',
    code: 'CSE',
    description: 'Department of Computer Science and Engineering'
  });

  const program = await Program.create({
    name: 'BSc in Computer Science and Engineering',
    code: 'BSC-CSE',
    department: department._id,
    plos: [
      { code: 'PLO1', description: 'Engineering knowledge' },
      { code: 'PLO2', description: 'Problem analysis' },
      { code: 'PLO3', description: 'Design and development of solutions' }
    ]
  });

  const admin = await User.create({
    name: 'System Admin',
    email: 'admin@example.com',
    password: 'Admin123!',
    role: 'admin',
    department: department._id
  });

  const head = await User.create({
    name: 'Dr. Department Head',
    email: 'head@example.com',
    password: 'Head123!',
    role: 'head',
    department: department._id,
    program: program._id
  });

  department.head = head._id;
  await department.save();

  const faculty = await User.create({
    name: 'Prof. Amina Rahman',
    email: 'faculty@example.com',
    password: 'Faculty123!',
    role: 'faculty',
    department: department._id,
    program: program._id,
    facultyId: 'FAC-1001'
  });

  const student1 = await User.create({
    name: 'Tanvir Hasan',
    email: 'student1@example.com',
    password: 'Student123!',
    role: 'student',
    department: department._id,
    program: program._id,
    studentId: '2021001'
  });

  const student2 = await User.create({
    name: 'Nusrat Jahan',
    email: 'student2@example.com',
    password: 'Student123!',
    role: 'student',
    department: department._id,
    program: program._id,
    studentId: '2021002'
  });

  const course = await Course.create({
    name: 'Machine Learning Fundamentals',
    code: 'CSE401',
    credits: 3,
    semester: '8th',
    department: department._id,
    program: program._id,
    faculty: faculty._id,
    clos: [
      { code: 'CLO1', description: 'Explain basic machine learning concepts', bloomLevel: 'C2' },
      { code: 'CLO2', description: 'Build and evaluate simple predictive models', bloomLevel: 'C3' },
      { code: 'CLO3', description: 'Interpret model results for academic decision making', bloomLevel: 'C4' }
    ]
  });

  await Assessment.insertMany([
    {
      course: course._id,
      title: 'Quiz 1',
      type: 'quiz',
      cloCodes: ['CLO1'],
      totalMarks: 10,
      weightage: 10,
      createdBy: faculty._id
    },
    {
      course: course._id,
      title: 'Assignment 1',
      type: 'assignment',
      cloCodes: ['CLO2'],
      totalMarks: 15,
      weightage: 15,
      createdBy: faculty._id
    },
    {
      course: course._id,
      title: 'Midterm',
      type: 'mid',
      cloCodes: ['CLO1', 'CLO2'],
      totalMarks: 25,
      weightage: 25,
      createdBy: faculty._id
    },
    {
      course: course._id,
      title: 'Final Exam',
      type: 'final',
      cloCodes: ['CLO2', 'CLO3'],
      totalMarks: 50,
      weightage: 50,
      createdBy: faculty._id
    }
  ]);

  await CLOPLOMapping.create({
    course: course._id,
    createdBy: faculty._id,
    mappings: [
      { cloCode: 'CLO1', ploCode: 'PLO1', weight: 1 },
      { cloCode: 'CLO2', ploCode: 'PLO2', weight: 0.6 },
      { cloCode: 'CLO2', ploCode: 'PLO3', weight: 0.4 },
      { cloCode: 'CLO3', ploCode: 'PLO3', weight: 1 }
    ]
  });

  await FuzzyRule.insertMany(DEFAULT_RULES);

  console.log('Seed completed.');
  console.log('Admin login: admin@example.com / Admin123!');
  console.log('Head login: head@example.com / Head123!');
  console.log('Faculty login: faculty@example.com / Faculty123!');
  console.log('Student login: student1@example.com / Student123!');
  console.log('Student login: student2@example.com / Student123!');

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
