# 🎭 Demo Mode Guide

## Overview

The application now includes a **built-in Demo Mode** that allows you to explore and test all features **without requiring a backend server**. This is perfect for:
- Frontend development and testing
- UI/UX demonstrations
- Quick prototyping
- Learning the system

---

## ✨ Features

### Automatic Detection
- Demo mode activates automatically when backend is unavailable
- No configuration needed
- Seamless fallback to mock data

### Full Feature Coverage
Demo mode provides realistic sample data for:
- ✅ **Authentication** - Login with demo credentials
- ✅ **Admin Dashboard** - View stats, programs, courses, PLOs
- ✅ **Faculty Dashboard** - View courses, assessments, analytics
- ✅ **Student Dashboard** - View performance, charts, grades
- ✅ **Analytics Pages** - CLO/PLO charts with sample data

---

## 🔑 Demo Credentials

Use these credentials to log in when in demo mode:

### Admin
```
Email: admin@university.edu
Password: admin123
```

### Faculty
```
Email: faculty@university.edu
Password: faculty123
```

### Student
```
Email: student@university.edu
Password: student123
```

---

## 📊 Sample Data Included

### Statistics
- **Admin:** 3 programs, 12 courses, 15 PLOs, 245 students
- **Faculty:** 3 courses, 8 assessments, 85 students
- **Student:** 5 courses, 78.5% CLO avg, 75.2% PLO avg

### Charts & Analytics
- **CLO Achievement Chart** - 5 CLOs with varying achievement levels
- **PLO Radar Chart** - 6 PLOs with performance data
- **Performance Trend** - 6-month performance history
- **Assessment Details** - Sample assessment records

### Management Data
- Programs (BSCS, BSSE, MSCS)
- Courses (CS101, CS201, CS301, SE201, etc.)
- PLOs (Cognitive, Affective, Psychomotor domains)
- Assessments (Midterms, Finals, Assignments)

---

## 🎯 How It Works

### 1. Login Process
```javascript
// AuthContext automatically detects backend unavailability
try {
  // Try real authentication
  await api.post('/auth/login', credentials)
} catch (error) {
  // Fallback to mock authentication
  if (!error.response) {
    // Use demo credentials
  }
}
```

### 2. Data Fetching
```javascript
// Each dashboard page tries real API first
try {
  const response = await service.getData()
  setData(response.data)
} catch (error) {
  // Fallback to mock data
  setData(mockData)
  setDemoMode(true)
}
```

### 3. Visual Indicators
When demo mode is active, you'll see an orange banner:

```
ℹ️ Demo Mode Active
Displaying sample data. Connect backend at http://localhost:5000/api for live data.
```

---

## 🚀 Using Demo Mode

### Quick Start (No Backend)
1. Install dependencies:
   ```bash
   npm install
   ```

2. Start dev server:
   ```bash
   npm run dev
   ```

3. Open browser at `http://localhost:3000`

4. Login with demo credentials (see above)

5. Explore all features with sample data

### Switching to Real Backend
1. Start your backend server at `http://localhost:5000`

2. Refresh the application

3. Demo mode will automatically deactivate

4. Real data will be fetched from backend

---

## 📁 Mock Data Location

All mock data is centralized in:
```
src/utils/mockData.js
```

### Available Mock Data Sets:
- `mockPrograms` - Academic programs
- `mockCourses` - Course catalog
- `mockPLOs` - Program Learning Outcomes
- `mockCLOs` - Course Learning Outcomes
- `mockAssessments` - Assessment records
- `mockStudents` - Student profiles
- `mockAdminStats` - Admin dashboard stats
- `mockFacultyStats` - Faculty dashboard stats
- `mockStudentStats` - Student dashboard stats
- `mockCLOAnalytics` - CLO achievement data
- `mockPLOAnalytics` - PLO achievement data
- `mockPerformanceTrend` - Performance history
- `mockStudentPerformance` - Detailed student performance

---

## 🎨 Customizing Mock Data

### Adding New Mock Data
Edit `src/utils/mockData.js`:

```javascript
export const mockYourData = [
  {
    id: 1,
    field: 'value',
    // ... your mock data
  }
];
```

### Using in Components
```javascript
import { mockYourData } from '../../utils/mockData';

const fetchData = async () => {
  try {
    const response = await api.getData();
    setData(response.data);
  } catch (error) {
    // Use mock data
    setData(mockYourData);
    setDemoMode(true);
  }
};
```

---

## 🛠️ Technical Details

### Modified Files
The following pages now support demo mode:

#### Authentication
- `src/context/AuthContext.jsx` - Mock login/register
- `src/pages/Login.jsx` - Demo mode indicator

#### Admin Pages
- `src/pages/admin/AdminDashboard.jsx`

#### Faculty Pages
- `src/pages/faculty/FacultyDashboard.jsx`
- `src/pages/faculty/FacultyAnalyticsPage.jsx`

#### Student Pages
- `src/pages/student/StudentDashboard.jsx`
- `src/pages/student/PerformancePage.jsx`

#### Services
- `src/services/api.js` - Silent errors for auth endpoints

### Error Handling
- API errors are caught silently during auth
- Console warnings instead of error toasts
- Graceful fallback to mock data
- User-friendly demo mode banners

---

## 🔄 Transition to Production

### Before Deployment:
1. **Optional:** Remove or disable demo mode logic
2. **Required:** Ensure backend is running and accessible
3. **Required:** Update API base URL if different from localhost
4. **Optional:** Remove mock data file to reduce bundle size

### Keeping Demo Mode:
Demo mode can safely remain in production as:
- It only activates when backend is unavailable
- It's helpful for demonstrations
- It provides graceful degradation
- No security risks (read-only mock data)

---

## ⚠️ Limitations

### Demo Mode Cannot:
- ❌ Create, update, or delete real data
- ❌ Persist changes across sessions
- ❌ Send emails or notifications
- ❌ Generate real reports
- ❌ Process file uploads

### Demo Mode Can:
- ✅ Display all UI components
- ✅ Show charts and analytics
- ✅ Navigate between pages
- ✅ Test form validations
- ✅ Preview user workflows

---

## 🎓 Use Cases

### For Developers
- Frontend development without backend
- UI component testing
- Layout adjustments
- Responsive design testing

### For Designers
- UX/UI review
- Flow demonstrations
- Prototype presentations
- Client previews

### For Testers
- Frontend QA without backend setup
- Visual regression testing
- Accessibility testing
- Cross-browser testing

### For Stakeholders
- Feature demonstrations
- Progress reviews
- Training sessions
- User acceptance testing

---

## 📝 Notes

- Demo mode is **automatically detected** - no manual configuration needed
- All demo credentials work only in demo mode
- Real backend will override demo mode when available
- Mock data is realistic and follows the same structure as real data
- Demo mode indicator is shown on all affected pages

---

## 🔗 Related Documentation

- [QUICK_START.md](./QUICK_START.md) - Getting started guide
- [API_INTEGRATION.md](./API_INTEGRATION.md) - Backend integration
- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) - Development guidelines

---

**Demo Mode Status:** ✅ Active and Ready!

Test the entire application without any backend setup!
