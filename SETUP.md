# Setup Guide

## Prerequisites
- Node.js v16 or higher
- npm or yarn package manager

## Installation Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Copy the example environment file and configure:
```bash
copy .env.example .env
```

Edit `.env` and update the API base URL if needed.

### 3. Start Development Server
```bash
npm run dev
```

The application will start at `http://localhost:3000`

### 4. Build for Production
```bash
npm run build
```

The build output will be in the `dist` folder.

## Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── ErrorBoundary.jsx
│   ├── Loading.jsx
│   └── PrivateRoute.jsx
├── context/           # React Context providers
│   ├── AuthContext.jsx
│   └── GlobalContext.jsx
├── hooks/             # Custom React hooks
│   ├── useFetch.js
│   └── useForm.js
├── layouts/           # Layout components
│   ├── DashboardLayout.jsx
│   ├── Navbar.jsx
│   └── Sidebar.jsx
├── pages/             # Page components
│   ├── admin/
│   │   ├── AdminDashboard.jsx
│   │   ├── CoursesPage.jsx
│   │   ├── PLOsPage.jsx
│   │   └── ProgramsPage.jsx
│   ├── faculty/
│   │   ├── AssessmentsPage.jsx
│   │   ├── FacultyAnalyticsPage.jsx
│   │   └── FacultyDashboard.jsx
│   ├── student/
│   │   ├── PerformancePage.jsx
│   │   └── StudentDashboard.jsx
│   ├── Login.jsx
│   ├── NotFound.jsx
│   ├── Register.jsx
│   └── Unauthorized.jsx
├── services/          # API service functions
│   ├── api.js
│   └── index.js
└── utils/             # Utility functions
    ├── constants.js
    └── helpers.js
```

## Features

### Admin Dashboard
- Create and manage academic programs
- Create and manage courses
- Define Program Learning Outcomes (PLOs)
- View system statistics

### Faculty Dashboard
- Create and manage assessments
- Enter and update student marks
- View CLO analytics with charts
- Track student performance

### Student Dashboard
- View enrolled courses
- Check CLO achievement (Bar Chart)
- View PLO achievement (Radar Chart)
- Track performance trends (Line Chart)
- View detailed assessment results

## Default Test Users

### Admin
- Email: admin@university.edu
- Password: admin123

### Faculty
- Email: faculty@university.edu
- Password: faculty123

### Student
- Email: student@university.edu
- Password: student123

## Technologies Used

- **React 18** - UI framework
- **React Router DOM v6** - Client-side routing
- **Axios** - HTTP client
- **Context API** - State management
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **React Toastify** - Notifications
- **Vite** - Build tool

## API Integration

The frontend expects a REST API at `http://localhost:5000/api` by default.

Key endpoints:
- `/auth/*` - Authentication
- `/programs/*` - Programs management
- `/courses/*` - Courses management
- `/plos/*` - PLOs management
- `/clos/*` - CLOs management
- `/assessments/*` - Assessments management
- `/marks/*` - Marks management
- `/analytics/*` - Analytics data

## Customization

### Updating API Base URL
Edit `src/services/api.js`:
```javascript
baseURL: 'http://your-api-url/api'
```

### Changing Theme Colors
Edit `tailwind.config.js` to customize the color palette.

### Adding New Routes
1. Create page component in appropriate folder
2. Add route in `src/App.jsx`
3. Add navigation link in `src/layouts/Sidebar.jsx`

## Troubleshooting

### Port Already in Use
Change the port in `vite.config.js`:
```javascript
server: {
  port: 3001, // Change to desired port
}
```

### API Connection Issues
1. Verify backend is running
2. Check API base URL in `.env`
3. Check CORS configuration on backend

## Support

For issues or questions, please refer to the project documentation or contact the development team.
