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

/**
 * Module 3 - Day 2: Structured Clinical SOAP Note Validation Middleware
 */
export function validateSoapNoteInput(req, res, next) {
  const { patientId, subjective, objective, assessment, plan } = req.body;
  const errors = [];

  if (!patientId || typeof patientId !== 'string') {
    errors.push('Patient ID or MRN is required for documenting SOAP notes.');
  }

  if (!subjective || typeof subjective !== 'string' || subjective.trim().length < 3) {
    errors.push('Subjective (S) component (chief complaints/history) is required.');
  }

  if (!objective || typeof objective !== 'string' || objective.trim().length < 3) {
    errors.push('Objective (O) component (physical exam findings/vitals) is required.');
  }

  if (!assessment || typeof assessment !== 'string' || assessment.trim().length < 3) {
    errors.push('Assessment (A) component (clinical diagnosis) is required.');
  }

  if (!plan || typeof plan !== 'string' || plan.trim().length < 3) {
    errors.push('Plan (P) component (treatment plan & advice) is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      code: 'SOAP_VALIDATION_FAILED',
      message: 'Clinical SOAP note validation failed.',
      errors,
    });
  }

  next();
}

export function validateSoapNoteIdParam(req, res, next) {
  const { id } = req.params;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      code: 'SOAP_ID_REQUIRED',
      message: 'SOAP note ID parameter is required.',
    });
  }

  next();
}

