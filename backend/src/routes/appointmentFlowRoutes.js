import { Router } from 'express';
import {
  updateAppointmentStatus,
  recordConsultationNote,
  getAppointmentTimeline,
  scheduleFollowUp,
  getFlowBoardAppointments,
  getLifecycleStats,
} from '../controllers/appointmentFlowController.js';
import { authenticateToken, requireRoles } from '../middleware/authMiddleware.js';
import {
  validateStatusTransition,
  validateConsultationNote,
  validateFollowUp,
} from '../middleware/validateAppointmentFlow.js';

const router = Router();

// 1. Lifecycle Stats Overview
router.get('/stats/lifecycle', getLifecycleStats);

// 2. OPD Floor Kanban Board Pipeline
router.get('/board', authenticateToken, getFlowBoardAppointments);

// 3. Update Status / Transition Lifecycle Stage
router.patch(
  '/:id/status',
  authenticateToken,
  validateStatusTransition,
  updateAppointmentStatus
);

// 4. Record Clinical Consultation Note (Doctors)
router.post(
  '/:id/consultation-note',
  authenticateToken,
  requireRoles('DOCTOR', 'ADMIN'),
  validateConsultationNote,
  recordConsultationNote
);

// 5. Longitudinal Appointment Journey Timeline
router.get('/:id/timeline', authenticateToken, getAppointmentTimeline);

// 6. Schedule Follow-up Appointment
router.post(
  '/:id/schedule-followup',
  authenticateToken,
  validateFollowUp,
  scheduleFollowUp
);

export default router;
