import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import Loading from '../components/Loading';
import { useAuth } from '../context/AuthContext';

const highRiskBands = ['High', 'Critical'];

const roleContent = {
  admin: {
    title: 'Risk Monitor',
    subtitle:
      'Review all flagged students across the platform and identify where immediate intervention is needed.'
  },
  faculty: {
    title: 'Weak Students Monitor',
    subtitle:
      'Focus on the learners in your assigned courses who need quick academic support or mentoring.'
  },
  head: {
    title: 'Department Risk Monitor',
    subtitle:
      'Track high-risk students within your department and understand which courses need attention first.'
  }
};

const normalizeDepartmentId = (department) => {
  if (!department) return '';
  if (typeof department === 'string') return department;
  return department._id || department.id || '';
};

const RiskMonitorPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [courses, setCourses] = useState([]);
  const [riskRows, setRiskRows] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const departmentId = normalizeDepartmentId(user?.department);
        const params = user?.role === 'head' && departmentId ? { departmentId } : {};
        const courseResponse = await api.get('/courses', { params });
        const courseList = courseResponse.data.data.courses || [];
        setCourses(courseList);

        if (courseList.length === 0) {
          setRiskRows([]);
          setLoading(false);
          return;
        }

        const responses = await Promise.all(
          courseList.map((course) => api.get(`/results/course/${course._id}`))
        );

        const rows = responses
          .flatMap((response, index) => {
            const course = courseList[index];
            return (response.data.data.results || []).map((result) => ({
              ...result,
              courseMeta: course,
              alertText: Array.isArray(result.alerts) ? result.alerts.join(' | ') : ''
            }));
          })
          .filter((result) => highRiskBands.includes(result.riskBand))
          .sort((left, right) => Number(right.riskScore || 0) - Number(left.riskScore || 0));

        setRiskRows(rows);
      } catch (loadError) {
        setError(loadError?.response?.data?.message || 'Unable to load risk monitor data.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.role, user?.department]);

  const filteredRows = useMemo(() => {
    if (selectedCourseId === 'all') return riskRows;
    return riskRows.filter((item) => item.courseMeta?._id === selectedCourseId);
  }, [riskRows, selectedCourseId]);

  const stats = useMemo(() => {
    const rows = filteredRows;
    const affectedCourses = new Set(rows.map((item) => item.courseMeta?._id)).size;
    const criticalCount = rows.filter((item) => item.riskBand === 'Critical').length;
    const averageRisk =
      rows.length > 0
        ? Number((rows.reduce((sum, item) => sum + (item.riskScore || 0), 0) / rows.length).toFixed(2))
        : 0;

    return {
      totalFlagged: rows.length,
      affectedCourses,
      criticalCount,
      averageRisk
    };
  }, [filteredRows]);

  const content = roleContent[user?.role] || roleContent.faculty;

  if (loading) return <Loading text="Loading risk monitor..." />;

  return (
    <div>
      <div className="page-header">
        <h1>{content.title}</h1>
        <p className="muted">{content.subtitle}</p>
      </div>

      <div className="info-panel">
        <div>
          <h3>How to use this page</h3>
          <p className="muted">
            Students in the High or Critical bands should be reviewed first. A high score means the
            system detected low performance, exam weakness, or a declining learning trend.
          </p>
        </div>
        <div className="info-panel__tips">
          <span className="pill">High = follow up soon</span>
          <span className="pill">Critical = immediate support</span>
          <span className="pill">Use Analytics for CLO/PLO view</span>
        </div>
      </div>

      {error ? <div className="error-box">{error}</div> : null}

      <div className="grid grid-4">
        <div className="card stat-card compact-card">
          <div className="stat-value">{stats.totalFlagged}</div>
          <div className="stat-label">Flagged Students</div>
        </div>
        <div className="card stat-card compact-card">
          <div className="stat-value">{stats.affectedCourses}</div>
          <div className="stat-label">Affected Courses</div>
        </div>
        <div className="card stat-card compact-card">
          <div className="stat-value">{stats.criticalCount}</div>
          <div className="stat-label">Critical Cases</div>
        </div>
        <div className="card stat-card compact-card">
          <div className="stat-value">{stats.averageRisk}</div>
          <div className="stat-label">Average Risk Score</div>
        </div>
      </div>

      <div className="card filter-card">
        <h3>Course Filter</h3>
        <select value={selectedCourseId} onChange={(event) => setSelectedCourseId(event.target.value)}>
          <option value="all">All Courses</option>
          {courses.map((course) => (
            <option key={course._id} value={course._id}>
              {course.code} - {course.name}
            </option>
          ))}
        </select>
      </div>

      <div className="card">
        <h3>Flagged Student List</h3>
        {filteredRows.length === 0 ? (
          <p className="muted">No high-risk or critical students were found for this filter.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Fuzzy Score</th>
                <th>Risk Score</th>
                <th>Risk Band</th>
                <th>Support Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((item) => (
                <tr key={item._id}>
                  <td>
                    <div>{item.student?.name}</div>
                    <small className="muted">{item.student?.studentId || item.student?.email}</small>
                  </td>
                  <td>
                    {item.courseMeta?.code} - {item.courseMeta?.name}
                  </td>
                  <td>{item.fuzzyScore}</td>
                  <td>{item.riskScore}</td>
                  <td>
                    <span className={`status-badge ${item.riskBand?.toLowerCase() || 'low'}`}>
                      {item.riskBand}
                    </span>
                  </td>
                  <td>{item.alertText || 'Follow normal monitoring process.'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default RiskMonitorPage;
