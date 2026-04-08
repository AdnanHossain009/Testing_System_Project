import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Loading from '../components/Loading';
import StatCard from '../components/StatCard';

const WeakStudentsPage = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const run = async () => {
      const response = await api.get('/analytics/faculty-summary');
      setData(response.data.data);
    };

    run();
  }, []);

  if (!data) return <Loading text="Loading weak students..." />;

  return (
    <div>
      <div className="page-header">
        <h1>Weak Students</h1>
        <p className="muted">
          Risk-focused list of students who need immediate support in your assigned courses.
        </p>
      </div>

      <div className="grid grid-3">
        <StatCard label="Assigned Courses" value={data.totalCourses} />
        <StatCard label="Weak Students" value={data.weakStudents.length} />
        <StatCard label="Tracked Courses" value={data.coursePerformance.length} />
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3>Course Snapshot</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Average Fuzzy</th>
              <th>Total Students</th>
            </tr>
          </thead>
          <tbody>
            {data.coursePerformance.map((item) => (
              <tr key={item.courseId}>
                <td>
                  {item.courseCode} - {item.courseName}
                </td>
                <td>{item.averageFuzzy}</td>
                <td>{item.totalStudents}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Weak Student List</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Course</th>
              <th>Risk Score</th>
              <th>Band</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.weakStudents.map((item) => (
              <tr key={item._id}>
                <td>
                  <strong>{item.student?.name}</strong>
                  <div className="muted">{item.student?.email}</div>
                </td>
                <td>
                  {item.course?.code || 'N/A'}
                  {item.course?.name ? <div className="muted">{item.course.name}</div> : null}
                </td>
                <td>{item.riskScore}</td>
                <td>{item.riskBand}</td>
                <td>
                  {item.course?._id ? (
                    <Link className="btn btn-secondary" to={`/courses/${item.course._id}`}>
                      View course
                    </Link>
                  ) : (
                    <span className="muted">N/A</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WeakStudentsPage;
