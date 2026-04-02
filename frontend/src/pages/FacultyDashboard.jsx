import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Loading from '../components/Loading';
import StatCard from '../components/StatCard';

const FacultyDashboard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const run = async () => {
      const response = await api.get('/analytics/faculty-summary');
      setData(response.data.data);
    };
    run();
  }, []);

  if (!data) return <Loading text="Loading faculty dashboard..." />;

  return (
    <div>
      <div className="page-header">
        <h1>Faculty Dashboard</h1>
        <p className="muted">
          Review your courses, identify weak students, and monitor average fuzzy attainment.
        </p>
      </div>

      <div className="grid grid-3">
        <StatCard label="Assigned Courses" value={data.totalCourses} subtitle="Open course list" to="/courses" />
        <StatCard
          label="Weak Students"
          value={data.weakStudents.length}
          subtitle="Open risk monitor"
          to="/risk-monitor"
        />
        <StatCard
          label="Tracked Courses"
          value={data.coursePerformance.length}
          subtitle="Open analytics module"
          to="/analytics"
        />
      </div>

      <div className="card">
        <div className="section-header-inline">
          <div>
            <h3>Course Performance</h3>
            <p className="muted">Click analytics for charts and CLO/PLO visual summaries.</p>
          </div>
          <Link to="/analytics" className="btn btn-secondary btn-small">
            Open Analytics
          </Link>
        </div>
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
        <div className="section-header-inline">
          <div>
            <h3>Weak Students</h3>
            <p className="muted">These students need the fastest follow-up from faculty.</p>
          </div>
          <Link to="/risk-monitor" className="btn btn-secondary btn-small">
            Open Risk Monitor
          </Link>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Risk Score</th>
              <th>Risk Band</th>
            </tr>
          </thead>
          <tbody>
            {data.weakStudents.map((item) => (
              <tr key={item._id}>
                <td>{item.student?.name}</td>
                <td>{item.riskScore}</td>
                <td>{item.riskBand}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FacultyDashboard;
