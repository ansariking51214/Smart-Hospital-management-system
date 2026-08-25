const ALLOWED_ROLES = ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE', 'PHARMACIST', 'PATIENT'];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate registration payload
 */
export function validateRegister(req, res, next) {
  const { email, password, fullName, role, phone } = req.body;
  const errors = [];

  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
    errors.push('Full name is required and must be at least 2 characters');
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required (e.g. user@hospital.com)');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password is required and must be at least 6 characters long');
  }

  if (role && !ALLOWED_ROLES.includes(role)) {
    errors.push(`Invalid role specified. Allowed roles: ${ALLOWED_ROLES.join(', ')}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Invalid registration input',
      errors,
    });
  }

  // Normalize inputs
  req.body.email = email.trim().toLowerCase();
  req.body.fullName = fullName.trim();
  if (phone) req.body.phone = phone.trim();
  if (role) req.body.role = role.trim();

  next();
}

/**
 * Validate login payload
 */
export function validateLogin(req, res, next) {
  const { email, password } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required');
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Invalid login credentials supplied',
      errors,
    });
  }

  req.body.email = email.trim().toLowerCase();
  next();
}

/**
 * Validate password change payload
 */
export function validateChangePassword(req, res, next) {
  const { oldPassword, newPassword } = req.body;
  const errors = [];

  if (!oldPassword || typeof oldPassword !== 'string') {
    errors.push('Current password (oldPassword) is required');
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    errors.push('New password must be at least 6 characters long');
  }

  if (oldPassword && newPassword && oldPassword === newPassword) {
    errors.push('New password must be different from your current password');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Invalid password change request',
      errors,
    });
  }

  next();
}
