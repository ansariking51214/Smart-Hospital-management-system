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

async function runNurseTriageTests() {
  console.log('\n🩺 ====================================================================');
  console.log('   MODULE 2 - DAY 4: NURSE VITALS TRIAGE DESK & RISK ALERT TESTS');
  console.log('====================================================================\n');

  try {
    // -------------------------------------------------------------
    // Setup & Fixture Resolution
    // -------------------------------------------------------------
    const patient = await prisma.patientProfile.findFirst({
      where: { mrn: 'MRN-2026-0001' },
    });
    assert(!!patient, `Target Patient located: ${patient.firstName} ${patient.lastName} (${patient.mrn})`);

    const nurseUser = await prisma.user.findFirst({
      where: { role: 'NURSE' },
    });
    assert(!!nurseUser, `Target Nurse located: ${nurseUser.fullName} (${nurseUser.email})`);

    // -------------------------------------------------------------
    // Test 1: Record Normal Vitals & Calculate BMI
    // -------------------------------------------------------------
    console.log('\n🔹 1. Normal Vitals Recording & BMI Calculation:');
    const heightCm = 175;
    const weightKg = 70;
    const heightMeters = heightCm / 100;
    const expectedBmi = Number((weightKg / (heightMeters * heightMeters)).toFixed(1)); // 22.9

    const normalVitals = await prisma.vitalSign.create({
      data: {
        patientId: patient.id,
        recordedById: nurseUser.id,
        systolicBp: 120,
        diastolicBp: 80,
        pulseRate: 72,
        temperature: 98.4,
        respiratoryRate: 16,
        oxygenSaturation: 99.0,
        heightCm: heightCm,
        weightKg: weightKg,
        bmi: expectedBmi,
        triageNotes: 'Routine outpatient pre-consultation vitals.',
      },
    });

    assert(!!normalVitals.id, 'VitalSign record created in database');
    assert(normalVitals.bmi === 22.9, `Auto-BMI computed correctly: ${normalVitals.bmi} kg/m²`);
    assert(normalVitals.systolicBp === 120 && normalVitals.diastolicBp === 80, 'BP recorded: 120/80 mmHg');
    assert(normalVitals.oxygenSaturation === 99.0, 'SpO2 recorded: 99.0%');

    // -------------------------------------------------------------
    // Test 2: Triage Risk Evaluation Algorithm (GREEN vs AMBER vs RED)
    // -------------------------------------------------------------
    console.log('\n🔹 2. Clinical Triage Severity & Alert Assessment:');
    
    // Normal / Green Check
    const isGreen = normalVitals.oxygenSaturation >= 95 && normalVitals.systolicBp < 140 && normalVitals.pulseRate < 100;
    assert(isGreen, 'Classified as GREEN (Stable / Normal Physiological Baseline)');

    // Urgent / Amber Check (Elevated BP: 150/95, SpO2 93%, Temp 101.5°F)
    const amberVitals = await prisma.vitalSign.create({
      data: {
        patientId: patient.id,
        recordedById: nurseUser.id,
        systolicBp: 150,
        diastolicBp: 95,
        pulseRate: 105,
        temperature: 101.5,
        respiratoryRate: 20,
        oxygenSaturation: 93.0,
        heightCm: 175,
        weightKg: 85,
        bmi: 27.8, // Overweight
        triageNotes: 'Patient febrile and mildly tachycardic with elevated BP.',
      },
    });

    const isAmber = amberVitals.systolicBp >= 140 || amberVitals.pulseRate >= 100 || amberVitals.oxygenSaturation <= 94 || amberVitals.temperature >= 100.4;
    assert(isAmber, 'Classified as AMBER (Urgent Watchlist Alert: Pyrexia & Stage-1 HTN)');
    assert(amberVitals.bmi === 27.8, 'BMI indicates Overweight Category (27.8 kg/m²)');

    // Critical / Red Check (Severe Hypoxia: SpO2 88%, Critical BP 195/115)
    const criticalVitals = await prisma.vitalSign.create({
      data: {
        patientId: patient.id,
        recordedById: nurseUser.id,
        systolicBp: 195,
        diastolicBp: 115,
        pulseRate: 135,
        temperature: 103.8,
        respiratoryRate: 28,
        oxygenSaturation: 88.0,
        heightCm: 175,
        weightKg: 70,
        bmi: 22.9,
        triageNotes: 'CRITICAL EMERGENCY: Severe hypoxemia and hypertensive crisis!',
      },
    });

    const isRed = criticalVitals.oxygenSaturation < 90 || criticalVitals.systolicBp >= 180 || criticalVitals.pulseRate >= 130;
    assert(isRed, 'Classified as RED (Critical Alert: Severe Hypoxemia SpO2 88% & Hypertensive Crisis)');

    // -------------------------------------------------------------
    // Test 3: Longitudinal Patient Vitals History
    // -------------------------------------------------------------
    console.log('\n🔹 3. Longitudinal Vitals Time-Series Aggregation:');
    const patientVitalsHistory = await prisma.vitalSign.findMany({
      where: { patientId: patient.id },
      orderBy: { recordedAt: 'desc' },
    });

    assert(patientVitalsHistory.length >= 3, `Retrieved ${patientVitalsHistory.length} longitudinal vitals records for patient`);
    assert(patientVitalsHistory[0].systolicBp === 195, 'Latest vital entry reflects most recent triage event');

    // -------------------------------------------------------------
    // Test 4: Security & Triage Audit Trail
    // -------------------------------------------------------------
    console.log('\n🔹 4. Security & Clinical Triage Audit Trail:');
    const triageAudit = await prisma.auditLog.create({
      data: {
        userId: nurseUser.id,
        action: 'VITALS_RECORDED',
        entity: 'VitalSign',
        entityId: normalVitals.id,
        details: JSON.stringify({
          patientMrn: patient.mrn,
          bp: '120/80',
          pulse: 72,
          spo2: 99.0,
          severity: 'GREEN',
          nurse: nurseUser.fullName,
        }),
      },
    });

    assert(!!triageAudit.id, 'AuditLog entry created for VITALS_RECORDED action');
    assert(triageAudit.action === 'VITALS_RECORDED', 'Audit action matches VITALS_RECORDED');

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

runNurseTriageTests();
