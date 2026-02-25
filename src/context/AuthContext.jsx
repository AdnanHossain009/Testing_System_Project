import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      // Backend returns data in response.data.data format
      const { token, user: userData } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      // Navigate based on role
      if (userData.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (userData.role === 'faculty') {
        navigate('/faculty/dashboard');
      } else if (userData.role === 'student') {
        navigate('/student/dashboard');
      }
      
      return { success: true };
    } catch (error) {
      // DEMO MODE: Use mock authentication when backend is unavailable
      if (!error.response) {
        // Network error - backend not running
        const mockUsers = {
          'admin@university.edu': {
            id: 1,
            name: 'Admin User',
            email: 'admin@university.edu',
            role: 'admin',
            password: 'admin123'
          },
          'faculty@university.edu': {
            id: 2,
            name: 'Faculty Member',
            email: 'faculty@university.edu',
            role: 'faculty',
            password: 'faculty123',
            department: 'Computer Science'
          },
          'student@university.edu': {
            id: 3,
            name: 'Student User',
            email: 'student@university.edu',
            role: 'student',
            password: 'student123',
            studentId: 'STD001',
            department: 'Computer Science'
          }
        };

        const mockUser = mockUsers[email];
        
        if (mockUser && mockUser.password === password) {
          const { password: _, ...userData } = mockUser;
          const mockToken = 'demo-token-' + btoa(email);
          
          localStorage.setItem('token', mockToken);
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
          
          // Navigate based on role
          if (userData.role === 'admin') {
            navigate('/admin/dashboard');
          } else if (userData.role === 'faculty') {
            navigate('/faculty/dashboard');
          } else if (userData.role === 'student') {
            navigate('/student/dashboard');
          }
          
          return { success: true };
        }
        
        return { 
          success: false, 
          error: 'Invalid credentials (Demo Mode - Backend not running)' 
        };
      }
      
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { token, user: newUser } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      
      // Navigate based on role
      if (newUser.role === 'student') {
        navigate('/student/dashboard');
      }
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
