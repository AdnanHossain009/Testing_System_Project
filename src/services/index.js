import api from './api';

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

export const programService = {
  getAll: () => api.get('/programs'),
  getById: (id) => api.get(`/programs/${id}`),
  create: (data) => api.post('/programs', data),
  update: (id, data) => api.put(`/programs/${id}`, data),
  delete: (id) => api.delete(`/programs/${id}`),
};

export const courseService = {
  getAll: () => api.get('/courses'),
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
  getByProgram: (programId) => api.get(`/courses/program/${programId}`),
};

export const ploService = {
  getAll: async () => {
    // PLOs are nested in programs, so fetch all programs and extract PLOs
    const response = await api.get('/programs');
    const programs = response.data.data?.items || response.data.data || [];
    const allPLOs = [];
    programs.forEach(program => {
      if (program.plos && program.plos.length > 0) {
        program.plos.forEach(plo => {
          allPLOs.push({
            ...plo,
            programId: program._id,
            programName: program.name,
            programCode: program.code,
          });
        });
      }
    });
    return { data: { data: allPLOs } };
  },
  getById: (id) => api.get(`/programs/${id}`), // Returns program with PLOs
  create: (data) => api.post(`/programs/${data.program}/plos`, data),
  update: (programId, ploId, data) => api.put(`/programs/${programId}/plos/${ploId}`, data),
  delete: (programId, ploId) => api.delete(`/programs/${programId}/plos/${ploId}`),
  getByProgram: (programId) => api.get(`/programs/${programId}`),
};

export const cloService = {
  getAll: async () => {
    // CLOs are nested in courses, so fetch all courses and extract CLOs
    const response = await api.get('/courses');
    const courses = response.data.data?.items || response.data.data || [];
    const allCLOs = [];
    courses.forEach(course => {
      if (course.clos && course.clos.length > 0) {
        course.clos.forEach(clo => {
          allCLOs.push({
            ...clo,
            courseId: course._id,
            courseName: course.name,
            courseCode: course.code,
          });
        });
      }
    });
    return { data: { data: allCLOs } };
  },
  getById: (id) => api.get(`/courses/${id}`), // Returns course with CLOs
  create: (data) => api.post(`/courses/${data.course}/clos`, data),
  update: (courseId, cloId, data) => api.put(`/courses/${courseId}/clos/${cloId}`, data),
  delete: (courseId, cloId) => api.delete(`/courses/${courseId}/clos/${cloId}`),
  getByCourse: async (courseId) => {
    const response = await api.get(`/courses/${courseId}`);
    const course = response.data.data;
    return { data: { data: course.clos || [] } };
  },
};

export const assessmentService = {
  getAll: () => api.get('/assessments'),
  getById: (id) => api.get(`/assessments/${id}`),
  create: (data) => api.post('/assessments', data),
  update: (id, data) => api.put(`/assessments/${id}`, data),
  delete: (id) => api.delete(`/assessments/${id}`),
  getByCourse: (courseId) => api.get(`/assessments/course/${courseId}`),
};

export const markService = {
  enterMarks: (data) => api.post('/marks', data),
  updateMarks: (id, data) => api.put(`/marks/${id}`, data),
  getByAssessment: (assessmentId) => api.get(`/marks/assessment/${assessmentId}`),
  getByStudent: (studentId) => api.get(`/marks/student/${studentId}`),
};

export const analyticsService = {
  getAdminDashboard: () => api.get('/analytics/admin/dashboard'),
  getFacultyDashboard: () => api.get('/analytics/faculty/dashboard'),
  getStudentDashboard: () => api.get('/analytics/student/dashboard'),
  getCLOStatistics: (courseId) => api.get(`/analytics/clo/${courseId}`),
  getPLOStatistics: (programId) => api.get(`/analytics/plo/${programId}`),
  getStudentPerformance: (studentId) => api.get(`/analytics/performance-trend/${studentId}`),
  getAtRiskStudents: () => api.get('/analytics/at-risk'),
  calculateOutcome: (data) => api.post('/analytics/outcomes/calculate', data),
  getStudentOutcomes: (studentId) => api.get(`/analytics/outcomes/student/${studentId}`),
  getCourseOutcomes: (courseId) => api.get(`/analytics/outcomes/course/${courseId}`),
};

export const studentService = {
  getAll: () => api.get('/students'),
  getById: (id) => api.get(`/students/${id}`),
  getByCourse: (courseId) => api.get(`/students/course/${courseId}`),
  getDashboard: () => api.get('/students/dashboard'),
};

export const facultyService = {
  getAll: () => api.get('/faculty'),
  getById: (id) => api.get(`/faculty/${id}`),
  getCourses: () => api.get('/faculty/courses'),
  getDashboard: () => api.get('/faculty/dashboard'),
};
