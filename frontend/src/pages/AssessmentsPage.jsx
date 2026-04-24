import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import Loading from '../components/Loading';

const initialForm = {
  course: '',
  title: '',
  type: 'quiz',
  cloCodesText: 'CLO1',
  cloDistributionText: 'CLO1:10',
  rubricText: 'CLO1|Concept clarity|5|1:Missing|2:Basic|3:Good|4:Excellent',
  totalMarks: 10,
  weightage: 10
};

const parseCloDistribution = (text) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [cloCode, marks] = line.split(':');
      return {
        cloCode: cloCode?.trim(),
        marks: Number(marks) || 0
      };
    });

const parseRubrics = (text) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [cloCode, criterion, marks, levelsText] = line.split('|');
      const levels = (levelsText || '')
        .split(';')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => {
          const [level, description] = item.split(':');
          return {
            level: Number(level),
            description: description?.trim() || ''
          };
        })
        .filter((item) => item.level);

      return {
        cloCode: cloCode?.trim(),
        criterion: criterion?.trim(),
        marks: Number(marks) || 0,
        levels
      };
    });

const getAssessmentCloCodes = (assessment) =>
  (assessment.cloDistribution?.length
    ? assessment.cloDistribution.map((item) => item.cloCode)
    : assessment.cloCodes || []
  ).filter(Boolean);

const AssessmentsPage = () => {
  const [courses, setCourses] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');

  const selectedCourse = useMemo(
    () => courses.find((item) => String(item._id) === String(form.course)) || null,
    [courses, form.course]
  );

  const courseAssessments = useMemo(
    () => assessments.filter((item) => String(item.course?._id || item.course) === String(form.course)),
    [assessments, form.course]
  );

  const rubricCriterionCount = useMemo(
    () => courseAssessments.reduce((total, item) => total + (item.rubricCriteria?.length || 0), 0),
    [courseAssessments]
  );

  const totalWeightage = useMemo(
    () => courseAssessments.reduce((total, item) => total + Number(item.weightage || 0), 0),
    [courseAssessments]
  );

  const coveredClos = useMemo(
    () => Array.from(new Set(courseAssessments.flatMap((item) => getAssessmentCloCodes(item)))),
    [courseAssessments]
  );

  const loadAll = async () => {
    const [courseResponse, assessmentResponse] = await Promise.all([
      api.get('/courses', { params: { scope: 'assigned' } }),
      api.get('/assessments')
    ]);

    const courseList = courseResponse.data.data.courses || [];
    setCourses(courseList);
    setAssessments(assessmentResponse.data.data.assessments || []);
    setForm((prev) => ({ ...prev, course: prev.course || courseList[0]?._id || '' }));
  };

  useEffect(() => {
    const run = async () => {
      try {
        await loadAll();
      } catch (error) {
        setFeedback(error?.response?.data?.message || 'Failed to load assessments.');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const submitHandler = async (event) => {
    event.preventDefault();
    setFeedback('');

    try {
      await api.post('/assessments', {
        ...form,
        totalMarks: Number(form.totalMarks),
        weightage: Number(form.weightage),
        cloCodes: form.cloCodesText.split(',').map((item) => item.trim()).filter(Boolean),
        cloDistribution: parseCloDistribution(form.cloDistributionText),
        rubricCriteria: parseRubrics(form.rubricText)
      });
      setForm((prev) => ({
        ...initialForm,
        course: prev.course
      }));
      setFeedback('Assessment saved successfully.');
      await loadAll();
    } catch (error) {
      setFeedback(error?.response?.data?.message || 'Failed to save assessment.');
    }
  };

  if (loading) return <Loading text="Loading assessments..." />;

  return (
    <div>
      <div className="page-header">
        <h1>Assessments</h1>
        <p className="muted">
          Define quiz, assignment, mid and final assessment structures for OBE evaluation.
        </p>
      </div>

      {feedback ? <div className={feedback.toLowerCase().includes('failed') ? 'error-box' : 'success-box'}>{feedback}</div> : null}

      <div className="workspace-grid">
        <form className="card" onSubmit={submitHandler}>
          <div className="section-heading">
            <div>
              <span className="kicker">Faculty Workspace</span>
              <h3 style={{ marginTop: '0.55rem' }}>Create Assessment</h3>
              <p className="muted" style={{ marginBottom: 0 }}>
                Define a clean assessment structure with CLO coverage, mark distribution, and rubric levels before saving it.
              </p>
            </div>
            {selectedCourse ? <span className="status-badge badge-muted">{selectedCourse.code}</span> : null}
          </div>

          {courses.length === 0 ? <p className="muted">No approved assigned courses available yet. Approve a course request first.</p> : null}
          <div className="grid grid-2">
            <div>
              <label>Course</label>
              <select value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} disabled={!courses.length}>
                {courses.map((item) => (
                  <option value={item._id} key={item._id}>
                    {item.code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Quiz 1 or Final Exam"
              />
            </div>
            <div>
              <label>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="quiz">Quiz</option>
                <option value="assignment">Assignment</option>
                <option value="mid">Mid</option>
                <option value="final">Final</option>
              </select>
            </div>
            <div>
              <label>Total Marks</label>
              <input value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: e.target.value })} />
            </div>
            <div>
              <label>Weightage (%)</label>
              <input value={form.weightage} onChange={(e) => setForm({ ...form, weightage: e.target.value })} />
            </div>
          </div>

          <label>CLO Codes (comma separated)</label>
          <input
            value={form.cloCodesText}
            onChange={(e) => setForm({ ...form, cloCodesText: e.target.value })}
            placeholder="CLO1, CLO2"
          />

          <label>CLO Distribution (one per line, format: CLO1:10)</label>
          <textarea
            rows="3"
            value={form.cloDistributionText}
            onChange={(e) => setForm({ ...form, cloDistributionText: e.target.value })}
          />

          <label>Rubric Criteria (one per line, format: CLO1|Criterion|5|1:Missing;2:Basic;3:Good;4:Excellent)</label>
          <textarea
            rows="5"
            value={form.rubricText}
            onChange={(e) => setForm({ ...form, rubricText: e.target.value })}
          />

          <div className="callout-band" style={{ marginBottom: '1rem' }}>
            <strong>Professional assessment setup</strong>
            Keep the CLO split aligned with the marks and make rubric criteria specific enough that another faculty member could score consistently.
          </div>

          <button className="btn" disabled={!courses.length}>
            Save Assessment
          </button>
        </form>

        <aside className="workspace-rail">
          <div className="card card-accent">
            <span className="kicker">Assessment Blueprint</span>
            <div className="section-heading" style={{ marginTop: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>{selectedCourse?.code || 'No course selected'}</h3>
                <p className="muted">{selectedCourse?.name || 'Select a course to review its current assessment mix.'}</p>
              </div>
            </div>

            <div className="mini-metrics">
              <div className="mini-metric">
                <span className="mini-metric-label">Saved assessments</span>
                <span className="mini-metric-value">{courseAssessments.length}</span>
              </div>
              <div className="mini-metric">
                <span className="mini-metric-label">Rubric criteria</span>
                <span className="mini-metric-value">{rubricCriterionCount}</span>
              </div>
              <div className="mini-metric">
                <span className="mini-metric-label">Weightage used</span>
                <span className="mini-metric-value">{totalWeightage}%</span>
              </div>
              <div className="mini-metric">
                <span className="mini-metric-label">CLOs covered</span>
                <span className="mini-metric-value">{coveredClos.length}</span>
              </div>
            </div>

            <ul className="data-points" style={{ marginTop: '0.9rem' }}>
              <li>
                <strong>Course CLOs</strong>
                <span>{selectedCourse?.clos?.length || 0} outcomes available</span>
              </li>
              <li>
                <strong>Program</strong>
                <span>{selectedCourse?.program?.code || selectedCourse?.program?.name || 'Not linked'}</span>
              </li>
            </ul>
          </div>

          <div className="card">
            <div className="section-heading">
              <div>
                <h3>Assessment Library</h3>
                <p className="muted">Saved assessment structures for the currently selected course.</p>
              </div>
              <span className="status-badge badge-muted">{courseAssessments.length} saved</span>
            </div>

            {courseAssessments.length ? (
              <div className="stack">
                {courseAssessments.map((item) => (
                  <div className="subcard" key={item._id}>
                    <div className="section-heading">
                      <div>
                        <strong>{item.title}</strong>
                        <div className="muted">{item.type}</div>
                      </div>
                      <span className="status-badge badge-muted">{item.weightage}%</span>
                    </div>

                    <div className="request-meta-grid">
                      <span>
                        <strong>Marks:</strong> {item.totalMarks}
                      </span>
                      <span>
                        <strong>Rubrics:</strong> {item.rubricCriteria?.length || 0}
                      </span>
                      <span>
                        <strong>CLOs:</strong> {getAssessmentCloCodes(item).join(', ') || 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">No assessments saved for this course yet.</p>
            )}
          </div>

          <div className="card">
            <h3>Design Guide</h3>
            <ul className="helper-list">
              <li>Balance quiz, assignment, mid, and final weightage so the course does not over-rely on one checkpoint.</li>
              <li>Use CLO distribution lines only when the marks truly map to those outcomes.</li>
              <li>Rubric criteria should describe observable performance, not generic quality labels.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AssessmentsPage;
