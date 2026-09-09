import prisma from '../config/db.js';
import { evaluateClinicalSafety, searchClinicalCatalog } from '../utils/clinicalSafety.js';

export async function getClinicalCatalog(req, res, next) {
  try {
    const { search = '', type = 'all' } = req.query;
    return res.json({ success: true, ...searchClinicalCatalog(search, type) });
  } catch (error) {
    next(error);
  }
}

export async function checkClinicalSafety(req, res, next) {
  try {
    const { patientId, allergies, medications = [], icd10Codes = [] } = req.body;
    let resolvedAllergies = allergies;
    let patient = null;

    if (patientId) {
      patient = await prisma.patientProfile.findFirst({
        where: { OR: [{ id: patientId }, { mrn: patientId }] },
        select: { id: true, mrn: true, firstName: true, lastName: true, allergies: true },
      });
      if (!patient) {
        return res.status(404).json({ success: false, code: 'PATIENT_NOT_FOUND', message: 'Patient profile not found.' });
      }
      resolvedAllergies = patient.allergies || '';
    }

    const safety = evaluateClinicalSafety({ allergies: resolvedAllergies, medications, icd10Codes });
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'CLINICAL_SAFETY_CHECKED',
          entity: 'PatientProfile',
          entityId: patient?.id,
          details: JSON.stringify({ medications: safety.medications, icd10Codes: safety.icd10Codes, alertCount: safety.alerts.length }),
          ipAddress: req.ip,
        },
      });
    }

    return res.json({ success: true, patient, ...safety });
  } catch (error) {
    next(error);
  }
}

export async function createPrescription(req, res, next) {
  try {
    const {
      patientId,
      consultationNoteId,
      doctorId,
      generalAdvice = '',
      dietaryAdvice = '',
      validUntil,
      items = [],
    } = req.body;

    if (!patientId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        code: 'PRESCRIPTION_VALIDATION_FAILED',
        message: 'Patient and at least one medication are required to issue a prescription.',
      });
    }

    const patient = await prisma.patientProfile.findFirst({
      where: { OR: [{ id: patientId }, { mrn: patientId }] },
      select: { id: true, mrn: true, firstName: true, lastName: true, allergies: true },
    });
    if (!patient) {
      return res.status(404).json({ success: false, code: 'PATIENT_NOT_FOUND', message: 'Patient profile not found.' });
    }

    const invalidItem = items.find((item) => !item.medicineName || !item.dosage || !item.frequency || !item.duration);
    if (invalidItem) {
      return res.status(400).json({
        success: false,
        code: 'PRESCRIPTION_ITEM_INVALID',
        message: 'Each medication requires a name, dosage, frequency, and duration.',
      });
    }

    const safety = evaluateClinicalSafety({
      allergies: patient.allergies,
      medications: items.map((item) => item.medicineName),
    });
    if (safety.hasCriticalAlerts) {
      return res.status(409).json({
        success: false,
        code: 'PRESCRIPTION_BLOCKED_BY_SAFETY_ALERT',
        message: 'Prescription blocked until critical clinical safety alerts are resolved.',
        safety,
      });
    }

    const prescribingUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { doctorProfile: true },
    });
    const resolvedDoctorId = doctorId || prescribingUser?.doctorProfile?.id;
    if (!resolvedDoctorId) {
      return res.status(400).json({
        success: false,
        code: 'DOCTOR_PROFILE_REQUIRED',
        message: 'A doctor profile is required to issue an electronic prescription.',
      });
    }

    const doctor = await prisma.doctorProfile.findUnique({ where: { id: resolvedDoctorId }, select: { id: true } });
    if (!doctor) {
      return res.status(404).json({ success: false, code: 'DOCTOR_NOT_FOUND', message: 'Prescribing doctor not found.' });
    }

    const year = new Date().getFullYear();
    const prescriptionCount = await prisma.prescription.count({
      where: { issuedDate: { gte: new Date(`${year}-01-01T00:00:00.000Z`) } },
    });
    const prescriptionNumber = `RX-${year}-${String(prescriptionCount + 1).padStart(4, '0')}`;
    const prescription = await prisma.prescription.create({
      data: {
        prescriptionNumber,
        patientId: patient.id,
        doctorId: doctor.id,
        consultationNoteId: consultationNoteId || null,
        generalAdvice: generalAdvice.trim() || null,
        dietaryAdvice: dietaryAdvice.trim() || null,
        validUntil: validUntil ? new Date(validUntil) : null,
        items: {
          create: items.map((item) => ({
            medicineName: item.medicineName.trim(),
            dosage: item.dosage.trim(),
            frequency: item.frequency.trim(),
            timing: item.timing?.trim() || null,
            duration: item.duration.trim(),
            instructions: item.instructions?.trim() || null,
          })),
        },
      },
      include: { items: true, patient: true, doctor: { include: { user: true } } },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'PRESCRIPTION_ISSUED',
        entity: 'Prescription',
        entityId: prescription.id,
        details: JSON.stringify({ patientMrn: patient.mrn, prescriptionNumber, itemCount: items.length }),
        ipAddress: req.ip,
      },
    });

    return res.status(201).json({ success: true, prescription, safety });
  } catch (error) {
    next(error);
  }
}

export async function getPatientPrescriptions(req, res, next) {
  try {
    const patient = await prisma.patientProfile.findFirst({
      where: { OR: [{ id: req.params.patientId }, { mrn: req.params.patientId }] },
      select: { id: true, mrn: true, firstName: true, lastName: true },
    });
    if (!patient) return res.status(404).json({ success: false, code: 'PATIENT_NOT_FOUND', message: 'Patient profile not found.' });

    const prescriptions = await prisma.prescription.findMany({
      where: { patientId: patient.id },
      orderBy: { issuedDate: 'desc' },
      include: { items: true, doctor: { include: { user: true } } },
    });
    return res.json({ success: true, patient, prescriptions });
  } catch (error) {
    next(error);
  }
}

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

// -------------------------------------------------------------
// MODULE 3 - DAY 2: CLINICAL SOAP NOTES & ENCOUNTER FINALIZATION
// -------------------------------------------------------------

/**
 * Create or Update Structured Clinical SOAP Note
 * POST /api/consultation/soap-notes
 * PUT /api/consultation/soap-notes/:id
 */
export async function createOrUpdateSoapNote(req, res, next) {
  try {
    const { id } = req.params;
    const {
      patientId,
      appointmentId,
      doctorId,
      subjective,
      objective,
      assessment,
      plan,
      icd10Codes,
      followUpDate,
      isFinalized = false,
    } = req.body;

    // Resolve Patient Profile by ID or MRN
    const patient = await prisma.patientProfile.findFirst({
      where: {
        OR: [{ id: patientId }, { mrn: patientId }],
      },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        code: 'PATIENT_NOT_FOUND',
        message: 'Target patient profile not found for SOAP documentation.',
      });
    }

    // Resolve Attending Doctor User ID
    let doctorUserId = req.user ? req.user.id : null;
    if (doctorId) {
      const docUser = await prisma.user.findFirst({
        where: { OR: [{ id: doctorId }, { doctorProfile: { id: doctorId } }] },
      });
      if (docUser) doctorUserId = docUser.id;
    }

    if (!doctorUserId) {
      const defaultDoc = await prisma.user.findFirst({ where: { role: 'DOCTOR' } });
      doctorUserId = defaultDoc ? defaultDoc.id : null;
    }

    if (!doctorUserId) {
      return res.status(400).json({
        success: false,
        code: 'DOCTOR_REQUIRED',
        message: 'Valid attending physician account is required to sign SOAP notes.',
      });
    }

    // Process Date
    const parsedFollowUp = followUpDate ? new Date(followUpDate) : null;

    let consultationNote;
    let actionType = 'SOAP_NOTE_CREATED';

    if (id) {
      // Update existing note
      const existing = await prisma.consultationNote.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({
          success: false,
          code: 'SOAP_NOTE_NOT_FOUND',
          message: `SOAP note with ID ${id} not found.`,
        });
      }

      consultationNote = await prisma.consultationNote.update({
        where: { id },
        data: {
          subjective: subjective.trim(),
          objective: objective.trim(),
          assessment: assessment.trim(),
          plan: plan.trim(),
          icd10Codes: icd10Codes || null,
          followUpDate: parsedFollowUp,
        },
        include: {
          patient: true,
          doctor: { select: { id: true, fullName: true, email: true, role: true } },
          appointment: true,
        },
      });
      actionType = 'SOAP_NOTE_UPDATED';
    } else {
      // Check if note already exists for this appointment
      let existingApptNote = null;
      if (appointmentId) {
        existingApptNote = await prisma.consultationNote.findFirst({
          where: { appointmentId },
        });
      }

      if (existingApptNote) {
        consultationNote = await prisma.consultationNote.update({
          where: { id: existingApptNote.id },
          data: {
            subjective: subjective.trim(),
            objective: objective.trim(),
            assessment: assessment.trim(),
            plan: plan.trim(),
            icd10Codes: icd10Codes || null,
            followUpDate: parsedFollowUp,
          },
          include: {
            patient: true,
            doctor: { select: { id: true, fullName: true, email: true, role: true } },
            appointment: true,
          },
        });
        actionType = 'SOAP_NOTE_UPDATED';
      } else {
        consultationNote = await prisma.consultationNote.create({
          data: {
            patientId: patient.id,
            doctorId: doctorUserId,
            appointmentId: appointmentId || null,
            subjective: subjective.trim(),
            objective: objective.trim(),
            assessment: assessment.trim(),
            plan: plan.trim(),
            icd10Codes: icd10Codes || null,
            followUpDate: parsedFollowUp,
          },
          include: {
            patient: true,
            doctor: { select: { id: true, fullName: true, email: true, role: true } },
            appointment: true,
          },
        });
      }
    }

    // Handle Finalization (Transitioning encounter to COMPLETED)
    let updatedAppointment = null;
    const apptToUpdateId = appointmentId || (consultationNote ? consultationNote.appointmentId : null);

    if (isFinalized && apptToUpdateId) {
      updatedAppointment = await prisma.appointment.update({
        where: { id: apptToUpdateId },
        data: { status: 'COMPLETED' },
        include: { queueToken: true },
      });

      if (updatedAppointment.queueToken) {
        await prisma.queueToken.update({
          where: { id: updatedAppointment.queueToken.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });
      }
      actionType = 'SOAP_NOTE_FINALIZED';
    }

    // Audit Trail Logging
    if (req.user || doctorUserId) {
      await prisma.auditLog.create({
        data: {
          userId: req.user ? req.user.id : doctorUserId,
          action: actionType,
          entity: 'ConsultationNote',
          entityId: consultationNote.id,
          details: JSON.stringify({
            patientMrn: patient.mrn,
            diagnosis: consultationNote.assessment,
            icd10: consultationNote.icd10Codes,
            isFinalized,
            signedBy: req.user ? req.user.email : 'Attending Physician',
          }),
          ipAddress: req.ip,
        },
      });
    }

    return res.status(id ? 200 : 201).json({
      success: true,
      message: isFinalized
        ? 'Clinical SOAP note signed & encounter marked as COMPLETED.'
        : 'Clinical SOAP note saved successfully.',
      isFinalized,
      consultationNote,
      appointment: updatedAppointment,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get All SOAP Notes for a Specific Patient
 * GET /api/consultation/soap-notes/patient/:patientId
 */
export async function getPatientSoapNotes(req, res, next) {
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

    const soapNotes = await prisma.consultationNote.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: 'desc' },
      include: {
        doctor: { select: { id: true, fullName: true, email: true } },
        appointment: { select: { id: true, appointmentDate: true, timeSlot: true, type: true, status: true } },
        prescription: { include: { items: true } },
        labOrders: true,
      },
    });

    return res.json({
      success: true,
      patient: {
        id: patient.id,
        mrn: patient.mrn,
        fullName: `${patient.firstName} ${patient.lastName}`,
        allergies: patient.allergies,
        chronicConditions: patient.chronicConditions,
      },
      totalNotes: soapNotes.length,
      soapNotes,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Specific SOAP Note by ID
 * GET /api/consultation/soap-notes/:id
 */
export async function getSoapNoteById(req, res, next) {
  try {
    const { id } = req.params;

    const note = await prisma.consultationNote.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: { select: { id: true, fullName: true, email: true } },
        appointment: { include: { vitalSign: true, queueToken: true } },
        prescription: { include: { items: true } },
        labOrders: true,
      },
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        code: 'SOAP_NOTE_NOT_FOUND',
        message: `Clinical SOAP note with ID ${id} not found.`,
      });
    }

    return res.json({
      success: true,
      soapNote: note,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Finalize Clinical SOAP Note & Complete Encounter
 * POST /api/consultation/soap-notes/:id/finalize
 */
export async function finalizeSoapEncounter(req, res, next) {
  try {
    const { id } = req.params;

    const note = await prisma.consultationNote.findUnique({
      where: { id },
      include: { patient: true, appointment: true },
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        code: 'SOAP_NOTE_NOT_FOUND',
        message: 'SOAP note not found for finalization.',
      });
    }

    let updatedAppointment = null;
    if (note.appointmentId) {
      updatedAppointment = await prisma.appointment.update({
        where: { id: note.appointmentId },
        data: { status: 'COMPLETED' },
        include: { queueToken: true },
      });

      if (updatedAppointment.queueToken) {
        await prisma.queueToken.update({
          where: { id: updatedAppointment.queueToken.id },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });
      }
    }

    // Audit log
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'SOAP_NOTE_FINALIZED',
          entity: 'ConsultationNote',
          entityId: note.id,
          details: JSON.stringify({
            patientMrn: note.patient.mrn,
            signedBy: req.user.email,
          }),
          ipAddress: req.ip,
        },
      });
    }

    return res.json({
      success: true,
      message: 'Clinical encounter finalized & marked as COMPLETED.',
      soapNote: note,
      appointment: updatedAppointment,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Clinical SOAP Templates & Quick Documentation Macros
 * GET /api/consultation/soap-notes/templates
 */
export async function getSoapMacrosAndTemplates(req, res, next) {
  try {
    const templates = [
      {
        id: 'htn-followup',
        title: 'Hypertension Follow-Up',
        category: 'Cardiology',
        icd10: 'I10',
        subjective: 'Patient presents for routine hypertension follow-up. Reports mild occasional headaches. Denies chest pain, shortness of breath, palpitation, or dizziness. Fully compliant with anti-hypertensive regimen.',
        objective: 'BP 138/85 mmHg, Pulse 72 bpm, SpO2 98% on room air. Chest clear to auscultation bilaterally. S1 S2 present, no murmurs. No peripheral pitting edema.',
        assessment: 'Essential (Primary) Hypertension - Suboptimally controlled. Mild Grade 1 Essential HTN.',
        plan: 'Continue Amlodipine 5mg daily. Low-salt dietary counseling. Home BP charting twice daily. Follow-up in 4 weeks.',
      },
      {
        id: 'urti-intake',
        title: 'Acute Upper Respiratory Infection',
        category: 'Pulmonology / OPD',
        icd10: 'J06.9',
        subjective: '3-day history of dry cough, sore throat, low-grade fever, and mild nasal congestion. No severe shortness of breath or hemoptysis.',
        objective: 'Temp 37.8°C, BP 120/78 mmHg, Pulse 84 bpm, SpO2 97%. Posterior pharynx mildly erythematous. Lungs clear to auscultation bilaterally without wheezing or crackles.',
        assessment: 'Acute Upper Respiratory Tract Infection (URTI) - Presumed Viral Origin.',
        plan: 'Symptomatic therapy: Paracetamol 500mg TDS PRN for fever/body aches. Warm saline gargles & fluid hydration. Return if fever exceeds 38.5°C or respiratory distress occurs.',
      },
      {
        id: 't2dm-review',
        title: 'Type 2 Diabetes Mellitus Review',
        category: 'Endocrinology',
        icd10: 'E11.9',
        subjective: 'Routine follow-up for type 2 diabetes. Adhering to diabetic diet. No reported hypoglycemic episodes, nocturnal polyuria, blurred vision, or foot numbness.',
        objective: 'Fasting Blood Glucose 135 mg/dL, HbA1c 7.1%. Weight 74 kg, BMI 25.6 kg/m². Bilateral foot monofilament sensory testing intact. Normal pedal pulses.',
        assessment: 'Type 2 Diabetes Mellitus without complications - Fair Glycemic Control.',
        plan: 'Continue Metformin 500mg twice daily. Maintain diabetic diet and 30-min daily exercise. Re-evaluate HbA1c and Lipid Profile in 3 months.',
      },
      {
        id: 'gastroenteritis-opd',
        title: 'Acute Gastroenteritis',
        category: 'Gastroenterology',
        icd10: 'A09',
        subjective: '2-day history of watery diarrhea (4-5 episodes per day), mild abdominal cramps, and nausea. No hematochezia or severe fever.',
        objective: 'Temp 37.2°C, BP 115/72 mmHg, Pulse 88 bpm. Abdomen soft, non-distended, mild diffuse tenderness on deep palpation. Hyperactive bowel sounds.',
        assessment: 'Acute Infectious Gastroenteritis - Mild Dehydration.',
        plan: 'Oral Rehydration Salts (ORS) solution, Ciprofloxacin 500mg BD for 3 days, Probiotics twice daily. Bland diet (BRAT). Monitor urine output.',
      },
    ];

    return res.json({
      success: true,
      count: templates.length,
      templates,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete SOAP Note Draft
 * DELETE /api/consultation/soap-notes/:id
 */
export async function deleteSoapNoteDraft(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await prisma.consultationNote.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        code: 'SOAP_NOTE_NOT_FOUND',
        message: 'SOAP note not found.',
      });
    }

    await prisma.consultationNote.delete({ where: { id } });

    return res.json({
      success: true,
      message: `SOAP note ${id} successfully deleted.`,
    });
  } catch (error) {
    next(error);
  }
}

