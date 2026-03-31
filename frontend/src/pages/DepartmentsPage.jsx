import { useEffect, useState } from 'react';
import api from '../api/client';
import Loading from '../components/Loading';

const initialForm = { name: '', code: '', description: '' };

const DepartmentsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadDepartments = async () => {
    const response = await api.get('/departments');
    setDepartments(response.data.data.departments);
    setLoading(false);
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const submitHandler = async (event) => {
    event.preventDefault();
    await api.post('/departments', form);
    setForm(initialForm);
    setMessage('Department created successfully.');
    loadDepartments();
  };

  if (loading) return <Loading text="Loading departments..." />;

  return (
    <div>
      <div className="page-header">
        <h1>Departments</h1>
        <p className="muted">Admin creates academic departments here.</p>
      </div>

      <div className="grid grid-2">
        <form className="card" onSubmit={submitHandler}>
          <h3>Create Department</h3>
          <label>Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Computer Science and Engineering"
          />

          <label>Code</label>
          <input
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="CSE"
          />

          <label>Description</label>
          <textarea
            rows="4"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Department details"
          />

          <button className="btn">Save Department</button>
          {message ? <div className="success-box">{message}</div> : null}
        </form>

        <div className="card">
          <h3>Existing Departments</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((item) => (
                <tr key={item._id}>
                  <td>{item.code}</td>
                  <td>{item.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DepartmentsPage;
