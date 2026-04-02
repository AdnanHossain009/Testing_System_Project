import { useEffect, useState } from 'react';
import api from '../api/client';
import Loading from '../components/Loading';
import { useAuth } from '../context/AuthContext';

const normalizeDepartmentId = (department) => {
  if (!department) return '';
  if (typeof department === 'string') return department;
  return department._id || department.id || '';
};

const DepartmentOverviewPage = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const departmentId = normalizeDepartmentId(user?.department);
        const [summaryResponse, courseResponse] = await Promise.all([
          api.get('/analytics/head-summary'),
          api.get('/courses', { params: departmentId ? { departmentId } : {} })
        ]);

        setSummary(summaryResponse.data.data);
        setCourses(courseResponse.data.data.courses || []);
      } catch (loadError) {
        setError(loadError?.response?.data?.message || 'Unable to load department overview.');
        setSummary({
          department: null,
          totalCourses: 0,
          totalResults: 0,
          averageDepartmentFuzzy: 0,
          programAnalytics: []
        });
        setCourses([]);
      }
    };

    loadData();
  }, [user?.department]);

  if (!summary) return <Loading text="Loading department overview..." />;

  return (
    <div>
      <div className="page-header">
        <h1>Department Overview</h1>
        <p className="muted">
          View the department profile, its programs, course ownership, and the current average
          fuzzy performance.
        </p>
      </div>

      <div className="info-panel">
        <div>
          <h3>What this page is for</h3>
          <p className="muted">
            This page helps the department head understand how the department is performing as a
            whole before drilling into course-level analytics or individual risk cases.
          </p>
        </div>
        <div className="info-panel__tips">
          <span className="pill">Program table shows average fuzzy</span>
          <span className="pill">Course table shows teaching ownership</span>
          <span className="pill">Use Analytics for visual charts</span>
        </div>
      </div>

      {error ? <div className="error-box">{error}</div> : null}

      <div className="grid grid-4">
        <div className="card stat-card compact-card">
          <div className="stat-value">{summary.department?.code || 'N/A'}</div>
          <div className="stat-label">Department Code</div>
        </div>
        <div className="card stat-card compact-card">
          <div className="stat-value">{summary.totalCourses}</div>
          <div className="stat-label">Courses</div>
        </div>
        <div className="card stat-card compact-card">
          <div className="stat-value">{summary.totalResults}</div>
          <div className="stat-label">Stored Results</div>
        </div>
        <div className="card stat-card compact-card">
          <div className="stat-value">{summary.averageDepartmentFuzzy}</div>
          <div className="stat-label">Avg Department Fuzzy</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>Department Profile</h3>
          <p>
            <strong>{summary.department?.name || 'Department not assigned'}</strong>
          </p>
          <p className="muted">{summary.department?.description || 'No department description found.'}</p>
          <p>
            This overview is useful when presenting departmental performance in a project defense or
            academic review meeting.
          </p>
        </div>

        <div className="card">
          <h3>Program Coverage</h3>
          <p className="muted">
            The table below summarises how each program in the department is performing based on
            stored fuzzy evaluations.
          </p>
          <div className="summary-list compact-gap">
            <div>
              <strong>{summary.programAnalytics.length}</strong>
              <p className="muted">Programs tracked</p>
            </div>
            <div>
              <strong>{courses.length}</strong>
              <p className="muted">Course records available</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Program Analytics</h3>
        {summary.programAnalytics.length === 0 ? (
          <p className="muted">No program analytics found yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Program</th>
                <th>Average Fuzzy</th>
                <th>Result Count</th>
              </tr>
            </thead>
            <tbody>
              {summary.programAnalytics.map((item) => (
                <tr key={item.programId}>
                  <td>
                    {item.programCode} - {item.programName}
                  </td>
                  <td>{item.averageFuzzy}</td>
                  <td>{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>Department Course Directory</h3>
        {courses.length === 0 ? (
          <p className="muted">No courses found for this department.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Program</th>
                <th>Faculty</th>
                <th>CLO Count</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((item) => (
                <tr key={item._id}>
                  <td>
                    {item.code} - {item.name}
                  </td>
                  <td>{item.program?.code || '—'}</td>
                  <td>{item.faculty?.name || 'Not assigned'}</td>
                  <td>{item.clos?.length || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DepartmentOverviewPage;
