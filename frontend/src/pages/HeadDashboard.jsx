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
        <StatCard
          label="Department"
          value={data.department?.code || 'N/A'}
          subtitle="Open department overview"
          to="/head/department-overview"
        />
        <StatCard label="Courses" value={data.totalCourses} subtitle="Open course list" to="/courses" />
        <StatCard label="Stored Results" value={data.totalResults} subtitle="Open results page" to="/results" />
        <StatCard
          label="Avg Department Fuzzy"
          value={data.averageDepartmentFuzzy}
          subtitle="Open analytics"
          to="/analytics"
        />
      </div>

      <div className="card">
        <div className="section-header-inline">
          <div>
            <h3>Program Analytics</h3>
            <p className="muted">Use the overview page for department context and analytics for visuals.</p>
          </div>
          <Link to="/head/department-overview" className="btn btn-secondary btn-small">
            Department Overview
          </Link>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Program</th>
              <th>Average Fuzzy</th>
              <th>Result Count</th>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HeadDashboard;
