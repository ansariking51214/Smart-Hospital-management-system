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

async function runMedicalHistoryTests() {
  console.log('\n🏥 ====================================================================');
  console.log('   MODULE 1 - DAY 5: PATIENT SEARCH & MEDICAL HISTORY / EMERGENCY TESTS');
  console.log('====================================================================\n');

  try {
    // -------------------------------------------------------------
    // Test 1: Multi-Criteria Patient Search Engine
    // -------------------------------------------------------------
    console.log('🔹 1. Multi-Criteria Patient Search Engine:');
    
    // Search by MRN prefix
    const searchByMrn = await prisma.patientProfile.findMany({
      where: { mrn: { contains: 'MRN-2026' } },
    });
    assert(searchByMrn.length >= 1, `Found ${searchByMrn.length} patient(s) matching MRN prefix 'MRN-2026'`);

    // Search by partial name
    const searchByName = await prisma.patientProfile.findMany({
      where: {
        OR: [
          { firstName: { contains: 'David' } },
          { lastName: { contains: 'Miller' } },
        ],
      },
    });
    assert(searchByName.length >= 1, `Found ${searchByName.length} patient(s) by name search ('David Miller')`);

    // Search by Blood Group
    const searchByBlood = await prisma.patientProfile.findMany({
      where: { bloodGroup: 'O+' },
    });
    assert(searchByBlood.length >= 1, `Filtered ${searchByBlood.length} patient(s) with Blood Group O+`);

    // -------------------------------------------------------------
    // Test 2: Longitudinal Medical Record & Clinical Timeline Aggregation
    // -------------------------------------------------------------
    console.log('\n🔹 2. Longitudinal Medical History & EHR Timeline Aggregation:');
    const patientWithHistory = await prisma.patientProfile.findFirst({
      where: { mrn: 'MRN-2026-0001' },
      include: {
        appointments: {
          include: {
            doctor: { include: { user: true, department: true } },
            consultationNote: true,
            vitalSign: true,
          },
        },
        vitalSigns: true,
        consultationNotes: true,
        prescriptions: true,
      },
    });

    assert(!!patientWithHistory, 'Retrieved patient medical dossier (MRN-2026-0001)');
    assert(patientWithHistory.appointments.length >= 1, `Patient has ${patientWithHistory.appointments.length} historical consultation(s)`);
    assert(patientWithHistory.vitalSigns.length >= 1, `Patient has ${patientWithHistory.vitalSigns.length} recorded vital sign log(s)`);
    assert(patientWithHistory.prescriptions.length >= 1, `Patient has ${patientWithHistory.prescriptions.length} issued e-prescription(s)`);

    // -------------------------------------------------------------
    // Test 3: Emergency Contact Management
    // -------------------------------------------------------------
    console.log('\n🔹 3. Emergency Contact & Next-of-Kin Management:');
    assert(!!patientWithHistory.emergencyContactName, `Emergency contact name present: ${patientWithHistory.emergencyContactName}`);
    assert(!!patientWithHistory.emergencyContactPhone, `Emergency contact phone present: ${patientWithHistory.emergencyContactPhone}`);
    assert(!!patientWithHistory.emergencyContactRelation, `Emergency relation verified: ${patientWithHistory.emergencyContactRelation}`);

    // Update emergency contact test
    const updatedContact = await prisma.patientProfile.update({
      where: { id: patientWithHistory.id },
      data: {
        emergencyContactName: 'Sarah Miller',
        emergencyContactPhone: '+1-555-0199',
        emergencyContactRelation: 'Spouse',
      },
    });
    assert(updatedContact.emergencyContactName === 'Sarah Miller', 'Successfully updated emergency contact name');
    assert(updatedContact.emergencyContactPhone === '+1-555-0199', 'Successfully updated emergency contact phone');

    // -------------------------------------------------------------
    // Test 4: Allergy & Chronic Disease Baseline Updates
    // -------------------------------------------------------------
    console.log('\n🔹 4. Allergy & Chronic Disease Registry Updates:');
    const updatedAllergies = await prisma.patientProfile.update({
      where: { id: patientWithHistory.id },
      data: {
        allergies: 'Penicillin, Latex, Shellfish',
        chronicConditions: 'Essential Hypertension, Stage 1',
      },
    });

    assert(updatedAllergies.allergies.includes('Latex'), 'Allergy registry successfully expanded');
    assert(updatedAllergies.chronicConditions.includes('Hypertension'), 'Chronic conditions registry updated');

    // -------------------------------------------------------------
    // Test 5: Audit Log Trail for Day 5 Actions
    // -------------------------------------------------------------
    console.log('\n🔹 5. Security & Medical Audit Trail Logging:');
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (adminUser) {
      const historyAudit = await prisma.auditLog.create({
        data: {
          userId: adminUser.id,
          action: 'MEDICAL_HISTORY_UPDATED',
          entity: 'PatientProfile',
          entityId: patientWithHistory.id,
          details: JSON.stringify({
            mrn: patientWithHistory.mrn,
            changes: ['allergies', 'emergency_contact'],
            performedBy: adminUser.email,
          }),
        },
      });
      assert(!!historyAudit.id, 'AuditLog created for medical history update event');
      assert(historyAudit.action === 'MEDICAL_HISTORY_UPDATED', 'Audit action matches MEDICAL_HISTORY_UPDATED');
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

runMedicalHistoryTests();
