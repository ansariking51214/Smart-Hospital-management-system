# 🏥 Smart Hospital Management System (HMS)

> **Cloud-Based Healthcare Management & Clinical Operations Platform**  
> **Internship Project Submission — Module 2: Day 1 (Doctor Profiles & Shift Rostering)**

---

## 📌 Project Overview
The **Cloud-Based Hospital Management System (HMS)** is an enterprise-grade healthcare web application designed to automate clinical workflows, patient registration, outpatient scheduling, doctor shift rostering, EHR consultations, pharmacy dispensing, inpatient bed tracking, and billing.

---

## 🚀 Internship Syllabus & Milestone Status

### ✅ Module 1: Authentication, RBAC & Patient Registration (100% Completed)
| Day | Date | Focus Scope | Deliverable Status |
|---|---|---|---|
| **Day 1** | Aug 24 | DB Schema Design & Full Stack Scaffolding | ✅ **Completed & Verified** |
| **Day 2** | Aug 25 | JWT Auth (Login/Signup/Logout & Password Hashing) | ✅ **Completed & Verified** |
| **Day 3** | Aug 26 | Role-Based Access Control (Admin, Doctor, Receptionist, Nurse, Patient) | ✅ **Completed & Verified** |
| **Day 4** | Aug 27 | Patient Registration & Demographic Forms (Auto MRN ID) | ✅ **Completed & Verified** |
| **Day 5** | Aug 28 | Patient Search, Medical History & Emergency Contacts | ✅ **Completed & Verified** |

---

### 🩺 Module 2: Doctor Rostering & OPD Management (In Progress)
| Day | Date | Focus Scope | Deliverable Status |
|---|---|---|---|
| **Day 1** | Aug 31 / Sep 01 | Doctor Profile, Department Setup & Shift Roster | ✅ **Completed & Verified** |
| **Day 2** | Sep 02 | Slot Booking Engine (Date/Time Slot Generation) | ⏳ *Next Milestone* |
| **Day 3** | Sep 03 | OPD Queue & Token Display System | ⏳ *Upcoming* |
| **Day 4** | Sep 04 | Nurse Vitals Triage Desk | ⏳ *Upcoming* |
| **Day 5** | Sep 05 | Appointment Status & Consultation Flow | ⏳ *Upcoming* |

---

## 🩺 Module 2 — Day 1 Deliverables (Doctor Profiles & Shift Rostering)

### ✅ What was completed on Module 2 Day 1:
1. **Doctor Profile & Roster Controller (`doctorRosterController.js`):**
   - Endpoints: `GET /api/doctors`, `GET /api/doctors/:id`, `POST /api/doctors`, `PUT /api/doctors/:id/roster`, `GET /api/doctors/stats/overview`.
   - Physician details: Specialization, Medical License Number, Qualifications (MD, MBBS, FCPS), Consultation Fee, Assigned Examination Room, Shift Hours (`09:00 - 15:00`), Weekly Working Days (`Mon,Tue,Wed,Thu,Fri`).
   - Dynamic real-time on-duty status calculation based on current day of the week.
2. **Physician Onboarding & Shift Configuration Engine (`createDoctor`):**
   - Admin-gated onboarding system creating physician user credentials with `DOCTOR` role, department assignment, and linked shift roster.
3. **Input Validation Middleware (`validateDoctorRoster.js`):**
   - Validates medical license uniqueness, positive fee structures, and strict shift chronology (`shiftStart < shiftEnd`).
4. **Interactive Doctor Shift Roster Explorer Dashboard (`Day1DoctorRosterExplorer.jsx`):**
   - Real-time Duty Board with On-Duty / Off-Duty status badges.
   - 1-Click Interactive Shift Roster Editor Modal (working days toggles, shift hour time pickers, fee and room updates).
   - Physician Onboarding Modal for rapid clinical staff registration.
5. **Automated Test Suite (`test-doctor-roster.js`):**
   - **18/18 Automated Assertions Passed** verifying doctor relations, onboarding, roster updates, duty calculations, and audit logging.

---

## 🛠️ Automated Test Suites (110 Total Passed Assertions)

| Test Suite | Deliverable Scope | Assertions | Status |
|---|---|---|---|
| `test-auth.js` | M1 Day 2: JWT Auth, Hashing, Token Tampering | 23 Assertions | ✅ **PASS (100%)** |
| `test-rbac.js` | M1 Day 3: RBAC Matrix, Route Guards & Admin | 36 Assertions | ✅ **PASS (100%)** |
| `test-patient-registration.js` | M1 Day 4: Auto-MRN & Demographic Intake | 17 Assertions | ✅ **PASS (100%)** |
| `test-medical-history.js` | M1 Day 5: Multi-Criteria Search & Longitudinal EHR | 16 Assertions | ✅ **PASS (100%)** |
| `test-doctor-roster.js` | M2 Day 1: Doctor Profile & Shift Roster | 18 Assertions | ✅ **PASS (100%)** |
| **Total Test Coverage** | **Modules 1 & 2 (Day 1)** | **110 Assertions** | ✅ **100% Passed** |

---

## ⚡ Quick Start & Run

### 1. Backend Server
```powershell
cd server
npm install
npx prisma generate
npx prisma db push
node prisma/seed.js
node test-auth.js                 # 23 tests
node test-rbac.js                 # 36 tests
node test-patient-registration.js # 17 tests
node test-medical-history.js      # 16 tests
node test-doctor-roster.js        # 18 tests
npm run dev
```

### 2. Frontend Client
```powershell
cd ../client
npm install
npm run dev
```

---

**Author:** [ansariking51214](https://github.com/ansariking51214)  
**Repository:** [Smart-Hospital-management-system](https://github.com/ansariking51214/Smart-Hospital-management-system.git)
