import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Loading from '../components/Loading';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';
import {
  buildArtifactOutcomeText,
  buildArtifactScopeText,
  buildSampleSetScopeText,
  downloadEvidenceArtifact,
  evidenceTypeOptions,
  formatEvidenceDate,
  formatFileSize,
  getArtifactStatusClassName,
  getSampleSetStatusClassName,
  getVisibilityClassName,
  sampleGroupOptions
} from '../utils/evidenceHelpers';

const initialFilters = {
  academicTerm: '',
  departmentId: '',
  programId: '',
  courseId: '',
  assessmentId: '',
  evidenceType: '',
  artifactStatus: '',
  sampleStatus: '',
  visibility: '',
  outcomeType: ''
};

const initialSampleSetForm = {
  title: '',
  description: '',
  academicTerm: '',
  groupBy: 'course',
  department: '',
  program: '',
  course: '',
  outcomeType: '',
  outcomeCode: '',
  reviewer: '',
  status: 'draft'
};

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

const EvidenceManagerPage = () => {
  const { user } = useAuth();
  const canManage = user?.role === 'accreditation_officer';
  const [filters, setFilters] = useState(initialFilters);
  const [sampleSetForm, setSampleSetForm] = useState(initialSampleSetForm);
  const [artifacts, setArtifacts] = useState([]);
  const [sampleSets, setSampleSets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [reviewers, setReviewers] = useState([]);
  const [selectedArtifactIds, setSelectedArtifactIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const availablePrograms = useMemo(
    () => getProgramsForDepartment(programs, filters.departmentId),
    [filters.departmentId, programs]
  );
  const availableCourses = useMemo(
    () => getCoursesForScope(courses, filters.departmentId, filters.programId),
    [courses, filters.departmentId, filters.programId]
  );

  const samplePrograms = useMemo(
    () => getProgramsForDepartment(programs, sampleSetForm.department),
    [programs, sampleSetForm.department]
  );
  const sampleCourses = useMemo(
    () => getCoursesForScope(courses, sampleSetForm.department, sampleSetForm.program),
    [courses, sampleSetForm.department, sampleSetForm.program]
  );

  const loadPage = async (nextFilters = filters) => {
    setLoading(true);
    setMessage('');

    try {
      const artifactParams = {
        ...(nextFilters.academicTerm ? { academicTerm: nextFilters.academicTerm.trim() } : {}),
        ...(nextFilters.departmentId ? { departmentId: nextFilters.departmentId } : {}),
        ...(nextFilters.programId ? { programId: nextFilters.programId } : {}),
        ...(nextFilters.courseId ? { courseId: nextFilters.courseId } : {}),
        ...(nextFilters.assessmentId ? { assessmentId: nextFilters.assessmentId } : {}),
        ...(nextFilters.evidenceType ? { evidenceType: nextFilters.evidenceType } : {}),
        ...(nextFilters.artifactStatus ? { status: nextFilters.artifactStatus } : {}),
        ...(nextFilters.visibility ? { visibility: nextFilters.visibility } : {}),
        ...(nextFilters.outcomeType ? { outcomeType: nextFilters.outcomeType } : {})
      };

      const sampleParams = {
        ...(nextFilters.academicTerm ? { academicTerm: nextFilters.academicTerm.trim() } : {}),
        ...(nextFilters.departmentId ? { departmentId: nextFilters.departmentId } : {}),
        ...(nextFilters.programId ? { programId: nextFilters.programId } : {}),
        ...(nextFilters.courseId ? { courseId: nextFilters.courseId } : {}),
        ...(nextFilters.sampleStatus ? { status: nextFilters.sampleStatus } : {}),
        ...(nextFilters.outcomeType ? { outcomeType: nextFilters.outcomeType } : {})
      };

      const requests = [
        api.get('/evidence/artifacts', { params: artifactParams }),
        api.get('/evidence/sample-sets', { params: sampleParams }),
        api.get('/departments'),
        api.get('/programs'),
        api.get('/courses'),
        api.get('/assessments')
      ];

      if (canManage) {
        requests.push(api.get('/users'));
      }

      const responses = await Promise.all(requests);
      const [artifactResponse, sampleSetResponse, departmentResponse, programResponse, courseResponse, assessmentResponse, usersResponse] =
        responses;

      setArtifacts(artifactResponse.data.data.artifacts || []);
      setSampleSets(sampleSetResponse.data.data.sampleSets || []);
      setDepartments(departmentResponse.data.data.departments || []);
      setPrograms(programResponse.data.data.programs || []);
      setCourses(courseResponse.data.data.courses || []);
      setAssessments(assessmentResponse.data.data.assessments || []);
      setReviewers(
        canManage ? (usersResponse?.data?.data?.users || []).filter((item) => item.role !== 'student') : []
      );
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Failed to load evidence manager.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, [user?.role]);

  const filteredAssessments = useMemo(
    () =>
      assessments.filter((item) => {
        if (!filters.courseId) return true;
        return String(item.course?._id || item.course) === String(filters.courseId);
      }),
    [assessments, filters.courseId]
  );

  const toggleArtifactSelection = (artifactId) => {
    setSelectedArtifactIds((current) =>
      current.includes(artifactId) ? current.filter((item) => item !== artifactId) : [...current, artifactId]
    );
  };

  const applyFilters = async (event) => {
    event.preventDefault();
    await loadPage(filters);
  };

  const resetFilters = async () => {
    setFilters(initialFilters);
    await loadPage(initialFilters);
  };

  const handleFilterDepartmentChange = (departmentId) => {
    const nextPrograms = getProgramsForDepartment(programs, departmentId);
    const nextCourses = getCoursesForScope(courses, departmentId, '');

    setFilters((current) => ({
      ...current,
      departmentId,
      programId: nextPrograms.find((item) => item._id === current.programId)?._id || '',
      courseId: nextCourses.find((item) => item._id === current.courseId)?._id || '',
      assessmentId: ''
    }));
  };

  const handleFilterProgramChange = (programId) => {
    const nextCourses = getCoursesForScope(courses, filters.departmentId, programId);

    setFilters((current) => ({
      ...current,
      programId,
      courseId: nextCourses.find((item) => item._id === current.courseId)?._id || '',
      assessmentId: ''
    }));
  };

  const handleSampleDepartmentChange = (departmentId) => {
    const nextPrograms = getProgramsForDepartment(programs, departmentId);
    const nextCourses = getCoursesForScope(courses, departmentId, '');

    setSampleSetForm((current) => ({
      ...current,
      department: departmentId,
      program: nextPrograms.find((item) => item._id === current.program)?._id || '',
      course: nextCourses.find((item) => item._id === current.course)?._id || ''
    }));
  };

  const handleSampleProgramChange = (programId) => {
    const nextCourses = getCoursesForScope(courses, sampleSetForm.department, programId);

    setSampleSetForm((current) => ({
      ...current,
      program: programId,
      course: nextCourses.find((item) => item._id === current.course)?._id || ''
    }));
  };

  const createSampleSet = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await api.post('/evidence/sample-sets', {
        ...sampleSetForm,
        outcomeCode: sampleSetForm.outcomeCode.toUpperCase(),
        artifactIds: selectedArtifactIds
      });

      setMessage('Evidence sample set created successfully.');
      setSampleSetForm(initialSampleSetForm);
      setSelectedArtifactIds([]);
      await loadPage(filters);
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Failed to create sample set.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading text="Loading evidence manager..." />;
  }

  const activeArtifacts = artifacts.filter((item) => item.status === 'active').length;
  const institutionArtifacts = artifacts.filter((item) => item.visibility === 'institution').length;
  const reviewedArtifacts = sampleSets.reduce(
    (total, item) => total + (item.sampledArtifacts || []).filter((entry) => entry.reviewStatus === 'reviewed').length,
    0
  );
  const flaggedArtifacts = sampleSets.reduce(
    (total, item) => total + (item.sampledArtifacts || []).filter((entry) => entry.reviewStatus === 'flagged').length,
    0
  );
  const inReviewSets = sampleSets.filter((item) => item.status === 'in_review').length;

  return (
    <div>
      <div className="page-header">
        <h1>Evidence Manager</h1>
        <p className="muted">
          Browse uploaded academic evidence, group artifacts into formal sample sets, and track review readiness for accreditation cycles.
        </p>
      </div>

      {message ? <div className={message.toLowerCase().includes('failed') ? 'error-box' : 'success-box'}>{message}</div> : null}

      <div className="grid grid-4">
        <StatCard label="Visible Artifacts" value={artifacts.length} />
        <StatCard label="Active Artifacts" value={activeArtifacts} />
        <StatCard label="Sample Sets" value={sampleSets.length} />
        <StatCard label="Reviewed Samples" value={reviewedArtifacts} />
      </div>

      <div className="grid grid-4">
        <StatCard label="Institution Visibility" value={institutionArtifacts} />
        <StatCard label="Flagged Samples" value={flaggedArtifacts} />
        <StatCard label="Selected Artifacts" value={selectedArtifactIds.length} />
        <StatCard label="In Review Sets" value={inReviewSets} />
      </div>

      <form className="card" onSubmit={applyFilters} style={{ marginBottom: '1rem' }}>
        <div className="section-heading">
          <div>
            <h3>Repository Filters</h3>
            <p className="muted">Use shared institutional filters to narrow both the artifact register and sample-set register.</p>
          </div>
        </div>

        <div className="grid grid-3">
          <div>
            <label>Academic Term</label>
            <input
              value={filters.academicTerm}
              onChange={(event) => setFilters((current) => ({ ...current, academicTerm: event.target.value }))}
              placeholder="Optional term"
            />
          </div>
          <div>
            <label>Department</label>
            <select value={filters.departmentId} onChange={(event) => handleFilterDepartmentChange(event.target.value)}>
              <option value="">All Departments</option>
              {departments.map((item) => (
                <option value={item._id} key={item._id}>
                  {item.code} - {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Program</label>
            <select value={filters.programId} onChange={(event) => handleFilterProgramChange(event.target.value)}>
              <option value="">All Programs</option>
              {availablePrograms.map((item) => (
                <option value={item._id} key={item._id}>
                  {item.code} - {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Course</label>
            <select value={filters.courseId} onChange={(event) => setFilters((current) => ({ ...current, courseId: event.target.value, assessmentId: '' }))}>
              <option value="">All Courses</option>
              {availableCourses.map((item) => (
                <option value={item._id} key={item._id}>
                  {item.code} - {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Assessment</label>
            <select value={filters.assessmentId} onChange={(event) => setFilters((current) => ({ ...current, assessmentId: event.target.value }))}>
              <option value="">All Assessments</option>
              {filteredAssessments.map((item) => (
                <option value={item._id} key={item._id}>
                  {item.title} ({item.type})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Evidence Type</label>
            <select value={filters.evidenceType} onChange={(event) => setFilters((current) => ({ ...current, evidenceType: event.target.value }))}>
              <option value="">All Types</option>
              {evidenceTypeOptions.map((item) => (
                <option value={item.value} key={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Outcome Type</label>
            <select value={filters.outcomeType} onChange={(event) => setFilters((current) => ({ ...current, outcomeType: event.target.value }))}>
              <option value="">All Outcomes</option>
              <option value="CLO">CLO</option>
              <option value="PLO">PLO</option>
            </select>
          </div>
          <div>
            <label>Artifact Status</label>
            <select value={filters.artifactStatus} onChange={(event) => setFilters((current) => ({ ...current, artifactStatus: event.target.value }))}>
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <label>Visibility</label>
            <select value={filters.visibility} onChange={(event) => setFilters((current) => ({ ...current, visibility: event.target.value }))}>
              <option value="">All Visibility</option>
              <option value="private">Private</option>
              <option value="department">Department</option>
              <option value="institution">Institution</option>
            </select>
          </div>
          <div>
            <label>Sample Set Status</label>
            <select value={filters.sampleStatus} onChange={(event) => setFilters((current) => ({ ...current, sampleStatus: event.target.value }))}>
              <option value="">All Sample Sets</option>
              <option value="draft">Draft</option>
              <option value="in_review">In Review</option>
              <option value="reviewed">Reviewed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div className="inline-actions">
          <button className="btn" type="submit">
            Apply Filters
          </button>
          <button className="btn btn-secondary" type="button" onClick={resetFilters}>
            Reset Filters
          </button>
        </div>
      </form>

      <div className="grid grid-2 align-start">
        <div className="card">
          <div className="section-heading">
            <div>
              <h3>Evidence Repository</h3>
              <p className="muted">
                Browse uploaded evidence artifacts and select the ones that should become part of a formal sampling set.
              </p>
            </div>
            {canManage ? (
              <button className="btn btn-secondary" type="button" onClick={() => setSelectedArtifactIds([])}>
                Clear Selection
              </button>
            ) : null}
          </div>

          {artifacts.length ? (
            <table className="table">
              <thead>
                <tr>
                  {canManage ? <th>Select</th> : null}
                  <th>Artifact</th>
                  <th>Scope</th>
                  <th>Outcome</th>
                  <th>Visibility</th>
                  <th>Uploaded</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {artifacts.map((item) => (
                  <tr key={item._id}>
                    {canManage ? (
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedArtifactIds.includes(item._id)}
                          onChange={() => toggleArtifactSelection(item._id)}
                        />
                      </td>
                    ) : null}
                    <td>
                      <strong>{item.title}</strong>
                      <div className="muted">{item.file?.originalName}</div>
                      <div className="muted">{formatFileSize(item.file?.size || 0)}</div>
                      <div className="muted">{item.evidenceType.replace('_', ' ')}</div>
                    </td>
                    <td>
                      <div>{buildArtifactScopeText(item)}</div>
                      <div className="muted">{item.assessment?.title || 'No assessment link'}</div>
                    </td>
                    <td>{buildArtifactOutcomeText(item)}</td>
                    <td>
                      <span className={`status-badge ${getVisibilityClassName(item.visibility)}`}>{item.visibility}</span>
                      <div style={{ marginTop: '0.4rem' }}>
                        <span className={`status-badge ${getArtifactStatusClassName(item.status)}`}>{item.status}</span>
                      </div>
                    </td>
                    <td>
                      <div>{formatEvidenceDate(item.createdAt)}</div>
                      <div className="muted">{item.uploader?.name || 'Unknown uploader'}</div>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-small"
                        type="button"
                        onClick={() => downloadEvidenceArtifact(item._id, item.file?.originalName || item.title)}
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">No evidence artifacts matched the current filters.</p>
          )}
        </div>

        <div className="card">
          <div className="section-heading">
            <div>
              <h3>Sample Set Register</h3>
              <p className="muted">Track created sampling sets, reviewer assignments, and review progress.</p>
            </div>
          </div>

          {sampleSets.length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Scope</th>
                  <th>Reviewer</th>
                  <th>Artifacts</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sampleSets.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <strong>{item.title}</strong>
                      <div className="muted">{item.groupBy.replace('_', ' ')}</div>
                    </td>
                    <td>{buildSampleSetScopeText(item)}</td>
                    <td>{item.reviewer?.name || 'Unassigned'}</td>
                    <td>
                      <div>{item.totalArtifacts || item.sampledArtifacts?.length || 0} artifacts</div>
                      <div className="muted">{item.reviewedCount || 0} reviewed</div>
                    </td>
                    <td>
                      <span className={`status-badge ${getSampleSetStatusClassName(item.status)}`}>{item.status.replace('_', ' ')}</span>
                    </td>
                    <td>
                      <Link className="btn btn-secondary btn-small" to={`/accreditation/evidence-manager/sample-sets/${item._id}`}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">No sample sets matched the current filters.</p>
          )}
        </div>
      </div>

      {canManage ? (
        <form className="card" onSubmit={createSampleSet}>
          <div className="section-heading">
            <div>
              <h3>Create Evidence Sample Set</h3>
              <p className="muted">
                Select repository artifacts, group them by institutional scope, and assign a reviewer for accreditation review.
              </p>
            </div>
          </div>

          <div className="soft-panel" style={{ marginBottom: '1rem' }}>
            <strong>Selected artifacts:</strong> {selectedArtifactIds.length}
            <div className="muted">Use the checkboxes in the repository table to build the sample set.</div>
          </div>

          <div className="grid grid-3">
            <div>
              <label>Title</label>
              <input
                value={sampleSetForm.title}
                onChange={(event) => setSampleSetForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Spring 2026 CSE Outcome Sample"
                required
              />
            </div>
            <div>
              <label>Academic Term</label>
              <input
                value={sampleSetForm.academicTerm}
                onChange={(event) => setSampleSetForm((current) => ({ ...current, academicTerm: event.target.value }))}
                placeholder="Optional term"
              />
            </div>
            <div>
              <label>Group By</label>
              <select
                value={sampleSetForm.groupBy}
                onChange={(event) => setSampleSetForm((current) => ({ ...current, groupBy: event.target.value }))}
              >
                {sampleGroupOptions.map((item) => (
                  <option value={item.value} key={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Department</label>
              <select value={sampleSetForm.department} onChange={(event) => handleSampleDepartmentChange(event.target.value)}>
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
              <select value={sampleSetForm.program} onChange={(event) => handleSampleProgramChange(event.target.value)}>
                <option value="">Optional Program</option>
                {samplePrograms.map((item) => (
                  <option value={item._id} key={item._id}>
                    {item.code} - {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Course</label>
              <select
                value={sampleSetForm.course}
                onChange={(event) => setSampleSetForm((current) => ({ ...current, course: event.target.value }))}
              >
                <option value="">Optional Course</option>
                {sampleCourses.map((item) => (
                  <option value={item._id} key={item._id}>
                    {item.code} - {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Outcome Type</label>
              <select
                value={sampleSetForm.outcomeType}
                onChange={(event) =>
                  setSampleSetForm((current) => ({
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
                value={sampleSetForm.outcomeCode}
                onChange={(event) => setSampleSetForm((current) => ({ ...current, outcomeCode: event.target.value.toUpperCase() }))}
                placeholder="Optional"
                disabled={!sampleSetForm.outcomeType}
              />
            </div>
            <div>
              <label>Reviewer</label>
              <select
                value={sampleSetForm.reviewer}
                onChange={(event) => setSampleSetForm((current) => ({ ...current, reviewer: event.target.value }))}
              >
                <option value="">Optional Reviewer</option>
                {reviewers.map((item) => (
                  <option value={item._id} key={item._id}>
                    {item.name} ({item.role})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Initial Status</label>
              <select
                value={sampleSetForm.status}
                onChange={(event) => setSampleSetForm((current) => ({ ...current, status: event.target.value }))}
              >
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
            value={sampleSetForm.description}
            onChange={(event) => setSampleSetForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="Describe the sampling rationale or accreditation objective."
          />

          <div className="inline-actions">
            <button className="btn" disabled={saving}>
              {saving ? 'Saving...' : 'Create Sample Set'}
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => {
                setSampleSetForm(initialSampleSetForm);
                setSelectedArtifactIds([]);
              }}
            >
              Clear Form
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
};

export default EvidenceManagerPage;
