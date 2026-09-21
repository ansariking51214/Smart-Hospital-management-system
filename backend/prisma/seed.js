import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Comprehensive Database Seeding for Smart Hospital Management System...');

  // 0. Clear existing records in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.prescriptionItem.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.bedAllocation.deleteMany();
  await prisma.bed.deleteMany();
  await prisma.ward.deleteMany();
  await prisma.labOrder.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.consultationNote.deleteMany();
  await prisma.vitalSign.deleteMany();
  await prisma.queueToken.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.inventoryBatch.deleteMany();
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

  const deptGynaecology = await prisma.department.create({
    data: {
      name: 'Gynaecology & Obstetrics',
      code: 'GYNAE',
      description: 'Maternal health, prenatal and postnatal care, and gynaecological surgeries.',
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

  const docAhmed = await prisma.doctorProfile.create({
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

  // Doctor 3 - Orthopedic Surgeon
  const doc3User = await prisma.user.create({
    data: {
      email: 'dr.robert@hms.hospital',
      passwordHash: defaultPasswordHash,
      fullName: 'Dr. Robert Vance, MD',
      phone: '+1-555-0188',
      role: 'DOCTOR',
      avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150',
    },
  });

  const docRobert = await prisma.doctorProfile.create({
    data: {
      userId: doc3User.id,
      departmentId: deptOrthopedics.id,
      specialization: 'Joint Replacement & Trauma',
      licenseNumber: 'LIC-ORTHO-44120',
      qualification: 'MD, MS (Orthopedics)',
      consultationFee: 160.0,
      roomNumber: 'Room 302',
      availableDays: 'Mon,Tue,Thu,Fri',
      shiftStart: '08:30',
      shiftEnd: '14:30',
      bio: 'Expert orthopedic surgeon specializing in knee and hip replacement operations.',
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

  const patFatima = await prisma.patientProfile.create({
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

  const patRobert = await prisma.patientProfile.create({
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

  // Patient 4
  const patient4User = await prisma.user.create({
    data: {
      email: 'ayesha.khan@gmail.com',
      passwordHash: defaultPasswordHash,
      fullName: 'Ayesha Khan',
      phone: '+1-555-0501',
      role: 'PATIENT',
    },
  });

  const patAyesha = await prisma.patientProfile.create({
    data: {
      userId: patient4User.id,
      mrn: 'MRN-2026-0004',
      firstName: 'Ayesha',
      lastName: 'Khan',
      dateOfBirth: new Date('1995-05-15'),
      gender: 'FEMALE',
      bloodGroup: 'AB+',
      nationalId: 'ID-95051522',
      phone: '+1-555-0501',
      email: 'ayesha.khan@gmail.com',
      address: '12 Rosewood Lane',
      city: 'Springfield',
      state: 'IL',
      postalCode: '62701',
      emergencyContactName: 'Tariq Khan',
      emergencyContactPhone: '+1-555-0502',
      emergencyContactRelation: 'Husband',
      allergies: 'None',
      chronicConditions: 'None',
      insuranceProvider: 'Cigna Health',
      insurancePolicyNo: 'CGN-441092',
      notes: 'Routine maternity checkup.',
    },
  });

  // Patient 5
  const patient5User = await prisma.user.create({
    data: {
      email: 'bilal.hassan@gmail.com',
      passwordHash: defaultPasswordHash,
      fullName: 'Bilal Hassan',
      phone: '+1-555-0601',
      role: 'PATIENT',
    },
  });

  const patBilal = await prisma.patientProfile.create({
    data: {
      userId: patient5User.id,
      mrn: 'MRN-2026-0005',
      firstName: 'Bilal',
      lastName: 'Hassan',
      dateOfBirth: new Date('1978-09-30'),
      gender: 'MALE',
      bloodGroup: 'O-',
      nationalId: 'ID-78093044',
      phone: '+1-555-0601',
      email: 'bilal.hassan@gmail.com',
      address: '88 Sunset Boulevard',
      city: 'Chicago',
      state: 'IL',
      postalCode: '60611',
      emergencyContactName: 'Zubair Hassan',
      emergencyContactPhone: '+1-555-0602',
      emergencyContactRelation: 'Brother',
      allergies: 'Ibuprofen',
      chronicConditions: 'Hyperlipidemia',
      insuranceProvider: 'Humana',
      insurancePolicyNo: 'HUM-119283',
      notes: 'Scheduled for cholesterol evaluation.',
    },
  });

  // 6. Seed Appointments & Queue Tokens & Clinical Records
  console.log('🩺 Seeding Appointments, Queue Tokens, Vitals & Consultation Notes...');

  // Appt 1 - David Miller with Dr. Sarah (Completed)
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

  await prisma.queueToken.create({
    data: {
      tokenNumber: 1,
      tokenCode: 'CARD-001',
      patientId: patDavid.id,
      doctorId: docSarah.id,
      appointmentId: appt1.id,
      status: 'COMPLETED',
      calledAt: new Date('2026-08-20T10:05:00Z'),
      completedAt: new Date('2026-08-20T10:28:00Z'),
    },
  });

  const note1 = await prisma.consultationNote.create({
    data: {
      appointmentId: appt1.id,
      patientId: patDavid.id,
      doctorId: doc1User.id,
      subjective: 'Patient reports mild chest tightness occurs 1-2 times weekly after walking upstairs.',
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
      consultationNoteId: note1.id,
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

  // Appt 2 - Fatima Noor with Dr. Ahmed (In Progress / Queue)
  const appt2 = await prisma.appointment.create({
    data: {
      patientId: patFatima.id,
      doctorId: docAhmed.id,
      appointmentDate: new Date(),
      timeSlot: '11:00 - 11:30',
      type: 'OPD',
      status: 'IN_QUEUE',
      reasonForVisit: 'Wheezing, cough, and asthma flare-up.',
    },
  });

  await prisma.queueToken.create({
    data: {
      tokenNumber: 2,
      tokenCode: 'PEDS-002',
      patientId: patFatima.id,
      doctorId: docAhmed.id,
      appointmentId: appt2.id,
      status: 'WAITING',
    },
  });

  await prisma.vitalSign.create({
    data: {
      appointmentId: appt2.id,
      patientId: patFatima.id,
      recordedById: nurseUser.id,
      systolicBp: 118,
      diastolicBp: 76,
      pulseRate: 88,
      temperature: 99.1,
      respiratoryRate: 22,
      oxygenSaturation: 96.5,
      weightKg: 58.0,
      heightCm: 165.0,
      bmi: 21.3,
      triageNotes: 'Mild tachypnea noted. Salbutamol nebulization advised.',
    },
  });

  // Appt 3 - Robert Chen with Dr. Robert Vance (Scheduled)
  const appt3 = await prisma.appointment.create({
    data: {
      patientId: patRobert.id,
      doctorId: docRobert.id,
      appointmentDate: new Date(),
      timeSlot: '14:00 - 14:30',
      type: 'OPD',
      status: 'SCHEDULED',
      reasonForVisit: 'Left knee pain and swelling after joint strain.',
    },
  });

  await prisma.queueToken.create({
    data: {
      tokenNumber: 3,
      tokenCode: 'ORTHO-003',
      patientId: patRobert.id,
      doctorId: docRobert.id,
      appointmentId: appt3.id,
      status: 'WAITING',
    },
  });

  // Appt 4 - Ayesha Khan with Dr. Sarah (Scheduled)
  await prisma.appointment.create({
    data: {
      patientId: patAyesha.id,
      doctorId: docSarah.id,
      appointmentDate: new Date(),
      timeSlot: '15:00 - 15:30',
      type: 'Routine',
      status: 'SCHEDULED',
      reasonForVisit: 'ECG evaluation & general checkup.',
    },
  });

  // 7. Seed Pharmacy Medicines & Inventory Batches
  console.log('💊 Seeding Comprehensive Pharmacy Inventory...');
  const sampleMedicines = [
    { name: 'Amoxicillin 500mg', genericName: 'Amoxicillin', category: 'Antibiotic', manufacturer: 'GSK', unitPrice: 12.5, stockQuantity: 250, dosageForm: 'Capsule' },
    { name: 'Paracetamol 500mg', genericName: 'Acetaminophen', category: 'Analgesic / Antipyretic', manufacturer: 'Panadol', unitPrice: 3.5, stockQuantity: 800, dosageForm: 'Tablet' },
    { name: 'Metformin 500mg', genericName: 'Metformin HCl', category: 'Antidiabetic', manufacturer: 'Merck', unitPrice: 8.0, stockQuantity: 400, dosageForm: 'Tablet' },
    { name: 'Atorvastatin 20mg', genericName: 'Atorvastatin', category: 'Cardiovascular', manufacturer: 'Pfizer', unitPrice: 18.0, stockQuantity: 300, dosageForm: 'Tablet' },
    { name: 'Salbutamol Inhaler 100mcg', genericName: 'Albuterol', category: 'Respiratory', manufacturer: 'Ventolin', unitPrice: 22.0, stockQuantity: 120, dosageForm: 'Inhaler' },
    { name: 'Azithromycin 500mg', genericName: 'Azithromycin', category: 'Antibiotic', manufacturer: 'Pfizer', unitPrice: 15.0, stockQuantity: 180, dosageForm: 'Tablet' },
    { name: 'Ibuprofen 400mg', genericName: 'Ibuprofen', category: 'Analgesic / Anti-inflammatory', manufacturer: 'Abbott', unitPrice: 5.5, stockQuantity: 500, dosageForm: 'Tablet' },
    { name: 'Omeprazole 20mg', genericName: 'Omeprazole', category: 'Gastrointestinal', manufacturer: 'AstraZeneca', unitPrice: 9.5, stockQuantity: 350, dosageForm: 'Capsule' },
    { name: 'Losartan 50mg', genericName: 'Losartan Potassium', category: 'Cardiovascular', manufacturer: 'Novartis', unitPrice: 14.0, stockQuantity: 220, dosageForm: 'Tablet' },
    { name: 'Augmentin 625mg', genericName: 'Amoxicillin + Clavulanate', category: 'Antibiotic', manufacturer: 'GSK', unitPrice: 25.0, stockQuantity: 150, dosageForm: 'Tablet' },
    { name: 'Cetirizine 10mg', genericName: 'Cetirizine HCl', category: 'Antihistamine', manufacturer: 'McNeil', unitPrice: 4.0, stockQuantity: 600, dosageForm: 'Tablet' },
    { name: 'Insulin Glargine 100IU/ml', genericName: 'Insulin Glargine', category: 'Antidiabetic', manufacturer: 'Sanofi', unitPrice: 45.0, stockQuantity: 80, dosageForm: 'Injection' },
  ];

  for (const med of sampleMedicines) {
    const m = await prisma.medicine.create({ data: med });
    await prisma.inventoryBatch.create({
      data: {
        medicineId: m.id,
        batchNumber: `BATCH-${Math.floor(1000 + Math.random() * 9000)}`,
        quantity: med.stockQuantity,
        expiryDate: new Date('2027-12-31'),
        costPrice: med.unitPrice * 0.7,
      },
    });
  }

  // 8. Seed Lab Orders
  console.log('🧪 Seeding Lab Orders...');
  await prisma.labOrder.createMany({
    data: [
      {
        orderNumber: 'LAB-2026-0001',
        patientId: patDavid.id,
        consultationNoteId: note1.id,
        testName: 'Lipid Profile & Serum Electrolytes',
        category: 'Biochemistry',
        status: 'COMPLETED',
        resultsSummary: 'Cholesterol 195 mg/dL, Triglycerides 140 mg/dL, HDL 48 mg/dL, LDL 119 mg/dL. All parameters within target range.',
        completedAt: new Date('2026-08-21T09:00:00Z'),
      },
      {
        orderNumber: 'LAB-2026-0002',
        patientId: patFatima.id,
        testName: 'Complete Blood Count (CBC) & IgE Level',
        category: 'Hematology',
        status: 'PROCESSING',
        resultsSummary: 'Sample in laboratory automated analyzer.',
      },
      {
        orderNumber: 'LAB-2026-0003',
        patientId: patRobert.id,
        testName: 'Left Knee X-Ray (AP & Lateral View)',
        category: 'Radiology',
        status: 'SAMPLE_COLLECTED',
        resultsSummary: 'Patient transferred to Radiology Suite B.',
      },
      {
        orderNumber: 'LAB-2026-0004',
        patientId: patBilal.id,
        testName: 'HbA1c & Fasting Plasma Glucose',
        category: 'Biochemistry',
        status: 'REQUESTED',
      },
    ],
  });

  // 9. Seed Wards & Beds & Active Bed Allocations
  console.log('🛏️ Seeding Inpatient Wards & Bed Matrix...');
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

  const generalWard = await prisma.ward.create({
    data: {
      name: 'General Medical Ward',
      code: 'GEN-M',
      departmentId: deptCardio.id,
      type: 'General',
      floor: '2nd Floor',
      totalBeds: 6,
    },
  });

  const pedsWard = await prisma.ward.create({
    data: {
      name: 'Pediatric Care Ward',
      code: 'PED-W',
      departmentId: deptPeds.id,
      type: 'Pediatric',
      floor: '1st Floor',
      totalBeds: 4,
    },
  });

  const bed1 = await prisma.bed.create({ data: { wardId: icuWard.id, bedNumber: 'ICU-01', dailyCharge: 300.0, status: 'OCCUPIED' } });
  const bed2 = await prisma.bed.create({ data: { wardId: icuWard.id, bedNumber: 'ICU-02', dailyCharge: 300.0, status: 'AVAILABLE' } });
  await prisma.bed.create({ data: { wardId: icuWard.id, bedNumber: 'ICU-03', dailyCharge: 300.0, status: 'MAINTENANCE' } });
  await prisma.bed.create({ data: { wardId: icuWard.id, bedNumber: 'ICU-04', dailyCharge: 300.0, status: 'AVAILABLE' } });

  const bedGen1 = await prisma.bed.create({ data: { wardId: generalWard.id, bedNumber: 'GEN-101', dailyCharge: 120.0, status: 'OCCUPIED' } });
  await prisma.bed.create({ data: { wardId: generalWard.id, bedNumber: 'GEN-102', dailyCharge: 120.0, status: 'AVAILABLE' } });
  await prisma.bed.create({ data: { wardId: generalWard.id, bedNumber: 'GEN-103', dailyCharge: 120.0, status: 'AVAILABLE' } });

  await prisma.bedAllocation.create({
    data: {
      bedId: bed1.id,
      patientId: patDavid.id,
      admittedAt: new Date('2026-09-18T14:00:00Z'),
      notes: 'Post-cardiac catheterization monitoring.',
    },
  });

  await prisma.bedAllocation.create({
    data: {
      bedId: bedGen1.id,
      patientId: patBilal.id,
      admittedAt: new Date('2026-09-19T08:30:00Z'),
      notes: 'Observation for severe hyperlipidemia and hypertension.',
    },
  });

  // 10. Seed Invoices & Auto-Billing
  console.log('💳 Seeding Invoices & Patient Billing...');
  
  // Invoice 1 - Paid for David Miller
  const inv1 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0001',
      patientId: patDavid.id,
      subTotal: 282.5,
      taxRate: 5.0,
      taxAmount: 14.13,
      discount: 10.0,
      totalAmount: 286.63,
      paidAmount: 286.63,
      balanceDue: 0.0,
      paymentStatus: 'PAID',
      paymentMethod: 'Credit Card',
      paidAt: new Date('2026-08-20T11:00:00Z'),
    },
  });

  await prisma.invoiceItem.createMany({
    data: [
      { invoiceId: inv1.id, description: 'Cardiology OPD Consultation Fee', category: 'CONSULTATION', quantity: 1, unitPrice: 150.0, totalPrice: 150.0 },
      { invoiceId: inv1.id, description: 'Lipid Profile & Serum Electrolytes', category: 'LAB', quantity: 1, unitPrice: 85.0, totalPrice: 85.0 },
      { invoiceId: inv1.id, description: 'Lisinopril 10mg (30 Tabs)', category: 'PHARMACY', quantity: 1, unitPrice: 30.0, totalPrice: 30.0 },
      { invoiceId: inv1.id, description: 'Aspirin 81mg (30 Tabs)', category: 'PHARMACY', quantity: 1, unitPrice: 17.5, totalPrice: 17.5 },
    ],
  });

  // Invoice 2 - Pending for Fatima Noor
  const inv2 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0002',
      patientId: patFatima.id,
      subTotal: 162.0,
      taxRate: 5.0,
      taxAmount: 8.1,
      discount: 0.0,
      totalAmount: 170.1,
      paidAmount: 0.0,
      balanceDue: 170.1,
      paymentStatus: 'PENDING',
    },
  });

  await prisma.invoiceItem.createMany({
    data: [
      { invoiceId: inv2.id, description: 'Pediatric OPD Consultation Fee', category: 'CONSULTATION', quantity: 1, unitPrice: 120.0, totalPrice: 120.0 },
      { invoiceId: inv2.id, description: 'Salbutamol Inhaler 100mcg', category: 'PHARMACY', quantity: 1, unitPrice: 22.0, totalPrice: 22.0 },
      { invoiceId: inv2.id, description: 'Nebulization Service Fee', category: 'MISC', quantity: 1, unitPrice: 20.0, totalPrice: 20.0 },
    ],
  });

  // Invoice 3 - Partial Payment for Robert Chen
  const inv3 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0003',
      patientId: patRobert.id,
      subTotal: 310.0,
      taxRate: 5.0,
      taxAmount: 15.5,
      discount: 25.0,
      totalAmount: 300.5,
      paidAmount: 150.0,
      balanceDue: 150.5,
      paymentStatus: 'PARTIAL',
      paymentMethod: 'Cash',
    },
  });

  await prisma.invoiceItem.createMany({
    data: [
      { invoiceId: inv3.id, description: 'Orthopedic Consultation Fee', category: 'CONSULTATION', quantity: 1, unitPrice: 160.0, totalPrice: 160.0 },
      { invoiceId: inv3.id, description: 'Left Knee X-Ray (AP & Lat)', category: 'LAB', quantity: 1, unitPrice: 150.0, totalPrice: 150.0 },
    ],
  });

  // 11. Create Initial Audit Log
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'SYSTEM_INITIALIZATION',
      entity: 'System',
      details: 'Comprehensive seeding completed: 5 Patients, 12 Medicines, 3 Doctors, 4 Lab Orders, 3 Wards, 7 Beds, 3 Invoices, Queue Tokens and Vitals.',
      ipAddress: '127.0.0.1',
      userAgent: 'SeedScript/2.0',
    },
  });

  console.log('✨ Comprehensive Database Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
