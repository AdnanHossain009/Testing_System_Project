import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Loading from '../components/Loading';
import StatCard from '../components/StatCard';

const HeadDashboard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const run = async () => {
      const response = await api.get('/analytics/head-summary');
      setData(response.data.data);
    };
    run();
  }, []);

  if (!data) return <Loading text="Loading department head dashboard..." />;

  return (
    <div>
      <div className="page-header">
        <h1>Department Head Dashboard</h1>
        <p className="muted">
          Program wise fuzzy attainment summary, department trend and course scale monitoring.
        </p>
      </div>

      <div className="grid grid-4">
        <StatCard label="Department" value={data.department?.code || 'N/A'} />
        <StatCard label="Courses" value={data.totalCourses} />
        <StatCard label="Stored Results" value={data.totalResults} />
        <StatCard label="Avg Department Fuzzy" value={data.averageDepartmentFuzzy} />
      </div>

      <div className="card">
        <h3>Program Analytics</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Program</th>
              <th>Average Fuzzy</th>
              <th>Result Count</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.programAnalytics.map((item) => (
              <tr key={item.programId}>
                <td>
                  {item.programCode} - {item.programName}
                </td>
                <td>{item.averageFuzzy}</td>
                <td>{item.count}</td>
                <td>
                  <Link className="btn btn-secondary" to={`/programs/${item.programId}`}>
                    View details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HeadDashboard;
