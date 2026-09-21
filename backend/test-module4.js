import prisma from './src/config/db.js';
import { runPharmacyTests } from './test-pharmacy.js';
import { runIpdTests } from './test-ipd.js';
import { runBillingTests } from './test-billing.js';

async function runMasterModule4Tests() {
  console.log('\n========================================================================================');
  console.log('🚀 RUNNING MASTER VERIFICATION SUITE: MODULE 4 (PHARMACY, IPD, BILLING & DEPLOYMENT)');
  console.log('========================================================================================\n');

  let pSuccess = false;
  let iSuccess = false;
  let bSuccess = false;

  try {
    pSuccess = await runPharmacyTests();
    iSuccess = await runIpdTests();
    bSuccess = await runBillingTests();
  } catch (err) {
    console.error('❌ Error executing master Module 4 test suite:', err);
  } finally {
    await prisma.$disconnect();
  }

  console.log('========================================================================================');
  if (pSuccess && iSuccess && bSuccess) {
    console.log('🎉 ALL MODULE 4 VERIFICATION TESTS PASSED SUCCESSFULLY! (100% COMPLETE)');
    console.log('========================================================================================\n');
    process.exit(0);
  } else {
    console.error('❌ SOME MODULE 4 TESTS FAILED. PLEASE REVIEW LOGS ABOVE.');
    console.log('========================================================================================\n');
    process.exit(1);
  }
}

runMasterModule4Tests();
