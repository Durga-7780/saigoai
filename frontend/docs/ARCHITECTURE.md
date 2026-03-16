# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Web App    │  │  Mobile App  │  │   Biometric  │          │
│  │   (React)    │  │  (Future)    │  │    Device    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                  │                  │                  │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
                    ┌────────▼────────┐
                    │   API Gateway   │
                    │   (FastAPI)     │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
┌─────────▼─────────┐ ┌─────▼──────┐ ┌────────▼────────┐
│  Authentication   │ │   Business  │ │   AI Services   │
│     Service       │ │    Logic    │ │   (OpenAI)      │
│   (JWT/OAuth)     │ │             │ │                 │
└─────────┬─────────┘ └─────┬──────┘ └────────┬────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Data Layer    │
                    │   (MongoDB)     │
                    └─────────────────┘
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                    Presentation Layer                   │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │    │
│  │  │Dashboard │ │Attendance│ │  Leaves  │ │ Chatbot  │ │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                   State Management                      │    │
│  │              (Redux Toolkit)                            │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐              │    │
│  │  │   Auth   │ │Attendance│ │  Leaves  │              │    │
│  │  │  Slice   │ │  Slice   │ │  Slice   │              │    │
│  │  └──────────┘ └──────────┘ └──────────┘              │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                    API Service Layer                    │    │
│  │                      (Axios)                            │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
└───────────────────────────┬───────────────────────────────────┘
                            │
                   HTTP/REST API
                            │
┌───────────────────────────▼───────────────────────────────────┐
│                     BACKEND (FastAPI)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                     API Routes                          │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │    │
│  │  │   Auth   │ │Attendance│ │  Leaves  │ │ Chatbot  │ │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                   Business Logic                        │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐              │    │
│  │  │Attendance│ │   Leave  │ │Fingerprint│             │    │
│  │  │ Service  │ │ Service  │ │ Service  │              │    │
│  │  └──────────┘ └──────────┘ └──────────┘              │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                    Data Models                          │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐              │    │
│  │  │ Employee │ │Attendance│ │  Leave   │              │    │
│  │  │  Model   │ │  Model   │ │  Model   │              │    │
│  │  └──────────┘ └──────────┘ └──────────┘              │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
└───────────────────────────┬───────────────────────────────────┘
                            │
                    MongoDB Driver
                            │
┌───────────────────────────▼───────────────────────────────────┐
│                      DATABASE (MongoDB)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  employees   │  │  attendance  │  │    leaves    │         │
│  │  collection  │  │  collection  │  │  collection  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Attendance Check-In Flow

```
User → Frontend → API → Fingerprint Service → Database
  │                                                  │
  └──────────────── Response ←─────────────────────┘

Detailed Steps:
1. User clicks "Check In" or places finger on scanner
2. Frontend captures data (fingerprint/manual)
3. API receives request with employee_id and biometric data
4. Fingerprint service verifies against stored templates
5. Attendance service creates/updates record
6. Database stores attendance record
7. Response sent back to frontend
8. UI updates with confirmation
```

### 2. AI Chatbot Flow

```
User Query → Frontend → API → Chatbot Service → OpenAI
                                      │
                                      ├→ Knowledge Base
                                      │
                                      └→ Database (context)
                                      │
Response ←─────────────────────────────┘

Detailed Steps:
1. User types question in chatbot
2. Frontend sends query to API
3. Chatbot service checks knowledge base
4. If not found, queries OpenAI with context
5. OpenAI generates response
6. Response formatted and sent back
7. Frontend displays answer with suggestions
```

### 3. Leave Application Flow

```
User → Frontend → API → Leave Service → Database
  │                        │
  │                        └→ Email Service (notification)
  │                        │
  │                        └→ Manager Notification
  │
Response ←─────────────────┘

Detailed Steps:
1. User fills leave application form
2. Frontend validates and submits
3. API receives leave request
4. Leave service checks balance
5. Creates leave record in database
6. Sends notification to manager
7. Updates employee leave balance
8. Returns confirmation to user
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Security Layers                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Layer 1: Transport Security                                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  HTTPS/TLS Encryption                                   │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  Layer 2: Authentication                                         │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  JWT Tokens (30 min expiry)                            │    │
│  │  Password Hashing (bcrypt)                             │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  Layer 3: Authorization                                          │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Role-Based Access Control (RBAC)                      │    │
│  │  - Admin, Manager, HR, Employee                        │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  Layer 4: Data Security                                          │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Input Validation (Pydantic)                           │    │
│  │  SQL Injection Prevention (MongoDB)                    │    │
│  │  XSS Protection (React)                                │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  Layer 5: Biometric Security                                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Fingerprint Template Encryption                       │    │
│  │  Template Matching (threshold-based)                   │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Production Setup                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                   Load Balancer                         │    │
│  │                    (Nginx/AWS)                          │    │
│  └───────────────────┬────────────────────────────────────┘    │
│                      │                                           │
│         ┌────────────┴────────────┐                             │
│         │                         │                             │
│  ┌──────▼──────┐          ┌──────▼──────┐                      │
│  │  Frontend   │          │  Frontend   │                      │
│  │  Instance 1 │          │  Instance 2 │                      │
│  │  (Vercel)   │          │  (Vercel)   │                      │
│  └─────────────┘          └─────────────┘                      │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                   API Gateway                           │    │
│  │                    (FastAPI)                            │    │
│  └───────────────────┬────────────────────────────────────┘    │
│                      │                                           │
│         ┌────────────┴────────────┐                             │
│         │                         │                             │
│  ┌──────▼──────┐          ┌──────▼──────┐                      │
│  │  Backend    │          │  Backend    │                      │
│  │  Instance 1 │          │  Instance 2 │                      │
│  │  (Heroku)   │          │  (Heroku)   │                      │
│  └─────────────┘          └─────────────┘                      │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                MongoDB Atlas                            │    │
│  │              (Replica Set)                              │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐              │    │
│  │  │ Primary  │ │Secondary │ │Secondary │              │    │
│  │  └──────────┘ └──────────┘ └──────────┘              │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                External Services                        │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐              │    │
│  │  │ OpenAI   │ │  Email   │ │  Redis   │              │    │
│  │  │   API    │ │  (SMTP)  │ │ (Cache)  │              │    │
│  │  └──────────┘ └──────────┘ └──────────┘              │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Technology Stack                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Frontend                                                         │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  React 18 + Redux Toolkit                              │    │
│  │  Material-UI (MUI)                                      │    │
│  │  Axios + React Router                                   │    │
│  │  Chart.js + Framer Motion                              │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  Backend                                                          │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  FastAPI + Uvicorn                                      │    │
│  │  Pydantic + Python-Jose                                │    │
│  │  Passlib + Bcrypt                                       │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  Database                                                         │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  MongoDB 6.0+                                           │    │
│  │  Motor (Async Driver)                                   │    │
│  │  Beanie ODM                                             │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  AI/ML                                                            │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  OpenAI GPT-4                                           │    │
│  │  LangChain                                              │    │
│  │  Sentence Transformers                                  │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
│  DevOps                                                           │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Docker + Docker Compose                               │    │
│  │  Git + GitHub                                           │    │
│  │  Pytest + Jest                                          │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

This architecture provides:
- **Scalability**: Horizontal scaling of frontend and backend
- **Security**: Multiple layers of protection
- **Performance**: Caching and optimization
- **Reliability**: Database replication and load balancing
- **Maintainability**: Clean separation of concerns
