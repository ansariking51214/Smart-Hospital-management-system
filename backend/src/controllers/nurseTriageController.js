import prisma from '../config/db.js';

/**
 * Record Clinical Vital Signs & Compute Triage Severity
 * POST /api/triage/vitals
 */
export async function recordVitalSigns(req, res, next) {
  try {
    const {
      patientId,
      appointmentId,
      systolicBp,
      diastolicBp,
      pulseRate,
      temperature,
      respiratoryRate,
      oxygenSaturation,
      heightCm,
      weightKg,
      triageNotes = '',
    } = req.body;

    const patient = await prisma.patientProfile.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        code: 'PATIENT_NOT_FOUND',
        message: 'Patient not found for vitals recording.',
      });
    }

    // 1. Calculate BMI
    let bmi = null;
    let bmiCategory = 'Unrecorded';
    if (heightCm && weightKg) {
      const heightInMeters = Number(heightCm) / 100;
      bmi = Number((Number(weightKg) / (heightInMeters * heightInMeters)).toFixed(1));

      if (bmi < 18.5) bmiCategory = 'Underweight';
      else if (bmi >= 18.5 && bmi <= 24.9) bmiCategory = 'Normal Weight';
      else if (bmi >= 25.0 && bmi <= 29.9) bmiCategory = 'Overweight';
      else if (bmi >= 30.0) bmiCategory = 'Obese';
    }

    // 2. Compute Triage Severity Score (NEWS / Triage Flag)
    const triageAssessment = evaluateTriageSeverity({
      systolicBp: systolicBp ? Number(systolicBp) : null,
      diastolicBp: diastolicBp ? Number(diastolicBp) : null,
      pulseRate: pulseRate ? Number(pulseRate) : null,
      temperature: temperature ? Number(temperature) : null,
      oxygenSaturation: oxygenSaturation ? Number(oxygenSaturation) : null,
      respiratoryRate: respiratoryRate ? Number(respiratoryRate) : null,
    });

    // 3. Create VitalSign record in Prisma
    const vitalSign = await prisma.vitalSign.create({
      data: {
        patientId: patient.id,
        appointmentId: appointmentId || null,
        recordedById: req.user?.id || null,
        systolicBp: systolicBp ? Number(systolicBp) : null,
        diastolicBp: diastolicBp ? Number(diastolicBp) : null,
        pulseRate: pulseRate ? Number(pulseRate) : null,
        temperature: temperature ? Number(temperature) : null,
        respiratoryRate: respiratoryRate ? Number(respiratoryRate) : null,
        oxygenSaturation: oxygenSaturation ? Number(oxygenSaturation) : null,
        heightCm: heightCm ? Number(heightCm) : null,
        weightKg: weightKg ? Number(weightKg) : null,
        bmi,
        triageNotes: triageNotes?.trim() || null,
      },
      include: {
        patient: { select: { mrn: true, firstName: true, lastName: true, bloodGroup: true, allergies: true } },
        appointment: { select: { id: true, timeSlot: true, type: true } },
      },
    });

    // 4. Audit Log
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'VITALS_RECORDED',
          entity: 'VitalSign',
          entityId: vitalSign.id,
          details: JSON.stringify({
            patientMrn: patient.mrn,
            severity: triageAssessment.level,
            bp: `${vitalSign.systolicBp}/${vitalSign.diastolicBp}`,
            pulse: vitalSign.pulseRate,
            temp: vitalSign.temperature,
            spo2: vitalSign.oxygenSaturation,
            bmi,
            recordedBy: req.user.email,
          }),
          ipAddress: req.ip,
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: `Vital signs recorded successfully for ${patient.firstName} ${patient.lastName} (${patient.mrn})!`,
      vitalSign: {
        ...vitalSign,
        bmiCategory,
        triageAssessment,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Nurse Triage Desk Queue (Patients Waiting for Pre-Consultation Vitals Intake)
 * GET /api/triage/queue
 */
export async function getTriageDeskQueue(req, res, next) {
  try {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const appointmentsToday = await prisma.appointment.findMany({
      where: {
        appointmentDate: { gte: startOfDay, lte: endOfDay },
        status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_QUEUE'] },
      },
      include: {
        patient: true,
        doctor: { include: { user: true, department: true } },
        vitalSign: true,
        queueToken: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const pendingTriage = appointmentsToday.filter((a) => !a.vitalSign);
    const completedTriage = appointmentsToday.filter((a) => !!a.vitalSign);

    return res.json({
      success: true,
      date: today.toISOString().split('T')[0],
      totalAppointmentsToday: appointmentsToday.length,
      pendingTriageCount: pendingTriage.length,
      completedTriageCount: completedTriage.length,
      pendingQueue: pendingTriage.map((a) => ({
        appointmentId: a.id,
        patientId: a.patient.id,
        patientName: `${a.patient.firstName} ${a.patient.lastName}`,
        patientMrn: a.patient.mrn,
        patientGender: a.patient.gender,
        patientDob: a.patient.dateOfBirth,
        patientBloodGroup: a.patient.bloodGroup,
        patientAllergies: a.patient.allergies,
        doctorName: a.doctor?.user?.fullName || 'Physician',
        department: a.doctor?.department?.name || 'OPD',
        roomNumber: a.doctor?.roomNumber || 'Room 101',
        timeSlot: a.timeSlot,
        tokenCode: a.queueToken?.tokenCode || '---',
        status: a.status,
      })),
      completedQueue: completedTriage.map((a) => ({
        appointmentId: a.id,
        patientName: `${a.patient.firstName} ${a.patient.lastName}`,
        patientMrn: a.patient.mrn,
        vitals: a.vitalSign,
        tokenCode: a.queueToken?.tokenCode || '---',
        doctorName: a.doctor?.user?.fullName || 'Physician',
      })),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Longitudinal Vitals Time-Series History for a Patient
 * GET /api/triage/patient/:patientId/history
 */
export async function getPatientVitalsHistory(req, res, next) {
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

    const vitals = await prisma.vitalSign.findMany({
      where: { patientId: patient.id },
      orderBy: { recordedAt: 'desc' },
      include: {
        appointment: {
          select: {
            id: true,
            appointmentDate: true,
            doctor: { include: { user: true, department: true } },
          },
        },
      },
    });

    const enrichedVitals = vitals.map((v) => ({
      ...v,
      bmiCategory: getBmiCategory(v.bmi),
      triageAssessment: evaluateTriageSeverity({
        systolicBp: v.systolicBp,
        diastolicBp: v.diastolicBp,
        pulseRate: v.pulseRate,
        temperature: v.temperature,
        oxygenSaturation: v.oxygenSaturation,
        respiratoryRate: v.respiratoryRate,
      }),
    }));

    return res.json({
      success: true,
      patient: {
        id: patient.id,
        mrn: patient.mrn,
        fullName: `${patient.firstName} ${patient.lastName}`,
        bloodGroup: patient.bloodGroup,
        allergies: patient.allergies,
      },
      count: enrichedVitals.length,
      vitals: enrichedVitals,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Nurse Triage Overview Statistics
 * GET /api/triage/stats/overview
 */
export async function getTriageStats(req, res, next) {
  try {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const [totalAllTime, totalToday, todayVitals] = await Promise.all([
      prisma.vitalSign.count(),
      prisma.vitalSign.count({ where: { recordedAt: { gte: startOfDay, lte: endOfDay } } }),
      prisma.vitalSign.findMany({
        where: { recordedAt: { gte: startOfDay, lte: endOfDay } },
      }),
    ]);

    let redAlerts = 0;
    let amberAlerts = 0;
    let greenStable = 0;

    todayVitals.forEach((v) => {
      const assessment = evaluateTriageSeverity({
        systolicBp: v.systolicBp,
        diastolicBp: v.diastolicBp,
        pulseRate: v.pulseRate,
        temperature: v.temperature,
        oxygenSaturation: v.oxygenSaturation,
        respiratoryRate: v.respiratoryRate,
      });

      if (assessment.level === 'RED') redAlerts++;
      else if (assessment.level === 'AMBER') amberAlerts++;
      else greenStable++;
    });

    return res.json({
      success: true,
      totalAllTime,
      totalToday,
      redAlerts,
      amberAlerts,
      greenStable,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Helper: Clinical Triage Severity Classification Engine (NEWS Algorithm)
 */
function evaluateTriageSeverity({
  systolicBp,
  diastolicBp,
  pulseRate,
  temperature,
  oxygenSaturation,
  respiratoryRate,
}) {
  const flags = [];
  let level = 'GREEN';

  // Oxygen Saturation Alerts
  if (oxygenSaturation !== null && oxygenSaturation < 90) {
    level = 'RED';
    flags.push(`Severe Hypoxia (SpO2 ${oxygenSaturation}%)`);
  } else if (oxygenSaturation !== null && oxygenSaturation <= 94) {
    if (level !== 'RED') level = 'AMBER';
    flags.push(`Mild Hypoxemia (SpO2 ${oxygenSaturation}%)`);
  }

  // Blood Pressure Alerts
  if (systolicBp !== null && (systolicBp >= 180 || systolicBp <= 80)) {
    level = 'RED';
    flags.push(`Critical Blood Pressure (${systolicBp} mmHg)`);
  } else if (systolicBp !== null && (systolicBp >= 140 || systolicBp <= 90)) {
    if (level !== 'RED') level = 'AMBER';
    flags.push(`Elevated Blood Pressure (${systolicBp} mmHg)`);
  }

  // Pulse Alerts
  if (pulseRate !== null && (pulseRate >= 130 || pulseRate <= 40)) {
    level = 'RED';
    flags.push(`Critical Arrhythmia / Pulse (${pulseRate} bpm)`);
  } else if (pulseRate !== null && (pulseRate >= 100 || pulseRate <= 50)) {
    if (level !== 'RED') level = 'AMBER';
    flags.push(`Tachycardia / Bradycardia (${pulseRate} bpm)`);
  }

  // Temperature Alerts
  if (temperature !== null && (temperature >= 103.5 || temperature <= 95.0)) {
    level = 'RED';
    flags.push(`High Hyperthermia / Hypothermia (${temperature}°F)`);
  } else if (temperature !== null && temperature >= 100.4) {
    if (level !== 'RED') level = 'AMBER';
    flags.push(`Pyrexia / Fever (${temperature}°F)`);
  }

  return {
    level, // GREEN | AMBER | RED
    color: level === 'RED' ? 'red' : level === 'AMBER' ? 'amber' : 'emerald',
    badgeLabel:
      level === 'RED'
        ? 'CRITICAL ALERT (Red)'
        : level === 'AMBER'
        ? 'URGENT WATCHLIST (Amber)'
        : 'STABLE / NORMAL (Green)',
    flags: flags.length > 0 ? flags : ['All vital parameters within physiological baseline'],
  };
}

function getBmiCategory(bmi) {
  if (!bmi) return 'Unrecorded';
  if (bmi < 18.5) return 'Underweight';
  if (bmi >= 18.5 && bmi <= 24.9) return 'Normal Weight';
  if (bmi >= 25.0 && bmi <= 29.9) return 'Overweight';
  return 'Obese';
}
