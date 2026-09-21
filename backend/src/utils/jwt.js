import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'hms_super_secret_jwt_key_2026_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate a signed JWT token for a user
 * @param {object} user - User record (or payload)
 * @param {string} [expiresIn] - Optional custom expiration (e.g. '1h', '7d')
 * @returns {string} - Signed JWT string
 */
export function generateToken(user, expiresIn = JWT_EXPIRES_IN) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
    doctorProfileId: user.doctorProfile?.id || null,
    patientProfileId: user.patientProfile?.id || null,
    mrn: user.patientProfile?.mrn || null,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn,
    issuer: 'Smart-Hospital-Management-System',
    audience: 'HMS-Clients',
  });
}

/**
 * Verify and decode a JWT token
 * @param {string} token - Bearer JWT token
 * @returns {object} - Decoded payload
 */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET, {
    issuer: 'Smart-Hospital-Management-System',
    audience: 'HMS-Clients',
  });
}

/**
 * Decode token without cryptographic verification (for client inspection/debug)
 * @param {string} token
 * @returns {object|null}
 */
export function decodeToken(token) {
  return jwt.decode(token, { complete: true });
}
