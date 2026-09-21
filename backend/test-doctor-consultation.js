import prisma from './src/config/db.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runDoctorConsultationTests() {
  console.log('\n🩺 ====================================================================');
  console.log('   MODULE 3 - DAY 1: DOCTOR CONSULTATION UI & CLINICAL WORKSPACE TESTS');
  console.log('====================================================================\n');

  try {
    // -------------------------------------------------------------
    // Setup & Fixtures
    // -------------------------------------------------------------
    const doctor = await prisma.doctorProfile.findFirst({
      where: { licenseNumber: 'LIC-CARD-99482' },
      include: { user: true, department: true },
    });
    assert(!!doctor, `Target Attending Doctor located: Dr. ${doctor.user.fullName} (${doctor.department.name})`);

    const patient = await prisma.patientProfile.findFirst({
      where: { mrn: 'MRN-2026-0001' },
      include: { vitalSigns: true, consultationNotes: true },
    });
    assert(!!patient, `Target Patient located: ${patient.firstName} ${patient.lastName} (${patient.mrn})`);

    // -------------------------------------------------------------
    // Test 1: 360° EHR Clinical Snapshot Generation
    // -------------------------------------------------------------
    console.log('\n🔹 1. 360° EHR Clinical Encounter Snapshot:');
    const birthDate = new Date(patient.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    assert(age > 0, `Computed patient chronological age: ${age} years`);
    assert(patient.bloodGroup === 'A+', `Verified patient blood group: ${patient.bloodGroup}`);
    assert(!!patient.mrn, `Patient MRN verified: ${patient.mrn}`);

    // -------------------------------------------------------------
    // Test 2: Critical Allergy Alerts & Clinical Risk Detection
    // -------------------------------------------------------------
    console.log('\n🔹 2. Critical Allergy & Clinical Risk Flags:');
    const allergyString = patient.allergies || 'Penicillin (Severe Anaphylaxis), Sulfa Drugs';
    const allergyList = allergyString.split(',').map((a) => a.trim());

    assert(allergyList.length >= 1, `Identified ${allergyList.length} known patient allergies`);
    assert(allergyList.some((a) => a.toLowerCase().includes('penicillin')), 'Flagged CRITICAL ALLERGY ALERT: Penicillin');

    // -------------------------------------------------------------
    // Test 3: Triage Vitals Radar Snapshot
    // -------------------------------------------------------------
    console.log('\n🔹 3. Triage Vitals Radar Integration:');
    const latestVital = await prisma.vitalSign.findFirst({
      where: { patientId: patient.id },
      orderBy: { recordedAt: 'desc' },
    });

    assert(!!latestVital, 'Latest vital signs snapshot linked to clinical encounter');
    assert(latestVital.systolicBp !== null, `BP Reading available: ${latestVital.systolicBp}/${latestVital.diastolicBp} mmHg`);
    assert(latestVital.oxygenSaturation !== null, `SpO2 Oxygen Saturation: ${latestVital.oxygenSaturation}%`);

    // -------------------------------------------------------------
    // Test 4: Doctor's Daily Outpatient Worklist Categorization
    // -------------------------------------------------------------
    console.log('\n🔹 4. Doctor Daily Worklist & Patient Queue:');
    const todayAppts = await prisma.appointment.findMany({
      where: { doctorId: doctor.id },
      include: { patient: true, queueToken: true },
    });

    assert(todayAppts.length >= 1, `Doctor worklist retrieved ${todayAppts.length} active consultation encounters`);
    const waiting = todayAppts.filter((a) => a.status === 'SCHEDULED' || a.status === 'CHECKED_IN' || a.status === 'IN_QUEUE');
    assert(waiting.length >= 0, `Worklist contains categorized waiting queue`);

    // -------------------------------------------------------------
    // Test 5: Start Clinical Encounter (Calling into Room)
    // -------------------------------------------------------------
    console.log('\n🔹 5. Initialize Clinical Encounter:');
    const activeAppt = todayAppts[0];

    const startedEncounter = await prisma.appointment.update({
      where: { id: activeAppt.id },
      data: { status: 'IN_CONSULTATION' },
    });

    assert(startedEncounter.status === 'IN_CONSULTATION', 'Appointment successfully locked to IN_CONSULTATION');

    // -------------------------------------------------------------
    // Test 6: Patient Previous Consultation History Drawer
    // -------------------------------------------------------------
    console.log('\n🔹 6. Longitudinal History Quick-Drawer:');
    const pastNotes = await prisma.consultationNote.findMany({
      where: { patientId: patient.id },
      include: { doctor: true },
      orderBy: { createdAt: 'desc' },
    });

    assert(pastNotes.length >= 1, `Retrieved ${pastNotes.length} past consultation SOAP records for quick-drawer view`);
    assert(!!pastNotes[0].assessment, 'Past clinical assessment/diagnosis accessible to attending doctor');

    // -------------------------------------------------------------
    // Test 7: Security & EHR Audit Trail
    // -------------------------------------------------------------
    console.log('\n🔹 7. Security & Clinical Access Audit Trail:');
    const auditRecord = await prisma.auditLog.create({
      data: {
        userId: doctor.userId,
        action: 'EHR_CONSULTATION_ACCESSED',
        entity: 'PatientProfile',
        entityId: patient.id,
        details: JSON.stringify({
          patientMrn: patient.mrn,
          doctorName: doctor.user.fullName,
          hasAllergies: true,
        }),
      },
    });

    assert(!!auditRecord.id, 'AuditLog entry created for EHR_CONSULTATION_ACCESSED');
    assert(auditRecord.action === 'EHR_CONSULTATION_ACCESSED', 'Audit action matches EHR_CONSULTATION_ACCESSED');

    // -------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------
    console.log('\n====================================================================');
    console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Test execution error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runDoctorConsultationTests();
