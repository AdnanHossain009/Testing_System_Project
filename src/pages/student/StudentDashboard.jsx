import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { analyticsService } from '../../services';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { mockStudentStats, mockCLOAnalytics, mockPLOAnalytics, mockPerformanceTrend } from '../../utils/mockData';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    courses: 0,
    cloAchievement: 0,
    ploAchievement: 0,
  });
  const [cloData, setCLOData] = useState([]);
  const [ploData, setPLOData] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await analyticsService.getStudentDashboard();
      const data = response.data.data;
      setStats({
        courses: data.enrolledCourses || 0,
        cloAchievement: data.avgCLOAchievement || 0,
        ploAchievement: data.avgPLOAchievement || 0,
      });
      
      // Fetch student performance
      if (user?._id) {
        const perfResponse = await analyticsService.getStudentPerformance(user._id);
        const perfData = perfResponse.data.data;
        setCLOData(perfData.cloData || []);
        setPLOData(perfData.ploData || []);
        setPerformanceData(perfData.performanceData || []);
      }
      setDemoMode(false);
    } catch (error) {
      // Use mock data in demo mode
      console.warn('Using demo mode data:', error.message);
      setStats({
        courses: mockStudentStats.enrolledCourses,
        cloAchievement: mockStudentStats.avgCLOAchievement,
        ploAchievement: mockStudentStats.avgPLOAchievement,
      });
      setCLOData(mockCLOAnalytics);
      setPLOData(mockPLOAnalytics);
      setPerformanceData(mockPerformanceTrend);
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
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600 mt-2">Track your learning outcomes and performance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Enrolled Courses</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.courses}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg CLO Achievement</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.cloAchievement}%</p>
              </div>
              <div className="bg-green-500 p-3 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg PLO Achievement</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.ploAchievement}%</p>
              </div>
              <div className="bg-purple-500 p-3 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">CLO Achievement</h2>
            {cloData.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No CLO data available yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cloData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="clo" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="achievement" fill="#0ea5e9" name="Achievement %" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">PLO Achievement Radar</h2>
            {ploData.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No PLO data available yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={ploData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="plo" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar name="Achievement" dataKey="achievement" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Performance Trend</h2>
          {performanceData.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No performance trend data available yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="assessment" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="marks" stroke="#0ea5e9" strokeWidth={2} name="Marks %" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a href="/student/courses" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">View Courses</h3>
                  <p className="text-sm text-gray-600">Check your enrolled courses</p>
                </div>
              </div>
            </a>
            <a href="/student/performance" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <div className="bg-green-100 p-2 rounded-lg mr-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">View Performance</h3>
                  <p className="text-sm text-gray-600">Check detailed performance analytics</p>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
