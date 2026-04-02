import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import Loading from '../components/Loading';

const roleOrder = ['all', 'admin', 'faculty', 'student', 'head'];

const roleLabelMap = {
  admin: 'Administrator',
  faculty: 'Faculty',
  student: 'Student',
  head: 'Department Head'
};

const UsersPage = () => {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedRole = searchParams.get('role') || 'all';

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await api.get('/users');
        setUsers(response.data.data.users || []);
      } catch (loadError) {
        setError(loadError?.response?.data?.message || 'Unable to load user directory.');
        setUsers([]);
      }
    };

    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (selectedRole === 'all') return users;
    return users.filter((item) => item.role === selectedRole);
  }, [users, selectedRole]);

  const roleCounts = useMemo(() => {
    if (!users) return {};
    return users.reduce(
      (accumulator, item) => {
        accumulator[item.role] = (accumulator[item.role] || 0) + 1;
        return accumulator;
      },
      { admin: 0, faculty: 0, student: 0, head: 0 }
    );
  }, [users]);

  if (!users) return <Loading text="Loading user directory..." />;

  return (
    <div>
      <div className="page-header">
        <h1>Users Directory</h1>
        <p className="muted">
          Review all registered users, understand role distribution, and see which department or
          program they belong to.
        </p>
      </div>

      <div className="info-panel">
        <div>
          <h3>What this page shows</h3>
          <p className="muted">
            This page gives the admin a quick overview of every user account in the platform.
            Use it to verify seeded users, check role allocation, and confirm department or
            program assignments before data entry starts.
          </p>
        </div>
        <div className="info-panel__tips">
          <span className="pill">Admin manages system access</span>
          <span className="pill">Faculty enter assessments</span>
          <span className="pill">Students view results</span>
          <span className="pill">Heads review department performance</span>
        </div>
      </div>

      {error ? <div className="error-box">{error}</div> : null}

      <div className="grid grid-4">
        <div className="card stat-card compact-card">
          <div className="stat-value">{users.length}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="card stat-card compact-card">
          <div className="stat-value">{roleCounts.faculty || 0}</div>
          <div className="stat-label">Faculty</div>
        </div>
        <div className="card stat-card compact-card">
          <div className="stat-value">{roleCounts.student || 0}</div>
          <div className="stat-label">Students</div>
        </div>
        <div className="card stat-card compact-card">
          <div className="stat-value">{(roleCounts.admin || 0) + (roleCounts.head || 0)}</div>
          <div className="stat-label">Leadership Roles</div>
        </div>
      </div>

      <div className="card filter-card">
        <h3>Filter by role</h3>
        <div className="chip-row">
          {roleOrder.map((role) => (
            <button
              key={role}
              type="button"
              className={`chip-button ${selectedRole === role ? 'active' : ''}`}
              onClick={() => setSearchParams(role === 'all' ? {} : { role })}
            >
              {role === 'all' ? 'All Users' : roleLabelMap[role]}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>User List</h3>
        {filteredUsers.length === 0 ? (
          <p className="muted">No users found for this filter.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Email</th>
                <th>Department</th>
                <th>Program</th>
                <th>Identifier</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((item) => (
                <tr key={item._id}>
                  <td>{item.name}</td>
                  <td>{roleLabelMap[item.role] || item.role}</td>
                  <td>{item.email}</td>
                  <td>{item.department?.code || '—'}</td>
                  <td>{item.program?.code || '—'}</td>
                  <td>{item.studentId || item.facultyId || 'System user'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
