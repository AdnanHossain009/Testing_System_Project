import { useEffect, useState } from 'react';
import api from '../api/client';
import Loading from '../components/Loading';
import StatCard from '../components/StatCard';

const HighRiskStudentsPage = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const run = async () => {
      const response = await api.get('/analytics/admin-summary');
      setData(response.data.data);
    };

    run();
  }, []);

  if (!data) return <Loading text="Loading high risk students..." />;

  return (
    <div>
      <div className="page-header">
        <h1>High Risk Students</h1>
        <p className="muted">
          Students with high or critical risk bands across the platform.
        </p>
      </div>

      <div className="grid grid-4">
        <StatCard label="High Risk Count" value={data.highRiskCount} />
        <StatCard label="Users" value={data.userCount} />
        <StatCard label="Courses" value={data.courseCount} />
        <StatCard label="Departments" value={data.departmentCount} />
      </div>

      <div className="card">
        <h3>Risk List</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Course</th>
              <th>Risk Score</th>
              <th>Band</th>
              <th>Fuzzy</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {data.highRiskStudents.map((item) => (
              <tr key={item._id}>
                <td>
                  <strong>{item.student?.name}</strong>
                  <div className="muted">{item.student?.studentId || item.student?.email}</div>
                </td>
                <td>
                  {item.course?.code} - {item.course?.name}
                </td>
                <td>{item.riskScore}</td>
                <td>{item.riskBand}</td>
                <td>{item.fuzzyScore}</td>
                <td className="muted">
                  {item.alerts?.length ? item.alerts[0] : 'Immediate academic support recommended.'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HighRiskStudentsPage;
