import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Loading from '../components/Loading';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';
import { hasRole } from '../utils/roleUtils';
import {
  buildOutcomeScopeText,
  buildScopeText,
  formatDisplayDate,
  getImprovementStatusClassName
} from '../utils/improvementPlanHelpers';

const initialFilters = {
  academicTerm: '',
  departmentId: '',
  programId: '',
  courseId: '',
  outcomeType: '',
  status: ''
};

const initialTargetForm = {
  academicTerm: '',
  outcomeType: 'CLO',
  targetAttainment: 60,
  scopeType: 'institution',
  department: '',
  program: '',
  course: '',
  notes: ''
};

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

const buildTargetScopeLabel = (target) => {
  if (target.scopeType === 'course') {
    return target.course?.code ? `Course ${target.course.code}` : 'Course';
  }

  if (target.scopeType === 'program') {
    return target.program?.code ? `Program ${target.program.code}` : 'Program';
  }

  if (target.scopeType === 'department') {
    return target.department?.code ? `Department ${target.department.code}` : 'Department';
  }

  return 'Institution';
};

const createPlanLink = (item) => {
  const params = new URLSearchParams();

  if (item.academicTerm) params.set('academicTerm', item.academicTerm);
  if (item.outcomeType) params.set('outcomeType', item.outcomeType);
  if (item.outcomeCode) params.set('outcomeCode', item.outcomeCode);
  if (item.currentAttainment !== undefined) params.set('currentAttainment', String(item.currentAttainment));
  if (item.targetAttainment !== undefined) params.set('targetAttainment', String(item.targetAttainment));
  if (item.departmentId) params.set('department', item.departmentId);
  if (item.programId) params.set('program', item.programId);
  if (item.courseId) params.set('course', item.courseId);

  return `/accreditation/improvement-plans/new?${params.toString()}`;
};

const ImprovementPlansPage = () => {
  const { user } = useAuth();
  const canManage = hasRole(user, managerRoles);
  const [filters, setFilters] = useState(initialFilters);
  const [plans, setPlans] = useState([]);
  const [outcomes, setOutcomes] = useState([]);
  const [targets, setTargets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [targetForm, setTargetForm] = useState(initialTargetForm);
  const [editingTargetId, setEditingTargetId] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingTarget, setSavingTarget] = useState(false);
  const [message, setMessage] = useState('');

  const availablePrograms = useMemo(
    () => getProgramsForDepartment(programs, filters.departmentId),
    [filters.departmentId, programs]
  );
  const availableCourses = useMemo(
    () => getCoursesForScope(courses, filters.departmentId, filters.programId),
    [courses, filters.departmentId, filters.programId]
  );

  const targetPrograms = useMemo(
    () => getProgramsForDepartment(programs, targetForm.department),
    [programs, targetForm.department]
  );
  const targetCourses = useMemo(
    () => getCoursesForScope(courses, targetForm.department, targetForm.program),
    [courses, targetForm.department, targetForm.program]
  );

  const loadPage = async () => {
    setLoading(true);
    setMessage('');

    try {
      const params = {
        ...(filters.academicTerm ? { academicTerm: filters.academicTerm.trim() } : {}),
        ...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
        ...(filters.programId ? { programId: filters.programId } : {}),
        ...(filters.courseId ? { courseId: filters.courseId } : {}),
        ...(filters.outcomeType ? { outcomeType: filters.outcomeType } : {}),
        ...(filters.status ? { status: filters.status } : {})
      };

      const requests = [
        api.get('/improvement-plans', { params }),
        api.get('/improvement-plans/outcomes', { params }),
        api.get('/departments'),
        api.get('/programs'),
        api.get('/courses')
      ];

      if (canManage) {
        requests.push(api.get('/improvement-plans/targets'));
      }

      const responses = await Promise.all(requests);
      const [plansResponse, outcomesResponse, departmentsResponse, programsResponse, coursesResponse, targetsResponse] = responses;

      setPlans(plansResponse.data.data.plans || []);
      setOutcomes(outcomesResponse.data.data.outcomes || []);
      setDepartments(departmentsResponse.data.data.departments || []);
      setPrograms(programsResponse.data.data.programs || []);
      setCourses(coursesResponse.data.data.courses || []);
      setTargets(canManage ? targetsResponse?.data?.data?.targets || [] : []);
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Failed to load improvement planning data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, [user?.role]);

  const applyFilters = async (event) => {
    event.preventDefault();
    await loadPage();
  };

  const resetFilters = async () => {
    setFilters(initialFilters);
    setTimeout(() => {
      setFilters((current) => ({ ...current }));
    }, 0);
  };

  const refreshWithFilters = async (nextFilters = filters) => {
    const currentFilters = nextFilters;
    setLoading(true);
    setMessage('');

    try {
      const params = {
        ...(currentFilters.academicTerm ? { academicTerm: currentFilters.academicTerm.trim() } : {}),
        ...(currentFilters.departmentId ? { departmentId: currentFilters.departmentId } : {}),
        ...(currentFilters.programId ? { programId: currentFilters.programId } : {}),
        ...(currentFilters.courseId ? { courseId: currentFilters.courseId } : {}),
        ...(currentFilters.outcomeType ? { outcomeType: currentFilters.outcomeType } : {}),
        ...(currentFilters.status ? { status: currentFilters.status } : {})
      };

      const requests = [
        api.get('/improvement-plans', { params }),
        api.get('/improvement-plans/outcomes', { params })
      ];

      if (canManage) {
        requests.push(api.get('/improvement-plans/targets'));
      }

      const [plansResponse, outcomesResponse, targetsResponse] = await Promise.all(requests);
      setPlans(plansResponse.data.data.plans || []);
      setOutcomes(outcomesResponse.data.data.outcomes || []);

      if (canManage) {
        setTargets(targetsResponse?.data?.data?.targets || []);
      }
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Failed to refresh improvement planning data.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterDepartmentChange = (departmentId) => {
    const nextPrograms = getProgramsForDepartment(programs, departmentId);
    const nextCourses = getCoursesForScope(courses, departmentId, '');

    setFilters((current) => ({
      ...current,
      departmentId,
      programId: nextPrograms.find((item) => item._id === current.programId)?._id || '',
      courseId: nextCourses.find((item) => item._id === current.courseId)?._id || ''
    }));
  };

  const handleFilterProgramChange = (programId) => {
    const nextCourses = getCoursesForScope(courses, filters.departmentId, programId);
    setFilters((current) => ({
      ...current,
      programId,
      courseId: nextCourses.find((item) => item._id === current.courseId)?._id || ''
    }));
  };

  const handleTargetScopeTypeChange = (scopeType) => {
    setTargetForm((current) => ({
      ...current,
      scopeType,
      department: scopeType === 'institution' ? '' : current.department,
      program: ['institution', 'department'].includes(scopeType) ? '' : current.program,
      course: scopeType === 'course' ? current.course : ''
    }));
  };

  const handleTargetDepartmentChange = (department) => {
    const nextPrograms = getProgramsForDepartment(programs, department);
    const nextCourses = getCoursesForScope(courses, department, '');

    setTargetForm((current) => ({
      ...current,
      department,
      program: nextPrograms.find((item) => item._id === current.program)?._id || '',
      course: nextCourses.find((item) => item._id === current.course)?._id || ''
    }));
  };

  const handleTargetProgramChange = (program) => {
    const nextCourses = getCoursesForScope(courses, targetForm.department, program);
    setTargetForm((current) => ({
      ...current,
      program,
      course: nextCourses.find((item) => item._id === current.course)?._id || ''
    }));
  };

  const submitTarget = async (event) => {
    event.preventDefault();
    setSavingTarget(true);
    setMessage('');

    try {
      const payload = {
        ...targetForm,
        targetAttainment: Number(targetForm.targetAttainment)
      };

      if (editingTargetId) {
        await api.patch(`/improvement-plans/targets/${editingTargetId}`, payload);
        setMessage('Benchmark target updated successfully.');
      } else {
        await api.post('/improvement-plans/targets', payload);
        setMessage('Benchmark target created successfully.');
      }

      setEditingTargetId('');
      setTargetForm(initialTargetForm);
      await refreshWithFilters();
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Failed to save benchmark target.');
    } finally {
      setSavingTarget(false);
    }
  };

  const editTarget = (target) => {
    setEditingTargetId(target._id);
    setTargetForm({
      academicTerm: target.academicTerm || '',
      outcomeType: target.outcomeType || 'CLO',
      targetAttainment: target.targetAttainment || 60,
      scopeType: target.scopeType || 'institution',
      department: target.department?._id || '',
      program: target.program?._id || '',
      course: target.course?._id || '',
      notes: target.notes || ''
    });
  };

  const cancelTargetEdit = () => {
    setEditingTargetId('');
    setTargetForm(initialTargetForm);
  };

  if (loading && !plans.length && !outcomes.length && !targets.length) {
    return <Loading text="Loading improvement planning..." />;
  }

  const openPlans = plans.filter((item) => item.status === 'open').length;
  const overduePlans = plans.filter((item) => item.overdue).length;
  const completedPlans = plans.filter((item) => ['completed', 'reviewed'].includes(item.status)).length;
  const institutionTargets = targets.filter((item) => item.scopeType === 'institution').length;
  const scopedTargets = targets.filter((item) => item.scopeType !== 'institution').length;

  return (
    <div>
      <div className="page-header">
        <h1>Improvement Plans</h1>
        <p className="muted">
          Configure attainment targets, detect below-target outcomes, and manage closing-the-loop action plans.
        </p>
      </div>

      {message ? <div className={message.toLowerCase().includes('failed') ? 'error-box' : 'success-box'}>{message}</div> : null}

      <div className="grid grid-4">
        <StatCard label="Below Target Outcomes" value={outcomes.length} />
        <StatCard label="Open Plans" value={openPlans} />
        <StatCard label="Overdue Plans" value={overduePlans} />
        <StatCard label="Completed / Reviewed" value={completedPlans} />
      </div>

      <form className="card" onSubmit={applyFilters} style={{ marginBottom: '1rem' }}>
        <div className="section-heading">
          <div>
            <h3>Filters</h3>
            <p className="muted">Refine both below-target outcomes and improvement plans using the same scope filters.</p>
          </div>
        </div>

        <div className="grid grid-3">
          <div>
            <label>Academic Term</label>
            <input
              value={filters.academicTerm}
              onChange={(event) => setFilters((current) => ({ ...current, academicTerm: event.target.value }))}
              placeholder="e.g. 2026 Spring"
            />
          </div>
          <div>
            <label>Department</label>
            <select value={filters.departmentId} onChange={(event) => handleFilterDepartmentChange(event.target.value)}>
              <option value="">All Departments</option>
              {departments.map((item) => (
                <option value={item._id} key={item._id}>
                  {item.code} - {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Program</label>
            <select value={filters.programId} onChange={(event) => handleFilterProgramChange(event.target.value)}>
              <option value="">All Programs</option>
              {availablePrograms.map((item) => (
                <option value={item._id} key={item._id}>
                  {item.code} - {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Course</label>
            <select value={filters.courseId} onChange={(event) => setFilters((current) => ({ ...current, courseId: event.target.value }))}>
              <option value="">All Courses</option>
              {availableCourses.map((item) => (
                <option value={item._id} key={item._id}>
                  {item.code} - {item.name}
                </option>
              ))}
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
          <div>
            <label>Status</label>
            <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="reviewed">Reviewed</option>
            </select>
          </div>
        </div>

        <div className="inline-actions">
          <button className="btn" type="submit">
            Apply Filters
          </button>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={async () => {
              const nextFilters = initialFilters;
              setFilters(nextFilters);
              await refreshWithFilters(nextFilters);
            }}
          >
            Reset Filters
          </button>
        </div>
      </form>

      {canManage ? (
        <div className="workspace-grid">
          <form className="card" onSubmit={submitTarget}>
            <div className="section-heading">
              <div>
                <span className="kicker">Benchmark Control</span>
                <h3 style={{ marginTop: '0.55rem' }}>{editingTargetId ? 'Update Benchmark Target' : 'Add Benchmark Target'}</h3>
                <p className="muted">
                  Configure attainment expectations by institution, department, program, or course.
                </p>
              </div>
            </div>

            <div className="grid grid-2">
              <div>
                <label>Academic Term</label>
                <input
                  value={targetForm.academicTerm}
                  onChange={(event) => setTargetForm((current) => ({ ...current, academicTerm: event.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <div>
                <label>Outcome Type</label>
                <select
                  value={targetForm.outcomeType}
                  onChange={(event) => setTargetForm((current) => ({ ...current, outcomeType: event.target.value }))}
                >
                  <option value="CLO">CLO</option>
                  <option value="PLO">PLO</option>
                </select>
              </div>
              <div>
                <label>Target Attainment</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={targetForm.targetAttainment}
                  onChange={(event) => setTargetForm((current) => ({ ...current, targetAttainment: event.target.value }))}
                />
              </div>
              <div>
                <label>Scope Type</label>
                <select value={targetForm.scopeType} onChange={(event) => handleTargetScopeTypeChange(event.target.value)}>
                  <option value="institution">Institution</option>
                  <option value="department">Department</option>
                  <option value="program">Program</option>
                  <option value="course">Course</option>
                </select>
              </div>
              <div>
                <label>Department</label>
                <select
                  value={targetForm.department}
                  onChange={(event) => handleTargetDepartmentChange(event.target.value)}
                  disabled={targetForm.scopeType === 'institution'}
                >
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
                <select
                  value={targetForm.program}
                  onChange={(event) => handleTargetProgramChange(event.target.value)}
                  disabled={!['program', 'course'].includes(targetForm.scopeType)}
                >
                  <option value="">Select Program</option>
                  {targetPrograms.map((item) => (
                    <option value={item._id} key={item._id}>
                      {item.code} - {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Course</label>
                <select
                  value={targetForm.course}
                  onChange={(event) => setTargetForm((current) => ({ ...current, course: event.target.value }))}
                  disabled={targetForm.scopeType !== 'course'}
                >
                  <option value="">Select Course</option>
                  {targetCourses.map((item) => (
                    <option value={item._id} key={item._id}>
                      {item.code} - {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label>Notes</label>
            <textarea
              rows="3"
              value={targetForm.notes}
              onChange={(event) => setTargetForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Optional benchmark rationale"
            />

            <div className="inline-actions">
              <button className="btn" disabled={savingTarget}>
                {savingTarget ? 'Saving...' : editingTargetId ? 'Update Target' : 'Save Target'}
              </button>
              {editingTargetId ? (
                <button className="btn btn-secondary" type="button" onClick={cancelTargetEdit}>
                  Cancel Edit
                </button>
              ) : null}
            </div>
          </form>

          <aside className="workspace-rail">
            <div className="card card-accent">
              <span className="kicker">Planning Summary</span>
              <div className="section-heading" style={{ marginTop: '0.75rem' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{editingTargetId ? 'Editing target' : 'Benchmark coverage'}</h3>
                  <p className="muted">Use a mix of institution-wide and scoped benchmarks so weak outcomes are explained in context.</p>
                </div>
              </div>

              <div className="mini-metrics">
                <div className="mini-metric">
                  <span className="mini-metric-label">Configured targets</span>
                  <span className="mini-metric-value">{targets.length}</span>
                </div>
                <div className="mini-metric">
                  <span className="mini-metric-label">Institution level</span>
                  <span className="mini-metric-value">{institutionTargets}</span>
                </div>
                <div className="mini-metric">
                  <span className="mini-metric-label">Scoped targets</span>
                  <span className="mini-metric-value">{scopedTargets}</span>
                </div>
                <div className="mini-metric">
                  <span className="mini-metric-label">Below target outcomes</span>
                  <span className="mini-metric-value">{outcomes.length}</span>
                </div>
              </div>

              <ul className="data-points" style={{ marginTop: '0.9rem' }}>
                <li>
                  <strong>Default benchmark</strong>
                  <span>60 for CLO and PLO</span>
                </li>
                <li>
                  <strong>Current form scope</strong>
                  <span>{targetForm.scopeType}</span>
                </li>
              </ul>
            </div>

            <div className="card">
              <div className="section-heading">
                <div>
                  <h3>Configured Targets</h3>
                  <p className="muted">These benchmarks are used to detect below-target outcomes.</p>
                </div>
                <span className="status-badge badge-muted">{targets.length} targets</span>
              </div>

              {targets.length ? (
                <div className="stack">
                  {targets.map((item) => (
                    <div className="subcard" key={item._id}>
                      <div className="section-heading">
                        <div>
                          <strong>{buildTargetScopeLabel(item)}</strong>
                          <div className="muted">{item.academicTerm || 'All terms'}</div>
                        </div>
                        <span className="status-badge badge-muted">{item.outcomeType}</span>
                      </div>

                      <div className="request-meta-grid">
                        <span>
                          <strong>Target:</strong> {item.targetAttainment}
                        </span>
                        <span>
                          <strong>Scope:</strong> {item.scopeType}
                        </span>
                      </div>

                      <button className="btn btn-secondary btn-small" type="button" onClick={() => editTarget(item)}>
                        Edit target
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">No benchmark targets configured yet. Default target is 60 for CLO and PLO.</p>
              )}
            </div>

            <div className="card">
              <h3>Benchmark Tips</h3>
              <ul className="helper-list">
                <li>Institution targets are useful as a baseline, but scoped targets explain local realities better.</li>
                <li>Course-level targets should only be more demanding when the evidence and resources justify it.</li>
                <li>Use academic term filters when a temporary dip should not rewrite the long-term benchmark.</li>
              </ul>
            </div>
          </aside>
        </div>
      ) : null}

      <div className="grid grid-2 align-start">
        <div className="card">
          <div className="section-heading">
            <div>
              <h3>Below-Target Outcomes</h3>
              <p className="muted">Detected from current course analytics against the configured benchmarks.</p>
            </div>
          </div>

          {outcomes.length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Outcome</th>
                  <th>Scope</th>
                  <th>Current</th>
                  <th>Target</th>
                  <th>Gap</th>
                  <th>Plans</th>
                  {canManage ? <th>Action</th> : null}
                </tr>
              </thead>
              <tbody>
                {outcomes.map((item) => (
                  <tr key={`${item.outcomeType}-${item.outcomeCode}-${item.courseId || item.programId || item.departmentId}`}>
                    <td>
                      <strong>{item.outcomeType}</strong>
                      <div className="muted">{item.outcomeCode}</div>
                    </td>
                    <td>
                      <div>{buildOutcomeScopeText(item)}</div>
                      <div className="muted">{item.benchmark?.label || 'Default benchmark'}</div>
                    </td>
                    <td>{item.currentAttainment}</td>
                    <td>{item.targetAttainment}</td>
                    <td>{item.gap}</td>
                    <td>{item.openPlanCount}</td>
                    {canManage ? (
                      <td>
                        <Link className="btn btn-secondary btn-small" to={createPlanLink(item)}>
                          Create Plan
                        </Link>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">No below-target outcomes matched the current filters.</p>
          )}
        </div>

        <div className="card">
          <div className="section-heading">
            <div>
              <h3>Improvement Plan Register</h3>
              <p className="muted">Track the status of closing-the-loop actions across outcomes and scopes.</p>
            </div>
            {canManage ? (
              <Link className="btn btn-secondary" to="/accreditation/improvement-plans/new">
                New Plan
              </Link>
            ) : null}
          </div>

          {plans.length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Outcome</th>
                  <th>Scope</th>
                  <th>Assigned To</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <strong>{item.outcomeType}</strong>
                      <div className="muted">{item.outcomeCode}</div>
                      <div className="muted">Gap: {item.gap}</div>
                    </td>
                    <td>{buildScopeText(item)}</td>
                    <td>{item.assignedTo?.name || 'Unassigned'}</td>
                    <td>
                      {formatDisplayDate(item.dueDate)}
                      {item.overdue ? <div className="muted">Overdue</div> : null}
                    </td>
                    <td>
                      <span className={`status-badge ${getImprovementStatusClassName(item.status)}`}>{item.status.replace('_', ' ')}</span>
                    </td>
                    <td>
                      <Link className="btn btn-secondary btn-small" to={`/accreditation/improvement-plans/${item._id}`}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">No improvement plans matched the current filters.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImprovementPlansPage;
