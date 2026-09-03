import prisma from '../config/db.js';

/**
 * Get Real-Time Live OPD Queue Board (For TV Displays & Staff Dashboards)
 * GET /api/queue/live
 */
export async function getLiveQueueBoard(req, res, next) {
  try {
    const { departmentId, doctorId, date } = req.query;

    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const whereClause = {
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    if (doctorId) {
      whereClause.doctorId = doctorId;
    }

    const tokens = await prisma.queueToken.findMany({
      where: whereClause,
      orderBy: [{ tokenNumber: 'asc' }],
      include: {
        patient: {
          select: {
            id: true,
            mrn: true,
            firstName: true,
            lastName: true,
            gender: true,
            dateOfBirth: true,
            bloodGroup: true,
            allergies: true,
          },
        },
        doctor: {
          include: {
            user: { select: { fullName: true, email: true } },
            department: true,
          },
        },
        appointment: {
          select: {
            id: true,
            timeSlot: true,
            type: true,
            reasonForVisit: true,
          },
        },
      },
    });

    let filteredTokens = tokens;
    if (departmentId) {
      filteredTokens = tokens.filter((t) => t.doctor?.departmentId === departmentId);
    }

    const formattedTokens = filteredTokens.map((t) => ({
      ...t,
      patientFullName: `${t.patient.firstName} ${t.patient.lastName}`,
      doctorFullName: t.doctor?.user?.fullName || 'Physician',
      departmentName: t.doctor?.department?.name || 'General OPD',
      roomNumber: t.doctor?.roomNumber || 'Room 101',
      timeSlot: t.appointment?.timeSlot || 'Walk-in',
    }));

    // Categorize into Board sections
    const currentlyServing = formattedTokens.filter(
      (t) => t.status === 'CALLED' || t.status === 'IN_CONSULTATION'
    );

    const waitingQueue = formattedTokens
      .filter((t) => t.status === 'WAITING')
      .map((t, idx) => ({
        ...t,
        estimatedWaitMinutes: (idx + 1) * 15,
        estimatedTimeText: `~${(idx + 1) * 15} mins`,
      }));

    const completedTokens = formattedTokens
      .filter((t) => t.status === 'COMPLETED')
      .sort((a, b) => new Date(b.completedAt || b.updatedAt) - new Date(a.completedAt || a.updatedAt));

    const skippedTokens = formattedTokens.filter(
      (t) => t.status === 'SKIPPED' || t.status === 'NO_SHOW'
    );

    return res.json({
      success: true,
      date: targetDate.toISOString().split('T')[0],
      totalTokens: formattedTokens.length,
      counts: {
        currentlyServing: currentlyServing.length,
        waiting: waitingQueue.length,
        completed: completedTokens.length,
        skipped: skippedTokens.length,
      },
      currentlyServing,
      waitingQueue,
      completedTokens: completedTokens.slice(0, 10),
      skippedTokens,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Call Next Patient in Line for a Doctor
 * POST /api/queue/call-next
 */
export async function callNextPatient(req, res, next) {
  try {
    const { doctorId } = req.body;

    const doctor = await prisma.doctorProfile.findFirst({
      where: {
        OR: [{ id: doctorId }, { userId: doctorId }],
      },
      include: {
        user: { select: { fullName: true } },
        department: true,
      },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        code: 'DOCTOR_NOT_FOUND',
        message: 'Doctor profile not found.',
      });
    }

    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Find earliest WAITING token for this doctor today
    const nextToken = await prisma.queueToken.findFirst({
      where: {
        doctorId: doctor.id,
        date: { gte: startOfDay, lte: endOfDay },
        status: 'WAITING',
      },
      orderBy: { tokenNumber: 'asc' },
      include: {
        patient: true,
        appointment: true,
      },
    });

    if (!nextToken) {
      return res.json({
        success: true,
        isQueueEmpty: true,
        message: `No waiting patients in queue for Dr. ${doctor.user?.fullName}.`,
        calledToken: null,
      });
    }

    // Update status to CALLED with calledAt timestamp
    const updatedToken = await prisma.queueToken.update({
      where: { id: nextToken.id },
      data: {
        status: 'CALLED',
        calledAt: new Date(),
      },
      include: {
        patient: true,
        doctor: { include: { user: true, department: true } },
        appointment: true,
      },
    });

    // Also update linked appointment status to IN_QUEUE if scheduled
    if (nextToken.appointmentId) {
      await prisma.appointment.update({
        where: { id: nextToken.appointmentId },
        data: { status: 'IN_QUEUE' },
      });
    }

    // Record Security & Action Audit
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'TOKEN_CALLED',
          entity: 'QueueToken',
          entityId: updatedToken.id,
          details: JSON.stringify({
            tokenCode: updatedToken.tokenCode,
            patientMrn: updatedToken.patient?.mrn,
            doctorName: doctor.user?.fullName,
            roomNumber: doctor.roomNumber,
            calledBy: req.user.email,
          }),
          ipAddress: req.ip,
        },
      });
    }

    return res.json({
      success: true,
      isQueueEmpty: false,
      message: `Now calling Token ${updatedToken.tokenCode} — ${updatedToken.patient?.firstName} ${updatedToken.patient?.lastName} to ${doctor.roomNumber || 'Consultation Room'}!`,
      calledToken: {
        ...updatedToken,
        patientFullName: `${updatedToken.patient?.firstName} ${updatedToken.patient?.lastName}`,
        roomNumber: doctor.roomNumber || 'Room 101',
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update Specific Token Status (IN_CONSULTATION, COMPLETED, SKIPPED, RECALLED)
 * PATCH /api/queue/token/:id/status
 */
export async function updateTokenStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const existing = await prisma.queueToken.findUnique({
      where: { id },
      include: { patient: true, doctor: { include: { user: true } } },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        code: 'TOKEN_NOT_FOUND',
        message: 'Queue token not found.',
      });
    }

    const dataToUpdate = {
      status: status.toUpperCase(),
    };

    if (status.toUpperCase() === 'COMPLETED') {
      dataToUpdate.completedAt = new Date();
    } else if (status.toUpperCase() === 'CALLED') {
      dataToUpdate.calledAt = new Date();
    }

    const updated = await prisma.queueToken.update({
      where: { id },
      data: dataToUpdate,
      include: {
        patient: true,
        doctor: { include: { user: true, department: true } },
      },
    });

    // Also update linked appointment status
    if (existing.appointmentId) {
      let apptStatus = 'IN_QUEUE';
      if (status.toUpperCase() === 'COMPLETED') apptStatus = 'COMPLETED';
      if (status.toUpperCase() === 'IN_CONSULTATION') apptStatus = 'IN_CONSULTATION';
      if (status.toUpperCase() === 'CANCELLED' || status.toUpperCase() === 'NO_SHOW')
        apptStatus = 'CANCELLED';

      await prisma.appointment.update({
        where: { id: existing.appointmentId },
        data: { status: apptStatus },
      });
    }

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'TOKEN_STATUS_UPDATED',
          entity: 'QueueToken',
          entityId: id,
          details: JSON.stringify({
            tokenCode: updated.tokenCode,
            newStatus: updated.status,
            patientMrn: updated.patient?.mrn,
            updatedBy: req.user.email,
          }),
          ipAddress: req.ip,
        },
      });
    }

    return res.json({
      success: true,
      message: `Token ${updated.tokenCode} status updated to ${updated.status}.`,
      token: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Issue Instant Walk-In OPD Token (Receptionist Desk)
 * POST /api/queue/issue-walkin
 */
export async function issueWalkInToken(req, res, next) {
  try {
    const { doctorId, patientId, patientMrn, reasonForVisit = 'Walk-in OPD Consultation' } = req.body;

    // 1. Resolve Patient
    let patient;
    if (patientId) {
      patient = await prisma.patientProfile.findUnique({ where: { id: patientId } });
    } else if (patientMrn) {
      patient = await prisma.patientProfile.findUnique({ where: { mrn: patientMrn.trim() } });
    }

    if (!patient) {
      return res.status(404).json({
        success: false,
        code: 'PATIENT_NOT_FOUND',
        message: 'Patient not found. Please register patient first.',
      });
    }

    // 2. Resolve Doctor
    const doctor = await prisma.doctorProfile.findFirst({
      where: {
        OR: [{ id: doctorId }, { userId: doctorId }],
      },
      include: {
        user: { select: { fullName: true } },
        department: true,
      },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        code: 'DOCTOR_NOT_FOUND',
        message: 'Doctor not found.',
      });
    }

    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // 3. Count total tokens issued today for doctor
    const todayTokensCount = await prisma.queueToken.count({
      where: {
        doctorId: doctor.id,
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    const nextTokenNumber = todayTokensCount + 1;
    const deptCode = doctor.department?.code || 'OPD';
    const tokenCode = `${deptCode}-${String(nextTokenNumber).padStart(3, '0')}`;

    // 4. Create Walk-in Appointment & Queue Token
    const walkInAppointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        appointmentDate: today,
        timeSlot: 'Walk-in Triage',
        type: 'OPD',
        status: 'IN_QUEUE',
        reasonForVisit,
      },
    });

    const newQueueToken = await prisma.queueToken.create({
      data: {
        appointmentId: walkInAppointment.id,
        patientId: patient.id,
        doctorId: doctor.id,
        tokenNumber: nextTokenNumber,
        tokenCode,
        status: 'WAITING',
      },
      include: {
        patient: true,
        doctor: { include: { user: true, department: true } },
      },
    });

    // 5. Audit Log
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'WALKIN_TOKEN_ISSUED',
          entity: 'QueueToken',
          entityId: newQueueToken.id,
          details: JSON.stringify({
            tokenCode,
            tokenNumber: nextTokenNumber,
            patientMrn: patient.mrn,
            doctor: doctor.user?.fullName,
            issuedBy: req.user.email,
          }),
          ipAddress: req.ip,
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: `Walk-in Token ${tokenCode} successfully issued for ${patient.firstName} ${patient.lastName}!`,
      token: {
        ...newQueueToken,
        patientFullName: `${patient.firstName} ${patient.lastName}`,
        roomNumber: doctor.roomNumber || 'Room 101',
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Queue Overview Statistics
 * GET /api/queue/stats/overview
 */
export async function getQueueStats(req, res, next) {
  try {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const [totalToday, waiting, called, inConsultation, completed, skipped] = await Promise.all([
      prisma.queueToken.count({ where: { date: { gte: startOfDay, lte: endOfDay } } }),
      prisma.queueToken.count({ where: { date: { gte: startOfDay, lte: endOfDay }, status: 'WAITING' } }),
      prisma.queueToken.count({ where: { date: { gte: startOfDay, lte: endOfDay }, status: 'CALLED' } }),
      prisma.queueToken.count({ where: { date: { gte: startOfDay, lte: endOfDay }, status: 'IN_CONSULTATION' } }),
      prisma.queueToken.count({ where: { date: { gte: startOfDay, lte: endOfDay }, status: 'COMPLETED' } }),
      prisma.queueToken.count({
        where: {
          date: { gte: startOfDay, lte: endOfDay },
          status: { in: ['SKIPPED', 'NO_SHOW'] },
        },
      }),
    ]);

    return res.json({
      success: true,
      totalToday,
      waiting,
      called,
      inConsultation,
      currentlyServing: called + inConsultation,
      completed,
      skipped,
      avgWaitTimeMinutes: waiting > 0 ? waiting * 12 : 0,
    });
  } catch (error) {
    next(error);
  }
}
