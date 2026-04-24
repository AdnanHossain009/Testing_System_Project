import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import Loading from '../components/Loading';
import { useAuth } from '../context/AuthContext';

const initialForm = {
  studentId: '',
  courseId: '',
  quiz: 8,
  assignment: 12,
  mid: 18,
  final: 35
};

const ResultsPage = () => {
  const { user } = useAuth();
  const canEdit = ['faculty', 'admin'].includes(user?.role);

  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [myResults, setMyResults] = useState([]);
  const [courseResults, setCourseResults] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [rubricSelections, setRubricSelections] = useState({});
  const [selectedResult, setSelectedResult] = useState(null);
  const [latestCloOutcome, setLatestCloOutcome] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [latestFuzzy, setLatestFuzzy] = useState(null);
  const selectedCourse = useMemo(
    () => courses.find((item) => String(item._id) === String(form.courseId)) || null,
    [courses, form.courseId]
  );
  const selectedStudent = useMemo(
    () => students.find((item) => String(item._id) === String(form.studentId)) || null,
    [students, form.studentId]
  );
  const highRiskCount = courseResults.filter((item) => ['High', 'Critical'].includes(item.riskBand)).length;
  const averageFuzzy = courseResults.length
    ? (courseResults.reduce((total, item) => total + Number(item.fuzzyScore || 0), 0) / courseResults.length).toFixed(1)
    : '0.0';
  const rubricCriterionCount = assessments.reduce(
    (total, assessment) => total + (assessment.rubricCriteria?.length || 0),
    0
  );
  const latestUpdatedAt = courseResults.reduce((latest, item) => {
    const candidate = new Date(item.lastEvaluatedAt || item.updatedAt || 0).getTime();
    return candidate > latest ? candidate : latest;
  }, 0);

  const loadStudentView = async () => {
    const response = await api.get('/results/me');
    const results = response.data.data.results;
    setMyResults(results);
    setSelectedResult(results[0] || null);
    setLoading(false);
  };

  const loadAssessments = async (courseId) => {
    if (!courseId) {
      setAssessments([]);
      setRubricSelections({});
      return [];
    }

    const response = await api.get('/assessments', { params: { courseId } });
    const list = response.data.data.assessments || [];
    setAssessments(list);
    setRubricSelections((current) => {
      const next = {};
      list.forEach((assessment) => {
        if (assessment.rubricCriteria?.length) {
          next[assessment._id] = {};
          assessment.rubricCriteria.forEach((criterion) => {
            next[assessment._id][criterion.criterion] = current?.[assessment._id]?.[criterion.criterion] || 1;
          });
        }
      });
      return next;
    });
    return list;
  };

  const loadCourseBasedView = async () => {
    const courseResponse = await api.get('/courses');
    const courseList = courseResponse.data.data.courses;
    setCourses(courseList);

    if (canEdit) {
      const studentResponse = await api.get('/users?role=student');
      const studentList = studentResponse.data.data.users;
      setStudents(studentList);
      setForm((prev) => ({
        ...prev,
        studentId: prev.studentId || studentList[0]?._id || '',
        courseId: prev.courseId || courseList[0]?._id || ''
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        courseId: prev.courseId || courseList[0]?._id || ''
      }));
    }

    if (courseList[0]?._id) {
      await loadCourseResults(courseList[0]._id);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (user?.role === 'student') {
      loadStudentView();
    } else {
      loadCourseBasedView();
    }
  }, [user]);

  const loadCourseResults = async (courseId) => {
    if (!courseId) {
      setCourseResults([]);
      setSelectedResult(null);
      await loadAssessments('');
      return;
    }

    const [resultResponse] = await Promise.all([api.get(`/results/course/${courseId}`), loadAssessments(courseId)]);
    const results = resultResponse.data.data.results || [];
    setCourseResults(results);
    setSelectedResult(results[0] || null);
  };

  const updateRubricLevel = (assessmentId, criterion, level) => {
    setRubricSelections((current) => ({
      ...current,
      [assessmentId]: {
        ...(current[assessmentId] || {}),
        [criterion]: Number(level)
      }
    }));
  };

  const submitHandler = async (event) => {
    event.preventDefault();
    const rubricEvaluations = assessments
      .filter((assessment) => assessment.rubricCriteria?.length)
      .map((assessment) => ({
        assessmentId: assessment._id,
        assessmentTitle: assessment.title,
        scores: assessment.rubricCriteria.map((criterion) => ({
          criterion: criterion.criterion,
          cloCode: criterion.cloCode,
          level: Number(rubricSelections?.[assessment._id]?.[criterion.criterion] || 1)
        }))
      }));

    const response = await api.post('/results', {
      studentId: form.studentId,
      courseId: form.courseId,
      rubricEvaluations,
      marks: {
        quiz: Number(form.quiz),
        assignment: Number(form.assignment),
        mid: Number(form.mid),
        final: Number(form.final)
      }
    });
    setLatestFuzzy(response.data.data.fuzzy);
    setLatestCloOutcome(response.data.data.result?.cloAttainment || []);
    loadCourseResults(form.courseId);
  };

  if (loading) return <Loading text="Loading results page..." />;

  if (user?.role === 'student') {
    return (
      <div>
        <div className="page-header">
          <h1>My Results</h1>
          <p className="muted">Your marks, fuzzy score, risk score and course wise attainment.</p>
        </div>

        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Quiz %</th>
                <th>Assignment %</th>
                <th>Mid %</th>
                <th>Final %</th>
                <th>Fuzzy</th>
                <th>Risk</th>
                <th>CLOs</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {myResults.map((item) => (
                <tr key={item._id}>
                  <td>{item.course?.code}</td>
                  <td>{item.marks.quiz}</td>
                  <td>{item.marks.assignment}</td>
                  <td>{item.marks.mid}</td>
                  <td>{item.marks.final}</td>
                  <td>{item.fuzzyScore}</td>
                  <td>{item.riskBand}</td>
                  <td>
                    {(item.cloAttainment || []).map((clo) => `${clo.code}: ${clo.score}%`).join(', ') || 'N/A'}
                  </td>
                  <td>
                    <button className="btn btn-secondary" onClick={() => setSelectedResult(item)}>
                      View details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedResult ? (
          <div className="card" style={{ marginTop: '1rem' }}>
            <h3>
              CLO Details - {selectedResult.course?.code || 'N/A'}
            </h3>
            <table className="table">
              <thead>
                <tr>
                  <th>CLO</th>
                  <th>Score</th>
                  <th>Level</th>
                  <th>Status</th>
                  <th>Explanation</th>
                </tr>
              </thead>
              <tbody>
                {(selectedResult.cloAttainment || []).map((clo) => (
                  <tr key={clo.code}>
                    <td>{clo.code}</td>
                    <td>{clo.score}%</td>
                    <td>Level {clo.level || 1}</td>
                    <td>{clo.attained ? 'Attained' : 'Weak'}</td>
                    <td className="muted">{clo.explanation || 'No explanation available.'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {selectedResult.assessmentEvaluations?.length ? (
              <div style={{ marginTop: '1rem' }}>
                <h4>Assessment / Rubric Breakdown</h4>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Assessment</th>
                      <th>Mode</th>
                      <th>Obtained</th>
                      <th>Percentage</th>
                      <th>CLO Allocations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedResult.assessmentEvaluations || []).map((item) => (
                      <tr key={`${item.assessment}-${item.assessmentTitle}`}>
                        <td>{item.assessmentTitle}</td>
                        <td>{item.mode}</td>
                        <td>{item.obtainedMarks}</td>
                        <td>{item.percentage}%</td>
                        <td>
                          {(item.cloAllocations || [])
                            .map((clo) => `${clo.cloCode}: ${clo.percentage}%`)
                            .join(', ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>{canEdit ? 'Results Entry' : 'Course Results Review'}</h1>
        <p className="muted">
          {canEdit
            ? 'Faculty or admin enters quiz, assignment, mid and final marks here. The system runs fuzzy evaluation automatically.'
            : 'Department head can review course wise stored results and risk status here.'}
        </p>
      </div>

      <div className={canEdit ? 'workspace-grid' : 'card'}>
        {canEdit ? (
          <form className="card" onSubmit={submitHandler}>
            <div className="section-heading">
              <div>
                <span className="kicker">Evaluation Console</span>
                <h3 style={{ marginTop: '0.55rem' }}>Enter Student Marks</h3>
                <p className="muted" style={{ marginBottom: 0 }}>
                  Save the raw marks, apply rubric levels where available, and let the platform generate fuzzy and CLO outcomes instantly.
                </p>
              </div>
              {selectedCourse ? <span className="status-badge badge-muted">{selectedCourse.code}</span> : null}
            </div>

            <div className="grid grid-2">
              <div>
                <label>Course</label>
                <select
                  value={form.courseId}
                  onChange={async (e) => {
                    const value = e.target.value;
                    setForm({ ...form, courseId: value });
                    loadCourseResults(value);
                  }}
                >
                  {courses.map((item) => (
                    <option value={item._id} key={item._id}>
                      {item.code}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Student</label>
                <select
                  value={form.studentId}
                  onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                >
                  {students.map((item) => (
                    <option value={item._id} key={item._id}>
                      {item.studentId} - {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Quiz</label>
                <input value={form.quiz} onChange={(e) => setForm({ ...form, quiz: e.target.value })} />
              </div>
              <div>
                <label>Assignment</label>
                <input value={form.assignment} onChange={(e) => setForm({ ...form, assignment: e.target.value })} />
              </div>
              <div>
                <label>Mid</label>
                <input value={form.mid} onChange={(e) => setForm({ ...form, mid: e.target.value })} />
              </div>
              <div>
                <label>Final</label>
                <input value={form.final} onChange={(e) => setForm({ ...form, final: e.target.value })} />
              </div>
            </div>

            <div className="callout-band" style={{ marginBottom: '1rem' }}>
              <strong>Selected evaluation context</strong>
              {selectedStudent?.name || 'Student'} will be evaluated inside {selectedCourse?.name || 'the chosen course'} using the active assessment schema.
            </div>

            <div className="subcard" style={{ marginBottom: '1rem' }}>
              <h4>Rubric Scoring</h4>
              {assessments.some((assessment) => assessment.rubricCriteria?.length) ? (
                assessments
                  .filter((assessment) => assessment.rubricCriteria?.length)
                  .map((assessment) => (
                    <div key={assessment._id} style={{ marginBottom: '1rem' }}>
                      <strong>{assessment.title}</strong>
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Criterion</th>
                            <th>CLO</th>
                            <th>Marks</th>
                            <th>Level</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assessment.rubricCriteria.map((criterion) => (
                            <tr key={`${assessment._id}-${criterion.criterion}`}>
                              <td>{criterion.criterion}</td>
                              <td>{criterion.cloCode}</td>
                              <td>{criterion.marks}</td>
                              <td>
                                <select
                                  value={rubricSelections?.[assessment._id]?.[criterion.criterion] || 1}
                                  onChange={(event) =>
                                    updateRubricLevel(assessment._id, criterion.criterion, event.target.value)
                                  }
                                >
                                  <option value="1">1 - Poor</option>
                                  <option value="2">2 - Satisfactory</option>
                                  <option value="3">3 - Good</option>
                                  <option value="4">4 - Excellent</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))
              ) : (
                <p className="muted">No rubric criteria configured for this course yet.</p>
              )}
            </div>

            <button className="btn">Save and Evaluate</button>

            {latestFuzzy ? (
              <div className="success-box">
                <strong>Latest Fuzzy Activation</strong>
                <pre>{JSON.stringify(latestFuzzy.activatedRules, null, 2)}</pre>
              </div>
            ) : null}

            {latestCloOutcome?.length ? (
              <div className="success-box">
                <strong>Latest CLO Attainment</strong>
                <table className="table">
                  <thead>
                    <tr>
                      <th>CLO</th>
                      <th>Score</th>
                      <th>Status</th>
                      <th>Explanation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestCloOutcome.map((clo) => (
                      <tr key={clo.code}>
                        <td>{clo.code}</td>
                        <td>{clo.score}%</td>
                        <td>{clo.attained ? 'Attained' : 'Weak'}</td>
                        <td>{clo.explanation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </form>
        ) : (
          <>
            <label>Select Course</label>
            <select
              value={form.courseId}
              onChange={async (e) => {
                const value = e.target.value;
                setForm({ ...form, courseId: value });
                loadCourseResults(value);
              }}
            >
              {courses.map((item) => (
                <option value={item._id} key={item._id}>
                  {item.code}
                </option>
              ))}
            </select>
          </>
        )}

        {canEdit ? (
          <aside className="workspace-rail">
            <div className="card card-accent">
              <span className="kicker">Course Snapshot</span>
              <div className="section-heading" style={{ marginTop: '0.75rem' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{selectedCourse?.code || 'No course selected'}</h3>
                  <p className="muted">{selectedCourse?.name || 'Pick a course to inspect saved results and rubric coverage.'}</p>
                </div>
              </div>

              <div className="mini-metrics">
                <div className="mini-metric">
                  <span className="mini-metric-label">Stored results</span>
                  <span className="mini-metric-value">{courseResults.length}</span>
                </div>
                <div className="mini-metric">
                  <span className="mini-metric-label">Average fuzzy</span>
                  <span className="mini-metric-value">{averageFuzzy}</span>
                </div>
                <div className="mini-metric">
                  <span className="mini-metric-label">High-risk cases</span>
                  <span className="mini-metric-value">{highRiskCount}</span>
                </div>
                <div className="mini-metric">
                  <span className="mini-metric-label">Rubric criteria</span>
                  <span className="mini-metric-value">{rubricCriterionCount}</span>
                </div>
              </div>

              <ul className="data-points" style={{ marginTop: '0.9rem' }}>
                <li>
                  <strong>Current student</strong>
                  <span>{selectedStudent?.name || 'Not selected'}</span>
                </li>
                <li>
                  <strong>Last evaluation</strong>
                  <span>{latestUpdatedAt ? new Date(latestUpdatedAt).toLocaleString() : 'No evaluations yet'}</span>
                </li>
              </ul>
            </div>

            <div className="card">
              <div className="section-heading">
                <div>
                  <h3>Stored Course Results</h3>
                  <p className="muted">Open any saved result to review detailed CLO attainment and rubric allocations below.</p>
                </div>
                <span className="status-badge badge-muted">{courseResults.length} saved</span>
              </div>

              {courseResults.length ? (
                <div className="stack">
                  {courseResults.map((item) => (
                    <div className="subcard" key={item._id}>
                      <div className="section-heading">
                        <div>
                          <strong>{item.student?.name}</strong>
                          <div className="muted">{item.student?.studentId || item.student?.email || 'Student record'}</div>
                        </div>
                        <span className="status-badge badge-muted">{item.riskBand}</span>
                      </div>

                      <div className="request-meta-grid">
                        <span>
                          <strong>Fuzzy:</strong> {item.fuzzyScore}
                        </span>
                        <span>
                          <strong>CLOs:</strong> {(item.cloAttainment || []).length}
                        </span>
                      </div>

                      <p className="muted" style={{ marginTop: 0 }}>
                        {(item.cloAttainment || []).map((clo) => `${clo.code}: ${clo.score}%`).join(', ') || 'No CLO attainment saved yet.'}
                      </p>

                      <button className="btn btn-secondary btn-small" type="button" onClick={() => setSelectedResult(item)}>
                        View details
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">No evaluated results for this course yet.</p>
              )}
            </div>

            <div className="card">
              <h3>Evaluation Notes</h3>
              <ul className="helper-list">
                <li>Use rubric levels when the course has qualitative criteria, not only raw marks.</li>
                <li>Review the CLO attainment summary after each save so weak outcomes are caught early.</li>
                <li>High or critical risk bands usually need immediate feedback or intervention planning.</li>
              </ul>
            </div>
          </aside>
        ) : (
          <div className="card">
            <h3>Stored Course Results</h3>
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Fuzzy</th>
                    <th>Risk</th>
                    <th>CLOs</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {courseResults.map((item) => (
                    <tr key={item._id}>
                      <td>{item.student?.name}</td>
                      <td>{item.fuzzyScore}</td>
                      <td>{item.riskBand}</td>
                      <td>
                        {(item.cloAttainment || []).map((clo) => `${clo.code}: ${clo.score}%`).join(', ') || 'N/A'}
                      </td>
                      <td>
                        <button className="btn btn-secondary" onClick={() => setSelectedResult(item)}>
                          View details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selectedResult ? (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h3>
            Result Details - {selectedResult.student?.name || 'Student'} / {selectedResult.course?.code || form.courseId}
          </h3>
          <table className="table">
            <thead>
              <tr>
                <th>CLO</th>
                <th>Score</th>
                <th>Level</th>
                <th>Status</th>
                <th>Explanation</th>
              </tr>
            </thead>
            <tbody>
              {(selectedResult.cloAttainment || []).map((clo) => (
                <tr key={clo.code}>
                  <td>{clo.code}</td>
                  <td>{clo.score}%</td>
                  <td>Level {clo.level || 1}</td>
                  <td>{clo.attained ? 'Attained' : 'Weak'}</td>
                  <td className="muted">{clo.explanation || 'No explanation available.'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {selectedResult.assessmentEvaluations?.length ? (
            <div style={{ marginTop: '1rem' }}>
              <h4>Assessment / Rubric Breakdown</h4>
              <table className="table">
                <thead>
                  <tr>
                    <th>Assessment</th>
                    <th>Mode</th>
                    <th>Obtained</th>
                    <th>Percentage</th>
                    <th>CLO Allocations</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedResult.assessmentEvaluations || []).map((item) => (
                    <tr key={`${item.assessment}-${item.assessmentTitle}`}>
                      <td>{item.assessmentTitle}</td>
                      <td>{item.mode}</td>
                      <td>{item.obtainedMarks}</td>
                      <td>{item.percentage}%</td>
                      <td>
                        {(item.cloAllocations || [])
                          .map((clo) => `${clo.cloCode}: ${clo.percentage}%`)
                          .join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default ResultsPage;
