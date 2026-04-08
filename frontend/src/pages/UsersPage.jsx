import { useEffect, useState } from 'react';
import api from '../api/client';
import Loading from '../components/Loading';
import StatCard from '../components/StatCard';

const roleLabels = {
  admin: 'Admin',
  faculty: 'Faculty',
  student: 'Student',
  head: 'HOD'
};

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadUsers = async () => {
      setLoading(true);
      const response = await api.get('/users', {
        params: roleFilter ? { role: roleFilter } : {}
      });

      if (!active) return;

      const list = response.data.data.users || [];
      setUsers(list);
      setSelectedUser((current) => {
        if (current) {
          return list.find((item) => item._id === current._id) || list[0] || null;
        }

        return list[0] || null;
      });
      setLoading(false);
    };

    loadUsers();

    return () => {
      active = false;
    };
  }, [roleFilter]);

  if (loading) return <Loading text="Loading users..." />;

  const totals = {
    total: users.length,
    admin: users.filter((item) => item.role === 'admin').length,
    faculty: users.filter((item) => item.role === 'faculty').length,
    student: users.filter((item) => item.role === 'student').length
  };

  return (
    <div>
      <div className="page-header">
        <h1>Users</h1>
        <p className="muted">
          View all registered accounts and inspect department, program, and role-level details.
        </p>
      </div>

      <div className="grid grid-4">
        <StatCard label="Total Users" value={totals.total} />
        <StatCard label="Admins" value={totals.admin} />
        <StatCard label="Faculty" value={totals.faculty} />
        <StatCard label="Students" value={totals.student} />
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <label>Filter by Role</label>
        <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
          <option value="">All Roles</option>
          {Object.keys(roleLabels).map((role) => (
            <option value={role} key={role}>
              {roleLabels[role]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>User Directory</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Department</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr key={item._id}>
                  <td>
                    <strong>{item.name}</strong>
                    <div className="muted">{item.email}</div>
                  </td>
                  <td>{roleLabels[item.role] || item.role}</td>
                  <td>{item.department?.code || 'N/A'}</td>
                  <td>
                    <button className="btn btn-secondary" onClick={() => setSelectedUser(item)}>
                      View details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>User Details</h3>
          {selectedUser ? (
            <div className="simple-list">
              <p>
                <strong>Name:</strong> {selectedUser.name}
              </p>
              <p>
                <strong>Email:</strong> {selectedUser.email}
              </p>
              <p>
                <strong>Role:</strong> {roleLabels[selectedUser.role] || selectedUser.role}
              </p>
              <p>
                <strong>Department:</strong> {selectedUser.department?.name || 'N/A'}
              </p>
              <p>
                <strong>Program:</strong> {selectedUser.program?.name || 'N/A'}
              </p>
              <p>
                <strong>Account Status:</strong> {selectedUser.isActive ? 'Active' : 'Inactive'}
              </p>
              <p>
                <strong>Student ID:</strong> {selectedUser.studentId || 'N/A'}
              </p>
              <p>
                <strong>Faculty ID:</strong> {selectedUser.facultyId || 'N/A'}
              </p>
            </div>
          ) : (
            <p className="muted">Select a user to view details.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
