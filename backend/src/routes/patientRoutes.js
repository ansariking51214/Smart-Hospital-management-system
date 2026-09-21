import { Router } from 'express';
import {
  registerPatient,
  getAllPatients,
  getPatientByIdOrMrn,
  updatePatient,
  getPatientStatsOverview,
} from '../controllers/patientController.js';
import { authenticateToken, optionalAuth, requireRoles } from '../middleware/authMiddleware.js';
import { validatePatientRegistration } from '../middleware/validatePatient.js';

const router = Router();

// 1. Patient Registration (Front desk reception intake or self-registration)
router.post('/register', optionalAuth, validatePatientRegistration, registerPatient);

// 2. Statistics Overview (Staff only)
router.get(
  '/stats/overview',
  authenticateToken,
  requireRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE'),
  getPatientStatsOverview
);

// 3. Patient Directory List with Search & Filtering (Staff only)
router.get(
  '/',
  authenticateToken,
  requireRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE'),
  getAllPatients
);

// 4. Single Patient Profile by ID or MRN
router.get('/:idOrMrn', authenticateToken, getPatientByIdOrMrn);

// 5. Update Patient Demographics (Receptionist or Admin only)
router.put('/:id', authenticateToken, requireRoles('ADMIN', 'RECEPTIONIST'), updatePatient);

export default router;
