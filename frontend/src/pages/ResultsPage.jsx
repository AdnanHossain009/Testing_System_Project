import { useEffect, useState } from 'react';
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
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [latestFuzzy, setLatestFuzzy] = useState(null);

  const loadStudentView = async () => {
    const response = await api.get('/results/me');
    setMyResults(response.data.data.results);
    setLoading(false);
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
      const resultResponse = await api.get(`/results/course/${courseList[0]._id}`);
      setCourseResults(resultResponse.data.data.results);
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
    const response = await api.get(`/results/course/${courseId}`);
    setCourseResults(response.data.data.results);
  };

  const submitHandler = async (event) => {
    event.preventDefault();
    const response = await api.post('/results', {
      studentId: form.studentId,
      courseId: form.courseId,
      marks: {
        quiz: Number(form.quiz),
        assignment: Number(form.assignment),
        mid: Number(form.mid),
        final: Number(form.final)
      }
    });
    setLatestFuzzy(response.data.data.fuzzy);
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

      <div className={canEdit ? 'grid grid-2' : 'card'}>
        {canEdit ? (
          <form className="card" onSubmit={submitHandler}>
            <h3>Enter Student Marks</h3>

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

            <label>Quiz</label>
            <input value={form.quiz} onChange={(e) => setForm({ ...form, quiz: e.target.value })} />

            <label>Assignment</label>
            <input
              value={form.assignment}
              onChange={(e) => setForm({ ...form, assignment: e.target.value })}
            />

            <label>Mid</label>
            <input value={form.mid} onChange={(e) => setForm({ ...form, mid: e.target.value })} />

            <label>Final</label>
            <input value={form.final} onChange={(e) => setForm({ ...form, final: e.target.value })} />

            <button className="btn">Save and Evaluate</button>

            {latestFuzzy ? (
              <div className="success-box">
                <strong>Latest Fuzzy Activation</strong>
                <pre>{JSON.stringify(latestFuzzy.activatedRules, null, 2)}</pre>
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

        <div className="card">
          <h3>Stored Course Results</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Fuzzy</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {courseResults.map((item) => (
                <tr key={item._id}>
                  <td>{item.student?.name}</td>
                  <td>{item.fuzzyScore}</td>
                  <td>{item.riskBand}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
