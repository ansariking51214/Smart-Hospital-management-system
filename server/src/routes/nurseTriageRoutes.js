import { Router } from 'express';
import {
  recordVitalSigns,
  getTriageDeskQueue,
  getPatientVitalsHistory,
  getTriageStats,
} from '../controllers/nurseTriageController.js';
import { authenticateToken, requireRoles } from '../middleware/authMiddleware.js';
import { validateVitalsInput } from '../middleware/validateNurseTriage.js';

const router = Router();

// 1. Triage Desk Overview Stats
router.get('/stats/overview', getTriageStats);

// 2. Triage Waiting Queue (Patients needing vitals before consultation)
router.get('/queue', authenticateToken, getTriageDeskQueue);

// 3. Record Vitals & Calculate BMI / Triage Severity (Nurses, Doctors, Admins)
router.post(
  '/vitals',
  authenticateToken,
  requireRoles('NURSE', 'DOCTOR', 'ADMIN'),
  validateVitalsInput,
  recordVitalSigns
);

// 4. Longitudinal Vitals History for a Patient
router.get(
  '/patient/:patientId/history',
  authenticateToken,
  getPatientVitalsHistory
);

export default router;
