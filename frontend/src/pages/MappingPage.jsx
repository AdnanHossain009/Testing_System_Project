import { useEffect, useState } from 'react';
import api from '../api/client';
import Loading from '../components/Loading';

const MappingPage = () => {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [mappings, setMappings] = useState([{ cloCode: 'CLO1', ploCode: 'PLO1', weight: 1 }]);
  const [loading, setLoading] = useState(true);

  const loadCourses = async () => {
    const response = await api.get('/courses');
    const list = response.data.data.courses;
    setCourses(list);
    setCourseId(list[0]?._id || '');
    setLoading(false);
  };

  const loadMapping = async (selectedCourseId) => {
    if (!selectedCourseId) return;
    const response = await api.get(`/mappings/${selectedCourseId}`);
    const existing = response.data.data.mapping?.mappings || [];
    if (existing.length) setMappings(existing);
  };

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (courseId) loadMapping(courseId);
  }, [courseId]);

  const updateRow = (index, field, value) => {
    setMappings((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const addRow = () => {
    setMappings((prev) => [...prev, { cloCode: '', ploCode: '', weight: 1 }]);
  };

  const saveHandler = async (event) => {
    event.preventDefault();
    await api.put(`/mappings/${courseId}`, { mappings: mappings.map((item) => ({ ...item, weight: Number(item.weight) })) });
    alert('Mapping saved.');
  };

  if (loading) return <Loading text="Loading mapping page..." />;

  return (
    <div>
      <div className="page-header">
        <h1>CLO - PLO Mapping</h1>
        <p className="muted">
          Select a course and map each CLO to one or more PLOs with relative weights.
        </p>
      </div>

      <form className="card" onSubmit={saveHandler}>
        <label>Course</label>
        <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          {courses.map((item) => (
            <option value={item._id} key={item._id}>
              {item.code}
            </option>
          ))}
        </select>

        <table className="table">
          <thead>
            <tr>
              <th>CLO Code</th>
              <th>PLO Code</th>
              <th>Weight</th>
            </tr>
          </thead>
          <tbody>
            {mappings.map((item, index) => (
              <tr key={index}>
                <td>
                  <input
                    value={item.cloCode}
                    onChange={(e) => updateRow(index, 'cloCode', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    value={item.ploCode}
                    onChange={(e) => updateRow(index, 'ploCode', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    value={item.weight}
                    onChange={(e) => updateRow(index, 'weight', e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="inline-actions">
          <button type="button" className="btn btn-secondary" onClick={addRow}>
            Add Row
          </button>
          <button className="btn">Save Mapping</button>
        </div>
      </form>
    </div>
  );
};

export default MappingPage;
