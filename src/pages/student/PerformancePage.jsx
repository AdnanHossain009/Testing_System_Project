import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { analyticsService } from '../../services';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { getPerformanceLevel, calculateGrade } from '../../utils/helpers';
import { mockStudentPerformance } from '../../utils/mockData';

const PerformancePage = () => {
  const { user } = useAuth();
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    try {
      if (user?._id) {
        const response = await analyticsService.getStudentPerformance(user._id);
        const data = response.data.data;
        setPerformanceData(data);
        setDemoMode(false);
      }
    } catch (error) {
      // Use mock data in demo mode
      console.warn('Using demo mode data:', error.message);
      setPerformanceData({
        overallPercentage: mockStudentPerformance.percentage,
        cloData: mockStudentPerformance.cloAnalytics,
        ploData: mockStudentPerformance.ploAnalytics,
        performanceData: mockStudentPerformance.performanceTrend,
        assessments: mockStudentPerformance.assessments
      });
      setDemoMode(true);
    } finally {
      setLoading(false);
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

  if (!performanceData) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">No performance data available yet.</p>
        </div>
      </DashboardLayout>
    );
  }

  const overallPercentage = performanceData.overallPercentage || 0;
  const performanceLevel = getPerformanceLevel(overallPercentage);
  const grade = calculateGrade(overallPercentage);

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
          <h1 className="text-3xl font-bold text-gray-900">My Performance</h1>
          <p className="text-gray-600 mt-2">Detailed view of your academic performance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Overall Percentage</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{overallPercentage}%</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Grade</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{grade}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Performance Level</p>
            <span className={`inline-flex mt-2 px-3 py-1 rounded-full text-sm font-medium ${performanceLevel.bg} ${performanceLevel.color}`}>
              {performanceLevel.level}
            </span>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-600">Total Assessments</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{performanceData.performanceData?.length || 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">CLO Achievement</h2>
            {!performanceData.cloData || performanceData.cloData.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No CLO data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={performanceData.cloData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="clo" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="achievement" fill="#0ea5e9" name="Achievement %" />
                  <Bar dataKey="target" fill="#94a3b8" name="Target %" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">PLO Achievement</h2>
            {!performanceData.ploData || performanceData.ploData.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No PLO data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={performanceData.ploData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="plo" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar name="Achievement" dataKey="achievement" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                  <Tooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Performance Trend</h2>
          {!performanceData.performanceData || performanceData.performanceData.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No trend data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={performanceData.performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="assessment" angle={-45} textAnchor="end" height={100} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="marks" stroke="#0ea5e9" strokeWidth={2} name="Marks %" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Assessment Details</h2>
          </div>
          {!performanceData.assessmentDetails || performanceData.assessmentDetails.length === 0 ? (
            <p className="text-gray-500 text-center py-12">No assessments found</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assessment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {performanceData.assessmentDetails.map((item, index) => {
                  const percentage = (item.marks / item.maxMarks) * 100;
                  const level = getPerformanceLevel(percentage);
                  return (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.assessment}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.course}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.marks}/{item.maxMarks}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{percentage.toFixed(1)}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${level.bg} ${level.color}`}>
                          {level.level}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PerformancePage;
