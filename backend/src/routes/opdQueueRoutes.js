import { Router } from 'express';
import {
  getLiveQueueBoard,
  callNextPatient,
  updateTokenStatus,
  issueWalkInToken,
  getQueueStats,
} from '../controllers/opdQueueController.js';
import { authenticateToken, requireRoles } from '../middleware/authMiddleware.js';
import {
  validateCallNext,
  validateTokenStatusUpdate,
  validateWalkInToken,
} from '../middleware/validateOpdQueue.js';

const router = Router();

// 1. Live Public / Waiting Area Queue Display Board
router.get('/live', getLiveQueueBoard);

// 2. Queue Overview Statistics
router.get('/stats/overview', getQueueStats);

// 3. Call Next Waiting Patient (Doctors & Receptionists)
router.post(
  '/call-next',
  authenticateToken,
  requireRoles('DOCTOR', 'RECEPTIONIST', 'ADMIN', 'NURSE'),
  validateCallNext,
  callNextPatient
);

// 4. Update Token Status (IN_CONSULTATION, COMPLETED, SKIPPED, RECALLED)
router.patch(
  '/token/:id/status',
  authenticateToken,
  requireRoles('DOCTOR', 'RECEPTIONIST', 'ADMIN', 'NURSE'),
  validateTokenStatusUpdate,
  updateTokenStatus
);

// 5. Issue Walk-in OPD Token (Receptionist Desk)
router.post(
  '/issue-walkin',
  authenticateToken,
  requireRoles('RECEPTIONIST', 'ADMIN', 'NURSE'),
  validateWalkInToken,
  issueWalkInToken
);

export default router;
