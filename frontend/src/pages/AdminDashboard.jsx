import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Loading from '../components/Loading';
import StatCard from '../components/StatCard';

const roleLabels = {
  admin: 'Admin',
  faculty: 'Faculty',
  student: 'Student',
  head: 'Department Head',
  accreditation_officer: 'Accreditation Officer'
};

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
        <StatCard label="Users" value={data.userCount} />
        <StatCard label="Courses" value={data.courseCount} />
        <StatCard label="Departments" value={data.departmentCount} />
        <StatCard label="High Risk Students" value={data.highRiskCount} />
      </div>

      <div className="inline-actions" style={{ marginBottom: '1rem' }}>
        <Link className="btn btn-secondary" to="/users">
          View Users
        </Link>
        <Link className="btn btn-secondary" to="/high-risk-students">
          View High Risk Students
        </Link>
      </div>

      <div className="card">
        <h3>Users by Role</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {data.roleStats.map((item) => (
              <tr key={item._id}>
                <td>{roleLabels[item._id] || item._id}</td>
                <td>{item.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
