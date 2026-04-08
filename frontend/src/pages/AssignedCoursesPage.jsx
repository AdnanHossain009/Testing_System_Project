import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Loading from '../components/Loading';
import StatCard from '../components/StatCard';

const AssignedCoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [coursePerformance, setCoursePerformance] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [weakStudents, setWeakStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const [courseResponse, summaryResponse, assessmentResponse] = await Promise.all([
        api.get('/courses'),
        api.get('/analytics/faculty-summary'),
        api.get('/assessments')
      ]);

      setCourses(courseResponse.data.data.courses || []);
      setCoursePerformance(summaryResponse.data.data.coursePerformance || []);
      setWeakStudents(summaryResponse.data.data.weakStudents || []);
      setAssessments(assessmentResponse.data.data.assessments || []);
      setLoading(false);
    };

    run();
  }, []);

  if (loading) return <Loading text="Loading assigned courses..." />;

  const coursePerformanceMap = new Map(
    coursePerformance.map((item) => [String(item.courseId), item])
  );

  const assessmentCountMap = assessments.reduce((accumulator, item) => {
    const key = String(item.course?._id || item.course);
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});

  return (
    <div>
      <div className="page-header">
        <h1>Assigned Courses</h1>
        <p className="muted">
          Faculty-specific course overview with assessments, CLO coverage, and performance snapshot.
        </p>
      </div>

      <div className="grid grid-3">
        <StatCard label="Assigned Courses" value={courses.length} />
        <StatCard label="Assessments" value={assessments.length} />
        <StatCard label="Weak Students" value={weakStudents.length} />
      </div>

      <div className="card">
        <h3>Course Overview</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Course</th>
              <th>CLOs</th>
              <th>Assessments</th>
              <th>Avg Fuzzy</th>
              <th>Total Students</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((item) => {
              const performance = coursePerformanceMap.get(String(item._id));
              return (
                <tr key={item._id}>
                  <td>
                    <strong>{item.code}</strong>
                    <div className="muted">{item.name}</div>
                  </td>
                  <td>{item.clos?.length || 0}</td>
                  <td>{assessmentCountMap[String(item._id)] || 0}</td>
                  <td>{performance?.averageFuzzy ?? '0'}</td>
                  <td>{performance?.totalStudents ?? '0'}</td>
                  <td>
                    <Link className="btn btn-secondary" to={`/courses/${item._id}`}>
                      View details
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssignedCoursesPage;
