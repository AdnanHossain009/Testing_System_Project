import { useEffect, useState } from 'react';
import api from '../api/client';
import Loading from '../components/Loading';
import { useAuth } from '../context/AuthContext';

const initialForm = {
  name: '',
  code: '',
  credits: 3,
  semester: '8th',
  program: '',
  closText: 'CLO1|Explain the course topic|C2',
  mappingsText: 'CLO1|PLO1|1',
  note: ''
};

const parseClos = (text) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [code, description, bloomLevel] = line.split('|');
      return {
        code: code?.trim(),
        description: description?.trim(),
        bloomLevel: bloomLevel?.trim() || 'C3'
      };
    })
    .filter((item) => item.code && item.description);

const parseMappings = (text) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [cloCode, ploCode, weight] = line.split('|');
      return {
        cloCode: cloCode?.trim(),
        ploCode: ploCode?.trim(),
        weight: Number(weight)
      };
    })
    .filter((item) => item.cloCode && item.ploCode && Number.isFinite(item.weight));

const summarizeClos = (clos = []) => (clos.length ? clos.map((item) => item.code).join(', ') : 'N/A');

const summarizePlos = (mappings = []) => {
  const ploCodes = Array.from(new Set((mappings || []).map((item) => item.ploCode)));
  return ploCodes.length ? ploCodes.join(', ') : 'N/A';
};

const CourseRequestsPage = () => {
  const { user } = useAuth();
  const departmentId = user?.department?._id || user?.department;

  const [programs, setPrograms] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  const loadPage = async () => {
    const [programResponse, requestResponse] = await Promise.all([
      api.get('/programs', { params: { departmentId } }),
      api.get('/course-requests/my', { params: { type: 'faculty_course' } })
    ]);

    const programList = programResponse.data.data.programs || [];
    setPrograms(programList);
    setRequests(requestResponse.data.data.requests || []);
    setForm((prev) => ({
      ...prev,
      program: prev.program || programList[0]?._id || ''
    }));
  };

  useEffect(() => {
    const run = async () => {
      try {
        await loadPage();
      } catch (error) {
        setFeedback(error?.response?.data?.message || 'Failed to load course requests.');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [departmentId]);

  const submitHandler = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback('');

    try {
      await api.post('/course-requests/faculty-course', {
        name: form.name,
        code: form.code,
        credits: Number(form.credits),
        semester: form.semester,
        department: departmentId,
        program: form.program,
        clos: parseClos(form.closText),
        mappings: parseMappings(form.mappingsText),
        note: form.note
      });

      setFeedback('Course request submitted to the department head.');
      setForm(initialForm);
      await loadPage();
    } catch (error) {
      setFeedback(error?.response?.data?.message || 'Failed to submit course request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading text="Loading course requests..." />;

  return (
    <div>
      <div className="page-header">
        <h1>Course Requests</h1>
        <p className="muted">
          Request a new course from the department head with full CLO and PLO mapping details.
        </p>
      </div>

      {feedback ? <div className={feedback.includes('Failed') ? 'error-box' : 'success-box'}>{feedback}</div> : null}

      <div className="grid grid-2">
        <form className="card" onSubmit={submitHandler}>
          <h3>Request Course Approval</h3>
          <p className="muted" style={{ marginTop: 0 }}>
            Department: {user?.department?.name || user?.department?.code || 'Your department'}
          </p>

          <label>Course Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

          <label>Course Code</label>
          <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />

          <div className="grid grid-2">
            <div>
              <label>Credits</label>
              <input
                type="number"
                value={form.credits}
                onChange={(e) => setForm({ ...form, credits: e.target.value })}
              />
            </div>
            <div>
              <label>Semester</label>
              <input value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} />
            </div>
          </div>

          <label>Program</label>
          <select value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })}>
            {programs.map((item) => (
              <option value={item._id} key={item._id}>
                {item.code} - {item.name}
              </option>
            ))}
          </select>

          <label>CLOs one per line, format: code|description|bloom</label>
          <textarea rows="5" value={form.closText} onChange={(e) => setForm({ ...form, closText: e.target.value })} />

          <label>CLO-PLO mappings one per line, format: clo|plo|weight</label>
          <textarea
            rows="5"
            value={form.mappingsText}
            onChange={(e) => setForm({ ...form, mappingsText: e.target.value })}
          />

          <label>Note</label>
          <textarea rows="3" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />

          <button className="btn" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Send Request'}
          </button>
        </form>

        <div className="card">
          <h3>My Course Requests</h3>
          {requests.length === 0 ? (
            <p className="muted">No course requests submitted yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>CLOs</th>
                  <th>PLOs</th>
                  <th>Status</th>
                  <th>Reviewed By</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <strong>{item.proposedCourse?.code}</strong>
                      <div className="muted">{item.proposedCourse?.name}</div>
                    </td>
                    <td>{summarizeClos(item.proposedCourse?.clos || [])}</td>
                    <td>{summarizePlos(item.proposedMappings || [])}</td>
                    <td>{item.status}</td>
                    <td>{item.reviewedBy?.name || 'Pending'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseRequestsPage;