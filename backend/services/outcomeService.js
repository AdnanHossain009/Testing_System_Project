const OutcomeResult = require('../models/OutcomeResult');
const Marks = require('../models/Marks');
const Course = require('../models/Course');
const {
  calculateCLOAttainment,
  calculatePLOAttainment,
  calculateOverallPercentage,
  getPerformanceLevel,
  calculateGrade,
  isAttained,
  calculateRiskScore,
  generateRecommendations,
} = require('../utils/calculationUtils');

/**
 * Calculate and save outcome results for a student in a course
 * @param {String} studentId - Student ID
 * @param {String} courseId - Course ID
 * @param {String} semester - Semester
 * @returns {Object} Outcome result
 */
const calculateOutcomeResult = async (studentId, courseId, semester) => {
  try {
    // Get course with CLOs and program PLOs
    const course = await Course.findById(courseId).populate('program');
    if (!course) {
      throw new Error('Course not found');
    }

    // Get all marks for student in this course
    const marks = await Marks.find({ student: studentId })
      .populate({
        path: 'assessment',
        match: { course: courseId },
        populate: { path: 'course' },
      })
      .exec();

    // Filter out null assessments (from match filter)
    const validMarks = marks.filter((mark) => mark.assessment !== null);

    if (validMarks.length === 0) {
      throw new Error('No marks found for this student in this course');
    }

    // Calculate CLO achievements
    const cloAchievements = course.clos.map((clo) => {
      const achievement = calculateCLOAttainment(validMarks, clo._id);
      return {
        clo: clo._id,
        cloCode: clo.code,
        achievement: Math.round(achievement * 100) / 100,
        isAttained: isAttained(achievement, 'CLO'),
      };
    });

    // Calculate PLO achievements
    const ploAchievements = course.program.plos.map((plo) => {
      // Find CLOs mapped to this PLO
      const mappedCLOs = course.clos.filter(
        (clo) => clo.mappedPLO.toString() === plo._id.toString()
      );

      const cloAchievementsForPLO = mappedCLOs.map((clo) => ({
        achievement: cloAchievements.find(
          (ca) => ca.clo.toString() === clo._id.toString()
        )?.achievement || 0,
        mappedPLO: plo._id,
      }));

      const achievement = calculatePLOAttainment(cloAchievementsForPLO, plo._id);

      return {
        plo: plo._id,
        ploCode: plo.code,
        achievement: Math.round(achievement * 100) / 100,
        isAttained: isAttained(achievement, 'PLO'),
      };
    });

    // Calculate overall percentage
    const overallPercentage = calculateOverallPercentage(validMarks);

    // Calculate grade and GPA
    const gradeInfo = calculateGrade(overallPercentage);

    // Determine performance level
    const performanceLevel = getPerformanceLevel(overallPercentage);

    // Calculate risk score
    const riskScore = calculateRiskScore(overallPercentage, cloAchievements);

    // Create outcome result object
    const outcomeData = {
      student: studentId,
      course: courseId,
      semester,
      cloAchievements,
      ploAchievements,
      overallPercentage: Math.round(overallPercentage * 100) / 100,
      grade: gradeInfo.grade,
      gpa: gradeInfo.gpa,
      performanceLevel,
      riskScore,
      isAtRisk: riskScore >= 50,
    };

    // Generate recommendations
    outcomeData.recommendations = generateRecommendations(outcomeData);

    // Save or update outcome result
    const outcomeResult = await OutcomeResult.findOneAndUpdate(
      { student: studentId, course: courseId },
      outcomeData,
      { upsert: true, new: true, runValidators: true }
    );

    return outcomeResult;
  } catch (error) {
    throw error;
  }
};

/**
 * Get outcome results for a student
 * @param {String} studentId - Student ID
 * @returns {Array} Outcome results
 */
const getStudentOutcomes = async (studentId) => {
  try {
    const outcomes = await OutcomeResult.find({ student: studentId })
      .populate('course', 'name code')
      .sort({ createdAt: -1 });

    return outcomes;
  } catch (error) {
    throw error;
  }
};

/**
 * Get outcome results for a course
 * @param {String} courseId - Course ID
 * @returns {Array} Outcome results
 */
const getCourseOutcomes = async (courseId) => {
  try {
    const outcomes = await OutcomeResult.find({ course: courseId })
      .populate('student', 'name email studentId')
      .sort({ overallPercentage: -1 });

    return outcomes;
  } catch (error) {
    throw error;
  }
};

/**
 * Get students at risk
 * @param {String} courseId - Optional course ID filter
 * @returns {Array} Students at risk
 */
const getStudentsAtRisk = async (courseId = null) => {
  try {
    const filter = { isAtRisk: true };
    if (courseId) {
      filter.course = courseId;
    }

    const atRiskStudents = await OutcomeResult.find(filter)
      .populate('student', 'name email studentId')
      .populate('course', 'name code')
      .sort({ riskScore: -1 });

    return atRiskStudents;
  } catch (error) {
    throw error;
  }
};

/**
 * Calculate course-level CLO attainment statistics
 * @param {String} courseId - Course ID
 * @returns {Object} CLO statistics
 */
const getCourseCLOStatistics = async (courseId) => {
  try {
    const outcomes = await OutcomeResult.find({ course: courseId });

    if (outcomes.length === 0) {
      return [];
    }

    const course = await Course.findById(courseId);
    const cloStats = course.clos.map((clo) => {
      const cloAchievements = outcomes
        .map((outcome) =>
          outcome.cloAchievements.find((ca) => ca.cloCode === clo.code)
        )
        .filter((ca) => ca !== undefined);

      const totalStudents = cloAchievements.length;
      const avgAchievement =
        cloAchievements.reduce((sum, ca) => sum + ca.achievement, 0) / totalStudents;
      const studentsAttained = cloAchievements.filter((ca) => ca.isAttained).length;
      const attainmentRate = (studentsAttained / totalStudents) * 100;

      return {
        clo: clo.code,
        description: clo.description,
        avgAchievement: Math.round(avgAchievement * 100) / 100,
        attainmentRate: Math.round(attainmentRate * 100) / 100,
        totalStudents,
        studentsAttained,
      };
    });

    return cloStats;
  } catch (error) {
    throw error;
  }
};

/**
 * Calculate program-level PLO attainment statistics
 * @param {String} programId - Program ID
 * @returns {Object} PLO statistics
 */
const getProgramPLOStatistics = async (programId) => {
  try {
    const courses = await Course.find({ program: programId });
    const courseIds = courses.map((c) => c._id);

    const outcomes = await OutcomeResult.find({ course: { $in: courseIds } });

    if (outcomes.length === 0) {
      return [];
    }

    // Get all unique PLOs from all outcomes
    const allPLOs = new Map();

    outcomes.forEach((outcome) => {
      outcome.ploAchievements.forEach((plo) => {
        const ploCode = plo.ploCode;
        if (!allPLOs.has(ploCode)) {
          allPLOs.set(ploCode, []);
        }
        allPLOs.get(ploCode).push(plo.achievement);
      });
    });

    const ploStats = Array.from(allPLOs.entries()).map(([ploCode, achievements]) => {
      const avgAchievement =
        achievements.reduce((sum, ach) => sum + ach, 0) / achievements.length;
      const studentsAttained = achievements.filter((ach) => isAttained(ach, 'PLO')).length;
      const attainmentRate = (studentsAttained / achievements.length) * 100;

      return {
        plo: ploCode,
        avgAchievement: Math.round(avgAchievement * 100) / 100,
        attainmentRate: Math.round(attainmentRate * 100) / 100,
        totalStudents: achievements.length,
        studentsAttained,
      };
    });

    return ploStats;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  calculateOutcomeResult,
  getStudentOutcomes,
  getCourseOutcomes,
  getStudentsAtRisk,
  getCourseCLOStatistics,
  getProgramPLOStatistics,
};
