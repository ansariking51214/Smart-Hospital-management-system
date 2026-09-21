/**
 * Doctor Roster & Profile Input Validation Middleware
 * Module 2 - Day 1 Deliverable
 */

const VALID_DUTY_STATUSES = ['AVAILABLE', 'ON_LEAVE', 'IN_SURGERY', 'OFF_DUTY', 'Available', 'On Leave', 'In Surgery', 'Off Duty'];

export function validateDoctorProfile(req, res, next) {
  const {
    fullName,
    email,
    specialization,
    licenseNumber,
    qualification,
    consultationFee,
    shiftStart,
    shiftEnd,
  } = req.body;

  const errors = [];

  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
    errors.push('Doctor full name is required (minimum 2 characters).');
  }

  if (!specialization || typeof specialization !== 'string' || specialization.trim().length < 2) {
    errors.push('Specialization is required.');
  }

  if (!licenseNumber || typeof licenseNumber !== 'string' || licenseNumber.trim().length < 3) {
    errors.push('Medical License Number is required (min 3 characters).');
  }

  if (!qualification || typeof qualification !== 'string' || qualification.trim().length < 2) {
    errors.push('Medical qualification (e.g. MBBS, MD, FCPS) is required.');
  }

  if (consultationFee !== undefined && (isNaN(Number(consultationFee)) || Number(consultationFee) < 0)) {
    errors.push('Consultation fee must be a valid positive number.');
  }

  if (shiftStart && shiftEnd && shiftStart >= shiftEnd) {
    errors.push('Shift start time must be before shift end time.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_FAILED',
      message: 'Doctor profile validation failed.',
      errors,
    });
  }

  next();
}

export function validateRosterUpdate(req, res, next) {
  const { consultationFee, shiftStart, shiftEnd, availableDays } = req.body;
  const errors = [];

  if (consultationFee !== undefined && (isNaN(Number(consultationFee)) || Number(consultationFee) < 0)) {
    errors.push('Consultation fee must be a valid positive number.');
  }

  if (shiftStart && shiftEnd && shiftStart >= shiftEnd) {
    errors.push('Shift start time must be before shift end time.');
  }

  if (availableDays && typeof availableDays !== 'string') {
    errors.push('Available days must be a comma-separated string (e.g. "Mon,Tue,Wed").');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_FAILED',
      message: 'Roster update validation failed.',
      errors,
    });
  }

  next();
}
