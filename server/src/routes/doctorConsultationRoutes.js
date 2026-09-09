import { Router } from 'express';
import {
  getActivePatientEhrSnapshot,
  getDoctorWorklist,
  startClinicalEncounter,
  getPatientHistoryDrawer,
  getConsultationStats,
  createOrUpdateSoapNote,
  getPatientSoapNotes,
  getSoapNoteById,
  finalizeSoapEncounter,
  getSoapMacrosAndTemplates,
  deleteSoapNoteDraft,
  getClinicalCatalog,
  checkClinicalSafety,
} from '../controllers/doctorConsultationController.js';
import { authenticateToken, requireRoles } from '../middleware/authMiddleware.js';
import {
  validateStartEncounter,
  validatePatientIdParam,
  validateSoapNoteInput,
  validateSoapNoteIdParam,
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

// -------------------------------------------------------------
// MODULE 3 - DAY 2: CLINICAL SOAP NOTES & ENCOUNTER FINALIZATION
// -------------------------------------------------------------

// MODULE 3 - DAY 3: ICD-10 CATALOG & CLINICAL SAFETY ALERTS
router.get('/clinical-catalog', authenticateToken, requireRoles('DOCTOR', 'ADMIN'), getClinicalCatalog);
router.post('/clinical-safety/check', authenticateToken, requireRoles('DOCTOR', 'ADMIN'), checkClinicalSafety);

// 6. Get Clinical SOAP Documentation Templates & Macros
router.get('/soap-notes/templates', getSoapMacrosAndTemplates);

// 7. Get SOAP Notes History for Patient
router.get(
  '/soap-notes/patient/:patientId',
  authenticateToken,
  validatePatientIdParam,
  getPatientSoapNotes
);

// 8. Create Clinical SOAP Note
router.post(
  '/soap-notes',
  authenticateToken,
  requireRoles('DOCTOR', 'ADMIN'),
  validateSoapNoteInput,
  createOrUpdateSoapNote
);

// 9. Get Single SOAP Note by ID
router.get(
  '/soap-notes/:id',
  authenticateToken,
  validateSoapNoteIdParam,
  getSoapNoteById
);

// 10. Update Clinical SOAP Note
router.put(
  '/soap-notes/:id',
  authenticateToken,
  requireRoles('DOCTOR', 'ADMIN'),
  validateSoapNoteIdParam,
  validateSoapNoteInput,
  createOrUpdateSoapNote
);

// 11. Finalize Clinical Encounter & Sign SOAP Note
router.post(
  '/soap-notes/:id/finalize',
  authenticateToken,
  requireRoles('DOCTOR', 'ADMIN'),
  validateSoapNoteIdParam,
  finalizeSoapEncounter
);

// 12. Delete Draft SOAP Note
router.delete(
  '/soap-notes/:id',
  authenticateToken,
  requireRoles('DOCTOR', 'ADMIN'),
  validateSoapNoteIdParam,
  deleteSoapNoteDraft
);

export default router;

