// Mock data for demo mode (when backend is not available)

export const mockPrograms = [
  {
    id: 1,
    code: 'BSCS',
    name: 'Bachelor of Science in Computer Science',
    duration: 4,
    description: '4-year undergraduate program in Computer Science'
  },
  {
    id: 2,
    code: 'BSSE',
    name: 'Bachelor of Science in Software Engineering',
    duration: 4,
    description: '4-year undergraduate program in Software Engineering'
  },
  {
    id: 3,
    code: 'MSCS',
    name: 'Master of Science in Computer Science',
    duration: 2,
    description: '2-year graduate program in Computer Science'
  }
];

export const mockCourses = [
  {
    id: 1,
    code: 'CS101',
    name: 'Introduction to Programming',
    programId: 1,
    program: { name: 'BSCS' },
    creditHours: 3,
    semester: '1st'
  },
  {
    id: 2,
    code: 'CS201',
    name: 'Data Structures',
    programId: 1,
    program: { name: 'BSCS' },
    creditHours: 3,
    semester: '3rd'
  },
  {
    id: 3,
    code: 'CS301',
    name: 'Database Systems',
    programId: 1,
    program: { name: 'BSCS' },
    creditHours: 3,
    semester: '5th'
  },
  {
    id: 4,
    code: 'SE201',
    name: 'Software Engineering Principles',
    programId: 2,
    program: { name: 'BSSE' },
    creditHours: 3,
    semester: '3rd'
  }
];

export const mockPLOs = [
  {
    id: 1,
    programId: 1,
    program: { name: 'BSCS' },
    code: 'PLO1',
    domain: 'cognitive',
    description: 'Apply knowledge of computing fundamentals'
  },
  {
    id: 2,
    programId: 1,
    program: { name: 'BSCS' },
    code: 'PLO2',
    domain: 'cognitive',
    description: 'Analyze complex computing problems'
  },
  {
    id: 3,
    programId: 1,
    program: { name: 'BSCS' },
    code: 'PLO3',
    domain: 'psychomotor',
    description: 'Design and implement computing solutions'
  },
  {
    id: 4,
    programId: 1,
    program: { name: 'BSCS' },
    code: 'PLO4',
    domain: 'affective',
    description: 'Function effectively in teams'
  }
];

export const mockCLOs = [
  {
    id: 1,
    courseId: 1,
    course: { name: 'Introduction to Programming' },
    code: 'CLO1',
    description: 'Understand basic programming concepts',
    PLOId: 1
  },
  {
    id: 2,
    courseId: 1,
    course: { name: 'Introduction to Programming' },
    code: 'CLO2',
    description: 'Write simple programs using control structures',
    PLOId: 1
  },
  {
    id: 3,
    courseId: 2,
    course: { name: 'Data Structures' },
    code: 'CLO1',
    description: 'Understand fundamental data structures',
    PLOId: 2
  },
  {
    id: 4,
    courseId: 2,
    course: { name: 'Data Structures' },
    code: 'CLO2',
    description: 'Implement common data structures',
    PLOId: 3
  }
];

export const mockAssessments = [
  {
    id: 1,
    courseId: 1,
    course: { name: 'Introduction to Programming' },
    title: 'Midterm Exam',
    type: 'midterm',
    maxMarks: 50,
    CLOId: 1,
    weightage: 30,
    date: '2026-03-15'
  },
  {
    id: 2,
    courseId: 1,
    course: { name: 'Introduction to Programming' },
    title: 'Final Exam',
    type: 'final',
    maxMarks: 100,
    CLOId: 2,
    weightage: 50,
    date: '2026-05-20'
  },
  {
    id: 3,
    courseId: 2,
    course: { name: 'Data Structures' },
    title: 'Programming Assignment 1',
    type: 'assignment',
    maxMarks: 25,
    CLOId: 3,
    weightage: 15,
    date: '2026-03-01'
  }
];

export const mockStudents = [
  {
    id: 1,
    studentId: 'STD001',
    name: 'John Doe',
    email: 'john@university.edu',
    department: 'Computer Science',
    semester: 3
  },
  {
    id: 2,
    studentId: 'STD002',
    name: 'Jane Smith',
    email: 'jane@university.edu',
    department: 'Computer Science',
    semester: 3
  },
  {
    id: 3,
    studentId: 'STD003',
    name: 'Bob Johnson',
    email: 'bob@university.edu',
    department: 'Software Engineering',
    semester: 5
  }
];

export const mockAdminStats = {
  totalPrograms: 3,
  totalCourses: 12,
  totalPLOs: 15,
  totalStudents: 245
};

export const mockFacultyStats = {
  totalCourses: 3,
  totalAssessments: 8,
  totalStudents: 85,
  pendingGrading: 12
};

export const mockStudentStats = {
  enrolledCourses: 5,
  completedAssessments: 12,
  avgCLOAchievement: 78.5,
  avgPLOAchievement: 75.2
};

export const mockCLOAnalytics = [
  { clo: 'CLO1', achievement: 85, target: 80, students: 45 },
  { clo: 'CLO2', achievement: 72, target: 80, students: 45 },
  { clo: 'CLO3', achievement: 78, target: 80, students: 45 },
  { clo: 'CLO4', achievement: 68, target: 80, students: 45 },
  { clo: 'CLO5', achievement: 82, target: 80, students: 45 }
];

export const mockPLOAnalytics = [
  { plo: 'PLO1', achievement: 82 },
  { plo: 'PLO2', achievement: 75 },
  { plo: 'PLO3', achievement: 78 },
  { plo: 'PLO4', achievement: 70 },
  { plo: 'PLO5', achievement: 85 },
  { plo: 'PLO6', achievement: 72 }
];

export const mockPerformanceTrend = [
  { month: 'Sep', percentage: 65 },
  { month: 'Oct', percentage: 70 },
  { month: 'Nov', percentage: 75 },
  { month: 'Dec', percentage: 72 },
  { month: 'Jan', percentage: 78 },
  { month: 'Feb', percentage: 82 }
];

export const mockStudentPerformance = {
  percentage: 78.5,
  grade: 'B+',
  level: 'Good',
  totalAssessments: 12,
  cloAnalytics: mockCLOAnalytics,
  ploAnalytics: mockPLOAnalytics,
  performanceTrend: mockPerformanceTrend,
  assessments: [
    {
      id: 1,
      title: 'Midterm Exam',
      course: 'Database Systems',
      date: '2026-01-15',
      marks: 42,
      maxMarks: 50,
      percentage: 84
    },
    {
      id: 2,
      title: 'Programming Assignment',
      course: 'Data Structures',
      date: '2026-01-20',
      marks: 18,
      maxMarks: 25,
      percentage: 72
    },
    {
      id: 3,
      title: 'Quiz 1',
      course: 'Web Development',
      date: '2026-02-05',
      marks: 8,
      maxMarks: 10,
      percentage: 80
    }
  ]
};

// Helper function to simulate API delay
export const simulateAPIDelay = (data, delay = 500) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
};
