# 🏥 Smart Hospital Management System (HMS)

> **Cloud-Based Healthcare Management & Clinical Operations Platform**  
> **Student / Intern Name:** Muhammad Tabish Ahmad  
> **Internship ID:** `ZYNVEX-CERT-110`  
> **Repository:** [Smart-Hospital-management-system](https://github.com/ansariking51214/Smart-Hospital-management-system)

---

## 📌 Project Overview
The **Smart Hospital Management System (HMS)** is an enterprise-grade full-stack healthcare web application designed to automate clinical operations, outpatient scheduling, dynamic time slot booking, electronic health records (EHR), physician shift rostering, OPD live queue & token calling, pharmacy dispensing, inpatient bed tracking, and billing workflows.

---

## 🚀 Internship Syllabus & Milestone Progress

### ✅ Module 1: Authentication, RBAC & Patient Registration (100% Completed)
| Day | Date | Focus Scope | Key Deliverables | Status |
|:---:|:---:|:---|:---|:---:|
| **Day 1** | Aug 24 | DB Schema Design & Scaffolding | 11 Prisma Relational Models, SQLite Migration, Seed Data Fixtures | ✅ **Completed** |
| **Day 2** | Aug 25 | JWT Auth & Password Security | BCrypt (10 Salt Rounds), Signed JWT Engine, Token Inspector, Audit Trail | ✅ **Completed** |
| **Day 3** | Aug 26 | Role-Based Access Control (RBAC) | 6 Roles, 20+ Permissions Matrix, Dynamic Route Guards, Admin Role Table | ✅ **Completed** |
| **Day 4** | Aug 27 | Patient Registration & Auto MRN | Sequential Auto-MRN (`MRN-2026-XXXX`), 4-Step Clinical Intake, Digital ID Card | ✅ **Completed** |
| **Day 5** | Aug 28 | Patient Search & Medical History | Multi-Criteria Search, Longitudinal EHR Timeline, Emergency Contact Center | ✅ **Completed** |

---

### 🩺 Module 2: Doctor Rostering & OPD Management (In Progress)
| Day | Date | Focus Scope | Key Deliverables | Status |
|:---:|:---:|:---|:---|:---:|
| **Day 1** | Aug 31 / Sep 01 | Doctor Profile & Shift Rostering | Physician Onboarding, Shift Schedules, Weekly Rosters, Real-time Duty Board | ✅ **Completed** |
| **Day 2** | Sep 02 | Slot Booking Engine & OPD Scheduling | Dynamic Slot Generation, Collision Guard, Queue Token Issuance & Rescheduling | ✅ **Completed** |
| **Day 3** | Sep 03 | **OPD Queue & Token Display System** | **Live Patient Calling Board, Sequential Tokens, TV Display Screen, Triage Desk** | ✅ **Completed & Verified** |
| **Day 4** | Sep 04 | Nurse Vitals Triage Desk | Clinical Vitals Recording & Triage Status | ⏳ *Next Milestone* |
| **Day 5** | Sep 05 | Appointment Status Flow | Check-In, In-Consultation & Completion Workflow | ⏳ *Upcoming* |

---

## 🎫 Module 2 — Day 3 Deliverables: OPD Live Queue & Token Display System

### 1. Backend OPD Queue Management Core & API Endpoints
* **Controller:** [`server/src/controllers/opdQueueController.js`](https://github.com/ansariking51214/Smart-Hospital-management-system/blob/main/server/src/controllers/opdQueueController.js)
* **Routes:** [`server/src/routes/opdQueueRoutes.js`](https://github.com/ansariking51214/Smart-Hospital-management-system/blob/main/server/src/routes/opdQueueRoutes.js) mounted on `/api/queue`
* **Validation:** [`server/src/middleware/validateOpdQueue.js`](https://github.com/ansariking51214/Smart-Hospital-management-system/blob/main/server/src/middleware/validateOpdQueue.js)

| Method | Endpoint | Access | Purpose |
|:---|:---|:---:|:---|
| `GET` | `/api/queue/live` | Public / Staff | Real-time live OPD queue board returning Currently Serving, Waiting Line with estimated wait times, and Completed tokens |
| `POST` | `/api/queue/call-next` | Doctor / Receptionist | Pages and calls next waiting patient in line, updates status to `CALLED`, sets `calledAt` timestamp, and triggers room chime |
| `PATCH` | `/api/queue/token/:id/status` | Doctor / Receptionist | Transitions token state (`IN_CONSULTATION`, `COMPLETED`, `SKIPPED`, `RECALLED`) and updates linked appointment |
| `POST` | `/api/queue/issue-walkin` | Receptionist / Admin | Issues instant walk-in OPD token with sequential numbering (e.g. `CARD-001`, `PEDS-002`) |
| `GET` | `/api/queue/stats/overview` | Public / Staff | Live queue statistics: currently serving count, waiting depth, completed consultations, and average wait time |

### 2. Interactive Frontend OPD Queue & TV Display Dashboard
* **React Component:** [`client/src/components/Day3OpdQueueExplorer.jsx`](https://github.com/ansariking51214/Smart-Hospital-management-system/blob/main/client/src/components/Day3OpdQueueExplorer.jsx)
* **Features:**
  * **Waiting Hall TV Display Mode:** High-contrast pulsing "NOW SERVING" digital cards with Token Code, Patient Name, Attending Doctor, and Examination Room number.
  * **Doctor Consultation Desk:** 1-Click "Call Next Patient" paging button, Start Consultation, Mark Completed, and Skip / No-Show controls.
  * **Reception Walk-in Desk:** 1-Click instant walk-in token issuer.
  * **Auto-Refreshing Live Queue Stream:** 8-second polling lifecycle for real-time waiting hall synchronization.

---

## 🏗️ Architecture & Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USER ||--o| DOCTOR_PROFILE : "has clinical profile"
    USER ||--o| PATIENT_PROFILE : "has patient profile"
    USER ||--o{ AUDIT_LOG : "generates"
    DEPARTMENT ||--o{ DOCTOR_PROFILE : "employs"
    DOCTOR_PROFILE ||--o{ APPOINTMENT : "consults"
    PATIENT_PROFILE ||--o{ APPOINTMENT : "books"
    APPOINTMENT ||--o| QUEUE_TOKEN : "issues token"
    PATIENT_PROFILE ||--o{ QUEUE_TOKEN : "holds token"
    DOCTOR_PROFILE ||--o{ QUEUE_TOKEN : "serves"

    QUEUE_TOKEN {
        string id PK
        string appointmentId FK
        string patientId FK
        string doctorId FK
        int tokenNumber "Sequential daily counter (1, 2, 3...)"
        string tokenCode "e.g. CARD-001, PEDS-002"
        string status "WAITING | CALLED | IN_CONSULTATION | COMPLETED | SKIPPED | CANCELLED"
        datetime calledAt
        datetime completedAt
        datetime date
    }

    APPOINTMENT {
        string id PK
        string patientId FK
        string doctorId FK
        datetime appointmentDate
        string timeSlot "10:00 - 10:30"
        string status "SCHEDULED | CONFIRMED | IN_QUEUE | IN_CONSULTATION | COMPLETED | CANCELLED"
        string reasonForVisit
    }
```

---

## 🧪 Automated Test Suite Coverage (146 Total Passed Assertions)

| Test Suite File | Module & Day Scope | Assertions | Result |
|:---|:---|:---:|:---:|
| [`server/test-auth.js`](https://github.com/ansariking51214/Smart-Hospital-management-system/blob/main/server/test-auth.js) | M1 Day 2: JWT Auth, Hashing, Token Tampering | 23 | ✅ **100% PASS** |
| [`server/test-rbac.js`](https://github.com/ansariking51214/Smart-Hospital-management-system/blob/main/server/test-rbac.js) | M1 Day 3: RBAC Matrix, Route Guards & Admin | 36 | ✅ **100% PASS** |
| [`server/test-patient-registration.js`](https://github.com/ansariking51214/Smart-Hospital-management-system/blob/main/server/test-patient-registration.js) | M1 Day 4: Auto-MRN & Demographic Intake | 17 | ✅ **100% PASS** |
| [`server/test-medical-history.js`](https://github.com/ansariking51214/Smart-Hospital-management-system/blob/main/server/test-medical-history.js) | M1 Day 5: Multi-Criteria Search & Longitudinal EHR | 16 | ✅ **100% PASS** |
| [`server/test-doctor-roster.js`](https://github.com/ansariking51214/Smart-Hospital-management-system/blob/main/server/test-doctor-roster.js) | M2 Day 1: Doctor Profile & Shift Rostering | 18 | ✅ **100% PASS** |
| [`server/test-appointment-booking.js`](https://github.com/ansariking51214/Smart-Hospital-management-system/blob/main/server/test-appointment-booking.js) | M2 Day 2: Slot Booking Engine & OPD Scheduling | 18 | ✅ **100% PASS** |
| [`server/test-opd-queue.js`](https://github.com/ansariking51214/Smart-Hospital-management-system/blob/main/server/test-opd-queue.js) | **M2 Day 3: OPD Queue & Live Token Display** | 18 | ✅ **100% PASS** |
| **Total Test Coverage** | **All Modules (M1 Complete + M2 Days 1-3)** | **146 Assertions** | ✅ **100% Passed** |

---

## ⚡ Quick Start & Setup Guide

### 1. Backend Server Setup
```powershell
cd server
npm install
npx prisma generate
npx prisma db push
node prisma/seed.js

# Run All 7 Automated Test Suites (146 Assertions):
node test-auth.js
node test-rbac.js
node test-patient-registration.js
node test-medical-history.js
node test-doctor-roster.js
node test-appointment-booking.js
node test-opd-queue.js

# Start Backend Server (Port 5000):
npm run dev
```

### 2. Frontend Client Setup
```powershell
cd ../client
npm install
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

**Author:** [ansariking51214](https://github.com/ansariking51214)  
**Internship ID:** `ZYNVEX-CERT-110`  
**Repository:** [https://github.com/ansariking51214/Smart-Hospital-management-system](https://github.com/ansariking51214/Smart-Hospital-management-system)
