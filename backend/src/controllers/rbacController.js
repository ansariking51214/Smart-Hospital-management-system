import prisma from '../config/db.js';
import {
  SYSTEM_ROLES,
  ROLE_PERMISSIONS_MATRIX,
  ROLE_DESCRIPTIONS,
  PERMISSIONS,
} from '../utils/rbacConfig.js';

/**
 * Get the system-wide RBAC role and permission matrix
 * GET /api/rbac/matrix
 */
export async function getRoleMatrix(req, res, next) {
  try {
    // Get user counts by role
    const users = await prisma.user.findMany({
      select: { role: true, isActive: true },
    });

    const roleCounts = {};
    Object.keys(SYSTEM_ROLES).forEach((role) => {
      roleCounts[role] = {
        total: users.filter((u) => u.role === role).length,
        active: users.filter((u) => u.role === role && u.isActive).length,
      };
    });

    return res.json({
      success: true,
      roles: SYSTEM_ROLES,
      descriptions: ROLE_DESCRIPTIONS,
      matrix: ROLE_PERMISSIONS_MATRIX,
      permissions: Object.keys(PERMISSIONS),
      roleCounts,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all users with their roles (Admin only)
 * GET /api/rbac/users
 */
export async function getSystemUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        doctorProfile: {
          select: {
            specialization: true,
            licenseNumber: true,
            roomNumber: true,
          },
        },
        patientProfile: {
          select: {
            mrn: true,
            bloodGroup: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update a user's role (Admin only)
 * PATCH /api/rbac/users/:id/role
 */
export async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { newRole } = req.body;

    if (!newRole || !SYSTEM_ROLES[newRole]) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_ROLE',
        message: `Invalid role specified. Allowed roles: [${Object.keys(SYSTEM_ROLES).join(', ')}]`,
      });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: `User with ID '${id}' does not exist.`,
      });
    }

    const oldRole = user.role;
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    });

    // Record Audit Log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'ROLE_CHANGED',
        entity: 'User',
        entityId: id,
        details: JSON.stringify({
          targetUser: user.email,
          previousRole: oldRole,
          updatedRole: newRole,
          changedBy: req.user.email,
        }),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || null,
      },
    });

    return res.json({
      success: true,
      message: `User role successfully updated from '${oldRole}' to '${newRole}'.`,
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Toggle user active/deactivated status (Admin only)
 * PATCH /api/rbac/users/:id/status
 */
export async function updateUserStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive boolean field is required in request body.',
      });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, email: true, fullName: true, role: true, isActive: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'USER_STATUS_CHANGED',
        entity: 'User',
        entityId: id,
        details: JSON.stringify({
          targetEmail: user.email,
          newStatus: isActive ? 'ACTIVE' : 'DEACTIVATED',
          modifiedBy: req.user.email,
        }),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || null,
      },
    });

    return res.json({
      success: true,
      message: `Account for '${user.fullName}' is now ${isActive ? 'ACTIVATED' : 'DEACTIVATED'}.`,
      user: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Role Route Guard Verification Endpoints
 */

// 1. Admin-Only Resource
export async function testAdminResource(req, res) {
  return res.json({
    success: true,
    accessGranted: true,
    resource: 'ADMIN_CONTROL_PANEL',
    message: 'Authorized: You have full Super Administrator privileges.',
    userRole: req.user.role,
    capabilities: [
      'Full Database Inspection',
      'Immutable Audit Trail Access',
      'Dynamic User Role Assignment',
      'Department Roster Configuration',
    ],
  });
}

// 2. Doctor-Only Resource
export async function testDoctorResource(req, res) {
  return res.json({
    success: true,
    accessGranted: true,
    resource: 'DOCTOR_CLINICAL_WORKSTATION',
    message: 'Authorized: Access granted to Physician EHR Consultation Desk.',
    userRole: req.user.role,
    doctorProfile: req.user.doctorProfile || null,
    capabilities: [
      'Clinical SOAP Consultation Notes',
      'Electronic Prescriptions (e-Rx)',
      'Diagnostic Lab Test Ordering',
      'Patient Past Medical History Review',
    ],
  });
}

// 3. Receptionist Resource
export async function testReceptionistResource(req, res) {
  return res.json({
    success: true,
    accessGranted: true,
    resource: 'RECEPTION_DESK_PORTAL',
    message: 'Authorized: Access granted to Front-Desk Intake Station.',
    userRole: req.user.role,
    capabilities: [
      'Patient Registration & Auto MRN Generation',
      'OPD Daily Token Queue Issuance',
      'Consultation Appointment Booking',
      'Demographic Information Verification',
    ],
  });
}

// 4. Nurse Resource
export async function testNurseResource(req, res) {
  return res.json({
    success: true,
    accessGranted: true,
    resource: 'NURSE_TRIAGE_STATION',
    message: 'Authorized: Access granted to Clinical Nursing & Triage Station.',
    userRole: req.user.role,
    capabilities: [
      'Vital Signs Measurement (BP, SpO2, Pulse, BMI)',
      'Patient Triage Priority Scoring',
      'Ward Bed Allocation Monitoring',
    ],
  });
}

// 5. Patient Resource
export async function testPatientResource(req, res) {
  return res.json({
    success: true,
    accessGranted: true,
    resource: 'PATIENT_PORTAL',
    message: 'Authorized: Welcome to your Personal Patient Portal.',
    userRole: req.user.role,
    mrn: req.user.patientProfile?.mrn || 'MRN-PENDING',
    capabilities: [
      'View Personal Medical Records',
      'View Issued e-Prescriptions & Dosages',
      'View OPD Appointment History',
      'Download Invoices & Payment Receipts',
    ],
  });
}
