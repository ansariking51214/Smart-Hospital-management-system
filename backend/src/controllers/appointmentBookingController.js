import prisma from '../config/db.js';

/**
 * Dynamic Time Slot Generator for a Doctor on a Target Date
 * GET /api/appointments/slots?doctorId=...&date=YYYY-MM-DD
 */
export async function getDoctorAvailableSlots(req, res, next) {
  try {
    const { doctorId, date, slotDuration = 30 } = req.query;

    const doctor = await prisma.doctorProfile.findFirst({
      where: {
        OR: [{ id: doctorId }, { userId: doctorId }],
      },
      include: {
        user: { select: { fullName: true, email: true } },
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

    const targetDate = new Date(date);
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const targetDayAbbr = daysOfWeek[targetDate.getDay()];

    const workingDays = doctor.availableDays
      ? doctor.availableDays.split(',').map((d) => d.trim())
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

    const isDoctorWorking = workingDays.includes(targetDayAbbr);

    if (!isDoctorWorking) {
      return res.json({
        success: true,
        doctorId: doctor.id,
        doctorName: doctor.user?.fullName,
        department: doctor.department?.name,
        date,
        dayOfWeek: targetDayAbbr,
        isDoctorWorking: false,
        message: `Dr. ${doctor.user?.fullName} does not have a scheduled shift on ${targetDayAbbr}s. Working days: ${doctor.availableDays}`,
        slots: [],
        summary: { totalSlots: 0, availableSlots: 0, bookedSlots: 0, occupancyRate: '0%' },
      });
    }

    // Generate intervals between shiftStart (e.g. 09:00) and shiftEnd (e.g. 15:00)
    const rawSlots = generateTimeIntervals(
      doctor.shiftStart || '09:00',
      doctor.shiftEnd || '17:00',
      Number(slotDuration)
    );

    // Fetch existing active bookings for this doctor on this target date
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { not: 'CANCELLED' },
      },
      include: {
        patient: {
          select: { mrn: true, firstName: true, lastName: true },
        },
      },
    });

    const bookedSlotMap = {};
    existingAppointments.forEach((appt) => {
      bookedSlotMap[appt.timeSlot] = {
        appointmentId: appt.id,
        status: appt.status,
        patientName: `${appt.patient.firstName} ${appt.patient.lastName}`,
        patientMrn: appt.patient.mrn,
      };
    });

    const processedSlots = rawSlots.map((slotString, index) => {
      const booking = bookedSlotMap[slotString];
      return {
        id: `slot-${index + 1}`,
        timeSlot: slotString,
        isAvailable: !booking,
        status: booking ? 'BOOKED' : 'AVAILABLE',
        bookingInfo: booking || null,
      };
    });

    const totalSlots = processedSlots.length;
    const bookedCount = processedSlots.filter((s) => !s.isAvailable).length;
    const availableCount = totalSlots - bookedCount;
    const occupancyRate = totalSlots > 0 ? `${Math.round((bookedCount / totalSlots) * 100)}%` : '0%';

    return res.json({
      success: true,
      doctorId: doctor.id,
      doctorName: doctor.user?.fullName,
      department: doctor.department?.name,
      roomNumber: doctor.roomNumber,
      consultationFee: doctor.consultationFee,
      date,
      dayOfWeek: targetDayAbbr,
      isDoctorWorking: true,
      shiftHours: `${doctor.shiftStart} - ${doctor.shiftEnd}`,
      slots: processedSlots,
      summary: {
        totalSlots,
        availableSlots: availableCount,
        bookedSlots: bookedCount,
        occupancyRate,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Book an OPD / Consultation Appointment
 * POST /api/appointments/book
 */
export async function bookAppointment(req, res, next) {
  try {
    const {
      doctorId,
      patientId,
      patientMrn,
      appointmentDate,
      timeSlot,
      type = 'OPD',
      reasonForVisit = 'General Consultation',
      notes = '',
    } = req.body;

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
        message: 'Patient profile could not be found with provided ID or MRN.',
      });
    }

    // 2. Resolve Doctor
    const doctor = await prisma.doctorProfile.findFirst({
      where: {
        OR: [{ id: doctorId }, { userId: doctorId }],
      },
      include: {
        user: { select: { fullName: true, email: true } },
        department: true,
      },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        code: 'DOCTOR_NOT_FOUND',
        message: 'Selected doctor could not be found.',
      });
    }

    // 3. Collision Check: Verify no existing active booking for this doctor + date + slot
    const parsedDate = new Date(appointmentDate);
    const startOfDay = new Date(parsedDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(parsedDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const conflict = await prisma.appointment.findFirst({
      where: {
        doctorId: doctor.id,
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        timeSlot: timeSlot.trim(),
        status: { not: 'CANCELLED' },
      },
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        code: 'SLOT_CONFLICT',
        message: `Time slot '${timeSlot}' on ${appointmentDate.split('T')[0]} is already booked with Dr. ${doctor.user?.fullName}. Please select another slot.`,
      });
    }

    // 4. Create Appointment Record
    const newAppointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        appointmentDate: parsedDate,
        timeSlot: timeSlot.trim(),
        type: type.toUpperCase(),
        status: 'SCHEDULED',
        reasonForVisit: reasonForVisit.trim(),
        notes: notes?.trim() || null,
      },
      include: {
        patient: true,
        doctor: {
          include: {
            user: { select: { fullName: true, email: true, phone: true } },
            department: true,
          },
        },
      },
    });

    // 5. Generate daily sequence token for OPD Queue
    const todayAppointmentsCount = await prisma.appointment.count({
      where: {
        doctorId: doctor.id,
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const deptCode = doctor.department?.code || 'OPD';
    const tokenCode = `${deptCode}-${String(todayAppointmentsCount).padStart(3, '0')}`;

    const queueToken = await prisma.queueToken.create({
      data: {
        appointmentId: newAppointment.id,
        patientId: patient.id,
        doctorId: doctor.id,
        tokenNumber: todayAppointmentsCount,
        tokenCode,
        status: 'WAITING',
      },
    });

    // 6. Security & Booking Audit Log
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'APPOINTMENT_BOOKED',
          entity: 'Appointment',
          entityId: newAppointment.id,
          details: JSON.stringify({
            appointmentId: newAppointment.id,
            patientMrn: patient.mrn,
            doctorName: doctor.user?.fullName,
            timeSlot: newAppointment.timeSlot,
            date: newAppointment.appointmentDate,
            tokenCode,
            bookedBy: req.user.email,
          }),
          ipAddress: req.ip,
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: `Appointment successfully booked with Dr. ${doctor.user?.fullName} for ${timeSlot}!`,
      appointment: {
        ...newAppointment,
        queueToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List & Filter Appointments
 * GET /api/appointments
 */
export async function getAppointments(req, res, next) {
  try {
    const {
      doctorId,
      patientId,
      date,
      status,
      type,
      page = 1,
      limit = 30,
    } = req.query;

    const whereClause = {};

    if (doctorId) whereClause.doctorId = doctorId;
    if (patientId) whereClause.patientId = patientId;
    if (status) whereClause.status = status.toUpperCase();
    if (type) whereClause.type = type.toUpperCase();

    if (date) {
      const parsed = new Date(date);
      const start = new Date(parsed);
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date(parsed);
      end.setUTCHours(23, 59, 59, 999);

      whereClause.appointmentDate = { gte: start, lte: end };
    }

    const [total, appointments] = await Promise.all([
      prisma.appointment.count({ where: whereClause }),
      prisma.appointment.findMany({
        where: whereClause,
        orderBy: [{ appointmentDate: 'desc' }, { timeSlot: 'asc' }],
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          patient: {
            select: {
              id: true,
              mrn: true,
              firstName: true,
              lastName: true,
              phone: true,
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
          queueToken: true,
          vitalSign: true,
          consultationNote: true,
        },
      }),
    ]);

    const formatted = appointments.map((a) => ({
      ...a,
      patientFullName: `${a.patient.firstName} ${a.patient.lastName}`,
      doctorFullName: a.doctor?.user?.fullName || 'Doctor',
      departmentName: a.doctor?.department?.name || 'General OPD',
    }));

    return res.json({
      success: true,
      total,
      count: formatted.length,
      page: Number(page),
      limit: Number(limit),
      appointments: formatted,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Reschedule an Appointment to a New Slot
 * PATCH /api/appointments/:id/reschedule
 */
export async function rescheduleAppointment(req, res, next) {
  try {
    const { id } = req.params;
    const { appointmentDate, timeSlot, reason = '' } = req.body;

    const existing = await prisma.appointment.findUnique({
      where: { id },
      include: { doctor: { include: { user: true } }, patient: true },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        code: 'APPOINTMENT_NOT_FOUND',
        message: 'Appointment record not found.',
      });
    }

    const newDate = new Date(appointmentDate);
    const startOfDay = new Date(newDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(newDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Conflict check
    const conflict = await prisma.appointment.findFirst({
      where: {
        doctorId: existing.doctorId,
        id: { not: id },
        appointmentDate: { gte: startOfDay, lte: endOfDay },
        timeSlot: timeSlot.trim(),
        status: { not: 'CANCELLED' },
      },
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        code: 'SLOT_CONFLICT',
        message: `Time slot '${timeSlot}' on ${appointmentDate} is already booked. Please choose another time.`,
      });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        appointmentDate: newDate,
        timeSlot: timeSlot.trim(),
        status: 'CONFIRMED',
        notes: reason ? `${existing.notes ? existing.notes + ' | ' : ''}Rescheduled: ${reason}` : existing.notes,
      },
      include: {
        patient: true,
        doctor: { include: { user: true, department: true } },
      },
    });

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'APPOINTMENT_RESCHEDULED',
          entity: 'Appointment',
          entityId: id,
          details: JSON.stringify({
            appointmentId: id,
            oldSlot: existing.timeSlot,
            newSlot: timeSlot,
            newDate: appointmentDate,
            reason,
            updatedBy: req.user.email,
          }),
          ipAddress: req.ip,
        },
      });
    }

    return res.json({
      success: true,
      message: `Appointment successfully rescheduled to ${timeSlot} on ${newDate.toISOString().split('T')[0]}.`,
      appointment: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Cancel an Appointment
 * PATCH /api/appointments/:id/cancel
 */
export async function cancelAppointment(req, res, next) {
  try {
    const { id } = req.params;
    const { cancellationReason = 'Cancelled by patient/staff' } = req.body;

    const existing = await prisma.appointment.findUnique({
      where: { id },
      include: { patient: true, doctor: { include: { user: true } } },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        code: 'APPOINTMENT_NOT_FOUND',
        message: 'Appointment record not found.',
      });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: `${existing.notes ? existing.notes + ' | ' : ''}Cancelled: ${cancellationReason}`,
      },
    });

    // Update queue token status to CANCELLED if exists
    await prisma.queueToken.updateMany({
      where: { appointmentId: id },
      data: { status: 'CANCELLED' },
    });

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'APPOINTMENT_CANCELLED',
          entity: 'Appointment',
          entityId: id,
          details: JSON.stringify({
            appointmentId: id,
            patientMrn: existing.patient.mrn,
            reason: cancellationReason,
            cancelledBy: req.user.email,
          }),
          ipAddress: req.ip,
        },
      });
    }

    return res.json({
      success: true,
      message: 'Appointment has been cancelled and the time slot is now released.',
      appointment: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Booking & OPD Queue Overview Stats
 * GET /api/appointments/stats/overview
 */
export async function getBookingStats(req, res, next) {
  try {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const [totalAllTime, todayTotal, todayScheduled, todayCompleted, todayCancelled] =
      await Promise.all([
        prisma.appointment.count(),
        prisma.appointment.count({ where: { appointmentDate: { gte: startOfDay, lte: endOfDay } } }),
        prisma.appointment.count({
          where: { appointmentDate: { gte: startOfDay, lte: endOfDay }, status: 'SCHEDULED' },
        }),
        prisma.appointment.count({
          where: { appointmentDate: { gte: startOfDay, lte: endOfDay }, status: 'COMPLETED' },
        }),
        prisma.appointment.count({
          where: { appointmentDate: { gte: startOfDay, lte: endOfDay }, status: 'CANCELLED' },
        }),
      ]);

    return res.json({
      success: true,
      totalAllTime,
      todayTotal,
      todayScheduled,
      todayCompleted,
      todayCancelled,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Helper: Generate fixed-duration interval strings between start and end time
 */
function generateTimeIntervals(startTimeStr, endTimeStr, durationMinutes = 30) {
  const [startH, startM] = startTimeStr.split(':').map(Number);
  const [endH, endM] = endTimeStr.split(':').map(Number);

  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;

  const slots = [];
  let current = startTotal;

  while (current + durationMinutes <= endTotal) {
    const slotStartH = Math.floor(current / 60);
    const slotStartM = current % 60;
    const slotEndH = Math.floor((current + durationMinutes) / 60);
    const slotEndM = (current + durationMinutes) % 60;

    const startFormatted = `${String(slotStartH).padStart(2, '0')}:${String(slotStartM).padStart(2, '0')}`;
    const endFormatted = `${String(slotEndH).padStart(2, '0')}:${String(slotEndM).padStart(2, '0')}`;

    slots.push(`${startFormatted} - ${endFormatted}`);
    current += durationMinutes;
  }

  return slots;
}
