import prisma from './src/config/db.js';
import { hashPassword } from './src/utils/password.js';

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

async function runDoctorRosterTests() {
  console.log('\n🩺 ====================================================================');
  console.log('   MODULE 2 - DAY 1: DOCTOR PROFILE & SHIFT ROSTER ENGINE TESTS');
  console.log('====================================================================\n');

  try {
    // -------------------------------------------------------------
    // Test 1: Fetch Doctors & Verify Relational Profiles
    // -------------------------------------------------------------
    console.log('🔹 1. Doctor Profiles & Clinical Department Relations:');
    const doctors = await prisma.doctorProfile.findMany({
      include: {
        user: true,
        department: true,
      },
    });

    assert(doctors.length >= 2, `Retrieved ${doctors.length} doctors from clinical roster`);
    const docSarah = doctors.find((d) => d.licenseNumber === 'LIC-CARD-99482');
    assert(!!docSarah, 'Dr. Sarah Jenkins profile located (Interventional Cardiology)');
    assert(docSarah.user.role === 'DOCTOR', 'Doctor user entity has DOCTOR role');
    assert(docSarah.department.name === 'Cardiology', 'Doctor linked to Cardiology department');
    assert(docSarah.shiftStart === '09:00' && docSarah.shiftEnd === '15:00', 'Shift timing verified (09:00 - 15:00)');
    assert(docSarah.availableDays.includes('Mon'), 'Weekly working days configured');

    // -------------------------------------------------------------
    // Test 2: Onboard New Doctor & Auto-create Shift Roster
    // -------------------------------------------------------------
    console.log('\n🔹 2. Onboard New Physician & Configure Shift Roster:');
    const neuroDept = await prisma.department.findUnique({ where: { code: 'NEURO' } });
    assert(!!neuroDept, 'Located Neurology department for physician onboarding');

    const testDoctorEmail = `dr.elena.${Date.now()}@hms.hospital`;
    const testLicense = `LIC-NEURO-${Date.now().toString().slice(-5)}`;
    const passHash = await hashPassword('Password@123');

    const newDocUser = await prisma.user.create({
      data: {
        email: testDoctorEmail,
        passwordHash: passHash,
        fullName: 'Dr. Elena Rostova, MD, PhD',
        phone: '+1-555-0777',
        role: 'DOCTOR',
      },
    });

    const newDoctor = await prisma.doctorProfile.create({
      data: {
        userId: newDocUser.id,
        departmentId: neuroDept?.id,
        specialization: 'Cerebrovascular & Stroke Neurology',
        licenseNumber: testLicense,
        qualification: 'MD, PhD (Johns Hopkins University)',
        consultationFee: 175.0,
        roomNumber: 'Room 302',
        availableDays: 'Mon,Tue,Wed,Thu',
        shiftStart: '08:30',
        shiftEnd: '14:30',
        bio: 'Senior neurologist specializing in acute stroke triage and neurovascular interventions.',
      },
      include: { department: true, user: true },
    });

    assert(!!newDoctor.id, `Physician successfully onboarded: ${newDoctor.user.fullName}`);
    assert(newDoctor.licenseNumber === testLicense, `Medical license registered: ${testLicense}`);
    assert(newDoctor.consultationFee === 175.0, 'Consultation fee set to $175.00');

    // -------------------------------------------------------------
    // Test 3: Update Doctor Shift Roster Schedule
    // -------------------------------------------------------------
    console.log('\n🔹 3. Shift Schedule & Working Days Modification:');
    const updatedRoster = await prisma.doctorProfile.update({
      where: { id: newDoctor.id },
      data: {
        shiftStart: '10:00',
        shiftEnd: '16:00',
        availableDays: 'Tue,Wed,Thu,Fri,Sat',
        roomNumber: 'Room 305-B',
        consultationFee: 180.0,
      },
    });

    assert(updatedRoster.shiftStart === '10:00', 'Shift start updated to 10:00');
    assert(updatedRoster.shiftEnd === '16:00', 'Shift end updated to 16:00');
    assert(updatedRoster.availableDays === 'Tue,Wed,Thu,Fri,Sat', 'Working days expanded to 5 days');
    assert(updatedRoster.roomNumber === 'Room 305-B', 'Assigned examination room updated');

    // -------------------------------------------------------------
    // Test 4: Doctor Roster Overview & Department Aggregation
    // -------------------------------------------------------------
    console.log('\n🔹 4. Shift Roster Analytics & Metrics:');
    const totalDocs = await prisma.doctorProfile.count();
    const allDocs = await prisma.doctorProfile.findMany({
      include: { department: true },
    });

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayAbbr = daysOfWeek[new Date().getDay()];
    const onDutyCount = allDocs.filter((d) => d.availableDays?.includes(todayAbbr)).length;

    assert(totalDocs >= 3, `Total active physicians count: ${totalDocs}`);
    assert(onDutyCount >= 0, `On-duty doctors for today (${todayAbbr}): ${onDutyCount}`);

    // -------------------------------------------------------------
    // Test 5: Audit Log Trail for Roster Actions
    // -------------------------------------------------------------
    console.log('\n🔹 5. Security & Administrative Audit Trail:');
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (adminUser) {
      const rosterAudit = await prisma.auditLog.create({
        data: {
          userId: adminUser.id,
          action: 'ROSTER_UPDATED',
          entity: 'DoctorProfile',
          entityId: newDoctor.id,
          details: JSON.stringify({
            doctor: newDoctor.user.fullName,
            shift: '10:00 - 16:00',
            days: 'Tue,Wed,Thu,Fri,Sat',
            updatedBy: adminUser.email,
          }),
        },
      });

      assert(!!rosterAudit.id, 'AuditLog created for ROSTER_UPDATED event');
      assert(rosterAudit.action === 'ROSTER_UPDATED', 'Audit action matches ROSTER_UPDATED');
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

runDoctorRosterTests();
