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

export async function runIpdTests() {
  console.log('\n🛏️ ====================================================================');
  console.log('   MODULE 4 - DAY 2: INPATIENT (IPD) WARD & BED ALLOCATION TESTS');
  console.log('====================================================================\n');

  try {
    // 1. Fetch or Create test Ward
    let ward = await prisma.ward.findFirst({ where: { code: 'TEST-ICU' } });
    if (!ward) {
      ward = await prisma.ward.create({
        data: {
          name: 'Cardiac Intensive Care (Test)',
          code: 'TEST-ICU',
          type: 'ICU',
          floor: '4th Floor',
          totalBeds: 2,
        },
      });
    }
    assert(!!ward.id, `Ward located/created: ${ward.name} (${ward.code})`);

    // 2. Create test Bed
    let bed = await prisma.bed.findFirst({ where: { wardId: ward.id, bedNumber: 'TEST-BED-01' } });
    if (!bed) {
      bed = await prisma.bed.create({
        data: {
          wardId: ward.id,
          bedNumber: 'TEST-BED-01',
          dailyCharge: 300.0,
          status: 'AVAILABLE',
        },
      });
    }
    assert(bed.status === 'AVAILABLE', `Bed ${bed.bedNumber} status is AVAILABLE ($${bed.dailyCharge}/day)`);

    // 3. Locate patient for admission
    const patient = await prisma.patientProfile.findFirst();
    assert(!!patient, `Patient located for admission: ${patient.firstName} ${patient.lastName}`);

    // 4. Allocate bed (Admission)
    const allocation = await prisma.bedAllocation.create({
      data: {
        bedId: bed.id,
        patientId: patient.id,
        notes: 'Post-cardiac catheterization observation.',
      },
    });

    await prisma.bed.update({ where: { id: bed.id }, data: { status: 'OCCUPIED' } });

    const updatedBed = await prisma.bed.findUnique({ where: { id: bed.id } });
    assert(updatedBed.status === 'OCCUPIED', `Bed ${bed.bedNumber} status transitioned to OCCUPIED on admission.`);

    // 5. Discharge Patient
    const dischargedAt = new Date();
    const updatedAlloc = await prisma.bedAllocation.update({
      where: { id: allocation.id },
      data: { dischargedAt },
    });
    assert(!!updatedAlloc.dischargedAt, `Patient discharged successfully at ${dischargedAt.toISOString()}`);

    await prisma.bed.update({ where: { id: bed.id }, data: { status: 'AVAILABLE' } });
    const freedBed = await prisma.bed.findUnique({ where: { id: bed.id } });
    assert(freedBed.status === 'AVAILABLE', `Bed ${bed.bedNumber} returned to AVAILABLE status post-discharge.`);

    // Clean up test bed & allocation & ward
    await prisma.bedAllocation.delete({ where: { id: allocation.id } });
    await prisma.bed.delete({ where: { id: bed.id } });
    await prisma.ward.delete({ where: { id: ward.id } });
    assert(true, 'IPD test records cleaned up successfully.');
  } catch (err) {
    console.error('❌ Error during IPD tests:', err);
    failed++;
  }

  console.log(`\nIPD Tests Completed: ${passed} passed, ${failed} failed.\n`);
  return failed === 0;
}

if (process.argv[1].endsWith('test-ipd.js')) {
  runIpdTests()
    .then((success) => process.exit(success ? 0 : 1))
    .finally(() => prisma.$disconnect());
}
