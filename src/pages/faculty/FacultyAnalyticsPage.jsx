import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { analyticsService, courseService } from '../../services';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { mockCourses, mockCLOAnalytics } from '../../utils/mockData';

const FacultyAnalyticsPage = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [cloData, setCLOData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchAnalytics();
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      const response = await courseService.getAll();
      const data = response.data.data;
      const courseList = data.items || data || [];
      setCourses(courseList);
      if (courseList.length > 0) {
        setSelectedCourse(courseList[0]._id);
      }
      setDemoMode(false);
    } catch (error) {
      // Use mock data in demo mode
      console.warn('Using demo mode data:', error.message);
      setCourses(mockCourses);
      if (mockCourses.length > 0) {
        setSelectedCourse(mockCourses[0].id);
      }
      setDemoMode(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await analyticsService.getCLOStatistics(selectedCourse);
      setCLOData(response.data.data || []);
    } catch (error) {
      // Use mock data in demo mode
      setCLOData(mockCLOAnalytics);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {demoMode && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-orange-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-orange-800">Demo Mode Active</p>
                <p className="text-xs text-orange-700">Displaying sample data. Connect backend at http://localhost:5001/api for live data.</p>
              </div>
            </div>
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CLO Analytics</h1>
          <p className="text-gray-600 mt-2">View Course Learning Outcome achievements</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Course</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>

        {cloData.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">No analytics data available for this course yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">CLO Achievement</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={cloData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="clo" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="achievement" fill="#0ea5e9" name="Achievement %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {cloData.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CLO</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Achievement</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cloData.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.clo}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.description || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.achievement}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.achievement >= 80 ? 'bg-green-100 text-green-800' :
                        item.achievement >= 70 ? 'bg-blue-100 text-blue-800' :
                        item.achievement >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.achievement >= 80 ? 'Excellent' :
                         item.achievement >= 70 ? 'Good' :
                         item.achievement >= 60 ? 'Satisfactory' : 'Needs Improvement'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FacultyAnalyticsPage;
