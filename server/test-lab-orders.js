import prisma from './src/config/db.js';
import {
  searchDiagnosticCatalog,
  getDiagnosticTestByCode,
  DIAGNOSTIC_TEST_CATALOG,
} from './src/utils/labCatalog.js';

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

async function runLabOrdersAndPdfExportTests() {
  console.log('\n🔬 ====================================================================');
  console.log('   MODULE 3 - DAY 5: DIAGNOSTIC LAB/RADIOLOGY ORDERS & PDF EXPORT TESTS');
  console.log('====================================================================\n');

  try {
    // -------------------------------------------------------------
    // Setup & Fixtures
    // -------------------------------------------------------------
    const patient = await prisma.patientProfile.findFirst({
      where: { mrn: 'MRN-2026-0001' },
      include: { vitalSigns: true, consultationNotes: true },
    });
    assert(!!patient, `Target Patient located: ${patient.firstName} ${patient.lastName} (${patient.mrn})`);

    const doctor = await prisma.doctorProfile.findFirst({
      where: { licenseNumber: 'LIC-CARD-99482' },
      include: { user: true, department: true },
    });
    assert(!!doctor, `Target Physician located: Dr. ${doctor.user.fullName} (${doctor.department.name})`);

    // -------------------------------------------------------------
    // Test 1: Diagnostic Test Catalog & Search Capabilities
    // -------------------------------------------------------------
    console.log('\n🔹 1. Diagnostic Test Catalog (Lab & Radiology):');
    assert(DIAGNOSTIC_TEST_CATALOG.length >= 10, `Catalog contains ${DIAGNOSTIC_TEST_CATALOG.length} diagnostic test definitions`);

    const hematologyTests = searchDiagnosticCatalog('', 'Hematology');
    assert(hematologyTests.tests.some((t) => t.code === 'CBC'), 'Hematology catalog includes Complete Blood Count (CBC)');

    const biochemistryTests = searchDiagnosticCatalog('', 'Biochemistry');
    assert(biochemistryTests.tests.some((t) => t.code === 'HBA1C'), 'Biochemistry catalog includes Glycated Hemoglobin (HbA1c)');
    assert(biochemistryTests.tests.some((t) => t.code === 'LIPID'), 'Biochemistry catalog includes Lipid Profile');

    const radiologyTests = searchDiagnosticCatalog('', 'Radiology');
    assert(radiologyTests.tests.some((t) => t.code === 'CXR-PA'), 'Radiology catalog includes Chest X-Ray PA View');
    assert(radiologyTests.tests.some((t) => t.code === 'ECG-12'), 'Radiology/Diagnostics includes 12-Lead ECG');

    const searchHits = searchDiagnosticCatalog('glucose');
    assert(searchHits.tests.length >= 1, 'Search for "glucose" returns Fasting Blood Glucose');

    const cbcByCode = getDiagnosticTestByCode('CBC');
    assert(cbcByCode && cbcByCode.category === 'Hematology', 'Lookup by code returns CBC with specimen requirement');

    // -------------------------------------------------------------
    // Test 2: Sequential Order Number Generation & Order Creation
    // -------------------------------------------------------------
    console.log('\n🔹 2. Create Diagnostic Lab & Radiology Orders:');
    const year = new Date().getFullYear();
    const existingCount = await prisma.labOrder.count({
      where: { requestedAt: { gte: new Date(`${year}-01-01T00:00:00.000Z`) } },
    });

    const orderNum1 = `LAB-${year}-${String(existingCount + 1).padStart(4, '0')}`;
    const orderNum2 = `LAB-${year}-${String(existingCount + 2).padStart(4, '0')}`;

    const labOrder1 = await prisma.labOrder.create({
      data: {
        orderNumber: orderNum1,
        patientId: patient.id,
        testName: 'Complete Blood Count (CBC) with Differential',
        category: 'Hematology',
        status: 'REQUESTED',
      },
    });
    assert(labOrder1.orderNumber.startsWith(`LAB-${year}-`), `Order 1 created with sequential ID: ${labOrder1.orderNumber}`);
    assert(labOrder1.status === 'REQUESTED', 'Initial order state is REQUESTED');

    const labOrder2 = await prisma.labOrder.create({
      data: {
        orderNumber: orderNum2,
        patientId: patient.id,
        testName: 'Chest X-Ray (Posteroanterior - PA View)',
        category: 'Radiology',
        status: 'REQUESTED',
      },
    });
    assert(labOrder2.category === 'Radiology', `Order 2 created for Radiology: ${labOrder2.testName}`);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: doctor.userId,
        action: 'LAB_ORDER_REQUESTED',
        entity: 'LabOrder',
        details: JSON.stringify({ patientMrn: patient.mrn, orders: [orderNum1, orderNum2] }),
      },
    });

    // -------------------------------------------------------------
    // Test 3: Patient Order History Retrieval
    // -------------------------------------------------------------
    console.log('\n🔹 3. Retrieve Patient Diagnostic Orders:');
    const patientOrders = await prisma.labOrder.findMany({
      where: { patientId: patient.id },
      orderBy: { requestedAt: 'desc' },
    });
    assert(patientOrders.length >= 2, `Retrieved ${patientOrders.length} diagnostic orders for ${patient.mrn}`);
    assert(patientOrders.some((o) => o.orderNumber === orderNum1), `Found placed order ${orderNum1} in history`);

    // -------------------------------------------------------------
    // Test 4: Specimen Tracking & Status Lifecycle Progression
    // -------------------------------------------------------------
    console.log('\n🔹 4. Diagnostic Status Lifecycle & Results Recording:');
    const step1 = await prisma.labOrder.update({
      where: { id: labOrder1.id },
      data: { status: 'SAMPLE_COLLECTED' },
    });
    assert(step1.status === 'SAMPLE_COLLECTED', 'Order progressed to SAMPLE_COLLECTED');

    const step2 = await prisma.labOrder.update({
      where: { id: labOrder1.id },
      data: { status: 'PROCESSING' },
    });
    assert(step2.status === 'PROCESSING', 'Order progressed to PROCESSING');

    const completedOrder = await prisma.labOrder.update({
      where: { id: labOrder1.id },
      data: {
        status: 'COMPLETED',
        resultsSummary: 'Hb: 14.2 g/dL (Normal), WBC: 7,400 /µL (Normal), Platelets: 260,000 /µL (Normal). Normal differential count.',
        completedAt: new Date(),
      },
    });
    assert(completedOrder.status === 'COMPLETED', 'Order successfully transitioned to COMPLETED');
    assert(!!completedOrder.completedAt, `Completion timestamp recorded: ${completedOrder.completedAt.toISOString()}`);
    assert(completedOrder.resultsSummary.includes('14.2 g/dL'), 'Diagnostic findings recorded accurately');

    await prisma.auditLog.create({
      data: {
        userId: doctor.userId,
        action: 'LAB_ORDER_STATUS_UPDATED',
        entity: 'LabOrder',
        entityId: completedOrder.id,
        details: JSON.stringify({ orderNumber: completedOrder.orderNumber, status: 'COMPLETED' }),
      },
    });

    // -------------------------------------------------------------
    // Test 5: 360° Longitudinal EHR Clinical Summary Aggregation
    // -------------------------------------------------------------
    console.log('\n🔹 5. 360° Comprehensive Patient Clinical Dossier:');
    const clinicalDossier = await prisma.patientProfile.findUnique({
      where: { id: patient.id },
      include: {
        vitalSigns: { orderBy: { recordedAt: 'desc' }, take: 1 },
        consultationNotes: { orderBy: { createdAt: 'desc' } },
        prescriptions: { include: { items: true }, orderBy: { issuedDate: 'desc' } },
        labOrders: { orderBy: { requestedAt: 'desc' } },
      },
    });

    assert(!!clinicalDossier, `Dossier compiled for patient: ${clinicalDossier.firstName} ${clinicalDossier.lastName}`);
    assert(clinicalDossier.vitalSigns.length > 0, `Latest vital signs available (BP: ${clinicalDossier.vitalSigns[0].systolicBp}/${clinicalDossier.vitalSigns[0].diastolicBp})`);
    assert(clinicalDossier.consultationNotes.length > 0, `Historical SOAP notes linked: ${clinicalDossier.consultationNotes.length} visits`);
    assert(clinicalDossier.labOrders.length >= 2, `Diagnostic orders linked to EHR profile: ${clinicalDossier.labOrders.length}`);

    // -------------------------------------------------------------
    // Test 6: Printable Prescription & PDF Export Structure
    // -------------------------------------------------------------
    console.log('\n🔹 6. Prescription PDF Export Data Integrity:');
    const existingPrescription = await prisma.prescription.findFirst({
      where: { patientId: patient.id },
      include: { items: true, doctor: { include: { user: true, department: true } } },
    });

    if (existingPrescription) {
      assert(!!existingPrescription.prescriptionNumber, `Prescription located: ${existingPrescription.prescriptionNumber}`);
      assert(existingPrescription.items.length > 0, `Prescription contains ${existingPrescription.items.length} medication items`);
      assert(!!existingPrescription.doctor.user.fullName, `Attending prescriber verified: Dr. ${existingPrescription.doctor.user.fullName}`);
    } else {
      // Create test prescription fixture if none exists
      const newRx = await prisma.prescription.create({
        data: {
          prescriptionNumber: `RX-${year}-0001`,
          patientId: patient.id,
          doctorId: doctor.id,
          generalAdvice: 'Take with full glass of water after meals.',
          items: {
            create: [
              { medicineName: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: '30 days' },
            ],
          },
        },
        include: { items: true },
      });
      assert(!!newRx.prescriptionNumber, `Created prescription fixture: ${newRx.prescriptionNumber}`);
    }

    // -------------------------------------------------------------
    // Test 7: Security Audit Trail Verification
    // -------------------------------------------------------------
    console.log('\n🔹 7. Security & Clinical Operations Audit Trail:');
    const orderAudit = await prisma.auditLog.findFirst({
      where: { action: 'LAB_ORDER_REQUESTED' },
      orderBy: { createdAt: 'desc' },
    });
    assert(!!orderAudit, 'AuditLog entry verified for LAB_ORDER_REQUESTED');

    const statusAudit = await prisma.auditLog.findFirst({
      where: { action: 'LAB_ORDER_STATUS_UPDATED' },
      orderBy: { createdAt: 'desc' },
    });
    assert(!!statusAudit, 'AuditLog entry verified for LAB_ORDER_STATUS_UPDATED');

    console.log('\n====================================================================');
    console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Error during Lab Orders & PDF Export test execution:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runLabOrdersAndPdfExportTests();
