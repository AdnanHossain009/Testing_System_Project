import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Loading from '../components/Loading';
import { buildReportQueryString } from '../utils/accreditationReportHelpers';

const initialFilters = {
  academicTerm: '',
  departmentId: '',
  programId: '',
  courseId: ''
};

const getProgramsForDepartment = (programs, departmentId) =>
  departmentId
    ? programs.filter((item) => String(item.department?._id || item.department) === String(departmentId))
    : programs;

const getCoursesForScope = (courses, departmentId, programId) =>
  courses.filter((item) => {
    const matchesDepartment = departmentId
      ? String(item.department?._id || item.department) === String(departmentId)
      : true;
    const matchesProgram = programId ? String(item.program?._id || item.program) === String(programId) : true;
    return matchesDepartment && matchesProgram;
  });

const AccreditationReportsPage = () => {
  const [filters, setFilters] = useState(initialFilters);
  const [reports, setReports] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const availablePrograms = useMemo(
    () => getProgramsForDepartment(programs, filters.departmentId),
    [programs, filters.departmentId]
  );
  const availableCourses = useMemo(
    () => getCoursesForScope(courses, filters.departmentId, filters.programId),
    [courses, filters.departmentId, filters.programId]
  );

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);
      setMessage('');

      try {
        const [catalogResponse, departmentResponse, programResponse, courseResponse] = await Promise.all([
          api.get('/reports/accreditation/catalog'),
          api.get('/departments'),
          api.get('/programs'),
          api.get('/courses')
        ]);

        setReports(catalogResponse.data.data.reports || []);
        setDepartments(departmentResponse.data.data.departments || []);
        setPrograms(programResponse.data.data.programs || []);
        setCourses(courseResponse.data.data.courses || []);
      } catch (error) {
        setMessage(error?.response?.data?.message || 'Failed to load accreditation reports.');
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, []);

  const handleDepartmentChange = (departmentId) => {
    const nextPrograms = getProgramsForDepartment(programs, departmentId);
    const nextCourses = getCoursesForScope(courses, departmentId, '');

    setFilters((current) => ({
      ...current,
      departmentId,
      programId: nextPrograms.find((item) => item._id === current.programId)?._id || '',
      courseId: nextCourses.find((item) => item._id === current.courseId)?._id || ''
    }));
  };

  const handleProgramChange = (programId) => {
    const nextCourses = getCoursesForScope(courses, filters.departmentId, programId);

    setFilters((current) => ({
      ...current,
      programId,
      courseId: nextCourses.find((item) => item._id === current.courseId)?._id || ''
    }));
  };

  if (loading) {
    return <Loading text="Loading accreditation reports..." />;
  }

  const queryString = buildReportQueryString(filters);

  return (
    <div>
      <div className="page-header">
        <h1>Accreditation Reports</h1>
        <p className="muted">
          Build accreditation-ready previews and exports for attainment, gaps, evidence, improvement actions, and self-study narratives.
        </p>
      </div>

      {message ? <div className="error-box">{message}</div> : null}

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="section-heading">
          <div>
            <h3>Report Filters</h3>
            <p className="muted">Set the institutional scope once, then open any report type with the same filter context.</p>
          </div>
        </div>

        <div className="grid grid-4">
          <div>
            <label>Academic Term</label>
            <input
              value={filters.academicTerm}
              onChange={(event) => setFilters((current) => ({ ...current, academicTerm: event.target.value }))}
              placeholder="Optional term"
            />
          </div>
          <div>
            <label>Department</label>
            <select value={filters.departmentId} onChange={(event) => handleDepartmentChange(event.target.value)}>
              <option value="">All Departments</option>
              {departments.map((item) => (
                <option value={item._id} key={item._id}>
                  {item.code} - {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Program</label>
            <select value={filters.programId} onChange={(event) => handleProgramChange(event.target.value)}>
              <option value="">All Programs</option>
              {availablePrograms.map((item) => (
                <option value={item._id} key={item._id}>
                  {item.code} - {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Course</label>
            <select value={filters.courseId} onChange={(event) => setFilters((current) => ({ ...current, courseId: event.target.value }))}>
              <option value="">All Courses</option>
              {availableCourses.map((item) => (
                <option value={item._id} key={item._id}>
                  {item.code} - {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-2 align-start">
        {reports.map((report) => (
          <div className="card" key={report.type}>
            <h3>{report.title}</h3>
            <p className="muted">{report.description}</p>
            <p className="muted">Formats: {report.formats.join(', ').toUpperCase()}</p>
            <div className="inline-actions">
              <Link className="btn" to={`/accreditation/reports/${report.type}${queryString ? `?${queryString}` : ''}`}>
                Preview Report
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccreditationReportsPage;
