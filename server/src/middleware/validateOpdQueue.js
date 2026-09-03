/**
 * OPD Queue & Token Input Validation Middleware
 * Module 2 - Day 3 Deliverable
 */

const VALID_QUEUE_STATUSES = [
  'WAITING',
  'CALLED',
  'IN_CONSULTATION',
  'COMPLETED',
  'SKIPPED',
  'NO_SHOW',
  'CANCELLED',
];

export function validateCallNext(req, res, next) {
  const { doctorId } = req.body;

  if (!doctorId || typeof doctorId !== 'string') {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_FAILED',
      message: 'Doctor ID is required to call the next patient in line.',
    });
  }

  next();
}

export function validateTokenStatusUpdate(req, res, next) {
  const { status } = req.body;

  if (!status || !VALID_QUEUE_STATUSES.includes(status.toUpperCase())) {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_FAILED',
      message: `Invalid queue status. Allowed: ${VALID_QUEUE_STATUSES.join(', ')}`,
    });
  }

  next();
}

export function validateWalkInToken(req, res, next) {
  const { doctorId, patientId, patientMrn, reasonForVisit = 'Walk-in Consultation' } = req.body;
  const errors = [];

  if (!doctorId) {
    errors.push('Target Doctor selection is required for walk-in token issuance.');
  }

  if (!patientId && !patientMrn) {
    errors.push('Patient ID or Patient MRN is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_FAILED',
      message: 'Walk-in token validation failed.',
      errors,
    });
  }

  next();
}
