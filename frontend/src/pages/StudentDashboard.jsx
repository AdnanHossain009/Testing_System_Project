import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Loading from '../components/Loading';
import StatCard from '../components/StatCard';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const riskColors = {
  Low: '#10b981',
  Moderate: '#f59e0b',
  High: '#f97316',
  Critical: '#ef4444'
};

const chartColors = ['#2563eb', '#0ea5e9', '#14b8a6', '#8b5cf6'];

const formatDate = (value) => (value ? new Date(value).toLocaleString() : 'N/A');

const joinCodes = (items = []) => (items.length ? items.map((item) => item.code || item).join(', ') : 'N/A');

const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const [summaryResult, requestResult] = await Promise.allSettled([
        api.get('/analytics/student-summary'),
        api.get('/course-requests/my', { params: { type: 'student_enrollment' } })
      ]);

      if (summaryResult.status === 'fulfilled') {
        setData(summaryResult.value.data.data);
      }

      if (requestResult.status === 'fulfilled') {
        setPendingRequests(requestResult.value.data.data.requests || []);
      }

      setLoading(false);
    };

    run();
  }, []);

  if (loading) return <Loading text="Loading student dashboard..." />;
  if (!data) return <div className="error-box">Unable to load student dashboard.</div>;

  const analytics = data.analytics || {};
  const performance = analytics.performance || {};
  const courseAnalytics = analytics.courseAnalytics || [];
  const coursePerformanceChart = analytics.coursePerformanceChart || [];
  const overallCloAnalytics = analytics.overallCloAnalytics || [];
  const overallPloAnalytics = analytics.overallPloAnalytics || [];
  const riskDistribution = analytics.riskDistribution || [];
  const pendingRequestCount = pendingRequests.filter((item) => item.status === 'pending').length;
  const completedCount = performance.completedCourseCount ?? courseAnalytics.filter((item) => item.hasResult).length;
  const pendingEvaluationCount = performance.pendingCourseCount ?? courseAnalytics.filter((item) => !item.hasResult).length;

  return (
    <div>
      <div className="page-header">
        <h1>Student Dashboard</h1>
        <p className="muted">
          A live OBE analytics view with course-level CLO/PLO weakness analysis and overall mastery insights.
        </p>
      </div>

      <div className="grid grid-3">
        <StatCard label="Enrolled Courses" value={performance.courseCount ?? courseAnalytics.length} />
        <StatCard label="Completed Courses" value={completedCount} />
        <StatCard label="Pending Evaluations" value={pendingEvaluationCount} />
        <StatCard
          label="Average Fuzzy"
          value={performance.performanceScore ?? 0}
          subtitle={performance.masteryLabel || 'Live student performance'}
        />
        <StatCard
          label="Overall OBE Mastery"
          value={performance.masteryScore ?? 0}
          subtitle={performance.masteryNarrative || 'Dynamic fuzzy output'}
        />
        <StatCard label="Pending Requests" value={pendingRequestCount} subtitle="Enrollment approvals" />
      </div>

      <div className="inline-actions" style={{ marginBottom: '1rem' }}>
        <Link className="btn" to="/student/assistant">
          Open AI Assistant
        </Link>
        <Link className="btn btn-secondary" to="/courses">
          Browse Courses
        </Link>
        <Link className="btn btn-secondary" to="/enrollments/history">
          Enrollment History
        </Link>
        <Link className="btn btn-secondary" to="/notifications">
          Notifications
        </Link>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="section-heading">
          <div>
            <h3>AI Academic Assistant</h3>
            <p className="muted">
              Ask grounded questions about weak CLOs, weak PLOs, risk, fuzzy score, and what to improve next.
            </p>
          </div>
          <Link className="btn btn-secondary" to="/student/assistant">
            Start Chat
          </Link>
        </div>

        <div className="assistant-prompt-grid">
          {['Which CLO am I weak in?', 'What should I improve first?', 'Why is my risk high?', 'Which course is hurting my performance?'].map((prompt) => (
            <Link key={prompt} className="assistant-prompt-chip assistant-prompt-link" to="/student/assistant">
              {prompt}
            </Link>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3>Overall Student OBE Analysis</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          {performance.overallNarrative || 'Analytics are recalculated from saved results each time the page loads.'}
        </p>

        <div className="grid grid-4">
          <StatCard label="Outcome Average" value={performance.overallCloAverage ?? 0} />
          <StatCard label="PLO Alignment" value={performance.overallPloAverage ?? 0} />
          <StatCard label="Stability" value={performance.stabilityScore ?? 0} />
          <StatCard label="Completion Rate" value={`${performance.completionRate ?? 0}%`} />
        </div>

        <div className="grid grid-2">
          <div className="card chart-card">
            <h3>Course Performance vs OBE Outcome</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={coursePerformanceChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="fuzzy" fill="#2563eb" name="Fuzzy Score" />
                <Bar dataKey="outcome" fill="#14b8a6" name="CLO/PLO Outcome" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card chart-card">
            <h3>Risk Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskDistribution}
                  dataKey="count"
                  nameKey="band"
                  cx="50%"
                  cy="50%"
                  outerRadius={96}
                  label
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`${entry.band}-${index}`} fill={riskColors[entry.band] || chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card chart-card">
          <h3>Overall CLO Attainment</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={overallCloAnalytics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="code" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="score" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <h3>Overall PLO Attainment</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={overallPloAnalytics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="code" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="score" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>Weak CLOs</h3>
          {analytics.weakClos?.length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>CLO</th>
                  <th>Score</th>
                  <th>Courses Affected</th>
                </tr>
              </thead>
              <tbody>
                {analytics.weakClos.map((item) => (
                  <tr key={item.code}>
                    <td>{item.code}</td>
                    <td>{item.score}</td>
                    <td>{item.weakCourseCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">No weak CLOs at the moment.</p>
          )}
        </div>

        <div className="card">
          <h3>Weak PLOs</h3>
          {analytics.weakPlos?.length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>PLO</th>
                  <th>Score</th>
                  <th>Courses Affected</th>
                </tr>
              </thead>
              <tbody>
                {analytics.weakPlos.map((item) => (
                  <tr key={item.code}>
                    <td>{item.code}</td>
                    <td>{item.score}</td>
                    <td>{item.weakCourseCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">No weak PLOs at the moment.</p>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3>Course-wise OBE Analytics</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Faculty</th>
              <th>Fuzzy</th>
              <th>Outcome</th>
              <th>Risk</th>
              <th>Weak CLOs</th>
              <th>Weak PLOs</th>
              <th>Insight</th>
            </tr>
          </thead>
          <tbody>
            {courseAnalytics.map((item) => (
              <tr key={item.courseId}>
                <td>
                  <strong>{item.courseCode}</strong>
                  <div className="muted">{item.courseName}</div>
                </td>
                <td>{item.faculty?.name || 'N/A'}</td>
                <td>{item.hasResult ? item.fuzzyScore : 'Pending'}</td>
                <td>{item.hasResult ? item.courseOutcomeScore : 'Pending'}</td>
                <td>{item.hasResult ? `${item.riskBand} (${item.riskScore})` : 'Pending'}</td>
                <td>{joinCodes(item.weakClos)}</td>
                <td>{joinCodes(item.weakPlos)}</td>
                <td className="muted">{item.insight}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>Strong Areas</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Codes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Strong CLOs</td>
                <td>{joinCodes(analytics.strongClos)}</td>
              </tr>
              <tr>
                <td>Strong PLOs</td>
                <td>{joinCodes(analytics.strongPlos)}</td>
              </tr>
              <tr>
                <td>Strongest Course</td>
                <td>
                  {analytics.strongestCourse
                    ? `${analytics.strongestCourse.courseCode} - ${analytics.strongestCourse.courseName}`
                    : 'N/A'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>Recent Alerts</h3>
          {data.alerts.length === 0 ? (
            <p className="muted">No alerts yet.</p>
          ) : (
            <ul className="simple-list">
              {data.alerts.map((alert, index) => (
                <li key={`${alert.course}-${index}`}>
                  <strong>{alert.course}:</strong> {alert.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card">
        <h3>Course Results</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Fuzzy Score</th>
              <th>Risk</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {data.results.map((item) => (
              <tr key={item._id}>
                <td>
                  {item.course?.code}
                  <div className="muted">{item.course?.name}</div>
                </td>
                <td>{item.fuzzyScore}</td>
                <td>{item.riskBand} ({item.riskScore})</td>
                <td>{formatDate(item.lastEvaluatedAt || item.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentDashboard;
