# API Integration Guide

This document provides details on integrating with the backend API.

## Authentication

### Login
**POST** `/api/auth/login`

Request:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "token": "jwt-token-here",
  "user": {
    "_id": "user-id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "student"
  }
}
```

### Register
**POST** `/api/auth/register`

Request:
```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "password123",
  "role": "student",
  "studentId": "STU001",
  "department": "Computer Science"
}
```

## Programs

### Get All Programs
**GET** `/api/programs`

### Create Program
**POST** `/api/programs`

Request:
```json
{
  "code": "CS",
  "name": "Computer Science",
  "duration": "4 years",
  "description": "Program description"
}
```

### Update Program
**PUT** `/api/programs/:id`

### Delete Program
**DELETE** `/api/programs/:id`

## Courses

### Get All Courses
**GET** `/api/courses`

### Create Course
**POST** `/api/courses`

Request:
```json
{
  "code": "CS101",
  "name": "Introduction to Programming",
  "program": "program-id",
  "creditHours": 3,
  "semester": "Fall 2024"
}
```

## PLOs

### Get All PLOs
**GET** `/api/plos`

### Create PLO
**POST** `/api/plos`

Request:
```json
{
  "program": "program-id",
  "code": "PLO1",
  "description": "PLO description",
  "domain": "cognitive"
}
```

## CLOs

### Get CLOs by Course
**GET** `/api/clos/course/:courseId`

### Create CLO
**POST** `/api/clos`

Request:
```json
{
  "course": "course-id",
  "code": "CLO1",
  "description": "CLO description",
  "plo": "plo-id"
}
```

## Assessments

### Get All Assessments
**GET** `/api/assessments`

### Get Assessments by Course
**GET** `/api/assessments/course/:courseId`

### Create Assessment
**POST** `/api/assessments`

Request:
```json
{
  "course": "course-id",
  "title": "Quiz 1",
  "type": "quiz",
  "maxMarks": 100,
  "clo": "clo-id",
  "weightage": 20,
  "date": "2024-03-15"
}
```

## Marks

### Enter Marks
**POST** `/api/marks`

Request:
```json
{
  "assessment": "assessment-id",
  "student": "student-id",
  "marks": 85
}
```

### Get Marks by Student
**GET** `/api/marks/student/:studentId`

## Analytics

### Get CLO Analytics
**GET** `/api/analytics/clo/:courseId`

Response:
```json
[
  {
    "clo": "CLO1",
    "description": "CLO description",
    "achievement": 85
  }
]
```

### Get PLO Analytics
**GET** `/api/analytics/plo/:programId`

Response:
```json
[
  {
    "plo": "PLO1",
    "achievement": 78
  }
]
```

### Get Student Performance
**GET** `/api/analytics/student/:studentId`

Response:
```json
{
  "stats": {
    "cloAchievement": 82,
    "ploAchievement": 78
  },
  "cloData": [...],
  "ploData": [...],
  "performanceData": [...],
  "assessmentDetails": [...]
}
```

## Authentication Headers

All protected endpoints require JWT token in Authorization header:

```
Authorization: Bearer <jwt-token>
```

The Axios instance in `src/services/api.js` automatically handles this.

## Error Handling

API returns errors in the following format:

```json
{
  "message": "Error message",
  "errors": {
    "field": "Field-specific error"
  }
}
```

The frontend automatically handles common errors via Axios interceptors.
