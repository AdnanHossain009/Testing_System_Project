import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Loading from '../components/Loading';
import StatCard from '../components/StatCard';

const AdminDashboard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const run = async () => {
      const response = await api.get('/analytics/admin-summary');
      setData(response.data.data);
    };
    run();
  }, []);

  if (!data) return <Loading text="Loading admin dashboard..." />;

  return (
    <div>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p className="muted">
          Overall platform statistics, risk overview, and system level management insight.
        </p>
      </div>

      <div className="grid grid-4">
        <StatCard label="Users" value={data.userCount} subtitle="Open user directory" to="/users" />
        <StatCard label="Courses" value={data.courseCount} subtitle="Review course records" to="/courses" />
        <StatCard label="Departments" value={data.departmentCount} subtitle="Open department page" to="/departments" />
        <StatCard
          label="High Risk Students"
          value={data.highRiskCount}
          subtitle="See intervention list"
          to="/risk-monitor"
        />
      </div>

      <div className="card">
        <div className="section-header-inline">
          <div>
            <h3>Users by Role</h3>
            <p className="muted">Use the quick links to jump to filtered user lists.</p>
          </div>
          <Link to="/users" className="btn btn-secondary btn-small">
            Open Users Page
          </Link>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Count</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.roleStats.map((item) => (
              <tr key={item._id}>
                <td>{item._id}</td>
                <td>{item.count}</td>
                <td>
                  <Link to={`/users?role=${item._id}`} className="text-link">
                    View users
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

export default AdminDashboard;
