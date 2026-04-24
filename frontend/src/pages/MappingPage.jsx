import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import Loading from '../components/Loading';

const createMappingRow = () => ({
  cloCode: '',
  ploCode: '',
  weight: 1
});

const MappingPage = () => {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [mappings, setMappings] = useState([createMappingRow()]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');

  const selectedCourse = useMemo(
    () => courses.find((item) => item._id === courseId) || null,
    [courseId, courses]
  );
  const validMappings = useMemo(
    () => mappings.filter((item) => item.cloCode && item.ploCode),
    [mappings]
  );
  const totalWeight = useMemo(
    () => validMappings.reduce((total, item) => total + Number(item.weight || 0), 0),
    [validMappings]
  );

  const loadCourses = async () => {
    const response = await api.get('/courses', { params: { scope: 'assigned' } });
    const list = response.data.data.courses || [];
    setCourses(list);
    setCourseId((prev) => prev || list[0]?._id || '');
  };

  const loadMapping = async (selectedCourseId) => {
    if (!selectedCourseId) {
      setMappings([createMappingRow()]);
      return;
    }

    const response = await api.get(`/mappings/${selectedCourseId}`);
    const existing = response.data.data.mapping?.mappings || [];
    setMappings(existing.length ? existing : [createMappingRow()]);
  };

  useEffect(() => {
    const run = async () => {
      try {
        await loadCourses();
      } catch (error) {
        setFeedback(error?.response?.data?.message || 'Failed to load assigned courses.');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  useEffect(() => {
    if (courseId) {
      loadMapping(courseId).catch((error) => {
        setFeedback(error?.response?.data?.message || 'Failed to load mapping data.');
      });
    }
  }, [courseId]);

  const updateRow = (index, field, value) => {
    setMappings((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)));
  };

  const addRow = () => {
    setMappings((prev) => [...prev, createMappingRow()]);
  };

  const removeRow = (index) => {
    setMappings((prev) => {
      const next = prev.filter((_, itemIndex) => itemIndex !== index);
      return next.length ? next : [createMappingRow()];
    });
  };

  const saveHandler = async (event) => {
    event.preventDefault();
    setFeedback('');

    try {
      await api.put(`/mappings/${courseId}`, {
        mappings: mappings
          .map((item) => ({
            ...item,
            weight: Number(item.weight)
          }))
          .filter((item) => item.cloCode && item.ploCode)
      });
      setFeedback('Mapping saved successfully.');
      await loadMapping(courseId);
    } catch (error) {
      setFeedback(error?.response?.data?.message || 'Failed to save mapping.');
    }
  };

  if (loading) return <Loading text="Loading mapping page..." />;

  return (
    <div>
      <div className="page-header">
        <h1>CLO - PLO Mapping</h1>
        <p className="muted">
          Review approved course mappings or adjust them for your assigned courses.
        </p>
      </div>

      {feedback ? <div className={feedback.toLowerCase().includes('failed') ? 'error-box' : 'success-box'}>{feedback}</div> : null}

      <div className="workspace-grid">
        <form className="card" onSubmit={saveHandler}>
          <div className="section-heading">
            <div>
              <span className="kicker">Mapping Studio</span>
              <h3 style={{ marginTop: '0.55rem' }}>Course-to-program alignment</h3>
              <p className="muted" style={{ marginBottom: 0 }}>
                Keep the mapping weights clean and traceable so attainment reports remain credible during review.
              </p>
            </div>
            {selectedCourse ? <span className="status-badge badge-muted">{selectedCourse.code}</span> : null}
          </div>

          <label>Course</label>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)} disabled={!courses.length}>
            {courses.map((item) => (
              <option value={item._id} key={item._id}>
                {item.code}
              </option>
            ))}
          </select>

          {courses.length === 0 ? <p className="muted">No approved assigned courses available yet.</p> : null}

          <table className="table">
            <thead>
              <tr>
                <th>CLO Code</th>
                <th>PLO Code</th>
                <th>Weight</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {mappings.map((item, index) => (
                <tr key={`mapping-${index}`}>
                  <td>
                    <input value={item.cloCode} onChange={(e) => updateRow(index, 'cloCode', e.target.value)} />
                  </td>
                  <td>
                    <input value={item.ploCode} onChange={(e) => updateRow(index, 'ploCode', e.target.value)} />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={item.weight}
                      onChange={(e) => updateRow(index, 'weight', e.target.value)}
                    />
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-small" type="button" onClick={() => removeRow(index)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="inline-actions">
            <button type="button" className="btn btn-secondary" onClick={addRow}>
              Add Row
            </button>
            <button className="btn" disabled={!courses.length}>
              Save Mapping
            </button>
          </div>
        </form>

        <aside className="workspace-rail">
          <div className="card card-accent">
            <span className="kicker">Alignment Snapshot</span>
            <div className="section-heading" style={{ marginTop: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>{selectedCourse?.name || 'Select a course'}</h3>
                <p className="muted">{selectedCourse?.program?.name || 'Program context appears once a course is chosen.'}</p>
              </div>
            </div>

            <div className="mini-metrics">
              <div className="mini-metric">
                <span className="mini-metric-label">Active rows</span>
                <span className="mini-metric-value">{validMappings.length}</span>
              </div>
              <div className="mini-metric">
                <span className="mini-metric-label">Total weight</span>
                <span className="mini-metric-value">{totalWeight.toFixed(1)}</span>
              </div>
              <div className="mini-metric">
                <span className="mini-metric-label">Course CLOs</span>
                <span className="mini-metric-value">{selectedCourse?.clos?.length || 0}</span>
              </div>
              <div className="mini-metric">
                <span className="mini-metric-label">Program PLOs</span>
                <span className="mini-metric-value">{selectedCourse?.program?.plos?.length || 0}</span>
              </div>
            </div>

            <ul className="data-points" style={{ marginTop: '0.9rem' }}>
              <li>
                <strong>Department</strong>
                <span>{selectedCourse?.department?.code || selectedCourse?.department?.name || 'N/A'}</span>
              </li>
              <li>
                <strong>Program code</strong>
                <span>{selectedCourse?.program?.code || 'N/A'}</span>
              </li>
            </ul>
          </div>

          <div className="stack-lg">
          <div className="card">
            <h3>Course CLO Reference</h3>
            {selectedCourse?.clos?.length ? (
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>CLO</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCourse.clos.map((item) => (
                      <tr key={item.code}>
                        <td>{item.code}</td>
                        <td>{item.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted">No CLOs available for the selected course yet.</p>
            )}
          </div>

          <div className="card">
            <h3>Program PLO Reference</h3>
            {selectedCourse?.program?.plos?.length ? (
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>PLO</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCourse.program.plos.map((item) => (
                      <tr key={item.code}>
                        <td>{item.code}</td>
                        <td>{item.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted">No PLOs saved for the selected program.</p>
            )}
          </div>

          <div className="card">
            <h3>Mapping Notes</h3>
            <ul className="helper-list">
              <li>Use consistent CLO and PLO codes so analytics can join the records correctly.</li>
              <li>Weights should reflect actual contribution, not placeholder totals.</li>
              <li>Duplicate pairs usually indicate overlap that should be merged before saving.</li>
            </ul>
          </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default MappingPage;
