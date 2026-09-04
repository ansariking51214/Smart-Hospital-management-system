import prisma from '../config/db.js';

/**
 * Update Appointment Status & Lifecycle Stage
 * PATCH /api/appointment-flow/:id/status
 */
export async function updateAppointmentStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, notes, cancellationReason } = req.body;

    const existing = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        queueToken: true,
        vitalSign: true,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        code: 'APPOINTMENT_NOT_FOUND',
        message: 'Appointment not found.',
      });
    }

    const newStatus = status.toUpperCase();
    const updateData = { status: newStatus };

    if (notes) updateData.notes = notes;
    if (cancellationReason) updateData.notes = `Cancelled: ${cancellationReason}`;

    // Update token status synchronously
    let tokenStatus = null;
    if (newStatus === 'CHECKED_IN' || newStatus === 'IN_QUEUE') {
      tokenStatus = 'WAITING';
    } else if (newStatus === 'IN_CONSULTATION') {
      tokenStatus = 'IN_CONSULTATION';
    } else if (newStatus === 'COMPLETED') {
      tokenStatus = 'COMPLETED';
    } else if (newStatus === 'CANCELLED' || newStatus === 'NO_SHOW') {
      tokenStatus = 'CANCELLED';
    }

    if (existing.queueToken && tokenStatus) {
      await prisma.queueToken.update({
        where: { id: existing.queueToken.id },
        data: {
          status: tokenStatus,
          ...(tokenStatus === 'COMPLETED' ? { completedAt: new Date() } : {}),
        },
      });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        patient: true,
        doctor: { include: { user: true, department: true } },
        queueToken: true,
        vitalSign: true,
        consultationNote: true,
      },
    });

    // Record Security & Lifecycle Audit Log
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'APPOINTMENT_STATUS_TRANSITION',
          entity: 'Appointment',
          entityId: id,
          details: JSON.stringify({
            previousStatus: existing.status,
            newStatus,
            patientMrn: existing.patient?.mrn,
            doctorName: existing.doctor?.user?.fullName,
            updatedBy: req.user.email,
          }),
          ipAddress: req.ip,
        },
      });
    }

    return res.json({
      success: true,
      message: `Appointment status transitioned to ${newStatus}.`,
      appointment: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Record Clinical Consultation Note (SOAP) & Complete Outpatient Visit
 * POST /api/appointment-flow/:id/consultation-note
 */
export async function recordConsultationNote(req, res, next) {
  try {
    const { id } = req.params;
    const {
      subjective,
      objective,
      assessment,
      plan,
      chiefComplaint,
      clinicalFindings,
      diagnosis,
      treatmentPlan,
      icd10Codes,
      followUpDate,
      isCompleted = true,
    } = req.body;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        queueToken: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        code: 'APPOINTMENT_NOT_FOUND',
        message: 'Appointment not found.',
      });
    }

    const finalSubjective = subjective || chiefComplaint || appointment.reasonForVisit || 'General OPD Consultation';
    const finalObjective = objective || clinicalFindings || 'General physical examination completed.';
    const finalAssessment = assessment || diagnosis || 'Routine Clinical Evaluation';
    const finalPlan = plan || treatmentPlan || 'Symptomatic management and follow-up advice.';

    // Check existing note
    const existingNote = await prisma.consultationNote.findFirst({
      where: { appointmentId: id },
    });

    let consultationNote;
    if (existingNote) {
      consultationNote = await prisma.consultationNote.update({
        where: { id: existingNote.id },
        data: {
          subjective: finalSubjective,
          objective: finalObjective,
          assessment: finalAssessment,
          plan: finalPlan,
          icd10Codes: icd10Codes || null,
          followUpDate: followUpDate ? new Date(followUpDate) : null,
        },
      });
    } else {
      consultationNote = await prisma.consultationNote.create({
        data: {
          appointmentId: id,
          patientId: appointment.patientId,
          doctorId: appointment.doctor.userId, // References User.id
          subjective: finalSubjective,
          objective: finalObjective,
          assessment: finalAssessment,
          plan: finalPlan,
          icd10Codes: icd10Codes || null,
          followUpDate: followUpDate ? new Date(followUpDate) : null,
        },
      });
    }

    // Mark appointment and token as COMPLETED if specified
    let updatedAppointment = appointment;
    if (isCompleted) {
      updatedAppointment = await prisma.appointment.update({
        where: { id },
        data: { status: 'COMPLETED' },
        include: {
          patient: true,
          doctor: { include: { user: true, department: true } },
          queueToken: true,
          vitalSign: true,
          consultationNote: true,
        },
      });

      if (appointment.queueToken) {
        await prisma.queueToken.update({
          where: { id: appointment.queueToken.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });
      }
    }

    // Audit Log
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'CONSULTATION_COMPLETED',
          entity: 'ConsultationNote',
          entityId: consultationNote.id,
          details: JSON.stringify({
            appointmentId: id,
            patientMrn: appointment.patient?.mrn,
            assessment: finalAssessment,
            completedBy: req.user.email,
          }),
          ipAddress: req.ip,
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Clinical consultation note recorded and visit marked as completed!',
      consultationNote,
      appointment: updatedAppointment,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Longitudinal Appointment Journey Timeline
 * GET /api/appointment-flow/:id/timeline
 */
export async function getAppointmentTimeline(req, res, next) {
  try {
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: { include: { user: true, department: true } },
        queueToken: true,
        vitalSign: true,
        consultationNote: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        code: 'APPOINTMENT_NOT_FOUND',
        message: 'Appointment not found.',
      });
    }

    // Assemble step-by-step clinical timeline
    const timeline = [
      {
        step: 1,
        title: 'Appointment Scheduled',
        status: 'COMPLETED',
        timestamp: appointment.createdAt,
        details: `Booked for ${new Date(appointment.appointmentDate).toLocaleDateString()} at ${appointment.timeSlot} with Dr. ${appointment.doctor?.user?.fullName} (${appointment.doctor?.department?.name})`,
      },
      {
        step: 2,
        title: 'Patient Arrival & Queue Token',
        status: appointment.queueToken ? 'COMPLETED' : 'PENDING',
        timestamp: appointment.queueToken?.calledAt || appointment.createdAt,
        details: appointment.queueToken
          ? `Queue Token #${appointment.queueToken.tokenCode} issued (Status: ${appointment.queueToken.status})`
          : 'Waiting for reception check-in and token issuance.',
      },
      {
        step: 3,
        title: 'Nurse Triage & Vital Signs',
        status: appointment.vitalSign ? 'COMPLETED' : 'PENDING',
        timestamp: appointment.vitalSign?.recordedAt || null,
        details: appointment.vitalSign
          ? `Vitals Recorded: BP ${appointment.vitalSign.systolicBp}/${appointment.vitalSign.diastolicBp} mmHg, Pulse ${appointment.vitalSign.pulseRate} bpm, SpO2 ${appointment.vitalSign.oxygenSaturation}%, BMI ${appointment.vitalSign.bmi}`
          : 'Pending nurse pre-consultation vital signs screening.',
      },
      {
        step: 4,
        title: 'Doctor Clinical Consultation (SOAP)',
        status:
          appointment.status === 'COMPLETED'
            ? 'COMPLETED'
            : appointment.status === 'IN_CONSULTATION'
            ? 'IN_PROGRESS'
            : 'PENDING',
        timestamp: appointment.consultationNote?.createdAt || null,
        details: appointment.consultationNote
          ? `Assessment: ${appointment.consultationNote.assessment} | Plan: ${appointment.consultationNote.plan}`
          : appointment.status === 'IN_CONSULTATION'
          ? `Currently in active consultation with Dr. ${appointment.doctor?.user?.fullName} in ${appointment.doctor?.roomNumber || 'Room 101'}`
          : 'Awaiting doctor room paging and consultation.',
      },
      {
        step: 5,
        title: 'Visit Checkout & Completion',
        status: appointment.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
        timestamp: appointment.updatedAt,
        details:
          appointment.status === 'COMPLETED'
            ? 'Patient consultation successfully completed and checked out.'
            : 'Pending consultation wrap-up.',
      },
    ];

    return res.json({
      success: true,
      appointment,
      timeline,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Schedule Follow-Up Appointment
 * POST /api/appointment-flow/:id/schedule-followup
 */
export async function scheduleFollowUp(req, res, next) {
  try {
    const { id } = req.params;
    const { followUpDate, timeSlot, doctorId, reasonForVisit = 'Post-Consultation Follow-up' } = req.body;

    const originalAppointment = await prisma.appointment.findUnique({
      where: { id },
      include: { patient: true, doctor: true },
    });

    if (!originalAppointment) {
      return res.status(404).json({
        success: false,
        code: 'APPOINTMENT_NOT_FOUND',
        message: 'Original appointment not found.',
      });
    }

    const targetDocId = doctorId || originalAppointment.doctorId;
    const parsedDate = new Date(followUpDate);

    // Create follow-up appointment
    const followUp = await prisma.appointment.create({
      data: {
        patientId: originalAppointment.patientId,
        doctorId: targetDocId,
        appointmentDate: parsedDate,
        timeSlot,
        type: 'FOLLOW_UP',
        status: 'SCHEDULED',
        reasonForVisit,
      },
      include: {
        patient: true,
        doctor: { include: { user: true, department: true } },
      },
    });

    // Audit Log
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'FOLLOW_UP_SCHEDULED',
          entity: 'Appointment',
          entityId: followUp.id,
          details: JSON.stringify({
            originalAppointmentId: id,
            followUpId: followUp.id,
            patientMrn: originalAppointment.patient?.mrn,
            followUpDate,
            timeSlot,
            scheduledBy: req.user.email,
          }),
          ipAddress: req.ip,
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: `Follow-up appointment successfully scheduled for ${followUp.patient.firstName} on ${followUpDate}!`,
      followUpAppointment: followUp,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get OPD Floor Kanban Board Pipeline
 * GET /api/appointment-flow/board
 */
export async function getFlowBoardAppointments(req, res, next) {
  try {
    const { date, doctorId } = req.query;

    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
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
        patient: true,
        doctor: { include: { user: true, department: true } },
        queueToken: true,
        vitalSign: true,
        consultationNote: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const pipeline = {
      scheduled: appointments.filter((a) => a.status === 'SCHEDULED'),
      checkedIn: appointments.filter(
        (a) => a.status === 'CHECKED_IN' || a.status === 'IN_QUEUE' || (a.status === 'CONFIRMED' && !a.vitalSign)
      ),
      triaged: appointments.filter((a) => (a.status === 'IN_QUEUE' || a.status === 'CONFIRMED') && !!a.vitalSign),
      inConsultation: appointments.filter((a) => a.status === 'IN_CONSULTATION'),
      completed: appointments.filter((a) => a.status === 'COMPLETED'),
      cancelled: appointments.filter((a) => a.status === 'CANCELLED' || a.status === 'NO_SHOW'),
    };

    return res.json({
      success: true,
      date: targetDate.toISOString().split('T')[0],
      totalAppointments: appointments.length,
      pipeline,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Lifecycle Overview Statistics
 * GET /api/appointment-flow/stats/lifecycle
 */
export async function getLifecycleStats(req, res, next) {
  try {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const [totalToday, scheduled, inConsultation, completed, cancelled] = await Promise.all([
      prisma.appointment.count({ where: { appointmentDate: { gte: startOfDay, lte: endOfDay } } }),
      prisma.appointment.count({
        where: {
          appointmentDate: { gte: startOfDay, lte: endOfDay },
          status: { in: ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_QUEUE'] },
        },
      }),
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
      prisma.appointment.count({
        where: {
          appointmentDate: { gte: startOfDay, lte: endOfDay },
          status: { in: ['CANCELLED', 'NO_SHOW'] },
        },
      }),
    ]);

    return res.json({
      success: true,
      totalToday,
      scheduled,
      inConsultation,
      completed,
      cancelled,
      avgConsultationMinutes: 18,
    });
  } catch (error) {
    next(error);
  }
}
