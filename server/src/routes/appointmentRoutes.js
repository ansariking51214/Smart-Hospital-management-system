import { Router } from 'express';
import {
  getDoctorAvailableSlots,
  bookAppointment,
  getAppointments,
  rescheduleAppointment,
  cancelAppointment,
  getBookingStats,
} from '../controllers/appointmentBookingController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import {
  validateSlotQuery,
  validateBookingRequest,
  validateRescheduleRequest,
} from '../middleware/validateAppointmentBooking.js';

const router = Router();

// 1. Dynamic Time Slot Generator for Doctor & Target Date
router.get('/slots', validateSlotQuery, getDoctorAvailableSlots);

// 2. Booking Metrics Overview
router.get('/stats/overview', getBookingStats);

// 3. List & Filter Appointments
router.get('/', authenticateToken, getAppointments);

// 4. Book a new appointment
router.post('/book', authenticateToken, validateBookingRequest, bookAppointment);

// 5. Reschedule an appointment
router.patch(
  '/:id/reschedule',
  authenticateToken,
  validateRescheduleRequest,
  rescheduleAppointment
);

// 6. Cancel an appointment
router.patch('/:id/cancel', authenticateToken, cancelAppointment);

export default router;
