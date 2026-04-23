import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleLabels = {
  admin: 'Admin',
  faculty: 'Faculty',
  student: 'Student',
  head: 'Department Head',
  accreditation_officer: 'Accreditation Officer'
};

const menuByRole = {
  admin: [
    { to: '/dashboard/admin', label: 'Dashboard' },
    { to: '/users', label: 'Users' },
    { to: '/high-risk-students', label: 'High Risk Students' },
    { to: '/accreditation/improvement-plans', label: 'Improvement Plans' },
    { to: '/accreditation/evidence-manager', label: 'Evidence Manager' },
    { to: '/accreditation/curriculum-governance', label: 'Curriculum Governance' },
    { to: '/accreditation/reports', label: 'Accreditation Reports' },
    { to: '/departments', label: 'Departments' },
    { to: '/programs', label: 'Programs' },
    { to: '/courses', label: 'Courses' },
    { to: '/account', label: 'Account Settings' },
    { to: '/notifications', label: 'Notifications' }
  ],
  faculty: [
    { to: '/dashboard/faculty', label: 'Dashboard' },
    { to: '/faculty/courses', label: 'Assigned Courses' },
    { to: '/faculty/evidence', label: 'Evidence Upload' },
    { to: '/faculty/weak-students', label: 'Weak Students' },
    { to: '/course-requests', label: 'Add Course' },
    { to: '/courses', label: 'Courses' },
    { to: '/assessments', label: 'Assessments' },
    { to: '/mappings', label: 'CLO-PLO Mapping' },
    { to: '/results', label: 'Results Entry' },
    { to: '/analytics', label: 'Analytics' },
    { to: '/accreditation/improvement-plans', label: 'Improvement Plans' },
    { to: '/account', label: 'Account Settings' },
    { to: '/notifications', label: 'Notifications' }
  ],
  student: [
    { to: '/dashboard/student', label: 'Dashboard' },
    { to: '/courses', label: 'Courses' },
    { to: '/enrollments/history', label: 'Enrollment History' },
    { to: '/results', label: 'My Results' },
    { to: '/account', label: 'Account Settings' },
    { to: '/notifications', label: 'Notifications' }
  ],
  head: [
    { to: '/dashboard/head', label: 'Dashboard' },
    { to: '/head/course-requests', label: 'Course Requests' },
    { to: '/accreditation/evidence-manager', label: 'Evidence Manager' },
    { to: '/accreditation/curriculum-governance', label: 'Curriculum Governance' },
    { to: '/accreditation/reports', label: 'Accreditation Reports' },
    { to: '/programs', label: 'Programs' },
    { to: '/courses', label: 'Courses' },
    { to: '/analytics', label: 'Analytics' },
    { to: '/accreditation/improvement-plans', label: 'Improvement Plans' },
    { to: '/account', label: 'Account Settings' },
    { to: '/notifications', label: 'Notifications' }
  ],
  accreditation_officer: [
    { to: '/dashboard/accreditation', label: 'Accreditation Dashboard' },
    { to: '/accreditation/improvement-plans', label: 'Improvement Plans' },
    { to: '/accreditation/evidence-manager', label: 'Evidence Manager' },
    { to: '/accreditation/curriculum-governance', label: 'Curriculum Governance' },
    { to: '/accreditation/reports', label: 'Accreditation Reports' },
    { to: '/programs', label: 'Programs' },
    { to: '/courses', label: 'Courses' },
    { to: '/analytics', label: 'Analytics' },
    { to: '/account', label: 'Account Settings' },
    { to: '/notifications', label: 'Notifications' }
  ]
};

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = menuByRole[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <h2>OBE Assess</h2>
          <p className="muted">Fuzzy + Analytics</p>
        </div>

        <nav className="nav-list">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="content-area">
        <header className="topbar">
          <div>
            <strong>{user?.name}</strong>
            <div className="muted">{roleLabels[user?.role] || user?.role}</div>
          </div>
          <button className="btn btn-secondary" onClick={handleLogout}>
            Logout
          </button>
        </header>

        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
