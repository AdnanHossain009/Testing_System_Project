import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Loading from '../components/Loading';

const initialForm = { name: '', code: '', department: '', plosText: 'PLO1|Engineering knowledge' };

const parsePLOs = (text) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [code, description] = line.split('|');
      return { code: code?.trim(), description: description?.trim() };
    });

const ProgramsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    const [deptResponse, programResponse] = await Promise.all([
      api.get('/departments'),
      api.get('/programs')
    ]);

    const deptList = deptResponse.data.data.departments;
    setDepartments(deptList);
    setPrograms(programResponse.data.data.programs);
    setForm((prev) => ({ ...prev, department: prev.department || deptList[0]?._id || '' }));
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const submitHandler = async (event) => {
    event.preventDefault();
    await api.post('/programs', {
      name: form.name,
      code: form.code,
      department: form.department,
      plos: parsePLOs(form.plosText)
    });
    setForm(initialForm);
    loadAll();
  };

  if (loading) return <Loading text="Loading programs..." />;

  return (
    <div>
      <div className="page-header">
        <h1>Programs</h1>
        <p className="muted">Create academic programs and enter PLO definitions.</p>
      </div>

      <div className="grid grid-2">
        <form className="card" onSubmit={submitHandler}>
          <h3>Create Program</h3>
          <label>Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

          <label>Code</label>
          <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />

          <label>Department</label>
          <select
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
          >
            {departments.map((item) => (
              <option value={item._id} key={item._id}>
                {item.code} - {item.name}
              </option>
            ))}
          </select>

          <label>PLOs (one per line, format: code|description)</label>
          <textarea
            rows="6"
            value={form.plosText}
            onChange={(e) => setForm({ ...form, plosText: e.target.value })}
          />

          <button className="btn">Save Program</button>
        </form>

        <div className="card">
          <h3>Existing Programs</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>PLO Count</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {programs.map((item) => (
                <tr key={item._id}>
                  <td>{item.code}</td>
                  <td>{item.name}</td>
                  <td>{item.plos?.length || 0}</td>
                  <td>
                    <Link className="btn btn-secondary" to={`/programs/${item._id}`}>
                      View details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProgramsPage;
