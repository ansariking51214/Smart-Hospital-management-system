import { Router } from 'express';
import {
  register,
  login,
  logout,
  getMe,
  changePassword,
  inspectToken,
  getAuthAuditLogs,
} from '../controllers/authController.js';
import { authenticateToken, optionalAuth } from '../middleware/authMiddleware.js';
import {
  validateRegister,
  validateLogin,
  validateChangePassword,
} from '../middleware/validateAuth.js';

const router = Router();

// Public auth endpoints
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/logout', optionalAuth, logout);
router.post('/inspect-token', inspectToken);
router.get('/audit-logs', getAuthAuditLogs);

// Protected auth endpoints (requires valid JWT token)
router.get('/me', authenticateToken, getMe);
router.post('/change-password', authenticateToken, validateChangePassword, changePassword);

export default router;
