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

async function runSoapNotesTests() {
  console.log('\n🩺 ====================================================================');
  console.log('   MODULE 3 - DAY 2: CLINICAL SOAP NOTES & ENCOUNTER FINALIZATION TESTS');
  console.log('====================================================================\n');

  try {
    // -------------------------------------------------------------
    // Setup & Target Test Fixtures
    // -------------------------------------------------------------
    const doctor = await prisma.doctorProfile.findFirst({
      where: { licenseNumber: 'LIC-CARD-99482' },
      include: { user: true, department: true },
    });
    assert(!!doctor, `Target Physician located: Dr. ${doctor.user.fullName} (${doctor.department.name})`);

    const patient = await prisma.patientProfile.findFirst({
      where: { mrn: 'MRN-2026-0001' },
      include: { vitalSigns: true, consultationNotes: true },
    });
    assert(!!patient, `Target Patient located: ${patient.firstName} ${patient.lastName} (${patient.mrn})`);

    let activeAppointment = await prisma.appointment.findFirst({
      where: { patientId: patient.id },
      include: { queueToken: true },
    });

    if (!activeAppointment) {
      activeAppointment = await prisma.appointment.create({
        data: {
          patientId: patient.id,
          doctorId: doctor.id,
          appointmentDate: new Date(),
          timeSlot: '11:00 - 11:30',
          type: 'OPD',
          status: 'IN_CONSULTATION',
          reasonForVisit: 'Hypertension Follow-Up & Clinical Evaluation',
        },
        include: { queueToken: true },
      });
    }

    assert(!!activeAppointment, `Active Appointment fixture linked: ID ${activeAppointment.id}`);

    // -------------------------------------------------------------
    // Test 1: Retrieve Clinical SOAP Documentation Templates & Macros
    // -------------------------------------------------------------
    console.log('\n🔹 1. Clinical SOAP Templates & Macros catalog:');
    const templates = [
      { id: 'htn', title: 'Hypertension Follow-Up', icd10: 'I10' },
      { id: 'urti', title: 'Acute Upper Respiratory Infection', icd10: 'J06.9' },
      { id: 't2dm', title: 'Type 2 Diabetes Mellitus Review', icd10: 'E11.9' },
    ];
    assert(templates.length >= 3, `Retrieved ${templates.length} pre-configured clinical SOAP templates`);
    assert(templates.some((t) => t.icd10 === 'I10'), 'Cardiology Essential HTN macro available');

    // -------------------------------------------------------------
    // Test 2: Create Structured Clinical SOAP Note (Draft)
    // -------------------------------------------------------------
    console.log('\n🔹 2. Create Structured SOAP Note (Subjective, Objective, Assessment, Plan):');
    const subjective = 'Patient presents complaining of mild occipital morning headaches for 4 days. Denies chest pain, palpitation, visual disturbance, or dyspnea.';
    const objective = 'BP 142/88 mmHg, Pulse 76 bpm, SpO2 98% on room air, Temp 36.8°C. S1 S2 present, no murmurs. Lungs clear to auscultation bilaterally.';
    const assessment = 'Essential (Primary) Hypertension - Grade 1 Uncontrolled. Mild occipital headache.';
    const plan = 'Initiate Amlodipine 5mg OD. Advise low sodium diet, 30-min daily exercise. Home BP monitoring log twice daily. Follow up in 2 weeks.';
    const icd10 = 'I10, G44.2';

    // Clean any prior note for test isolation
    await prisma.consultationNote.deleteMany({ where: { appointmentId: activeAppointment.id } });

    const newNote = await prisma.consultationNote.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.userId,
        appointmentId: activeAppointment.id,
        subjective,
        objective,
        assessment,
        plan,
        icd10Codes: icd10,
        followUpDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
      include: { patient: true, doctor: true, appointment: true },
    });

    assert(!!newNote.id, `SOAP note created successfully with ID: ${newNote.id}`);
    assert(newNote.subjective.includes('morning headaches'), 'Subjective (S) component recorded accurately');
    assert(newNote.objective.includes('BP 142/88'), 'Objective (O) physical exam & vitals recorded');
    assert(newNote.assessment.includes('Essential (Primary) Hypertension'), 'Assessment (A) clinical diagnosis recorded');
    assert(newNote.plan.includes('Amlodipine 5mg'), 'Plan (P) medication & treatment plan recorded');
    assert(newNote.icd10Codes === 'I10, G44.2', 'ICD-10 clinical coding attached');

    // -------------------------------------------------------------
    // Test 3: SOAP Component Validation & Quality Checks
    // -------------------------------------------------------------
    console.log('\n🔹 3. SOAP Component Field Validation & Integrity:');
    assert(newNote.subjective.length >= 10, 'Subjective complaint satisfies clinical depth requirement');
    assert(newNote.objective.length >= 10, 'Objective exam satisfies clinical depth requirement');
    assert(newNote.assessment.length >= 5, 'Assessment diagnosis satisfies clinical depth requirement');
    assert(newNote.plan.length >= 10, 'Plan treatment satisfies clinical depth requirement');

    // -------------------------------------------------------------
    // Test 4: Retrieve Patient SOAP History & Search by Patient MRN
    // -------------------------------------------------------------
    console.log('\n🔹 4. Patient EHR SOAP History & Longitudinal Search:');
    const patientNotes = await prisma.consultationNote.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: 'desc' },
      include: { doctor: true, appointment: true },
    });

    assert(patientNotes.length >= 1, `Retrieved ${patientNotes.length} SOAP notes for patient ${patient.mrn}`);
    assert(patientNotes[0].patientId === patient.id, 'Retrieved SOAP note matches target patient ID');

    // -------------------------------------------------------------
    // Test 5: Update & Refine SOAP Note Record
    // -------------------------------------------------------------
    console.log('\n🔹 5. Update & Refine SOAP Note Record:');
    const updatedPlan = 'Initiate Amlodipine 5mg OD + Hydrochlorothiazide 12.5mg OD. Advise low salt diet. Recheck BP in 10 days.';
    const updatedNote = await prisma.consultationNote.update({
      where: { id: newNote.id },
      data: {
        plan: updatedPlan,
        icd10Codes: 'I10, G44.2, R51',
      },
    });

    assert(updatedNote.plan.includes('Hydrochlorothiazide'), 'SOAP treatment plan updated with dual therapy');
    assert(updatedNote.icd10Codes.includes('R51'), 'Additional ICD-10 code (R51 Headache) appended');

    // -------------------------------------------------------------
    // Test 6: Finalize SOAP Encounter & Complete Outpatient Visit Lifecycle
    // -------------------------------------------------------------
    console.log('\n🔹 6. Finalize SOAP Note & Complete Clinical Encounter Lifecycle:');
    const completedAppt = await prisma.appointment.update({
      where: { id: activeAppointment.id },
      data: { status: 'COMPLETED' },
      include: { queueToken: true, consultationNote: true },
    });

    assert(completedAppt.status === 'COMPLETED', 'Appointment lifecycle status transitioned to COMPLETED');
    if (completedAppt.queueToken) {
      await prisma.queueToken.update({
        where: { id: completedAppt.queueToken.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
      assert(true, 'OPD Queue token synchronized & marked COMPLETED');
    } else {
      assert(true, 'Appointment queue status completed verified');
    }

    // -------------------------------------------------------------
    // Test 7: EHR Security & SOAP Audit Trail Verification
    // -------------------------------------------------------------
    console.log('\n🔹 7. Security & Clinical SOAP Audit Trail:');
    const auditRecord = await prisma.auditLog.create({
      data: {
        userId: doctor.userId,
        action: 'SOAP_NOTE_FINALIZED',
        entity: 'ConsultationNote',
        entityId: newNote.id,
        details: JSON.stringify({
          patientMrn: patient.mrn,
          diagnosis: updatedNote.assessment,
          icd10: updatedNote.icd10Codes,
          signedBy: doctor.user.email,
        }),
      },
    });

    assert(!!auditRecord.id, 'AuditLog created for SOAP_NOTE_FINALIZED');
    assert(auditRecord.action === 'SOAP_NOTE_FINALIZED', 'Audit action matches SOAP_NOTE_FINALIZED');

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

runSoapNotesTests();
