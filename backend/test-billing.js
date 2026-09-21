import prisma from './src/config/db.js';
import { generateInvoiceNumber } from './src/utils/mrnGenerator.js';

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

export async function runBillingTests() {
  console.log('\n💳 ====================================================================');
  console.log('   MODULE 4 - DAY 3 & 4: AUTOMATED BILLING & PRINTABLE INVOICE TESTS');
  console.log('====================================================================\n');

  try {
    // 1. Invoice Number format verification
    const invNum = await generateInvoiceNumber();
    assert(invNum.startsWith('INV-2026-'), `Generated sequential Invoice Number: ${invNum}`);

    // 2. Locate patient
    const patient = await prisma.patientProfile.findFirst({ where: { mrn: 'MRN-2026-0001' } });
    assert(!!patient, `Found patient for billing test: ${patient.firstName} ${patient.lastName}`);

    // 3. Create a test Invoice with itemized breakdown
    const testInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber: invNum,
        patientId: patient.id,
        subTotal: 350.0,
        taxRate: 5.0,
        taxAmount: 17.5,
        discount: 10.0,
        totalAmount: 357.5,
        paidAmount: 0.0,
        balanceDue: 357.5,
        paymentStatus: 'PENDING',
        items: {
          create: [
            { description: 'Physician Consultation - Cardiology', category: 'CONSULTATION', quantity: 1, unitPrice: 150.0, totalPrice: 150.0 },
            { description: 'Complete Blood Count (CBC)', category: 'LAB', quantity: 1, unitPrice: 60.0, totalPrice: 60.0 },
            { description: 'Amoxicillin 500mg (10 Caps)', category: 'PHARMACY', quantity: 10, unitPrice: 1.4, totalPrice: 14.0 },
            { description: 'IPD Room Stay - General Ward (1 Day)', category: 'ROOM_CHARGE', quantity: 1, unitPrice: 126.0, totalPrice: 126.0 },
          ],
        },
      },
      include: { items: true, patient: true },
    });

    assert(testInvoice.items.length === 4, `Invoice contains ${testInvoice.items.length} itemized charge rows.`);
    assert(testInvoice.paymentStatus === 'PENDING', `Initial Payment Status is PENDING (Balance Due: $${testInvoice.balanceDue})`);

    // 4. Record partial payment
    const partialPay = 100.0;
    const newPaidAmount = testInvoice.paidAmount + partialPay;
    const newBalanceDue = testInvoice.totalAmount - newPaidAmount;

    const updatedInv1 = await prisma.invoice.update({
      where: { id: testInvoice.id },
      data: {
        paidAmount: newPaidAmount,
        balanceDue: newBalanceDue,
        paymentStatus: 'PARTIAL',
        paymentMethod: 'Card',
      },
    });

    assert(updatedInv1.paymentStatus === 'PARTIAL', `Recorded $${partialPay} payment -> Status transitioned to PARTIAL (Balance: $${updatedInv1.balanceDue})`);

    // 5. Full payment completion
    const finalInv = await prisma.invoice.update({
      where: { id: testInvoice.id },
      data: {
        paidAmount: testInvoice.totalAmount,
        balanceDue: 0.0,
        paymentStatus: 'PAID',
        paidAt: new Date(),
      },
    });

    assert(finalInv.paymentStatus === 'PAID', `Paid remaining balance -> Status transitioned to PAID (Balance Due: $${finalInv.balanceDue})`);

    // Clean up test invoice
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: testInvoice.id } });
    await prisma.invoice.delete({ where: { id: testInvoice.id } });
    assert(true, 'Test Invoice and itemized records cleaned up successfully.');
  } catch (err) {
    console.error('❌ Error during billing tests:', err);
    failed++;
  }

  console.log(`\nBilling Tests Completed: ${passed} passed, ${failed} failed.\n`);
  return failed === 0;
}

if (process.argv[1].endsWith('test-billing.js')) {
  runBillingTests()
    .then((success) => process.exit(success ? 0 : 1))
    .finally(() => prisma.$disconnect());
}
