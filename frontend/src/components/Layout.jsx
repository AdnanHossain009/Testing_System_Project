import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const menuByRole = {
  admin: [
    { to: '/dashboard/admin', label: 'Dashboard' },
    { to: '/users', label: 'Users' },
    { to: '/departments', label: 'Departments' },
    { to: '/programs', label: 'Programs' },
    { to: '/courses', label: 'Courses' },
    { to: '/risk-monitor', label: 'Risk Monitor' },
    { to: '/notifications', label: 'Notifications' }
  ],
  faculty: [
    { to: '/dashboard/faculty', label: 'Dashboard' },
    { to: '/courses', label: 'Courses' },
    { to: '/assessments', label: 'Assessments' },
    { to: '/mappings', label: 'CLO-PLO Mapping' },
    { to: '/results', label: 'Results Entry' },
    { to: '/analytics', label: 'Analytics' },
    { to: '/risk-monitor', label: 'Risk Monitor' },
    { to: '/notifications', label: 'Notifications' }
  ],
  student: [
    { to: '/dashboard/student', label: 'Dashboard' },
    { to: '/results', label: 'My Results' },
    { to: '/student/performance', label: 'Performance Guide' },
    { to: '/notifications', label: 'Notifications' }
  ],
  head: [
    { to: '/dashboard/head', label: 'Dashboard' },
    { to: '/head/department-overview', label: 'Department Overview' },
    { to: '/programs', label: 'Programs' },
    { to: '/courses', label: 'Courses' },
    { to: '/results', label: 'Results' },
    { to: '/analytics', label: 'Analytics' },
    { to: '/risk-monitor', label: 'Risk Monitor' },
    { to: '/notifications', label: 'Notifications' }
  ]
};

const roleTitleMap = {
  admin: 'System Admin',
  faculty: 'Faculty Member',
  student: 'Student',
  head: 'Department Head'
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
            <strong>{roleTitleMap[user?.role] || user?.name}</strong>
            <div className="muted">{user?.name}</div>
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
