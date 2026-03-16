# API Documentation

## Base URL

```
http://localhost:8000/api
```

## Authentication

All protected endpoints require JWT token in Authorization header:

```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### POST /auth/register
Register a new employee

**Request Body:**
```json
{
  "employee_data": {
    "employee_id": "EMP001",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@company.com",
    "phone": "+91-9876543210",
    "date_of_birth": "1990-01-15T00:00:00",
    "gender": "Male",
    "department": "Engineering",
    "designation": "Senior Developer",
    "role": "employee",
    "joining_date": "2024-01-01T00:00:00",
    "employment_type": "full-time",
    "address": {
      "street": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "postal_code": "400001",
      "country": "India"
    },
    "emergency_contact": {
      "name": "Jane Doe",
      "relationship": "Spouse",
      "phone": "+91-9876543211"
    },
    "password": "password123"
  }
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

### POST /auth/login
Login with email and password

**Request Body (Form Data):**
```
username: john@company.com
password: password123
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

### POST /employees
Create a new employee (Admin/HR only)

**Request Body:**
```json
{
  "employee_id": "EMP001",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@company.com",
  "password": "password123",
  "department": "Engineering",
  "designation": "Developer",
  "role": "employee"
}
```

### GET /auth/me
Get current user details

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "employee_id": "EMP001",
  "name": "John Doe",
  "email": "john@company.com",
  "department": "Engineering",
  "designation": "Senior Developer",
  "role": "employee"
}
```

---

## Attendance Endpoints

### POST /attendance/check-in
Mark attendance check-in

**Request Body:**
```json
{
  "employee_id": "EMP001",
  "check_in_type": "fingerprint",
  "fingerprint_data": "base64_encoded_fingerprint",
  "location": {
    "latitude": 19.0760,
    "longitude": 72.8777,
    "accuracy": 10.5
  },
  "device_info": "Web Browser",
  "remarks": "On time"
}
```

**Response:**
```json
{
  "message": "Checked in successfully",
  "attendance_id": "507f1f77bcf86cd799439011",
  "check_in_time": "2026-01-03T09:00:00",
  "is_late": false,
  "status": "present"
}
```

### POST /attendance/check-out
Mark attendance check-out

**Request Body:**
```json
{
  "employee_id": "EMP001",
  "check_out_type": "manual",
  "location": {
    "latitude": 19.0760,
    "longitude": 72.8777
  },
  "device_info": "Web Browser"
}
```

**Response:**
```json
{
  "message": "Checked out successfully",
  "attendance_id": "507f1f77bcf86cd799439011",
  "check_out_time": "2026-01-03T18:00:00",
  "total_hours": 9.0,
  "is_early_departure": false
}
```

### GET /attendance/my-attendance
Get attendance records

**Query Parameters:**
- `start_date` (optional): ISO date string
- `end_date` (optional): ISO date string

**Response:**
```json
{
  "total": 20,
  "records": [
    {
      "id": "507f1f77bcf86cd799439011",
      "date": "2026-01-03T00:00:00",
      "check_in_time": "2026-01-03T09:00:00",
      "check_out_time": "2026-01-03T18:00:00",
      "total_hours": 9.0,
      "status": "present",
      "is_late": false
    }
  ]
}
```

### GET /attendance/today
Get today's attendance status

**Response:**
```json
{
  "status": "marked",
  "attendance": {
    "check_in_time": "2026-01-03T09:00:00",
    "check_out_time": null,
    "status": "present"
  },
  "checked_in": true,
  "checked_out": false
}
```

### GET /attendance/stats
Get attendance statistics

**Query Parameters:**
- `month` (optional): Month number (1-12)
- `year` (optional): Year

**Response:**
```json
{
  "month": 1,
  "year": 2026,
  "total_days": 20,
  "present_days": 18,
  "late_days": 2,
  "attendance_percentage": 90.0,
  "total_hours": 162.0,
  "average_hours": 9.0
}
```

---

## Leave Endpoints

### GET /leaves/all
Get all leave applications (Admin/HR only)

**Query Parameters:**
- `status` (optional): pending, approved, rejected, cancelled
- `department` (optional): Filter by department

**Response:**
```json
{
  "total": 100,
  "leaves": [...]
}
```

### POST /leaves/apply
Apply for leave

**Request Body:**
```json
{
  "employee_id": "EMP001",
  "leave_type": "casual",
  "start_date": "2026-01-10T00:00:00",
  "end_date": "2026-01-12T00:00:00",
  "is_half_day": false,
  "reason": "Personal work",
  "attachments": []
}
```

**Response:**
```json
{
  "message": "Leave application submitted successfully",
  "leave_id": "507f1f77bcf86cd799439011",
  "status": "pending",
  "total_days": 3
}
```

### GET /leaves/my-leaves
Get leave applications

**Query Parameters:**
- `status` (optional): pending, approved, rejected, cancelled

**Response:**
```json
{
  "total": 5,
  "leaves": [
    {
      "id": "507f1f77bcf86cd799439011",
      "leave_type": "casual",
      "start_date": "2026-01-10T00:00:00",
      "end_date": "2026-01-12T00:00:00",
      "total_days": 3,
      "reason": "Personal work",
      "status": "pending",
      "applied_at": "2026-01-03T10:00:00"
    }
  ]
}
```

### GET /leaves/balance
Get leave balance

**Response:**
```json
{
  "employee_id": "EMP001",
  "casual_leave": 9,
  "sick_leave": 10,
  "annual_leave": 20,
  "total_available": 39
}
```

### POST /leaves/approve
Approve or reject leave (Manager/HR only)

**Request Body:**
```json
{
  "leave_id": "507f1f77bcf86cd799439011",
  "approver_id": "EMP002",
  "status": "approved",
  "comments": "Approved"
}
```

---

## Chatbot Endpoints

### POST /chatbot/ask
Ask AI chatbot a question

**Request Body:**
```json
{
  "query": "How do I apply for leave?",
  "context": {
    "attendance_stats": {},
    "leave_balance": {}
  }
}
```

**Response:**
```json
{
  "answer": "To apply for leave, follow these steps...",
  "source": "ai",
  "suggestions": [
    "Show my attendance",
    "What is my leave balance?",
    "When is the next holiday?"
  ]
}
```

### GET /chatbot/suggestions
Get common query suggestions

**Response:**
```json
{
  "suggestions": [
    "How do I apply for leave?",
    "Show my attendance for this month",
    "What is my leave balance?"
  ]
}
```

---

## Dashboard Endpoints

### GET /dashboard/overview
Get dashboard overview

**Response:**
```json
{
  "today": {
    "checked_in": "2026-01-03T09:00:00",
    "checked_out": null,
    "status": "present"
  },
  "this_month": {
    "total_days": 20,
    "present_days": 18,
    "late_days": 2,
    "total_hours": 162.0,
    "attendance_percentage": 90.0
  },
  "leave_balance": {
    "casual": 9,
    "sick": 10,
    "annual": 20
  },
  "pending_leaves": 1
}
```

### GET /dashboard/admin/stats
Get admin statistics (Admin/HR only)

**Response:**
```json
{
  "employees": {
    "total": 100,
    "active": 95,
    "inactive": 5
  },
  "today_attendance": {
    "total": 95,
    "present": 85,
    "absent": 10,
    "late": 5,
    "percentage": 89.47
  },
  "pending_leaves": 12,
  "departments": {
    "Engineering": {
      "total": 50,
      "present": 45
    }
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Invalid request data"
}
```

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

### 403 Forbidden
```json
{
  "detail": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

---

## Interactive Documentation

Visit http://localhost:8000/api/docs for interactive Swagger UI documentation.
