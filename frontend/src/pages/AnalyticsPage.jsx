import { useEffect, useState } from 'react';
import api from '../api/client';
import Loading from '../components/Loading';
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  LineChart,
  Line
} from 'recharts';

const AnalyticsPage = () => {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadCourses = async () => {
    const response = await api.get('/courses');
    const list = response.data.data.courses;
    setCourses(list);
    setCourseId(list[0]?._id || '');
    setLoading(false);
  };

  const loadAnalytics = async (selectedId) => {
    if (!selectedId) return;
    const response = await api.get(`/analytics/course/${selectedId}`);
    setAnalytics(response.data.data);
  };

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (courseId) loadAnalytics(courseId);
  }, [courseId]);

  if (loading || !analytics) return <Loading text="Loading analytics..." />;

  return (
    <div>
      <div className="page-header">
        <h1>Analytics</h1>
        <p className="muted">
          Visualize CLO attainment, PLO attainment, average fuzzy score and risk distribution.
        </p>
      </div>

      <div className="card">
        <label>Select Course</label>
        <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          {courses.map((item) => (
            <option value={item._id} key={item._id}>
              {item.code}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-2">
        <div className="card chart-card">
          <h3>CLO Attainment</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={analytics.cloChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="code" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="score" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <h3>PLO Attainment</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={analytics.ploChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="code" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="score" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <h3>Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={analytics.riskDistribution} dataKey="count" nameKey="band" cx="50%" cy="50%" outerRadius={90} label />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <h3>Average Fuzzy Snapshot</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={[{ label: 'Current', score: analytics.averageFuzzy }]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="score" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3>Weak Students</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Fuzzy</th>
              <th>Risk</th>
            </tr>
          </thead>
          <tbody>
            {analytics.weakStudents.map((item) => (
              <tr key={item.id}>
                <td>{item.student?.name}</td>
                <td>{item.fuzzyScore}</td>
                <td>
                  {item.riskBand} ({item.riskScore})
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnalyticsPage;
