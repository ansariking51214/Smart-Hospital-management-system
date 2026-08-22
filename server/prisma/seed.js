import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Hospital Management System Database Seed...');

  // 1. Clean existing records (in reverse dependency order)
  console.log('🧹 Cleaning existing data...');
  await prisma.auditLog.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.bedAllocation.deleteMany({});
  await prisma.bed.deleteMany({});
  await prisma.ward.deleteMany({});
  await prisma.inventoryBatch.deleteMany({});
  await prisma.medicine.deleteMany({});
  await prisma.labOrder.deleteMany({});
  await prisma.prescriptionItem.deleteMany({});
  await prisma.prescription.deleteMany({});
  await prisma.consultationNote.deleteMany({});
  await prisma.vitalSign.deleteMany({});
  await prisma.queueToken.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.doctorProfile.deleteMany({});
  await prisma.patientProfile.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create Departments
  console.log('🏥 Creating Clinical Departments...');
  const deptCardio = await prisma.department.create({
    data: {
      name: 'Cardiology',
      code: 'CARD',
      description: 'Department of Cardiovascular and Heart Sciences',
      isActive: true,
    },
  });

  const deptPeds = await prisma.department.create({
    data: {
      name: 'Pediatrics',
      code: 'PED',
      description: 'Child Healthcare and Neonatal Department',
      isActive: true,
    },
  });

  const deptNeuro = await prisma.department.create({
    data: {
      name: 'Neurology',
      code: 'NEUR',
      description: 'Brain, Spine and Nervous System Care',
      isActive: true,
    },
  });

  const deptOrtho = await prisma.department.create({
    data: {
      name: 'Orthopedics',
      code: 'ORTH',
      description: 'Bone, Joint and Musculoskeletal Services',
      isActive: true,
    },
  });

  const deptGenMed = await prisma.department.create({
    data: {
      name: 'General Medicine',
      code: 'GEN',
      description: 'Internal Medicine, OPD Consultation & Primary Care',
      isActive: true,
    },
  });

  // 3. Password Hashes
  const defaultPasswordHash = await bcrypt.hash('Password@123', 10);
  const adminPasswordHash = await bcrypt.hash('Admin@12345', 10);

  // 4. Create Users (Super Admin, Doctors, Staff, Patients)
  console.log('👥 Creating System Users & Profiles (RBAC)...');

  // Super Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@hms.hospital',
      passwordHash: adminPasswordHash,
      fullName: 'System Administrator',
      phone: '+1-555-0100',
      role: 'ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  // Doctor 1 (Cardiology)
  const drSarahUser = await prisma.user.create({
    data: {
      email: 'dr.sarah@hms.hospital',
      passwordHash: defaultPasswordHash,
      fullName: 'Dr. Sarah Jenkins, MD',
      phone: '+1-555-0111',
      role: 'DOCTOR',
      avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150',
    },
  });

  await prisma.doctorProfile.create({
    data: {
      userId: drSarahUser.id,
      specialization: 'Interventional Cardiology',
      departmentId: deptCardio.id,
      licenseNumber: 'MD-CARD-88341',
      qualification: 'MBBS, MD (Cardiology), FACC',
      consultationFee: 75.0,
      roomNumber: 'OPD-102',
      availableDays: 'Mon,Tue,Wed,Thu,Fri',
      shiftStart: '09:00',
      shiftEnd: '15:00',
      bio: 'Senior consultant cardiologist with over 12 years of clinical experience in cardiac diagnostics and coronary interventions.',
    },
  });

  // Doctor 2 (Pediatrics)
  const drAhmedUser = await prisma.user.create({
    data: {
      email: 'dr.ahmed@hms.hospital',
      passwordHash: defaultPasswordHash,
      fullName: 'Dr. Ahmed Farooq, MD',
      phone: '+1-555-0122',
      role: 'DOCTOR',
      avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150',
    },
  });

  await prisma.doctorProfile.create({
    data: {
      userId: drAhmedUser.id,
      specialization: 'General Pediatrics',
      departmentId: deptPeds.id,
      licenseNumber: 'MD-PEDS-64219',
      qualification: 'MBBS, FCPS (Pediatrics), DCH',
      consultationFee: 60.0,
      roomNumber: 'OPD-105',
      availableDays: 'Mon,Tue,Wed,Thu,Sat',
      shiftStart: '10:00',
      shiftEnd: '16:00',
      bio: 'Consultant pediatrician dedicated to child wellness, immunization, and pediatric primary care.',
    },
  });

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
  await prisma.user.create({
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

  // 5. Create Patient Users & Demographic Profiles (with auto MRN format)
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

  await prisma.patientProfile.create({
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
      allergies: 'Penicillin, Peanuts',
      chronicConditions: 'Primary Hypertension',
      insuranceProvider: 'Blue Cross Blue Shield',
      insurancePolicyNo: 'BCBS-9948201',
      notes: 'Patient requires regular blood pressure monitoring.',
    },
  });

  // Patient 2 (Walk-in / Unlinked user account)
  await prisma.patientProfile.create({
    data: {
      mrn: 'MRN-2026-0002',
      firstName: 'Ayesha',
      lastName: 'Khan',
      dateOfBirth: new Date('1995-09-20'),
      gender: 'FEMALE',
      bloodGroup: 'B+',
      nationalId: 'ID-95201948',
      phone: '+1-555-0301',
      email: 'ayesha.khan@example.com',
      address: '120 Elm Street, Apt 4B',
      city: 'Metro City',
      state: 'NY',
      postalCode: '10001',
      emergencyContactName: 'Tariq Khan',
      emergencyContactPhone: '+1-555-0302',
      emergencyContactRelation: 'Father',
      allergies: 'Aspirin, NSAIDs',
      chronicConditions: 'Mild Asthma',
      insuranceProvider: 'Aetna Health',
      insurancePolicyNo: 'AET-449102',
      notes: 'Carries salbutamol inhaler.',
    },
  });

  // Patient 3
  await prisma.patientProfile.create({
    data: {
      mrn: 'MRN-2026-0003',
      firstName: 'Robert',
      lastName: 'Chen',
      dateOfBirth: new Date('1972-11-05'),
      gender: 'MALE',
      bloodGroup: 'O+',
      nationalId: 'ID-72110599',
      phone: '+1-555-0401',
      email: 'robert.chen@example.com',
      address: '88 Oakridge Boulevard',
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

  // 6. Seed Pharmacy Medicines (Foundation for Module 4)
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

  // 7. Seed Wards & Beds (Foundation for Module 4)
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

  // 8. Create Initial Audit Log
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'SYSTEM_INITIALIZATION',
      entity: 'System',
      details: 'Hospital Management System Day 1 DB schema migration and baseline seed completed successfully.',
      ipAddress: '127.0.0.1',
      userAgent: 'SeedScript/1.0',
    },
  });

  console.log('✅ Database Seed Completed Successfully!');
  console.log('----------------------------------------------------');
  console.log('🔐 Demo Credentials for Module 1 Testing:');
  console.log('  • Admin:        admin@hms.hospital        / Admin@12345');
  console.log('  • Doctor (Card):dr.sarah@hms.hospital      / Password@123');
  console.log('  • Doctor (Peds):dr.ahmed@hms.hospital      / Password@123');
  console.log('  • Receptionist: receptionist@hms.hospital  / Password@123');
  console.log('  • Nurse:        nurse.maria@hms.hospital   / Password@123');
  console.log('  • Patient:      david.miller@gmail.com     / Password@123');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
