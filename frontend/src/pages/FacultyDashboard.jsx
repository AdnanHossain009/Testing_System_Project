import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Loading from '../components/Loading';
import StatCard from '../components/StatCard';

const summarizeClos = (course) => (course?.clos?.length ? course.clos.map((item) => item.code).join(', ') : 'N/A');

const summarizePlos = (mapping) => {
  const ploCodes = Array.from(new Set((mapping?.mappings || []).map((item) => item.ploCode)));
  return ploCodes.length ? ploCodes.join(', ') : 'N/A';
};

const formatDate = (value) => (value ? new Date(value).toLocaleString() : 'N/A');

const FacultyDashboard = () => {
  const [data, setData] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [busyRequestId, setBusyRequestId] = useState('');

  const loadDashboard = async () => {
    const [summaryResult, inboxResult] = await Promise.allSettled([
      api.get('/analytics/faculty-summary'),
      api.get('/course-requests/inbox')
    ]);

    if (summaryResult.status === 'fulfilled') {
      setData(summaryResult.value.data.data);
    } else {
      setMessage(summaryResult.reason?.response?.data?.message || 'Failed to load faculty summary.');
    }

    if (inboxResult.status === 'fulfilled') {
      setPendingRequests(inboxResult.value.data.data.requests || []);
    } else if (!message) {
      setMessage(inboxResult.reason?.response?.data?.message || 'Failed to load enrollment requests.');
    }

    setLoading(false);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleRequestDecision = async (requestId, action) => {
    setBusyRequestId(requestId);
    setMessage('');

    try {
      await api.patch(`/course-requests/${requestId}/${action}`);
      setMessage(action === 'approve' ? 'Request approved.' : 'Request rejected.');
      await loadDashboard();
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to update request.');
    } finally {
      setBusyRequestId('');
    }
  };

  if (loading) return <Loading text="Loading faculty dashboard..." />;
  if (!data) return <div className="error-box">{message || 'Unable to load faculty dashboard.'}</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Faculty Dashboard</h1>
        <p className="muted">
          Review your courses, approve student enrollments, and track your course analytics.
        </p>
      </div>

      {message ? <div className={message.toLowerCase().includes('failed') ? 'error-box' : 'success-box'}>{message}</div> : null}

      <div className="grid grid-3">
        <StatCard label="Assigned Courses" value={data.totalCourses} />
        <StatCard label="Weak Students" value={data.weakStudents.length} />
        <StatCard
          label="Tracked Courses"
          value={data.coursePerformance.length}
          subtitle="Courses with analytics"
        />
      </div>

      <div className="inline-actions" style={{ marginBottom: '1rem' }}>
        <Link className="btn btn-secondary" to="/faculty/courses">
          View Assigned Courses
        </Link>
        <Link className="btn btn-secondary" to="/faculty/weak-students">
          View Weak Students
        </Link>
        <Link className="btn btn-secondary" to="/course-requests">
          Request New Course
        </Link>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3>Pending Student Enrollment Requests</h3>
        {pendingRequests.length === 0 ? (
          <p className="muted">No pending enrollment requests.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
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
                    <div className="muted">{item.requester?.studentId || item.requester?.email}</div>
                  </td>
                  <td>
                    <strong>{item.course?.code}</strong>
                    <div className="muted">{item.course?.name}</div>
                  </td>
                  <td>{summarizeClos(item.course)}</td>
                  <td>{summarizePlos(item.course?.cloPloMapping)}</td>
                  <td>{formatDate(item.createdAt)}</td>
                  <td>
                    <div className="inline-actions">
                      <button
                        className="btn"
                        onClick={() => handleRequestDecision(item._id, 'approve')}
                        disabled={busyRequestId === item._id}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleRequestDecision(item._id, 'reject')}
                        disabled={busyRequestId === item._id}
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
        <h3>Course Performance</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Average Fuzzy</th>
              <th>Total Students</th>
            </tr>
          </thead>
          <tbody>
            {data.coursePerformance.map((item) => (
              <tr key={item.courseId}>
                <td>
                  {item.courseCode} - {item.courseName}
                </td>
                <td>{item.averageFuzzy}</td>
                <td>{item.totalStudents}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Weak Students</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Risk Score</th>
              <th>Risk Band</th>
            </tr>
          </thead>
          <tbody>
            {data.weakStudents.map((item) => (
              <tr key={item._id}>
                <td>{item.student?.name}</td>
                <td>{item.riskScore}</td>
                <td>{item.riskBand}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FacultyDashboard;
