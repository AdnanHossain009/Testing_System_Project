import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Loading from '../components/Loading';
import StatCard from '../components/StatCard';
import {
  buildReportQueryString,
  getGovernanceStatusClassName,
  getHeatLevelClassName,
  getIssueTypeLabel
} from '../utils/accreditationReportHelpers';

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

const CurriculumGovernancePage = () => {
  const [filters, setFilters] = useState(initialFilters);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [data, setData] = useState(null);
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

  const loadPage = async (nextFilters = filters) => {
    setLoading(true);
    setMessage('');

    try {
      const params = {
        ...(nextFilters.academicTerm ? { academicTerm: nextFilters.academicTerm.trim() } : {}),
        ...(nextFilters.departmentId ? { departmentId: nextFilters.departmentId } : {}),
        ...(nextFilters.programId ? { programId: nextFilters.programId } : {}),
        ...(nextFilters.courseId ? { courseId: nextFilters.courseId } : {})
      };

      const [departmentResponse, programResponse, courseResponse, governanceResponse] = await Promise.all([
        api.get('/departments'),
        api.get('/programs'),
        api.get('/courses'),
        api.get('/analytics/curriculum-governance', { params })
      ]);

      setDepartments(departmentResponse.data.data.departments || []);
      setPrograms(programResponse.data.data.programs || []);
      setCourses(courseResponse.data.data.courses || []);
      setData(governanceResponse.data.data);
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Failed to load curriculum governance data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  const applyFilters = async (event) => {
    event.preventDefault();
    await loadPage(filters);
  };

  const resetFilters = async () => {
    setFilters(initialFilters);
    await loadPage(initialFilters);
  };

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

  if (loading && !data) {
    return <Loading text="Loading curriculum governance..." />;
  }

  if (!data) {
    return <div className="error-box">{message || 'Curriculum governance data is unavailable.'}</div>;
  }

  const reportQuery = buildReportQueryString(filters);

  return (
    <div>
      <div className="page-header">
        <h1>Curriculum Governance</h1>
        <p className="muted">
          Review program-level curriculum coverage, identify mapping gaps, and monitor where weak assessment coverage may affect accreditation readiness.
        </p>
      </div>

      {message ? <div className="error-box">{message}</div> : null}

      <div className="inline-actions" style={{ marginBottom: '1rem' }}>
        <Link className="btn" to={`/accreditation/reports/curriculum_gap${reportQuery ? `?${reportQuery}` : ''}`}>
          Preview Curriculum Gap Report
        </Link>
        <Link className="btn btn-secondary" to={`/accreditation/reports/plo_summary${reportQuery ? `?${reportQuery}` : ''}`}>
          Preview PLO Summary Report
        </Link>
      </div>

      <form className="card" onSubmit={applyFilters} style={{ marginBottom: '1rem' }}>
        <div className="section-heading">
          <div>
            <h3>Governance Filters</h3>
            <p className="muted">Filter coverage summaries and governance signals by department, program, course, and planning term metadata.</p>
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

        <div className="inline-actions">
          <button className="btn" type="submit">
            Apply Filters
          </button>
          <button className="btn btn-secondary" type="button" onClick={resetFilters}>
            Reset Filters
          </button>
        </div>
      </form>

      {data.metadata?.note ? <div className="soft-warning">{data.metadata.note}</div> : null}

      <div className="grid grid-4">
        <StatCard label="Programs" value={data.summary?.totalPrograms || 0} />
        <StatCard label="Courses" value={data.summary?.totalCourses || 0} />
        <StatCard label="Mapped PLOs" value={data.summary?.mappedPlos || 0} />
        <StatCard label="Unmapped PLOs" value={data.summary?.unmappedPlos || 0} />
      </div>

      <div className="grid grid-4">
        <StatCard label="Under-Covered PLOs" value={data.summary?.underCoveredPlos || 0} />
        <StatCard label="Over-Covered PLOs" value={data.summary?.overCoveredPlos || 0} />
        <StatCard label="Weakly Assessed" value={data.summary?.weaklyAssessedAreas || 0} />
        <StatCard label="Mapping Rows" value={data.summary?.totalMappingRows || 0} />
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="section-heading">
          <div>
            <h3>Outcome Coverage Summary</h3>
            <p className="muted">Program-level PLO coverage, assessment density, and attainment against target.</p>
          </div>
        </div>

        {data.outcomeCoverageSummary?.length ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Program</th>
                  <th>PLO</th>
                  <th>Mapped Courses</th>
                  <th>Mapped CLOs</th>
                  <th>Assessments</th>
                  <th>Current</th>
                  <th>Target</th>
                  <th>Gap</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.outcomeCoverageSummary.map((item) => (
                  <tr key={`${item.programId}-${item.ploCode}`}>
                    <td>
                      <strong>{item.programCode}</strong>
                      <div className="muted">{item.departmentCode}</div>
                    </td>
                    <td>
                      <strong>{item.ploCode}</strong>
                      <div className="muted">{item.ploDescription}</div>
                    </td>
                    <td>
                      {item.coverageCourseCount} / {item.totalCourses}
                      <div className="muted">{item.coverageRatio}% coverage</div>
                    </td>
                    <td>{item.mappedCloCount}</td>
                    <td>{item.assessmentCoverageCount}</td>
                    <td>{item.currentAttainment}</td>
                    <td>{item.targetAttainment}</td>
                    <td>{item.gap}</td>
                    <td>
                      <span className={`status-badge ${getGovernanceStatusClassName(item.status)}`}>
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">No PLO coverage rows matched the current filters.</p>
        )}
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="section-heading">
          <div>
            <h3>Weak Coverage Areas</h3>
            <p className="muted">These outcomes should be reviewed first because they are unmapped, weakly assessed, or below target.</p>
          </div>
        </div>

        {data.weakCoverageAreas?.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>Issue</th>
                <th>Program</th>
                <th>Outcome</th>
                <th>Coverage</th>
                <th>Assessments</th>
                <th>Gap</th>
                <th>Plans</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              {data.weakCoverageAreas.map((item, index) => (
                <tr key={`${item.programId}-${item.outcomeCode}-${index}`}>
                  <td>{getIssueTypeLabel(item.issueType)}</td>
                  <td>
                    <strong>{item.programCode}</strong>
                    <div className="muted">{item.departmentCode}</div>
                  </td>
                  <td>
                    <strong>{item.outcomeCode}</strong>
                    <div className="muted">{item.description}</div>
                  </td>
                  <td>
                    {item.coverageCourseCount} / {item.totalCourses}
                    <div className="muted">{item.coverageRatio}%</div>
                  </td>
                  <td>{item.assessmentCoverageCount}</td>
                  <td>{item.gap}</td>
                  <td>{item.openPlanCount}</td>
                  <td>{item.evidenceCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">No weak coverage areas were detected for the selected scope.</p>
        )}
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="section-heading">
          <div>
            <h3>Course Contribution Summary</h3>
            <p className="muted">See how each course contributes to mapped PLO coverage and where course-level weaknesses appear.</p>
          </div>
        </div>

        {data.courseContributionSummary?.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Program</th>
                <th>Mapped PLOs</th>
                <th>Mapped CLOs</th>
                <th>Unmapped CLOs</th>
                <th>Assessments</th>
                <th>Avg Fuzzy</th>
                <th>Weak Outcomes</th>
              </tr>
            </thead>
            <tbody>
              {data.courseContributionSummary.map((item) => (
                <tr key={item.courseId}>
                  <td>
                    <strong>{item.courseCode}</strong>
                    <div className="muted">{item.courseName}</div>
                  </td>
                  <td>{item.programCode}</td>
                  <td>{item.mappedPloCount}</td>
                  <td>{item.mappedCloCount}</td>
                  <td>{item.unmappedClos}</td>
                  <td>{item.totalAssessments}</td>
                  <td>{item.averageFuzzy}</td>
                  <td>{item.weakOutcomeCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">No course contribution rows are available for the selected scope.</p>
        )}
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="section-heading">
          <div>
            <h3>CLO-to-PLO Coverage Summary</h3>
            <p className="muted">Review each CLO and confirm that the intended program outcomes are actually covered and assessed.</p>
          </div>
        </div>

        {data.cloPloCoverageSummary?.length ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>CLO</th>
                  <th>Linked PLOs</th>
                  <th>Mapped Count</th>
                  <th>Assessments</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.cloPloCoverageSummary.map((item) => (
                  <tr key={`${item.courseId}-${item.cloCode}`}>
                    <td>
                      <strong>{item.courseCode}</strong>
                      <div className="muted">{item.programCode}</div>
                    </td>
                    <td>
                      <strong>{item.cloCode}</strong>
                      <div className="muted">{item.cloDescription}</div>
                    </td>
                    <td>{item.linkedPloCodes.length ? item.linkedPloCodes.join(', ') : 'None'}</td>
                    <td>{item.mappedPloCount}</td>
                    <td>{item.assessmentCoverageCount}</td>
                    <td>
                      <span className={`status-badge ${item.status === 'mapped' ? 'badge-success' : 'badge-danger'}`}>{item.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">No CLO coverage rows are available yet.</p>
        )}
      </div>

      <div className="stack-lg">
        {data.courseToPloMatrix?.map((program) => (
          <div className="card" key={program.programId}>
            <div className="section-heading">
              <div>
                <h3>
                  {program.programCode} Course-to-PLO Matrix
                </h3>
                <p className="muted">{program.programName} curriculum coverage heatmap.</p>
              </div>
            </div>

            {program.courseRows?.length ? (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      {program.ploColumns.map((plo) => (
                        <th key={plo.code}>{plo.code}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {program.courseRows.map((row) => (
                      <tr key={row.courseId}>
                        <td>
                          <strong>{row.courseCode}</strong>
                          <div className="muted">Weak outcomes: {row.weakOutcomeCount}</div>
                        </td>
                        {program.ploColumns.map((plo) => {
                          const cell = row.cells.find((item) => item.ploCode === plo.code);

                          return (
                            <td key={`${row.courseId}-${plo.code}`}>
                              <div className={`heat-cell ${getHeatLevelClassName(cell?.heatLevel)}`}>
                                <strong>{cell?.mappedCloCount || 0}</strong>
                                <div className="muted">CLOs</div>
                                <div className="muted">{cell?.assessmentCoverageCount || 0} asmts</div>
                                <div className="muted">{cell?.averageAttainment || 0}%</div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted">No matrix rows are available for this program.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CurriculumGovernancePage;
