import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import Loading from '../components/Loading';
import { useAuth } from '../context/AuthContext';
import {
  buildScopeText,
  formatDateInput,
  formatDisplayDate,
  getImprovementStatusClassName
} from '../utils/improvementPlanHelpers';

const managerRoles = ['admin', 'accreditation_officer'];

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

const ImprovementPlanDetailsPage = () => {
  const { user } = useAuth();
  const { planId } = useParams();
  const navigate = useNavigate();
  const canManage = managerRoles.includes(user?.role);
  const [plan, setPlan] = useState(null);
  const [form, setForm] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const hydrateForm = (item) => ({
    academicTerm: item.academicTerm || '',
    outcomeType: item.outcomeType || 'CLO',
    outcomeCode: item.outcomeCode || '',
    currentAttainment: item.currentAttainment ?? 0,
    targetAttainment: item.targetAttainment ?? 60,
    department: item.department?._id || '',
    program: item.program?._id || '',
    course: item.course?._id || '',
    assignedTo: item.assignedTo?._id || '',
    dueDate: formatDateInput(item.dueDate),
    status: item.status || 'open',
    rootCause: item.rootCause || '',
    proposedAction: item.proposedAction || '',
    improvementNote: item.improvementNote || '',
    reviewNote: item.reviewNote || '',
    reviewedAttainment: item.reviewedAttainment ?? ''
  });

  const loadPlan = async () => {
    setLoading(true);
    setMessage('');

    try {
      const requests = [api.get(`/improvement-plans/${planId}`)];

      if (canManage) {
        requests.push(api.get('/departments'));
        requests.push(api.get('/programs'));
        requests.push(api.get('/courses'));
        requests.push(api.get('/users'));
      }

      const responses = await Promise.all(requests);
      const [planResponse, departmentsResponse, programsResponse, coursesResponse, usersResponse] = responses;
      const loadedPlan = planResponse.data.data.plan;

      setPlan(loadedPlan);
      setForm(hydrateForm(loadedPlan));

      if (canManage) {
        setDepartments(departmentsResponse.data.data.departments || []);
        setPrograms(programsResponse.data.data.programs || []);
        setCourses(coursesResponse.data.data.courses || []);
        setUsers((usersResponse.data.data.users || []).filter((item) => item.role !== 'student'));
      }
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Failed to load improvement plan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlan();
  }, [planId, user?.role]);

  const availablePrograms = useMemo(
    () => getProgramsForDepartment(programs, form?.department),
    [form?.department, programs]
  );
  const availableCourses = useMemo(
    () => getCoursesForScope(courses, form?.department, form?.program),
    [courses, form?.department, form?.program]
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

  const submitPlanUpdate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await api.patch(`/improvement-plans/${planId}`, {
        ...form,
        currentAttainment: Number(form.currentAttainment),
        targetAttainment: Number(form.targetAttainment),
        reviewedAttainment: form.reviewedAttainment === '' ? null : Number(form.reviewedAttainment)
      });

      setPlan(response.data.data.plan);
      setForm(hydrateForm(response.data.data.plan));
      setMessage('Improvement plan updated successfully.');
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Failed to update improvement plan.');
    } finally {
      setSaving(false);
    }
  };

  const submitStatusUpdate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await api.patch(`/improvement-plans/${planId}/status`, {
        ...form,
        currentAttainment: Number(form.currentAttainment),
        targetAttainment: Number(form.targetAttainment),
        reviewedAttainment: form.reviewedAttainment === '' ? null : Number(form.reviewedAttainment)
      });

      setPlan(response.data.data.plan);
      setForm(hydrateForm(response.data.data.plan));
      setMessage('Improvement plan status updated successfully.');
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Failed to update plan status.');
    } finally {
      setSaving(false);
    }
  };

  const deletePlan = async () => {
    const confirmed = window.confirm('Delete this improvement plan?');

    if (!confirmed) return;

    setSaving(true);
    setMessage('');

    try {
      await api.delete(`/improvement-plans/${planId}`);
      navigate('/accreditation/improvement-plans');
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Failed to delete improvement plan.');
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading text="Loading improvement plan..." />;
  }

  if (!plan || !form) {
    return <div className="error-box">{message || 'Improvement plan could not be loaded.'}</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>
          {plan.outcomeType} {plan.outcomeCode}
        </h1>
        <p className="muted">Review the action, ownership, status, and post-implementation notes for this outcome.</p>
      </div>

      {message ? <div className={message.toLowerCase().includes('failed') ? 'error-box' : 'success-box'}>{message}</div> : null}

      <div className="inline-actions" style={{ marginBottom: '1rem' }}>
        <Link className="btn btn-secondary" to="/accreditation/improvement-plans">
          Back to Improvement Plans
        </Link>
        {canManage ? (
          <button className="btn btn-secondary" type="button" onClick={deletePlan} disabled={saving}>
            Delete Plan
          </button>
        ) : null}
      </div>

      <div className="grid grid-4">
        <div className="card stat-card">
          <span className="stat-label">Status</span>
          <span className={`status-badge ${getImprovementStatusClassName(plan.status)}`}>{plan.status.replace('_', ' ')}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Gap</span>
          <span className="stat-value">{plan.gap}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Due Date</span>
          <span className="stat-value" style={{ fontSize: '1.2rem' }}>{formatDisplayDate(plan.dueDate)}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Reviewed Gap</span>
          <span className="stat-value">{plan.reviewGap ?? 'N/A'}</span>
        </div>
      </div>

      <div className="grid grid-2 align-start">
        <div className="card">
          <h3>Plan Snapshot</h3>
          <p>
            <strong>Scope:</strong> {buildScopeText(plan)}
          </p>
          <p>
            <strong>Academic Term:</strong> {plan.academicTerm || 'Not specified'}
          </p>
          <p>
            <strong>Current Attainment:</strong> {plan.currentAttainment}
          </p>
          <p>
            <strong>Target Attainment:</strong> {plan.targetAttainment}
          </p>
          <p>
            <strong>Assigned To:</strong> {plan.assignedTo?.name || 'Unassigned'}
          </p>
          <p>
            <strong>Created By:</strong> {plan.createdBy?.name || 'N/A'}
          </p>
          <p>
            <strong>Reviewed Attainment:</strong> {plan.reviewedAttainment ?? 'Not reviewed yet'}
          </p>
          <p>
            <strong>Review Note:</strong> {plan.reviewNote || 'No review note added yet.'}
          </p>
        </div>

        <div className="card">
          <h3>Root Cause and Action</h3>
          <p>
            <strong>Root Cause:</strong>
          </p>
          <p className="muted">{plan.rootCause || 'No root cause documented yet.'}</p>
          <p>
            <strong>Proposed Action:</strong>
          </p>
          <p className="muted">{plan.proposedAction}</p>
          <p>
            <strong>Improvement Note:</strong>
          </p>
          <p className="muted">{plan.improvementNote || 'No implementation note added yet.'}</p>
        </div>
      </div>

      {canManage ? (
        <div className="grid grid-2 align-start">
          <form className="card" onSubmit={submitPlanUpdate}>
            <h3>Edit Plan Details</h3>

            <div className="grid grid-2">
              <div>
                <label>Academic Term</label>
                <input
                  value={form.academicTerm}
                  onChange={(event) => setForm((current) => ({ ...current, academicTerm: event.target.value }))}
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
            </div>

            <label>Root Cause</label>
            <textarea
              rows="4"
              value={form.rootCause}
              onChange={(event) => setForm((current) => ({ ...current, rootCause: event.target.value }))}
            />

            <label>Proposed Action</label>
            <textarea
              rows="4"
              value={form.proposedAction}
              onChange={(event) => setForm((current) => ({ ...current, proposedAction: event.target.value }))}
              required
            />

            <button className="btn" disabled={saving}>
              {saving ? 'Saving...' : 'Save Plan Details'}
            </button>
          </form>

          <form className="card" onSubmit={submitStatusUpdate}>
            <h3>Status and Review</h3>

            <label>Status</label>
            <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="reviewed">Reviewed</option>
            </select>

            <label>Improvement Note</label>
            <textarea
              rows="4"
              value={form.improvementNote}
              onChange={(event) => setForm((current) => ({ ...current, improvementNote: event.target.value }))}
              placeholder="Document what was implemented."
            />

            <label>Reviewed Attainment</label>
            <input
              type="number"
              min="0"
              max="100"
              value={form.reviewedAttainment}
              onChange={(event) => setForm((current) => ({ ...current, reviewedAttainment: event.target.value }))}
              placeholder="Optional"
            />

            <label>Review Note</label>
            <textarea
              rows="4"
              value={form.reviewNote}
              onChange={(event) => setForm((current) => ({ ...current, reviewNote: event.target.value }))}
              placeholder="Document post-implementation review."
            />

            <button className="btn" disabled={saving}>
              {saving ? 'Saving...' : 'Update Status'}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
};

export default ImprovementPlanDetailsPage;
