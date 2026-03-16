# Setup and Installation Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ and npm
- **Python** 3.10+
- **MongoDB** 6.0+ (local or MongoDB Atlas)
- **Git**

## Step 1: Clone the Repository

```bash
cd c:\Users\durga\Downloads\ReactAttendent
```

## Step 2: Backend Setup

### 2.1 Create Virtual Environment

```bash
cd backend
python -m venv venv
```

### 2.2 Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

### 2.3 Install Dependencies

```bash
pip install -r requirements.txt
```

### 2.4 Configure Environment Variables

```bash
copy .env.example .env
```

Edit `.env` file and configure:

```env
# MongoDB
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=attendance_system

# JWT Secret (IMPORTANT: Change this!)
SECRET_KEY=your-super-secret-key-change-this-in-production

# OpenAI API (for AI Chatbot)
OPENAI_API_KEY=your-openai-api-key-here

# Email (optional)
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### 2.5 Start MongoDB

**Option A: MongoDB Atlas (Recommended - Setup Done)**
We have configured the system to use your MongoDB Atlas cluster: `employe-management.fhg5wpb.mongodb.net`.
No local installation is required.

**Option B: Local MongoDB**
If you want to switch back to local:
1. Start local MongoDB: `mongod --dbpath C:\data\db`
2. Update `MONGODB_URL` in `.env` to `mongodb://localhost:27017`

### 2.6 Run Backend Server

```bash
python main.py
```

Backend will run on: http://localhost:8000

API Documentation: http://localhost:8000/api/docs

## Step 3: Frontend Setup

### 3.1 Install Dependencies

Open a new terminal:

```bash
cd frontend
npm install
```

### 3.2 Configure Environment

```bash
copy .env.example .env
```

The default configuration should work:
```env
REACT_APP_API_URL=http://localhost:8000/api
```

### 3.3 Start Frontend

```bash
npm start
```

Frontend will run on: http://localhost:3000

## Step 4: Create Initial Admin User

### Option A: Using API Documentation

1. Go to http://localhost:8000/api/docs
2. Find `/api/auth/register` endpoint
3. Click "Try it out"
4. Use this sample data:

```json
{
  "employee_data": {
    "employee_id": "EMP001",
    "first_name": "Admin",
    "last_name": "User",
    "email": "admin@company.com",
    "phone": "+91-9876543210",
    "date_of_birth": "1990-01-01T00:00:00",
    "gender": "Male",
    "department": "IT",
    "designation": "System Administrator",
    "role": "admin",
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
      "name": "Emergency Contact",
      "relationship": "Family",
      "phone": "+91-9876543211"
    },
    "password": "admin123"
  }
}
```

### Option B: Using Python Script

Create `create_admin.py` in backend folder:

```python
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.employee import Employee, Address, EmergencyContact
from app.config import settings
from passlib.context import CryptContext
from datetime import datetime

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    database = client[settings.MONGODB_DB_NAME]
    await init_beanie(database=database, document_models=[Employee])
    
    admin = Employee(
        employee_id="EMP001",
        first_name="Admin",
        last_name="User",
        email="admin@company.com",
        phone="+91-9876543210",
        date_of_birth=datetime(1990, 1, 1),
        gender="Male",
        department="IT",
        designation="System Administrator",
        role="admin",
        joining_date=datetime(2024, 1, 1),
        employment_type="full-time",
        address=Address(
            street="123 Main St",
            city="Mumbai",
            state="Maharashtra",
            postal_code="400001",
            country="India"
        ),
        emergency_contact=EmergencyContact(
            name="Emergency Contact",
            relationship="Family",
            phone="+91-9876543211"
        ),
        password_hash=pwd_context.hash("admin123")
    )
    
    await admin.insert()
    print("Admin user created successfully!")
    print("Email: admin@company.com")
    print("Password: admin123")

if __name__ == "__main__":
    asyncio.run(create_admin())
```

Run:
```bash
python create_admin.py
```

## Step 5: Login

1. Go to http://localhost:3000
2. Login with:
   - Email: `admin@company.com`
   - Password: `admin123`

## Step 6: Configure OpenAI (Optional but Recommended)

For AI Chatbot functionality:

1. Get API key from https://platform.openai.com/api-keys
2. Add to backend `.env`:
   ```env
   OPENAI_API_KEY=sk-your-key-here
   ```
3. Restart backend server

## Troubleshooting

### MongoDB Connection Issues

**Error:** `Connection refused`

**Solution:**
- Ensure MongoDB is running
- Check `MONGODB_URL` in `.env`
- For Windows, check MongoDB service is started

### Port Already in Use

**Backend (8000):**
```bash
# Find process
netstat -ano | findstr :8000
# Kill process
taskkill /PID <process_id> /F
```

**Frontend (3000):**
```bash
# Find process
netstat -ano | findstr :3000
# Kill process
taskkill /PID <process_id> /F
```

### Module Not Found Errors

**Backend:**
```bash
pip install -r requirements.txt --force-reinstall
```

**Frontend:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### CORS Errors

Ensure backend `.env` has:
```env
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

## Next Steps

1. **Enroll Fingerprint**: Go to Profile → Enroll Fingerprint
2. **Mark Attendance**: Use Dashboard → Check In
3. **Apply Leave**: Go to Leave Management
4. **Ask AI**: Use AI Assistant for queries
5. **View Analytics**: Check Dashboard for statistics

## Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment guide.

## Support

For issues:
1. Check logs in `backend/logs/app.log`
2. Check browser console for frontend errors
3. Verify all environment variables are set
4. Ensure MongoDB is accessible

---

**Congratulations!** Your Enterprise Attendance System is now running! 🎉
