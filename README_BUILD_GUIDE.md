# Intelligent Fuzzy-Logic and AI-Based Student Learning Assessment System for Outcome-Based Education Using MERN Stack

This repository contains a complete starter implementation of a Final Year CSE system project that combines:

- Outcome-Based Education (OBE)
- CLO/PLO mapping
- Fuzzy logic based performance evaluation
- Risk analytics / weak student detection
- MERN stack full-stack architecture
- Role-based dashboards for Admin, Faculty, Student, and Department Head

---

# 1. What problem this system solves

Traditional academic assessment systems often have these issues:

1. They use rigid percentage or grade cutoffs.
2. They do not handle uncertainty in student performance.
3. They do not support continuous CLO/PLO monitoring properly.
4. They do not automatically detect weak students early.
5. They do not provide multi-role dashboards and analytics.

This project solves that by:

- collecting marks from quiz, assignment, mid, and final
- evaluating them with a fuzzy inference engine
- converting uncertain academic performance into an attainment score
- calculating CLO and PLO achievement
- generating risk scores for early warning
- providing dashboards for decision making

---

# 2. Selected tech stack

Frontend:
- React + Vite
- Axios
- React Router
- Recharts

Backend:
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT authentication
- PDFKit

Intelligence:
- Fuzzy logic engine in Node.js
- Rule-based AI analytics for risk score and trend detection

Deployment:
- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

Why Node-only instead of Python microservice?
- Easier for a final year student
- One language across backend and intelligence layer
- Simpler deployment
- Less configuration and fewer failure points

---

# 3. Recommended beginner execution order

Follow this order exactly:

1. Install software
2. Create MongoDB Atlas account
3. Create database cluster and get connection string
4. Set up backend
5. Set up frontend
6. Run seed script
7. Login with demo accounts
8. Understand OBE data entry flow
9. Add your own department/program/course/CLO/PLO data
10. Add assessments
11. Enter student marks
12. Observe fuzzy score, risk score, and analytics
13. Deploy when local system works

---

# 4. Software prerequisites for Windows 10/11

Install these first:

- Node.js LTS
- VS Code
- Git
- Postman
- MongoDB Atlas account in browser

You do NOT need local MongoDB if you use Atlas cloud.

---

# 5. What each layer does

## Frontend (React)
This is the visible website.
It shows:
- login screen
- dashboards
- forms to enter departments, programs, courses
- forms to enter assessments and marks
- analytics charts
- notifications

## Backend (Node + Express)
This is the main server.
It handles:
- login
- JWT verification
- role checking
- CRUD APIs
- fuzzy evaluation
- risk analytics
- report generation

## Database (MongoDB Atlas)
This stores:
- users
- departments
- programs
- courses
- assessments
- CLO-PLO mappings
- fuzzy rules
- results
- notifications
- audit logs

## Intelligence Engine
This runs in backend code.
It does:
- fuzzification
- rule evaluation
- centroid defuzzification
- weighted average
- risk score generation
- weak student detection
- CLO/PLO calculation

---

# 6. Step-by-step local setup on Windows

Open **Command Prompt** or **PowerShell**.
Open terminal in VS Code:
- open VS Code
- click **Terminal**
- click **New Terminal**

## 6.1 Create the root project folder

You already have the code scaffold in this repo.
If you are starting manually from scratch, create a folder like this:

```powershell
mkdir obe-fuzzy-ai-assessment
cd obe-fuzzy-ai-assessment
```

In this project, you already have:
- `backend/`
- `frontend/`

---

# 7. Backend setup

## 7.1 Go to backend folder

```powershell
cd backend
```

## 7.2 Install backend packages

```powershell
npm install
```

What this does:
- reads `package.json`
- downloads required packages
- creates `node_modules`

## 7.3 What is package.json?
`package.json` is the file that tells Node:
- project name
- scripts like `npm run dev`
- required packages

## 7.4 What is node_modules?
This folder stores installed libraries.

Do not edit it manually.

## 7.5 Create `.env` file

Inside `backend/`, create a file named:

```text
.env
```

Copy from `.env.example` and replace values:

```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string_here
JWT_SECRET=super_long_random_secret_key_12345
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
ADMIN_SETUP_KEY=setup-admin-once
NODE_ENV=development
```

## 7.6 Why `.env` is important
It stores secrets like:
- database connection string
- JWT secret

Never commit `.env` to public GitHub.

---

# 8. MongoDB Atlas setup (very important)

## 8.1 Create account
1. Open MongoDB Atlas website
2. Create free account
3. Verify email

## 8.2 Create project
1. Click **New Project**
2. Name it like `OBE Assessment`
3. Click create

## 8.3 Create cluster
1. Click **Build a Database**
2. Choose free or low-cost shared/flex cluster
3. Choose provider and nearest region
4. Give cluster a name
5. Create cluster

## 8.4 Create database user
1. Go to **Database Access**
2. Click **Add New Database User**
3. Choose username and password
4. Save them securely

Example:
- username: `obeadmin`
- password: `StrongPassword123`

## 8.5 Whitelist IP
1. Go to **Network Access**
2. Click **Add IP Address**
3. Choose **Allow Access from Anywhere** for testing
4. Save

## 8.6 Get connection string
1. Go to **Clusters**
2. Click **Connect**
3. Choose **Drivers**
4. Copy the connection string

It looks like:

```text
mongodb+srv://obeadmin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

Replace:
- `<password>` with your actual DB password
- add DB name like `/obe_fuzzy_ai`

Example final URI:

```text
mongodb+srv://obeadmin:StrongPassword123@cluster0.xxxxx.mongodb.net/obe_fuzzy_ai?retryWrites=true&w=majority&appName=Cluster0
```

Paste that into backend `.env`:

```env
MONGODB_URI=mongodb+srv://obeadmin:StrongPassword123@cluster0.xxxxx.mongodb.net/obe_fuzzy_ai?retryWrites=true&w=majority&appName=Cluster0
```

## 8.7 Test DB connection
Run backend:

```powershell
npm run dev
```

Expected success output:

```text
MongoDB connected: ...
Server running on http://localhost:5000
```

Common errors:

### Error: bad auth
Cause:
- wrong DB username/password

Fix:
- recheck database user credentials
- ensure special characters in password are URL-safe

### Error: IP not allowed
Cause:
- network access not configured

Fix:
- add your IP or allow all temporarily

### Error: ENOTFOUND
Cause:
- malformed URI

Fix:
- paste full Atlas string correctly

---

# 9. Run seed script

Seed script creates:
- one department
- one program
- one admin
- one faculty
- two students
- one course
- four assessments
- one CLO-PLO mapping
- fuzzy rules

From backend folder:

```powershell
npm run seed
```

Expected console output includes demo credentials.

Demo logins:
- admin@example.com / Admin123!
- faculty@example.com / Faculty123!
- student1@example.com / Student123!
- student2@example.com / Student123!
- head@example.com / Head123!

---

# 10. Start backend server

From `backend/`:

```powershell
npm run dev
```

Keep this terminal running.

---

# 11. Frontend setup

Open a second terminal.

## 11.1 Go to frontend folder

```powershell
cd frontend
```

## 11.2 Install frontend packages

```powershell
npm install
```

## 11.3 Create frontend `.env`
Create file:

```text
frontend/.env
```

Put:

```env
VITE_API_URL=http://localhost:5000/api
```

## 11.4 Start frontend

```powershell
npm run dev
```

Expected output:
- local dev server URL, usually `http://localhost:5173`

Open it in browser.

---

# 12. How frontend connects to backend

Frontend uses:
- `src/api/client.js`

This file creates Axios instance with:

```js
baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
```

So every API call goes to backend.

Example:
- `api.get('/courses')`
actually calls:
- `http://localhost:5000/api/courses`

JWT token is stored in localStorage and automatically sent in Authorization header.

---

# 13. Authentication flow

## 13.1 Login
User enters:
- email
- password

Frontend sends:
- `POST /api/auth/login`

Backend:
- checks email
- compares password with bcrypt hash
- creates JWT
- returns token + user profile

Frontend:
- stores token in `localStorage`
- stores user object
- redirects based on role

## 13.2 Protected routes
Frontend route guard checks:
- is user logged in?
- does user have required role?

Backend route guard checks:
- is JWT valid?
- is role allowed?

This means both frontend and backend are secured.

---

# 14. Folder structure

## 14.1 Backend tree

```text
backend/
  .env.example
  package.json
  server.js
  src/
    app.js
    config/
      db.js
    controllers/
      analyticsController.js
      assessmentController.js
      authController.js
      courseController.js
      departmentController.js
      mappingController.js
      notificationController.js
      programController.js
      reportController.js
      resultController.js
      userController.js
    middleware/
      authMiddleware.js
      errorMiddleware.js
    models/
      Assessment.js
      AuditLog.js
      CLOPLOMapping.js
      Course.js
      Department.js
      FuzzyRule.js
      Notification.js
      Program.js
      Result.js
      User.js
    routes/
      analyticsRoutes.js
      assessmentRoutes.js
      authRoutes.js
      courseRoutes.js
      departmentRoutes.js
      mappingRoutes.js
      notificationRoutes.js
      programRoutes.js
      reportRoutes.js
      resultRoutes.js
      userRoutes.js
    scripts/
      seed.js
    services/
      analyticsService.js
      auditService.js
      fuzzyService.js
      notificationService.js
    utils/
      apiResponse.js
      asyncHandler.js
      generateToken.js
```

## 14.2 Frontend tree

```text
frontend/
  .env.example
  index.html
  package.json
  vite.config.js
  src/
    App.jsx
    index.css
    main.jsx
    api/
      client.js
    components/
      Layout.jsx
      Loading.jsx
      ProtectedRoute.jsx
      StatCard.jsx
    context/
      AuthContext.jsx
    pages/
      AdminDashboard.jsx
      AnalyticsPage.jsx
      AssessmentsPage.jsx
      CoursesPage.jsx
      DepartmentsPage.jsx
      FacultyDashboard.jsx
      HeadDashboard.jsx
      LoginPage.jsx
      MappingPage.jsx
      NotificationsPage.jsx
      ProgramsPage.jsx
      ResultsPage.jsx
      StudentDashboard.jsx
```

---

# 15. Database design explained in simple language

## users
Stores everyone who logs in.

Fields:
- name
- email
- password
- role
- department
- program
- studentId
- facultyId

## departments
Stores academic departments like CSE.

## programs
Stores academic programs like BSc in CSE.
Also stores PLOs.

## courses
Stores course information and CLOs.

## assessments
Stores each assessment like quiz, assignment, mid, final.

## cloplomappings
Stores how each CLO maps to one or more PLOs.

## fuzzyrules
Stores fuzzy rules so they can be edited later.

## results
Stores student marks, fuzzy score, risk score, CLO/PLO attainment and history.

## notifications
Stores risk alerts and system messages.

## auditlogs
Stores important actions for traceability.

---

# 16. OBE data-entry workflow (this is the most important part)

Follow this sequence in the real system.

## Step 1: Admin creates department
Page:
- Departments page

Fields:
- department name
- code
- description

What happens:
- data saved in `departments`

Example:
- Name: Computer Science and Engineering
- Code: CSE

## Step 2: Admin or Head creates program
Page:
- Programs page

Fields:
- program name
- program code
- department
- PLO lines

Example PLO input:
```text
PLO1|Engineering knowledge
PLO2|Problem analysis
PLO3|Design and development of solutions
```

What happens:
- program saved in `programs`
- PLO array stored inside the program document

## Step 3: Admin or Head creates course
Page:
- Courses page

Fields:
- course name
- course code
- credits
- semester
- department
- program
- faculty
- CLO text

Example CLO input:
```text
CLO1|Explain basic machine learning concepts|C2
CLO2|Build and evaluate predictive models|C3
CLO3|Interpret model results for decisions|C4
```

What happens:
- course saved in `courses`
- CLOs stored inside course document

## Step 4: Faculty creates assessments
Page:
- Assessments page

Fields:
- course
- title
- type
- CLO codes
- total marks
- weightage

Example records:
- Quiz 1 -> CLO1 -> total 10 -> weight 10
- Assignment 1 -> CLO2 -> total 15 -> weight 15
- Midterm -> CLO1,CLO2 -> total 25 -> weight 25
- Final Exam -> CLO2,CLO3 -> total 50 -> weight 50

What happens:
- saved in `assessments`

## Step 5: Faculty maps CLOs to PLOs
Page:
- CLO-PLO Mapping page

Fields per row:
- CLO code
- PLO code
- weight

Example:
- CLO1 -> PLO1 -> 1
- CLO2 -> PLO2 -> 0.6
- CLO2 -> PLO3 -> 0.4
- CLO3 -> PLO3 -> 1

What happens:
- saved in `cloplomappings`

## Step 6: Faculty enters student marks
Page:
- Results Entry page

Fields:
- course
- student
- quiz
- assignment
- mid
- final

Example raw marks entered by faculty:
- Quiz = 8 out of 10
- Assignment = 12 out of 15
- Mid = 18 out of 25
- Final = 35 out of 50

What happens behind the scenes:
1. marks sent to backend
2. fuzzy engine normalizes values
3. membership degrees calculated
4. rules activated
5. raw marks are normalized into percentages using each assessment's total marks
6. centroid defuzzification calculates fuzzy score
7. risk score computed
8. CLO attainment calculated from assessment -> CLO links
9. PLO attainment calculated from CLO -> PLO mapping
10. result saved to `results`
11. notifications generated if risk is high

## Step 7: Student views own performance
Page:
- Student Dashboard / My Results

Student sees:
- marks
- fuzzy score
- risk band
- alerts

## Step 8: Faculty views analytics
Page:
- Analytics page

Faculty sees:
- CLO bar chart
- PLO bar chart
- weak students
- average fuzzy score
- risk distribution

## Step 9: Department Head reviews department/program overview
Page:
- Head Dashboard

Head sees:
- program wise average fuzzy score
- total courses
- total results
- department average

---

# 17. Fuzzy logic engine explanation

Inputs:
- quiz
- assignment
- mid
- final

Each input uses 3 linguistic labels:
- Low
- Medium
- High

## 17.1 Membership functions
The system uses triangular membership functions.

Example for a score `x`:

- Low: triangle(0, 0, 50)
- Medium: triangle(25, 50, 75)
- High: triangle(50, 100, 100)

## 17.2 Example intuition
If final = 35:
- low may be high
- medium may be small
- high may be 0

This models uncertainty better than a hard rule like:
- below 40 = fail

## 17.3 Inference method
The system uses Mamdani style rule evaluation:
- IF quiz is medium AND final is high THEN attainment is medium/high depending on rule

Rule strength:
- minimum of antecedent membership values

## 17.4 Defuzzification
The system samples output membership over 0 to 100
and applies centroid:

```text
crisp_output = sum(x * mu(x)) / sum(mu(x))
```

## 17.5 Output
Backend stores:
- fuzzy score
- attainment level (Low / Medium / High)
- activated rules

---

# 18. Example fuzzy calculation

Example marks:
- quiz = 60
- assignment = 55
- mid = 70
- final = 80

Possible memberships:
- quiz: medium and high
- assignment: medium
- mid: medium/high
- final: high

Activated rule example:
- IF mid is high AND final is high THEN attainment is high

After aggregation and centroid:
- after normalization the percentages become 80, 80, 72 and 70
- fuzzy score may become around 70 to 80 depending on rule activations

That score is more realistic than a hard average because it reflects uncertain boundaries.

---

# 19. Risk score logic

The system uses a practical scoring model instead of full ML.

Why?
- easier to explain in viva
- easier to debug
- easier to validate with small academic datasets
- can later be upgraded to Random Forest or regression

Risk score uses:
- weighted average deficit
- fuzzy score gap
- low mid/final penalty
- downward trend penalty

Risk bands:
- Low
- Moderate
- High
- Critical

High/Critical results create notifications.

---

# 20. API list

## Auth
- `POST /api/auth/setup-register`
- `POST /api/auth/login`
- `GET /api/auth/me`

## Users
- `GET /api/users`
- `POST /api/users`
- `PATCH /api/users/:id`

## Departments
- `GET /api/departments`
- `POST /api/departments`

## Programs
- `GET /api/programs`
- `POST /api/programs`

## Courses
- `GET /api/courses`
- `POST /api/courses`
- `POST /api/courses/:id/clos`

## Mappings
- `GET /api/mappings/:courseId`
- `PUT /api/mappings/:courseId`

## Assessments
- `GET /api/assessments`
- `POST /api/assessments`

## Results
- `POST /api/results`
- `GET /api/results/course/:courseId`
- `GET /api/results/me`

## Analytics
- `GET /api/analytics/admin-summary`
- `GET /api/analytics/faculty-summary`
- `GET /api/analytics/student-summary`
- `GET /api/analytics/head-summary`
- `GET /api/analytics/course/:courseId`
- `GET /api/analytics/weak-students/:courseId`

## Reports
- `GET /api/reports/student/:studentId/:courseId/pdf`
- `GET /api/reports/course/:courseId/summary`

## Notifications
- `GET /api/notifications/me`
- `PATCH /api/notifications/:id/read`

---

# 21. Postman testing examples

## 21.1 Login

Method:
- POST

URL:
```text
http://localhost:5000/api/auth/login
```

Body:
```json
{
  "email": "faculty@example.com",
  "password": "Faculty123!"
}
```

Expected response:
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "token": "....",
    "user": {
      "id": "...",
      "name": "Prof. Amina Rahman",
      "email": "faculty@example.com",
      "role": "faculty"
    }
  }
}
```

Save the token and use it in:
```text
Authorization: Bearer YOUR_TOKEN
```

## 21.2 Create assessment
Method:
- POST

URL:
```text
http://localhost:5000/api/assessments
```

Body:
```json
{
  "course": "COURSE_OBJECT_ID",
  "title": "Quiz 2",
  "type": "quiz",
  "cloCodes": ["CLO1"],
  "totalMarks": 10,
  "weightage": 10
}
```

## 21.3 Submit student result
Method:
- POST

URL:
```text
http://localhost:5000/api/results
```

Body:
```json
{
  "studentId": "STUDENT_OBJECT_ID",
  "courseId": "COURSE_OBJECT_ID",
  "marks": {
    "quiz": 8,
    "assignment": 12,
    "mid": 18,
    "final": 35
  }
}
```

Expected:
- result saved
- fuzzy score returned
- risk score generated
- course analytics updated

---

# 22. Sample MongoDB documents

## users
```json
{
  "_id": "....",
  "name": "Tanvir Hasan",
  "email": "student1@example.com",
  "role": "student",
  "studentId": "2021001",
  "department": "DEPT_ID",
  "program": "PROGRAM_ID"
}
```

## programs
```json
{
  "_id": "....",
  "name": "BSc in Computer Science and Engineering",
  "code": "BSC-CSE",
  "department": "DEPT_ID",
  "plos": [
    { "code": "PLO1", "description": "Engineering knowledge" },
    { "code": "PLO2", "description": "Problem analysis" }
  ]
}
```

## results
```json
{
  "_id": "....",
  "student": "STUDENT_ID",
  "course": "COURSE_ID",
  "marks": {
    "quiz": 8,
    "assignment": 12,
    "mid": 18,
    "final": 35
  },
  "rawMarks": {
    "quiz": 8,
    "assignment": 12,
    "mid": 18,
    "final": 35
  },
  "weightedAverage": 74.8,
  "fuzzyScore": 72.4,
  "attainmentLevel": "High",
  "riskScore": 29.6,
  "riskBand": "Low",
  "cloAttainment": [
    { "code": "CLO1", "score": 74.2 },
    { "code": "CLO2", "score": 67.4 }
  ],
  "ploAttainment": [
    { "code": "PLO1", "score": 74.2 }
  ]
}
```

---

# 23. How to verify everything works

## Backend checklist
- health route works
- login works
- protected routes reject missing token
- seed script inserts demo data
- results route returns fuzzy details
- analytics route returns charts data

## Frontend checklist
- login works
- role redirects work
- courses load
- assessments save
- mapping saves
- results entry saves
- student dashboard shows results
- notifications appear for high-risk student

## Database checklist
- collections created in Atlas
- results collection updates after marks entry
- notifications inserted for risky cases

---

# 24. Common beginner issues and fixes

## Port already in use
Change backend port in `.env` and update frontend `VITE_API_URL`.

## CORS error
Check:
- backend `CLIENT_URL`
- frontend URL
- backend server restarted after `.env` change

## Cannot login after seeding
Possible causes:
- wrong DB connection
- seed not actually ran
- backend connected to different database
- password typed wrongly

## Empty dropdowns in frontend
Cause:
- related collections not created yet
- you skipped seed
- logged in with a role that cannot view some data

---

# 25. Report generation

Currently implemented:
- Student PDF report
- Course summary JSON report

To download student PDF:
open in browser or call via Postman:
```text
GET /api/reports/student/:studentId/:courseId/pdf
```

The backend uses PDFKit.

---

# 26. Deployment guide

## 26.1 Deploy backend on Render
1. Push project to GitHub
2. Create new Web Service on Render
3. Connect repository
4. Root directory: `backend`
5. Build command:
```text
npm install
```
6. Start command:
```text
node server.js
```
7. Add environment variables from `.env`

Important:
- set `CLIENT_URL` to your frontend deployed URL

## 26.2 Deploy frontend on Vercel
1. Import GitHub repo on Vercel
2. Set root directory to `frontend`
3. Add environment variable:
```text
VITE_API_URL=https://your-backend-url.onrender.com/api
```
4. Deploy

## 26.3 Update backend CORS
Set:
```env
CLIENT_URL=https://your-frontend-url.vercel.app
```

Then redeploy backend.

---

# 27. Security features already included

- password hashing with bcrypt
- JWT based auth
- role-based access control
- helmet for secure headers
- rate limiting
- environment variables
- protected routes
- server-side authorization checks

---

# 28. How to explain the innovation in viva

Say this:

“This system goes beyond traditional marks calculation by combining OBE data management, fuzzy logic based uncertainty handling, and AI-inspired risk analytics inside a scalable MERN application. It not only stores marks but transforms them into CLO/PLO attainment, student risk alerts, and decision-support dashboards.”

---

# 29. Thesis/report structure you can use

1. Abstract
2. Introduction
3. Problem statement
4. Objectives
5. Proposed methodology
6. System architecture
7. Database design
8. Fuzzy logic engine design
9. Analytics and risk model
10. OBE workflow implementation
11. Frontend implementation
12. Backend implementation
13. Testing and validation
14. Results and analysis
15. Conclusion
16. Future work

---

# 30. Future upgrade ideas

- Random Forest model for risk prediction
- NLP answer evaluation
- Chatbot assistant for students
- Mobile app
- Auto-generated fuzzy rules from historical data
- University-wide multi-department support
- Email notification module
- CSV import for bulk marks

---

# 31. Very important beginner summary

When building this system in the correct order:

1. Start backend
2. Confirm DB connected
3. Run seed
4. Start frontend
5. Login
6. Check seeded course and users
7. Add or edit OBE data
8. Enter marks
9. Watch fuzzy and analytics output

If one part fails, debug in this order:
- database connection
- backend terminal errors
- API test in Postman
- frontend console
- role permissions

---

# 32. Minimal daily workflow when demonstrating

For project demo day:

1. Login as admin
2. Show department/program/course
3. Show CLO and PLO setup
4. Logout
5. Login as faculty
6. Show assessments and mapping
7. Enter student marks
8. Show fuzzy output and analytics
9. Logout
10. Login as student
11. Show personal dashboard and notifications
12. Login as head
13. Show department/program analytics

This makes the demo smooth and impressive.

---
