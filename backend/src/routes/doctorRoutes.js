import { Router } from 'express';
import {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctorRoster,
  getDoctorRosterStats,
} from '../controllers/doctorRosterController.js';
import { authenticateToken, requireRoles } from '../middleware/authMiddleware.js';
import {
  validateDoctorProfile,
  validateRosterUpdate,
} from '../middleware/validateDoctorRoster.js';

const router = Router();

// Public / Authenticated Doctor Roster Endpoints
router.get('/', getAllDoctors);
router.get('/stats/overview', getDoctorRosterStats);
router.get('/:id', getDoctorById);

// Admin Only: Onboard new doctor profile
router.post(
  '/',
  authenticateToken,
  requireRoles('ADMIN'),
  validateDoctorProfile,
  createDoctor
);

// Admin & Doctor: Update shift schedule & roster
router.put(
  '/:id/roster',
  authenticateToken,
  requireRoles('ADMIN', 'DOCTOR'),
  validateRosterUpdate,
  updateDoctorRoster
);

export default router;
