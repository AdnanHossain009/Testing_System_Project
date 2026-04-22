import { useEffect, useState } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadDashboard = async () => {
    const [summaryResult, inboxResult] = await Promise.allSettled([
      api.get('/analytics/head-summary'),
      api.get('/course-requests/inbox')
    ]);

    if (summaryResult.status === 'fulfilled') {
      setData(summaryResult.value.data.data);
    } else {
      setMessage(summaryResult.reason?.response?.data?.message || 'Failed to load head summary.');
    }

    if (inboxResult.status === 'fulfilled') {
      setPendingRequests(inboxResult.value.data.data.requests || []);
    } else if (!message) {
      setMessage(inboxResult.reason?.response?.data?.message || 'Failed to load course requests.');
    }

    setLoading(false);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) return <Loading text="Loading department head dashboard..." />;
  if (!data) return <div className="error-box">{message || 'Unable to load head dashboard.'}</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Department Head Dashboard</h1>
        <p className="muted">
          Review pending faculty course requests, program wise attainment, and department trends.
        </p>
      </div>

      {message ? <div className={message.toLowerCase().includes('failed') ? 'error-box' : 'success-box'}>{message}</div> : null}

      <div className="grid grid-4">
        <StatCard label="Department" value={data.department?.code || 'N/A'} />
        <StatCard label="Courses" value={data.totalCourses} />
        <StatCard label="Stored Results" value={data.totalResults} />
        <StatCard label="Avg Department Fuzzy" value={data.averageDepartmentFuzzy} />
      </div>

      <div className="inline-actions" style={{ marginBottom: '1rem' }}>
        <Link className="btn btn-secondary" to="/head/course-requests">
          Open Course Requests
        </Link>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3>Pending Faculty Course Requests</h3>
        {pendingRequests.length === 0 ? (
          <p className="muted">No pending faculty requests.</p>
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
