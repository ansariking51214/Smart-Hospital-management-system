import prisma from '../config/db.js';

/**
 * Get Active Patient 360° EHR Clinical Encounter Snapshot
 * GET /api/consultation/active-patient/:patientId
 */
export async function getActivePatientEhrSnapshot(req, res, next) {
  try {
    const { patientId } = req.params;

    const patient = await prisma.patientProfile.findFirst({
      where: {
        OR: [{ id: patientId }, { mrn: patientId }],
      },
      include: {
        emergencyContacts: true,
        vitalSigns: {
          orderBy: { recordedAt: 'desc' },
          take: 5,
        },
        consultationNotes: {
          orderBy: { createdAt: 'desc' },
          include: {
            doctor: { select: { fullName: true, email: true } },
            prescription: {
              include: { items: { include: { medication: true } } },
            },
            labOrders: { include: { test: true } },
          },
        },
        appointments: {
          orderBy: { appointmentDate: 'desc' },
          include: {
            doctor: { include: { user: true, department: true } },
            queueToken: true,
          },
          take: 5,
        },
        prescriptions: {
          orderBy: { issuedAt: 'desc' },
          include: {
            items: { include: { medication: true } },
            doctor: { include: { user: true } },
          },
          take: 5,
        },
      },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        code: 'PATIENT_NOT_FOUND',
        message: 'Patient not found for consultation snapshot.',
      });
    }

    // Calculate Age
    const birthDate = new Date(patient.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    // Parse Known Allergies & Clinical Risk Flags
    const allergyList = patient.allergies
      ? patient.allergies
          .split(',')
          .map((a) => a.trim())
          .filter((a) => a.length > 0 && a.toLowerCase() !== 'none' && a.toLowerCase() !== 'nkda')
      : [];

    const hasCriticalAllergies = allergyList.length > 0;

    // Latest Vitals Snapshot
    const latestVitals = patient.vitalSigns[0] || null;
    let vitalsAssessment = null;
    if (latestVitals) {
      const isRed =
        (latestVitals.oxygenSaturation !== null && latestVitals.oxygenSaturation < 90) ||
        (latestVitals.systolicBp !== null && latestVitals.systolicBp >= 180) ||
        (latestVitals.pulseRate !== null && latestVitals.pulseRate >= 130);

      const isAmber =
        (latestVitals.oxygenSaturation !== null && latestVitals.oxygenSaturation <= 94) ||
        (latestVitals.systolicBp !== null && latestVitals.systolicBp >= 140) ||
        (latestVitals.pulseRate !== null && latestVitals.pulseRate >= 100);

      vitalsAssessment = {
        level: isRed ? 'RED' : isAmber ? 'AMBER' : 'GREEN',
        badgeLabel: isRed
          ? 'CRITICAL ALERT (Red)'
          : isAmber
          ? 'URGENT WATCHLIST (Amber)'
          : 'STABLE / NORMAL (Green)',
      };
    }

    // Audit Trail
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'EHR_CONSULTATION_ACCESSED',
          entity: 'PatientProfile',
          entityId: patient.id,
          details: JSON.stringify({
            mrn: patient.mrn,
            accessedBy: req.user.email,
            patientName: `${patient.firstName} ${patient.lastName}`,
          }),
          ipAddress: req.ip,
        },
      });
    }

    return res.json({
      success: true,
      patient: {
        id: patient.id,
        mrn: patient.mrn,
        fullName: `${patient.firstName} ${patient.lastName}`,
        firstName: patient.firstName,
        lastName: patient.lastName,
        age,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        bloodGroup: patient.bloodGroup || 'Not Recorded',
        phone: patient.phone,
        email: patient.email,
        address: patient.address,
        medicalHistory: patient.medicalHistory,
        surgicalHistory: patient.surgicalHistory,
        allergies: patient.allergies,
        allergyList,
        hasCriticalAllergies,
        chronicConditions: patient.chronicConditions,
      },
      latestVitals,
      vitalsAssessment,
      vitalsHistory: patient.vitalSigns,
      consultationHistory: patient.consultationNotes,
      recentAppointments: patient.appointments,
      activePrescriptions: patient.prescriptions,
      emergencyContacts: patient.emergencyContacts,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Attending Doctor's Active Daily Worklist
 * GET /api/consultation/doctor-worklist
 */
export async function getDoctorWorklist(req, res, next) {
  try {
    const { doctorId } = req.query;

    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const whereClause = {
      appointmentDate: { gte: startOfDay, lte: endOfDay },
    };

    if (doctorId) {
      whereClause.doctorId = doctorId;
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
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
        doctor: { include: { user: true, department: true } },
        queueToken: true,
        vitalSign: true,
        consultationNote: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const waitingQueue = appointments.filter(
      (a) => a.status === 'SCHEDULED' || a.status === 'CHECKED_IN' || a.status === 'IN_QUEUE' || a.status === 'CONFIRMED'
    );

    const activeInRoom = appointments.filter((a) => a.status === 'IN_CONSULTATION');
    const completedList = appointments.filter((a) => a.status === 'COMPLETED');

    return res.json({
      success: true,
      date: today.toISOString().split('T')[0],
      totalAppointments: appointments.length,
      counts: {
        waiting: waitingQueue.length,
        inRoom: activeInRoom.length,
        completed: completedList.length,
      },
      waitingQueue,
      activeInRoom,
      completedList,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Start Clinical Encounter (Doctor Calls In & Begins Consultation)
 * POST /api/consultation/encounter/start
 */
export async function startClinicalEncounter(req, res, next) {
  try {
    const { appointmentId, patientId } = req.body;

    let appointment = null;
    if (appointmentId) {
      appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { patient: true, doctor: { include: { user: true } }, queueToken: true },
      });
    } else if (patientId) {
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setUTCHours(23, 59, 59, 999);

      appointment = await prisma.appointment.findFirst({
        where: {
          patientId,
          appointmentDate: { gte: startOfDay, lte: endOfDay },
          status: { in: ['SCHEDULED', 'CHECKED_IN', 'IN_QUEUE', 'CONFIRMED'] },
        },
        include: { patient: true, doctor: { include: { user: true } }, queueToken: true },
      });
    }

    if (!appointment) {
      return res.status(404).json({
        success: false,
        code: 'APPOINTMENT_NOT_FOUND',
        message: 'No active scheduled appointment found for this encounter.',
      });
    }

    // Transition appointment & token to IN_CONSULTATION
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: 'IN_CONSULTATION' },
      include: {
        patient: true,
        doctor: { include: { user: true, department: true } },
        queueToken: true,
        vitalSign: true,
      },
    });

    if (appointment.queueToken) {
      await prisma.queueToken.update({
        where: { id: appointment.queueToken.id },
        data: { status: 'IN_CONSULTATION' },
      });
    }

    // Security & Clinical Encounter Audit
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'ENCOUNTER_INITIALIZED',
          entity: 'Appointment',
          entityId: appointment.id,
          details: JSON.stringify({
            patientMrn: appointment.patient.mrn,
            doctorName: appointment.doctor.user?.fullName,
            startedBy: req.user.email,
          }),
          ipAddress: req.ip,
        },
      });
    }

    return res.json({
      success: true,
      message: `Clinical encounter started with ${appointment.patient.firstName} ${appointment.patient.lastName} (${appointment.patient.mrn}).`,
      encounter: updatedAppointment,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Previous Consultation History Drawer for Patient
 * GET /api/consultation/patient/:patientId/history-drawer
 */
export async function getPatientHistoryDrawer(req, res, next) {
  try {
    const { patientId } = req.params;

    const patient = await prisma.patientProfile.findFirst({
      where: {
        OR: [{ id: patientId }, { mrn: patientId }],
      },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        code: 'PATIENT_NOT_FOUND',
        message: 'Patient profile not found.',
      });
    }

    const notes = await prisma.consultationNote.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: 'desc' },
      include: {
        doctor: { select: { fullName: true, email: true } },
        appointment: { select: { appointmentDate: true, timeSlot: true } },
        prescription: {
          include: { items: { include: { medication: true } } },
        },
        labOrders: { include: { test: true } },
      },
    });

    return res.json({
      success: true,
      patientName: `${patient.firstName} ${patient.lastName}`,
      mrn: patient.mrn,
      totalVisits: notes.length,
      history: notes,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Doctor Consultation Statistics Overview
 * GET /api/consultation/stats/overview
 */
export async function getConsultationStats(req, res, next) {
  try {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const [totalScheduled, inConsultation, completed, totalPatients] = await Promise.all([
      prisma.appointment.count({ where: { appointmentDate: { gte: startOfDay, lte: endOfDay } } }),
      prisma.appointment.count({
        where: {
          appointmentDate: { gte: startOfDay, lte: endOfDay },
          status: 'IN_CONSULTATION',
        },
      }),
      prisma.appointment.count({
        where: {
          appointmentDate: { gte: startOfDay, lte: endOfDay },
          status: 'COMPLETED',
        },
      }),
      prisma.patientProfile.count(),
    ]);

    return res.json({
      success: true,
      totalScheduled,
      inConsultation,
      completed,
      waiting: totalScheduled - inConsultation - completed,
      totalPatients,
      avgConsultTimeMinutes: 18,
    });
  } catch (error) {
    next(error);
  }
}
