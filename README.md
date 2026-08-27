# 🏥 Smart Hospital Management System (HMS)

> **Cloud-Based Healthcare Management & Clinical Operations Platform**  
> **Internship Project Submission — Module 1: Day 1, Day 2 & Day 3 Deliverables**

---

## 📌 Project Overview
The **Cloud-Based Hospital Management System (HMS)** is an enterprise-grade healthcare web application designed to automate clinical workflows, patient registration, outpatient scheduling, EHR consultations, pharmacy dispensing, inpatient bed tracking, and billing.

---

## 🚀 Module 1 Deliverables Summary

| Day | Date | Focus Scope | Deliverable Status |
|---|---|---|---|
| **Day 1** | Aug 24 | DB Schema Design & Full Stack Scaffolding | ✅ **Completed & Verified** |
| **Day 2** | Aug 25 | JWT Auth (Login/Signup/Logout & Password Hashing) | ✅ **Completed & Verified** |
| **Day 3** | Aug 26 | Role-Based Access Control (Admin, Doctor, Receptionist, Nurse, Patient) | ✅ **Completed & Verified** |
| **Day 4** | Aug 27 | Patient Registration & Demographic Forms (Auto MRN ID) | ⏳ *Next Milestone* |
| **Day 5** | Aug 28 | Patient Search, Medical History & Emergency Contacts | ⏳ *Upcoming* |

---

## 🛡️ Module 1 — Day 3 Deliverables (Aug 26, 2026)

### ✅ What was completed on Day 3:
1. **Multi-Role Access Control Architecture (`rbacConfig.js`):**
   - Formalized 6 system roles: `ADMIN`, `DOCTOR`, `RECEPTIONIST`, `NURSE`, `PHARMACIST`, `PATIENT`.
   - Granular **Role-to-Permissions Matrix** allocating 20+ fine-grained capabilities across administrative, clinical, front-desk, and patient domains.
2. **Route Guard & Permission Middleware (`authMiddleware.js`):**
   - `requireRoles(...roles)` — Strict role authorization guard.
   - `requirePermission(permission)` — Permission-level authorization checker.
   - Rejection with standardized `403 Forbidden` (`INSUFFICIENT_PERMISSIONS` / `PERMISSION_DENIED`) payloads.
3. **RBAC REST Endpoints (`rbacController.js` & `rbacRoutes.js`):**
   - `GET /api/rbac/matrix` — Returns the system-wide permissions matrix and role statistics.
   - `GET /api/rbac/users` — Admin-only endpoint returning all registered users, roles, and account statuses.
   - `PATCH /api/rbac/users/:id/role` — Admin-only dynamic role promotion/demotion with immutable audit logging.
   - `PATCH /api/rbac/users/:id/status` — Admin-only account activation/deactivation toggle.
   - `GET /api/rbac/guard/admin` — Strict `ADMIN` resource tester (200 OK vs 403 Forbidden).
   - `GET /api/rbac/guard/doctor` — Strict `DOCTOR` & `ADMIN` clinical resource tester.
   - `GET /api/rbac/guard/receptionist` — Strict `RECEPTIONIST` & `ADMIN` front-desk intake tester.
   - `GET /api/rbac/guard/nurse` — Strict `NURSE` & `ADMIN` triage & vitals station tester.
   - `GET /api/rbac/guard/patient` — Strict `PATIENT` & `ADMIN` personal health portal tester.
4. **Interactive Day 3 RBAC Dashboard (`Day3RbacExplorer.jsx`):**
   - **1-Click Persona Switcher:** Instant JWT role switching between Super Admin, Cardiologist, Receptionist, Nurse, and Patient.
   - **Live Route Guard Simulator:** Interactive test buttons verifying real-time HTTP 200 OK vs 403 Forbidden responses.
   - **Dynamic Role Management Table:** Admin control table to update user roles and toggle active states live.
   - **Full Permission Matrix Viewer:** Visual matrix displaying exact capability boundaries.
5. **Automated RBAC Test Suite (`test-rbac.js`):**
   - 36 automated assertions verifying role hierarchy, permission enforcement, token role embedding, and route guards.

---

## 🔐 Module 1 — Day 2 Deliverables (Aug 25, 2026)

### ✅ What was completed on Day 2:
1. **Cryptographic Password Hashing (`bcryptjs`):**
   - Implemented `hashPassword` and `comparePassword` with 10 salt rounds.
   - Live password strength validation.
2. **JSON Web Token (JWT) Engine (`jsonwebtoken`):**
   - Signed `HS256` tokens with claims (`id`, `email`, `role`, `fullName`, `mrn`).
   - Configurable session expiration (`JWT_EXPIRES_IN=7d`).
3. **Authentication REST Endpoints:**
   - `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `POST /api/auth/change-password`, `POST /api/auth/inspect-token`, `GET /api/auth/audit-logs`.
4. **Automated Auth Test Suite (`test-auth.js`):**
   - 23 automated assertions verifying BCrypt hashing and JWT lifecycle.

---

## 🏗️ Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USER ||--o| DOCTOR_PROFILE : "has profile (if doctor)"
    USER ||--o| PATIENT_PROFILE : "has profile (if patient)"
    USER ||--o{ AUDIT_LOG : "triggers"
    DEPARTMENT ||--o{ DOCTOR_PROFILE : "employs"
    DEPARTMENT ||--o{ WARD : "houses"
    PATIENT_PROFILE ||--o{ APPOINTMENT : "books"
    PATIENT_PROFILE ||--o{ VITALS_LOG : "has"
    PATIENT_PROFILE ||--o{ PRESCRIPTION : "receives"
    PATIENT_PROFILE ||--o{ INVOICE : "billed"
    DOCTOR_PROFILE ||--o{ APPOINTMENT : "consults"
    DOCTOR_PROFILE ||--o{ PRESCRIPTION : "issues"

    USER {
        string id PK
        string email UK
        string passwordHash "BCrypt Salted"
        string fullName
        string phone
        string role "ADMIN | DOCTOR | RECEPTIONIST | NURSE | PHARMACIST | PATIENT"
        boolean isActive
        datetime lastLoginAt
    }

    PATIENT_PROFILE {
        string id PK
        string mrn UK "MRN-YYYY-XXXX"
        string firstName
        string lastName
        string gender
        date dateOfBirth
        string bloodGroup
        string emergencyContactName
        string emergencyContactPhone
        string allergies
        string chronicConditions
    }

    DOCTOR_PROFILE {
        string id PK
        string specialization
        string licenseNumber UK
        decimal consultationFee
        string roomNumber
        string shiftStart
        string shiftEnd
    }

    AUDIT_LOG {
        string id PK
        string userId FK
        string action "USER_LOGIN | USER_REGISTER | ROLE_CHANGED | PASSWORD_CHANGED"
        string entity
        string details "JSON"
        datetime createdAt
    }
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React Icons, Axios |
| **Backend API** | Node.js, Express.js (ESM), Helmet, Morgan, CORS |
| **Authentication & RBAC** | JWT (JSON Web Tokens), BCrypt.js, Multi-Role Route Guard Middleware |
| **Database & ORM** | Prisma ORM, SQLite (Zero-config local) / PostgreSQL compatible |
| **Testing** | Automated Test Suites (`test-auth.js`, `test-rbac.js` — 59 Total Assertions) |

---

## 📂 Project Structure

```
Smart-Hospital-management-system/
├── package.json
├── .gitignore
├── README.md
├── push-to-github.bat                 # 1-Click push script (Windows)
├── push-to-github.ps1                 # PowerShell Git Automation
│
├── server/                            # Express Backend REST API
│   ├── prisma/
│   │   ├── schema.prisma              # 11 Relational Prisma Models
│   │   └── seed.js                    # Database seed fixtures
│   ├── src/
│   │   ├── config/db.js               # Prisma client singleton
│   │   ├── controllers/
│   │   │   ├── authController.js      # Day 2: JWT Login, Signup, Logout, Audit
│   │   │   ├── rbacController.js      # Day 3: Role Matrix & User Administration
│   │   │   ├── healthController.js    # Health diagnostics
│   │   │   └── schemaController.js    # Database schema reflection
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js      # Day 2/3: JWT Bearer & RBAC Guard
│   │   │   ├── validateAuth.js        # Input validation middleware
│   │   │   ├── errorHandler.js        # Global error interceptor
│   │   │   └── requestLogger.js       # Request logging
│   │   ├── routes/
│   │   │   ├── api.js                 # API route aggregator
│   │   │   ├── authRoutes.js          # Day 2: Auth REST endpoints
│   │   │   ├── rbacRoutes.js          # Day 3: RBAC REST endpoints
│   │   │   ├── healthRoutes.js
│   │   │   └── schemaRoutes.js
│   │   ├── utils/
│   │   │   ├── rbacConfig.js          # Day 3: Permissions Matrix & Role Metadata
│   │   │   ├── jwt.js                 # JWT sign, verify, decode utilities
│   │   │   ├── password.js            # BCrypt hash & compare utilities
│   │   │   └── mrnGenerator.js        # Sequential MRN generator
│   │   ├── app.js
│   │   └── server.js
│   ├── test-auth.js                   # Day 2 Test Suite (23 passed)
│   ├── test-rbac.js                   # Day 3 Test Suite (36 passed)
│   └── package.json
│
└── client/                            # React + Vite Frontend
    ├── src/
    │   ├── components/
    │   │   ├── Day3RbacExplorer.jsx   # Day 3: Role Matrix, Route Guards & User Manager
    │   │   ├── Day2AuthExplorer.jsx   # Day 2: JWT Inspector & BCrypt Playground
    │   │   ├── AuthModal.jsx          # Login, Registration & Persona Switcher
    │   │   ├── Day1SchemaExplorer.jsx # Schema & ERD inspector
    │   │   ├── SeedDataViewer.jsx     # Clinical fixtures viewer
    │   │   ├── Navbar.jsx             # Top bar with Auth user pill
    │   │   ├── Sidebar.jsx            # Module & Day navigation
    │   │   └── StatsCards.jsx         # System counters
    │   ├── context/
    │   │   └── AuthContext.jsx        # React Auth Provider & state hook
    │   ├── services/
    │   │   └── api.js                 # Axios instance with Bearer interceptor & RBAC API
    │   ├── App.jsx
    │   └── index.css
    └── package.json
```

---

## ⚡ Quick Start & Run

### 1. Backend Server
```powershell
cd server
npm install
npx prisma generate
npx prisma db push
node prisma/seed.js
node test-auth.js      # Run 23 auth tests
node test-rbac.js      # Run 36 RBAC tests
npm run dev
```
*Backend runs on `http://localhost:5000` (Health: `/api/health`)*

### 2. Frontend Client
```powershell
cd ../client
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 🔐 Seed Demo Credentials for Testing

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **Super Admin** | `admin@hms.hospital` | `Admin@12345` | Full System Management & Audit |
| **Cardiologist** | `dr.sarah@hms.hospital` | `Password@123` | Doctor Consultation & EHR |
| **Pediatrician** | `dr.ahmed@hms.hospital` | `Password@123` | OPD & Pediatric Consultation |
| **Receptionist** | `receptionist@hms.hospital` | `Password@123` | Patient Registration & Tokens |
| **Nurse** | `nurse.maria@hms.hospital` | `Password@123` | Triage & Vital Signs Recording |
| **Patient** | `david.miller@gmail.com` | `Password@123` | Patient Portal (MRN-2026-0001) |

---

**Author:** [ansariking51214](https://github.com/ansariking51214)  
**Repository:** [Smart-Hospital-management-system](https://github.com/ansariking51214/Smart-Hospital-management-system.git)
