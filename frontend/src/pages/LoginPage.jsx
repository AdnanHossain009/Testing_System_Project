import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

const destinationByRole = {
  admin: '/dashboard/admin',
  faculty: '/dashboard/faculty',
  student: '/dashboard/student',
  head: '/dashboard/head'
};

const LoginPage = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: 'admin@example.com',
    password: 'Admin123!'
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const submitHandler = async (event) => {
    event.preventDefault();
    setError('');

    const response = await login(form.email, form.password);

    if (!response.ok) {
      setError(response.message);
      return;
    }

    navigate(destinationByRole[response.role] || '/');
  };

  return (
    <div className="login-page-pro">
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
              <h2>Welcome Back</h2>
              <p>Sign in to access your academic dashboard</p>
            </div>

            {error ? <div className="login-page-pro__error">{error}</div> : null}

            <form onSubmit={submitHandler} className="login-page-pro__form">
              <div className="login-page-pro__group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                  placeholder="Enter your email"
                />
              </div>

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

              <button className="login-page-pro__button" type="submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="login-page-pro__demo">
              <strong>Seeded Demo Users</strong>
              <p>admin@example.com / Admin123!</p>
              <p>faculty@example.com / Faculty123!</p>
              <p>student1@example.com / Student123!</p>
              <p>head@example.com / Head123!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;