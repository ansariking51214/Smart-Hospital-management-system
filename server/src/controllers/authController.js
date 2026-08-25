import prisma from '../config/db.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken, verifyToken, decodeToken } from '../utils/jwt.js';
import { generateMRN } from '../utils/mrnGenerator.js';

/**
 * Register a new user
 * POST /api/auth/register
 */
export async function register(req, res, next) {
  try {
    const { email, password, fullName, phone, role = 'PATIENT', gender, dateOfBirth } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        code: 'EMAIL_ALREADY_REGISTERED',
        message: `An account with email '${email}' is already registered. Please sign in or use another email.`,
      });
    }

    // Hash password with bcrypt
    const passwordHash = await hashPassword(password);

    // Create user in transaction with role-specific profile if Patient
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          fullName,
          phone: phone || null,
          role,
          isActive: true,
          lastLoginAt: new Date(),
        },
      });

      let patientProfile = null;
      // Auto-create PatientProfile with generated MRN if role is PATIENT
      if (role === 'PATIENT') {
        const mrn = await generateMRN(tx);
        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0] || fullName;
        const lastName = nameParts.slice(1).join(' ') || 'Patient';

        patientProfile = await tx.patientProfile.create({
          data: {
            userId: newUser.id,
            mrn,
            firstName,
            lastName,
            gender: gender || 'OTHER',
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date('1990-01-01'),
            phone: phone || null,
            email: email,
          },
        });
      }

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          userId: newUser.id,
          action: 'USER_REGISTER',
          entity: 'User',
          entityId: newUser.id,
          details: JSON.stringify({
            role: newUser.role,
            email: newUser.email,
            mrn: patientProfile?.mrn || null,
          }),
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.headers['user-agent'] || null,
        },
      });

      return {
        user: newUser,
        patientProfile,
      };
    });

    // Generate JWT token
    const token = generateToken({
      ...result.user,
      patientProfile: result.patientProfile,
    });

    const { passwordHash: _, ...safeUser } = result.user;

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        ...safeUser,
        patientProfile: result.patientProfile,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Authenticate existing user & issue JWT
 * POST /api/auth/login
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
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
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email address or password.',
      });
    }

    // Compare bcrypt password hash
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email address or password.',
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_DEACTIVATED',
        message: 'Your account has been deactivated. Please contact the Hospital Administrator.',
      });
    }

    // Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Record login in AuditLog
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        entity: 'User',
        entityId: user.id,
        details: JSON.stringify({
          role: user.role,
          email: user.email,
          fullName: user.fullName,
        }),
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.headers['user-agent'] || null,
      },
    });

    // Generate signed JWT
    const token = generateToken(user);

    const { passwordHash: _, ...safeUser } = user;

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: safeUser,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Log out user & record audit entry
 * POST /api/auth/logout
 */
export async function logout(req, res, next) {
  try {
    const userId = req.user?.id || null;

    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'USER_LOGOUT',
          entity: 'User',
          entityId: userId,
          details: JSON.stringify({
            email: req.user.email,
            role: req.user.role,
          }),
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.headers['user-agent'] || null,
        },
      });
    }

    return res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
export async function getMe(req, res, next) {
  try {
    return res.json({
      success: true,
      user: req.user,
      tokenPayload: req.tokenPayload,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Change password for authenticated user
 * POST /api/auth/change-password
 */
export async function changePassword(req, res, next) {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'User account not found',
      });
    }

    const isMatch = await comparePassword(oldPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_OLD_PASSWORD',
        message: 'Current password does not match our records.',
      });
    }

    const newHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // Record audit
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'PASSWORD_CHANGED',
        entity: 'User',
        entityId: userId,
        details: JSON.stringify({ email: user.email }),
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.headers['user-agent'] || null,
      },
    });

    return res.json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Inspect and verify a raw token
 * POST /api/auth/inspect-token
 */
export async function inspectToken(req, res, next) {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token string is required for inspection',
      });
    }

    const decoded = decodeToken(token);
    let verification = { isValid: false, message: 'Unverified' };

    try {
      const verified = verifyToken(token);
      const nowSeconds = Math.floor(Date.now() / 1000);
      const expiresInSeconds = verified.exp ? verified.exp - nowSeconds : null;

      verification = {
        isValid: true,
        message: 'Token signature is valid',
        expiresInSeconds,
        isExpired: expiresInSeconds !== null && expiresInSeconds <= 0,
      };
    } catch (err) {
      verification = {
        isValid: false,
        message: err.message,
        name: err.name,
      };
    }

    return res.json({
      success: true,
      inspection: {
        header: decoded?.header || null,
        payload: decoded?.payload || null,
        signature: decoded?.signature ? '[Cryptographic Signature Present]' : null,
        verification,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get recent authentication audit logs
 * GET /api/auth/audit-logs
 */
export async function getAuthAuditLogs(req, res, next) {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        action: {
          in: ['USER_LOGIN', 'USER_LOGOUT', 'USER_REGISTER', 'PASSWORD_CHANGED'],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    next(error);
  }
}
