import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Loading from '../components/Loading';
import StatCard from '../components/StatCard';

const formatDate = (value) => (value ? new Date(value).toLocaleString() : 'N/A');

const EnrollmentHistoryPage = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      try {
        const [enrollmentResult, requestResult] = await Promise.all([
          api.get('/enrollments/me'),
          api.get('/course-requests/my', { params: { type: 'student_enrollment' } })
        ]);

        setEnrollments(enrollmentResult.data.data.enrollments || []);
        setRequests(requestResult.data.data.requests || []);
      } catch (requestError) {
        setError(requestError?.response?.data?.message || 'Failed to load enrollment history.');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  if (loading) return <Loading text="Loading enrollment history..." />;
  if (error) return <div className="error-box">{error}</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Enrollment History</h1>
        <p className="muted">
          Review approved enrollments and course requests in a separate place from the course catalog.
        </p>
      </div>

      <div className="grid grid-3">
        <StatCard label="Approved Enrollments" value={enrollments.length} />
        <StatCard label="Total Requests" value={requests.length} />
        <StatCard label="Pending Requests" value={requests.filter((item) => item.status === 'pending').length} />
      </div>

      <div className="inline-actions" style={{ marginBottom: '1rem' }}>
        <Link className="btn btn-secondary" to="/courses">
          Back to Courses
        </Link>
        <Link className="btn btn-secondary" to="/dashboard/student">
          Back to Dashboard
        </Link>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3>Approved Enrollments</h3>
        {enrollments.length === 0 ? (
          <p className="muted">No approved enrollments yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Faculty</th>
                <th>Department</th>
                <th>Program</th>
                <th>Enrolled At</th>
                <th>Approved By</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((item) => (
                <tr key={item._id}>
                  <td>
                    <strong>{item.course?.code}</strong>
                    <div className="muted">{item.course?.name}</div>
                  </td>
                  <td>{item.course?.faculty?.name || 'N/A'}</td>
                  <td>{item.course?.department?.code || 'N/A'}</td>
                  <td>{item.course?.program?.code || 'N/A'}</td>
                  <td>{formatDate(item.enrolledAt)}</td>
                  <td>{item.approvedBy?.name || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>Course Requests</h3>
        {requests.length === 0 ? (
          <p className="muted">No course requests found.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Faculty</th>
                <th>Status</th>
                <th>Requested At</th>
                <th>Reviewed By</th>
                <th>Reviewed At</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((item) => (
                <tr key={item._id}>
                  <td>
                    <strong>{item.course?.code || item.proposedCourse?.code}</strong>
                    <div className="muted">{item.course?.name || item.proposedCourse?.name}</div>
                  </td>
                  <td>{item.course?.faculty?.name || 'N/A'}</td>
                  <td>{item.status}</td>
                  <td>{formatDate(item.createdAt)}</td>
                  <td>{item.reviewedBy?.name || 'Pending'}</td>
                  <td>{formatDate(item.reviewedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default EnrollmentHistoryPage;