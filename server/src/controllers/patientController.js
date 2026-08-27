import prisma from '../config/db.js';
import { generateNextMRN } from '../utils/mrnGenerator.js';
import { hashPassword } from '../utils/password.js';

/**
 * Register a new patient with full demographic intake & auto-MRN
 * POST /api/patients/register
 */
export async function registerPatient(req, res, next) {
  try {
    const {
      firstName,
      lastName,
      gender,
      dateOfBirth,
      bloodGroup = 'UNKNOWN',
      phone,
      email,
      address,
      nationalId,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation = 'Guardian',
      allergies = '',
      chronicConditions = '',
      notes = '',
    } = req.body;

    // 1. Generate sequential collision-safe MRN
    const mrn = await generateNextMRN();

    // 2. Format names and sanitize
    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanPhone = phone.trim();
    const cleanBloodGroup = bloodGroup.toUpperCase();

    // 3. Check for duplicate patient by phone or nationalId if provided
    if (nationalId) {
      const existingById = await prisma.patientProfile.findFirst({
        where: { nationalId: nationalId.trim() },
      });
      if (existingById) {
        return res.status(409).json({
          success: false,
          code: 'DUPLICATE_NATIONAL_ID',
          message: `A patient with National ID '${nationalId}' is already registered (MRN: ${existingById.mrn}).`,
        });
      }
    }

    // 4. Create User Account if email is provided, or link to system
    let userId = null;
    if (email && email.trim()) {
      const cleanEmail = email.trim().toLowerCase();
      const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });

      if (existingUser) {
        // If user exists and doesn't have a patient profile, link them
        const existingProfile = await prisma.patientProfile.findUnique({
          where: { userId: existingUser.id },
        });
        if (existingProfile) {
          return res.status(409).json({
            success: false,
            code: 'EMAIL_ALREADY_LINKED',
            message: `User email '${cleanEmail}' already has an active patient profile (MRN: ${existingProfile.mrn}).`,
          });
        }
        userId = existingUser.id;
      } else {
        // Create new patient portal user account
        const defaultPassword = 'Password@123';
        const passwordHash = await hashPassword(defaultPassword);
        const newUser = await prisma.user.create({
          data: {
            email: cleanEmail,
            passwordHash,
            fullName: `${cleanFirstName} ${cleanLastName}`,
            phone: cleanPhone,
            role: 'PATIENT',
            isActive: true,
          },
        });
        userId = newUser.id;
      }
    }

    // 5. Create PatientProfile
    const patient = await prisma.patientProfile.create({
      data: {
        userId,
        mrn,
        firstName: cleanFirstName,
        lastName: cleanLastName,
        gender: gender.toUpperCase(),
        dateOfBirth: new Date(dateOfBirth),
        bloodGroup: cleanBloodGroup,
        phone: cleanPhone,
        address: address?.trim() || null,
        nationalId: nationalId?.trim() || null,
        emergencyContactName: emergencyContactName.trim(),
        emergencyContactPhone: emergencyContactPhone.trim(),
        emergencyContactRelation: emergencyContactRelation.trim(),
        allergies: allergies?.trim() || null,
        chronicConditions: chronicConditions?.trim() || null,
      },
    });

    // 6. Record Audit Log
    const performerId = req.user?.id || userId;
    if (performerId) {
      await prisma.auditLog.create({
        data: {
          userId: performerId,
          action: 'PATIENT_REGISTERED',
          entity: 'PatientProfile',
          entityId: patient.id,
          details: JSON.stringify({
            mrn: patient.mrn,
            fullName: `${cleanFirstName} ${cleanLastName}`,
            gender: patient.gender,
            bloodGroup: patient.bloodGroup,
            registeredBy: req.user?.email || 'Self-Registration Portal',
          }),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || null,
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: `Patient successfully registered with Medical Record Number: ${patient.mrn}`,
      patient: {
        ...patient,
        fullName: `${patient.firstName} ${patient.lastName}`,
        age: calculateAge(patient.dateOfBirth),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all registered patients with search & pagination
 * GET /api/patients
 */
export async function getAllPatients(req, res, next) {
  try {
    const { search = '', bloodGroup = '', gender = '', page = 1, limit = 50 } = req.query;

    const whereClause = {};

    if (search) {
      whereClause.OR = [
        { mrn: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    if (bloodGroup) {
      whereClause.bloodGroup = bloodGroup.toUpperCase();
    }

    if (gender) {
      whereClause.gender = gender.toUpperCase();
    }

    const [total, rawPatients] = await Promise.all([
      prisma.patientProfile.count({ where: whereClause }),
      prisma.patientProfile.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          user: {
            select: { email: true, isActive: true },
          },
        },
      }),
    ]);

    const patients = rawPatients.map((p) => ({
      ...p,
      fullName: `${p.firstName} ${p.lastName}`,
      age: calculateAge(p.dateOfBirth),
    }));

    return res.json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      count: patients.length,
      patients,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single patient details by ID or MRN
 * GET /api/patients/:idOrMrn
 */
export async function getPatientByIdOrMrn(req, res, next) {
  try {
    const { idOrMrn } = req.params;

    const patient = await prisma.patientProfile.findFirst({
      where: {
        OR: [{ id: idOrMrn }, { mrn: idOrMrn }],
      },
      include: {
        user: {
          select: { email: true, isActive: true, lastLoginAt: true },
        },
        appointments: {
          include: {
            doctor: {
              include: { user: true, department: true },
            },
          },
          orderBy: { scheduledDate: 'desc' },
        },
        vitals: {
          orderBy: { recordedAt: 'desc' },
          take: 5,
        },
        prescriptions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        code: 'PATIENT_NOT_FOUND',
        message: `No patient found with ID or MRN: '${idOrMrn}'`,
      });
    }

    return res.json({
      success: true,
      patient: {
        ...patient,
        fullName: `${patient.firstName} ${patient.lastName}`,
        age: calculateAge(patient.dateOfBirth),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update patient demographic & contact information
 * PUT /api/patients/:id
 */
export async function updatePatient(req, res, next) {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      phone,
      address,
      bloodGroup,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
      allergies,
      chronicConditions,
    } = req.body;

    const existing = await prisma.patientProfile.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        code: 'PATIENT_NOT_FOUND',
        message: `Patient profile with ID '${id}' not found.`,
      });
    }

    const updated = await prisma.patientProfile.update({
      where: { id },
      data: {
        firstName: firstName ? firstName.trim() : existing.firstName,
        lastName: lastName ? lastName.trim() : existing.lastName,
        phone: phone ? phone.trim() : existing.phone,
        address: address !== undefined ? address : existing.address,
        bloodGroup: bloodGroup ? bloodGroup.toUpperCase() : existing.bloodGroup,
        emergencyContactName: emergencyContactName ? emergencyContactName.trim() : existing.emergencyContactName,
        emergencyContactPhone: emergencyContactPhone ? emergencyContactPhone.trim() : existing.emergencyContactPhone,
        emergencyContactRelation: emergencyContactRelation ? emergencyContactRelation.trim() : existing.emergencyContactRelation,
        allergies: allergies !== undefined ? allergies : existing.allergies,
        chronicConditions: chronicConditions !== undefined ? chronicConditions : existing.chronicConditions,
      },
    });

    // Record Audit
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'PATIENT_UPDATED',
          entity: 'PatientProfile',
          entityId: id,
          details: JSON.stringify({
            mrn: updated.mrn,
            updatedBy: req.user.email,
          }),
          ipAddress: req.ip,
        },
      });
    }

    return res.json({
      success: true,
      message: `Demographics updated successfully for ${updated.firstName} ${updated.lastName} (${updated.mrn}).`,
      patient: {
        ...updated,
        fullName: `${updated.firstName} ${updated.lastName}`,
        age: calculateAge(updated.dateOfBirth),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Patient Demographics & Registration Statistics Overview
 * GET /api/patients/stats/overview
 */
export async function getPatientStatsOverview(req, res, next) {
  try {
    const totalPatients = await prisma.patientProfile.count();
    const allPatients = await prisma.patientProfile.findMany({
      select: { gender: true, bloodGroup: true, createdAt: true },
    });

    const genderStats = { MALE: 0, FEMALE: 0, OTHER: 0 };
    const bloodGroupStats = {};

    allPatients.forEach((p) => {
      const g = p.gender || 'OTHER';
      genderStats[g] = (genderStats[g] || 0) + 1;

      const bg = p.bloodGroup || 'UNKNOWN';
      bloodGroupStats[bg] = (bloodGroupStats[bg] || 0) + 1;
    });

    return res.json({
      success: true,
      totalPatients,
      genderStats,
      bloodGroupStats,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Helper to calculate accurate age in years
 */
function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return 0;
  const dob = new Date(dateOfBirth);
  const diffMs = Date.now() - dob.getTime();
  const ageDate = new Date(diffMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}
