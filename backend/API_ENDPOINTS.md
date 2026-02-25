# API Endpoints Reference

Complete list of all available API endpoints.

## Base URL
```
http://localhost:5000/api
```

---

## 🔐 Authentication

### Register User
**POST** `/auth/register`

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@university.edu",
  "password": "password123",
  "role": "student",
  "department": "Computer Science",
  "studentId": "STD001",
  "semester": 3
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": { /* user object */ },
    "token": "jwt_token_here"
  }
}
```

### Login
**POST** `/auth/login`

**Body:**
```json
{
  "email": "john@university.edu",
  "password": "password123"
}
```

### Get Profile
**GET** `/auth/profile`

**Headers:** `Authorization: Bearer <token>`

### Update Profile
**PUT** `/auth/profile`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "name": "John Smith",
  "department": "Software Engineering",
  "semester": 4
}
```

### Change Password
**PUT** `/auth/change-password`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

---

## 📚 Programs

### Get All Programs
**GET** `/programs`

**Query Params:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `isActive` (optional): true/false

**Headers:** `Authorization: Bearer <token>`

### Get Program by ID
**GET** `/programs/:id`

**Headers:** `Authorization: Bearer <token>`

### Create Program
**POST** `/programs` (Admin only)

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "code": "BSCS",
  "name": "Bachelor of Science in Computer Science",
  "duration": 4,
  "description": "4-year undergraduate program"
}
```

### Update Program
**PUT** `/programs/:id` (Admin only)

**Headers:** `Authorization: Bearer <token>`

### Delete Program
**DELETE** `/programs/:id` (Admin only)

**Headers:** `Authorization: Bearer <token>`

### Add PLO to Program
**POST** `/programs/:id/plos` (Admin only)

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "code": "PLO1",
  "description": "Apply knowledge of computing fundamentals",
  "domain": "cognitive"
}
```

### Update PLO
**PUT** `/programs/:id/plos/:ploId` (Admin only)

**Headers:** `Authorization: Bearer <token>`

### Delete PLO
**DELETE** `/programs/:id/plos/:ploId` (Admin only)

**Headers:** `Authorization: Bearer <token>`

---

## 📖 Courses

### Get All Courses
**GET** `/courses`

**Query Params:**
- `page` (optional)
- `limit` (optional)
- `program` (optional): Filter by program ID
- `faculty` (optional): Filter by faculty ID
- `isActive` (optional)

**Headers:** `Authorization: Bearer <token>`

### Get Course by ID
**GET** `/courses/:id`

**Headers:** `Authorization: Bearer <token>`

### Create Course
**POST** `/courses` (Admin/Faculty)

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "code": "CS101",
  "name": "Introduction to Programming",
  "program": "program_id_here",
  "creditHours": 3,
  "semester": "1st",
  "description": "Basic programming concepts"
}
```

### Update Course
**PUT** `/courses/:id` (Admin/Faculty)

**Headers:** `Authorization: Bearer <token>`

### Delete Course
**DELETE** `/courses/:id` (Admin only)

**Headers:** `Authorization: Bearer <token>`

### Add CLO to Course
**POST** `/courses/:id/clos` (Admin/Faculty)

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "code": "CLO1",
  "description": "Understand basic programming concepts",
  "mappedPLO": "plo_id_here",
  "weight": 25
}
```

### Update CLO
**PUT** `/courses/:id/clos/:cloId` (Admin/Faculty)

**Headers:** `Authorization: Bearer <token>`

### Delete CLO
**DELETE** `/courses/:id/clos/:cloId` (Admin/Faculty)

**Headers:** `Authorization: Bearer <token>`

---

## 📝 Assessments

### Get All Assessments
**GET** `/assessments`

**Query Params:**
- `course` (optional): Filter by course ID
- `type` (optional): Filter by type
- `isPublished` (optional)

**Headers:** `Authorization: Bearer <token>`

### Get Assessment by ID
**GET** `/assessments/:id`

**Headers:** `Authorization: Bearer <token>`

### Create Assessment
**POST** `/assessments` (Faculty only)

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "title": "Midterm Exam",
  "course": "course_id_here",
  "type": "midterm",
  "totalMarks": 50,
  "weightage": 30,
  "cloMapping": [
    {
      "clo": "clo_id_here",
      "weight": 60
    },
    {
      "clo": "clo_id_here_2",
      "weight": 40
    }
  ],
  "date": "2026-03-15",
  "description": "Mid semester examination"
}
```

**Assessment Types:**
- quiz
- assignment
- midterm
- final
- project
- lab
- presentation

### Update Assessment
**PUT** `/assessments/:id` (Faculty only)

**Headers:** `Authorization: Bearer <token>`

### Delete Assessment
**DELETE** `/assessments/:id` (Faculty only)

**Headers:** `Authorization: Bearer <token>`

### Publish Assessment
**PATCH** `/assessments/:id/publish` (Faculty only)

**Headers:** `Authorization: Bearer <token>`

---

## 📊 Marks

### Get All Marks
**GET** `/marks`

**Query Params:**
- `student` (optional): Filter by student ID
- `assessment` (optional): Filter by assessment ID

**Headers:** `Authorization: Bearer <token>`

### Get Marks by Student
**GET** `/marks/student/:studentId`

**Headers:** `Authorization: Bearer <token>`

### Get Marks by Assessment
**GET** `/marks/assessment/:assessmentId` (Faculty only)

**Headers:** `Authorization: Bearer <token>`

### Submit Marks
**POST** `/marks` (Faculty only)

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "student": "student_id_here",
  "assessment": "assessment_id_here",
  "obtainedMarks": 42,
  "remarks": "Good performance",
  "isAbsent": false
}
```

### Bulk Submit Marks
**POST** `/marks/bulk` (Faculty only)

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "assessmentId": "assessment_id_here",
  "marksData": [
    {
      "student": "student_id_1",
      "obtainedMarks": 42
    },
    {
      "student": "student_id_2",
      "obtainedMarks": 38
    }
  ]
}
```

### Update Marks
**PUT** `/marks/:id` (Faculty only)

**Headers:** `Authorization: Bearer <token>`

### Delete Marks
**DELETE** `/marks/:id` (Faculty only)

**Headers:** `Authorization: Bearer <token>`

---

## 📈 Analytics

### Get Admin Dashboard
**GET** `/analytics/admin/dashboard` (Admin only)

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPrograms": 5,
    "totalCourses": 45,
    "totalStudents": 1250,
    "totalFaculty": 85,
    "totalAssessments": 320,
    "totalPLOs": 60,
    "totalCLOs": 180
  }
}
```

### Get Faculty Dashboard
**GET** `/analytics/faculty/dashboard` (Faculty only)

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCourses": 3,
    "totalAssessments": 12,
    "totalStudents": 85,
    "recentAssessments": [ /* array */ ]
  }
}
```

### Get Student Dashboard
**GET** `/analytics/student/dashboard` (Student only)

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "enrolledCourses": 6,
    "avgCLOAchievement": 78.5,
    "avgPLOAchievement": 75.2,
    "avgGPA": 3.2,
    "courses": [ /* array */ ]
  }
}
```

### Calculate Outcome Result
**POST** `/analytics/outcomes/calculate` (Admin/Faculty)

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "studentId": "student_id_here",
  "courseId": "course_id_here",
  "semester": "Fall 2026"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "student": "student_id",
    "course": "course_id",
    "cloAchievements": [ /* array */ ],
    "ploAchievements": [ /* array */ ],
    "overallPercentage": 78.5,
    "grade": "B+",
    "gpa": 3.0,
    "performanceLevel": "Good",
    "riskScore": 25,
    "isAtRisk": false,
    "recommendations": [ /* array */ ]
  }
}
```

### Get Student Outcomes
**GET** `/analytics/outcomes/student/:studentId`

**Headers:** `Authorization: Bearer <token>`

### Get Course Outcomes
**GET** `/analytics/outcomes/course/:courseId` (Admin/Faculty)

**Headers:** `Authorization: Bearer <token>`

### Get Students At Risk
**GET** `/analytics/at-risk` (Admin/Faculty)

**Query Params:**
- `courseId` (optional): Filter by course

**Headers:** `Authorization: Bearer <token>`

### Get CLO Statistics
**GET** `/analytics/clo/:courseId` (Admin/Faculty)

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "clo": "CLO1",
      "description": "Understanding...",
      "avgAchievement": 82.5,
      "attainmentRate": 78.5,
      "totalStudents": 45,
      "studentsAttained": 35
    }
  ]
}
```

### Get PLO Statistics
**GET** `/analytics/plo/:programId` (Admin only)

**Headers:** `Authorization: Bearer <token>`

### Get Performance Trend
**GET** `/analytics/performance-trend/:studentId`

**Headers:** `Authorization: Bearer <token>`

---

## 🔐 Authorization Matrix

| Endpoint | Admin | Faculty | Student |
|----------|-------|---------|---------|
| Auth (Login/Register) | ✅ | ✅ | ✅ |
| Programs (Create/Update/Delete) | ✅ | ❌ | ❌ |
| Programs (Read) | ✅ | ✅ | ✅ |
| Courses (Create/Update) | ✅ | ✅ | ❌ |
| Courses (Delete) | ✅ | ❌ | ❌ |
| Courses (Read) | ✅ | ✅ | ✅ |
| Assessments (Create/Update/Delete) | ✅ | ✅ | ❌ |
| Assessments (Read) | ✅ | ✅ | ✅ |
| Marks (Submit/Update/Delete) | ✅ | ✅ | ❌ |
| Marks (Read Own) | ✅ | ✅ | ✅ |
| Analytics (Admin Dashboard) | ✅ | ❌ | ❌ |
| Analytics (Faculty Dashboard) | ❌ | ✅ | ❌ |
| Analytics (Student Dashboard) | ❌ | ❌ | ✅ |
| Analytics (CLO/PLO Stats) | ✅ | ✅ | ❌ |
| Analytics (At Risk) | ✅ | ✅ | ❌ |

---

## 📋 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ /* validation errors if any */ ]
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Data fetched successfully",
  "data": {
    "items": [ /* array of items */ ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 48,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

## 🧪 Testing Tips

1. **Use Postman or Thunder Client** for testing
2. **Save token as environment variable** in Postman
3. **Test in order:** Auth → Programs → Courses → Assessments → Marks → Analytics
4. **Check response status codes:**
   - 200: Success
   - 201: Created
   - 400: Bad Request
   - 401: Unauthorized
   - 403: Forbidden
   - 404: Not Found
   - 500: Server Error

---

**Complete API Reference for OBE Assessment System** 📚
