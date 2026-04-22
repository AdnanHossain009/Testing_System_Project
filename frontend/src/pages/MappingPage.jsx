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

      <div className="grid grid-2">
        <form className="card" onSubmit={saveHandler}>
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

        <div className="stack-lg">
          <div className="card">
            <h3>Course CLO Reference</h3>
            {selectedCourse?.clos?.length ? (
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
            ) : (
              <p className="muted">No CLOs available for the selected course yet.</p>
            )}
          </div>

          <div className="card">
            <h3>Program PLO Reference</h3>
            {selectedCourse?.program?.plos?.length ? (
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
            ) : (
              <p className="muted">No PLOs saved for the selected program.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MappingPage;
