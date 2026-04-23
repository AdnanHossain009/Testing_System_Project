import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import Loading from '../components/Loading';
import StatCard from '../components/StatCard';
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
  getVisibilityClassName
} from '../utils/evidenceHelpers';

const initialForm = {
  title: '',
  description: '',
  evidenceType: 'assessment_evidence',
  academicTerm: '',
  course: '',
  assessment: '',
  student: '',
  outcomeType: '',
  outcomeCode: '',
  visibility: 'department',
  artifactFile: null
};

const initialFilters = {
  academicTerm: '',
  courseId: '',
  evidenceType: '',
  status: '',
  outcomeType: ''
};

const FacultyEvidencePage = () => {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState(initialForm);
  const [filters, setFilters] = useState(initialFilters);
  const [courses, setCourses] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [students, setStudents] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [sampleSets, setSampleSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [fileInputKey, setFileInputKey] = useState(0);

  const selectedCourseId = form.course || filters.courseId || searchParams.get('courseId') || '';

  const filteredAssessments = useMemo(
    () =>
      assessments.filter((item) => {
        if (!form.course) return true;
        return String(item.course?._id || item.course) === String(form.course);
      }),
    [assessments, form.course]
  );

  const filteredStudents = useMemo(() => {
    if (!selectedCourseId) {
      return students;
    }

    const selectedCourse = courses.find((item) => String(item._id) === String(selectedCourseId));

    return students.filter((item) => {
      const matchesDepartment = selectedCourse?.department?._id
        ? String(item.department?._id || item.department) === String(selectedCourse.department._id)
        : true;
      const matchesProgram = selectedCourse?.program?._id
        ? String(item.program?._id || item.program) === String(selectedCourse.program._id)
        : true;

      return matchesDepartment && matchesProgram;
    });
  }, [courses, selectedCourseId, students]);

  const loadPage = async (nextFilters = filters) => {
    setLoading(true);
    setMessage('');

    try {
      const artifactParams = {
        ...(nextFilters.academicTerm ? { academicTerm: nextFilters.academicTerm.trim() } : {}),
        ...(nextFilters.courseId ? { courseId: nextFilters.courseId } : {}),
        ...(nextFilters.evidenceType ? { evidenceType: nextFilters.evidenceType } : {}),
        ...(nextFilters.status ? { status: nextFilters.status } : {}),
        ...(nextFilters.outcomeType ? { outcomeType: nextFilters.outcomeType } : {})
      };

      const [courseResponse, assessmentResponse, studentResponse, artifactResponse, sampleSetResponse] = await Promise.all([
        api.get('/courses', { params: { scope: 'assigned' } }),
        api.get('/assessments'),
        api.get('/users', { params: { role: 'student' } }),
        api.get('/evidence/artifacts', { params: artifactParams }),
        api.get('/evidence/sample-sets')
      ]);

      const assignedCourses = courseResponse.data.data.courses || [];
      const initialCourseId = searchParams.get('courseId') || '';
      const validPrefillCourseId = assignedCourses.some((item) => String(item._id) === String(initialCourseId))
        ? initialCourseId
        : '';

      setCourses(assignedCourses);
      setAssessments(assessmentResponse.data.data.assessments || []);
      setStudents(studentResponse.data.data.users || []);
      setArtifacts(artifactResponse.data.data.artifacts || []);
      setSampleSets(sampleSetResponse.data.data.sampleSets || []);

      if (validPrefillCourseId) {
        setForm((current) => ({
          ...current,
          course: current.course || validPrefillCourseId
        }));

        if (!nextFilters.courseId) {
          setFilters((current) => ({
            ...current,
            courseId: validPrefillCourseId
          }));
        }
      }
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Failed to load evidence workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialCourseId = searchParams.get('courseId') || '';
    const nextFilters = initialCourseId ? { ...initialFilters, courseId: initialCourseId } : initialFilters;
    setFilters(nextFilters);
    loadPage(nextFilters);
  }, []);

  const submitEvidence = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const payload = new FormData();
      payload.append('title', form.title);
      payload.append('description', form.description);
      payload.append('evidenceType', form.evidenceType);
      payload.append('academicTerm', form.academicTerm);
      payload.append('course', form.course);

      if (form.assessment) payload.append('assessment', form.assessment);
      if (form.student) payload.append('student', form.student);
      if (form.outcomeType) payload.append('outcomeType', form.outcomeType);
      if (form.outcomeCode) payload.append('outcomeCode', form.outcomeCode.toUpperCase());

      payload.append('visibility', form.visibility);
      payload.append('artifact', form.artifactFile);

      await api.post('/evidence/artifacts', payload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessage('Evidence uploaded successfully.');
      setForm((current) => ({
        ...initialForm,
        course: current.course
      }));
      setFileInputKey((current) => current + 1);
      await loadPage(filters);
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Failed to upload evidence.');
    } finally {
      setSaving(false);
    }
  };

  const applyFilters = async (event) => {
    event.preventDefault();
    await loadPage(filters);
  };

  const resetFilters = async () => {
    setFilters(initialFilters);
    await loadPage(initialFilters);
  };

  const toggleArtifactStatus = async (artifact) => {
    setSaving(true);
    setMessage('');

    try {
      await api.patch(`/evidence/artifacts/${artifact._id}`, {
        status: artifact.status === 'active' ? 'archived' : 'active'
      });

      setMessage(`Evidence marked as ${artifact.status === 'active' ? 'archived' : 'active'}.`);
      await loadPage(filters);
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Failed to update evidence status.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading text="Loading faculty evidence workspace..." />;
  }

  const activeArtifacts = artifacts.filter((item) => item.status === 'active').length;
  const assessmentLinkedArtifacts = artifacts.filter((item) => item.assessment).length;
  const privateArtifacts = artifacts.filter((item) => item.visibility === 'private').length;

  return (
    <div>
      <div className="page-header">
        <h1>Evidence Upload</h1>
        <p className="muted">
          Upload course evidence, connect it to assessments and outcomes, and track how it enters accreditation sampling.
        </p>
      </div>

      {message ? <div className={message.toLowerCase().includes('failed') ? 'error-box' : 'success-box'}>{message}</div> : null}

      <div className="grid grid-4">
        <StatCard label="My Relevant Evidence" value={artifacts.length} />
        <StatCard label="Active Evidence" value={activeArtifacts} />
        <StatCard label="Assessment-Linked" value={assessmentLinkedArtifacts} />
        <StatCard label="Private Evidence" value={privateArtifacts} />
      </div>

      <div className="grid grid-2 align-start">
        <form className="card" onSubmit={submitEvidence}>
          <div className="section-heading">
            <div>
              <h3>Upload Academic Evidence</h3>
              <p className="muted">Attach evidence to one of your assigned courses so accreditation reviewers can sample it later.</p>
            </div>
          </div>

          <div className="upload-box">
            <label>Evidence File</label>
            <input
              key={fileInputKey}
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.zip,.rar,.7z,.png,.jpg,.jpeg"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  artifactFile: event.target.files?.[0] || null
                }))
              }
              required
            />
            <p className="muted" style={{ marginBottom: 0 }}>
              Supported files include reports, projects, presentations, lab work, assessment evidence, and compressed bundles.
            </p>
          </div>

          <div className="grid grid-2">
            <div>
              <label>Title</label>
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Final project rubric bundle"
                required
              />
            </div>
            <div>
              <label>Evidence Type</label>
              <select
                value={form.evidenceType}
                onChange={(event) => setForm((current) => ({ ...current, evidenceType: event.target.value }))}
              >
                {evidenceTypeOptions.map((item) => (
                  <option value={item.value} key={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Academic Term</label>
              <input
                value={form.academicTerm}
                onChange={(event) => setForm((current) => ({ ...current, academicTerm: event.target.value }))}
                placeholder="e.g. 2026 Spring"
              />
            </div>
            <div>
              <label>Course</label>
              <select
                value={form.course}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    course: event.target.value,
                    assessment: '',
                    student: ''
                  }))
                }
                required
              >
                <option value="">Select Assigned Course</option>
                {courses.map((item) => (
                  <option value={item._id} key={item._id}>
                    {item.code} - {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Assessment</label>
              <select
                value={form.assessment}
                onChange={(event) => setForm((current) => ({ ...current, assessment: event.target.value }))}
              >
                <option value="">Optional Assessment Link</option>
                {filteredAssessments.map((item) => (
                  <option value={item._id} key={item._id}>
                    {item.title} ({item.type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Student</label>
              <select
                value={form.student}
                onChange={(event) => setForm((current) => ({ ...current, student: event.target.value }))}
              >
                <option value="">Optional Student Link</option>
                {filteredStudents.map((item) => (
                  <option value={item._id} key={item._id}>
                    {item.name} ({item.email})
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
                placeholder="e.g. CLO2"
                disabled={!form.outcomeType}
              />
            </div>
            <div>
              <label>Visibility</label>
              <select
                value={form.visibility}
                onChange={(event) => setForm((current) => ({ ...current, visibility: event.target.value }))}
              >
                <option value="private">Private</option>
                <option value="department">Department</option>
                <option value="institution">Institution</option>
              </select>
            </div>
          </div>

          <label>Description</label>
          <textarea
            rows="4"
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="Briefly describe what this evidence contains and why it matters."
          />

          <div className="inline-actions">
            <button className="btn" disabled={saving}>
              {saving ? 'Uploading...' : 'Upload Evidence'}
            </button>
            {form.course ? (
              <Link className="btn btn-secondary" to={`/courses/${form.course}`}>
                Open Linked Course
              </Link>
            ) : null}
          </div>
        </form>

        <div className="card">
          <div className="section-heading">
            <div>
              <h3>Relevant Sample Sets</h3>
              <p className="muted">These sample sets already include your course evidence or assign you as a reviewer.</p>
            </div>
          </div>

          {sampleSets.length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Scope</th>
                  <th>Reviewer</th>
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
            <p className="muted">No sample sets include your evidence yet.</p>
          )}
        </div>
      </div>

      <form className="card" onSubmit={applyFilters} style={{ marginBottom: '1rem' }}>
        <div className="section-heading">
          <div>
            <h3>Repository Filters</h3>
            <p className="muted">Filter your uploaded and course-linked evidence before downloading or archiving it.</p>
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
            <label>Course</label>
            <select value={filters.courseId} onChange={(event) => setFilters((current) => ({ ...current, courseId: event.target.value }))}>
              <option value="">All Assigned Courses</option>
              {courses.map((item) => (
                <option value={item._id} key={item._id}>
                  {item.code} - {item.name}
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
            <label>Status</label>
            <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
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

      <div className="card">
        <div className="section-heading">
          <div>
            <h3>Evidence Repository</h3>
            <p className="muted">Download stored artifacts, check scope links, and archive older files when needed.</p>
          </div>
        </div>

        {artifacts.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>Evidence</th>
                <th>Scope</th>
                <th>Assessment / Student</th>
                <th>Outcome</th>
                <th>Visibility</th>
                <th>Uploaded</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {artifacts.map((item) => (
                <tr key={item._id}>
                  <td>
                    <strong>{item.title}</strong>
                    <div className="muted">{item.file?.originalName}</div>
                    <div className="muted">{formatFileSize(item.file?.size || 0)}</div>
                    <div className="muted">{item.evidenceType.replace('_', ' ')}</div>
                  </td>
                  <td>{buildArtifactScopeText(item)}</td>
                  <td>
                    <div>{item.assessment?.title || 'No assessment link'}</div>
                    <div className="muted">{item.student?.name || 'No student link'}</div>
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
                    <div className="muted">{item.academicTerm || 'No term'}</div>
                  </td>
                  <td>
                    <div className="inline-actions">
                      <button
                        className="btn btn-secondary btn-small"
                        type="button"
                        onClick={() => downloadEvidenceArtifact(item._id, item.file?.originalName || item.title)}
                      >
                        Download
                      </button>
                      {item.canEdit ? (
                        <button
                          className="btn btn-secondary btn-small"
                          type="button"
                          onClick={() => toggleArtifactStatus(item)}
                          disabled={saving}
                        >
                          {item.status === 'active' ? 'Archive' : 'Activate'}
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">No evidence matched the current filters yet.</p>
        )}
      </div>
    </div>
  );
};

export default FacultyEvidencePage;
