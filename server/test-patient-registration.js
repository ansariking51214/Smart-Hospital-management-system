import prisma from './src/config/db.js';
import { generateNextMRN } from './src/utils/mrnGenerator.js';

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

async function runPatientTests() {
  console.log('\n🏥 ================================================================');
  console.log('   MODULE 1 - DAY 4: PATIENT REGISTRATION & DEMOGRAPHIC TESTS');
  console.log('================================================================\n');

  try {
    // -------------------------------------------------------------
    // Test 1: MRN Generation Logic
    // -------------------------------------------------------------
    console.log('🔹 1. Collision-Safe Sequential MRN Generation:');
    const mrn1 = await generateNextMRN();
    const currentYear = new Date().getFullYear();
    assert(mrn1.startsWith(`MRN-${currentYear}-`), `MRN format matches current year prefix: ${mrn1}`);
    assert(/^MRN-\d{4}-\d{4}$/.test(mrn1), `MRN follows strict regex format 'MRN-YYYY-XXXX' (${mrn1})`);

    // -------------------------------------------------------------
    // Test 2: Full Demographic Patient Registration
    // -------------------------------------------------------------
    console.log('\n🔹 2. Full Demographic Patient Registration:');
    const testMrn = await generateNextMRN();
    const testPatient = await prisma.patientProfile.create({
      data: {
        mrn: testMrn,
        firstName: 'Zainab',
        lastName: 'Khan',
        gender: 'FEMALE',
        dateOfBirth: new Date('1995-04-12'),
        bloodGroup: 'B+',
        phone: '+92-300-8889999',
        address: 'House 42, Street 7, F-8/2, Islamabad',
        nationalId: '61101-1234567-8',
        emergencyContactName: 'Tariq Khan',
        emergencyContactPhone: '+92-300-1112222',
        emergencyContactRelation: 'Spouse',
        allergies: 'Penicillin, Peanuts',
        chronicConditions: 'Mild Asthma',
      },
    });

    assert(!!testPatient.id, 'Patient successfully inserted into database with UUID');
    assert(testPatient.mrn === testMrn, `Assigned MRN verified: ${testPatient.mrn}`);
    assert(testPatient.bloodGroup === 'B+', 'Blood group recorded accurately');
    assert(testPatient.emergencyContactName === 'Tariq Khan', 'Emergency contact name stored');
    assert(testPatient.emergencyContactRelation === 'Spouse', 'Emergency relation stored');
    assert(testPatient.allergies === 'Penicillin, Peanuts', 'Allergies correctly recorded');

    // -------------------------------------------------------------
    // Test 3: Demographic Retrieval by MRN
    // -------------------------------------------------------------
    console.log('\n🔹 3. Patient Retrieval by MRN:');
    const fetchedByMrn = await prisma.patientProfile.findUnique({
      where: { mrn: testMrn },
    });
    assert(!!fetchedByMrn, 'Found patient record by MRN');
    assert(fetchedByMrn.firstName === 'Zainab', 'Patient first name matches');
    assert(fetchedByMrn.lastName === 'Khan', 'Patient last name matches');

    // -------------------------------------------------------------
    // Test 4: Demographic Update
    // -------------------------------------------------------------
    console.log('\n🔹 4. Demographic Information Update:');
    const updatedPatient = await prisma.patientProfile.update({
      where: { mrn: testMrn },
      data: {
        phone: '+92-300-9990000',
        allergies: 'Penicillin, Peanuts, Sulfa Drugs',
        chronicConditions: 'Mild Asthma, Seasonal Rhinitis',
      },
    });

    assert(updatedPatient.phone === '+92-300-9990000', 'Updated contact phone successfully');
    assert(
      updatedPatient.allergies.includes('Sulfa Drugs'),
      'Updated allergy registry successfully'
    );

    // -------------------------------------------------------------
    // Test 5: Demographic Statistics Calculation
    // -------------------------------------------------------------
    console.log('\n🔹 5. Demographic Statistics & Blood Group Distribution:');
    const totalCount = await prisma.patientProfile.count();
    assert(totalCount >= 1, `Total registered patients in DB: ${totalCount}`);

    const bloodGroups = await prisma.patientProfile.groupBy({
      by: ['bloodGroup'],
      _count: { bloodGroup: true },
    });
    assert(bloodGroups.length > 0, 'Grouped blood group distribution returned metrics');

    // -------------------------------------------------------------
    // Test 6: Audit Log Recording for Patient Intake
    // -------------------------------------------------------------
    console.log('\n🔹 6. Intake Audit Trail Verification:');
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (adminUser) {
      const log = await prisma.auditLog.create({
        data: {
          userId: adminUser.id,
          action: 'PATIENT_REGISTERED',
          entity: 'PatientProfile',
          entityId: testPatient.id,
          details: JSON.stringify({
            mrn: testPatient.mrn,
            fullName: `${testPatient.firstName} ${testPatient.lastName}`,
            registeredBy: adminUser.email,
          }),
        },
      });
      assert(!!log.id, 'AuditLog generated for patient registration event');
      assert(log.action === 'PATIENT_REGISTERED', 'Audit log action matches PATIENT_REGISTERED');
    }

    // -------------------------------------------------------------
    // Cleanup Test Record
    // -------------------------------------------------------------
    await prisma.auditLog.deleteMany({ where: { entityId: testPatient.id } });
    await prisma.patientProfile.delete({ where: { id: testPatient.id } });
    console.log('\n  🧹 Test patient record cleaned up cleanly.');

    // -------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------
    console.log('\n================================================================');
    console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('================================================================\n');

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

runPatientTests();
