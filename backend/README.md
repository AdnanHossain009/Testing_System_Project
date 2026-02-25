# OBE Assessment System - Backend API

Complete production-ready backend system for the Adaptive Outcome-Based Education Assessment System.

## 🚀 Features

- **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (Admin, Faculty, Student)
  - Secure password hashing with bcrypt
  - Token-based session management

- **Database Models**
  - User management with role differentiation
  - Program and Course hierarchies
  - PLOs and CLOs with mapping
  - Assessments with flexible types
  - Marks/grades management
  - Outcome results tracking

- **Business Logic**
  - Weighted score calculations
  - CLO attainment percentage
  - PLO aggregation from CLOs
  - Performance level classification
  - Grade calculation with GPA
  - Risk score calculation
  - Student performance analytics

- **Analytics Engine**
  - Dashboard statistics (Admin, Faculty, Student)
  - CLO/PLO attainment tracking
  - At-risk student detection
  - Performance trend analysis
  - Recommendation generation

- **Security**
  - Helmet.js for HTTP headers
  - CORS configuration
  - Rate limiting
  - Input validation
  - Error handling

## 📋 Prerequisites

- Node.js >= 16.0.0
- MongoDB (local or Atlas)
- npm or yarn

## 🔧 Installation

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup environment variables:**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` file with your configuration:**
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/obe_assessment
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   JWT_EXPIRE=7d
   CLIENT_URL=http://localhost:3000
   ```

## 🚀 Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

Server will be available at: `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@university.edu",
  "password": "password123",
  "role": "student",
  "department": "Computer Science",
  "studentId": "STD001"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@university.edu",
  "password": "password123"
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### Program Endpoints

#### Get All Programs
```http
GET /api/programs
Authorization: Bearer <token>
```

#### Create Program (Admin only)
```http
POST /api/programs
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "BSCS",
  "name": "Bachelor of Science in Computer Science",
  "duration": 4,
  "description": "4-year undergraduate program"
}
```

### Course Endpoints

#### Get All Courses
```http
GET /api/courses
Authorization: Bearer <token>
```

#### Create Course (Admin/Faculty)
```http
POST /api/courses
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "CS101",
  "name": "Introduction to Programming",
  "program": "program_id_here",
  "creditHours": 3,
  "semester": "1st"
}
```

### Assessment Endpoints

#### Get All Assessments
```http
GET /api/assessments?course=course_id
Authorization: Bearer <token>
```

#### Create Assessment (Faculty only)
```http
POST /api/assessments
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Midterm Exam",
  "course": "course_id_here",
  "type": "midterm",
  "totalMarks": 50,
  "weightage": 30,
  "cloMapping": [
    {
      "clo": "clo_id_here",
      "weight": 100
    }
  ],
  "date": "2026-03-15"
}
```

### Marks Endpoints

#### Submit Marks (Faculty only)
```http
POST /api/marks
Authorization: Bearer <token>
Content-Type: application/json

{
  "student": "student_id_here",
  "assessment": "assessment_id_here",
  "obtainedMarks": 42
}
```

#### Get Student Marks
```http
GET /api/marks/student/:studentId
Authorization: Bearer <token>
```

### Analytics Endpoints

#### Get Admin Dashboard
```http
GET /api/analytics/admin/dashboard
Authorization: Bearer <token>
```

#### Get Faculty Dashboard
```http
GET /api/analytics/faculty/dashboard
Authorization: Bearer <token>
```

#### Get Student Dashboard
```http
GET /api/analytics/student/dashboard
Authorization: Bearer <token>
```

#### Calculate Outcome Result
```http
POST /api/analytics/outcomes/calculate
Authorization: Bearer <token>
Content-Type: application/json

{
  "studentId": "student_id_here",
  "courseId": "course_id_here",
  "semester": "Fall 2026"
}
```

#### Get CLO Statistics
```http
GET /api/analytics/clo/:courseId
Authorization: Bearer <token>
```

#### Get Students At Risk
```http
GET /api/analytics/at-risk?courseId=course_id
Authorization: Bearer <token>
```

## 🗂️ Project Structure

```
backend/
├── config/
│   ├── database.js          # MongoDB connection
│   └── constants.js         # App constants
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── programController.js # Program CRUD
│   ├── courseController.js  # Course CRUD
│   ├── assessmentController.js
│   ├── marksController.js
│   └── analyticsController.js
├── middleware/
│   ├── auth.js              # JWT verification & authorization
│   ├── errorHandler.js      # Global error handling
│   └── validation.js        # Input validation
├── models/
│   ├── User.js              # User schema
│   ├── Program.js           # Program schema with PLOs
│   ├── Course.js            # Course schema with CLOs
│   ├── Assessment.js        # Assessment schema
│   ├── Marks.js             # Marks schema
│   └── OutcomeResult.js     # Outcome results schema
├── routes/
│   ├── authRoutes.js
│   ├── programRoutes.js
│   ├── courseRoutes.js
│   ├── assessmentRoutes.js
│   ├── marksRoutes.js
│   ├── analyticsRoutes.js
│   └── index.js             # Route aggregator
├── services/
│   ├── outcomeService.js    # Outcome calculations
│   └── dashboardService.js  # Dashboard data
├── utils/
│   ├── jwtUtils.js          # JWT helper functions
│   ├── calculationUtils.js  # Business logic calculations
│   └── responseUtils.js     # Response formatters
├── .env.example
├── .gitignore
├── package.json
└── server.js                # Entry point
```

## 🔐 User Roles & Permissions

### Admin
- Full access to all resources
- Manage programs, courses, PLOs
- View all analytics
- Manage users

### Faculty
- Create and manage assessments
- Submit and update marks
- View course analytics
- Access CLO statistics
- Identify at-risk students

### Student
- View own performance
- Access personal dashboard
- View grades and outcomes
- Track CLO/PLO achievements

## 📊 Business Logic

### Performance Levels
- **Excellent:** ≥ 80%
- **Good:** 60-79%
- **Average:** 40-59%
- **Poor:** < 40%

### Grade System
```
A+: 90-100 (GPA 4.0)
A:  85-89  (GPA 3.7)
A-: 80-84  (GPA 3.3)
B+: 75-79  (GPA 3.0)
B:  70-74  (GPA 2.7)
B-: 65-69  (GPA 2.3)
C+: 60-64  (GPA 2.0)
C:  55-59  (GPA 1.7)
C-: 50-54  (GPA 1.3)
D:  40-49  (GPA 1.0)
F:  0-39   (GPA 0.0)
```

### Attainment Thresholds
- **CLO Attainment:** ≥ 60%
- **PLO Attainment:** ≥ 60%

### Risk Calculation
Risk score (0-100) based on:
- Overall performance (40% weight)
- CLO attainment rate (40% weight)
- Attendance (20% weight)

Students with risk score ≥ 50 are flagged as "at risk"

## 🛡️ Security Features

- Password hashing using bcrypt (10 rounds)
- JWT token expiration (configurable)
- Role-based access control
- Rate limiting (100 requests per 15 minutes)
- Helmet.js security headers
- CORS protection
- Input validation
- MongoDB injection protection

## 🚨 Error Handling

All errors return consistent JSON format:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Optional validation errors
}
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | development |
| `PORT` | Server port | 5000 |
| `MONGODB_URI` | MongoDB connection string | - |
| `JWT_SECRET` | Secret for JWT signing | - |
| `JWT_EXPIRE` | Token expiration time | 7d |
| `CLIENT_URL` | Frontend URL for CORS | http://localhost:3000 |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 900000 (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |

## 🧪 Testing

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Test Authentication
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"test123","role":"student"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

## 🔄 Database Seeding

Create seed data for testing (optional):

```javascript
// Create admin user
POST /api/auth/register
{
  "name": "Admin User",
  "email": "admin@university.edu",
  "password": "admin123",
  "role": "admin"
}

// Create program
POST /api/programs
{
  "code": "BSCS",
  "name": "Bachelor of Science in Computer Science",
  "duration": 4
}
```

## 📈 Monitoring

Server logs include:
- Database connection status
- Request details
- Error stack traces (development only)
- Performance metrics

## 🤝 Contributing

1. Follow the existing code structure
2. Use async/await for asynchronous operations
3. Add proper error handling
4. Validate all inputs
5. Document new endpoints

## 📄 License

MIT License

## 🆘 Support

For issues and questions:
- Check error logs in console
- Verify environment variables
- Ensure MongoDB is running
- Check network/firewall settings

---

**Built with Node.js, Express, MongoDB & JWT** 🚀
