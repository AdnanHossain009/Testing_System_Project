import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';
import Loading from '../components/Loading';
import StatCard from '../components/StatCard';

const formatCloSplit = (assessment) => {
  if (assessment?.cloDistribution?.length) {
    return assessment.cloDistribution.map((item) => `${item.cloCode}: ${item.marks}`).join(', ');
  }

  if (assessment?.cloCodes?.length) {
    return assessment.cloCodes.join(', ');
  }

  return 'N/A';
};

const CourseDetailsPage = () => {
  const { courseId } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    const run = async () => {
      const response = await api.get(`/reports/course/${courseId}/summary`);
      setData(response.data.data);
    };

    run();
  }, [courseId]);

  if (!data) return <Loading text="Loading course details..." />;

  const { course, assessments = [], mapping, analytics } = data;

  return (
    <div>
      <div className="page-header">
        <h1>
          {course.code} - {course.name}
        </h1>
        <p className="muted">
          Detailed CLO, assessment, rubric, and class-level attainment view for this course.
        </p>
      </div>

      <div className="inline-actions" style={{ marginBottom: '1rem' }}>
        <Link className="btn btn-secondary" to="/courses">
          Back to Courses
        </Link>
        <Link className="btn btn-secondary" to="/analytics">
          Open Analytics
        </Link>
      </div>

      <div className="grid grid-4">
        <StatCard label="Credits" value={course.credits} />
        <StatCard label="Semester" value={course.semester} />
        <StatCard label="CLOs" value={course.clos?.length || 0} />
        <StatCard label="Class Attained CLOs" value={analytics.classCloAttainment?.filter((item) => item.attained).length || 0} />
      </div>

      {course.description ? (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3>Course Description</h3>
          <p className="muted" style={{ marginBottom: 0 }}>
            {course.description}
          </p>
        </div>
      ) : null}

      <div className="grid grid-2">
        <div className="card">
          <h3>Course CLOs</h3>
          <table className="table">
            <thead>
              <tr>
                <th>CLO</th>
                <th>Description</th>
                <th>Bloom</th>
              </tr>
            </thead>
            <tbody>
              {(course.clos || []).map((item) => (
                <tr key={item.code}>
                  <td>{item.code}</td>
                  <td>{item.description}</td>
                  <td>{item.bloomLevel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>Assessment Split</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Assessment</th>
                <th>Type</th>
                <th>Total Marks</th>
                <th>CLO Distribution</th>
                <th>Rubrics</th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((item) => (
                <tr key={item._id}>
                  <td>{item.title}</td>
                  <td>{item.type}</td>
                  <td>{item.totalMarks}</td>
                  <td>{formatCloSplit(item)}</td>
                  <td>{item.rubricCriteria?.length || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>CLO-PLO Mapping</h3>
          {mapping?.mappings?.length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>CLO</th>
                  <th>PLO</th>
                  <th>Weight</th>
                </tr>
              </thead>
              <tbody>
                {mapping.mappings.map((item, index) => (
                  <tr key={`${item.cloCode}-${item.ploCode}-${index}`}>
                    <td>{item.cloCode}</td>
                    <td>{item.ploCode}</td>
                    <td>{item.weight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">No CLO-PLO mapping found for this course.</p>
          )}
        </div>

        <div className="card">
          <h3>Class-Level CLO Attainment</h3>
          <table className="table">
            <thead>
              <tr>
                <th>CLO</th>
                <th>Avg Score</th>
                <th>Attainment %</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(analytics.classCloAttainment || []).map((item) => (
                <tr key={item.code}>
                  <td>{item.code}</td>
                  <td>{item.averageScore}</td>
                  <td>{item.attainmentPercent}%</td>
                  <td>{item.attained ? 'Attained' : 'Weak'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3>Why a CLO is Strong or Weak</h3>
        <table className="table">
          <thead>
            <tr>
              <th>CLO</th>
              <th>Average Score</th>
              <th>Class Attainment</th>
              <th>Explanation</th>
            </tr>
          </thead>
          <tbody>
            {(analytics.cloInsights || []).map((item) => (
              <tr key={item.code}>
                <td>{item.code}</td>
                <td>{item.averageScore}</td>
                <td>{item.classAttainmentPercent}%</td>
                <td className="muted">{item.explanation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CourseDetailsPage;
