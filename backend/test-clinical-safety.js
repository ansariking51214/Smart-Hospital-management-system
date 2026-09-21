import { evaluateClinicalSafety, searchClinicalCatalog } from './src/utils/clinicalSafety.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  PASS: ${message}`);
    passed += 1;
  } else {
    console.error(`  FAIL: ${message}`);
    failed += 1;
  }
}

console.log('\nMODULE 3 - DAY 3: ICD-10 & CLINICAL SAFETY TESTS\n');

const icd10Results = searchClinicalCatalog('hypertension', 'icd10');
assert(icd10Results.icd10.some((item) => item.code === 'I10'), 'ICD-10 search returns essential hypertension (I10)');
assert(icd10Results.medications.length === 0, 'ICD-10 filter excludes medication results');

const allergyResult = evaluateClinicalSafety({ allergies: 'Penicillin, latex', medications: ['Amoxicillin'] });
assert(allergyResult.hasCriticalAlerts, 'Penicillin allergy blocks amoxicillin with a critical alert');
assert(allergyResult.alerts[0].type === 'ALLERGY', 'Allergy alert is classified correctly');

const interactionResult = evaluateClinicalSafety({ medications: ['Warfarin', 'Aspirin'] });
assert(interactionResult.hasCriticalAlerts, 'Warfarin and aspirin produce a critical interaction alert');
assert(interactionResult.alerts.some((alert) => alert.type === 'INTERACTION'), 'Drug interaction alert is classified correctly');

const clearResult = evaluateClinicalSafety({ allergies: 'Penicillin', medications: ['Azithromycin'], icd10Codes: ['I10'] });
assert(!clearResult.hasWarnings, 'Non-conflicting medication returns a clear result');
assert(clearResult.icd10Codes[0] === 'I10', 'Selected ICD-10 codes are preserved in the safety result');

console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
