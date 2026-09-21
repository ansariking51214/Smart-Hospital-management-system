/**
 * Patient Demographic Validation Middleware
 * Module 1 - Day 4 Deliverable
 */

const VALID_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN'];
const VALID_GENDERS = ['MALE', 'FEMALE', 'OTHER', 'Male', 'Female', 'Other'];

export function validatePatientRegistration(req, res, next) {
  const {
    firstName,
    lastName,
    gender,
    dateOfBirth,
    phone,
    bloodGroup,
    emergencyContactName,
    emergencyContactPhone,
    emergencyContactRelation,
  } = req.body;

  const errors = [];

  // Required Demographics
  if (!firstName || typeof firstName !== 'string' || firstName.trim().length < 2) {
    errors.push('First name is required (minimum 2 characters).');
  }

  if (!lastName || typeof lastName !== 'string' || lastName.trim().length < 2) {
    errors.push('Last name is required (minimum 2 characters).');
  }

  if (!gender || !VALID_GENDERS.includes(gender)) {
    errors.push(`Valid gender is required (MALE, FEMALE, OTHER).`);
  }

  // Date of birth validation
  if (!dateOfBirth) {
    errors.push('Date of birth is required.');
  } else {
    const dobDate = new Date(dateOfBirth);
    if (isNaN(dobDate.getTime())) {
      errors.push('Date of birth must be a valid date (YYYY-MM-DD).');
    } else if (dobDate > new Date()) {
      errors.push('Date of birth cannot be in the future.');
    }
  }

  // Contact validation
  if (!phone || typeof phone !== 'string' || phone.trim().length < 7) {
    errors.push('Valid primary contact phone number is required (min 7 digits).');
  }

  // Blood group validation
  if (bloodGroup && !VALID_BLOOD_GROUPS.includes(bloodGroup.toUpperCase())) {
    errors.push(`Invalid blood group. Allowed: [${VALID_BLOOD_GROUPS.join(', ')}].`);
  }

  // Emergency contact sanity
  if (!emergencyContactName || emergencyContactName.trim().length < 2) {
    errors.push('Emergency contact person name is required.');
  }

  if (!emergencyContactPhone || emergencyContactPhone.trim().length < 7) {
    errors.push('Emergency contact phone number is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_FAILED',
      message: 'Patient demographic validation failed.',
      errors,
    });
  }

  next();
}
