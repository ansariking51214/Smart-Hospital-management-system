import prisma from '../config/db.js';
import { hashPassword } from '../utils/password.js';

/**
 * Get all doctors with shift roster and department information
 * GET /api/doctors
 */
export async function getAllDoctors(req, res, next) {
  try {
    const { departmentId = '', search = '', availableToday = '' } = req.query;

    const whereClause = {};

    if (departmentId) {
      whereClause.departmentId = departmentId;
    }

    if (search) {
      whereClause.OR = [
        { specialization: { contains: search } },
        { licenseNumber: { contains: search } },
        { user: { fullName: { contains: search } } },
        { user: { email: { contains: search } } },
        { roomNumber: { contains: search } },
      ];
    }

    const doctors = await prisma.doctorProfile.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            isActive: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
          },
        },
        _count: {
          select: {
            appointments: true,
            prescriptions: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayAbbr = daysOfWeek[new Date().getDay()];

    const formattedDoctors = doctors.map((doc) => {
      const workingDays = doc.availableDays ? doc.availableDays.split(',').map((d) => d.trim()) : [];
      const isOnDutyToday = workingDays.includes(todayAbbr);

      return {
        ...doc,
        fullName: doc.user?.fullName || 'Physician',
        email: doc.user?.email || '',
        phone: doc.user?.phone || '',
        avatarUrl: doc.user?.avatarUrl || null,
        isActive: doc.user?.isActive ?? true,
        workingDaysList: workingDays,
        isOnDutyToday,
        shiftTimeFormatted: `${doc.shiftStart || '09:00'} - ${doc.shiftEnd || '17:00'}`,
      };
    });

    let finalDoctors = formattedDoctors;
    if (availableToday === 'true') {
      finalDoctors = finalDoctors.filter((d) => d.isOnDutyToday);
    }

    return res.json({
      success: true,
      count: finalDoctors.length,
      doctors: finalDoctors,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single doctor profile by ID
 * GET /api/doctors/:id
 */
export async function getDoctorById(req, res, next) {
  try {
    const { id } = req.params;

    const doctor = await prisma.doctorProfile.findFirst({
      where: {
        OR: [{ id }, { userId: id }],
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            isActive: true,
          },
        },
        department: true,
        appointments: {
          take: 5,
          orderBy: { appointmentDate: 'desc' },
          include: {
            patient: {
              select: { mrn: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        code: 'DOCTOR_NOT_FOUND',
        message: `Doctor profile not found with ID: '${id}'.`,
      });
    }

    const workingDays = doctor.availableDays ? doctor.availableDays.split(',').map((d) => d.trim()) : [];

    return res.json({
      success: true,
      doctor: {
        ...doctor,
        fullName: doctor.user?.fullName || 'Physician',
        workingDaysList: workingDays,
        shiftTimeFormatted: `${doctor.shiftStart} - ${doctor.shiftEnd}`,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Onboard a new Doctor & create shift roster (Admin only)
 * POST /api/doctors
 */
export async function createDoctor(req, res, next) {
  try {
    const {
      fullName,
      email,
      phone = '+1-555-0199',
      password = 'Password@123',
      departmentId,
      specialization,
      licenseNumber,
      qualification,
      consultationFee = 100.0,
      roomNumber = 'Room 101',
      availableDays = 'Mon,Tue,Wed,Thu,Fri',
      shiftStart = '09:00',
      shiftEnd = '17:00',
      bio = '',
    } = req.body;

    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate user or license
    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        code: 'EMAIL_EXISTS',
        message: `User with email '${cleanEmail}' already exists.`,
      });
    }

    const existingLicense = await prisma.doctorProfile.findUnique({ where: { licenseNumber: licenseNumber.trim() } });
    if (existingLicense) {
      return res.status(409).json({
        success: false,
        code: 'LICENSE_EXISTS',
        message: `Medical license '${licenseNumber}' is already registered with another physician.`,
      });
    }

    const passwordHash = await hashPassword(password);

    // Create User with DOCTOR role
    const newUser = await prisma.user.create({
      data: {
        email: cleanEmail,
        passwordHash,
        fullName: fullName.trim(),
        phone: phone.trim(),
        role: 'DOCTOR',
        isActive: true,
      },
    });

    // Create DoctorProfile with Shift Roster
    const doctorProfile = await prisma.doctorProfile.create({
      data: {
        userId: newUser.id,
        departmentId: departmentId || null,
        specialization: specialization.trim(),
        licenseNumber: licenseNumber.trim(),
        qualification: qualification.trim(),
        consultationFee: Number(consultationFee),
        roomNumber: roomNumber.trim(),
        availableDays: availableDays.trim(),
        shiftStart: shiftStart.trim(),
        shiftEnd: shiftEnd.trim(),
        bio: bio?.trim() || null,
      },
      include: {
        department: true,
        user: true,
      },
    });

    // Audit Log
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'DOCTOR_ONBOARDED',
          entity: 'DoctorProfile',
          entityId: doctorProfile.id,
          details: JSON.stringify({
            doctorName: fullName,
            specialization,
            licenseNumber,
            shift: `${shiftStart} - ${shiftEnd}`,
            onboardedBy: req.user.email,
          }),
          ipAddress: req.ip,
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: `Doctor '${fullName}' successfully onboarded with active shift roster!`,
      doctor: doctorProfile,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update Doctor Shift Schedule & Roster (Admin & Doctor)
 * PUT /api/doctors/:id/roster
 */
export async function updateDoctorRoster(req, res, next) {
  try {
    const { id } = req.params;
    const {
      specialization,
      departmentId,
      qualification,
      consultationFee,
      roomNumber,
      availableDays,
      shiftStart,
      shiftEnd,
      bio,
    } = req.body;

    const existingDoctor = await prisma.doctorProfile.findFirst({
      where: {
        OR: [{ id }, { userId: id }],
      },
      include: { user: true },
    });

    if (!existingDoctor) {
      return res.status(404).json({
        success: false,
        code: 'DOCTOR_NOT_FOUND',
        message: 'Doctor profile not found.',
      });
    }

    const updated = await prisma.doctorProfile.update({
      where: { id: existingDoctor.id },
      data: {
        specialization: specialization !== undefined ? specialization.trim() : existingDoctor.specialization,
        departmentId: departmentId !== undefined ? departmentId : existingDoctor.departmentId,
        qualification: qualification !== undefined ? qualification.trim() : existingDoctor.qualification,
        consultationFee: consultationFee !== undefined ? Number(consultationFee) : existingDoctor.consultationFee,
        roomNumber: roomNumber !== undefined ? roomNumber.trim() : existingDoctor.roomNumber,
        availableDays: availableDays !== undefined ? availableDays.trim() : existingDoctor.availableDays,
        shiftStart: shiftStart !== undefined ? shiftStart.trim() : existingDoctor.shiftStart,
        shiftEnd: shiftEnd !== undefined ? shiftEnd.trim() : existingDoctor.shiftEnd,
        bio: bio !== undefined ? bio.trim() : existingDoctor.bio,
      },
      include: {
        department: true,
        user: true,
      },
    });

    // Record Audit
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'ROSTER_UPDATED',
          entity: 'DoctorProfile',
          entityId: updated.id,
          details: JSON.stringify({
            doctor: updated.user?.fullName,
            newShift: `${updated.shiftStart} - ${updated.shiftEnd}`,
            availableDays: updated.availableDays,
            updatedBy: req.user.email,
          }),
          ipAddress: req.ip,
        },
      });
    }

    return res.json({
      success: true,
      message: `Shift roster updated successfully for Dr. ${updated.user?.fullName}.`,
      doctor: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Doctor Roster & Shift Overview Statistics
 * GET /api/doctors/stats/overview
 */
export async function getDoctorRosterStats(req, res, next) {
  try {
    const totalDoctors = await prisma.doctorProfile.count();
    const allDoctors = await prisma.doctorProfile.findMany({
      select: {
        availableDays: true,
        consultationFee: true,
        department: { select: { name: true } },
      },
    });

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayAbbr = daysOfWeek[new Date().getDay()];

    let onDutyToday = 0;
    let totalFee = 0;
    const departmentStats = {};

    allDoctors.forEach((doc) => {
      const days = doc.availableDays ? doc.availableDays.split(',').map((d) => d.trim()) : [];
      if (days.includes(todayAbbr)) {
        onDutyToday++;
      }
      totalFee += doc.consultationFee || 0;

      const deptName = doc.department?.name || 'General Medicine';
      departmentStats[deptName] = (departmentStats[deptName] || 0) + 1;
    });

    const averageFee = totalDoctors > 0 ? (totalFee / totalDoctors).toFixed(2) : 0;

    return res.json({
      success: true,
      totalDoctors,
      onDutyToday,
      todayDay: todayAbbr,
      averageFee,
      departmentStats,
    });
  } catch (error) {
    next(error);
  }
}
