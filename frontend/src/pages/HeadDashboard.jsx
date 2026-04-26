import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Loading from '../components/Loading';
import StatCard from '../components/StatCard';

const summarizeClos = (course) => (course?.clos?.length ? course.clos.map((item) => item.code).join(', ') : 'N/A');

const summarizePlos = (mappings = []) => {
  const ploCodes = Array.from(new Set((mappings || []).map((item) => item.ploCode)));
  return ploCodes.length ? ploCodes.join(', ') : 'N/A';
};

const formatDate = (value) => (value ? new Date(value).toLocaleString() : 'N/A');

const HeadDashboard = () => {
  const [data, setData] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [facultyMembers, setFacultyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [busyKey, setBusyKey] = useState('');

  const currentAccreditationOfficer = useMemo(
    () => facultyMembers.find((item) => item.assignedRoles?.includes('accreditation_officer')) || null,
    [facultyMembers]
  );

  const loadDashboard = async () => {
    let nextMessage = '';
    const [summaryResult, inboxResult, approvalResult, facultyResult] = await Promise.allSettled([
      api.get('/analytics/head-summary'),
      api.get('/course-requests/inbox'),
      api.get('/users/pending-approvals'),
      api.get('/users', { params: { role: 'faculty' } })
    ]);

    if (summaryResult.status === 'fulfilled') {
      setData(summaryResult.value.data.data);
    } else {
      nextMessage = summaryResult.reason?.response?.data?.message || 'Failed to load department head dashboard.';
    }

    if (inboxResult.status === 'fulfilled') {
      setPendingRequests(inboxResult.value.data.data.requests || []);
    } else if (!nextMessage) {
      nextMessage = inboxResult.reason?.response?.data?.message || 'Failed to load faculty course requests.';
    }

    if (approvalResult.status === 'fulfilled') {
      setPendingApprovals(approvalResult.value.data.data.users || []);
    } else if (!nextMessage) {
      nextMessage = approvalResult.reason?.response?.data?.message || 'Failed to load signup approvals.';
    }

    if (facultyResult.status === 'fulfilled') {
      setFacultyMembers(facultyResult.value.data.data.users || []);
    } else if (!nextMessage) {
      nextMessage = facultyResult.reason?.response?.data?.message || 'Failed to load faculty directory.';
    }

    setMessage(nextMessage);
    setLoading(false);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleSignupDecision = async (userId, decision) => {
    setBusyKey(`${decision}-${userId}`);
    setMessage('');

    try {
      await api.patch(`/users/${userId}/review-approval`, { decision });
      setMessage(decision === 'approve' ? 'Signup request approved.' : 'Signup request rejected.');
      await loadDashboard();
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to review this signup request.');
    } finally {
      setBusyKey('');
    }
  };

  const handleAssignAccreditation = async (userId) => {
    setBusyKey(`assign-${userId}`);
    setMessage('');

    try {
      await api.patch(`/users/${userId}/assign-accreditation-officer`);
      setMessage('Accreditation officer assignment updated.');
      await loadDashboard();
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to assign accreditation officer access.');
    } finally {
      setBusyKey('');
    }
  };

  if (loading) return <Loading text="Loading department head dashboard..." />;
  if (!data) return <div className="error-box">{message || 'Unable to load head dashboard.'}</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Department Head Dashboard</h1>
        <p className="muted">
          Approve new faculty and student accounts, appoint the accreditation officer, and review course requests in one place.
        </p>
      </div>

      {message ? <div className={message.toLowerCase().includes('failed') ? 'error-box' : 'success-box'}>{message}</div> : null}

      <div className="grid grid-4">
        <StatCard label="Department" value={data.department?.code || 'N/A'} />
        <StatCard label="Faculty Members" value={facultyMembers.length} />
        <StatCard label="Pending Signups" value={pendingApprovals.length} />
        <StatCard label="Pending Course Requests" value={pendingRequests.length} />
        <StatCard
          label="Accreditation Officer"
          value={currentAccreditationOfficer?.name || 'Not Assigned'}
          subtitle={currentAccreditationOfficer?.facultyId || 'Assign from faculty list'}
        />
      </div>

      <div className="inline-actions" style={{ marginBottom: '1rem' }}>
        <Link className="btn btn-secondary" to="/head/course-requests">
          Open Course Requests
        </Link>
        <Link className="btn btn-secondary" to="/courses">
          View Department Courses
        </Link>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="section-heading">
          <div>
            <h3>Pending Student and Faculty Approvals</h3>
            <p className="muted">New student and faculty accounts remain blocked until you approve them here.</p>
          </div>
          <span className="status-badge badge-warning">{pendingApprovals.length} pending</span>
        </div>

        {pendingApprovals.length === 0 ? (
          <p className="muted">No pending student or faculty signup requests.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Department</th>
                <th>Identity</th>
                <th>Requested At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingApprovals.map((item) => (
                <tr key={item._id}>
                  <td>
                    <strong>{item.name}</strong>
                    <div className="muted">{item.email}</div>
                  </td>
                  <td>{item.role === 'student' ? 'Student' : 'Faculty'}</td>
                  <td>{item.department?.code || 'N/A'}</td>
                  <td>{item.studentId || item.facultyId || 'N/A'}</td>
                  <td>{formatDate(item.createdAt)}</td>
                  <td>
                    <div className="inline-actions">
                      <button
                        className="btn"
                        type="button"
                        onClick={() => handleSignupDecision(item._id, 'approve')}
                        disabled={busyKey === `approve-${item._id}`}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => handleSignupDecision(item._id, 'reject')}
                        disabled={busyKey === `reject-${item._id}`}
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

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="section-heading">
          <div>
            <h3>Department Faculty Directory</h3>
            <p className="muted">Choose one approved faculty member to hold accreditation officer access.</p>
          </div>
          <span className="status-badge badge-muted">{facultyMembers.length} faculty</span>
        </div>

        {facultyMembers.length === 0 ? (
          <p className="muted">No faculty members are registered in this department yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Faculty</th>
                <th>Faculty ID</th>
                <th>Status</th>
                <th>Role Access</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {facultyMembers.map((item) => {
                const isAssigned = item.assignedRoles?.includes('accreditation_officer');

                return (
                  <tr key={item._id}>
                    <td>
                      <strong>{item.name}</strong>
                      <div className="muted">{item.email}</div>
                    </td>
                    <td>{item.facultyId || 'N/A'}</td>
                    <td>{(item.approvalStatus || 'approved') === 'approved' && item.isActive ? 'Approved' : item.approvalStatus || 'approved'}</td>
                    <td>{isAssigned ? 'Faculty / Accreditation Officer' : 'Faculty'}</td>
                    <td>
                      <button
                        className={isAssigned ? 'btn btn-secondary' : 'btn'}
                        type="button"
                        onClick={() => handleAssignAccreditation(item._id)}
                        disabled={
                          busyKey === `assign-${item._id}` ||
                          !item.isActive ||
                          (item.approvalStatus || 'approved') !== 'approved'
                        }
                      >
                        {isAssigned ? 'Assigned' : 'Assign as Accreditation Officer'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3>Pending Faculty Course Requests</h3>
        {pendingRequests.length === 0 ? (
          <p className="muted">No pending faculty course requests.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Faculty</th>
                <th>Course</th>
                <th>CLOs</th>
                <th>PLOs</th>
                <th>Requested At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.map((item) => (
                <tr key={item._id}>
                  <td>
                    <strong>{item.requester?.name}</strong>
                    <div className="muted">{item.requester?.facultyId || item.requester?.email}</div>
                  </td>
                  <td>
                    <strong>{item.proposedCourse?.code}</strong>
                    <div className="muted">{item.proposedCourse?.name}</div>
                  </td>
                  <td>{summarizeClos(item.proposedCourse)}</td>
                  <td>{summarizePlos(item.proposedMappings)}</td>
                  <td>{formatDate(item.createdAt)}</td>
                  <td>
                    <Link className="btn btn-secondary" to={`/head/course-requests/${item._id}`}>
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
