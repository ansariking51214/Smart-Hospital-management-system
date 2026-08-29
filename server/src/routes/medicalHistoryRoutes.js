import { Router } from 'express';
import {
  searchPatients,
  getPatientMedicalHistory,
  updateMedicalBaseline,
  updateEmergencyContact,
} from '../controllers/medicalHistoryController.js';
import { authenticateToken, requireRoles } from '../middleware/authMiddleware.js';

const router = Router();

// 1. Advanced Multi-Criteria Patient Search (Staff access)
router.get(
  '/search',
  authenticateToken,
  requireRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE', 'PHARMACIST'),
  searchPatients
);

// 2. Comprehensive Longitudinal Medical History & Clinical Timeline
router.get('/patient/:idOrMrn', authenticateToken, getPatientMedicalHistory);

// 3. Update Patient Medical Baseline (Allergies & Chronic Diseases)
router.patch(
  '/patient/:id/medical-baseline',
  authenticateToken,
  requireRoles('ADMIN', 'DOCTOR', 'NURSE'),
  updateMedicalBaseline
);

// 4. Update Emergency Contact & Guardian
router.patch(
  '/patient/:id/emergency-contact',
  authenticateToken,
  requireRoles('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'PATIENT'),
  updateEmergencyContact
);

export default router;
