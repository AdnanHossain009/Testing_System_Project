import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Loading from '../components/Loading';
import StatCard from '../components/StatCard';

const AccreditationModulePlaceholderPage = ({ title, description }) => {
  const [data, setData] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const response = await api.get('/analytics/accreditation-summary');
        setData(response.data.data);
      } catch (error) {
        setMessage(error?.response?.data?.message || 'Failed to load accreditation module context.');
      }
    };

    loadSummary();
  }, []);

  if (!data && !message) return <Loading text={`Loading ${title.toLowerCase()}...`} />;
  if (!data) return <div className="error-box">{message}</div>;

  return (
    <div>
      <div className="page-header">
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>

      <div className="grid grid-4">
        <StatCard label="Programs" value={data.totalPrograms} />
        <StatCard label="Courses" value={data.totalCourses} />
        <StatCard label="Weak Outcomes" value={data.totalWeakOutcomes} />
        <StatCard label="Pending Action Items" value={data.totalPendingActionItems} />
      </div>

      <div className="inline-actions" style={{ marginBottom: '1rem' }}>
        <Link className="btn btn-secondary" to="/dashboard/accreditation">
          Back to Dashboard
        </Link>
        <Link className="btn btn-secondary" to="/analytics">
          Open Analytics
        </Link>
        <Link className="btn btn-secondary" to="/courses">
          Review Courses
        </Link>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>Module Status</h3>
          <p className="muted">
            The <code>accreditation_officer</code> role, routing, dashboard foundation, and institutional analytics access are now in place. This page is intentionally lightweight so future accreditation workflows can be added without mixing them into faculty or student modules.
          </p>
          <p>
            <strong>Current readiness:</strong> Foundation complete
          </p>
          <p>
            <strong>Next expansion path:</strong> Add role-specific forms, evidence records, approval trails, and export/reporting workflows.
          </p>
        </div>

        <div className="card">
          <h3>Readiness Snapshot</h3>
          <table className="table">
            <tbody>
              <tr>
                <th>Mapped Courses</th>
                <td>{data.mappingSummary?.mappedCourses || 0}</td>
              </tr>
              <tr>
                <th>Unmapped Courses</th>
                <td>{data.mappingSummary?.unmappedCourses || 0}</td>
              </tr>
              <tr>
                <th>Weak CLOs</th>
                <td>{data.outcomeSummary?.weakClos || 0}</td>
              </tr>
              <tr>
                <th>Weak PLOs</th>
                <td>{data.outcomeSummary?.weakPlos || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3>Recent Program Analytics</h3>
        {data.programAnalytics?.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>Program</th>
                <th>Department</th>
                <th>Average Fuzzy</th>
                <th>Result Count</th>
              </tr>
            </thead>
            <tbody>
              {data.programAnalytics.slice(0, 6).map((item) => (
                <tr key={item.programId}>
                  <td>
                    <strong>{item.programCode}</strong>
                    <div className="muted">{item.programName}</div>
                  </td>
                  <td>{item.departmentCode}</td>
                  <td>{item.averageFuzzy}</td>
                  <td>{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">Program analytics will populate here after course result evaluations are available.</p>
        )}
      </div>
    </div>
  );
};

export default AccreditationModulePlaceholderPage;
