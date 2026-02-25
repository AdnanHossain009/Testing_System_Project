const User = require('../models/User');
const Course = require('../models/Course');
const Assessment = require('../models/Assessment');
const Program = require('../models/Program');
const OutcomeResult = require('../models/OutcomeResult');
const { ROLES } = require('../config/constants');

/**
 * Get admin dashboard statistics
 * @returns {Object} Dashboard stats
 */
const getAdminDashboard = async () => {
  try {
    const [
      totalPrograms,
      totalCourses,
      totalStudents,
      totalFaculty,
      totalAssessments,
      activePrograms,
      activeCourses,
    ] = await Promise.all([
      Program.countDocuments(),
      Course.countDocuments(),
      User.countDocuments({ role: ROLES.STUDENT, isActive: true }),
      User.countDocuments({ role: ROLES.FACULTY, isActive: true }),
      Assessment.countDocuments(),
      Program.countDocuments({ isActive: true }),
      Course.countDocuments({ isActive: true }),
    ]);

    // Get PLO count from all programs
    const programs = await Program.find();
    const totalPLOs = programs.reduce((sum, program) => sum + program.plos.length, 0);

    // Get CLO count from all courses
    const courses = await Course.find();
    const totalCLOs = courses.reduce((sum, course) => sum + course.clos.length, 0);

    return {
      totalPrograms,
      totalCourses,
      totalStudents,
      totalFaculty,
      totalAssessments,
      totalPLOs,
      totalCLOs,
      activePrograms,
      activeCourses,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get faculty dashboard statistics
 * @param {String} facultyId - Faculty user ID
 * @returns {Object} Dashboard stats
 */
const getFacultyDashboard = async (facultyId) => {
  try {
    const myCourses = await Course.find({ faculty: facultyId });
    const courseIds = myCourses.map((c) => c._id);

    const [totalAssessments, totalStudents, recentAssessments] = await Promise.all([
      Assessment.countDocuments({ course: { $in: courseIds } }),
      OutcomeResult.distinct('student', { course: { $in: courseIds } }).then((ids) => ids.length),
      Assessment.find({ course: { $in: courseIds } })
        .populate('course', 'name code')
        .sort({ date: -1 })
        .limit(5),
    ]);

    return {
      totalCourses: myCourses.length,
      totalAssessments,
      totalStudents,
      recentAssessments,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get student dashboard statistics
 * @param {String} studentId - Student user ID
 * @returns {Object} Dashboard stats
 */
const getStudentDashboard = async (studentId) => {
  try {
    const outcomes = await OutcomeResult.find({ student: studentId })
      .populate('course', 'name code');

    const enrolledCourses = outcomes.length;

    // Calculate average CLO achievement
    let totalCLOAchievement = 0;
    let cloCount = 0;
    outcomes.forEach((outcome) => {
      outcome.cloAchievements.forEach((clo) => {
        totalCLOAchievement += clo.achievement;
        cloCount++;
      });
    });
    const avgCLOAchievement = cloCount > 0 ? totalCLOAchievement / cloCount : 0;

    // Calculate average PLO achievement
    let totalPLOAchievement = 0;
    let ploCount = 0;
    outcomes.forEach((outcome) => {
      outcome.ploAchievements.forEach((plo) => {
        totalPLOAchievement += plo.achievement;
        ploCount++;
      });
    });
    const avgPLOAchievement = ploCount > 0 ? totalPLOAchievement / ploCount : 0;

    // Calculate average GPA
    const avgGPA =
      outcomes.length > 0
        ? outcomes.reduce((sum, o) => sum + o.gpa, 0) / outcomes.length
        : 0;

    return {
      enrolledCourses,
      avgCLOAchievement: Math.round(avgCLOAchievement * 100) / 100,
      avgPLOAchievement: Math.round(avgPLOAchievement * 100) / 100,
      avgGPA: Math.round(avgGPA * 100) / 100,
      courses: outcomes,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAdminDashboard,
  getFacultyDashboard,
  getStudentDashboard,
};
