# Quick Start Guide - Backend

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Setup MongoDB

**Option A: Local MongoDB**
```bash
# Make sure MongoDB is running on localhost:27017
# Default connection: mongodb://localhost:27017/obe_assessment
```

**Option B: MongoDB Atlas** (Recommended)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Update MONGODB_URI in `.env`

### Step 3: Configure Environment
The `.env` file is already created with default values. Modify if needed:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/obe_assessment
JWT_SECRET=your_secret_here
CLIENT_URL=http://localhost:3000
```

### Step 4: Start Server
```bash
# Development mode (auto-restart)
npm run dev

# Production mode
npm start
```

Server will start at: **http://localhost:5000**

### Step 5: Verify Installation
```bash
# Test health endpoint
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2026-02-23T..."
}
```

---

## 🧪 Testing with Sample Data

### 1. Register Admin User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@university.edu",
    "password": "admin123",
    "role": "admin"
  }'
```

### 2. Login to Get Token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@university.edu",
    "password": "admin123"
  }'
```

Copy the `token` from response.

### 3. Create a Program
```bash
curl -X POST http://localhost:5000/api/programs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "code": "BSCS",
    "name": "Bachelor of Science in Computer Science",
    "duration": 4,
    "description": "4-year undergraduate program"
  }'
```

### 4. Add PLO to Program
```bash
curl -X POST http://localhost:5000/api/programs/PROGRAM_ID/plos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "code": "PLO1",
    "description": "Apply knowledge of computing fundamentals",
    "domain": "cognitive"
  }'
```

---

## 📡 Frontend Integration

Your React frontend at `http://localhost:3000` will automatically connect to the backend.

**API Base URL:** `http://localhost:5000/api`

The backend is configured with CORS to accept requests from the frontend.

---

## 🔧 Common Issues & Solutions

### Issue: MongoDB Connection Failed
**Solution:**
- Ensure MongoDB is running
- Check MONGODB_URI in `.env`
- For Atlas: check network access & database user

### Issue: Port Already in Use
**Solution:**
```bash
# Change PORT in .env to different port like 5001
PORT=5001
```

### Issue: JWT Verification Failed
**Solution:**
- Ensure JWT_SECRET is set in `.env`
- Check token format: "Bearer <token>"
- Token expires after 7 days by default

### Issue: Cannot POST/GET to endpoint
**Solution:**
- Check HTTP method (GET, POST, PUT, DELETE)
- Verify endpoint URL spelling
- Include Authorization header for protected routes

---

## 📚 Next Steps

1. **Seed More Data:** Create faculty, students, courses
2. **Test Assessments:** Create assessments and submit marks
3. **Calculate Outcomes:** Use analytics endpoints
4. **View Dashboard:** Access role-based dashboard data

---

## 🎯 Default Test Accounts

After registration, use these accounts:

**Admin:**
- Email: admin@university.edu
- Password: admin123

**Faculty:** (Register manually)
- Email: faculty@university.edu
- Password: faculty123
- Role: faculty

**Student:** (Register manually)
- Email: student@university.edu
- Password: student123
- Role: student

---

## 📝 Environment Variables Explained

| Variable | Purpose | Default |
|----------|---------|---------|
| NODE_ENV | development/production | development |
| PORT | Server port | 5000 |
| MONGODB_URI | Database connection | localhost |
| JWT_SECRET | Token signing key | (set in .env) |
| JWT_EXPIRE | Token lifetime | 7d |
| CLIENT_URL | Frontend URL | http://localhost:3000 |

---

## 🆘 Need Help?

1. Check server logs in terminal
2. Use Postman/Thunder Client for API testing
3. Review [README.md](README.md) for detailed documentation
4. Check MongoDB connection status

---

**Backend is Ready! Start Building! 🚀**
