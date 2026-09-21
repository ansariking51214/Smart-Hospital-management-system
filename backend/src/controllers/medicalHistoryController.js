import prisma from '../config/db.js';

/**
 * Advanced Multi-Criteria Patient Search Engine
 * GET /api/medical-history/search
 */
export async function searchPatients(req, res, next) {
  try {
    const {
      q = '',
      mrn = '',
      name = '',
      phone = '',
      nationalId = '',
      bloodGroup = '',
      gender = '',
      hasAllergies,
      hasChronic,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = req.query;

    const whereConditions = [];

    // Global quick query
    if (q && q.trim()) {
      const query = q.trim();
      whereConditions.push({
        OR: [
          { mrn: { contains: query } },
          { firstName: { contains: query } },
          { lastName: { contains: query } },
          { phone: { contains: query } },
          { nationalId: { contains: query } },
          { emergencyContactName: { contains: query } },
        ],
      });
    }

    // Specific field filters
    if (mrn && mrn.trim()) {
      whereConditions.push({ mrn: { contains: mrn.trim() } });
    }
    if (name && name.trim()) {
      whereConditions.push({
        OR: [
          { firstName: { contains: name.trim() } },
          { lastName: { contains: name.trim() } },
        ],
      });
    }
    if (phone && phone.trim()) {
      whereConditions.push({ phone: { contains: phone.trim() } });
    }
    if (nationalId && nationalId.trim()) {
      whereConditions.push({ nationalId: { contains: nationalId.trim() } });
    }
    if (bloodGroup && bloodGroup.trim()) {
      whereConditions.push({ bloodGroup: bloodGroup.trim().toUpperCase() });
    }
    if (gender && gender.trim()) {
      whereConditions.push({ gender: gender.trim().toUpperCase() });
    }
    if (hasAllergies === 'true') {
      whereConditions.push({
        AND: [{ allergies: { not: null } }, { allergies: { not: '' } }, { allergies: { not: 'None' } }],
      });
    }
    if (hasChronic === 'true') {
      whereConditions.push({
        AND: [{ chronicConditions: { not: null } }, { chronicConditions: { not: '' } }, { chronicConditions: { not: 'None' } }],
      });
    }

    const whereClause = whereConditions.length > 0 ? { AND: whereConditions } : {};

    const [total, patients] = await Promise.all([
      prisma.patientProfile.count({ where: whereClause }),
      prisma.patientProfile.findMany({
        where: whereClause,
        orderBy: { [sortBy]: sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          user: {
            select: { email: true, isActive: true, lastLoginAt: true },
          },
          _count: {
            select: {
              appointments: true,
              vitalSigns: true,
              prescriptions: true,
              invoices: true,
            },
          },
        },
      }),
    ]);

    const formattedPatients = patients.map((p) => ({
      ...p,
      fullName: `${p.firstName} ${p.lastName}`,
      age: calculateAge(p.dateOfBirth),
      hasAlerts: Boolean(
        (p.allergies && p.allergies !== 'None') ||
        (p.chronicConditions && p.chronicConditions !== 'None')
      ),
    }));

    return res.json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      count: formattedPatients.length,
      patients: formattedPatients,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Comprehensive Longitudinal Medical History & Clinical Dossier
 * GET /api/medical-history/patient/:idOrMrn
 */
export async function getPatientMedicalHistory(req, res, next) {
  try {
    const { idOrMrn } = req.params;

    const patient = await prisma.patientProfile.findFirst({
      where: {
        OR: [{ id: idOrMrn }, { mrn: idOrMrn }],
      },
      include: {
        user: {
          select: { email: true, phone: true, isActive: true },
        },
        appointments: {
          orderBy: { appointmentDate: 'desc' },
          include: {
            doctor: {
              include: {
                user: { select: { fullName: true, email: true } },
                department: true,
              },
            },
            consultationNote: true,
            vitalSign: true,
          },
        },
        vitalSigns: {
          orderBy: { recordedAt: 'desc' },
        },
        consultationNotes: {
          orderBy: { createdAt: 'desc' },
          include: {
            doctor: {
              include: {
                user: { select: { fullName: true } },
                department: true,
              },
            },
          },
        },
        prescriptions: {
          orderBy: { createdAt: 'desc' },
          include: {
            doctor: {
              include: {
                user: { select: { fullName: true } },
                department: true,
              },
            },
          },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        code: 'PATIENT_NOT_FOUND',
        message: `No medical history found for patient ID/MRN: '${idOrMrn}'`,
      });
    }

    // Build unified chronological timeline events
    const timeline = [];

    // 1. Appointments & Consultations
    patient.appointments.forEach((appt) => {
      timeline.push({
        id: `appt-${appt.id}`,
        type: 'CONSULTATION',
        date: appt.appointmentDate,
        title: `Clinical Visit - ${appt.doctor?.department?.name || 'General OPD'}`,
        physician: appt.doctor?.user?.fullName || 'Attending Physician',
        status: appt.status,
        reason: appt.reason,
        note: appt.consultationNote || null,
        vitals: appt.vitalSign || null,
      });
    });

    // 2. Standalone Consultation Notes
    patient.consultationNotes.forEach((note) => {
      // If not already in timeline from appt
      if (!timeline.some((t) => t.note?.id === note.id)) {
        timeline.push({
          id: `note-${note.id}`,
          type: 'SOAP_NOTE',
          date: note.createdAt,
          title: `Clinical SOAP Consultation Note`,
          physician: note.doctor?.user?.fullName || 'Attending Physician',
          diagnosis: note.assessment,
          chiefComplaint: note.chiefComplaint,
          plan: note.plan,
        });
      }
    });

    // 3. Vital Signs Log
    patient.vitalSigns.forEach((vital) => {
      timeline.push({
        id: `vital-${vital.id}`,
        type: 'VITAL_SIGNS',
        date: vital.recordedAt,
        title: 'Triage & Vital Signs Entry',
        data: {
          bp: `${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic} mmHg`,
          pulse: `${vital.pulseRate} bpm`,
          temperature: `${vital.temperatureFahrenheit} °F`,
          spo2: `${vital.oxygenSaturation}%`,
          bmi: vital.bmi,
        },
      });
    });

    // 4. Prescriptions
    patient.prescriptions.forEach((rx) => {
      timeline.push({
        id: `rx-${rx.id}`,
        type: 'PRESCRIPTION',
        date: rx.createdAt,
        title: `e-Prescription #${rx.prescriptionNumber}`,
        physician: rx.doctor?.user?.fullName || 'Physician',
        diagnosis: rx.diagnosis,
        items: rx.items,
        instructions: rx.instructions,
      });
    });

    // Sort combined timeline chronologically (latest first)
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return res.json({
      success: true,
      patient: {
        ...patient,
        fullName: `${patient.firstName} ${patient.lastName}`,
        age: calculateAge(patient.dateOfBirth),
      },
      timeline,
      summary: {
        totalConsultations: patient.appointments.length + patient.consultationNotes.length,
        totalPrescriptions: patient.prescriptions.length,
        totalVitalsLogged: patient.vitalSigns.length,
        lastVisit: patient.appointments[0]?.appointmentDate || patient.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update Medical Baseline (Allergies & Chronic Illnesses)
 * PATCH /api/medical-history/patient/:id/medical-baseline
 */
export async function updateMedicalBaseline(req, res, next) {
  try {
    const { id } = req.params;
    const { allergies, chronicConditions, clinicalNotes } = req.body;

    const patient = await prisma.patientProfile.findUnique({ where: { id } });
    if (!patient) {
      return res.status(404).json({
        success: false,
        code: 'PATIENT_NOT_FOUND',
        message: 'Patient profile not found.',
      });
    }

    const updated = await prisma.patientProfile.update({
      where: { id },
      data: {
        allergies: allergies !== undefined ? allergies : patient.allergies,
        chronicConditions: chronicConditions !== undefined ? chronicConditions : patient.chronicConditions,
      },
    });

    // Record Audit
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'MEDICAL_HISTORY_UPDATED',
          entity: 'PatientProfile',
          entityId: id,
          details: JSON.stringify({
            mrn: updated.mrn,
            allergiesUpdated: allergies,
            chronicUpdated: chronicConditions,
            clinicalNotes,
            updatedBy: req.user.email,
          }),
          ipAddress: req.ip,
        },
      });
    }

    return res.json({
      success: true,
      message: `Medical baseline & allergies successfully updated for ${updated.firstName} ${updated.lastName} (${updated.mrn}).`,
      patient: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update Emergency Contact & Next-of-Kin Information
 * PATCH /api/medical-history/patient/:id/emergency-contact
 */
export async function updateEmergencyContact(req, res, next) {
  try {
    const { id } = req.params;
    const {
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
    } = req.body;

    if (!emergencyContactName || !emergencyContactPhone) {
      return res.status(400).json({
        success: false,
        message: 'Emergency contact name and phone number are required.',
      });
    }

    const patient = await prisma.patientProfile.findUnique({ where: { id } });
    if (!patient) {
      return res.status(404).json({
        success: false,
        code: 'PATIENT_NOT_FOUND',
        message: 'Patient profile not found.',
      });
    }

    const updated = await prisma.patientProfile.update({
      where: { id },
      data: {
        emergencyContactName: emergencyContactName.trim(),
        emergencyContactPhone: emergencyContactPhone.trim(),
        emergencyContactRelation: emergencyContactRelation ? emergencyContactRelation.trim() : patient.emergencyContactRelation,
      },
    });

    // Record Audit
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'EMERGENCY_CONTACT_UPDATED',
          entity: 'PatientProfile',
          entityId: id,
          details: JSON.stringify({
            mrn: updated.mrn,
            contactName: updated.emergencyContactName,
            contactPhone: updated.emergencyContactPhone,
            relation: updated.emergencyContactRelation,
            updatedBy: req.user.email,
          }),
          ipAddress: req.ip,
        },
      });
    }

    return res.json({
      success: true,
      message: `Emergency contact updated for ${updated.firstName} ${updated.lastName} (${updated.mrn}).`,
      emergencyContact: {
        name: updated.emergencyContactName,
        phone: updated.emergencyContactPhone,
        relation: updated.emergencyContactRelation,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Helper to calculate age in years
 */
function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return 0;
  const dob = new Date(dateOfBirth);
  const diffMs = Date.now() - dob.getTime();
  const ageDate = new Date(diffMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}
