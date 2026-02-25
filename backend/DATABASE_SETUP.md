# 🗄️ MongoDB Database Setup Guide

Complete guide to setting up MongoDB and seeding the database for the OBE Assessment System.

---

## Step 1: Verify MongoDB Installation

### Check if MongoDB is Running

```powershell
# Check MongoDB service status
Get-Service -Name MongoDB

# Or check if MongoDB is listening on port 27017
Test-NetConnection -ComputerName localhost -Port 27017
```

### Start MongoDB Service (If Not Running)

```powershell
# Start MongoDB service
Start-Service -Name MongoDB

# Or if installed without service
mongod
```

---

## Step 2: Connect to MongoDB (Optional - For Verification)

```powershell
# Open MongoDB shell
mongosh

# Or if using older version
mongo
```

**In MongoDB shell:**
```javascript
// Show all databases
show dbs

// Switch to our database
use obe_assessment

// Show collections
show collections

// Exit
exit
```

---

## Step 3: Run Database Seeding Script

Navigate to backend folder and run the seed script:

```powershell
# Navigate to backend directory
cd backend

# Make sure dependencies are installed
npm install

# Run the seeding script
node scripts/seed.js
```

---

## 🌱 What the Seed Script Creates

### 👥 Users (8 Total)

**1 Admin:**
- Email: `admin@university.edu`
- Password: `admin123`
- Role: Admin
- Department: Administration

**2 Faculty:**
1. Dr. Sarah Johnson
   - Email: `sarah.johnson@university.edu`
   - Password: `faculty123`
   - Faculty ID: FAC001

2. Dr. Michael Chen
   - Email: `michael.chen@university.edu`
   - Password: `faculty123`
   - Faculty ID: FAC002

**5 Students:**
1. Alice Williams (STD001)
2. Bob Anderson (STD002)
3. Charlie Brown (STD003)
4. Diana Martinez (STD004)
5. Eva Thompson (STD005)

- All student emails: `{firstname}.{lastname}@student.edu`
- All passwords: `student123`
- All in semester 6
- Department: Computer Science

---

### 📚 Programs (2 Total)

1. **BSCS - Bachelor of Science in Computer Science**
   - Duration: 4 years
   - PLOs: 5 (covering cognitive and affective domains)
   
2. **BSSE - Bachelor of Science in Software Engineering**
   - Duration: 4 years
   - PLOs: 3

---

### 📖 Courses (3 Total)

1. **CS101 - Introduction to Programming**
   - Credit Hours: 3
   - Semester: 1st
   - Faculty: Dr. Sarah Johnson
   - CLOs: 4 (mapped to PLO1, PLO2, PLO3)

2. **CS201 - Data Structures**
   - Credit Hours: 4
   - Semester: 3rd
   - Faculty: Dr. Sarah Johnson
   - CLOs: 3 (mapped to PLO1, PLO2, PLO3)

3. **CS301 - Database Systems**
   - Credit Hours: 3
   - Semester: 5th
   - Faculty: Dr. Michael Chen
   - CLOs: 3 (mapped to PLO1, PLO3)

---

### 📝 Assessments (7 Total)

**CS101 (3 assessments):**
- Quiz 1 (10 marks, 5% weightage)
- Assignment 1 (20 marks, 10% weightage)
- Midterm Exam (50 marks, 25% weightage)

**CS201 (2 assessments):**
- Quiz 1 (15 marks, 5% weightage)
- Lab Assignment 1 (25 marks, 15% weightage)

**CS301 (2 assessments):**
- SQL Assignment (30 marks, 15% weightage)
- Database Design Project (100 marks, 30% weightage)

All assessments are published and mapped to specific CLOs.

---

### 📊 Marks (35 Total)

- Marks for all 5 students across all 7 assessments
- Random marks between 60-95% for realistic grade distribution
- All submitted by respective course faculty
- Includes remarks for each submission

---

## Step 4: Verify Database Creation

```powershell
# Connect to MongoDB shell
mongosh

# Switch to database
use obe_assessment

# Count documents in each collection
db.users.countDocuments()           # Should show 8
db.programs.countDocuments()        # Should show 2
db.courses.countDocuments()         # Should show 3
db.assessments.countDocuments()     # Should show 7
db.marks.countDocuments()           # Should show 35

# View sample data
db.users.find().pretty()
db.programs.find().pretty()
```

---

## Step 5: Start Backend Server

```powershell
# Make sure you're in backend directory
cd backend

# Start the server
npm run dev
```

You should see:
```
✅ MongoDB Connected Successfully
✅ Server running in development mode on port 5000
✅ API URL: http://localhost:5000/api
```

---

## Step 6: Test with Sample Accounts

### Test Admin Login

```powershell
curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"admin@university.edu\",\"password\":\"admin123\"}'
```

### Test Faculty Login

```powershell
curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"sarah.johnson@university.edu\",\"password\":\"faculty123\"}'
```

### Test Student Login

```powershell
curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"alice.williams@student.edu\",\"password\":\"student123\"}'
```

---

## 🔄 Re-seeding the Database

If you want to reset and re-seed:

```powershell
# Just run the seed script again
node scripts/seed.js
```

**Note:** The script automatically clears all existing data before seeding.

---

## 🗂️ Database Collections Created

After seeding, you'll have these collections:

1. **users** - All user accounts (admin, faculty, students)
2. **programs** - Academic programs with PLOs
3. **courses** - Courses with CLOs mapped to PLOs
4. **assessments** - Quizzes, assignments, exams, projects
5. **marks** - Student grades for assessments
6. **outcomeresults** - Will be created when outcomes are calculated

---

## 📊 Calculate Outcomes (Optional)

After logging in, you can calculate outcome results:

```powershell
# Get admin token from login response
$token = "your_jwt_token_here"

# Calculate outcomes for a student
curl -X POST http://localhost:5000/api/analytics/outcomes/calculate `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer $token" `
  -d '{\"studentId\":\"student_id_here\",\"courseId\":\"course_id_here\",\"semester\":\"Fall 2026\"}'
```

---

## 🔍 Troubleshooting

### MongoDB Not Running
```powershell
# Check service
Get-Service -Name MongoDB

# Start service
Start-Service -Name MongoDB
```

### Connection Refused
- Verify MongoDB is running on port 27017
- Check `MONGODB_URI` in `.env` file
- Try: `mongodb://127.0.0.1:27017/obe_assessment`

### Seed Script Fails
```powershell
# Make sure you're in backend directory
cd backend

# Reinstall dependencies
npm install

# Try again
node scripts/seed.js
```

### Duplicate Key Error
- The seed script clears data first
- If error persists, manually drop database:
```javascript
// In mongosh
use obe_assessment
db.dropDatabase()
```

---

## 🎯 Next Steps

1. ✅ MongoDB installed and running
2. ✅ Database seeded with sample data
3. ✅ Backend server running
4. ✅ Test accounts created

**Now you can:**
- Login to frontend with sample credentials
- Test all API endpoints
- Create additional data
- Calculate outcome results
- View analytics dashboards

---

## 📝 Default Credentials Summary

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@university.edu | admin123 |
| Faculty | sarah.johnson@university.edu | faculty123 |
| Faculty | michael.chen@university.edu | faculty123 |
| Student | alice.williams@student.edu | student123 |
| Student | bob.anderson@student.edu | student123 |
| Student | charlie.brown@student.edu | student123 |
| Student | diana.martinez@student.edu | student123 |
| Student | eva.thompson@student.edu | student123 |

---

**Database Setup Complete! 🎉**
