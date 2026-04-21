import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

const destinationByRole = {
  admin: '/dashboard/admin',
  faculty: '/dashboard/faculty',
  student: '/dashboard/student',
  head: '/dashboard/head'
};

const roleLabels = {
  admin: 'Admin',
  faculty: 'Faculty',
  student: 'Student',
  head: 'Head'
};

const roleOptionsByMode = {
  login: ['admin', 'faculty', 'student', 'head'],
  signup: ['faculty', 'student', 'head']
};

const getInitialForm = (initialMode) => ({
  role: initialMode === 'signup' ? 'faculty' : 'admin',
  name: '',
  email: initialMode === 'signup' ? '' : 'admin@example.com',
  password: initialMode === 'signup' ? '' : 'Admin123!',
  confirmPassword: '',
  studentId: '',
  facultyId: ''
});

const LoginPage = ({ initialMode = 'login' }) => {
  const isSignup = initialMode === 'signup';
  const { login, signup, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(() => getInitialForm(initialMode));
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const roleOptions = roleOptionsByMode[isSignup ? 'signup' : 'login'];
  const selectedRoleLabel = roleLabels[form.role] || 'User';

  const handleRoleChange = (event) => {
    const nextRole = event.target.value;

    setForm((current) => ({
      ...current,
      role: nextRole,
      studentId: nextRole === 'student' ? current.studentId : '',
      facultyId: nextRole === 'faculty' ? current.facultyId : ''
    }));
  };

  const submitHandler = async (event) => {
    event.preventDefault();
    setError('');

    if (isSignup) {
      const name = form.name.trim();
      const email = form.email.trim();
      const studentId = form.studentId.trim();
      const facultyId = form.facultyId.trim();

      if (!name || !email || !form.password || !form.confirmPassword) {
        setError('Please fill in all required fields.');
        return;
      }

      if (form.password !== form.confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      if (form.role === 'student' && !studentId) {
        setError('Student ID is required for student signup.');
        return;
      }

      if (form.role === 'faculty' && !facultyId) {
        setError('Faculty ID is required for faculty signup.');
        return;
      }

      const response = await signup({
        name,
        email,
        password: form.password,
        role: form.role,
        ...(form.role === 'student' ? { studentId } : {}),
        ...(form.role === 'faculty' ? { facultyId } : {})
      });

      if (!response.ok) {
        setError(response.message);
        return;
      }

      navigate(destinationByRole[response.role] || '/');
      return;
    }

    const response = await login(form.email.trim(), form.password);

    if (!response.ok) {
      setError(response.message);
      return;
    }

    navigate(destinationByRole[response.role] || '/');
  };

  const goToMode = (targetMode) => {
    navigate(targetMode === 'signup' ? '/signup' : '/login');
  };

  return (
    <div className="login-page-pro">
      <header className="public-navbar login-page-pro__navbar">
        <Link to="/" className="public-brand" aria-label="OBE Assess home">
          <span className="public-brand__mark">OA</span>
          <span className="public-brand__text">
            <strong>OBE Assess</strong>
            <small>Outcome-based academic intelligence</small>
          </span>
        </Link>

        <nav className="public-nav" aria-label="Authentication navigation">
          <Link className="public-nav__anchor" to="/">
            Home
          </Link>
          <NavLink className={({ isActive }) => `public-nav__link ${isActive ? 'active' : ''}`} to="/fuzzy">
            Fuzzy
          </NavLink>
          <NavLink className={({ isActive }) => `public-nav__link ${isActive ? 'active' : ''}`} to="/obe">
            OBE
          </NavLink>
          <NavLink className={({ isActive }) => `public-nav__link ${isActive ? 'active' : ''}`} to="/clo-plo">
            CLO PLO
          </NavLink>
          <NavLink className={({ isActive }) => `public-nav__link ${isActive ? 'active' : ''}`} to="/login">
            Login
          </NavLink>
          <NavLink className={({ isActive }) => `public-nav__link ${isActive ? 'active' : ''}`} to="/signup">
            Sign Up
          </NavLink>
        </nav>
      </header>

      <div className="login-page-pro__content">
        <div className="login-page-pro__overlay"></div>

        <div className="login-page-pro__container">
          <div className="login-page-pro__left">
            <div className="login-page-pro__badge">OBE Intelligence Platform</div>

            <h1 className="login-page-pro__title">
              Intelligent Student
              <br />
              Assessment System
            </h1>

            <p className="login-page-pro__subtitle">
              A smart Outcome-Based Education platform powered by fuzzy logic,
              analytics, role-based dashboards, and intelligent performance
              evaluation.
            </p>

            <div className="login-page-pro__features">
              <div className="login-page-pro__feature">
                <div className="login-page-pro__icon">📊</div>
                <div>
                  <h3>Real-Time Analytics</h3>
                  <p>Track CLO and PLO attainment with clear visual dashboards.</p>
                </div>
              </div>

              <div className="login-page-pro__feature">
                <div className="login-page-pro__icon">🧠</div>
                <div>
                  <h3>Fuzzy Logic Evaluation</h3>
                  <p>Handle uncertainty in assessment with intelligent scoring.</p>
                </div>
              </div>

              <div className="login-page-pro__feature">
                <div className="login-page-pro__icon">⚠️</div>
                <div>
                  <h3>Risk Detection</h3>
                  <p>Identify weak students early using smart analytics.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="login-page-pro__right">
            <div className="login-page-pro__card">
              <div className="login-page-pro__header">
                <h2>{isSignup ? 'Create Your Account' : 'Welcome Back'}</h2>
                <p>
                  {isSignup
                    ? `Register as ${selectedRoleLabel}. Your details will be stored in the database right away.`
                    : `Sign in as ${selectedRoleLabel} to access the matching dashboard.`}
                </p>
              </div>

              <div className="login-page-pro__modeSwitch" role="tablist" aria-label="Authentication mode">
                <button
                  type="button"
                  className={`login-page-pro__modeButton ${isSignup ? '' : 'login-page-pro__modeButton--active'}`}
                  onClick={() => goToMode('login')}
                  aria-pressed={!isSignup}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className={`login-page-pro__modeButton ${isSignup ? 'login-page-pro__modeButton--active' : ''}`}
                  onClick={() => goToMode('signup')}
                  aria-pressed={isSignup}
                >
                  Sign Up
                </button>
              </div>

              {error ? <div className="login-page-pro__error">{error}</div> : null}

              <form onSubmit={submitHandler} className="login-page-pro__form">
                <div className="login-page-pro__group">
                  <label>{isSignup ? 'Register as' : 'Access as'}</label>
                  <select value={form.role} onChange={handleRoleChange}>
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {roleLabels[role]}
                      </option>
                    ))}
                  </select>
                </div>

                {isSignup ? (
                  <div className="login-page-pro__group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(event) => setForm({ ...form, name: event.target.value })}
                      placeholder="Enter your full name"
                      autoComplete="name"
                      required
                    />
                  </div>
                ) : null}

                <div className="login-page-pro__group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    placeholder="Enter your email"
                    autoComplete="email"
                    required
                  />
                </div>

                {isSignup && form.role === 'student' ? (
                  <div className="login-page-pro__group">
                    <label>Student ID</label>
                    <input
                      type="text"
                      value={form.studentId}
                      onChange={(event) =>
                        setForm({ ...form, studentId: event.target.value })
                      }
                      placeholder="Enter your student ID"
                      required
                    />
                  </div>
                ) : null}

                {isSignup && form.role === 'faculty' ? (
                  <div className="login-page-pro__group">
                    <label>Faculty ID</label>
                    <input
                      type="text"
                      value={form.facultyId}
                      onChange={(event) =>
                        setForm({ ...form, facultyId: event.target.value })
                      }
                      placeholder="Enter your faculty ID"
                      required
                    />
                  </div>
                ) : null}

                <div className="login-page-pro__group">
                  <label>Password</label>
                  <div className="login-page-pro__passwordWrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(event) =>
                        setForm({ ...form, password: event.target.value })
                      }
                      placeholder="Enter your password"
                      autoComplete={isSignup ? 'new-password' : 'current-password'}
                      required
                    />
                    <button
                      type="button"
                      className="login-page-pro__toggle"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                {isSignup ? (
                  <div className="login-page-pro__group">
                    <label>Confirm Password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={(event) =>
                        setForm({ ...form, confirmPassword: event.target.value })
                      }
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                ) : null}

                <button className="login-page-pro__button" type="submit" disabled={loading}>
                  {loading
                    ? isSignup
                      ? 'Creating account...'
                      : 'Signing in...'
                    : isSignup
                      ? 'Create Account'
                      : 'Sign In'}
                </button>
              </form>

              {isSignup ? (
                <div className="login-page-pro__demo login-page-pro__demo--signup">
                  <strong>Signup rules</strong>
                  <p>Faculty, student, and head accounts are allowed here.</p>
                  <p>Admin registration stays locked to the setup flow.</p>
                  <p>Your account will be saved in MongoDB and ready for sign in.</p>
                </div>
              ) : (
                <div className="login-page-pro__demo">
                  <strong>Seeded Demo Users</strong>
                  <p>admin@example.com / Admin123!</p>
                  <p>faculty@example.com / Faculty123!</p>
                  <p>student1@example.com / Student123!</p>
                  <p>head@example.com / Head123!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;