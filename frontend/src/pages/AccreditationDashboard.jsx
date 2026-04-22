import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Loading from '../components/Loading';
import StatCard from '../components/StatCard';

const formatDate = (value) => (value ? new Date(value).toLocaleString() : 'N/A');

const AccreditationDashboard = () => {
  const [data, setData] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await api.get('/analytics/accreditation-summary');
        setData(response.data.data);
      } catch (error) {
        setMessage(error?.response?.data?.message || 'Failed to load accreditation dashboard.');
      }
    };

    loadDashboard();
  }, []);

  if (!data && !message) return <Loading text="Loading accreditation dashboard..." />;
  if (!data) return <div className="error-box">{message}</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Accreditation Dashboard</h1>
        <p className="muted">
          Monitor institution-wide OBE readiness, weak outcomes, mapping coverage, and course-level accreditation signals.
        </p>
      </div>

      <div className="grid grid-4">
        <StatCard label="Programs" value={data.totalPrograms} />
        <StatCard label="Courses" value={data.totalCourses} />
        <StatCard label="Weak Outcomes" value={data.totalWeakOutcomes} />
        <StatCard label="Pending Action Items" value={data.totalPendingActionItems} />
      </div>

      <div className="inline-actions" style={{ marginBottom: '1rem' }}>
        <Link className="btn btn-secondary" to="/programs">
          Open Programs
        </Link>
        <Link className="btn btn-secondary" to="/courses">
          Open Courses
        </Link>
        <Link className="btn btn-secondary" to="/analytics">
          Open Analytics
        </Link>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>Accreditation Modules</h3>
          <p className="muted">
            The institutional role foundation is ready. These modules are scaffolded and can now grow into full accreditation workflows without disturbing faculty, student, or head experiences.
          </p>
          <div className="inline-actions">
            <Link className="btn btn-secondary" to="/accreditation/improvement-plans">
              Improvement Plans
            </Link>
            <Link className="btn btn-secondary" to="/accreditation/evidence-manager">
              Evidence Manager
            </Link>
            <Link className="btn btn-secondary" to="/accreditation/curriculum-governance">
              Curriculum Governance
            </Link>
            <Link className="btn btn-secondary" to="/accreditation/reports">
              Accreditation Reports
            </Link>
          </div>
        </div>

        <div className="card">
          <h3>Outcome Summary</h3>
          <table className="table">
            <tbody>
              <tr>
                <th>Total CLOs</th>
                <td>{data.outcomeSummary?.totalClos || 0}</td>
              </tr>
              <tr>
                <th>Total PLOs</th>
                <td>{data.outcomeSummary?.totalPlos || 0}</td>
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

      <div className="grid grid-2">
        <div className="card">
          <h3>Mapping Summary</h3>
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
                <th>Total Mapping Rows</th>
                <td>{data.mappingSummary?.totalMappingRows || 0}</td>
              </tr>
              <tr>
                <th>Action-Item Placeholder</th>
                <td>{data.totalPendingActionItems}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>Recent Analytics Snapshots</h3>
          {data.recentSnapshots?.length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Fuzzy</th>
                  <th>Weak Outcomes</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSnapshots.slice(0, 4).map((item) => (
                  <tr key={item.courseId}>
                    <td>
                      <strong>{item.courseCode}</strong>
                      <div className="muted">{item.courseName}</div>
                    </td>
                    <td>{item.averageFuzzy}</td>
                    <td>{item.weakClos + item.weakPlos}</td>
                    <td>{formatDate(item.lastEvaluatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">No analytics snapshots are available yet.</p>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3>Institution Course Snapshots</h3>
        {data.recentSnapshots?.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Program</th>
                <th>Average Fuzzy</th>
                <th>Students</th>
                <th>Weak Outcomes</th>
                <th>Weak Students</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.recentSnapshots.map((item) => (
                <tr key={item.courseId}>
                  <td>
                    <strong>{item.courseCode}</strong>
                    <div className="muted">{item.courseName}</div>
                  </td>
                  <td>
                    <div>{item.programCode}</div>
                    <div className="muted">{item.departmentCode}</div>
                  </td>
                  <td>{item.averageFuzzy}</td>
                  <td>{item.totalStudents}</td>
                  <td>{item.weakClos + item.weakPlos}</td>
                  <td>{item.weakStudents}</td>
                  <td>
                    <Link className="btn btn-secondary" to={`/courses/${item.courseId}`}>
                      View course
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">Course analytics will appear here after result evaluations are recorded.</p>
        )}
      </div>

      <div className="card">
        <h3>Program Analytics</h3>
        {data.programAnalytics?.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>Program</th>
                <th>Department</th>
                <th>Average Fuzzy</th>
                <th>Result Count</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.programAnalytics.map((item) => (
                <tr key={item.programId}>
                  <td>
                    <strong>{item.programCode}</strong>
                    <div className="muted">{item.programName}</div>
                  </td>
                  <td>{item.departmentCode}</td>
                  <td>{item.averageFuzzy}</td>
                  <td>{item.count}</td>
                  <td>
                    <Link className="btn btn-secondary" to={`/programs/${item.programId}`}>
                      View program
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">Program analytics will appear once course results exist for active programs.</p>
        )}
      </div>
    </div>
  );
};

export default AccreditationDashboard;
