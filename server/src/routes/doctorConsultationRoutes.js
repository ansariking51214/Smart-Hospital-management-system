import { Router } from 'express';
import {
  getActivePatientEhrSnapshot,
  getDoctorWorklist,
  startClinicalEncounter,
  getPatientHistoryDrawer,
  getConsultationStats,
} from '../controllers/doctorConsultationController.js';
import { authenticateToken, requireRoles } from '../middleware/authMiddleware.js';
import {
  validateStartEncounter,
  validatePatientIdParam,
} from '../middleware/validateDoctorConsultation.js';

const router = Router();

// 1. Doctor Consultation Stats
router.get('/stats/overview', getConsultationStats);

// 2. Doctor Daily Worklist / Patient Queue
router.get(
  '/doctor-worklist',
  authenticateToken,
  requireRoles('DOCTOR', 'ADMIN'),
  getDoctorWorklist
);

// 3. 360° Active Patient Clinical Snapshot (EHR)
router.get(
  '/active-patient/:patientId',
  authenticateToken,
  validatePatientIdParam,
  getActivePatientEhrSnapshot
);

// 4. Start Clinical Encounter
router.post(
  '/encounter/start',
  authenticateToken,
  requireRoles('DOCTOR', 'ADMIN'),
  validateStartEncounter,
  startClinicalEncounter
);

// 5. Patient Previous Consultation History Drawer
router.get(
  '/patient/:patientId/history-drawer',
  authenticateToken,
  validatePatientIdParam,
  getPatientHistoryDrawer
);

export default router;
