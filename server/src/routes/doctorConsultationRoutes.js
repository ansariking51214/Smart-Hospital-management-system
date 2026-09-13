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
  createPrescription,
  getPatientPrescriptions,
  getDiagnosticCatalogHandler,
  createLabOrders,
  getPatientLabOrders,
  getAllLabOrders,
  getLabOrderById,
  updateLabOrderStatus,
  exportPrescriptionPdfHtml,
  getPatientClinicalSummary,
  exportClinicalSummaryPdfHtml,
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

// MODULE 3 - DAY 4: ELECTRONIC PRESCRIBING
router.post('/prescriptions', authenticateToken, requireRoles('DOCTOR', 'ADMIN'), createPrescription);
router.get('/prescriptions/patient/:patientId', authenticateToken, requireRoles('DOCTOR', 'ADMIN'), getPatientPrescriptions);

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

// -------------------------------------------------------------
// MODULE 3 - DAY 5: DIAGNOSTIC LAB/RADIOLOGY ORDERS & PDF EXPORT
// -------------------------------------------------------------

// Diagnostic Lab & Radiology Test Catalog
router.get('/lab-orders/catalog', authenticateToken, getDiagnosticCatalogHandler);

// Create Diagnostic Lab/Radiology Orders
router.post(
  '/lab-orders',
  authenticateToken,
  requireRoles('DOCTOR', 'ADMIN'),
  createLabOrders
);

// Get Patient Diagnostic Orders
router.get(
  '/lab-orders/patient/:patientId',
  authenticateToken,
  validatePatientIdParam,
  getPatientLabOrders
);

// Get All Diagnostic Orders (Hospital/Lab queue)
router.get(
  '/lab-orders',
  authenticateToken,
  requireRoles('DOCTOR', 'ADMIN', 'NURSE'),
  getAllLabOrders
);

// Get Single Lab Order by ID
router.get(
  '/lab-orders/:id',
  authenticateToken,
  getLabOrderById
);

// Update Lab Order Status & Results
router.patch(
  '/lab-orders/:id/status',
  authenticateToken,
  requireRoles('DOCTOR', 'ADMIN', 'NURSE'),
  updateLabOrderStatus
);

// Printable Prescription PDF Export
router.get('/prescriptions/:id/pdf', exportPrescriptionPdfHtml);

// 360° Comprehensive Clinical EHR Summary (Data)
router.get(
  '/patient/:patientId/clinical-summary',
  authenticateToken,
  validatePatientIdParam,
  getPatientClinicalSummary
);

// Export 360° Clinical Encounter & Discharge Summary (Printable HTML / PDF)
router.get(
  '/patient/:patientId/clinical-summary/export',
  validatePatientIdParam,
  exportClinicalSummaryPdfHtml
);

export default router;

