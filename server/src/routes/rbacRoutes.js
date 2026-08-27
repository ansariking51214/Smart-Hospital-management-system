import { Router } from 'express';
import {
  getRoleMatrix,
  getSystemUsers,
  updateUserRole,
  updateUserStatus,
  testAdminResource,
  testDoctorResource,
  testReceptionistResource,
  testNurseResource,
  testPatientResource,
} from '../controllers/rbacController.js';
import { authenticateToken, requireRoles } from '../middleware/authMiddleware.js';

const router = Router();

// Public / General RBAC Information
router.get('/matrix', getRoleMatrix);

// Admin-Only User Management Endpoints
router.get('/users', authenticateToken, requireRoles('ADMIN'), getSystemUsers);
router.patch('/users/:id/role', authenticateToken, requireRoles('ADMIN'), updateUserRole);
router.patch('/users/:id/status', authenticateToken, requireRoles('ADMIN'), updateUserStatus);

// Role-Guarded Route Testing Endpoints
router.get('/guard/admin', authenticateToken, requireRoles('ADMIN'), testAdminResource);
router.get('/guard/doctor', authenticateToken, requireRoles('DOCTOR', 'ADMIN'), testDoctorResource);
router.get('/guard/receptionist', authenticateToken, requireRoles('RECEPTIONIST', 'ADMIN'), testReceptionistResource);
router.get('/guard/nurse', authenticateToken, requireRoles('NURSE', 'ADMIN'), testNurseResource);
router.get('/guard/patient', authenticateToken, requireRoles('PATIENT', 'ADMIN'), testPatientResource);

export default router;
