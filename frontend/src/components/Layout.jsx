import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const menuByRole = {
  admin: [
    { to: '/dashboard/admin', label: 'Dashboard' },
    { to: '/users', label: 'Users' },
    { to: '/high-risk-students', label: 'High Risk Students' },
    { to: '/departments', label: 'Departments' },
    { to: '/programs', label: 'Programs' },
    { to: '/courses', label: 'Courses' },
    { to: '/notifications', label: 'Notifications' }
  ],
  faculty: [
    { to: '/dashboard/faculty', label: 'Dashboard' },
    { to: '/faculty/courses', label: 'Assigned Courses' },
    { to: '/faculty/weak-students', label: 'Weak Students' },
    { to: '/courses', label: 'Courses' },
    { to: '/assessments', label: 'Assessments' },
    { to: '/mappings', label: 'CLO-PLO Mapping' },
    { to: '/results', label: 'Results Entry' },
    { to: '/analytics', label: 'Analytics' },
    { to: '/notifications', label: 'Notifications' }
  ],
  student: [
    { to: '/dashboard/student', label: 'Dashboard' },
    { to: '/results', label: 'My Results' },
    { to: '/notifications', label: 'Notifications' }
  ],
  head: [
    { to: '/dashboard/head', label: 'Dashboard' },
    { to: '/programs', label: 'Programs' },
    { to: '/courses', label: 'Courses' },
    { to: '/analytics', label: 'Analytics' },
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
            <div className="muted">{user?.role}</div>
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
