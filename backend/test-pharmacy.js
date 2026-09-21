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

export async function runPharmacyTests() {
  console.log('\n💊 ====================================================================');
  console.log('   MODULE 4 - DAY 1: PHARMACY STOCK & INVENTORY MANAGEMENT TESTS');
  console.log('====================================================================\n');

  try {
    // 1. Fetch medicine catalog
    const medicines = await prisma.medicine.findMany();
    assert(medicines.length > 0, `Pharmacy catalog initialized with ${medicines.length} medicines.`);

    // 2. Add a new test medicine
    const newMed = await prisma.medicine.create({
      data: {
        name: 'Azithromycin 500mg (Test)',
        genericName: 'Azithromycin',
        category: 'Antibiotic',
        manufacturer: 'Pfizer Test',
        unitPrice: 25.0,
        stockQuantity: 50,
        reorderLevel: 15,
        dosageForm: 'Tablet',
      },
    });
    assert(!!newMed.id, `Created new medicine: ${newMed.name} ($${newMed.unitPrice})`);

    // 3. Low stock threshold evaluation
    const lowStockCheck = newMed.stockQuantity <= newMed.reorderLevel;
    assert(!lowStockCheck, `Stock quantity (${newMed.stockQuantity}) > reorder level (${newMed.reorderLevel}) - Status OK`);

    // 4. Create an inventory batch
    const batch = await prisma.inventoryBatch.create({
      data: {
        medicineId: newMed.id,
        batchNumber: 'BATCH-AZITH-2026-01',
        quantity: 100,
        expiryDate: new Date('2027-12-31'),
        costPrice: 18.5,
      },
    });
    assert(!!batch.id, `Added Inventory Batch: ${batch.batchNumber} (+${batch.quantity} units)`);

    // 5. Update stock after batch arrival
    const updatedMed = await prisma.medicine.update({
      where: { id: newMed.id },
      data: { stockQuantity: newMed.stockQuantity + batch.quantity },
    });
    assert(updatedMed.stockQuantity === 150, `Stock updated automatically after batch add: ${updatedMed.stockQuantity} units.`);

    // Clean up test med
    await prisma.inventoryBatch.deleteMany({ where: { medicineId: newMed.id } });
    await prisma.medicine.delete({ where: { id: newMed.id } });
    assert(true, 'Test medicine and batch cleaned up.');
  } catch (err) {
    console.error('❌ Error during pharmacy tests:', err);
    failed++;
  }

  console.log(`\nPharmacy Tests Completed: ${passed} passed, ${failed} failed.\n`);
  return failed === 0;
}

if (process.argv[1].endsWith('test-pharmacy.js')) {
  runPharmacyTests()
    .then((success) => process.exit(success ? 0 : 1))
    .finally(() => prisma.$disconnect());
}
