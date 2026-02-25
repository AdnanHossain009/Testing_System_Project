const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config();

// Import models
const User = require('../models/User');
const Program = require('../models/Program');
const Course = require('../models/Course');
const Assessment = require('../models/Assessment');
const Marks = require('../models/Marks');

// Sample data
const users = {
  admin: {
    name: 'Admin User',
    email: 'admin@university.edu',
    password: 'admin123',
    role: 'admin',
    department: 'Administration',
    isActive: true
  },
  faculty1: {
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@university.edu',
    password: 'faculty123',
    role: 'faculty',
    department: 'Computer Science',
    facultyId: 'FAC001',
    isActive: true
  },
  faculty2: {
    name: 'Dr. Michael Chen',
    email: 'michael.chen@university.edu',
    password: 'faculty123',
    role: 'faculty',
    department: 'Computer Science',
    facultyId: 'FAC002',
    isActive: true
  },
  students: [
    {
      name: 'Alice Williams',
      email: 'alice.williams@student.edu',
      password: 'student123',
      role: 'student',
      department: 'Computer Science',
      studentId: 'STD001',
      semester: 6,
      isActive: true
    },
    {
      name: 'Bob Anderson',
      email: 'bob.anderson@student.edu',
      password: 'student123',
      role: 'student',
      department: 'Computer Science',
      studentId: 'STD002',
      semester: 6,
      isActive: true
    },
    {
      name: 'Charlie Brown',
      email: 'charlie.brown@student.edu',
      password: 'student123',
      role: 'student',
      department: 'Computer Science',
      studentId: 'STD003',
      semester: 6,
      isActive: true
    },
    {
      name: 'Diana Martinez',
      email: 'diana.martinez@student.edu',
      password: 'student123',
      role: 'student',
      department: 'Computer Science',
      studentId: 'STD004',
      semester: 6,
      isActive: true
    },
    {
      name: 'Eva Thompson',
      email: 'eva.thompson@student.edu',
      password: 'student123',
      role: 'student',
      department: 'Computer Science',
      studentId: 'STD005',
      semester: 6,
      isActive: true
    }
  ]
};

const programs = [
  {
    code: 'BSCS',
    name: 'Bachelor of Science in Computer Science',
    duration: 4,
    description: '4-year undergraduate program in Computer Science',
    plos: [
      {
        code: 'PLO1',
        description: 'Apply knowledge of computing and mathematics appropriate to the discipline',
        domain: 'cognitive'
      },
      {
        code: 'PLO2',
        description: 'Analyze a problem and identify computing requirements appropriate to its solution',
        domain: 'cognitive'
      },
      {
        code: 'PLO3',
        description: 'Design, implement and evaluate a computer-based system to meet desired needs',
        domain: 'cognitive'
      },
      {
        code: 'PLO4',
        description: 'Function effectively on teams to accomplish a common goal',
        domain: 'affective'
      },
      {
        code: 'PLO5',
        description: 'Communicate effectively with a range of audiences',
        domain: 'affective'
      }
    ],
    isActive: true
  },
  {
    code: 'BSSE',
    name: 'Bachelor of Science in Software Engineering',
    duration: 4,
    description: '4-year undergraduate program in Software Engineering',
    plos: [
      {
        code: 'PLO1',
        description: 'Apply software engineering principles and practices',
        domain: 'cognitive'
      },
      {
        code: 'PLO2',
        description: 'Design and develop large-scale software systems',
        domain: 'cognitive'
      },
      {
        code: 'PLO3',
        description: 'Work effectively in software development teams',
        domain: 'affective'
      }
    ],
    isActive: true
  }
];

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

const clearDatabase = async () => {
  try {
    await User.deleteMany({});
    await Program.deleteMany({});
    await Course.deleteMany({});
    await Assessment.deleteMany({});
    await Marks.deleteMany({});
    console.log('✅ Database Cleared');
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
    throw error;
  }
};

const seedUsers = async () => {
  try {
    console.log('\n📝 Creating Users...');
    
    // Create admin
    const admin = await User.create(users.admin);
    console.log(`✅ Admin created: ${admin.email}`);
    
    // Create faculty
    const faculty1 = await User.create(users.faculty1);
    console.log(`✅ Faculty created: ${faculty1.email}`);
    
    const faculty2 = await User.create(users.faculty2);
    console.log(`✅ Faculty created: ${faculty2.email}`);
    
    // Create students
    const students = [];
    for (const studentData of users.students) {
      const student = await User.create(studentData);
      students.push(student);
      console.log(`✅ Student created: ${student.email}`);
    }
    
    return { admin, faculty1, faculty2, students };
  } catch (error) {
    console.error('❌ Error creating users:', error.message);
    throw error;
  }
};

const seedPrograms = async () => {
  try {
    console.log('\n📚 Creating Programs...');
    
    const createdPrograms = [];
    for (const programData of programs) {
      const program = await Program.create(programData);
      createdPrograms.push(program);
      console.log(`✅ Program created: ${program.code} - ${program.name}`);
      console.log(`   PLOs: ${program.plos.length}`);
    }
    
    return createdPrograms;
  } catch (error) {
    console.error('❌ Error creating programs:', error.message);
    throw error;
  }
};

const seedCourses = async (program, faculty1, faculty2) => {
  try {
    console.log('\n📖 Creating Courses...');
    
    const courses = [
      {
        code: 'CS101',
        name: 'Introduction to Programming',
        program: program._id,
        creditHours: 3,
        semester: '1st',
        faculty: faculty1._id,
        description: 'Basic programming concepts using C++',
        clos: [
          {
            code: 'CLO1',
            description: 'Understand basic programming concepts',
            mappedPLO: program.plos[0]._id,
            weight: 25
          },
          {
            code: 'CLO2',
            description: 'Write and debug simple programs',
            mappedPLO: program.plos[0]._id,
            weight: 30
          },
          {
            code: 'CLO3',
            description: 'Apply control structures and functions',
            mappedPLO: program.plos[1]._id,
            weight: 25
          },
          {
            code: 'CLO4',
            description: 'Solve problems using programming',
            mappedPLO: program.plos[2]._id,
            weight: 20
          }
        ],
        isActive: true
      },
      {
        code: 'CS201',
        name: 'Data Structures',
        program: program._id,
        creditHours: 4,
        semester: '3rd',
        faculty: faculty1._id,
        description: 'Fundamental data structures and algorithms',
        clos: [
          {
            code: 'CLO1',
            description: 'Understand various data structures',
            mappedPLO: program.plos[0]._id,
            weight: 30
          },
          {
            code: 'CLO2',
            description: 'Implement data structures in code',
            mappedPLO: program.plos[2]._id,
            weight: 35
          },
          {
            code: 'CLO3',
            description: 'Analyze algorithm complexity',
            mappedPLO: program.plos[1]._id,
            weight: 35
          }
        ],
        isActive: true
      },
      {
        code: 'CS301',
        name: 'Database Systems',
        program: program._id,
        creditHours: 3,
        semester: '5th',
        faculty: faculty2._id,
        description: 'Database design and SQL',
        clos: [
          {
            code: 'CLO1',
            description: 'Design normalized databases',
            mappedPLO: program.plos[2]._id,
            weight: 30
          },
          {
            code: 'CLO2',
            description: 'Write complex SQL queries',
            mappedPLO: program.plos[0]._id,
            weight: 30
          },
          {
            code: 'CLO3',
            description: 'Implement database applications',
            mappedPLO: program.plos[2]._id,
            weight: 40
          }
        ],
        isActive: true
      }
    ];
    
    const createdCourses = [];
    for (const courseData of courses) {
      const course = await Course.create(courseData);
      createdCourses.push(course);
      console.log(`✅ Course created: ${course.code} - ${course.name}`);
      console.log(`   CLOs: ${course.clos.length}`);
    }
    
    return createdCourses;
  } catch (error) {
    console.error('❌ Error creating courses:', error.message);
    throw error;
  }
};

const seedAssessments = async (courses, faculty1, faculty2) => {
  try {
    console.log('\n📝 Creating Assessments...');
    
    const assessments = [];
    
    // Assessments for CS101
    const cs101Assessments = [
      {
        title: 'Quiz 1',
        course: courses[0]._id,
        type: 'quiz',
        totalMarks: 10,
        weightage: 5,
        cloMapping: [
          { clo: courses[0].clos[0]._id, weight: 100 }
        ],
        date: new Date('2026-02-01'),
        description: 'Basic concepts quiz',
        isPublished: true
      },
      {
        title: 'Assignment 1',
        course: courses[0]._id,
        type: 'assignment',
        totalMarks: 20,
        weightage: 10,
        cloMapping: [
          { clo: courses[0].clos[1]._id, weight: 60 },
          { clo: courses[0].clos[2]._id, weight: 40 }
        ],
        date: new Date('2026-02-10'),
        description: 'Programming assignment',
        isPublished: true
      },
      {
        title: 'Midterm Exam',
        course: courses[0]._id,
        type: 'midterm',
        totalMarks: 50,
        weightage: 25,
        cloMapping: [
          { clo: courses[0].clos[0]._id, weight: 30 },
          { clo: courses[0].clos[1]._id, weight: 30 },
          { clo: courses[0].clos[2]._id, weight: 40 }
        ],
        date: new Date('2026-02-20'),
        description: 'Mid semester examination',
        isPublished: true
      }
    ];
    
    // Assessments for CS201
    const cs201Assessments = [
      {
        title: 'Quiz 1',
        course: courses[1]._id,
        type: 'quiz',
        totalMarks: 15,
        weightage: 5,
        cloMapping: [
          { clo: courses[1].clos[0]._id, weight: 100 }
        ],
        date: new Date('2026-02-05'),
        description: 'Data structures basics',
        isPublished: true
      },
      {
        title: 'Lab Assignment 1',
        course: courses[1]._id,
        type: 'lab',
        totalMarks: 25,
        weightage: 15,
        cloMapping: [
          { clo: courses[1].clos[1]._id, weight: 70 },
          { clo: courses[1].clos[2]._id, weight: 30 }
        ],
        date: new Date('2026-02-15'),
        description: 'Implement stack and queue',
        isPublished: true
      }
    ];
    
    // Assessments for CS301
    const cs301Assessments = [
      {
        title: 'SQL Assignment',
        course: courses[2]._id,
        type: 'assignment',
        totalMarks: 30,
        weightage: 15,
        cloMapping: [
          { clo: courses[2].clos[1]._id, weight: 100 }
        ],
        date: new Date('2026-02-08'),
        description: 'Complex SQL queries',
        isPublished: true
      },
      {
        title: 'Database Design Project',
        course: courses[2]._id,
        type: 'project',
        totalMarks: 100,
        weightage: 30,
        cloMapping: [
          { clo: courses[2].clos[0]._id, weight: 40 },
          { clo: courses[2].clos[2]._id, weight: 60 }
        ],
        date: new Date('2026-02-25'),
        description: 'Complete database design and implementation',
        isPublished: true
      }
    ];
    
    const allAssessments = [...cs101Assessments, ...cs201Assessments, ...cs301Assessments];
    
    for (const assessmentData of allAssessments) {
      const assessment = await Assessment.create(assessmentData);
      assessments.push(assessment);
      console.log(`✅ Assessment created: ${assessment.title} for ${assessment.course}`);
    }
    
    return assessments;
  } catch (error) {
    console.error('❌ Error creating assessments:', error.message);
    throw error;
  }
};

const seedMarks = async (assessments, students, faculty1, faculty2) => {
  try {
    console.log('\n📊 Creating Marks...');
    
    let marksCount = 0;
    
    for (const assessment of assessments) {
      // Get the assessment with full details
      const fullAssessment = await Assessment.findById(assessment._id).populate('course');
      
      for (const student of students) {
        // Generate random marks (60-95% of total for variety)
        const percentage = 60 + Math.random() * 35;
        const obtainedMarks = Math.round((percentage / 100) * fullAssessment.totalMarks);
        
        // Determine which faculty is submitting based on course
        const submittedBy = fullAssessment.course.faculty.toString() === faculty1._id.toString() 
          ? faculty1._id 
          : faculty2._id;
        
        await Marks.create({
          student: student._id,
          assessment: assessment._id,
          obtainedMarks,
          remarks: obtainedMarks >= fullAssessment.totalMarks * 0.8 ? 'Excellent work' : 'Good effort',
          isAbsent: false,
          submittedBy
        });
        
        marksCount++;
      }
      
      console.log(`✅ Marks submitted for: ${assessment.title} (${students.length} students)`);
    }
    
    console.log(`✅ Total marks entries created: ${marksCount}`);
  } catch (error) {
    console.error('❌ Error creating marks:', error.message);
    throw error;
  }
};

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting Database Seeding Process...\n');
    console.log('=' .repeat(60));
    
    // Connect to database
    await connectDB();
    
    // Clear existing data
    await clearDatabase();
    
    // Seed users
    const { admin, faculty1, faculty2, students } = await seedUsers();
    
    // Seed programs
    const [bscsProgram, bsseProgram] = await seedPrograms();
    
    // Seed courses
    const courses = await seedCourses(bscsProgram, faculty1, faculty2);
    
    // Seed assessments
    const assessments = await seedAssessments(courses, faculty1, faculty2);
    
    // Seed marks
    await seedMarks(assessments, students, faculty1, faculty2);
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ DATABASE SEEDED SUCCESSFULLY!\n');
    
    console.log('📋 Summary:');
    console.log(`   • Users: ${1 + 2 + students.length} (1 Admin, 2 Faculty, ${students.length} Students)`);
    console.log(`   • Programs: ${programs.length}`);
    console.log(`   • Courses: ${courses.length}`);
    console.log(`   • Assessments: ${assessments.length}`);
    console.log(`   • Marks: ${assessments.length * students.length}`);
    
    console.log('\n🔑 Login Credentials:');
    console.log('\n   Admin:');
    console.log('   Email: admin@university.edu');
    console.log('   Password: admin123');
    console.log('\n   Faculty:');
    console.log('   Email: sarah.johnson@university.edu');
    console.log('   Password: faculty123');
    console.log('\n   Student:');
    console.log('   Email: alice.williams@student.edu');
    console.log('   Password: student123');
    
    console.log('\n' + '=' .repeat(60));
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding Error:', error);
    process.exit(1);
  }
};

// Run the seeding
seedDatabase();
