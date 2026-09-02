/**
 * Appointment & Slot Booking Validation Middleware
 * Module 2 - Day 2 Deliverable
 */

const VALID_TYPES = ['OPD', 'FOLLOW_UP', 'EMERGENCY', 'ROUTINE', 'CONSULTATION'];

export function validateSlotQuery(req, res, next) {
  const { doctorId, date } = req.query;
  const errors = [];

  if (!doctorId || typeof doctorId !== 'string') {
    errors.push('Doctor ID is required to generate available time slots.');
  }

  if (!date || isNaN(Date.parse(date))) {
    errors.push('A valid target date (YYYY-MM-DD) is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_FAILED',
      message: 'Slot query validation failed.',
      errors,
    });
  }

  next();
}

export function validateBookingRequest(req, res, next) {
  const {
    doctorId,
    patientId,
    patientMrn,
    appointmentDate,
    timeSlot,
    type = 'OPD',
  } = req.body;

  const errors = [];

  if (!doctorId) {
    errors.push('Doctor selection is required.');
  }

  if (!patientId && !patientMrn) {
    errors.push('Patient ID or Patient MRN is required for appointment booking.');
  }

  if (!appointmentDate || isNaN(Date.parse(appointmentDate))) {
    errors.push('A valid appointment date is required.');
  } else {
    const apptDate = new Date(appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    apptDate.setHours(0, 0, 0, 0);

    if (apptDate < today) {
      errors.push('Appointment date cannot be in the past.');
    }
  }

  if (!timeSlot || typeof timeSlot !== 'string' || !timeSlot.includes('-')) {
    errors.push('Valid time slot format is required (e.g. "10:00 - 10:30").');
  }

  if (type && !VALID_TYPES.includes(type.toUpperCase())) {
    errors.push(`Invalid appointment type. Allowed: ${VALID_TYPES.join(', ')}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_FAILED',
      message: 'Appointment booking validation failed.',
      errors,
    });
  }

  next();
}

export function validateRescheduleRequest(req, res, next) {
  const { appointmentDate, timeSlot } = req.body;
  const errors = [];

  if (!appointmentDate || isNaN(Date.parse(appointmentDate))) {
    errors.push('New appointment date is required.');
  }

  if (!timeSlot || typeof timeSlot !== 'string' || !timeSlot.includes('-')) {
    errors.push('Valid new time slot format is required (e.g. "11:00 - 11:30").');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_FAILED',
      message: 'Reschedule validation failed.',
      errors,
    });
  }

  next();
}
