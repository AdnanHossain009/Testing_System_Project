import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import Loading from '../components/Loading';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';
import {
  buildArtifactOutcomeText,
  buildArtifactScopeText,
  buildSampleSetScopeText,
  canReviewSampleSet,
  downloadEvidenceArtifact,
  formatEvidenceDate,
  getReviewStatusClassName,
  getSampleSetStatusClassName
} from '../utils/evidenceHelpers';

const getProgramsForDepartment = (programs, departmentId) =>
  departmentId
    ? programs.filter((item) => String(item.department?._id || item.department) === String(departmentId))
    : programs;

const getCoursesForScope = (courses, departmentId, programId) =>
  courses.filter((item) => {
    const matchesDepartment = departmentId
      ? String(item.department?._id || item.department) === String(departmentId)
      : true;
    const matchesProgram = programId ? String(item.program?._id || item.program) === String(programId) : true;

    return matchesDepartment && matchesProgram;
  });

const hydrateForm = (sampleSet) => ({
  title: sampleSet.title || '',
  description: sampleSet.description || '',
  academicTerm: sampleSet.academicTerm || '',
  groupBy: sampleSet.groupBy || 'custom',
  department: sampleSet.department?._id || '',
  program: sampleSet.program?._id || '',
  course: sampleSet.course?._id || '',
  outcomeType: sampleSet.outcomeType || '',
  outcomeCode: sampleSet.outcomeCode || '',
  reviewer: sampleSet.reviewer?._id || '',
  status: sampleSet.status || 'draft'
});

const hydrateReviewDrafts = (sampleSet) =>
  Object.fromEntries(
    (sampleSet.sampledArtifacts || []).map((item) => [
      String(item.artifact?._id || item.artifact),
      {
        reviewStatus: item.reviewStatus || 'pending',
        reviewNote: item.reviewNote || ''
      }
    ])
  );

const EvidenceSampleSetDetailsPage = () => {
  const { sampleSetId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const canManage = user?.role === 'accreditation_officer';
  const [sampleSet, setSampleSet] = useState(null);
  const [form, setForm] = useState(null);
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [reviewers, setReviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const loadPage = async () => {
    setLoading(true);
    setMessage('');

    try {
      const requests = [api.get(`/evidence/sample-sets/${sampleSetId}`)];

      if (canManage) {
        requests.push(api.get('/departments'));
        requests.push(api.get('/programs'));
        requests.push(api.get('/courses'));
        requests.push(api.get('/users'));
      }

      const responses = await Promise.all(requests);
      const [sampleSetResponse, departmentResponse, programResponse, courseResponse, usersResponse] = responses;
      const loadedSampleSet = sampleSetResponse.data.data.sampleSet;

      setSampleSet(loadedSampleSet);
      setForm(hydrateForm(loadedSampleSet));
      setReviewDrafts(hydrateReviewDrafts(loadedSampleSet));

      if (canManage) {
        setDepartments(departmentResponse.data.data.departments || []);
        setPrograms(programResponse.data.data.programs || []);
        setCourses(courseResponse.data.data.courses || []);
        setReviewers((usersResponse.data.data.users || []).filter((item) => item.role !== 'student'));
      }
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Failed to load evidence sample set.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, [sampleSetId, user?.role]);

  const availablePrograms = useMemo(
    () => getProgramsForDepartment(programs, form?.department),
    [form?.department, programs]
  );
  const availableCourses = useMemo(
    () => getCoursesForScope(courses, form?.department, form?.program),
    [courses, form?.department, form?.program]
  );

  const handleDepartmentChange = (department) => {
    const nextPrograms = getProgramsForDepartment(programs, department);
    const nextCourses = getCoursesForScope(courses, department, '');

    setForm((current) => ({
      ...current,
      department,
      program: nextPrograms.find((item) => item._id === current.program)?._id || '',
      course: nextCourses.find((item) => item._id === current.course)?._id || ''
    }));
  };

  const handleProgramChange = (program) => {
    const nextCourses = getCoursesForScope(courses, form.department, program);

    setForm((current) => ({
      ...current,
      program,
      course: nextCourses.find((item) => item._id === current.course)?._id || ''
    }));
  };

  const saveMetadata = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await api.patch(`/evidence/sample-sets/${sampleSetId}`, {
        ...form,
        outcomeCode: form.outcomeCode.toUpperCase()
      });

      const updatedSampleSet = response.data.data.sampleSet;
      setSampleSet(updatedSampleSet);
      setForm(hydrateForm(updatedSampleSet));
      setReviewDrafts(hydrateReviewDrafts(updatedSampleSet));
      setMessage('Sample set metadata updated successfully.');
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Failed to update sample set metadata.');
    } finally {
      setSaving(false);
    }
  };

  const deleteSampleSet = async () => {
    const confirmed = window.confirm('Delete this sample set?');

    if (!confirmed) return;

    setSaving(true);
    setMessage('');

    try {
      await api.delete(`/evidence/sample-sets/${sampleSetId}`);
      navigate('/accreditation/evidence-manager');
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Failed to delete sample set.');
      setSaving(false);
    }
  };

  const saveArtifactReview = async (artifactId) => {
    setSaving(true);
    setMessage('');

    try {
      const draft = reviewDrafts[artifactId];
      const response = await api.patch(`/evidence/sample-sets/${sampleSetId}/review`, {
        artifactId,
        reviewStatus: draft.reviewStatus,
        reviewNote: draft.reviewNote
      });

      const updatedSampleSet = response.data.data.sampleSet;
      setSampleSet(updatedSampleSet);
      setReviewDrafts(hydrateReviewDrafts(updatedSampleSet));
      setForm(hydrateForm(updatedSampleSet));
      setMessage('Artifact review updated successfully.');
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Failed to update artifact review.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading text="Loading evidence sample set..." />;
  }

  if (!sampleSet || !form) {
    return <div className="error-box">{message || 'Evidence sample set could not be loaded.'}</div>;
  }

  const canReview = canReviewSampleSet(user, sampleSet);
  const totalArtifacts = sampleSet.sampledArtifacts?.length || 0;
  const reviewedArtifacts = (sampleSet.sampledArtifacts || []).filter((item) => item.reviewStatus === 'reviewed').length;
  const flaggedArtifacts = (sampleSet.sampledArtifacts || []).filter((item) => item.reviewStatus === 'flagged').length;

  return (
    <div>
      <div className="page-header">
        <h1>{sampleSet.title}</h1>
        <p className="muted">Review the sample scope, reviewer assignment, and artifact-by-artifact evidence status.</p>
      </div>

      {message ? <div className={message.toLowerCase().includes('failed') ? 'error-box' : 'success-box'}>{message}</div> : null}

      <div className="inline-actions" style={{ marginBottom: '1rem' }}>
        <Link className="btn btn-secondary" to={user?.role === 'faculty' ? '/faculty/evidence' : '/accreditation/evidence-manager'}>
          Back
        </Link>
        {canManage ? (
          <button className="btn btn-secondary" type="button" onClick={deleteSampleSet} disabled={saving}>
            Delete Sample Set
          </button>
        ) : null}
      </div>

      <div className="grid grid-4">
        <StatCard label="Artifacts" value={totalArtifacts} />
        <StatCard label="Reviewed" value={reviewedArtifacts} />
        <StatCard label="Flagged" value={flaggedArtifacts} />
        <div className="card stat-card">
          <span className="stat-label">Status</span>
          <span className={`status-badge ${getSampleSetStatusClassName(sampleSet.status)}`}>{sampleSet.status.replace('_', ' ')}</span>
        </div>
      </div>

      <div className="grid grid-2 align-start">
        <div className="card">
          <h3>Sample Set Snapshot</h3>
          <p>
            <strong>Scope:</strong> {buildSampleSetScopeText(sampleSet)}
          </p>
          <p>
            <strong>Grouping:</strong> {sampleSet.groupBy.replace('_', ' ')}
          </p>
          <p>
            <strong>Academic Term:</strong> {sampleSet.academicTerm || 'Not specified'}
          </p>
          <p>
            <strong>Outcome Link:</strong> {sampleSet.outcomeType && sampleSet.outcomeCode ? `${sampleSet.outcomeType} ${sampleSet.outcomeCode}` : 'Not linked'}
          </p>
          <p>
            <strong>Reviewer:</strong> {sampleSet.reviewer?.name || 'Unassigned'}
          </p>
          <p>
            <strong>Created By:</strong> {sampleSet.createdBy?.name || 'Unknown'}
          </p>
          <p>
            <strong>Updated:</strong> {formatEvidenceDate(sampleSet.updatedAt)}
          </p>
          <p className="muted" style={{ marginBottom: 0 }}>
            {sampleSet.description || 'No description provided.'}
          </p>
        </div>

        <div className="card">
          <h3>Review Guidance</h3>
          <p className="muted">
            Use this sample set to confirm that stored evidence matches the intended outcome, assessment context, and accreditation scope.
          </p>
          <p>
            <strong>Reviewer access:</strong> {canReview ? 'You can update artifact review statuses here.' : 'Read-only access for your role.'}
          </p>
          <p>
            <strong>Flagged items:</strong> {flaggedArtifacts}
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>Reviewed items:</strong> {reviewedArtifacts} / {totalArtifacts}
          </p>
        </div>
      </div>

      {canManage ? (
        <form className="card" onSubmit={saveMetadata} style={{ marginBottom: '1rem' }}>
          <div className="section-heading">
            <div>
              <h3>Edit Sample Set</h3>
              <p className="muted">Adjust the sample scope, reviewer assignment, and workflow status without rebuilding the set.</p>
            </div>
          </div>

          <div className="grid grid-3">
            <div>
              <label>Title</label>
              <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required />
            </div>
            <div>
              <label>Academic Term</label>
              <input
                value={form.academicTerm}
                onChange={(event) => setForm((current) => ({ ...current, academicTerm: event.target.value }))}
              />
            </div>
            <div>
              <label>Grouping</label>
              <select value={form.groupBy} onChange={(event) => setForm((current) => ({ ...current, groupBy: event.target.value }))}>
                <option value="course">Course</option>
                <option value="program">Program</option>
                <option value="term">Term</option>
                <option value="outcome">Outcome</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label>Department</label>
              <select value={form.department} onChange={(event) => handleDepartmentChange(event.target.value)}>
                <option value="">Optional Department</option>
                {departments.map((item) => (
                  <option value={item._id} key={item._id}>
                    {item.code} - {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Program</label>
              <select value={form.program} onChange={(event) => handleProgramChange(event.target.value)}>
                <option value="">Optional Program</option>
                {availablePrograms.map((item) => (
                  <option value={item._id} key={item._id}>
                    {item.code} - {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Course</label>
              <select value={form.course} onChange={(event) => setForm((current) => ({ ...current, course: event.target.value }))}>
                <option value="">Optional Course</option>
                {availableCourses.map((item) => (
                  <option value={item._id} key={item._id}>
                    {item.code} - {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Outcome Type</label>
              <select
                value={form.outcomeType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    outcomeType: event.target.value,
                    outcomeCode: event.target.value ? current.outcomeCode : ''
                  }))
                }
              >
                <option value="">Not Linked</option>
                <option value="CLO">CLO</option>
                <option value="PLO">PLO</option>
              </select>
            </div>
            <div>
              <label>Outcome Code</label>
              <input
                value={form.outcomeCode}
                onChange={(event) => setForm((current) => ({ ...current, outcomeCode: event.target.value.toUpperCase() }))}
                disabled={!form.outcomeType}
              />
            </div>
            <div>
              <label>Reviewer</label>
              <select value={form.reviewer} onChange={(event) => setForm((current) => ({ ...current, reviewer: event.target.value }))}>
                <option value="">Optional Reviewer</option>
                {reviewers.map((item) => (
                  <option value={item._id} key={item._id}>
                    {item.name} ({item.role})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Status</label>
              <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
                <option value="draft">Draft</option>
                <option value="in_review">In Review</option>
                <option value="reviewed">Reviewed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <label>Description</label>
          <textarea
            rows="4"
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          />

          <button className="btn" disabled={saving}>
            {saving ? 'Saving...' : 'Save Sample Set'}
          </button>
        </form>
      ) : null}

      <div className="card">
        <div className="section-heading">
          <div>
            <h3>Artifact Review Matrix</h3>
            <p className="muted">Review each sampled artifact, download the evidence, and document the review status.</p>
          </div>
        </div>

        {sampleSet.sampledArtifacts?.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>Artifact</th>
                <th>Scope</th>
                <th>Outcome</th>
                <th>Reviewer Status</th>
                <th>Review Notes</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sampleSet.sampledArtifacts.map((item) => {
                const artifactId = String(item.artifact?._id || item.artifact);
                const draft = reviewDrafts[artifactId] || {
                  reviewStatus: item.reviewStatus || 'pending',
                  reviewNote: item.reviewNote || ''
                };

                return (
                  <tr key={artifactId}>
                    <td>
                      <strong>{item.artifact?.title || 'Artifact'}</strong>
                      <div className="muted">{item.artifact?.file?.originalName || 'Stored file'}</div>
                      <div className="muted">Uploaded by {item.artifact?.uploader?.name || 'Unknown'}</div>
                    </td>
                    <td>
                      <div>{buildArtifactScopeText(item.artifact)}</div>
                      <div className="muted">{item.artifact?.assessment?.title || 'No assessment link'}</div>
                    </td>
                    <td>{buildArtifactOutcomeText(item.artifact)}</td>
                    <td>
                      {canReview ? (
                        <select
                          value={draft.reviewStatus}
                          onChange={(event) =>
                            setReviewDrafts((current) => ({
                              ...current,
                              [artifactId]: {
                                ...draft,
                                reviewStatus: event.target.value
                              }
                            }))
                          }
                        >
                          <option value="pending">Pending</option>
                          <option value="in_review">In Review</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="flagged">Flagged</option>
                        </select>
                      ) : (
                        <span className={`status-badge ${getReviewStatusClassName(item.reviewStatus)}`}>{item.reviewStatus.replace('_', ' ')}</span>
                      )}
                    </td>
                    <td>
                      {canReview ? (
                        <textarea
                          rows="3"
                          value={draft.reviewNote}
                          onChange={(event) =>
                            setReviewDrafts((current) => ({
                              ...current,
                              [artifactId]: {
                                ...draft,
                                reviewNote: event.target.value
                              }
                            }))
                          }
                          placeholder="Document what the reviewer observed."
                        />
                      ) : (
                        <div>
                          <span className={`status-badge ${getReviewStatusClassName(item.reviewStatus)}`}>{item.reviewStatus.replace('_', ' ')}</span>
                          <div className="muted" style={{ marginTop: '0.5rem' }}>
                            {item.reviewNote || 'No review note yet.'}
                          </div>
                          <div className="muted">{item.reviewedAt ? formatEvidenceDate(item.reviewedAt) : 'Not reviewed yet'}</div>
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="inline-actions">
                        <button
                          className="btn btn-secondary btn-small"
                          type="button"
                          onClick={() =>
                            downloadEvidenceArtifact(
                              artifactId,
                              item.artifact?.file?.originalName || item.artifact?.title || 'evidence-file'
                            )
                          }
                        >
                          Download
                        </button>
                        {canReview ? (
                          <button className="btn btn-secondary btn-small" type="button" onClick={() => saveArtifactReview(artifactId)} disabled={saving}>
                            Save Review
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="muted">This sample set does not contain any artifacts.</p>
        )}
      </div>
    </div>
  );
};

export default EvidenceSampleSetDetailsPage;
