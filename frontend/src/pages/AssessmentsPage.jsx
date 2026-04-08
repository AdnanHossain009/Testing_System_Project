import { useEffect, useState } from 'react';
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

const AssessmentsPage = () => {
  const [courses, setCourses] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    const [courseResponse, assessmentResponse] = await Promise.all([
      api.get('/courses'),
      api.get('/assessments')
    ]);

    const courseList = courseResponse.data.data.courses;
    setCourses(courseList);
    setAssessments(assessmentResponse.data.data.assessments);
    setForm((prev) => ({ ...prev, course: prev.course || courseList[0]?._id || '' }));
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const submitHandler = async (event) => {
    event.preventDefault();
    await api.post('/assessments', {
      ...form,
      totalMarks: Number(form.totalMarks),
      weightage: Number(form.weightage),
      cloCodes: form.cloCodesText.split(',').map((item) => item.trim()),
      cloDistribution: parseCloDistribution(form.cloDistributionText),
      rubricCriteria: parseRubrics(form.rubricText)
    });
    setForm(initialForm);
    loadAll();
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

      <div className="grid grid-2">
        <form className="card" onSubmit={submitHandler}>
          <h3>Create Assessment</h3>
          <label>Course</label>
          <select value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })}>
            {courses.map((item) => (
              <option value={item._id} key={item._id}>
                {item.code}
              </option>
            ))}
          </select>

          <label>Title</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />

          <label>Type</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="quiz">Quiz</option>
            <option value="assignment">Assignment</option>
            <option value="mid">Mid</option>
            <option value="final">Final</option>
          </select>

          <label>CLO Codes (comma separated)</label>
          <input
            value={form.cloCodesText}
            onChange={(e) => setForm({ ...form, cloCodesText: e.target.value })}
            placeholder="CLO1,CLO2"
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

          <label>Total Marks</label>
          <input
            value={form.totalMarks}
            onChange={(e) => setForm({ ...form, totalMarks: e.target.value })}
          />

          <label>Weightage (%)</label>
          <input
            value={form.weightage}
            onChange={(e) => setForm({ ...form, weightage: e.target.value })}
          />

          <button className="btn">Save Assessment</button>
        </form>

        <div className="card">
          <h3>Existing Assessments</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Type</th>
                <th>Weightage</th>
                <th>CLO Split</th>
                <th>Rubrics</th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((item) => (
                <tr key={item._id}>
                  <td>{item.course?.code}</td>
                  <td>{item.type}</td>
                  <td>{item.weightage}%</td>
                  <td>
                    {(item.cloDistribution?.length
                      ? item.cloDistribution.map((entry) => `${entry.cloCode}:${entry.marks}`).join(', ')
                      : item.cloCodes?.join(', ') || 'N/A')}
                  </td>
                  <td>{item.rubricCriteria?.length || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AssessmentsPage;
