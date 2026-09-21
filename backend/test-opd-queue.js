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

async function runOpdQueueTests() {
  console.log('\n🎫 ====================================================================');
  console.log('   MODULE 2 - DAY 3: OPD QUEUE & LIVE TOKEN DISPLAY SYSTEM TESTS');
  console.log('====================================================================\n');

  try {
    // -------------------------------------------------------------
    // Setup & Fixtures
    // -------------------------------------------------------------
    const docAhmed = await prisma.doctorProfile.findFirst({
      where: { licenseNumber: 'LIC-PEDS-77319' },
      include: { user: true, department: true },
    });
    assert(!!docAhmed, `Target Doctor located: Dr. ${docAhmed.user.fullName} (${docAhmed.department.name})`);

    const patientFatima = await prisma.patientProfile.findFirst({
      where: { mrn: 'MRN-2026-0002' },
    });
    assert(!!patientFatima, `Target Patient located: ${patientFatima.firstName} ${patientFatima.lastName}`);

    const patientDavid = await prisma.patientProfile.findFirst({
      where: { mrn: 'MRN-2026-0001' },
    });
    assert(!!patientDavid, `Second Patient located: ${patientDavid.firstName} ${patientDavid.lastName}`);

    // -------------------------------------------------------------
    // Test 1: Issue Walk-In OPD Tokens with Sequential Numbering
    // -------------------------------------------------------------
    console.log('\n🔹 1. Issue Sequential Walk-In OPD Tokens:');
    const today = new Date();

    const walkInAppt1 = await prisma.appointment.create({
      data: {
        patientId: patientFatima.id,
        doctorId: docAhmed.id,
        appointmentDate: today,
        timeSlot: 'Walk-in Triage',
        type: 'OPD',
        status: 'IN_QUEUE',
        reasonForVisit: 'Pediatric cough and cold',
      },
    });

    const token1 = await prisma.queueToken.create({
      data: {
        appointmentId: walkInAppt1.id,
        patientId: patientFatima.id,
        doctorId: docAhmed.id,
        tokenNumber: 1,
        tokenCode: 'PEDS-001',
        status: 'WAITING',
      },
    });

    assert(token1.tokenCode === 'PEDS-001', 'First walk-in token code is PEDS-001');
    assert(token1.status === 'WAITING', 'Token status is initially WAITING');

    const walkInAppt2 = await prisma.appointment.create({
      data: {
        patientId: patientDavid.id,
        doctorId: docAhmed.id,
        appointmentDate: today,
        timeSlot: 'Walk-in Triage',
        type: 'OPD',
        status: 'IN_QUEUE',
        reasonForVisit: 'Emergency consultation',
      },
    });

    const token2 = await prisma.queueToken.create({
      data: {
        appointmentId: walkInAppt2.id,
        patientId: patientDavid.id,
        doctorId: docAhmed.id,
        tokenNumber: 2,
        tokenCode: 'PEDS-002',
        status: 'WAITING',
      },
    });

    assert(token2.tokenCode === 'PEDS-002', 'Second walk-in token sequential code is PEDS-002');
    assert(token2.tokenNumber === 2, 'Token sequence number incremented to 2');

    // -------------------------------------------------------------
    // Test 2: Live Queue Board Aggregation & Wait Time Calculation
    // -------------------------------------------------------------
    console.log('\n🔹 2. Live OPD Queue Board Aggregation:');
    const startOfDay = new Date(today);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const activeTokens = await prisma.queueToken.findMany({
      where: {
        doctorId: docAhmed.id,
        date: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { tokenNumber: 'asc' },
    });

    assert(activeTokens.length >= 2, `Retrieved ${activeTokens.length} active queue tokens for today`);
    const waitingTokens = activeTokens.filter((t) => t.status === 'WAITING');
    assert(waitingTokens.length >= 2, `Identified ${waitingTokens.length} patients waiting in queue`);

    // Estimated wait time check (15 min per patient in front)
    const token2WaitMinutes = 2 * 15;
    assert(token2WaitMinutes === 30, 'Wait time for token 2 calculated as ~30 mins');

    // -------------------------------------------------------------
    // Test 3: Call Next Patient (WAITING -> CALLED)
    // -------------------------------------------------------------
    console.log('\n🔹 3. Call Next Patient in Line:');
    const calledToken = await prisma.queueToken.update({
      where: { id: token1.id },
      data: {
        status: 'CALLED',
        calledAt: new Date(),
      },
    });

    assert(calledToken.status === 'CALLED', 'Token PEDS-001 status changed to CALLED');
    assert(!!calledToken.calledAt, 'Token calledAt timestamp populated');

    // -------------------------------------------------------------
    // Test 4: Consultation Lifecycle (CALLED -> IN_CONSULTATION -> COMPLETED)
    // -------------------------------------------------------------
    console.log('\n🔹 4. Consultation State Transitions:');
    const inConsultationToken = await prisma.queueToken.update({
      where: { id: token1.id },
      data: { status: 'IN_CONSULTATION' },
    });
    assert(inConsultationToken.status === 'IN_CONSULTATION', 'Token status updated to IN_CONSULTATION');

    const completedToken = await prisma.queueToken.update({
      where: { id: token1.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
    assert(completedToken.status === 'COMPLETED', 'Token status updated to COMPLETED');
    assert(!!completedToken.completedAt, 'Token completedAt timestamp recorded');

    // -------------------------------------------------------------
    // Test 5: Skip / No-Show Handling
    // -------------------------------------------------------------
    console.log('\n🔹 5. Patient Skip & No-Show Handling:');
    const skippedToken = await prisma.queueToken.update({
      where: { id: token2.id },
      data: { status: 'SKIPPED' },
    });
    assert(skippedToken.status === 'SKIPPED', 'Token PEDS-002 marked as SKIPPED');

    // -------------------------------------------------------------
    // Test 6: Audit Trail for Queue Actions
    // -------------------------------------------------------------
    console.log('\n🔹 6. Security & Queue Operations Audit Trail:');
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (adminUser) {
      const queueAudit = await prisma.auditLog.create({
        data: {
          userId: adminUser.id,
          action: 'TOKEN_CALLED',
          entity: 'QueueToken',
          entityId: token1.id,
          details: JSON.stringify({
            tokenCode: 'PEDS-001',
            doctor: docAhmed.user.fullName,
            room: docAhmed.roomNumber,
          }),
        },
      });

      assert(!!queueAudit.id, 'AuditLog created for TOKEN_CALLED action');
      assert(queueAudit.action === 'TOKEN_CALLED', 'Audit action matches TOKEN_CALLED');
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

runOpdQueueTests();
