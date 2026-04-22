import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';
import Loading from '../components/Loading';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';

const ProgramDetailsPage = () => {
  const { user } = useAuth();
  const { programId } = useParams();
  const [programs, setPrograms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!user?.role) {
        return;
      }

      const summaryEndpoint =
        user?.role === 'head' ? '/analytics/head-summary' : '/analytics/accreditation-summary';

      try {
        const [programResponse, courseResponse, summaryResponse] = await Promise.all([
          api.get('/programs'),
          api.get('/courses', { params: { programId } }),
          api.get(summaryEndpoint)
        ]);

        setPrograms(programResponse.data.data.programs || []);
        setCourses(courseResponse.data.data.courses || []);
        setAnalytics(summaryResponse.data.data);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [programId, user?.role]);

  const program = useMemo(
    () => programs.find((item) => item._id === programId) || null,
    [programId, programs]
  );

  const programAnalytics = analytics?.programAnalytics?.find((item) => item.programId === programId);

  if (loading) return <Loading text="Loading program details..." />;

  return (
    <div>
      <div className="page-header">
        <h1>{program?.code || 'Program'} Details</h1>
        <p className="muted">
          Review PLO definitions, linked courses, and the program level fuzzy summary.
        </p>
      </div>

      <div className="inline-actions" style={{ marginBottom: '1rem' }}>
        <Link className="btn btn-secondary" to="/programs">
          Back to Programs
        </Link>
      </div>

      <div className="grid grid-4">
        <StatCard label="Program Code" value={program?.code || 'N/A'} />
        <StatCard label="PLO Count" value={program?.plos?.length || 0} />
        <StatCard label="Courses" value={courses.length} />
        <StatCard label="Average Fuzzy" value={programAnalytics?.averageFuzzy || 0} />
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>Program Information</h3>
          <p>
            <strong>Name:</strong> {program?.name || 'N/A'}
          </p>
          <p>
            <strong>Department:</strong> {program?.department?.code || 'N/A'}
          </p>
          <p>
            <strong>Average Fuzzy:</strong> {programAnalytics?.averageFuzzy || 0}
          </p>
          <p>
            <strong>Result Count:</strong> {programAnalytics?.count || 0}
          </p>
        </div>

        <div className="card">
          <h3>PLO List</h3>
          <table className="table">
            <thead>
              <tr>
                <th>PLO</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {(program?.plos || []).map((item) => (
                <tr key={item.code}>
                  <td>{item.code}</td>
                  <td>{item.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3>Linked Courses</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Faculty</th>
              <th>CLO Count</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((item) => (
              <tr key={item._id}>
                <td>{item.code}</td>
                <td>{item.name}</td>
                <td>{item.faculty?.name || 'Not Assigned'}</td>
                <td>{item.clos?.length || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProgramDetailsPage;
