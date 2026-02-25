export const calculateCLOAchievement = (marks, maxMarks) => {
  if (!maxMarks || maxMarks === 0) return 0;
  const percentage = (marks / maxMarks) * 100;
  return Math.round(percentage * 100) / 100;
};

export const calculatePLOAchievement = (cloAchievements) => {
  if (!cloAchievements || cloAchievements.length === 0) return 0;
  const sum = cloAchievements.reduce((acc, curr) => acc + curr, 0);
  return Math.round((sum / cloAchievements.length) * 100) / 100;
};

export const getPerformanceLevel = (percentage) => {
  if (percentage >= 80) return { level: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' };
  if (percentage >= 70) return { level: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' };
  if (percentage >= 60) return { level: 'Satisfactory', color: 'text-yellow-600', bg: 'bg-yellow-100' };
  if (percentage >= 50) return { level: 'Needs Improvement', color: 'text-orange-600', bg: 'bg-orange-100' };
  return { level: 'Poor', color: 'text-red-600', bg: 'bg-red-100' };
};

export const calculateGrade = (percentage) => {
  if (percentage >= 85) return 'A';
  if (percentage >= 80) return 'A-';
  if (percentage >= 75) return 'B+';
  if (percentage >= 70) return 'B';
  if (percentage >= 65) return 'B-';
  if (percentage >= 60) return 'C+';
  if (percentage >= 55) return 'C';
  if (percentage >= 50) return 'C-';
  if (percentage >= 45) return 'D';
  return 'F';
};

export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

export const formatDateTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const generateRandomColor = () => {
  const colors = [
    '#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', 
    '#10b981', '#ef4444', '#6366f1', '#14b8a6'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
