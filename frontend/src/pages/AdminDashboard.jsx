import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Loading from '../components/Loading';
import StatCard from '../components/StatCard';
import { getRoleOptions } from '../utils/roleUtils';

const roleLabels = getRoleOptions();

const formatDate = (value) => (value ? new Date(value).toLocaleString() : 'N/A');

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [pendingHeadApprovals, setPendingHeadApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [busyUserId, setBusyUserId] = useState('');

  const loadDashboard = async () => {
    let nextMessage = '';
    const [summaryResult, pendingResult] = await Promise.allSettled([
      api.get('/analytics/admin-summary'),
      api.get('/users/pending-approvals')
    ]);

    if (summaryResult.status === 'fulfilled') {
      setData(summaryResult.value.data.data);
    } else {
      nextMessage = summaryResult.reason?.response?.data?.message || 'Failed to load admin dashboard.';
    }

    if (pendingResult.status === 'fulfilled') {
      setPendingHeadApprovals(pendingResult.value.data.data.users || []);
    } else if (!nextMessage) {
      nextMessage = pendingResult.reason?.response?.data?.message || 'Failed to load pending head approvals.';
    }

    setMessage(nextMessage);
    setLoading(false);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleApproval = async (userId, decision) => {
    setBusyUserId(userId);
    setMessage('');

    try {
      await api.patch(`/users/${userId}/review-approval`, { decision });
      setMessage(decision === 'approve' ? 'Department head approved.' : 'Department head request rejected.');
      await loadDashboard();
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to review this signup request.');
    } finally {
      setBusyUserId('');
    }
  };

  if (loading) return <Loading text="Loading admin dashboard..." />;
  if (!data) return <div className="error-box">{message || 'Unable to load admin dashboard.'}</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p className="muted">
          Monitor platform-wide statistics, approve department head accounts, and keep core administration moving.
        </p>
      </div>

      {message ? <div className={message.toLowerCase().includes('failed') ? 'error-box' : 'success-box'}>{message}</div> : null}

      <div className="grid grid-4">
        <StatCard label="Users" value={data.userCount} />
        <StatCard label="Courses" value={data.courseCount} />
        <StatCard label="Departments" value={data.departmentCount} />
        <StatCard label="Pending Head Signups" value={pendingHeadApprovals.length} />
        <StatCard label="High Risk Students" value={data.highRiskCount} />
      </div>

      <div className="inline-actions" style={{ marginBottom: '1rem' }}>
        <Link className="btn btn-secondary" to="/users">
          View Users
        </Link>
        <Link className="btn btn-secondary" to="/departments">
          Manage Departments
        </Link>
        <Link className="btn btn-secondary" to="/high-risk-students">
          View High Risk Students
        </Link>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="section-heading">
          <div>
            <h3>Pending Department Head Approvals</h3>
            <p className="muted">Head accounts stay blocked until admin approval is completed here.</p>
          </div>
          <span className="status-badge badge-warning">{pendingHeadApprovals.length} pending</span>
        </div>

        {pendingHeadApprovals.length === 0 ? (
          <p className="muted">No department head signup requests are waiting for review.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Department</th>
                <th>Email</th>
                <th>Requested At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingHeadApprovals.map((item) => (
                <tr key={item._id}>
                  <td>
                    <strong>{item.name}</strong>
                  </td>
                  <td>{item.department?.code || item.department?.name || 'N/A'}</td>
                  <td>{item.email}</td>
                  <td>{formatDate(item.createdAt)}</td>
                  <td>
                    <div className="inline-actions">
                      <button
                        className="btn"
                        type="button"
                        onClick={() => handleApproval(item._id, 'approve')}
                        disabled={busyUserId === item._id}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => handleApproval(item._id, 'reject')}
                        disabled={busyUserId === item._id}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
