import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Smart Hospital Management System Database Seed...');

  // Clear existing records in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.prescriptionItem.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.bedAllocation.deleteMany();
  await prisma.bed.deleteMany();
  await prisma.ward.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.consultationNote.deleteMany();
  await prisma.vitalSign.deleteMany();
  await prisma.queueToken.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.medicine.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();

  const defaultPasswordHash = await bcrypt.hash('Password@123', 10);
  const adminPasswordHash = await bcrypt.hash('Admin@12345', 10);

  // 1. Seed Hospital Departments
  console.log('🏥 Seeding Clinical Departments...');
  const deptCardio = await prisma.department.create({
    data: {
      name: 'Cardiology',
      code: 'CARD',
      description: 'Comprehensive cardiovascular disease diagnosis, surgical interventions, and post-op care.',
    },
  });

  const deptPeds = await prisma.department.create({
    data: {
      name: 'Pediatrics',
      code: 'PEDS',
      description: 'General pediatric medicine, neonatal intensive care, and child immunization.',
    },
  });

  const deptOrthopedics = await prisma.department.create({
    data: {
      name: 'Orthopedics',
      code: 'ORTHO',
      description: 'Musculoskeletal trauma surgery, joint reconstruction, and sports medicine.',
    },
  });

  const deptNeurology = await prisma.department.create({
    data: {
      name: 'Neurology',
      code: 'NEURO',
      description: 'Diagnosis and clinical treatment of central and peripheral nervous system disorders.',
    },
  });

  // 2. Seed Super Administrator User
  console.log('👤 Seeding Super Administrator...');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@hms.hospital',
      passwordHash: adminPasswordHash,
      fullName: 'Dr. Arthur Sterling',
      phone: '+1-555-0100',
      role: 'ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150',
    },
  });

  // 3. Seed Doctors & Physician Profiles
  console.log('🩺 Seeding Doctors & Clinical Staff...');
  
  // Doctor 1 - Cardiologist
  const doc1User = await prisma.user.create({
    data: {
      email: 'dr.sarah@hms.hospital',
      passwordHash: defaultPasswordHash,
      fullName: 'Dr. Sarah Jenkins, MD',
      phone: '+1-555-0111',
      role: 'DOCTOR',
      avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150',
    },
  });

  const docSarah = await prisma.doctorProfile.create({
    data: {
      userId: doc1User.id,
      departmentId: deptCardio.id,
      specialization: 'Interventional Cardiology',
      licenseNumber: 'LIC-CARD-99482',
      qualification: 'MD, FACC (Harvard Medical School)',
      consultationFee: 150.0,
      roomNumber: 'Room 204',
      availableDays: 'Mon,Tue,Wed,Thu,Fri',
      shiftStart: '09:00',
      shiftEnd: '15:00',
      bio: 'Board-certified cardiologist with over 12 years of experience in coronary interventions and cardiac electrophysiology.',
    },
  });

  // Doctor 2 - Pediatrician
  const doc2User = await prisma.user.create({
    data: {
      email: 'dr.ahmed@hms.hospital',
      passwordHash: defaultPasswordHash,
      fullName: 'Dr. Ahmed Farooq, MBBS, FCPS',
      phone: '+1-555-0122',
      role: 'DOCTOR',
      avatarUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150',
    },
  });

  await prisma.doctorProfile.create({
    data: {
      userId: doc2User.id,
      departmentId: deptPeds.id,
      specialization: 'Pediatric Infectious Diseases',
      licenseNumber: 'LIC-PEDS-77319',
      qualification: 'MBBS, FCPS (Pediatrics)',
      consultationFee: 120.0,
      roomNumber: 'Room 108',
      availableDays: 'Mon,Wed,Fri',
      shiftStart: '10:00',
      shiftEnd: '16:00',
      bio: 'Specialist in pediatric developmental care and childhood respiratory infections.',
    },
  });

  // 4. Seed Hospital Staff Users
  console.log('👥 Seeding Receptionist, Nurse, Pharmacist...');
  
  // Receptionist
  await prisma.user.create({
    data: {
      email: 'receptionist@hms.hospital',
      passwordHash: defaultPasswordHash,
      fullName: 'Emily Clark',
      phone: '+1-555-0133',
      role: 'RECEPTIONIST',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    },
  });

  // Nurse
  const nurseUser = await prisma.user.create({
    data: {
      email: 'nurse.maria@hms.hospital',
      passwordHash: defaultPasswordHash,
      fullName: 'Maria Rodriguez, RN',
      phone: '+1-555-0144',
      role: 'NURSE',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    },
  });

  // Pharmacist
  await prisma.user.create({
    data: {
      email: 'pharmacist.john@hms.hospital',
      passwordHash: defaultPasswordHash,
      fullName: 'Johnathan Hayes, PharmD',
      phone: '+1-555-0155',
      role: 'PHARMACIST',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  });

  // 5. Create Patient Users & Demographic Profiles
  console.log('📋 Creating Patient Demographic Profiles (MRNs)...');

  // Patient 1
  const patient1User = await prisma.user.create({
    data: {
      email: 'david.miller@gmail.com',
      passwordHash: defaultPasswordHash,
      fullName: 'David Miller',
      phone: '+1-555-0201',
      role: 'PATIENT',
    },
  });

  const patDavid = await prisma.patientProfile.create({
    data: {
      userId: patient1User.id,
      mrn: 'MRN-2026-0001',
      firstName: 'David',
      lastName: 'Miller',
      dateOfBirth: new Date('1988-04-12'),
      gender: 'MALE',
      bloodGroup: 'A+',
      nationalId: 'ID-88492019',
      phone: '+1-555-0201',
      email: 'david.miller@gmail.com',
      address: '742 Evergreen Terrace',
      city: 'Springfield',
      state: 'IL',
      postalCode: '62704',
      emergencyContactName: 'Sarah Miller',
      emergencyContactPhone: '+1-555-0202',
      emergencyContactRelation: 'Spouse',
      allergies: 'Penicillin, Dust Mites',
      chronicConditions: 'Mild Hypertension',
      insuranceProvider: 'Blue Cross Blue Shield',
      insurancePolicyNo: 'BCBS-9918230',
      notes: 'Patient reports mild shortness of breath during exertion.',
    },
  });

  // Patient 2
  const patient2User = await prisma.user.create({
    data: {
      email: 'fatima.noor@gmail.com',
      passwordHash: defaultPasswordHash,
      fullName: 'Fatima Noor',
      phone: '+1-555-0301',
      role: 'PATIENT',
    },
  });

  await prisma.patientProfile.create({
    data: {
      userId: patient2User.id,
      mrn: 'MRN-2026-0002',
      firstName: 'Fatima',
      lastName: 'Noor',
      dateOfBirth: new Date('1994-11-23'),
      gender: 'FEMALE',
      bloodGroup: 'O+',
      nationalId: 'ID-94112390',
      phone: '+1-555-0301',
      email: 'fatima.noor@gmail.com',
      address: '45 Lakeview Boulevard',
      city: 'Chicago',
      state: 'IL',
      postalCode: '60601',
      emergencyContactName: 'Omar Noor',
      emergencyContactPhone: '+1-555-0302',
      emergencyContactRelation: 'Brother',
      allergies: 'Peanuts, Shellfish',
      chronicConditions: 'Asthma',
      insuranceProvider: 'Aetna Health',
      insurancePolicyNo: 'AET-772910',
      notes: 'Carry rescue inhaler at all times.',
    },
  });

  // Patient 3
  const patient3User = await prisma.user.create({
    data: {
      email: 'robert.chen@gmail.com',
      passwordHash: defaultPasswordHash,
      fullName: 'Robert Chen',
      phone: '+1-555-0401',
      role: 'PATIENT',
    },
  });

  await prisma.patientProfile.create({
    data: {
      userId: patient3User.id,
      mrn: 'MRN-2026-0003',
      firstName: 'Robert',
      lastName: 'Chen',
      dateOfBirth: new Date('1965-02-18'),
      gender: 'MALE',
      bloodGroup: 'B+',
      nationalId: 'ID-65021811',
      phone: '+1-555-0401',
      email: 'robert.chen@gmail.com',
      address: '108 Grand Avenue',
      city: 'Oakville',
      state: 'CA',
      postalCode: '90210',
      emergencyContactName: 'Linda Chen',
      emergencyContactPhone: '+1-555-0402',
      emergencyContactRelation: 'Daughter',
      allergies: 'Sulfa Drugs',
      chronicConditions: 'Type 2 Diabetes Mellitus',
      insuranceProvider: 'United Healthcare',
      insurancePolicyNo: 'UHC-881920',
      notes: 'HBA1c check due every 3 months.',
    },
  });

  // 6. Seed Longitudinal Medical History for David Miller
  console.log('🩺 Seeding Longitudinal Clinical History for David Miller...');
  
  const appt1 = await prisma.appointment.create({
    data: {
      patientId: patDavid.id,
      doctorId: docSarah.id,
      appointmentDate: new Date('2026-08-20T10:00:00Z'),
      timeSlot: '10:00 - 10:30',
      type: 'OPD',
      status: 'COMPLETED',
      reasonForVisit: 'Routine cardiovascular follow-up & BP check.',
    },
  });

  await prisma.consultationNote.create({
    data: {
      appointmentId: appt1.id,
      patientId: patDavid.id,
      doctorId: doc1User.id,
      subjective: 'Patient reports symptoms occur 1-2 times weekly after walking upstairs.',
      objective: 'BP 132/85 mmHg, Heart Sounds regular S1/S2, No murmurs detected.',
      assessment: 'Primary Stage-1 Essential Hypertension, well-compensated.',
      plan: 'Continue low sodium diet, 30 min daily walking, prescribe ACE Inhibitor.',
      icd10Codes: 'I10',
    },
  });

  await prisma.vitalSign.create({
    data: {
      appointmentId: appt1.id,
      patientId: patDavid.id,
      recordedById: nurseUser.id,
      systolicBp: 132,
      diastolicBp: 85,
      pulseRate: 74,
      temperature: 98.6,
      respiratoryRate: 16,
      oxygenSaturation: 99.0,
      weightKg: 78.5,
      heightCm: 178.0,
      bmi: 24.8,
      triageNotes: 'Stable outpatient triage.',
    },
  });

  const rx1 = await prisma.prescription.create({
    data: {
      patientId: patDavid.id,
      doctorId: docSarah.id,
      prescriptionNumber: 'RX-2026-0001',
      generalAdvice: 'Review in clinic after 4 weeks with BP chart.',
      dietaryAdvice: 'Low sodium diet, reduce caffeine intake.',
    },
  });

  await prisma.prescriptionItem.createMany({
    data: [
      {
        prescriptionId: rx1.id,
        medicineName: 'Lisinopril 10mg',
        dosage: '1 Tablet Daily',
        frequency: 'Once Daily',
        duration: '30 Days',
        instructions: 'Take in morning with water',
      },
      {
        prescriptionId: rx1.id,
        medicineName: 'Aspirin 81mg',
        dosage: '1 Tablet Daily',
        frequency: 'Once Daily',
        duration: '30 Days',
        instructions: 'Take after breakfast',
      },
    ],
  });

  // 7. Seed Pharmacy Medicines
  console.log('💊 Seeding Pharmacy Inventory foundation...');
  const sampleMedicines = [
    { name: 'Amoxicillin 500mg', genericName: 'Amoxicillin', category: 'Antibiotic', manufacturer: 'GSK', unitPrice: 12.5, stockQuantity: 250, dosageForm: 'Capsule' },
    { name: 'Paracetamol 500mg', genericName: 'Acetaminophen', category: 'Analgesic / Antipyretic', manufacturer: 'Panadol', unitPrice: 3.5, stockQuantity: 800, dosageForm: 'Tablet' },
    { name: 'Metformin 500mg', genericName: 'Metformin HCl', category: 'Antidiabetic', manufacturer: 'Merck', unitPrice: 8.0, stockQuantity: 400, dosageForm: 'Tablet' },
    { name: 'Atorvastatin 20mg', genericName: 'Atorvastatin', category: 'Cardiovascular', manufacturer: 'Pfizer', unitPrice: 18.0, stockQuantity: 300, dosageForm: 'Tablet' },
    { name: 'Salbutamol Inhaler 100mcg', genericName: 'Albuterol', category: 'Respiratory', manufacturer: 'Ventolin', unitPrice: 22.0, stockQuantity: 120, dosageForm: 'Inhaler' },
  ];

  for (const med of sampleMedicines) {
    await prisma.medicine.create({ data: med });
  }

  // 8. Seed Wards & Beds
  console.log('🛏️ Seeding Inpatient Wards & Beds foundation...');
  const icuWard = await prisma.ward.create({
    data: {
      name: 'Intensive Care Unit (ICU)',
      code: 'ICU-A',
      departmentId: deptCardio.id,
      type: 'ICU',
      floor: '3rd Floor',
      totalBeds: 4,
    },
  });

  await prisma.bed.createMany({
    data: [
      { wardId: icuWard.id, bedNumber: 'ICU-01', dailyCharge: 250.0, status: 'AVAILABLE' },
      { wardId: icuWard.id, bedNumber: 'ICU-02', dailyCharge: 250.0, status: 'AVAILABLE' },
      { wardId: icuWard.id, bedNumber: 'ICU-03', dailyCharge: 250.0, status: 'OCCUPIED' },
      { wardId: icuWard.id, bedNumber: 'ICU-04', dailyCharge: 250.0, status: 'AVAILABLE' },
    ],
  });

  // 9. Create Initial Audit Log
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'SYSTEM_INITIALIZATION',
      entity: 'System',
      details: 'Hospital Management System Day 1-5 DB schema migration and baseline seed completed successfully.',
      ipAddress: '127.0.0.1',
      userAgent: 'SeedScript/1.0',
    },
  });

  console.log('✅ Database Seed Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
