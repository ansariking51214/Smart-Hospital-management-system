import prisma from '../config/db.js';

/**
 * Returns architectural schema metadata and live counts for Day 1 Database Verification
 */
export async function getSchemaDetails(req, res, next) {
  try {
    const [
      users,
      patients,
      doctors,
      departments,
      medicines,
      wards,
      beds,
      auditLogs,
    ] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          phone: true,
          isActive: true,
          createdAt: true,
        },
      }),
      prisma.patientProfile.findMany({
        select: {
          id: true,
          mrn: true,
          firstName: true,
          lastName: true,
          gender: true,
          dateOfBirth: true,
          bloodGroup: true,
          phone: true,
          emergencyContactName: true,
          emergencyContactPhone: true,
          allergies: true,
          chronicConditions: true,
          createdAt: true,
        },
      }),
      prisma.doctorProfile.findMany({
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
            },
          },
          department: true,
        },
      }),
      prisma.department.findMany(),
      prisma.medicine.findMany(),
      prisma.ward.findMany({ include: { beds: true } }),
      prisma.bed.findMany(),
      prisma.auditLog.findMany({ take: 10, orderBy: { createdAt: 'desc' } }),
    ]);

    const schemaEntities = [
      {
        name: 'User',
        module: 'Module 1 (RBAC)',
        description: 'Core authentication & credential entity with role assignments.',
        fields: ['id (CUID)', 'email (Unique)', 'passwordHash (Bcrypt)', 'fullName', 'phone', 'role (Enum)', 'avatarUrl', 'isActive', 'lastLoginAt', 'createdAt', 'updatedAt'],
        relations: ['doctorProfile (1:1)', 'patientProfile (1:1)', 'auditLogs (1:N)', 'createdNotes (1:N)'],
        count: users.length,
      },
      {
        name: 'DoctorProfile',
        module: 'Module 1 / 2',
        description: 'Clinical profile, specialty, room allocation, consultation fees & schedule.',
        fields: ['id', 'userId (FK)', 'specialization', 'departmentId (FK)', 'licenseNumber (Unique)', 'qualification', 'consultationFee', 'roomNumber', 'availableDays', 'shiftStart', 'shiftEnd', 'bio'],
        relations: ['user (N:1)', 'department (N:1)', 'appointments (1:N)', 'prescriptions (1:N)', 'queueTokens (1:N)'],
        count: doctors.length,
      },
      {
        name: 'PatientProfile',
        module: 'Module 1 (Demographics)',
        description: 'Patient demographic records, auto-increment MRN (MRN-YYYY-XXXX), allergies, and emergency contacts.',
        fields: ['id', 'userId (FK, Nullable)', 'mrn (Unique Index)', 'firstName', 'lastName', 'dateOfBirth', 'gender', 'bloodGroup', 'phone', 'emergencyContactName', 'emergencyContactPhone', 'allergies', 'chronicConditions', 'insurancePolicyNo'],
        relations: ['user (N:1)', 'appointments (1:N)', 'vitalSigns (1:N)', 'consultationNotes (1:N)', 'prescriptions (1:N)', 'invoices (1:N)', 'bedAllocations (1:N)'],
        count: patients.length,
      },
      {
        name: 'Department',
        module: 'Module 1 / 2',
        description: 'Clinical specialty departments (Cardiology, Pediatrics, Neurology, etc.).',
        fields: ['id', 'name (Unique)', 'code (Unique)', 'description', 'isActive', 'createdAt'],
        relations: ['doctors (1:N)', 'wards (1:N)'],
        count: departments.length,
      },
      {
        name: 'AuditLog',
        module: 'Module 1 (Security)',
        description: 'System audit trails recording user authentication, updates, and clinical actions.',
        fields: ['id', 'userId (FK)', 'action', 'entity', 'entityId', 'details', 'ipAddress', 'userAgent', 'createdAt'],
        relations: ['user (N:1)'],
        count: auditLogs.length,
      },
      {
        name: 'Appointment & QueueToken',
        module: 'Module 2 (Prepared)',
        description: 'OPD scheduling engine, slot conflict handling, and waiting room token queue.',
        fields: ['id', 'patientId', 'doctorId', 'appointmentDate', 'timeSlot', 'status (Enum)', 'reasonForVisit'],
        relations: ['patient', 'doctor', 'queueToken', 'vitalSign', 'consultationNote'],
        count: 0,
      },
      {
        name: 'VitalSign',
        module: 'Module 2 (Prepared)',
        description: 'Nurse triage recording (BP, Pulse, SpO2, Temp, BMI auto-calc).',
        fields: ['id', 'patientId', 'temperature', 'systolicBp', 'diastolicBp', 'pulseRate', 'oxygenSaturation', 'bmi'],
        relations: ['patient', 'appointment'],
        count: 0,
      },
      {
        name: 'ConsultationNote & Prescription',
        module: 'Module 3 (Prepared)',
        description: 'Clinical SOAP notes, ICD-10 tagging, digital prescription (RX-YYYY-XXXX) items.',
        fields: ['id', 'patientId', 'doctorId', 'subjective', 'objective', 'assessment', 'plan', 'icd10Codes'],
        relations: ['patient', 'doctor', 'prescriptionItems', 'labOrders'],
        count: 0,
      },
      {
        name: 'Medicine & InventoryBatch',
        module: 'Module 4 (Prepared)',
        description: 'Pharmacy medicine catalog and stock batch management with expiry tracking.',
        fields: ['id', 'name', 'genericName', 'category', 'unitPrice', 'stockQuantity', 'reorderLevel'],
        relations: ['batches (1:N)'],
        count: medicines.length,
      },
      {
        name: 'Ward & Bed & Invoice',
        module: 'Module 4 (Prepared)',
        description: 'Inpatient bed allocation matrix and automated hospital billing (INV-YYYY-XXXX).',
        fields: ['id', 'wardId', 'bedNumber', 'dailyCharge', 'status', 'invoiceNumber', 'totalAmount'],
        relations: ['ward', 'allocations', 'invoiceItems'],
        count: beds.length,
      },
    ];

    res.json({
      success: true,
      data: {
        totalEntities: schemaEntities.length,
        entities: schemaEntities,
        records: {
          users,
          patients,
          doctors,
          departments,
          medicines,
          wards,
          beds,
          auditLogs,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}
