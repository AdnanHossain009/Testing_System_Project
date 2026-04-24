import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import Loading from '../components/Loading';
import { useAuth } from '../context/AuthContext';
import {
  assessmentRowToPayload,
  assessmentToFormRow,
  cloneProgramPlos,
  createAssessmentRow,
  createCloRow,
  createMappingRow,
  createPloRow,
  formatFileSize,
  getStatusClassName
} from '../utils/courseRequestHelpers';

const buildInitialForm = (programId = '') => ({
  name: '',
  code: '',
  description: '',
  credits: 3,
  semester: '8th',
  program: programId,
  note: '',
  uploadedPdf: null,
  extraction: {
    status: 'not_started',
    warnings: [],
    textPreview: ''
  },
  clos: [createCloRow()],
  plos: [],
  mappings: [],
  assessments: []
});

const CourseRequestsPage = () => {
  const { user } = useAuth();
  const departmentId = user?.department?._id || user?.department;

  const [programs, setPrograms] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState(buildInitialForm());
  const [pdfFile, setPdfFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState('success');

  const selectedProgram = useMemo(
    () => programs.find((item) => item._id === form.program) || programs[0] || null,
    [form.program, programs]
  );
  const requestStatusCounts = useMemo(
    () =>
      requests.reduce(
        (summary, item) => ({
          ...summary,
          [item.status]: (summary[item.status] || 0) + 1
        }),
        { pending: 0, approved: 0, rejected: 0 }
      ),
    [requests]
  );

  const loadPage = async () => {
    const [programResponse, requestResponse] = await Promise.all([
      api.get('/programs', { params: { departmentId } }),
      api.get('/course-requests/my', { params: { type: 'faculty_course' } })
    ]);

    const programList = programResponse.data.data.programs || [];
    const requestList = requestResponse.data.data.requests || [];
    const defaultProgramId = programList[0]?._id || '';

    setPrograms(programList);
    setRequests(requestList);
    setForm((prev) => ({
      ...prev,
      program: prev.program || defaultProgramId
    }));
  };

  useEffect(() => {
    const run = async () => {
      try {
        await loadPage();
      } catch (error) {
        setFeedback(error?.response?.data?.message || 'Failed to load add course workflow.');
        setFeedbackType('error');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [departmentId]);

  const setMessage = (message, type = 'success') => {
    setFeedback(message);
    setFeedbackType(type);
  };

  const updateListRow = (key, index, field, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item))
    }));
  };

  const addListRow = (key, factory) => {
    setForm((prev) => ({
      ...prev,
      [key]: [...prev[key], factory()]
    }));
  };

  const removeListRow = (key, index, fallbackFactory) => {
    setForm((prev) => {
      const nextRows = prev[key].filter((_, itemIndex) => itemIndex !== index);
      return {
        ...prev,
        [key]: nextRows.length ? nextRows : fallbackFactory ? [fallbackFactory()] : []
      };
    });
  };

  const resetForm = (programId = form.program) => {
    setForm(buildInitialForm(programId));
    setPdfFile(null);
    setFileInputKey((prev) => prev + 1);
  };

  const handleExtract = async () => {
    if (!pdfFile) {
      setMessage('Please upload a course or syllabus PDF first.', 'error');
      return;
    }

    setExtracting(true);
    setMessage('');

    try {
      const payload = new FormData();
      payload.append('pdf', pdfFile);

      const response = await api.post('/course-requests/extract-pdf', payload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const data = response.data.data;
      const extractedData = data.extractedData || {};

      setForm((prev) => ({
        ...prev,
        uploadedPdf: data.uploadedPdf || null,
        extraction: data.extraction || prev.extraction,
        clos: extractedData.clos?.length ? extractedData.clos : prev.clos,
        plos: extractedData.plos?.length ? extractedData.plos : prev.plos,
        mappings: extractedData.mappings?.length ? extractedData.mappings : prev.mappings,
        assessments: extractedData.assessments?.length
          ? extractedData.assessments.map((item) => assessmentToFormRow(item))
          : prev.assessments
      }));

      setMessage(response.data.message || 'PDF extraction completed.', data.extraction?.status === 'failed' ? 'error' : 'success');
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Automatic extraction failed. Please enter data manually.', 'error');
    } finally {
      setExtracting(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      await api.post('/course-requests/faculty-course', {
        name: form.name,
        code: form.code,
        description: form.description,
        credits: Number(form.credits),
        semester: form.semester,
        department: departmentId,
        program: form.program,
        clos: form.clos,
        plos: form.plos,
        mappings: form.mappings.map((item) => ({
          ...item,
          weight: Number(item.weight)
        })),
        assessments: form.assessments.map((item) => assessmentRowToPayload(item)),
        uploadedPdf: form.uploadedPdf,
        extraction: form.extraction,
        note: form.note
      });

      setMessage('Course request submitted to the department head for review.');
      const nextProgramId = form.program;
      resetForm(nextProgramId);
      await loadPage();
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Failed to submit course request.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading text="Loading add course workflow..." />;

  return (
    <div>
      <div className="page-header">
        <h1>Add Course</h1>
        <p className="muted">
          Upload a course PDF, review extracted CLOs, PLOs, mappings, and assessments, then send the course request to your department head.
        </p>
      </div>

      {feedback ? <div className={feedbackType === 'error' ? 'error-box' : 'success-box'}>{feedback}</div> : null}

      <div className="workflow-steps">
        <span>1. Upload PDF</span>
        <span>2. Extract outcomes</span>
        <span>3. Review and edit</span>
        <span>4. Submit for approval</span>
      </div>

      <div className="workspace-grid">
        <form className="workspace-main stack-lg" onSubmit={handleSubmit}>
          <section className="card">
            <div className="section-heading">
              <div>
                <span className="kicker">Course Proposal</span>
                <h3 style={{ marginTop: '0.55rem' }}>Course Basics</h3>
                <p className="muted">Provide the official course identity and academic placement.</p>
              </div>
              <span className="status-badge badge-muted">
                Department: {user?.department?.code || user?.department?.name || 'Assigned department'}
              </span>
            </div>

            <div className="grid grid-2">
              <div>
                <label>Course Title</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label>Course Code</label>
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
              </div>
              <div>
                <label>Credits</label>
                <input
                  type="number"
                  min="0"
                  value={form.credits}
                  onChange={(e) => setForm({ ...form, credits: e.target.value })}
                />
              </div>
              <div>
                <label>Semester</label>
                <input value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} />
              </div>
            </div>

            <label>Program</label>
            <select value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })}>
              {programs.map((item) => (
                <option value={item._id} key={item._id}>
                  {item.code} - {item.name}
                </option>
              ))}
            </select>

            <label>Description</label>
            <textarea
              rows="3"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional course summary or syllabus note."
            />
          </section>

          <section className="card">
            <div className="section-heading">
              <div>
                <h3>Course PDF</h3>
                <p className="muted">Upload the syllabus PDF, then run the rule-based extraction.</p>
              </div>
              <span className={`status-badge ${getStatusClassName(form.extraction?.status)}`}>
                {form.extraction?.status || 'not_started'}
              </span>
            </div>

            <div className="upload-box">
              <label>Upload PDF</label>
              <input key={fileInputKey} type="file" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
              <div className="inline-actions">
                <button className="btn" type="button" onClick={handleExtract} disabled={extracting}>
                  {extracting ? 'Extracting...' : 'Extract Outcomes'}
                </button>
                <button className="btn btn-secondary" type="button" onClick={() => resetForm(form.program)}>
                  Clear Draft
                </button>
              </div>
            </div>

            {form.uploadedPdf ? (
              <div className="info-strip">
                <strong>{form.uploadedPdf.originalName}</strong>
                <span>{formatFileSize(form.uploadedPdf.size)}</span>
                <span>{form.uploadedPdf.pageCount || 0} pages</span>
              </div>
            ) : null}

            {form.extraction?.warnings?.length ? (
              <div className="soft-warning">
                <strong>Extraction Notes</strong>
                <ul className="simple-list">
                  {form.extraction.warnings.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {form.extraction?.textPreview ? (
              <>
                <label>Text Preview</label>
                <textarea rows="6" value={form.extraction.textPreview} readOnly />
              </>
            ) : null}
          </section>

          <section className="card">
            <div className="section-heading">
              <div>
                <h3>CLOs</h3>
                <p className="muted">Edit codes, descriptions, and Bloom levels before submission.</p>
              </div>
              <button className="btn btn-secondary" type="button" onClick={() => addListRow('clos', createCloRow)}>
                Add CLO
              </button>
            </div>

            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Description</th>
                  <th>Bloom</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {form.clos.map((item, index) => (
                  <tr key={`clo-${index}`}>
                    <td>
                      <input value={item.code} onChange={(e) => updateListRow('clos', index, 'code', e.target.value)} />
                    </td>
                    <td>
                      <input
                        value={item.description}
                        onChange={(e) => updateListRow('clos', index, 'description', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        value={item.bloomLevel}
                        onChange={(e) => updateListRow('clos', index, 'bloomLevel', e.target.value)}
                      />
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-small"
                        type="button"
                        onClick={() => removeListRow('clos', index, createCloRow)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="card">
            <div className="section-heading">
              <div>
                <h3>PLOs</h3>
                <p className="muted">Use extracted PLOs or load the current program catalog as a starting point.</p>
              </div>
              <div className="inline-actions">
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, plos: cloneProgramPlos(selectedProgram) }))}
                >
                  Load Program PLOs
                </button>
                <button className="btn btn-secondary" type="button" onClick={() => addListRow('plos', createPloRow)}>
                  Add PLO
                </button>
              </div>
            </div>

            {form.plos.length === 0 ? <p className="muted">No PLO rows loaded yet. You can still submit if mappings use existing program PLOs.</p> : null}

            {form.plos.length ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Description</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {form.plos.map((item, index) => (
                    <tr key={`plo-${index}`}>
                      <td>
                        <input value={item.code} onChange={(e) => updateListRow('plos', index, 'code', e.target.value)} />
                      </td>
                      <td>
                        <input
                          value={item.description}
                          onChange={(e) => updateListRow('plos', index, 'description', e.target.value)}
                        />
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-small"
                          type="button"
                          onClick={() => removeListRow('plos', index)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </section>

          <section className="card">
            <div className="section-heading">
              <div>
                <h3>CLO-PLO Mapping</h3>
                <p className="muted">Keep weights between 0 and 1 so they match the current mapping schema.</p>
              </div>
              <button className="btn btn-secondary" type="button" onClick={() => addListRow('mappings', createMappingRow)}>
                Add Mapping
              </button>
            </div>

            {form.mappings.length === 0 ? <p className="muted">No mapping rows yet. Add them manually if extraction does not find any.</p> : null}

            {form.mappings.length ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>CLO Code</th>
                    <th>PLO Code</th>
                    <th>Weight</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {form.mappings.map((item, index) => (
                    <tr key={`mapping-${index}`}>
                      <td>
                        <input
                          value={item.cloCode}
                          onChange={(e) => updateListRow('mappings', index, 'cloCode', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          value={item.ploCode}
                          onChange={(e) => updateListRow('mappings', index, 'ploCode', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.1"
                          value={item.weight}
                          onChange={(e) => updateListRow('mappings', index, 'weight', e.target.value)}
                        />
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-small"
                          type="button"
                          onClick={() => removeListRow('mappings', index)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </section>

          <section className="card">
            <div className="section-heading">
              <div>
                <h3>Assessments</h3>
                <p className="muted">Add the assessment structure that should become active after approval.</p>
              </div>
              <button className="btn btn-secondary" type="button" onClick={() => addListRow('assessments', createAssessmentRow)}>
                Add Assessment
              </button>
            </div>

            {form.assessments.length === 0 ? <p className="muted">No assessment rows detected yet. You can add them manually.</p> : null}

            <div className="stack">
              {form.assessments.map((item, index) => (
                <div className="subcard" key={`assessment-${index}`}>
                  <div className="grid grid-2">
                    <div>
                      <label>Title</label>
                      <input value={item.title} onChange={(e) => updateListRow('assessments', index, 'title', e.target.value)} />
                    </div>
                    <div>
                      <label>Type</label>
                      <select value={item.type} onChange={(e) => updateListRow('assessments', index, 'type', e.target.value)}>
                        <option value="quiz">Quiz</option>
                        <option value="assignment">Assignment</option>
                        <option value="mid">Mid</option>
                        <option value="final">Final</option>
                      </select>
                    </div>
                    <div>
                      <label>Weightage (%)</label>
                      <input
                        type="number"
                        min="0"
                        value={item.weightage}
                        onChange={(e) => updateListRow('assessments', index, 'weightage', e.target.value)}
                      />
                    </div>
                    <div>
                      <label>Total Marks</label>
                      <input
                        type="number"
                        min="0"
                        value={item.totalMarks}
                        onChange={(e) => updateListRow('assessments', index, 'totalMarks', e.target.value)}
                      />
                    </div>
                  </div>

                  <label>CLO Codes</label>
                  <input
                    value={item.cloCodesText}
                    onChange={(e) => updateListRow('assessments', index, 'cloCodesText', e.target.value)}
                    placeholder="CLO1, CLO2"
                  />

                  <label>CLO Distribution</label>
                  <textarea
                    rows="3"
                    value={item.cloDistributionText}
                    onChange={(e) => updateListRow('assessments', index, 'cloDistributionText', e.target.value)}
                    placeholder="CLO1:10&#10;CLO2:15"
                  />

                  <label>Notes</label>
                  <textarea
                    rows="2"
                    value={item.note}
                    onChange={(e) => updateListRow('assessments', index, 'note', e.target.value)}
                    placeholder="Optional extracted note or assessment remark."
                  />

                  <button
                    className="btn btn-secondary btn-small"
                    type="button"
                    onClick={() => removeListRow('assessments', index)}
                  >
                    Remove Assessment
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <h3>Submission Note</h3>
            <label>Message to Department Head</label>
            <textarea
              rows="3"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Optional note about the request or extraction quality."
            />

            <div className="inline-actions">
              <button className="btn" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit for Approval'}
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => resetForm(form.program)}>
                Reset Form
              </button>
            </div>
          </section>
        </form>

        <aside className="workspace-rail">
          <div className="card card-accent">
            <span className="kicker">Draft Snapshot</span>
            <div className="section-heading" style={{ marginTop: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>{form.code || 'Untitled course draft'}</h3>
                <p className="muted">{form.name || 'Add the course identity, then refine extracted outcomes before submission.'}</p>
              </div>
              <span className={`status-badge ${getStatusClassName(form.extraction?.status)}`}>
                {form.extraction?.status || 'not_started'}
              </span>
            </div>

            <div className="mini-metrics">
              <div className="mini-metric">
                <span className="mini-metric-label">CLO rows</span>
                <span className="mini-metric-value">{form.clos.length}</span>
              </div>
              <div className="mini-metric">
                <span className="mini-metric-label">PLO rows</span>
                <span className="mini-metric-value">{form.plos.length}</span>
              </div>
              <div className="mini-metric">
                <span className="mini-metric-label">Mappings</span>
                <span className="mini-metric-value">{form.mappings.length}</span>
              </div>
              <div className="mini-metric">
                <span className="mini-metric-label">Assessments</span>
                <span className="mini-metric-value">{form.assessments.length}</span>
              </div>
            </div>

            <ul className="data-points" style={{ marginTop: '0.9rem' }}>
              <li>
                <strong>Program</strong>
                <span>{selectedProgram?.code || 'Not selected'}</span>
              </li>
              <li>
                <strong>PDF loaded</strong>
                <span>{form.uploadedPdf?.originalName || 'No PDF attached yet'}</span>
              </li>
            </ul>
          </div>

          <div className="stack-lg">
          <section className="card">
            <div className="section-heading">
              <div>
                <h3>Program PLO Reference</h3>
                <p className="muted">Use the active program outcomes to validate mapping codes.</p>
              </div>
              <span className="status-badge badge-muted">{selectedProgram?.code || 'No program selected'}</span>
            </div>

            {selectedProgram?.plos?.length ? (
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>PLO</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProgram.plos.map((item) => (
                      <tr key={item.code}>
                        <td>{item.code}</td>
                        <td>{item.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted">This program does not have saved PLOs yet.</p>
            )}
          </section>

          <section className="card">
            <div className="section-heading">
              <div>
                <h3>My Course Requests</h3>
                <p className="muted">Track pending, approved, and rejected submissions.</p>
              </div>
              <span className="status-badge badge-muted">{requests.length} total</span>
            </div>

            <div className="mini-metrics" style={{ marginTop: 0, marginBottom: '1rem' }}>
              <div className="mini-metric">
                <span className="mini-metric-label">Pending</span>
                <span className="mini-metric-value">{requestStatusCounts.pending}</span>
              </div>
              <div className="mini-metric">
                <span className="mini-metric-label">Approved</span>
                <span className="mini-metric-value">{requestStatusCounts.approved}</span>
              </div>
              <div className="mini-metric">
                <span className="mini-metric-label">Rejected</span>
                <span className="mini-metric-value">{requestStatusCounts.rejected}</span>
              </div>
            </div>

            {requests.length === 0 ? (
              <p className="muted">No course requests submitted yet.</p>
            ) : (
              <div className="stack">
                {requests.map((item) => (
                  <div className="subcard" key={item._id}>
                    <div className="section-heading">
                      <div>
                        <strong>{item.proposedCourse?.code}</strong>
                        <div className="muted">{item.proposedCourse?.name}</div>
                      </div>
                      <span className={`status-badge ${getStatusClassName(item.status)}`}>{item.status}</span>
                    </div>

                    <div className="request-meta-grid">
                      <span>
                        <strong>CLOs:</strong> {item.proposedCourse?.clos?.length || 0}
                      </span>
                      <span>
                        <strong>PLOs:</strong> {item.proposedPlos?.length || 0}
                      </span>
                      <span>
                        <strong>Mappings:</strong> {item.proposedMappings?.length || 0}
                      </span>
                      <span>
                        <strong>Assessments:</strong> {item.proposedAssessments?.length || 0}
                      </span>
                    </div>

                    <div className="request-meta-grid">
                      <span>
                        <strong>Extraction:</strong>{' '}
                        <span className={`status-badge ${getStatusClassName(item.extraction?.status)}`}>
                          {item.extraction?.status || 'not_started'}
                        </span>
                      </span>
                      <span>
                        <strong>Submitted:</strong> {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {item.uploadedPdf ? (
                      <p className="muted">
                        PDF: {item.uploadedPdf.originalName} ({formatFileSize(item.uploadedPdf.size)})
                      </p>
                    ) : null}

                    {item.reviewNote ? (
                      <div className="soft-warning">
                        <strong>Review Note</strong>
                        <div>{item.reviewNote}</div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="card">
            <h3>Submission Notes</h3>
            <ul className="helper-list">
              <li>Extracted data is a draft, so review every CLO, mapping, and assessment before sending it forward.</li>
              <li>Course codes and program selection should match the department catalog to avoid approval delays.</li>
              <li>Add a short submission note whenever the PDF extraction missed items or needs reviewer context.</li>
            </ul>
          </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CourseRequestsPage;
