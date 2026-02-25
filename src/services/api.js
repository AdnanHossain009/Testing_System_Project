import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Don't show toast for auth endpoints - they handle errors themselves
    const isAuthEndpoint = error.config?.url?.includes('/auth/');
    
    if (error.response) {
      const { status, data } = error.response;
      
      // Handle unauthorized access
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        if (!isAuthEndpoint) {
          toast.error('Session expired. Please login again.');
        }
      } else if (status === 403) {
        if (!isAuthEndpoint) toast.error('Access denied. Insufficient permissions.');
      } else if (status === 404) {
        if (!isAuthEndpoint) toast.error('Resource not found.');
      } else if (status === 500) {
        if (!isAuthEndpoint) toast.error('Server error. Please try again later.');
      } else {
        if (!isAuthEndpoint) toast.error(data.message || 'An error occurred.');
      }
    } else if (error.request) {
      // Network error - backend not available (Demo Mode)
      if (!isAuthEndpoint) {
        console.warn('Backend not available - using demo mode where applicable');
      }
    } else {
      if (!isAuthEndpoint) toast.error('An unexpected error occurred.');
    }
    
    return Promise.reject(error);
  }
);

export default api;
