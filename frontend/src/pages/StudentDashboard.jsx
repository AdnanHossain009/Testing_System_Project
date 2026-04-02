import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Loading from '../components/Loading';
import StatCard from '../components/StatCard';

const StudentDashboard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const run = async () => {
      const response = await api.get('/analytics/student-summary');
      setData(response.data.data);
    };
    run();
  }, []);

  if (!data) return <Loading text="Loading student dashboard..." />;

  return (
    <div>
      <div className="page-header">
        <h1>Student Dashboard</h1>
        <p className="muted">
          See your personal performance, fuzzy attainment, risk warnings, and course wise results.
        </p>
      </div>

      <div className="grid grid-3">
        <StatCard label="Registered Results" value={data.totalCourses} subtitle="Open full results" to="/results" />
        <StatCard
          label="Average Fuzzy"
          value={data.averageFuzzy}
          subtitle="Open performance guide"
          to="/student/performance"
        />
        <StatCard label="Alerts" value={data.alerts.length} subtitle="Open notifications" to="/notifications" />
      </div>

      <div className="card">
        <div className="section-header-inline">
          <div>
            <h3>Recent Alerts</h3>
            <p className="muted">Alerts are generated automatically when performance is risky.</p>
          </div>
          <Link to="/notifications" className="btn btn-secondary btn-small">
            View Notifications
          </Link>
        </div>
        {data.alerts.length === 0 ? (
          <p className="muted">No alerts yet.</p>
        ) : (
          <ul className="simple-list">
            {data.alerts.map((alert, index) => (
              <li key={`${alert.course}-${index}`}>
                <strong>{alert.course}:</strong> {alert.message}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <div className="section-header-inline">
          <div>
            <h3>Course Results</h3>
            <p className="muted">See the detailed interpretation page for study guidance.</p>
          </div>
          <Link to="/student/performance" className="btn btn-secondary btn-small">
            Open Guide
          </Link>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Fuzzy Score</th>
              <th>Risk</th>
            </tr>
          </thead>
          <tbody>
            {data.results.map((item) => (
              <tr key={item._id}>
                <td>{item.course?.code}</td>
                <td>{item.fuzzyScore}</td>
                <td>{item.riskBand}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentDashboard;
