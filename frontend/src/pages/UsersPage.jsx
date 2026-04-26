import { useEffect, useState } from 'react';
import api from '../api/client';
import Loading from '../components/Loading';
import StatCard from '../components/StatCard';
import { getRoleLabel, getRoleOptions } from '../utils/roleUtils';

const roleLabels = getRoleOptions();
const createRoleOptions = ['admin', 'faculty', 'student', 'head'];

const initialCreateForm = {
  name: '',
  email: '',
  password: '',
  role: 'faculty',
  department: '',
  program: '',
  studentId: '',
  facultyId: ''
};

const initialEditForm = {
  name: '',
  role: 'faculty',
  department: '',
  program: '',
  studentId: '',
  facultyId: '',
  isActive: true
};

const getProgramsForDepartment = (programs, departmentId) =>
  departmentId
    ? programs.filter((item) => String(item.department?._id || item.department) === String(departmentId))
    : programs;

const normalizeDraft = (draft) => ({
  ...draft,
  studentId: draft.role === 'student' ? draft.studentId : '',
  facultyId: draft.role === 'faculty' ? draft.facultyId : ''
});

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [editForm, setEditForm] = useState(initialEditForm);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const hydrateUsers = (list, preferredUserId) => {
    setUsers(list);
    setSelectedUser((current) => {
      const nextId = preferredUserId || current?._id;
      if (nextId) {
        return list.find((item) => item._id === nextId) || list[0] || null;
      }

      return list[0] || null;
    });
  };

  useEffect(() => {
    let active = true;

    const loadUsers = async () => {
      setLoading(true);
      try {
        const [userResponse, departmentResponse, programResponse] = await Promise.all([
          api.get('/users', {
            params: roleFilter ? { role: roleFilter } : {}
          }),
          api.get('/departments'),
          api.get('/programs')
        ]);

        if (!active) return;

        const list = userResponse.data.data.users || [];
        const departmentList = departmentResponse.data.data.departments || [];
        const programList = programResponse.data.data.programs || [];

        setDepartments(departmentList);
        setPrograms(programList);
        hydrateUsers(list);
        setCreateForm((current) => ({
          ...current,
          department: current.department || departmentList[0]?._id || '',
          program: current.program || getProgramsForDepartment(programList, current.department || departmentList[0]?._id || '')[0]?._id || ''
        }));
      } catch (error) {
        if (!active) return;
        setFeedback(error?.response?.data?.message || 'Failed to load users.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadUsers();

    return () => {
      active = false;
    };
  }, [roleFilter]);

  useEffect(() => {
    if (!selectedUser) {
      setEditForm(initialEditForm);
      return;
    }

    setEditForm({
      name: selectedUser.name || '',
      role: selectedUser.role || 'faculty',
      department: selectedUser.department?._id || '',
      program: selectedUser.program?._id || '',
      studentId: selectedUser.studentId || '',
      facultyId: selectedUser.facultyId || '',
      isActive: selectedUser.isActive ?? true
    });
  }, [selectedUser]);

  const refreshUsers = async (preferredUserId) => {
    const response = await api.get('/users', {
      params: roleFilter ? { role: roleFilter } : {}
    });

    hydrateUsers(response.data.data.users || [], preferredUserId);
  };

  const handleCreateDepartmentChange = (departmentId) => {
    const availablePrograms = getProgramsForDepartment(programs, departmentId);
    setCreateForm((current) => ({
      ...current,
      department: departmentId,
      program: availablePrograms.find((item) => item._id === current.program)?._id || availablePrograms[0]?._id || ''
    }));
  };

  const handleEditDepartmentChange = (departmentId) => {
    const availablePrograms = getProgramsForDepartment(programs, departmentId);
    setEditForm((current) => ({
      ...current,
      department: departmentId,
      program: availablePrograms.find((item) => item._id === current.program)?._id || availablePrograms[0]?._id || ''
    }));
  };

  const createProgramOptions = getProgramsForDepartment(programs, createForm.department);
  const editProgramOptions = getProgramsForDepartment(programs, editForm.department);
  const editRoleOptions = Array.from(new Set([...createRoleOptions, editForm.role]));

  const createUser = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFeedback('');

    try {
      await api.post('/users', normalizeDraft(createForm));
      setFeedback('User created successfully.');
      setCreateForm((current) => ({
        ...initialCreateForm,
        department: current.department,
        program: current.program
      }));
      await refreshUsers();
    } catch (error) {
      setFeedback(error?.response?.data?.message || 'Failed to create user.');
    } finally {
      setSaving(false);
    }
  };

  const updateUser = async (event) => {
    event.preventDefault();

    if (!selectedUser) return;

    setSaving(true);
    setFeedback('');

    try {
      await api.patch(`/users/${selectedUser._id}`, normalizeDraft(editForm));
      setFeedback('User updated successfully.');
      await refreshUsers(selectedUser._id);
    } catch (error) {
      setFeedback(error?.response?.data?.message || 'Failed to update user.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading text="Loading users..." />;

  const totals = {
    total: users.length,
    admin: users.filter((item) => item.role === 'admin').length,
    faculty: users.filter((item) => item.role === 'faculty').length,
    head: users.filter((item) => item.role === 'head').length,
    accreditationOfficer: users.filter(
      (item) => item.role === 'accreditation_officer' || item.assignedRoles?.includes('accreditation_officer')
    ).length,
    student: users.filter((item) => item.role === 'student').length
  };

  return (
    <div>
      <div className="page-header">
        <h1>Users</h1>
        <p className="muted">
          View all registered accounts, create role-based users, and manage institutional access without disturbing current workflows.
        </p>
      </div>

      {feedback ? <div className={feedback.toLowerCase().includes('failed') ? 'error-box' : 'success-box'}>{feedback}</div> : null}

      <div className="grid grid-4">
        <StatCard label="Total Users" value={totals.total} />
        <StatCard label="Admins" value={totals.admin} />
        <StatCard label="Faculty" value={totals.faculty} />
        <StatCard label="Department Heads" value={totals.head} />
        <StatCard label="Accreditation Officers" value={totals.accreditationOfficer} />
        <StatCard label="Students" value={totals.student} />
      </div>

      <div className="grid grid-2" style={{ marginBottom: '1rem' }}>
        <form className="card" onSubmit={createUser}>
          <h3>Create User</h3>
          <p className="muted">
            Admins can create approved department, faculty, student, and head accounts here. Accreditation officer access is now assigned from the department head dashboard.
          </p>

          <div className="grid grid-2">
            <div>
              <label>Name</label>
              <input
                value={createForm.name}
                onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
            </div>
            <div>
              <label>Email</label>
              <input
                type="email"
                value={createForm.email}
                onChange={(event) => setCreateForm((current) => ({ ...current, email: event.target.value }))}
                required
              />
            </div>
            <div>
              <label>Password</label>
              <input
                type="password"
                value={createForm.password}
                onChange={(event) => setCreateForm((current) => ({ ...current, password: event.target.value }))}
                required
              />
            </div>
            <div>
              <label>Role</label>
              <select
                value={createForm.role}
                onChange={(event) =>
                  setCreateForm((current) =>
                    normalizeDraft({
                      ...current,
                      role: event.target.value
                    })
                  )
                }
              >
                {createRoleOptions.map((role) => (
                  <option value={role} key={role}>
                    {roleLabels[role]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Department</label>
              <select value={createForm.department} onChange={(event) => handleCreateDepartmentChange(event.target.value)}>
                <option value="">Not Assigned</option>
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
                value={createForm.program}
                onChange={(event) => setCreateForm((current) => ({ ...current, program: event.target.value }))}
              >
                <option value="">Not Assigned</option>
                {createProgramOptions.map((item) => (
                  <option value={item._id} key={item._id}>
                    {item.code} - {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Student ID</label>
              <input
                value={createForm.studentId}
                onChange={(event) => setCreateForm((current) => ({ ...current, studentId: event.target.value }))}
                disabled={createForm.role !== 'student'}
              />
            </div>
            <div>
              <label>Faculty ID</label>
              <input
                value={createForm.facultyId}
                onChange={(event) => setCreateForm((current) => ({ ...current, facultyId: event.target.value }))}
                disabled={createForm.role !== 'faculty'}
              />
            </div>
          </div>

          <button className="btn" disabled={saving}>
            {saving ? 'Saving...' : 'Create User'}
          </button>
        </form>

        <form className="card" onSubmit={updateUser}>
          <h3>Update User</h3>
          {selectedUser ? (
            <>
              <p className="muted">
                Update the selected user’s role, assignment, and active status. Email changes stay self-managed through account settings.
              </p>

              <div className="grid grid-2">
                <div>
                  <label>Name</label>
                  <input
                    value={editForm.name}
                    onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label>Email</label>
                  <input value={selectedUser.email} disabled />
                </div>
                <div>
                  <label>Role</label>
                  <select
                    value={editForm.role}
                    onChange={(event) =>
                      setEditForm((current) =>
                        normalizeDraft({
                          ...current,
                          role: event.target.value
                        })
                      )
                    }
                  >
                    {editRoleOptions.map((role) => (
                      <option value={role} key={role}>
                        {roleLabels[role]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Account Status</label>
                  <select
                    value={String(editForm.isActive)}
                    onChange={(event) =>
                      setEditForm((current) => ({ ...current, isActive: event.target.value === 'true' }))
                    }
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                <div>
                  <label>Department</label>
                  <select value={editForm.department} onChange={(event) => handleEditDepartmentChange(event.target.value)}>
                    <option value="">Not Assigned</option>
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
                    value={editForm.program}
                    onChange={(event) => setEditForm((current) => ({ ...current, program: event.target.value }))}
                  >
                    <option value="">Not Assigned</option>
                    {editProgramOptions.map((item) => (
                      <option value={item._id} key={item._id}>
                        {item.code} - {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Student ID</label>
                  <input
                    value={editForm.studentId}
                    onChange={(event) => setEditForm((current) => ({ ...current, studentId: event.target.value }))}
                    disabled={editForm.role !== 'student'}
                  />
                </div>
                <div>
                  <label>Faculty ID</label>
                  <input
                    value={editForm.facultyId}
                    onChange={(event) => setEditForm((current) => ({ ...current, facultyId: event.target.value }))}
                    disabled={editForm.role !== 'faculty'}
                  />
                </div>
              </div>

              <button className="btn" disabled={saving}>
                {saving ? 'Saving...' : 'Update User'}
              </button>
            </>
          ) : (
            <p className="muted">Select a user from the directory to manage the account.</p>
          )}
        </form>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <label>Filter by Role</label>
        <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
          <option value="">All Roles</option>
          {Object.keys(roleLabels).map((role) => (
            <option value={role} key={role}>
              {roleLabels[role]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>User Directory</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Approval</th>
                <th>Department</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr key={item._id}>
                  <td>
                    <strong>{item.name}</strong>
                    <div className="muted">{item.email}</div>
                  </td>
                  <td>{getRoleLabel(item)}</td>
                  <td>{item.approvalStatus || (item.isActive ? 'approved' : 'inactive')}</td>
                  <td>{item.department?.code || 'N/A'}</td>
                  <td>
                    <button className="btn btn-secondary" onClick={() => setSelectedUser(item)}>
                      View details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>User Details</h3>
          {selectedUser ? (
            <div className="simple-list">
              <p>
                <strong>Name:</strong> {selectedUser.name}
              </p>
              <p>
                <strong>Email:</strong> {selectedUser.email}
              </p>
              <p>
                <strong>Role:</strong> {getRoleLabel(selectedUser)}
              </p>
              <p>
                <strong>Department:</strong> {selectedUser.department?.name || 'N/A'}
              </p>
              <p>
                <strong>Program:</strong> {selectedUser.program?.name || 'N/A'}
              </p>
              <p>
                <strong>Account Status:</strong> {selectedUser.isActive ? 'Active' : 'Inactive'}
              </p>
              <p>
                <strong>Approval Status:</strong> {selectedUser.approvalStatus || 'approved'}
              </p>
              <p>
                <strong>Student ID:</strong> {selectedUser.studentId || 'N/A'}
              </p>
              <p>
                <strong>Faculty ID:</strong> {selectedUser.facultyId || 'N/A'}
              </p>
            </div>
          ) : (
            <p className="muted">Select a user to view details.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
