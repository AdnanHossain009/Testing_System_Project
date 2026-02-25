import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { ploService, programService } from '../../services';
import { toast } from 'react-toastify';
import { useForm } from '../../hooks/useForm';

const PLOsPage = () => {
  const [plos, setPLOs] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPLO, setEditingPLO] = useState(null);

  const { values, handleChange, handleSubmit, reset, setValues } = useForm(
    { program: '', code: '', description: '', domain: 'cognitive' },
    async (data) => {
      try {
        if (editingPLO) {
          await ploService.update(editingPLO.programId, editingPLO._id, data);
          toast.success('PLO updated successfully');
        } else {
          await ploService.create(data);
          toast.success('PLO created successfully');
        }
        closeModal();
        fetchPLOs();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Operation failed');
        console.error('PLO operation error:', error);
      }
    }
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [plosRes, programsRes] = await Promise.all([
        ploService.getAll(),
        programService.getAll(),
      ]);
      const plosData = plosRes.data.data;
      const programsData = programsRes.data.data;
      setPLOs(plosData?.items || plosData || []);
      setPrograms(programsData?.items || programsData || []);
    } catch (error) {
      toast.error('Failed to load data');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPLOs = async () => {
    try {
      const response = await ploService.getAll();
      const data = response.data.data;
      setPLOs(data?.items || data || []);
    } catch (error) {
      toast.error('Failed to load PLOs');
      console.error('Error fetching PLOs:', error);
    }
  };

  const openModal = (plo = null) => {
    if (plo) {
      setEditingPLO(plo);
      setValues({
        program: plo.program?._id || plo.program,
        code: plo.code,
        description: plo.description,
        domain: plo.domain || 'cognitive',
      });
    } else {
      setEditingPLO(null);
      reset();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPLO(null);
    reset();plo) => {
    if (window.confirm('Are you sure you want to delete this PLO?')) {
      try {
        await ploService.delete(plo.programId, plo._id);
        toast.success('PLO deleted successfully');
        fetchPLOs();
      } catch (error) {
        toast.error('Failed to delete PLO');
        console.error('Delete PLO error:', errorfully');
        fetchPLOs();
      } catch (error) {
        toast.error('Failed to delete PLO');
      }
    }
  };

  const getProgramName = (programId) => {
    const program = programs.find(p => p._id === programId);
    return program ? program.name : 'Unknown';
  };

  const domains = [
    { value: 'cognitive', label: 'Cognitive' },
    { value: 'affective', label: 'Affective' },
    { value: 'psychomotor', label: 'Psychomotor' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Program Learning Outcomes (PLOs)</h1>
            <p className="text-gray-600 mt-2">Define learning outcomes for programs</p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create PLO
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {plos.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No PLOs found. Create your first PLO!</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Domain</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {plos.map((plo) => (
                    <tr key={plo._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{plo.code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {plo.program?.name || getProgramName(plo.program)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{plo.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          plo.domain === 'cognitive' ? 'bg-blue-100 text-blue-800' :
                          plo.domain === 'affective' ? 'bg-purple-100 text-purple-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {plo.domain}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openModal(plo)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(plo)}
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
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingPLO ? 'Edit PLO' : 'Create PLO'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Program *</label>
                  <select
                    name="program"
                    value={values.program}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a program</option>
                    {programs.map((program) => (
                      <option key={program._id} value={program._id}>
                        {program.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PLO Code *</label>
                  <input
                    type="text"
                    name="code"
                    value={values.code}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="PLO1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Domain *</label>
                  <select
                    name="domain"
                    value={values.domain}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {domains.map((domain) => (
                      <option key={domain.value} value={domain.value}>
                        {domain.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    name="description"
                    value={values.description}
                    onChange={handleChange}
                    required
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter PLO description..."
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
                    {editingPLO ? 'Update' : 'Create'}
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

export default PLOsPage;
