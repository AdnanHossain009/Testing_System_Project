# 🚀 Quick Start Guide

## Installation in 5 Minutes

### Step 1: Install Dependencies
Open a terminal in the project folder and run:
```bash
npm install
```

### Step 2: Configure Environment
```bash
# Windows
copy .env.example .env

# Mac/Linux
cp .env.example .env
```

### Step 3: Start the Application
```bash
npm run dev
```

The app will open at: **http://localhost:3000**

---

## 🎯 Test the Application

### Login with Demo Accounts

#### As Admin
```
Email:    admin@university.edu
Password: admin123
```
**You can:**
- Create Programs
- Create Courses
- Define PLOs
- View System Stats

#### As Faculty
```
Email:    faculty@university.edu
Password: faculty123
```
**You can:**
- Create Assessments
- Enter Marks
- View CLO Analytics
- Track Student Performance

#### As Student
```
Email:    student@university.edu
Password: student123
```
**You can:**
- View CLO Achievement (Bar Chart)
- View PLO Achievement (Radar Chart)
- Track Performance Trends (Line Chart)
- Check Assessment Details

---

## 📁 What's Included

### ✅ Complete Frontend Application
- 23 React Components
- 3 Role-Based Dashboards
- Authentication System
- Protected Routes
- Interactive Charts

### ✅ Three User Dashboards
1. **Admin Dashboard**
   - Program Management
   - Course Management
   - PLO Definition

2. **Faculty Dashboard**
   - Assessment Creation
   - Marks Entry
   - CLO Analytics

3. **Student Dashboard**
   - Performance Tracking
   - CLO/PLO Charts
   - Trend Analysis

### ✅ Data Visualization
- Bar Charts (Recharts)
- Radar Charts (Recharts)
- Line Charts (Recharts)
- Statistics Cards

### ✅ Modern Tech Stack
- React 18
- React Router DOM v6
- Axios for API
- Context API
- Tailwind CSS
- Vite Build Tool

---

## 🎨 Key Features

### 🔐 Authentication
- JWT Token-based
- Role-based Access Control
- Protected Routes
- Auto-redirect by Role

### 📊 Analytics & Charts
- Real-time Data Visualization
- Interactive Charts
- Performance Metrics
- Trend Analysis

### 📱 Responsive Design
- Mobile-Friendly
- Tablet Optimized
- Desktop Enhanced
- Touch-Friendly Controls

### 🎯 User Experience
- Clean Modern UI
- Intuitive Navigation
- Loading States
- Error Handling
- Toast Notifications

---

## 📚 Documentation Files

1. **README.md** - Project overview and quick start
2. **SETUP.md** - Detailed setup instructions
3. **FEATURES.md** - Complete feature list
4. **API_INTEGRATION.md** - API endpoint documentation
5. **DEVELOPMENT_GUIDE.md** - Developer guidelines
6. **PROJECT_OVERVIEW.md** - Comprehensive project summary

---

## 🛠️ Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🌐 API Configuration

Default API URL: `http://localhost:5000/api`

To change the API URL:
1. Open `src/services/api.js`
2. Update the `baseURL` property
3. Save and restart dev server

---

## 📦 Project Structure

```
System_3_2/
├── src/
│   ├── components/      # Reusable components
│   ├── context/         # State management
│   ├── hooks/           # Custom hooks
│   ├── layouts/         # Page layouts
│   ├── pages/           # Route pages
│   │   ├── admin/       # Admin pages
│   │   ├── faculty/     # Faculty pages
│   │   └── student/     # Student pages
│   ├── services/        # API services
│   └── utils/           # Helper functions
├── Documentation Files
└── Configuration Files
```

---

## ✨ What Makes This Special

### ✅ Production Ready
- Clean, maintainable code
- Error boundaries
- Loading states
- Proper error handling

### ✅ Well Documented
- Inline comments
- Comprehensive docs
- API references
- Setup guides

### ✅ Best Practices
- Functional components
- Custom hooks
- Context API
- Modular architecture

### ✅ Modern Stack
- React 18
- Vite (fast builds)
- Tailwind CSS
- Latest libraries

---

## 🎓 Learning Resources

Each file is well-commented with:
- Purpose explanation
- Usage examples
- Best practices
- Common patterns

Perfect for learning:
- React development
- State management
- API integration
- Data visualization

---

## 🚨 Troubleshooting

### Port Already in Use
Edit `vite.config.js` and change the port:
```javascript
server: {
  port: 3001, // Change this
}
```

### Dependencies Not Installing
```bash
# Clear cache and retry
npm cache clean --force
npm install
```

### Application Won't Start
1. Check Node.js version (need v16+)
2. Delete `node_modules` folder
3. Run `npm install` again
4. Run `npm run dev`

---

## 💡 Tips

1. **Use the Documentation** - All features are documented in detail
2. **Check Console** - Browser console shows helpful errors
3. **Test Different Roles** - Login as Admin, Faculty, and Student
4. **Explore Charts** - All dashboards have interactive charts
5. **Responsive Design** - Try on mobile, tablet, and desktop

---

## 🎉 You're All Set!

The complete OBE Assessment System frontend is ready to use.

### Next Steps:
1. ✅ Start the dev server: `npm run dev`
2. ✅ Login with demo credentials
3. ✅ Explore different dashboards
4. ✅ Test all features
5. ✅ Read the documentation
6. ✅ Build your own features

---

## 📞 Need Help?

1. Check **SETUP.md** for detailed instructions
2. Review **FEATURES.md** for feature details
3. See **API_INTEGRATION.md** for API info
4. Read **DEVELOPMENT_GUIDE.md** for coding help

---

**Happy Coding! 🚀**

---

*Version: 1.0.0*  
*Last Updated: February 2026*  
*Status: Production Ready ✅*
