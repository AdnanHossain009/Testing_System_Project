import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { assessmentService, courseService, cloService } from '../../services';
import { toast } from 'react-toastify';
import { useForm } from '../../hooks/useForm';
import { ASSESSMENT_TYPES } from '../../utils/constants';

const AssessmentsPage = () => {
  const [assessments, setAssessments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [clos, setCLOs] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);

  const { values, handleChange, handleSubmit, reset, setValues, setFieldValue } = useForm(
    { course: '', title: '', type: 'quiz', maxMarks: '', clo: '', weightage: '', date: '' },
    async (data) => {
      try {
        if (editingAssessment) {
          await assessmentService.update(editingAssessment._id, data);
          toast.success('Assessment updated successfully');
        } else {
          await assessmentService.create(data);
          toast.success('Assessment created successfully');
        }
        closeModal();
        fetchAssessments();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Operation failed');
      }
    }
  );

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (values.course) {
      fetchCLOsForCourse(values.course);
    }
  }, [values.course]);

  const fetchData = async () => {
    try {
      const [coursesRes, assessmentsRes] = await Promise.all([
        courseService.getAll(),
        assessmentService.getAll(),
      ]);
      setCourses(coursesRes.data || []);
      setAssessments(assessmentsRes.data || []);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssessments = async () => {
    try {
      const response = selectedCourse 
        ? await assessmentService.getByCourse(selectedCourse)
        : await assessmentService.getAll();
      const data = response.data.data;
      setAssessments(data?.items || data || []);
    } catch (error) {
      toast.error('Failed to load assessments');
      console.error('Error fetching assessments:', error);
    }
  };

  const fetchCLOsForCourse = async (courseId) => {
    try {
      const response = await cloService.getByCourse(courseId);
      const data = response.data.data;
      setCLOs(data?.items || data || []);
    } catch (error) {
      console.error('Failed to load CLOs:', error);
    }
  };

  const openModal = (assessment = null) => {
    if (assessment) {
      setEditingAssessment(assessment);
      setValues({
        course: assessment.course?._id || assessment.course,
        title: assessment.title,
        type: assessment.type,
        maxMarks: assessment.maxMarks,
        clo: assessment.clo?._id || assessment.clo,
        weightage: assessment.weightage || '',
        date: assessment.date ? assessment.date.split('T')[0] : '',
      });
    } else {
      setEditingAssessment(null);
      reset();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAssessment(null);
    reset();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this assessment?')) {
      try {
        await assessmentService.delete(id);
        toast.success('Assessment deleted successfully');
        fetchAssessments();
      } catch (error) {
        toast.error('Failed to delete assessment');
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Assessments</h1>
            <p className="text-gray-600 mt-2">Create and manage course assessments</p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Assessment
          </button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Course</label>
          <select
            value={selectedCourse}
            onChange={(e) => { setSelectedCourse(e.target.value); fetchAssessments(); }}
            className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Courses</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {assessments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No assessments found. Create your first assessment!</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Marks</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CLO</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assessments.map((assessment) => (
                    <tr key={assessment._id}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{assessment.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {assessment.course?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {assessment.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{assessment.maxMarks}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {assessment.clo?.code || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openModal(assessment)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(assessment._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingAssessment ? 'Edit Assessment' : 'Create Assessment'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
                  <select
                    name="course"
                    value={values.course}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                      <option key={course._id} value={course._id}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={values.title}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Quiz 1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    name="type"
                    value={values.type}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {ASSESSMENT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Marks *</label>
                  <input
                    type="number"
                    name="maxMarks"
                    value={values.maxMarks}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CLO *</label>
                  <select
                    name="clo"
                    value={values.clo}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a CLO</option>
                    {clos.map((clo) => (
                      <option key={clo._id} value={clo._id}>
                        {clo.code} - {clo.description}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weightage (%)</label>
                  <input
                    type="number"
                    name="weightage"
                    value={values.weightage}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={values.date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingAssessment ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AssessmentsPage;
