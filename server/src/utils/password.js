import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hash a plain text password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Salted bcrypt hash
 */
export async function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain text password against a bcrypt hash
 * @param {string} password - Plain text password
 * @param {string} hash - Stored bcrypt hash
 * @returns {Promise<boolean>} - True if matched
 */
export async function comparePassword(password, hash) {
  if (!password || !hash) {
    return false;
  }
  return await bcrypt.compare(password, hash);
}

/**
 * Validate password strength criteria
 * @param {string} password
 * @returns {{ isValid: boolean, score: number, feedback: string[] }}
 */
export function validatePasswordStrength(password) {
  const feedback = [];
  let score = 0;

  if (!password || typeof password !== 'string') {
    return { isValid: false, score: 0, feedback: ['Password is required'] };
  }

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Must be at least 8 characters long');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Must include at least one uppercase letter (A-Z)');
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Must include at least one lowercase letter (a-z)');
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Must include at least one number (0-9)');
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Must include at least one special character (!@#$%...)');
  }

  return {
    isValid: score >= 3 && password.length >= 6,
    score, // 0 to 5
    feedback,
  };
}
