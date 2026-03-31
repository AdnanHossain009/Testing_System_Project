import { useEffect, useState } from 'react';
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
        <StatCard label="Registered Results" value={data.totalCourses} />
        <StatCard label="Average Fuzzy" value={data.averageFuzzy} />
        <StatCard label="Alerts" value={data.alerts.length} />
      </div>

      <div className="card">
        <h3>Recent Alerts</h3>
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
        <h3>Course Results</h3>
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
