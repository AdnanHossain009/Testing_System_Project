import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const dashboardByRole = {
  admin: '/dashboard/admin',
  faculty: '/dashboard/faculty',
  student: '/dashboard/student',
  head: '/dashboard/head'
};

const PublicLayout = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const dashboardPath = dashboardByRole[user?.role] || '/login';

  return (
    <div className="public-shell">
      <header className="public-navbar">
        <Link to="/" className="public-brand" aria-label="OBE Assess home">
          <span className="public-brand__mark">OA</span>
          <span className="public-brand__text">
            <strong>OBE Assess</strong>
            <small>Outcome-based academic intelligence</small>
          </span>
        </Link>

        <nav className="public-nav" aria-label="Public navigation">
          <a className="public-nav__anchor" href="/#overview">
            Overview
          </a>
          <a className="public-nav__anchor" href="/#features">
            Features
          </a>
          <NavLink className={({ isActive }) => `public-nav__link ${isActive ? 'active' : ''}`} to="/fuzzy">
            Fuzzy
          </NavLink>
          <NavLink className={({ isActive }) => `public-nav__link ${isActive ? 'active' : ''}`} to="/obe">
            OBE
          </NavLink>
          <NavLink className={({ isActive }) => `public-nav__link ${isActive ? 'active' : ''}`} to="/clo-plo">
            CLO PLO
          </NavLink>
        </nav>

        <div className="public-actions">
          {isAuthenticated ? (
            <>
              <Link className="public-button public-button--ghost" to={dashboardPath}>
                Dashboard
              </Link>
              <button className="public-button public-button--ghost" type="button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="public-button public-button--ghost" to="/login">
                Login
              </Link>
              <Link className="public-button" to="/signup">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="public-main">
        <Outlet />
      </main>
    </div>
  );
};

export default PublicLayout;