/**
 * Nurse Vitals & Clinical Triage Input Validation Middleware
 * Module 2 - Day 4 Deliverable
 */

export function validateVitalsInput(req, res, next) {
  const {
    patientId,
    systolicBp,
    diastolicBp,
    pulseRate,
    temperature,
    respiratoryRate,
    oxygenSaturation,
    heightCm,
    weightKg,
  } = req.body;

  const errors = [];

  if (!patientId || typeof patientId !== 'string') {
    errors.push('Patient ID is required for recording vital signs.');
  }

  // Blood Pressure validation
  if (systolicBp !== undefined && systolicBp !== null && systolicBp !== '') {
    const sys = Number(systolicBp);
    if (isNaN(sys) || sys < 50 || sys > 260) {
      errors.push('Systolic BP must be between 50 and 260 mmHg.');
    }
  }

  if (diastolicBp !== undefined && diastolicBp !== null && diastolicBp !== '') {
    const dia = Number(diastolicBp);
    if (isNaN(dia) || dia < 30 || dia > 160) {
      errors.push('Diastolic BP must be between 30 and 160 mmHg.');
    }
  }

  // Pulse rate validation
  if (pulseRate !== undefined && pulseRate !== null && pulseRate !== '') {
    const pulse = Number(pulseRate);
    if (isNaN(pulse) || pulse < 30 || pulse > 240) {
      errors.push('Pulse rate must be between 30 and 240 bpm.');
    }
  }

  // Temperature validation (°F)
  if (temperature !== undefined && temperature !== null && temperature !== '') {
    const temp = Number(temperature);
    if (isNaN(temp) || temp < 85 || temp > 110) {
      errors.push('Body Temperature must be between 85.0°F and 110.0°F.');
    }
  }

  // SpO2 Oxygen saturation validation
  if (oxygenSaturation !== undefined && oxygenSaturation !== null && oxygenSaturation !== '') {
    const spo2 = Number(oxygenSaturation);
    if (isNaN(spo2) || spo2 < 50 || spo2 > 100) {
      errors.push('Oxygen Saturation (SpO2) must be between 50% and 100%.');
    }
  }

  // Respiratory Rate validation
  if (respiratoryRate !== undefined && respiratoryRate !== null && respiratoryRate !== '') {
    const rr = Number(respiratoryRate);
    if (isNaN(rr) || rr < 6 || rr > 60) {
      errors.push('Respiratory rate must be between 6 and 60 breaths/min.');
    }
  }

  // Height & Weight validation
  if (heightCm !== undefined && heightCm !== null && heightCm !== '') {
    const h = Number(heightCm);
    if (isNaN(h) || h < 20 || h > 260) {
      errors.push('Height must be between 20 cm and 260 cm.');
    }
  }

  if (weightKg !== undefined && weightKg !== null && weightKg !== '') {
    const w = Number(weightKg);
    if (isNaN(w) || w < 1 || w > 350) {
      errors.push('Weight must be between 1 kg and 350 kg.');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_FAILED',
      message: 'Physiological vitals validation failed.',
      errors,
    });
  }

  next();
}
