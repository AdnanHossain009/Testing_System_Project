import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import Loading from '../components/Loading';
import { useAuth } from '../context/AuthContext';
import { hasRole } from '../utils/roleUtils';

const managerRoles = ['admin', 'accreditation_officer'];

const initialForm = {
  academicTerm: '',
  outcomeType: 'CLO',
  outcomeCode: '',
  currentAttainment: 0,
  targetAttainment: 60,
  department: '',
  program: '',
  course: '',
  assignedTo: '',
  dueDate: '',
  status: 'open',
  rootCause: '',
  proposedAction: '',
  improvementNote: '',
  reviewNote: '',
  reviewedAttainment: ''
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

const buildInitialFormFromSearch = (searchParams) => ({
  academicTerm: searchParams.get('academicTerm') || '',
  outcomeType: searchParams.get('outcomeType') || 'CLO',
  outcomeCode: searchParams.get('outcomeCode') || '',
  currentAttainment: searchParams.get('currentAttainment') || 0,
  targetAttainment: searchParams.get('targetAttainment') || 60,
  department: searchParams.get('department') || '',
  program: searchParams.get('program') || '',
  course: searchParams.get('course') || '',
  assignedTo: '',
  dueDate: '',
  status: 'open',
  rootCause: '',
  proposedAction: '',
  improvementNote: '',
  reviewNote: '',
  reviewedAttainment: ''
});

const ImprovementPlanFormPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const canManage = hasRole(user, managerRoles);
  const [form, setForm] = useState(() => buildInitialFormFromSearch(searchParams));
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadOptions = async () => {
      if (!canManage) {
        setLoading(false);
        return;
      }

      try {
        const [departmentsResponse, programsResponse, coursesResponse, usersResponse] = await Promise.all([
          api.get('/departments'),
          api.get('/programs'),
          api.get('/courses'),
          api.get('/users')
        ]);

        setDepartments(departmentsResponse.data.data.departments || []);
        setPrograms(programsResponse.data.data.programs || []);
        setCourses(coursesResponse.data.data.courses || []);
        setUsers((usersResponse.data.data.users || []).filter((item) => item.role !== 'student'));
      } catch (error) {
        setMessage(error?.response?.data?.message || 'Failed to load improvement plan form options.');
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, [canManage]);

  const availablePrograms = useMemo(
    () => getProgramsForDepartment(programs, form.department),
    [form.department, programs]
  );
  const availableCourses = useMemo(
    () => getCoursesForScope(courses, form.department, form.program),
    [courses, form.department, form.program]
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

  const handleCourseChange = (courseId) => {
    const selectedCourse = courses.find((item) => item._id === courseId);

    setForm((current) => ({
      ...current,
      course: courseId,
      department: selectedCourse?.department?._id || current.department,
      program: selectedCourse?.program?._id || current.program
    }));
  };

  const submitHandler = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await api.post('/improvement-plans', {
        ...form,
        currentAttainment: Number(form.currentAttainment),
        targetAttainment: Number(form.targetAttainment),
        reviewedAttainment: form.reviewedAttainment === '' ? null : Number(form.reviewedAttainment)
      });

      navigate(`/accreditation/improvement-plans/${response.data.data.plan._id}`);
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Failed to create improvement plan.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading text="Loading improvement plan form..." />;
  }

  if (!canManage) {
    return (
      <div className="card">
        <h1>Improvement Plans</h1>
        <p className="muted">Only admin and accreditation officer can create new improvement plans.</p>
        <Link className="btn btn-secondary" to="/accreditation/improvement-plans">
          Back to Improvement Plans
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Create Improvement Plan</h1>
        <p className="muted">Document the root cause, action, accountability, due date, and review path for a weak outcome.</p>
      </div>

      {message ? <div className="error-box">{message}</div> : null}

      <div className="inline-actions" style={{ marginBottom: '1rem' }}>
        <Link className="btn btn-secondary" to="/accreditation/improvement-plans">
          Back to Improvement Plans
        </Link>
      </div>

      <form className="card" onSubmit={submitHandler}>
        <div className="grid grid-3">
          <div>
            <label>Academic Term</label>
            <input
              value={form.academicTerm}
              onChange={(event) => setForm((current) => ({ ...current, academicTerm: event.target.value }))}
              placeholder="Optional"
            />
          </div>
          <div>
            <label>Outcome Type</label>
            <select value={form.outcomeType} onChange={(event) => setForm((current) => ({ ...current, outcomeType: event.target.value }))}>
              <option value="CLO">CLO</option>
              <option value="PLO">PLO</option>
            </select>
          </div>
          <div>
            <label>Outcome Code</label>
            <input
              value={form.outcomeCode}
              onChange={(event) => setForm((current) => ({ ...current, outcomeCode: event.target.value.toUpperCase() }))}
              required
            />
          </div>
          <div>
            <label>Current Attainment</label>
            <input
              type="number"
              min="0"
              max="100"
              value={form.currentAttainment}
              onChange={(event) => setForm((current) => ({ ...current, currentAttainment: event.target.value }))}
              required
            />
          </div>
          <div>
            <label>Target Attainment</label>
            <input
              type="number"
              min="0"
              max="100"
              value={form.targetAttainment}
              onChange={(event) => setForm((current) => ({ ...current, targetAttainment: event.target.value }))}
              required
            />
          </div>
          <div>
            <label>Due Date</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
              required
            />
          </div>
          <div>
            <label>Department</label>
            <select value={form.department} onChange={(event) => handleDepartmentChange(event.target.value)}>
              <option value="">Select Department</option>
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
              <option value="">Select Program</option>
              {availablePrograms.map((item) => (
                <option value={item._id} key={item._id}>
                  {item.code} - {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Course</label>
            <select value={form.course} onChange={(event) => handleCourseChange(event.target.value)}>
              <option value="">Select Course</option>
              {availableCourses.map((item) => (
                <option value={item._id} key={item._id}>
                  {item.code} - {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Assigned To</label>
            <select value={form.assignedTo} onChange={(event) => setForm((current) => ({ ...current, assignedTo: event.target.value }))}>
              <option value="">Unassigned</option>
              {users.map((item) => (
                <option value={item._id} key={item._id}>
                  {item.name} ({item.role})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Initial Status</label>
            <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="reviewed">Reviewed</option>
            </select>
          </div>
        </div>

        <label>Root Cause</label>
        <textarea
          rows="4"
          value={form.rootCause}
          onChange={(event) => setForm((current) => ({ ...current, rootCause: event.target.value }))}
          placeholder="Explain why the outcome is below target."
        />

        <label>Proposed Action</label>
        <textarea
          rows="4"
          value={form.proposedAction}
          onChange={(event) => setForm((current) => ({ ...current, proposedAction: event.target.value }))}
          placeholder="Describe the improvement action."
          required
        />

        <label>Improvement Note</label>
        <textarea
          rows="3"
          value={form.improvementNote}
          onChange={(event) => setForm((current) => ({ ...current, improvementNote: event.target.value }))}
          placeholder="Optional implementation note"
        />

        <div className="inline-actions">
          <button className="btn" disabled={saving}>
            {saving ? 'Saving...' : 'Create Improvement Plan'}
          </button>
          <Link className="btn btn-secondary" to="/accreditation/improvement-plans">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ImprovementPlanFormPage;
