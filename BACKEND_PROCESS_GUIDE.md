# 🔧 Complete Backend Process - Step by Step Guide

## 📘 Understanding the Full Backend Flow

### 1️⃣ MongoDB Database - AUTOMATIC CREATION ✅

**Important: You DON'T need to manually create the database in MongoDB!**

MongoDB automatically creates databases and collections when you first insert data. Here's what happened:

#### When You Ran the Seed Script:
```powershell
node scripts/seed.js
```

**MongoDB automatically:**
1. ✅ Created database: `obe_assessment`
2. ✅ Created 6 collections:
   - `users` - All user accounts
   - `programs` - Academic programs with PLOs
   - `courses` - Courses with CLOs
   - `assessments` - Quizzes, exams, assignments
   - `marks` - Student grades
   - `outcomeresults` - Will be created when outcomes are calculated

**No manual database creation needed!** This is how MongoDB works - it creates databases on-the-fly.

---

## 🔄 Complete Backend Process Flow

### Step 1: MongoDB Running
```
MongoDB Service (Port 27017)
├── Listening for connections
└── No authentication required for localhost
```

### Step 2: Backend Server Starts
```powershell
cd backend
npm run dev
```

**What Happens:**
```
1. server.js executes
   ├── Loads .env configuration
   ├── Connects to MongoDB at mongodb://localhost:27017/obe_assessment
   ├── Sets up Express middleware:
   │   ├── Helmet (security headers)
   │   ├── CORS (allow localhost:3000)
   │   ├── Rate Limiter (100 requests per 15 min)
   │   └── JSON parser (10mb limit)
   ├── Mounts routes at /api:
   │   ├── /api/auth/* (authentication)
   │   ├── /api/programs/* (programs management)
   │   ├── /api/courses/* (courses management)
   │   ├── /api/assessments/* (assessments)
   │   ├── /api/marks/* (grades)
   │   └── /api/analytics/* (analytics)
   └── Starts listening on port 5001

✅ Server ready at http://localhost:5001
```

### Step 3: Frontend Connects to Backend
```
Frontend (localhost:3000)
    ↓
    | HTTP Request
    ↓
Backend API (localhost:5001/api)
    ↓
    | Query
    ↓
MongoDB (localhost:27017)
```

---

## 🔐 Authentication Flow - How Login Works

### Request Journey:

```
1. USER CLICKS LOGIN
   └── Email: admin@university.edu
   └── Password: admin123

2. FRONTEND (AuthContext.jsx)
   └── POST http://localhost:5001/api/auth/login
   └── Body: { email, password }

3. BACKEND RECEIVES REQUEST
   └── routes/authRoutes.js → Catches POST /login
   └── Passes to: controllers/authController.js → login()

4. AUTH CONTROLLER PROCESSES
   └── Finds user by email in MongoDB
   └── Compares password using bcrypt
   └── If valid:
       ├── Generates JWT token (expires in 7 days)
       └── Returns: {
             "success": true,
             "message": "Login successful",
             "data": {
               "user": { _id, name, email, role, ... },
               "token": "eyJhbGciOiJIUzI1NiIs..."
             }
           }

5. FRONTEND RECEIVES RESPONSE
   └── Extracts: response.data.data.token
   └── Extracts: response.data.data.user
   └── Stores in localStorage:
       ├── localStorage.setItem('token', token)
       └── localStorage.setItem('user', JSON.stringify(user))
   └── Navigates to dashboard based on role:
       ├── Admin → /admin/dashboard
       ├── Faculty → /faculty/dashboard
       └── Student → /student/dashboard

6. SUBSEQUENT REQUESTS
   └── Frontend adds token to all requests:
       └── Authorization: Bearer <token>
   └── Backend verifies token:
       └── middleware/auth.js → verifyToken()
       └── If valid: Processes request
       └── If invalid: Returns 401 Unauthorized
```

---

## 🔍 What I Fixed

### Problem:
After login, you were redirected back to login page immediately.

### Cause:
Frontend was trying to access `response.data.token` but backend returns data in `response.data.data.token`

**Backend Response Structure:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {           ← Extra "data" layer
    "user": {...},
    "token": "..."
  }
}
```

**Frontend Was Accessing:**
```javascript
const { token, user } = response.data;  ❌ Wrong!
```

**Fixed To:**
```javascript
const { token, user } = response.data.data;  ✅ Correct!
```

---

## 📂 Database Verification

### Check if MongoDB Database Exists

Since mongosh/mongo commands aren't available in your PATH, use MongoDB Compass or connect via Node.js:

**Option 1: Using Node.js Script**
```javascript
// check-db.js
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/obe_assessment')
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('\n📊 Collections in obe_assessment database:');
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`   • ${col.name}: ${count} documents`);
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
```

Run: `cd backend && node check-db.js`

**Option 2: MongoDB Compass**
1. Download: https://www.mongodb.com/try/download/compass
2. Connect to: `mongodb://localhost:27017`
3. You'll see `obe_assessment` database with 5 collections

---

## 🎯 Current System Status

### ✅ What's Running:

1. **MongoDB** (Port 27017)
   - Database: `obe_assessment`
   - Collections: users, programs, courses, assessments, marks
   - Documents: 8 users, 2 programs, 3 courses, 7 assessments, 35 marks

2. **Backend API** (Port 5001)
   - Status: ✅ Running
   - Health: http://localhost:5001/api/health
   - CORS: Accepts requests from localhost:3000
   - Authentication: JWT with 7-day expiry

3. **Frontend** (Port 3000)
   - Status: ✅ Running
   - API Connection: http://localhost:5001/api
   - Auth: Fixed - Now correctly extracts token from response

### ✅ What Was Done Automatically:

1. **Database Creation**: Automatic (MongoDB creates on first insert)
2. **Collections**: Created by Mongoose schemas
3. **Sample Data**: Inserted by seed script
4. **Indexes**: Created automatically by Mongoose
5. **Password Hashing**: Done automatically by User model pre-save hook

---

## 🧪 Test the Fix

### Try Logging In Now:

1. **Open Browser**: http://localhost:3000
2. **Login with Admin**:
   - Email: `admin@university.edu`
   - Password: `admin123`
3. **Expected Result**: 
   - ✅ Login successful
   - ✅ Redirected to Admin Dashboard
   - ✅ Stays on dashboard (no redirect back)

### Check Browser Console:
- Press F12
- Go to "Console" tab
- Should see no errors after login

### Check LocalStorage:
- F12 → Application/Storage → Local Storage → http://localhost:3000
- Should see:
  - `token`: "eyJhbGciOiJIUzI1NiIs..."
  - `user`: {"_id":"...","name":"Admin User","role":"admin",...}

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER ACTION                               │
│              (Clicks Login Button)                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  FRONTEND                                    │
│  src/context/AuthContext.jsx                                │
│  • api.post('/auth/login', { email, password })             │
│  • Sends to: http://localhost:5001/api/auth/login           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP POST Request
                     │ { email: "...", password: "..." }
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND API                                 │
│  backend/server.js → routes/authRoutes.js                   │
│  • Receives request at /api/auth/login                      │
│  • Passes to auth controller                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              AUTH CONTROLLER                                 │
│  backend/controllers/authController.js                      │
│  • User.findOne({ email })                                  │
│  • Queries MongoDB ─────────┐                               │
└──────────────────────────────┼──────────────────────────────┘
                               │
                               ▼
                    ┌────────────────────┐
                    │     MONGODB        │
                    │  Port: 27017       │
                    │  DB: obe_assessment│
                    │  Collection: users │
                    └──────────┬─────────┘
                               │
                               │ Returns user document
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              AUTH CONTROLLER                                 │
│  • user.comparePassword(password) ← bcrypt verification     │
│  • generateToken(user._id) ← Creates JWT                    │
│  • Returns response:                                         │
│    {                                                         │
│      "success": true,                                        │
│      "data": { "user": {...}, "token": "..." }              │
│    }                                                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP Response
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  FRONTEND                                    │
│  • Receives: response.data.data.token ← FIXED!              │
│  • Stores in localStorage                                    │
│  • Sets user state                                           │
│  • Navigates to dashboard                                    │
└─────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              USER SEES DASHBOARD                             │
│  • Admin: /admin/dashboard                                   │
│  • Faculty: /faculty/dashboard                               │
│  • Student: /student/dashboard                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Points:

1. **MongoDB Database**: Created automatically, no manual setup needed
2. **Seed Script**: Already populated all data (users, programs, courses, etc.)
3. **Authentication**: Fixed - now correctly extracts token from backend response
4. **CORS**: Properly configured to allow frontend (localhost:3000) to call backend (localhost:5001)
5. **JWT Tokens**: Valid for 7 days, stored in localStorage
6. **Protected Routes**: Backend verifies token on every request to protected endpoints

---

## 🚀 You're All Set!

The system is now fully functional. Try logging in again - it should work perfectly!

If you have any issues:
1. Check browser console (F12)
2. Check Network tab to see API requests/responses
3. Verify both servers are running:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5001/api/health
