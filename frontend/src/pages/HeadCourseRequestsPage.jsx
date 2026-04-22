import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Loading from '../components/Loading';
import { formatFileSize, getStatusClassName } from '../utils/courseRequestHelpers';

const statusFilters = ['pending', 'approved', 'rejected'];

const HeadCourseRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadRequests = async (selectedStatus = status) => {
    const response = await api.get('/course-requests/inbox', {
      params: {
        status: selectedStatus
      }
    });

    setRequests(response.data.data.requests || []);
  };

  useEffect(() => {
    const run = async () => {
      try {
        await loadRequests(status);
      } catch (error) {
        setMessage(error?.response?.data?.message || 'Failed to load course requests.');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [status]);

  if (loading) return <Loading text="Loading course requests..." />;

  return (
    <div>
      <div className="page-header">
        <h1>Course Requests</h1>
        <p className="muted">
          Review faculty-submitted course requests, extracted PDF data, and approval history.
        </p>
      </div>

      {message ? <div className="error-box">{message}</div> : null}

      <div className="inline-actions" style={{ marginBottom: '1rem' }}>
        {statusFilters.map((item) => (
          <button
            key={item}
            type="button"
            className={`btn ${status === item ? '' : 'btn-secondary'}`}
            onClick={() => setStatus(item)}
          >
            {item.charAt(0).toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="section-heading">
          <div>
            <h3>{status.charAt(0).toUpperCase() + status.slice(1)} Requests</h3>
            <p className="muted">Open a request to review extracted CLOs, PLOs, mappings, assessments, and approval notes.</p>
          </div>
          <span className={`status-badge ${getStatusClassName(status)}`}>{requests.length} requests</span>
        </div>

        {requests.length === 0 ? (
          <p className="muted">No {status} faculty course requests found.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Faculty</th>
                <th>Course</th>
                <th>PDF</th>
                <th>Extraction</th>
                <th>Submitted</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((item) => (
                <tr key={item._id}>
                  <td>
                    <strong>{item.requester?.name}</strong>
                    <div className="muted">{item.requester?.facultyId || item.requester?.email}</div>
                  </td>
                  <td>
                    <strong>{item.proposedCourse?.code}</strong>
                    <div className="muted">{item.proposedCourse?.name}</div>
                    <div className="muted">
                      CLOs {item.proposedCourse?.clos?.length || 0}, PLOs {item.proposedPlos?.length || 0}, Assessments{' '}
                      {item.proposedAssessments?.length || 0}
                    </div>
                  </td>
                  <td>
                    {item.uploadedPdf ? (
                      <>
                        <div>{item.uploadedPdf.originalName}</div>
                        <div className="muted">{formatFileSize(item.uploadedPdf.size)}</div>
                      </>
                    ) : (
                      <span className="muted">No PDF</span>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusClassName(item.extraction?.status)}`}>
                      {item.extraction?.status || 'not_started'}
                    </span>
                    {item.extraction?.warnings?.length ? <div className="muted">{item.extraction.warnings.length} warnings</div> : null}
                  </td>
                  <td>{new Date(item.createdAt).toLocaleString()}</td>
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
    </div>
  );
};

export default HeadCourseRequestsPage;
