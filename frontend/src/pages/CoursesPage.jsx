import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
      return {
        code: code?.trim(),
        description: description?.trim(),
        bloomLevel: bloomLevel?.trim() || 'C3'
      };
    })
    .filter((item) => item.code && item.description);

const summarizeClos = (clos = []) => (clos.length ? clos.map((item) => item.code).join(', ') : 'N/A');

const summarizePlos = (mapping = []) => {
  const ploCodes = Array.from(new Set((mapping || []).map((item) => item.ploCode)));
  return ploCodes.length ? ploCodes.join(', ') : 'N/A';
};

const summarizePairs = (mapping = []) =>
  mapping?.length ? mapping.map((item) => `${item.cloCode}→${item.ploCode} (${item.weight})`).join(', ') : 'N/A';

const formatDate = (value) => (value ? new Date(value).toLocaleString() : 'N/A');

const CoursesPage = () => {
  const { user } = useAuth();
  const canManage = ['admin', 'head'].includes(user?.role);
  const canViewDetails = ['admin', 'faculty', 'head', 'accreditation_officer'].includes(user?.role);
  const isStudent = user?.role === 'student';

  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [facultyUsers, setFacultyUsers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [studentEnrollments, setStudentEnrollments] = useState([]);
  const [studentRequests, setStudentRequests] = useState([]);

  const loadCatalog = async (term = searchValue) => {
    setCatalogLoading(true);
    try {
      const params = term.trim() ? { search: term.trim() } : undefined;
      const response = await api.get('/courses', { params });
      setCourses(response.data.data.courses || []);
    } finally {
      setCatalogLoading(false);
    }
  };

  const loadManagementData = async () => {
    const [deptResponse, programResponse, facultyResponse] = await Promise.all([
      api.get('/departments'),
      api.get('/programs'),
      api.get('/users', { params: { role: 'faculty' } })
    ]);

    const deptList = deptResponse.data.data.departments || [];
    const progList = programResponse.data.data.programs || [];
    const facultyList = facultyResponse.data.data.users || [];

    setDepartments(deptList);
    setPrograms(progList);
    setFacultyUsers(facultyList);
    setForm((prev) => ({
      ...prev,
      department: prev.department || deptList[0]?._id || '',
      program: prev.program || progList[0]?._id || '',
      faculty: prev.faculty || facultyList[0]?._id || ''
    }));
  };

  const loadStudentStatus = async () => {
    const [enrollmentResponse, requestResponse] = await Promise.all([
      api.get('/enrollments/me'),
      api.get('/course-requests/my', { params: { type: 'student_enrollment' } })
    ]);

    setStudentEnrollments(enrollmentResponse.data.data.enrollments || []);
    setStudentRequests(requestResponse.data.data.requests || []);
  };

  const initialize = async () => {
    setLoading(true);
    try {
      await loadCatalog('');

      if (canManage) {
        await loadManagementData();
      }

      if (isStudent) {
        await loadStudentStatus();
      }
    } catch (error) {
      setFeedback(error?.response?.data?.message || 'Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initialize();
  }, [user?.role]);

  const submitHandler = async (event) => {
    event.preventDefault();

    if (!canManage) return;

    setFeedback('');

    try {
      await api.post('/courses', {
        ...form,
        credits: Number(form.credits),
        clos: parseCLOs(form.closText)
      });

      setFeedback('Course created successfully.');
      setForm((prev) => ({
        ...initialForm,
        department: prev.department,
        program: prev.program,
        faculty: prev.faculty
      }));
      await loadCatalog(searchValue);
      await loadManagementData();
    } catch (error) {
      setFeedback(error?.response?.data?.message || 'Failed to create course.');
    }
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    setFeedback('');
    await loadCatalog(searchValue);
  };

  const handleClearSearch = async () => {
    setSearchValue('');
    await loadCatalog('');
  };

  const requestEnrollment = async (courseId) => {
    setFeedback('');

    try {
      await api.post('/course-requests/student-enrollment', { courseId });
      setFeedback('Enrollment request submitted to the course faculty.');
      await Promise.all([loadCatalog(searchValue), loadStudentStatus()]);
    } catch (error) {
      setFeedback(error?.response?.data?.message || 'Failed to request enrollment.');
    }
  };

  const enrolledCourseIds = new Set(studentEnrollments.map((item) => String(item.course?._id || item.course)));
  const pendingRequestCourseIds = new Set(
    studentRequests
      .filter((item) => item.status === 'pending')
      .map((item) => String(item.course?._id || item.course))
  );

  if (loading) return <Loading text="Loading courses..." />;

  return (
    <div>
      <div className="page-header">
        <h1>Courses</h1>
        <p className="muted">
          Search by course name, course code, or faculty. Students can request enrollment from here.
        </p>
      </div>

      {feedback ? <div className={feedback.toLowerCase().includes('failed') ? 'error-box' : 'success-box'}>{feedback}</div> : null}

      {canManage ? (
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
              <input
                type="number"
                value={form.credits}
                onChange={(e) => setForm({ ...form, credits: e.target.value })}
              />
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
      ) : null}

      <form className="card" onSubmit={handleSearch} style={{ marginTop: '1rem' }}>
        <h3>Search Courses</h3>
        <div className="inline-actions" style={{ alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label>Search by name, code, or faculty</label>
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="e.g. Machine Learning, CSE401, Prof. Amina"
            />
          </div>
          <button className="btn" type="submit" disabled={catalogLoading}>
            {catalogLoading ? 'Searching...' : 'Search'}
          </button>
          <button className="btn btn-secondary" type="button" onClick={handleClearSearch}>
            Clear
          </button>
        </div>
      </form>

      <div className="card">
        <h3>Course List</h3>
        {catalogLoading ? <Loading text="Updating course list..." /> : null}

        <table className="table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Faculty</th>
              <th>CLOs</th>
              <th>PLOs</th>
              <th>CLO-PLO Map</th>
              <th>Status</th>
              {canViewDetails || isStudent ? <th>Action</th> : null}
            </tr>
          </thead>
          <tbody>
            {courses.map((item) => {
              const courseId = String(item._id);
              const isEnrolled = enrolledCourseIds.has(courseId);
              const isPending = pendingRequestCourseIds.has(courseId);
              const studentStatus = isEnrolled ? 'Enrolled' : isPending ? 'Request Pending' : 'Available';

              return (
                <tr key={item._id}>
                  <td>
                    <strong>{item.code}</strong>
                    <div className="muted">{item.name}</div>
                    {item.description ? <div className="muted">{item.description}</div> : null}
                  </td>
                  <td>
                    <div>{item.faculty?.name || 'Not Assigned'}</div>
                    <div className="muted">{item.faculty?.facultyId || item.faculty?.email || 'N/A'}</div>
                  </td>
                  <td>{summarizeClos(item.clos)}</td>
                  <td>{summarizePlos(item.cloPloMapping?.mappings)}</td>
                  <td className="muted">{summarizePairs(item.cloPloMapping?.mappings)}</td>
                  <td>{isStudent ? studentStatus : item.active ? 'Active' : 'Inactive'}</td>
                  {canViewDetails || isStudent ? (
                    <td>
                      {isStudent ? (
                        <button
                          className="btn"
                          type="button"
                          onClick={() => requestEnrollment(item._id)}
                          disabled={isEnrolled || isPending || !item.faculty}
                        >
                          {isEnrolled ? 'Enrolled' : isPending ? 'Pending' : 'Request Enrollment'}
                        </button>
                      ) : (
                        <Link className="btn btn-secondary" to={`/courses/${item._id}`}>
                          View details
                        </Link>
                      )}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CoursesPage;
