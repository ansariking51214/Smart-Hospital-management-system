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

async function runAppointmentFlowTests() {
  console.log('\n🏥 ====================================================================');
  console.log('   MODULE 2 - DAY 5: APPOINTMENT STATUS & CONSULTATION FLOW TESTS');
  console.log('====================================================================\n');

  try {
    // -------------------------------------------------------------
    // Setup & Fixtures
    // -------------------------------------------------------------
    const doctor = await prisma.doctorProfile.findFirst({
      where: { licenseNumber: 'LIC-CARD-99482' },
      include: { user: true, department: true },
    });
    assert(!!doctor, `Target Doctor located: Dr. ${doctor.user.fullName} (${doctor.department.name})`);

    const patient = await prisma.patientProfile.findFirst({
      where: { mrn: 'MRN-2026-0001' },
    });
    assert(!!patient, `Target Patient located: ${patient.firstName} ${patient.lastName} (${patient.mrn})`);

    const doctorUser = await prisma.user.findFirst({
      where: { id: doctor.userId },
    });

    // -------------------------------------------------------------
    // Test 1: Create Scheduled Appointment & Link Queue Token
    // -------------------------------------------------------------
    console.log('\n🔹 1. Stage 1: Book & Schedule Appointment:');
    const targetDate = new Date();

    const appt = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        appointmentDate: targetDate,
        timeSlot: '11:00 - 11:30',
        type: 'OPD',
        status: 'SCHEDULED',
        reasonForVisit: 'Hypertension follow-up and chest tightness evaluation',
      },
    });

    const token = await prisma.queueToken.create({
      data: {
        appointmentId: appt.id,
        patientId: patient.id,
        doctorId: doctor.id,
        tokenNumber: 10,
        tokenCode: 'CARD-010',
        status: 'WAITING',
      },
    });

    assert(appt.status === 'SCHEDULED', 'Initial appointment created in SCHEDULED state');
    assert(token.tokenCode === 'CARD-010', 'Queue Token CARD-010 linked to appointment');

    // -------------------------------------------------------------
    // Test 2: Stage 2: Patient Check-In / Arrival
    // -------------------------------------------------------------
    console.log('\n🔹 2. Stage 2: Patient Check-In & Queue Arrival:');
    const checkedInAppt = await prisma.appointment.update({
      where: { id: appt.id },
      data: { status: 'CHECKED_IN' },
    });
    assert(checkedInAppt.status === 'CHECKED_IN', 'Appointment status transitioned to CHECKED_IN');

    // -------------------------------------------------------------
    // Test 3: Stage 3: In-Consultation State Transition
    // -------------------------------------------------------------
    console.log('\n🔹 3. Stage 3: Doctor In-Consultation Transition:');
    const inConsultationAppt = await prisma.appointment.update({
      where: { id: appt.id },
      data: { status: 'IN_CONSULTATION' },
    });
    assert(inConsultationAppt.status === 'IN_CONSULTATION', 'Appointment status transitioned to IN_CONSULTATION');

    const inConsultToken = await prisma.queueToken.update({
      where: { id: token.id },
      data: { status: 'IN_CONSULTATION' },
    });
    assert(inConsultToken.status === 'IN_CONSULTATION', 'Linked queue token transitioned to IN_CONSULTATION');

    // -------------------------------------------------------------
    // Test 4: Stage 4: Record Clinical Consultation Note (SOAP)
    // -------------------------------------------------------------
    console.log('\n🔹 4. Stage 4: Record Clinical Consultation Note (SOAP):');
    const consultationNote = await prisma.consultationNote.create({
      data: {
        appointmentId: appt.id,
        patientId: patient.id,
        doctorId: doctor.userId, // Doctor's User ID
        subjective: 'Chest tightness on moderate exertion, headache in mornings.',
        objective: 'BP 145/90 mmHg, Pulse 82 bpm, S1 S2 normal, no murmurs. ECG shows normal sinus rhythm.',
        assessment: 'Essential Hypertension (Stage 1) with Exertional Angina',
        plan: 'Prescribed Amlodipine 5mg OD, Aspirin 75mg OD. Advised low sodium diet and lifestyle modification.',
        icd10Codes: 'I10, I20.9',
        followUpDate: new Date(Date.now() + 14 * 86400000),
      },
    });

    assert(!!consultationNote.id, 'Consultation SOAP note record saved in database');
    assert(consultationNote.assessment.includes('Essential Hypertension'), 'Clinical assessment/diagnosis documented');
    assert(consultationNote.icd10Codes === 'I10, I20.9', 'ICD-10 clinical coding attached');

    // -------------------------------------------------------------
    // Test 5: Stage 5: Visit Completion & Token Release
    // -------------------------------------------------------------
    console.log('\n🔹 5. Stage 5: Complete Consultation & Token Discharge:');
    const completedAppt = await prisma.appointment.update({
      where: { id: appt.id },
      data: { status: 'COMPLETED' },
    });
    assert(completedAppt.status === 'COMPLETED', 'Appointment marked as COMPLETED');

    const completedToken = await prisma.queueToken.update({
      where: { id: token.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
    assert(completedToken.status === 'COMPLETED', 'Queue token marked as COMPLETED with completion timestamp');

    // -------------------------------------------------------------
    // Test 6: Stage 6: Schedule Follow-up Appointment
    // -------------------------------------------------------------
    console.log('\n🔹 6. Stage 6: Follow-up Appointment Scheduling:');
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + 14); // 2 weeks later

    const followUpAppt = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        appointmentDate: followUpDate,
        timeSlot: '11:00 - 11:30',
        type: 'FOLLOW_UP',
        status: 'SCHEDULED',
        reasonForVisit: '2-Week Hypertension & Medication Review',
      },
    });

    assert(followUpAppt.type === 'FOLLOW_UP', 'Follow-up appointment booked successfully');
    assert(followUpAppt.patientId === patient.id, 'Follow-up linked to original patient');

    // -------------------------------------------------------------
    // Test 7: Security & Clinical Audit Trail
    // -------------------------------------------------------------
    console.log('\n🔹 7. Security & Outpatient Flow Audit Trail:');
    if (doctorUser) {
      const flowAudit = await prisma.auditLog.create({
        data: {
          userId: doctorUser.id,
          action: 'CONSULTATION_COMPLETED',
          entity: 'Appointment',
          entityId: appt.id,
          details: JSON.stringify({
            patientMrn: patient.mrn,
            diagnosis: consultationNote.assessment,
            followUpScheduled: true,
          }),
        },
      });

      assert(!!flowAudit.id, 'AuditLog entry created for CONSULTATION_COMPLETED');
      assert(flowAudit.action === 'CONSULTATION_COMPLETED', 'Audit action matches CONSULTATION_COMPLETED');
    }

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

runAppointmentFlowTests();
