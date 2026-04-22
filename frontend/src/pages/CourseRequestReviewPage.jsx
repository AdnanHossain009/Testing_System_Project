import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import Loading from '../components/Loading';
import { formatFileSize, getStatusClassName } from '../utils/courseRequestHelpers';

const formatDistribution = (distribution = []) =>
  distribution?.length ? distribution.map((item) => `${item.cloCode}:${item.marks}`).join(', ') : 'N/A';

const CourseRequestReviewPage = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [message, setMessage] = useState('');
  const programLabel =
    request?.proposedCourse?.program?.code ||
    request?.proposedCourse?.program?.name ||
    request?.proposedCourse?.program ||
    'N/A';
  const departmentLabel =
    request?.proposedCourse?.department?.code ||
    request?.proposedCourse?.department?.name ||
    request?.proposedCourse?.department ||
    'N/A';

  const loadRequest = async () => {
    const response = await api.get(`/course-requests/${requestId}`);
    const nextRequest = response.data.data.request;
    setRequest(nextRequest);
    setReviewNote(nextRequest?.reviewNote || '');
  };

  useEffect(() => {
    const run = async () => {
      try {
        await loadRequest();
      } catch (error) {
        setMessage(error?.response?.data?.message || 'Failed to load course request.');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [requestId]);

  const handleDecision = async (action) => {
    setBusyAction(action);
    setMessage('');

    try {
      await api.patch(`/course-requests/${requestId}/${action}`, { reviewNote });
      await loadRequest();
      setMessage(action === 'approve' ? 'Course request approved successfully.' : 'Course request rejected.');
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to update the request.');
    } finally {
      setBusyAction('');
    }
  };

  if (loading) return <Loading text="Loading course request..." />;
  if (!request) return <div className="error-box">{message || 'Course request not found.'}</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Course Request Review</h1>
        <p className="muted">
          Review the uploaded PDF metadata, extracted data, and final values before approving the course.
        </p>
      </div>

      {message ? <div className={message.toLowerCase().includes('failed') ? 'error-box' : 'success-box'}>{message}</div> : null}

      <div className="inline-actions" style={{ marginBottom: '1rem' }}>
        <Link className="btn btn-secondary" to="/head/course-requests">
          Back to Requests
        </Link>
        {request.course?._id ? (
          <Link className="btn btn-secondary" to={`/courses/${request.course._id}`}>
            Open Approved Course
          </Link>
        ) : null}
        <button className="btn btn-secondary" type="button" onClick={() => navigate('/dashboard/head')}>
          Head Dashboard
        </button>
      </div>

      <div className="grid grid-3">
        <div className="card stat-card">
          <span className="stat-label">Faculty</span>
          <span className="stat-value">{request.requester?.name || 'N/A'}</span>
          <span className="muted">{request.requester?.facultyId || request.requester?.email}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Course</span>
          <span className="stat-value">{request.proposedCourse?.code || 'N/A'}</span>
          <span className="muted">{request.proposedCourse?.name || 'Untitled request'}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Status</span>
          <span className={`status-badge ${getStatusClassName(request.status)}`}>{request.status}</span>
          <span className="muted">{new Date(request.createdAt).toLocaleString()}</span>
        </div>
      </div>

      <div className="grid grid-2">
        <section className="card">
          <div className="section-heading">
            <div>
              <h3>Course Information</h3>
              <p className="muted">The final course details that will be promoted if approved.</p>
            </div>
            <span className={`status-badge ${getStatusClassName(request.extraction?.status)}`}>
              Extraction {request.extraction?.status || 'not_started'}
            </span>
          </div>

          <div className="request-meta-grid">
            <span>
              <strong>Credits:</strong> {request.proposedCourse?.credits}
            </span>
            <span>
              <strong>Semester:</strong> {request.proposedCourse?.semester}
            </span>
            <span>
              <strong>Program:</strong> {programLabel}
            </span>
            <span>
              <strong>Department:</strong> {departmentLabel}
            </span>
          </div>

          {request.proposedCourse?.description ? (
            <div className="soft-panel">
              <strong>Description</strong>
              <p className="muted" style={{ marginBottom: 0 }}>
                {request.proposedCourse.description}
              </p>
            </div>
          ) : null}

          {request.note ? (
            <div className="soft-panel">
              <strong>Faculty Note</strong>
              <p className="muted" style={{ marginBottom: 0 }}>
                {request.note}
              </p>
            </div>
          ) : null}
        </section>

        <section className="card">
          <div className="section-heading">
            <div>
              <h3>PDF Metadata</h3>
              <p className="muted">Stored PDF details and extraction warnings for quick review.</p>
            </div>
            {request.uploadedPdf ? (
              <span className="status-badge badge-muted">{request.uploadedPdf.pageCount || 0} pages</span>
            ) : null}
          </div>

          {request.uploadedPdf ? (
            <>
              <div className="request-meta-grid">
                <span>
                  <strong>File:</strong> {request.uploadedPdf.originalName}
                </span>
                <span>
                  <strong>Size:</strong> {formatFileSize(request.uploadedPdf.size)}
                </span>
                <span>
                  <strong>MIME:</strong> {request.uploadedPdf.mimeType}
                </span>
                <span>
                  <strong>Uploaded:</strong> {new Date(request.uploadedPdf.uploadedAt).toLocaleString()}
                </span>
              </div>
            </>
          ) : (
            <p className="muted">No PDF was attached to this request.</p>
          )}

          {request.extraction?.warnings?.length ? (
            <div className="soft-warning">
              <strong>Extraction Warnings</strong>
              <ul className="simple-list">
                {request.extraction.warnings.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {request.extraction?.textPreview ? (
            <>
              <label>Text Preview</label>
              <textarea rows="7" readOnly value={request.extraction.textPreview} />
            </>
          ) : null}
        </section>
      </div>

      <div className="grid grid-2">
        <section className="card">
          <h3>CLOs</h3>
          {request.proposedCourse?.clos?.length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Description</th>
                  <th>Bloom</th>
                </tr>
              </thead>
              <tbody>
                {request.proposedCourse.clos.map((item) => (
                  <tr key={item.code}>
                    <td>{item.code}</td>
                    <td>{item.description}</td>
                    <td>{item.bloomLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">No CLOs were submitted.</p>
          )}
        </section>

        <section className="card">
          <h3>PLOs</h3>
          {request.proposedPlos?.length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {request.proposedPlos.map((item) => (
                  <tr key={item.code}>
                    <td>{item.code}</td>
                    <td>{item.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">No new PLO rows were submitted with this request.</p>
          )}
        </section>
      </div>

      <div className="grid grid-2">
        <section className="card">
          <h3>CLO-PLO Mapping</h3>
          {request.proposedMappings?.length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>CLO</th>
                  <th>PLO</th>
                  <th>Weight</th>
                </tr>
              </thead>
              <tbody>
                {request.proposedMappings.map((item, index) => (
                  <tr key={`${item.cloCode}-${item.ploCode}-${index}`}>
                    <td>{item.cloCode}</td>
                    <td>{item.ploCode}</td>
                    <td>{item.weight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">No mapping rows were submitted.</p>
          )}
        </section>

        <section className="card">
          <h3>Assessments</h3>
          {request.proposedAssessments?.length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Weightage</th>
                  <th>Total Marks</th>
                  <th>CLO Split</th>
                </tr>
              </thead>
              <tbody>
                {request.proposedAssessments.map((item, index) => (
                  <tr key={`${item.title}-${index}`}>
                    <td>{item.title}</td>
                    <td>{item.type}</td>
                    <td>{item.weightage}%</td>
                    <td>{item.totalMarks}</td>
                    <td>{formatDistribution(item.cloDistribution || [])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">No assessment rows were submitted.</p>
          )}
        </section>
      </div>

      <section className="card">
        <div className="section-heading">
          <div>
            <h3>Decision</h3>
            <p className="muted">Provide an approval note or rejection reason before finalizing the request.</p>
          </div>
          {request.reviewedBy ? (
            <span className="status-badge badge-muted">Reviewed by {request.reviewedBy.name}</span>
          ) : null}
        </div>

        <label>Review Note / Rejection Reason</label>
        <textarea
          rows="3"
          value={reviewNote}
          onChange={(e) => setReviewNote(e.target.value)}
          disabled={request.status !== 'pending'}
        />

        {request.status === 'pending' ? (
          <div className="inline-actions">
            <button className="btn" type="button" onClick={() => handleDecision('approve')} disabled={busyAction === 'approve'}>
              {busyAction === 'approve' ? 'Approving...' : 'Approve Request'}
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => handleDecision('reject')}
              disabled={busyAction === 'reject'}
            >
              {busyAction === 'reject' ? 'Rejecting...' : 'Reject Request'}
            </button>
          </div>
        ) : (
          <p className="muted">
            This request was {request.status} on {request.reviewedAt ? new Date(request.reviewedAt).toLocaleString() : 'N/A'}.
          </p>
        )}
      </section>
    </div>
  );
};

export default CourseRequestReviewPage;
