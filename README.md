# 🏥 Smart Hospital Management System (HMS)

> **Cloud-Based Healthcare Management & Clinical Operations Platform**  
> **Student / Intern Name:** Muhammad Tabish Ahmad  
> **Internship ID:** `ZYNVEX-CERT-1101`  
> **Repository:** [Smart-Hospital-management-system](https://github.com/ansariking51214/Smart-Hospital-management-system)

---

## 📌 Project Overview
The **Smart Hospital Management System (HMS)** is an enterprise-grade full-stack healthcare web application designed to automate clinical operations, outpatient scheduling, dynamic time slot booking, electronic health records (EHR), physician shift rostering, OPD live queue & token calling, nurse vitals triage desk & early warning scoring, physician consultation workstations & SOAP notes, pharmacy dispensing, inpatient bed tracking, and billing workflows.

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

### ✅ Module 2: Doctor Rostering & OPD Management (100% Completed)
| Day | Date | Focus Scope | Key Deliverables | Status |
|:---:|:---:|:---|:---|:---:|
| **Day 1** | Aug 31 / Sep 01 | Doctor Profile & Shift Rostering | Physician Onboarding, Shift Schedules, Weekly Rosters, Real-time Duty Board | ✅ **Completed** |
| **Day 2** | Sep 02 | Slot Booking Engine & OPD Scheduling | Dynamic Slot Generation, Collision Guard, Queue Token Issuance & Rescheduling | ✅ **Completed** |
| **Day 3** | Sep 03 | OPD Queue & Token Display System | Live Patient Calling Board, Sequential Tokens, TV Display Screen, Triage Desk | ✅ **Completed** |
| **Day 4** | Sep 04 | Nurse Vitals Triage Desk & Alerts | Pre-Consultation Vitals, Auto-BMI, NEWS Early Warning Severity Alerts (Green/Amber/Red) | ✅ **Completed** |
| **Day 5** | Sep 05 | Appointment Status & Consultation Flow | End-to-End Outpatient Lifecycle, Patient Check-In, Clinical SOAP Documentation | ✅ **Completed** |

---

### ✅ Module 3: EHR, SOAP Clinical Notes & e-Prescriptions with PDF Export (100% Completed)
| Day | Date | Focus Scope | Key Deliverables | Status |
|:---:|:---:|:---|:---|:---:|
| **Day 1** | Sep 07 | **Doctor Consultation UI & Clinical EHR** | **Physician Encounter Console, 360° Patient Snapshot, Vitals Radar, Critical Allergy Alerts & Outpatient Worklist** | ✅ **Completed & Verified** |
| **Day 2** | Sep 08 | **Clinical SOAP Notes** | **Structured Subjective, Objective, Assessment, Plan & Encounter Summary** | ✅ **Completed & Verified** |
| **Day 3** | Sep 09 | **ICD-10 & Allergy Interaction Alerts** | **Diagnostic Coding Catalog, Patient Allergy Screening, Drug-Drug Interaction Alert Engine** | ✅ **Completed & Verified** |
| **Day 4** | Sep 10 | **e-Prescribing Engine** | **Structured medication orders, server-side allergy/interaction safety gate, prescription numbering, audit trail & patient prescription history** | ✅ **Completed & Verified** |
| **Day 5** | Sep 11 | **Diagnostic Test Orders & PDF Export** | **Diagnostic test order requests (Lab/Radiology), specimen tracking, results entry, printable Prescription PDF & 360° EHR clinical summary** | ✅ **Completed & Verified** |

---

### ✅ Module 4: Pharmacy Stock, Inpatient (IPD) Bed Allocation, Integrated Billing & Final Deployment (100% Completed)
| Day | Date | Focus Scope | Key Deliverables | Status |
|:---:|:---:|:---|:---|:---:|
| **Day 1** | Sep 14 | **Pharmacy Medicine Inventory & Stock** | **Medicine SKU catalog CRUD, stock adjustment, reorder level warning alerts, multi-batch expiry tracking** | ✅ **Completed & Verified** |
| **Day 2** | Sep 15 | **Inpatient (IPD) Ward & Bed Matrix** | **Interactive Ward & Bed status grid (Available/Occupied/Maintenance), patient admission & discharge stay billing engine** | ✅ **Completed & Verified** |
| **Day 3** | Sep 16 | **Automated Billing Calculation Engine** | **Cross-module charge aggregation (Consultations + Tests + Medicines + IPD Bed Stay), subtotal, tax & discount computation** | ✅ **Completed & Verified** |
| **Day 4** | Sep 17 | **Printable PDF Invoice Generator** | **Invoice payment status tracking (PENDING/PARTIAL/PAID), payment recording modal, high-fidelity printable PDF layout** | ✅ **Completed & Verified** |
| **Day 5** | Sep 18 | **System Integration & Final Deployment** | **End-to-end integration diagnostic suite, full system UI integration, complete README documentation & GitHub deployment** | ✅ **Completed & Verified** |

---

## 💊 Module 4 Deliverables: Pharmacy, IPD Beds, Integrated Billing & Final Deployment

### 1. Pharmacy Medicine Stock & Inventory APIs (Day 1)
* **Controller:** [`server/src/controllers/pharmacyController.js`](https://github.com/ansariking51214/Smart-Hospital-management-system/blob/main/server/src/controllers/pharmacyController.js)
* **Routes:** [`server/src/routes/pharmacyRoutes.js`](https://github.com/ansariking51214/Smart-Hospital-management-system/blob/main/server/src/routes/pharmacyRoutes.js) mounted on `/api/pharmacy`

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/pharmacy/medicines` | Query medicine catalog with search and low-stock filter. |
| `POST` | `/api/pharmacy/medicines` | Add a new medicine SKU to inventory. |
| `PUT` | `/api/pharmacy/medicines/:id` | Update medicine stock quantity or details. |
| `DELETE` | `/api/pharmacy/medicines/:id` | Delete medicine record. |
| `GET` | `/api/pharmacy/batches` | List inventory batch records with expiry dates. |
| `POST` | `/api/pharmacy/batches` | Log new inventory batch & auto-update medicine stock. |
| `GET` | `/api/pharmacy/stats` | Pharmacy metrics (total items, low stock alerts, stock valuation). |

### 2. Inpatient (IPD) Ward & Bed Allocation Matrix APIs (Day 2)
* **Controller:** [`server/src/controllers/ipdController.js`](https://github.com/ansariking51214/Smart-Hospital-management-system/blob/main/server/src/controllers/ipdController.js)
* **Routes:** [`server/src/routes/ipdRoutes.js`](https://github.com/ansariking51214/Smart-Hospital-management-system/blob/main/server/src/routes/ipdRoutes.js) mounted on `/api/ipd`

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/ipd/wards` | Retrieve wards with bed count breakdowns. |
| `POST` | `/api/ipd/wards` | Create a new hospital ward. |
| `GET` | `/api/ipd/beds` | Retrieve beds matrix by ward ID or status. |
| `POST` | `/api/ipd/beds` | Add a bed to a ward with daily charge rate. |
| `POST` | `/api/ipd/allocations` | Admit patient to bed (transitions status to `OCCUPIED`). |
| `POST` | `/api/ipd/allocations/:id/discharge` | Discharge patient, calculate stay duration & bed charges. |
| `GET` | `/api/ipd/allocations/active` | Retrieve active inpatient admissions. |

### 3. Integrated Billing & Printable PDF Invoice APIs (Day 3 & Day 4)
* **Controller:** [`server/src/controllers/billingController.js`](https://github.com/ansariking51214/Smart-Hospital-management-system/blob/main/server/src/controllers/billingController.js)
* **Routes:** [`server/src/routes/billingRoutes.js`](https://github.com/ansariking51214/Smart-Hospital-management-system/blob/main/server/src/routes/billingRoutes.js) mounted on `/api/billing`

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/billing/unbilled-charges/:patientId` | Aggregates unbilled charges across Consultations, Lab Orders, Medicines, and IPD Bed Stay. |
| `POST` | `/api/billing/invoices` | Create official invoice with tax rate, discount, total amount, and balance due. |
| `GET` | `/api/billing/invoices` | List invoices with status filter (`PENDING`, `PARTIAL`, `PAID`). |
| `GET` | `/api/billing/invoices/:id` | Fetch single invoice details with line items. |
| `POST` | `/api/billing/invoices/:id/payment` | Record full/partial payment against an invoice. |
| `GET` | `/api/billing/invoices/:id/pdf-data` | Printable PDF invoice data structure. |

---

## 🧪 Automated Test Suite Coverage (100% Passed)

| Test Suite File | Module & Day Scope | Assertions | Result |
|:---|:---|:---:|:---:|
| [`server/test-auth.js`](https://github.com/ansariking51214/Smart-Hospital-management-system/blob/main/server/test-auth.js) | M1 Day 2: JWT Auth, Hashing, Token Tampering | 23 | ✅ **100% PASS** |
| [`server/test-rbac.js`](https://github.com/ansariking51214/Smart-Hospital-management-system/blob/main/server/test-rbac.js) | M1 Day 3: RBAC Matrix, Route Guards & Admin | 36 | ✅ **100% PASS** |
| [`server/test-patient-registration.js`](https://github.com/ansariking51214/Smart-Hospital-management-system/blob/main/server/test-patient-registration.js) | M1 Day 4: Auto-MRN & Demographic Intake | 17 | ✅ **100% PASS** |
| [`server/test-medical-history.js`](https://github.com/ansariking51214/Smart-Hospital-management-system/blob/main/server/test-medical-history.js) | M1 Day 5: Multi-Criteria Search & Longitudinal EHR | 16 | ✅ **100% PASS** |
| [`server/test-doctor-roster.js`](https://github.com/ansariking51214/Smart-Hospital-management-system/blob/main/server/test-doctor-roster.js) | M2 Day 1: Doctor Profile & Shift Rostering | 18 | ✅ **100% PASS** |
| [`server/test-appointment-booking.js`](https://github.com/ansariking51214/Smart-Hospital-management-system/blob/main/server/test-appointment-booking.js) | M2 Day 2: Slot Booking Engine & OPD Scheduling | 18 | ✅ **100% PASS** |
| [`server/test-opd-queue.js`](https://github.com/ansariking51214/Smart-Hospital-management-system/blob/main/server/test-opd-queue.js) | M2 Day 3: OPD Queue & Live Token Display | 18 | ✅ **100% PASS** |
| [`server/test-nurse-triage.js`](https://github.com/ansariking51214/Smart-Hospital-management-system/blob/main/server/test-nurse-triage.js) | M2 Day 4: Nurse Vitals Triage & Early Warning Alerts | 14 | ✅ **100% PASS** |
| [`server/test-appointment-flow.js`](https://github.com/ansariking51214/Smart-Hospital-management-system/blob/main/server/test-appointment-flow.js) | M2 Day 5: Appointment Status & Consultation Flow | 16 | ✅ **100% PASS** |
| [`server/test-doctor-consultation.js`](https://github.com/ansariking51214/Smart-Hospital-management-system/blob/main/server/test-doctor-consultation.js) | M3 Day 1: Doctor Consultation UI & Clinical Workspace | 17 | ✅ **100% PASS** |
| [`server/test-soap-notes.js`](https://github.com/ansariking51214/Smart-Hospital-management-system/blob/main/server/test-soap-notes.js) | M3 Day 2: Clinical SOAP Notes & Encounter Finalization | 23 | ✅ **100% PASS** |
| [`server/test-clinical-safety.js`](https://github.com/ansariking51214/Smart-Hospital-management-system/blob/main/server/test-clinical-safety.js) | M3 Day 3: ICD-10, Allergy & Drug Interaction Safety | 8 | ✅ **100% PASS** |
| [`server/test-lab-orders.js`](https://github.com/ansariking51214/Smart-Hospital-management-system/blob/main/server/test-lab-orders.js) | M3 Day 5: Diagnostic Orders (Lab/Radiology) & PDF Export | 29 | ✅ **100% PASS** |
| [`server/test-pharmacy.js`](https://github.com/ansariking51214/Smart-Hospital-management-system/blob/main/server/test-pharmacy.js) | **M4 Day 1: Pharmacy Stock & Inventory Batches** | 6 | ✅ **100% PASS** |
| [`server/test-ipd.js`](https://github.com/ansariking51214/Smart-Hospital-management-system/blob/main/server/test-ipd.js) | **M4 Day 2: IPD Ward & Bed Allocation Matrix** | 7 | ✅ **100% PASS** |
| [`server/test-billing.js`](https://github.com/ansariking51214/Smart-Hospital-management-system/blob/main/server/test-billing.js) | **M4 Day 3 & 4: Integrated Billing & PDF Invoices** | 7 | ✅ **100% PASS** |
| [`server/test-module4.js`](https://github.com/ansariking51214/Smart-Hospital-management-system/blob/main/server/test-module4.js) | **M4 Day 5: Master Integration Verification Suite** | Master | ✅ **100% PASS** |
| **Total Test Coverage** | **All 4 Modules (Modules 1, 2, 3 & 4 100% Complete)** | **273 Assertions** | ✅ **100% Passed** |

---

## ⚡ Quick Start & Setup Guide

### 1. Backend Server Setup
```powershell
cd server
npm install
npx prisma generate
npx prisma db push
node prisma/seed.js

# Run Master Module 4 Verification Test Suite:
node test-module4.js

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
**Internship ID:** `ZYNVEX-CERT-1101`  
**Repository:** [https://github.com/ansariking51214/Smart-Hospital-management-system](https://github.com/ansariking51214/Smart-Hospital-management-system)
