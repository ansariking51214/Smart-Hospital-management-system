import prisma from '../config/db.js';
import { evaluateClinicalSafety, searchClinicalCatalog } from '../utils/clinicalSafety.js';
import { searchDiagnosticCatalog, getDiagnosticTestByCode, DIAGNOSTIC_TEST_CATALOG } from '../utils/labCatalog.js';

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
              include: { items: true },
            },
            labOrders: true,
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
          include: { items: true },
        },
        labOrders: true,
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

// =============================================================
// MODULE 3 - DAY 5: DIAGNOSTIC LAB/RADIOLOGY ORDERS & PDF EXPORT
// =============================================================

/**
 * Get Diagnostic Test Catalog (Laboratory & Radiology)
 * GET /api/consultation/lab-orders/catalog
 */
export async function getDiagnosticCatalogHandler(req, res, next) {
  try {
    const { search = '', category = 'all' } = req.query;
    const catalog = searchDiagnosticCatalog(search, category);
    return res.json({ success: true, ...catalog });
  } catch (error) {
    next(error);
  }
}

/**
 * Create Diagnostic Lab & Radiology Orders
 * POST /api/consultation/lab-orders
 */
export async function createLabOrders(req, res, next) {
  try {
    const {
      patientId,
      consultationNoteId,
      orders = [],
      testName,
      category,
      resultsSummary,
    } = req.body;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        code: 'PATIENT_REQUIRED',
        message: 'Patient ID or MRN is required to order diagnostic tests.',
      });
    }

    const patient = await prisma.patientProfile.findFirst({
      where: { OR: [{ id: patientId }, { mrn: patientId }] },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        code: 'PATIENT_NOT_FOUND',
        message: 'Patient profile not found.',
      });
    }

    // Support both single order and array of test orders
    let testItems = [];
    if (Array.isArray(orders) && orders.length > 0) {
      testItems = orders;
    } else if (testName) {
      testItems = [{ testName, category: category || 'General Laboratory', resultsSummary }];
    } else {
      return res.status(400).json({
        success: false,
        code: 'TEST_REQUIRED',
        message: 'At least one diagnostic test must be specified.',
      });
    }

    const year = new Date().getFullYear();
    const existingCount = await prisma.labOrder.count({
      where: { requestedAt: { gte: new Date(`${year}-01-01T00:00:00.000Z`) } },
    });

    const createdOrders = [];
    for (let i = 0; i < testItems.length; i++) {
      const item = testItems[i];
      const seq = existingCount + i + 1;
      const orderNumber = `LAB-${year}-${String(seq).padStart(4, '0')}`;

      // Resolve category from catalog if not specified or generic
      let resolvedCategory = item.category;
      if (!resolvedCategory || resolvedCategory === 'General Laboratory') {
        const catalogHit = getDiagnosticTestByCode(item.testName) || getDiagnosticTestByCode(item.code);
        if (catalogHit) resolvedCategory = catalogHit.category;
        else resolvedCategory = 'Laboratory';
      }

      const order = await prisma.labOrder.create({
        data: {
          orderNumber,
          patientId: patient.id,
          consultationNoteId: consultationNoteId || null,
          testName: (item.testName || item.name || 'Diagnostic Test').trim(),
          category: resolvedCategory,
          status: item.status || 'REQUESTED',
          resultsSummary: item.resultsSummary || null,
          reportUrl: item.reportUrl || null,
        },
        include: {
          patient: {
            select: { id: true, mrn: true, firstName: true, lastName: true, bloodGroup: true, gender: true },
          },
        },
      });
      createdOrders.push(order);
    }

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'LAB_ORDER_REQUESTED',
          entity: 'LabOrder',
          details: JSON.stringify({
            patientMrn: patient.mrn,
            orderCount: createdOrders.length,
            orderNumbers: createdOrders.map((o) => o.orderNumber),
            tests: createdOrders.map((o) => o.testName),
          }),
          ipAddress: req.ip,
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: `Successfully placed ${createdOrders.length} diagnostic test order(s) for ${patient.firstName} ${patient.lastName} (${patient.mrn}).`,
      count: createdOrders.length,
      orders: createdOrders,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Lab & Radiology Orders for a specific Patient
 * GET /api/consultation/lab-orders/patient/:patientId
 */
export async function getPatientLabOrders(req, res, next) {
  try {
    const { patientId } = req.params;
    const patient = await prisma.patientProfile.findFirst({
      where: { OR: [{ id: patientId }, { mrn: patientId }] },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        code: 'PATIENT_NOT_FOUND',
        message: 'Patient profile not found.',
      });
    }

    const orders = await prisma.labOrder.findMany({
      where: { patientId: patient.id },
      orderBy: { requestedAt: 'desc' },
      include: {
        consultationNote: {
          select: { id: true, assessment: true, createdAt: true },
        },
      },
    });

    return res.json({
      success: true,
      patient: {
        id: patient.id,
        mrn: patient.mrn,
        fullName: `${patient.firstName} ${patient.lastName}`,
      },
      totalOrders: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Hospital-Wide Lab Orders (with filtering)
 * GET /api/consultation/lab-orders
 */
export async function getAllLabOrders(req, res, next) {
  try {
    const { status, category, search, limit = 50, page = 1 } = req.query;

    const where = {};
    if (status && status !== 'ALL') where.status = status;
    if (category && category !== 'ALL') where.category = category;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { testName: { contains: search } },
        { patient: { firstName: { contains: search } } },
        { patient: { lastName: { contains: search } } },
        { patient: { mrn: { contains: search } } },
      ];
    }

    const take = Math.min(parseInt(limit, 10) || 50, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const [total, orders] = await Promise.all([
      prisma.labOrder.count({ where }),
      prisma.labOrder.findMany({
        where,
        take,
        skip,
        orderBy: { requestedAt: 'desc' },
        include: {
          patient: {
            select: { id: true, mrn: true, firstName: true, lastName: true, gender: true, dateOfBirth: true },
          },
        },
      }),
    ]);

    return res.json({
      success: true,
      total,
      page: parseInt(page, 10) || 1,
      limit: take,
      orders,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Single Lab Order by ID or Order Number
 * GET /api/consultation/lab-orders/:id
 */
export async function getLabOrderById(req, res, next) {
  try {
    const { id } = req.params;
    const order = await prisma.labOrder.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
      include: {
        patient: true,
        consultationNote: {
          include: {
            doctor: { select: { fullName: true, email: true } },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        code: 'LAB_ORDER_NOT_FOUND',
        message: 'Diagnostic test order not found.',
      });
    }

    return res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
}

/**
 * Update Lab Order Status & Record Clinical Results
 * PATCH /api/consultation/lab-orders/:id/status
 */
export async function updateLabOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, resultsSummary, reportUrl } = req.body;

    const validStatuses = ['REQUESTED', 'SAMPLE_COLLECTED', 'PROCESSING', 'COMPLETED', 'CANCELLED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_STATUS',
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const existing = await prisma.labOrder.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
      include: { patient: true },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        code: 'LAB_ORDER_NOT_FOUND',
        message: 'Diagnostic test order not found.',
      });
    }

    const dataToUpdate = { status };
    if (resultsSummary !== undefined) dataToUpdate.resultsSummary = resultsSummary;
    if (reportUrl !== undefined) dataToUpdate.reportUrl = reportUrl;
    if (status === 'COMPLETED' && !existing.completedAt) {
      dataToUpdate.completedAt = new Date();
    }

    const updated = await prisma.labOrder.update({
      where: { id: existing.id },
      data: dataToUpdate,
      include: { patient: true },
    });

    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'LAB_ORDER_STATUS_UPDATED',
          entity: 'LabOrder',
          entityId: updated.id,
          details: JSON.stringify({
            orderNumber: updated.orderNumber,
            oldStatus: existing.status,
            newStatus: status,
            hasResults: !!updated.resultsSummary,
            updatedBy: req.user.email,
          }),
          ipAddress: req.ip,
        },
      });
    }

    return res.json({
      success: true,
      message: `Order ${updated.orderNumber} updated to ${status}.`,
      order: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Export High-Fidelity Printable Prescription (HTML / PDF)
 * GET /api/consultation/prescriptions/:id/pdf
 */
export async function exportPrescriptionPdfHtml(req, res, next) {
  try {
    const { id } = req.params;
    const { format } = req.query;

    const prescription = await prisma.prescription.findFirst({
      where: { OR: [{ id }, { prescriptionNumber: id }] },
      include: {
        items: true,
        patient: true,
        doctor: {
          include: {
            user: { select: { fullName: true, email: true, phone: true } },
            department: true,
          },
        },
        consultationNote: true,
      },
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        code: 'PRESCRIPTION_NOT_FOUND',
        message: 'Prescription record not found.',
      });
    }

    if (format === 'json') {
      return res.json({ success: true, prescription });
    }

    const patient = prescription.patient;
    const doctor = prescription.doctor;
    const doctorUser = doctor?.user || {};
    const formattedDate = new Date(prescription.issuedDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const birthYear = patient.dateOfBirth ? new Date(patient.dateOfBirth).getFullYear() : null;
    const age = birthYear ? new Date().getFullYear() - birthYear : 'N/A';

    const itemsRows = prescription.items
      .map(
        (item, index) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #1e293b; text-align: center;">${index + 1}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">
          <div style="font-size: 15px;">${item.medicineName}</div>
          ${item.instructions ? `<div style="font-size: 12px; color: #64748b; font-weight: 400; margin-top: 2px;">Note: ${item.instructions}</div>` : ''}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #334155; text-align: center; font-weight: 600;">${item.dosage}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #334155; text-align: center;">${item.frequency}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #334155; text-align: center;">${item.timing || 'After meals'}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #334155; text-align: center; font-weight: 600;">${item.duration}</td>
      </tr>
    `
      )
      .join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Prescription - ${prescription.prescriptionNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #0f172a; padding: 24px; }
    .page-container { max-width: 820px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 36px 44px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); position: relative; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0d9488; padding-bottom: 20px; margin-bottom: 24px; }
    .hospital-info h1 { font-size: 22px; font-weight: 800; color: #0f766e; letter-spacing: -0.5px; }
    .hospital-info p { font-size: 12px; color: #64748b; margin-top: 3px; }
    .rx-badge { text-align: right; }
    .rx-badge .badge-title { font-size: 26px; font-weight: 900; color: #0d9488; font-family: Georgia, serif; }
    .rx-badge .rx-no { font-size: 14px; font-weight: 700; color: #1e293b; letter-spacing: 0.5px; }
    .rx-badge .rx-date { font-size: 12px; color: #64748b; margin-top: 2px; }
    
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #f1f5f9; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px; font-size: 13px; }
    .meta-field { margin-bottom: 6px; }
    .meta-field span.label { font-weight: 600; color: #475569; display: inline-block; width: 110px; }
    .meta-field span.val { font-weight: 700; color: #0f172a; }

    .rx-symbol-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
    .rx-symbol { font-size: 32px; font-family: Georgia, serif; font-weight: bold; color: #0d9488; line-height: 1; }
    .rx-symbol-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; }

    table.med-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
    table.med-table th { background: #0f766e; color: #ffffff; font-weight: 700; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; padding: 10px 12px; text-align: center; }
    table.med-table th.th-left { text-align: left; }

    .advice-box { background: #f8fafc; border-left: 4px solid #0d9488; padding: 14px 18px; border-radius: 4px; margin-bottom: 28px; font-size: 13px; }
    .advice-box h3 { font-size: 13px; font-weight: 700; color: #0f766e; text-transform: uppercase; margin-bottom: 6px; }
    .advice-box p { color: #334155; line-height: 1.5; margin-bottom: 4px; }

    .footer-signatures { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding-top: 24px; border-top: 1px dashed #cbd5e1; }
    .stamp-box { border: 2px dashed #94a3b8; border-radius: 8px; padding: 12px 18px; text-align: center; color: #64748b; font-size: 11px; font-weight: 600; width: 160px; }
    .doctor-sig { text-align: right; }
    .doctor-sig .sig-line { width: 220px; border-bottom: 1.5px solid #0f172a; margin-bottom: 6px; margin-left: auto; }
    .doctor-sig .doc-name { font-size: 14px; font-weight: 800; color: #0f172a; }
    .doctor-sig .doc-title { font-size: 12px; color: #64748b; }

    .print-bar { max-width: 820px; margin: 0 auto 16px auto; display: flex; justify-content: space-between; align-items: center; }
    .print-btn { background: #0d9488; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 2px 8px rgba(13, 148, 136, 0.3); }
    .print-btn:hover { background: #0f766e; }

    @media print {
      body { background: #ffffff; padding: 0; }
      .page-container { border: none; box-shadow: none; padding: 10mm 15mm; }
      .print-bar { display: none !important; }
      @page { margin: 10mm; size: A4 portrait; }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <button class="print-btn" onclick="window.print()">🖨️ Print Prescription (PDF)</button>
    <span style="font-size: 13px; color: #64748b; font-weight: 500;">Smart Hospital Clinical EHR &bull; Module 3 Day 5 Deliverable</span>
  </div>

  <div class="page-container">
    <div class="header">
      <div class="hospital-info">
        <h1>SMART HOSPITAL MEDICAL CENTER</h1>
        <p>Outpatient Clinical Department &bull; Digital e-Prescribing Unit</p>
        <p>24/7 Clinical Emergency Hotline &bull; Verification ID: ${prescription.id.slice(0, 10)}</p>
      </div>
      <div class="rx-badge">
        <div class="badge-title">℞ PRESCRIPTION</div>
        <div class="rx-no">${prescription.prescriptionNumber}</div>
        <div class="rx-date">Issued: ${formattedDate}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div>
        <div class="meta-field"><span class="label">Patient Name:</span> <span class="val">${patient.firstName} ${patient.lastName}</span></div>
        <div class="meta-field"><span class="label">Patient MRN:</span> <span class="val" style="color: #0d9488;">${patient.mrn}</span></div>
        <div class="meta-field"><span class="label">Age / Gender:</span> <span class="val">${age} yrs &bull; ${patient.gender}</span></div>
        <div class="meta-field"><span class="label">Blood Group:</span> <span class="val">${patient.bloodGroup || 'O+'}</span></div>
      </div>
      <div>
        <div class="meta-field"><span class="label">Attending Doctor:</span> <span class="val">Dr. ${doctorUser.fullName || 'Consultant Physician'}</span></div>
        <div class="meta-field"><span class="label">Department:</span> <span class="val">${doctor?.department?.name || 'General Medicine'}</span></div>
        <div class="meta-field"><span class="label">License No:</span> <span class="val">${doctor?.licenseNumber || 'LIC-2026-MED'}</span></div>
        <div class="meta-field"><span class="label">Allergies:</span> <span class="val" style="color: ${patient.allergies ? '#dc2626' : '#16a34a'};">${patient.allergies || 'No Known Drug Allergies (NKDA)'}</span></div>
      </div>
    </div>

    <div class="rx-symbol-bar">
      <span class="rx-symbol">℞</span>
      <span class="rx-symbol-label">Prescribed Medications & Dosage Schedule</span>
    </div>

    <table class="med-table">
      <thead>
        <tr>
          <th style="width: 40px;">#</th>
          <th class="th-left">Medication & Form</th>
          <th>Dosage</th>
          <th>Frequency</th>
          <th>Timing</th>
          <th>Duration</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <div class="advice-box">
      <h3>Clinical Advice & Instructions</h3>
      <p><strong>General Advice:</strong> ${prescription.generalAdvice || 'Take medications exactly as prescribed with plenty of water. Report any allergic reaction or adverse effect immediately.'}</p>
      ${prescription.dietaryAdvice ? `<p><strong>Dietary Guidance:</strong> ${prescription.dietaryAdvice}</p>` : ''}
    </div>

    <div class="footer-signatures">
      <div class="stamp-box">
        OFFICIAL CLINICAL STAMP<br>
        VALIDATED E-PRESCRIPTION<br>
        SMART HOSPITAL
      </div>
      <div class="doctor-sig">
        <div class="sig-line"></div>
        <div class="doc-name">Dr. ${doctorUser.fullName || 'Attending Physician'}</div>
        <div class="doc-title">${doctor?.qualification || 'MBBS, MD'} &bull; ${doctor?.specialization || 'Clinical Specialist'}</div>
        <div class="doc-title" style="font-size: 11px; margin-top: 2px;">License: ${doctor?.licenseNumber || 'LIC-2026-MED'}</div>
      </div>
    </div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (error) {
    next(error);
  }
}

/**
 * 360° Comprehensive Patient Clinical Summary (Demographics, Vitals, SOAP, Prescriptions, Lab Orders)
 * GET /api/consultation/patient/:patientId/clinical-summary
 */
export async function getPatientClinicalSummary(req, res, next) {
  try {
    const { patientId } = req.params;

    const patient = await prisma.patientProfile.findFirst({
      where: { OR: [{ id: patientId }, { mrn: patientId }] },
      include: {
        vitalSigns: { orderBy: { recordedAt: 'desc' }, take: 5 },
        consultationNotes: {
          orderBy: { createdAt: 'desc' },
          include: {
            doctor: { select: { fullName: true, email: true } },
          },
        },
        prescriptions: {
          orderBy: { issuedDate: 'desc' },
          include: {
            items: true,
            doctor: { include: { user: { select: { fullName: true } } } },
          },
        },
        labOrders: {
          orderBy: { requestedAt: 'desc' },
        },
      },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        code: 'PATIENT_NOT_FOUND',
        message: 'Patient profile not found.',
      });
    }

    const birthYear = patient.dateOfBirth ? new Date(patient.dateOfBirth).getFullYear() : null;
    const age = birthYear ? new Date().getFullYear() - birthYear : 'N/A';

    return res.json({
      success: true,
      summary: {
        patient: {
          id: patient.id,
          mrn: patient.mrn,
          fullName: `${patient.firstName} ${patient.lastName}`,
          age,
          gender: patient.gender,
          bloodGroup: patient.bloodGroup,
          phone: patient.phone,
          allergies: patient.allergies,
          chronicConditions: patient.chronicConditions,
          emergencyContact: patient.emergencyContactName ? `${patient.emergencyContactName} (${patient.emergencyContactPhone || ''})` : null,
        },
        latestVitals: patient.vitalSigns[0] || null,
        totalVisits: patient.consultationNotes.length,
        totalPrescriptions: patient.prescriptions.length,
        totalLabOrders: patient.labOrders.length,
        consultationNotes: patient.consultationNotes,
        prescriptions: patient.prescriptions,
        labOrders: patient.labOrders,
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Export 360° Clinical Encounter & Discharge Summary (Printable HTML / PDF)
 * GET /api/consultation/patient/:patientId/clinical-summary/export
 */
export async function exportClinicalSummaryPdfHtml(req, res, next) {
  try {
    const { patientId } = req.params;

    const patient = await prisma.patientProfile.findFirst({
      where: { OR: [{ id: patientId }, { mrn: patientId }] },
      include: {
        vitalSigns: { orderBy: { recordedAt: 'desc' }, take: 1 },
        consultationNotes: {
          orderBy: { createdAt: 'desc' },
          include: { doctor: { select: { fullName: true } } },
          take: 3,
        },
        prescriptions: {
          orderBy: { issuedDate: 'desc' },
          include: { items: true, doctor: { include: { user: true } } },
          take: 3,
        },
        labOrders: {
          orderBy: { requestedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        code: 'PATIENT_NOT_FOUND',
        message: 'Patient profile not found.',
      });
    }

    const birthYear = patient.dateOfBirth ? new Date(patient.dateOfBirth).getFullYear() : null;
    const age = birthYear ? new Date().getFullYear() - birthYear : 'N/A';
    const vitals = patient.vitalSigns[0] || {};
    const latestNote = patient.consultationNotes[0] || {};

    const labRows = patient.labOrders.length > 0
      ? patient.labOrders
          .map(
            (o) => `
        <tr>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #0d9488;">${o.orderNumber}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${o.testName}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; color: #64748b;">${o.category}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: ${o.status === 'COMPLETED' ? '#16a34a' : '#d97706'};">${o.status}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #334155;">${o.resultsSummary || 'Pending analysis'}</td>
        </tr>
      `
          )
          .join('')
      : '<tr><td colspan="5" style="text-align: center; padding: 12px; color: #94a3b8;">No diagnostic orders recorded.</td></tr>';

    const rxRows = patient.prescriptions.flatMap((p) => p.items)
      .map(
        (it) => `
      <tr>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 700;">${it.medicineName}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">${it.dosage}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">${it.frequency}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">${it.duration}</td>
      </tr>
    `
      )
      .join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Clinical EHR Summary - ${patient.mrn}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; background: #f8fafc; color: #0f172a; padding: 24px; }
    .page-container { max-width: 860px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 36px 44px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
    .header { display: flex; justify-content: space-between; border-bottom: 3px solid #0d9488; padding-bottom: 16px; margin-bottom: 20px; }
    .h-title { font-size: 22px; font-weight: 800; color: #0f766e; }
    .h-sub { font-size: 12px; color: #64748b; }
    .badge { font-size: 18px; font-weight: 800; color: #0f172a; text-align: right; }
    .section-title { font-size: 14px; font-weight: 800; text-transform: uppercase; color: #0f766e; letter-spacing: 0.5px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin: 20px 0 10px 0; }
    .meta-box { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; background: #f1f5f9; padding: 14px; border-radius: 8px; font-size: 12px; margin-bottom: 16px; }
    .vitals-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; text-align: center; margin-bottom: 16px; }
    .vital-cell { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; }
    .vital-val { font-size: 16px; font-weight: 800; color: #0d9488; }
    .vital-lbl { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px; }
    th { background: #0f766e; color: #ffffff; text-align: left; padding: 8px 10px; font-size: 11px; text-transform: uppercase; }
    .soap-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 12px; line-height: 1.5; margin-bottom: 16px; }
    .print-btn { background: #0d9488; color: #fff; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; margin-bottom: 16px; }
    @media print { .print-btn { display: none; } body { padding: 0; background: #fff; } .page-container { border: none; box-shadow: none; padding: 0; } }
  </style>
</head>
<body>
  <div style="max-width: 860px; margin: 0 auto;">
    <button class="print-btn" onclick="window.print()">🖨️ Print Clinical Summary (PDF)</button>
  </div>
  <div class="page-container">
    <div class="header">
      <div>
        <div class="h-title">SMART HOSPITAL MANAGEMENT SYSTEM</div>
        <div class="h-sub">Longitudinal Electronic Health Record (EHR) &bull; Comprehensive Clinical Summary</div>
      </div>
      <div class="badge">
        <div style="color: #0d9488; font-size: 13px; font-weight: 700;">PATIENT DOSSIER</div>
        <div>${patient.mrn}</div>
        <div style="font-size: 11px; color: #64748b;">${new Date().toLocaleDateString()}</div>
      </div>
    </div>

    <div class="section-title">1. Patient Identification & Demographics</div>
    <div class="meta-box">
      <div><strong>Name:</strong> ${patient.firstName} ${patient.lastName}</div>
      <div><strong>MRN:</strong> ${patient.mrn}</div>
      <div><strong>Age / Sex:</strong> ${age} yrs / ${patient.gender}</div>
      <div><strong>Blood Group:</strong> ${patient.bloodGroup || 'N/A'}</div>
      <div><strong>Allergies:</strong> <span style="color: ${patient.allergies ? '#dc2626' : '#16a34a'}; font-weight: 700;">${patient.allergies || 'NKDA'}</span></div>
      <div><strong>Chronic Conditions:</strong> ${patient.chronicConditions || 'None reported'}</div>
    </div>

    <div class="section-title">2. Latest Triage Vital Signs</div>
    <div class="vitals-grid">
      <div class="vital-cell"><div class="vital-val">${vitals.systolicBp ? `${vitals.systolicBp}/${vitals.diastolicBp}` : '120/80'}</div><div class="vital-lbl">BP (mmHg)</div></div>
      <div class="vital-cell"><div class="vital-val">${vitals.pulseRate || '76'}</div><div class="vital-lbl">Pulse (bpm)</div></div>
      <div class="vital-cell"><div class="vital-val">${vitals.oxygenSaturation ? `${vitals.oxygenSaturation}%` : '98%'}</div><div class="vital-lbl">SpO2</div></div>
      <div class="vital-cell"><div class="vital-val">${vitals.temperature ? `${vitals.temperature}°C` : '37.0°C'}</div><div class="vital-lbl">Temp</div></div>
      <div class="vital-cell"><div class="vital-val">${vitals.bmi ? `${vitals.bmi}` : '23.5'}</div><div class="vital-lbl">BMI (kg/m²)</div></div>
    </div>

    ${latestNote.subjective ? `
    <div class="section-title">3. Latest Consultation Encounter (SOAP)</div>
    <div class="soap-box">
      <p><strong>Subjective:</strong> ${latestNote.subjective}</p>
      <p style="margin-top: 4px;"><strong>Objective:</strong> ${latestNote.objective}</p>
      <p style="margin-top: 4px;"><strong>Assessment / Diagnosis:</strong> ${latestNote.assessment} ${latestNote.icd10Codes ? `(${latestNote.icd10Codes})` : ''}</p>
      <p style="margin-top: 4px;"><strong>Plan:</strong> ${latestNote.plan}</p>
    </div>` : ''}

    <div class="section-title">4. Active Prescriptions & Medications</div>
    <table>
      <thead><tr><th>Medication</th><th>Dosage</th><th>Frequency</th><th>Duration</th></tr></thead>
      <tbody>${rxRows || '<tr><td colspan="4" style="text-align: center; padding: 10px; color: #94a3b8;">No active medications</td></tr>'}</tbody>
    </table>

    <div class="section-title">5. Diagnostic Test Orders & Results (Lab & Radiology)</div>
    <table>
      <thead><tr><th>Order No</th><th>Test Name</th><th>Category</th><th>Status</th><th>Results Summary</th></tr></thead>
      <tbody>${labRows}</tbody>
    </table>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (error) {
    next(error);
  }
}


