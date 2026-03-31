import { useEffect, useState } from 'react';
import api from '../api/client';
import Loading from '../components/Loading';
import { useAuth } from '../context/AuthContext';

const initialForm = {
  name: '',
  code: '',
  credits: 3,
  semester: '8th',
  department: '',
  program: '',
  faculty: '',
  closText: 'CLO1|Explain the topic|C2'
};

const parseCLOs = (text) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [code, description, bloomLevel] = line.split('|');
      return { code: code?.trim(), description: description?.trim(), bloomLevel: bloomLevel?.trim() || 'C3' };
    });

const CoursesPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [facultyUsers, setFacultyUsers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    const requests = [api.get('/courses'), api.get('/departments'), api.get('/programs')];
    if (user?.role === 'admin' || user?.role === 'head') {
      requests.push(api.get('/users?role=faculty'));
    }

    const [courseResponse, deptResponse, programResponse, facultyResponse] = await Promise.all(requests);
    const deptList = deptResponse.data.data.departments;
    const progList = programResponse.data.data.programs;

    setCourses(courseResponse.data.data.courses);
    setDepartments(deptList);
    setPrograms(progList);
    setFacultyUsers(facultyResponse?.data?.data?.users || []);
    setForm((prev) => ({
      ...prev,
      department: prev.department || deptList[0]?._id || '',
      program: prev.program || progList[0]?._id || '',
      faculty: prev.faculty || facultyResponse?.data?.data?.users?.[0]?._id || ''
    }));
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const submitHandler = async (event) => {
    event.preventDefault();
    await api.post('/courses', {
      ...form,
      credits: Number(form.credits),
      clos: parseCLOs(form.closText)
    });
    setForm(initialForm);
    loadAll();
  };

  if (loading) return <Loading text="Loading courses..." />;

  return (
    <div>
      <div className="page-header">
        <h1>Courses</h1>
        <p className="muted">Create courses and enter CLO definitions directly from this page.</p>
      </div>

      {(user?.role === 'admin' || user?.role === 'head') && (
        <form className="card" onSubmit={submitHandler}>
          <h3>Create Course</h3>
          <div className="grid grid-2">
            <div>
              <label>Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label>Code</label>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </div>
            <div>
              <label>Credits</label>
              <input value={form.credits} onChange={(e) => setForm({ ...form, credits: e.target.value })} />
            </div>
            <div>
              <label>Semester</label>
              <input value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} />
            </div>
            <div>
              <label>Department</label>
              <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                {departments.map((item) => (
                  <option value={item._id} key={item._id}>
                    {item.code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Program</label>
              <select value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })}>
                {programs.map((item) => (
                  <option value={item._id} key={item._id}>
                    {item.code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Faculty</label>
              <select value={form.faculty} onChange={(e) => setForm({ ...form, faculty: e.target.value })}>
                {facultyUsers.map((item) => (
                  <option value={item._id} key={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label>CLOs (one per line, format: code|description|bloom)</label>
          <textarea
            rows="5"
            value={form.closText}
            onChange={(e) => setForm({ ...form, closText: e.target.value })}
          />
          <button className="btn">Save Course</button>
        </form>
      )}

      <div className="card">
        <h3>Course List</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Faculty</th>
              <th>CLO Count</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((item) => (
              <tr key={item._id}>
                <td>
                  {item.code} - {item.name}
                </td>
                <td>{item.faculty?.name || 'Not Assigned'}</td>
                <td>{item.clos?.length || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CoursesPage;
