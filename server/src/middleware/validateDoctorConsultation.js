/**
 * Doctor Consultation UI & Clinical Workspace Validation Middleware
 * Module 3 - Day 1 Deliverable
 */

export function validateStartEncounter(req, res, next) {
  const { patientId, appointmentId } = req.body;
  const errors = [];

  if (!patientId || typeof patientId !== 'string') {
    errors.push('Patient ID is required to initiate a clinical encounter.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_FAILED',
      message: 'Consultation encounter validation failed.',
      errors,
    });
  }

  next();
}

export function validatePatientIdParam(req, res, next) {
  const { patientId } = req.params;

  if (!patientId || typeof patientId !== 'string') {
    return res.status(400).json({
      success: false,
      code: 'PATIENT_ID_REQUIRED',
      message: 'Patient ID or MRN parameter is required.',
    });
  }

  next();
}
