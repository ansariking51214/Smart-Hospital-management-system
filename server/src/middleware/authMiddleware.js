import { verifyToken } from '../utils/jwt.js';
import prisma from '../config/db.js';

/**
 * Middleware to verify JWT authentication token
 */
export async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_MISSING',
        message: 'Authentication required. No Bearer token provided in Authorization header.',
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_EMPTY',
        message: 'Malformed authorization header. Bearer token is empty.',
      });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          code: 'TOKEN_EXPIRED',
          message: 'Session expired. Your authentication token has expired. Please log in again.',
          expiredAt: err.expiredAt,
        });
      }
      return res.status(403).json({
        success: false,
        code: 'TOKEN_INVALID',
        message: 'Forbidden. Invalid or tampered authentication token.',
      });
    }

    // Lookup user in DB to verify account state
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        doctorProfile: {
          include: {
            department: true,
          },
        },
        patientProfile: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'Authentication failed. User account associated with token no longer exists.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_DEACTIVATED',
        message: 'Access denied. This user account has been deactivated. Please contact an Administrator.',
      });
    }

    // Attach user (without password hash) and token metadata to request
    const { passwordHash, ...safeUser } = user;
    req.user = safeUser;
    req.tokenPayload = decoded;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Role-Based Access Control (RBAC) middleware factory
 * @param  {...string} allowedRoles
 */
export function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHENTICATED',
        message: 'Authentication required before verifying role permissions.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        code: 'INSUFFICIENT_PERMISSIONS',
        message: `Forbidden. Role '${req.user.role}' is not authorized to access this resource. Required role(s): [${allowedRoles.join(', ')}].`,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
      });
    }

    next();
  };
}

/**
 * Optional authentication middleware (populates req.user if token valid, but does not reject if missing)
 */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        doctorProfile: true,
        patientProfile: true,
      },
    });
    if (user && user.isActive) {
      const { passwordHash, ...safeUser } = user;
      req.user = safeUser;
      req.tokenPayload = decoded;
    }
  } catch (e) {
    // Ignore error for optional auth
  }
  next();
}
