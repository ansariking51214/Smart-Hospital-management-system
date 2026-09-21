/**
 * Role-Based Access Control (RBAC) System Configuration
 * Module 1 - Day 3 Deliverable
 */

export const SYSTEM_ROLES = {
  ADMIN: 'ADMIN',
  DOCTOR: 'DOCTOR',
  RECEPTIONIST: 'RECEPTIONIST',
  NURSE: 'NURSE',
  PHARMACIST: 'PHARMACIST',
  PATIENT: 'PATIENT',
};

export const PERMISSIONS = {
  // System Administration
  MANAGE_USERS: 'MANAGE_USERS',
  CHANGE_USER_ROLES: 'CHANGE_USER_ROLES',
  VIEW_AUDIT_LOGS: 'VIEW_AUDIT_LOGS',
  MANAGE_DEPARTMENTS: 'MANAGE_DEPARTMENTS',

  // Clinical & Doctor Operations
  CREATE_CONSULTATION_NOTE: 'CREATE_CONSULTATION_NOTE',
  ISSUE_PRESCRIPTION: 'ISSUE_PRESCRIPTION',
  ORDER_LAB_TESTS: 'ORDER_LAB_TESTS',
  VIEW_MEDICAL_HISTORY: 'VIEW_MEDICAL_HISTORY',

  // Front Desk & Reception
  REGISTER_PATIENT: 'REGISTER_PATIENT',
  EDIT_PATIENT_DEMOGRAPHICS: 'EDIT_PATIENT_DEMOGRAPHICS',
  ISSUE_QUEUE_TOKEN: 'ISSUE_QUEUE_TOKEN',
  SCHEDULE_APPOINTMENT: 'SCHEDULE_APPOINTMENT',

  // Nursing & Triage
  RECORD_VITAL_SIGNS: 'RECORD_VITAL_SIGNS',
  VIEW_WARD_ALLOCATIONS: 'VIEW_WARD_ALLOCATIONS',
  UPDATE_BED_STATUS: 'UPDATE_BED_STATUS',

  // Pharmacy & Dispensing
  VIEW_PRESCRIPTIONS: 'VIEW_PRESCRIPTIONS',
  DISPENSE_MEDICINE: 'DISPENSE_MEDICINE',
  MANAGE_INVENTORY: 'MANAGE_INVENTORY',

  // Billing & Invoices
  GENERATE_INVOICE: 'GENERATE_INVOICE',
  RECORD_PAYMENT: 'RECORD_PAYMENT',

  // Patient Portal Self-Service
  VIEW_OWN_PROFILE: 'VIEW_OWN_PROFILE',
  VIEW_OWN_PRESCRIPTIONS: 'VIEW_OWN_PRESCRIPTIONS',
  VIEW_OWN_INVOICES: 'VIEW_OWN_INVOICES',
  VIEW_OWN_APPOINTMENTS: 'VIEW_OWN_APPOINTMENTS',
};

/**
 * Granular Role-to-Permissions Mapping Matrix
 */
export const ROLE_PERMISSIONS_MATRIX = {
  ADMIN: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.CHANGE_USER_ROLES,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.MANAGE_DEPARTMENTS,
    PERMISSIONS.VIEW_MEDICAL_HISTORY,
    PERMISSIONS.REGISTER_PATIENT,
    PERMISSIONS.EDIT_PATIENT_DEMOGRAPHICS,
    PERMISSIONS.SCHEDULE_APPOINTMENT,
    PERMISSIONS.ISSUE_QUEUE_TOKEN,
    PERMISSIONS.VIEW_WARD_ALLOCATIONS,
    PERMISSIONS.UPDATE_BED_STATUS,
    PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.GENERATE_INVOICE,
    PERMISSIONS.RECORD_PAYMENT,
    PERMISSIONS.VIEW_OWN_PROFILE,
  ],
  DOCTOR: [
    PERMISSIONS.CREATE_CONSULTATION_NOTE,
    PERMISSIONS.ISSUE_PRESCRIPTION,
    PERMISSIONS.ORDER_LAB_TESTS,
    PERMISSIONS.VIEW_MEDICAL_HISTORY,
    PERMISSIONS.SCHEDULE_APPOINTMENT,
    PERMISSIONS.VIEW_OWN_PROFILE,
  ],
  RECEPTIONIST: [
    PERMISSIONS.REGISTER_PATIENT,
    PERMISSIONS.EDIT_PATIENT_DEMOGRAPHICS,
    PERMISSIONS.ISSUE_QUEUE_TOKEN,
    PERMISSIONS.SCHEDULE_APPOINTMENT,
    PERMISSIONS.GENERATE_INVOICE,
    PERMISSIONS.RECORD_PAYMENT,
    PERMISSIONS.VIEW_OWN_PROFILE,
  ],
  NURSE: [
    PERMISSIONS.RECORD_VITAL_SIGNS,
    PERMISSIONS.VIEW_WARD_ALLOCATIONS,
    PERMISSIONS.UPDATE_BED_STATUS,
    PERMISSIONS.VIEW_MEDICAL_HISTORY,
    PERMISSIONS.VIEW_OWN_PROFILE,
  ],
  PHARMACIST: [
    PERMISSIONS.VIEW_PRESCRIPTIONS,
    PERMISSIONS.DISPENSE_MEDICINE,
    PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.VIEW_OWN_PROFILE,
  ],
  PATIENT: [
    PERMISSIONS.VIEW_OWN_PROFILE,
    PERMISSIONS.VIEW_OWN_APPOINTMENTS,
    PERMISSIONS.VIEW_OWN_PRESCRIPTIONS,
    PERMISSIONS.VIEW_OWN_INVOICES,
  ],
};

/**
 * Role Metadata & Description Information
 */
export const ROLE_DESCRIPTIONS = {
  ADMIN: {
    title: 'Hospital Administrator',
    badgeColor: 'red',
    level: 1,
    description: 'Full administrative control over users, security audit logs, clinical departments, and system settings.',
  },
  DOCTOR: {
    title: 'Attending Physician / Doctor',
    badgeColor: 'emerald',
    level: 2,
    description: 'Clinical consultations (SOAP notes), diagnostic evaluation, prescription issuance, and lab test ordering.',
  },
  RECEPTIONIST: {
    title: 'Front Desk Receptionist',
    badgeColor: 'blue',
    level: 3,
    description: 'Patient intake, demographic registration, automated MRN assignment, and OPD queue token scheduling.',
  },
  NURSE: {
    title: 'Registered Clinical Nurse',
    badgeColor: 'purple',
    level: 3,
    description: 'Patient triage, vital signs measurement (BP, SpO2, Pulse, BMI), and ward bed occupancy tracking.',
  },
  PHARMACIST: {
    title: 'Hospital Pharmacist',
    badgeColor: 'teal',
    level: 3,
    description: 'Prescription verification, medicine dispensing, batch tracking, and pharmaceutical inventory.',
  },
  PATIENT: {
    title: 'Registered Patient',
    badgeColor: 'amber',
    level: 4,
    description: 'Personal healthcare portal for reviewing clinical visit records, e-prescriptions, appointments, and bills.',
  },
};

/**
 * Check if a role possesses a specific permission
 * @param {string} role
 * @param {string} permission
 * @returns {boolean}
 */
export function hasPermission(role, permission) {
  if (!role || !permission) return false;
  const permissions = ROLE_PERMISSIONS_MATRIX[role] || [];
  return permissions.includes(permission);
}
