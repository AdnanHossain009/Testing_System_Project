import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import Loading from '../components/Loading';

const interpretFuzzy = (value) => {
  if (value >= 80) return 'Excellent progress';
  if (value >= 65) return 'Good progress';
  if (value >= 50) return 'Needs improvement';
  return 'Immediate support recommended';
};

const StudentPerformancePage = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await api.get('/analytics/student-summary');
        setData(response.data.data);
      } catch (loadError) {
        setError(loadError?.response?.data?.message || 'Unable to load your performance guide.');
        setData({ totalCourses: 0, averageFuzzy: 0, results: [], alerts: [] });
      }
    };

    loadData();
  }, []);

  const metrics = useMemo(() => {
    if (!data) {
      return {
        riskyCourses: 0,
        bestCourse: null,
        lowestCourse: null
      };
    }

    const riskyCourses = data.results.filter((item) => ['High', 'Critical'].includes(item.riskBand)).length;
    const sorted = [...data.results].sort((left, right) => Number(right.fuzzyScore || 0) - Number(left.fuzzyScore || 0));

    return {
      riskyCourses,
      bestCourse: sorted[0] || null,
      lowestCourse: sorted[sorted.length - 1] || null
    };
  }, [data]);

  if (!data) return <Loading text="Loading your performance guide..." />;

  return (
    <div>
      <div className="page-header">
        <h1>Performance Guide</h1>
        <p className="muted">
          Understand what your fuzzy score means, review course-by-course progress, and identify
          where you should improve first.
        </p>
      </div>

      <div className="info-panel">
        <div>
          <h3>Performance interpretation</h3>
          <p className="muted">
            Fuzzy evaluation combines quiz, assignment, mid, and final results to provide a more
            balanced picture than a single exam score. Higher fuzzy values indicate stronger and
            more stable learning performance.
          </p>
        </div>
        <div className="info-panel__tips">
          <span className="pill">80+ = Excellent</span>
          <span className="pill">65-79 = Good</span>
          <span className="pill">50-64 = Improve soon</span>
          <span className="pill">Below 50 = Get support</span>
        </div>
      </div>

      {error ? <div className="error-box">{error}</div> : null}

      <div className="grid grid-4">
        <div className="card stat-card compact-card">
          <div className="stat-value">{data.averageFuzzy}</div>
          <div className="stat-label">Average Fuzzy</div>
          <small className="muted">{interpretFuzzy(Number(data.averageFuzzy || 0))}</small>
        </div>
        <div className="card stat-card compact-card">
          <div className="stat-value">{data.totalCourses}</div>
          <div className="stat-label">Tracked Courses</div>
        </div>
        <div className="card stat-card compact-card">
          <div className="stat-value">{metrics.riskyCourses}</div>
          <div className="stat-label">Risky Courses</div>
        </div>
        <div className="card stat-card compact-card">
          <div className="stat-value">{data.alerts.length}</div>
          <div className="stat-label">Active Alerts</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>Strongest Course</h3>
          {metrics.bestCourse ? (
            <div className="summary-list">
              <div>
                <strong>{metrics.bestCourse.course?.code}</strong>
                <p className="muted">Fuzzy score: {metrics.bestCourse.fuzzyScore}</p>
              </div>
              <p>
                Keep using the same study pattern here because this course currently shows your best
                outcome.
              </p>
            </div>
          ) : (
            <p className="muted">No course result found yet.</p>
          )}
        </div>

        <div className="card">
          <h3>Most Attention Needed</h3>
          {metrics.lowestCourse ? (
            <div className="summary-list">
              <div>
                <strong>{metrics.lowestCourse.course?.code}</strong>
                <p className="muted">
                  Fuzzy score: {metrics.lowestCourse.fuzzyScore} | Risk band: {metrics.lowestCourse.riskBand}
                </p>
              </div>
              <p>
                Start revision here first and follow up with your faculty if the risk band remains
                high after the next assessment.
              </p>
            </div>
          ) : (
            <p className="muted">No course result found yet.</p>
          )}
        </div>
      </div>

      <div className="card">
        <h3>Course-by-Course Performance</h3>
        {data.results.length === 0 ? (
          <p className="muted">No stored results found yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Fuzzy Score</th>
                <th>Risk Band</th>
                <th>Interpretation</th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((item) => (
                <tr key={item._id}>
                  <td>{item.course?.code}</td>
                  <td>{item.fuzzyScore}</td>
                  <td>
                    <span className={`status-badge ${item.riskBand?.toLowerCase() || 'low'}`}>
                      {item.riskBand}
                    </span>
                  </td>
                  <td>{interpretFuzzy(Number(item.fuzzyScore || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StudentPerformancePage;
