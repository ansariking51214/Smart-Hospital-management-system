/**
 * Appointment Status & Consultation Flow Validation Middleware
 * Module 2 - Day 5 Deliverable
 */

const ALLOWED_FLOW_STATUSES = [
  'SCHEDULED',
  'CHECKED_IN',
  'IN_QUEUE',
  'TRIAGED',
  'IN_CONSULTATION',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
];

export function validateStatusTransition(req, res, next) {
  const { status, cancellationReason } = req.body;

  if (!status || !ALLOWED_FLOW_STATUSES.includes(status.toUpperCase())) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_STATUS',
      message: `Invalid appointment status. Allowed: ${ALLOWED_FLOW_STATUSES.join(', ')}`,
    });
  }

  if (status.toUpperCase() === 'CANCELLED' && (!cancellationReason || cancellationReason.trim().length < 3)) {
    return res.status(400).json({
      success: false,
      code: 'CANCELLATION_REASON_REQUIRED',
      message: 'A valid cancellation reason (minimum 3 characters) is required when cancelling an appointment.',
    });
  }

  next();
}

export function validateConsultationNote(req, res, next) {
  const { chiefComplaint, clinicalFindings, diagnosis, treatmentPlan } = req.body;
  const errors = [];

  if (!diagnosis || diagnosis.trim().length < 2) {
    errors.push('Clinical diagnosis is required.');
  }

  if (!treatmentPlan || treatmentPlan.trim().length < 2) {
    errors.push('Treatment plan or prescription advice is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_FAILED',
      message: 'Consultation note validation failed.',
      errors,
    });
  }

  next();
}

export function validateFollowUp(req, res, next) {
  const { followUpDate, doctorId, timeSlot } = req.body;
  const errors = [];

  if (!followUpDate) {
    errors.push('Follow-up appointment date is required.');
  } else {
    const target = new Date(followUpDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(target.getTime()) || target < today) {
      errors.push('Follow-up date must be today or a future date.');
    }
  }

  if (!timeSlot || typeof timeSlot !== 'string') {
    errors.push('Time slot is required for follow-up booking.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_FAILED',
      message: 'Follow-up appointment validation failed.',
      errors,
    });
  }

  next();
}
