const ICD10_CATALOG = [
  { code: 'I10', description: 'Essential (primary) hypertension', category: 'Cardiology' },
  { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', category: 'Endocrinology' },
  { code: 'J06.9', description: 'Acute upper respiratory infection, unspecified', category: 'Pulmonology' },
  { code: 'A09', description: 'Infectious gastroenteritis and colitis, unspecified', category: 'Gastroenterology' },
  { code: 'R51.9', description: 'Headache, unspecified', category: 'Neurology' },
  { code: 'G43.909', description: 'Migraine, unspecified, not intractable', category: 'Neurology' },
  { code: 'M54.50', description: 'Low back pain, unspecified', category: 'Musculoskeletal' },
  { code: 'N39.0', description: 'Urinary tract infection, site not specified', category: 'Urology' },
];

const MEDICATION_CATALOG = [
  { name: 'Amoxicillin', genericName: 'amoxicillin', className: 'Penicillin antibiotic' },
  { name: 'Penicillin V', genericName: 'penicillin', className: 'Penicillin antibiotic' },
  { name: 'Azithromycin', genericName: 'azithromycin', className: 'Macrolide antibiotic' },
  { name: 'Ciprofloxacin', genericName: 'ciprofloxacin', className: 'Fluoroquinolone antibiotic' },
  { name: 'Amlodipine', genericName: 'amlodipine', className: 'Calcium channel blocker' },
  { name: 'Hydrochlorothiazide', genericName: 'hydrochlorothiazide', className: 'Thiazide diuretic' },
  { name: 'Metformin', genericName: 'metformin', className: 'Biguanide' },
  { name: 'Warfarin', genericName: 'warfarin', className: 'Anticoagulant' },
  { name: 'Aspirin', genericName: 'aspirin', className: 'Antiplatelet / NSAID' },
  { name: 'Ibuprofen', genericName: 'ibuprofen', className: 'NSAID' },
  { name: 'Paracetamol', genericName: 'paracetamol', className: 'Analgesic' },
];

const ALLERGY_CLASS_RULES = [
  { terms: ['penicillin', 'amoxicillin', 'ampicillin'], className: 'Penicillin antibiotic', severity: 'CRITICAL' },
  { terms: ['sulfa', 'sulfamethoxazole'], className: 'Sulfonamide antibiotic', severity: 'CRITICAL' },
  { terms: ['aspirin', 'nsaid', 'ibuprofen', 'naproxen'], className: 'NSAID', severity: 'HIGH' },
];

const INTERACTION_RULES = [
  {
    medications: ['warfarin', 'aspirin'],
    severity: 'CRITICAL',
    title: 'Increased bleeding risk',
    message: 'Warfarin and aspirin may significantly increase bleeding risk when combined.',
  },
  {
    medications: ['warfarin', 'ibuprofen'],
    severity: 'CRITICAL',
    title: 'Anticoagulant and NSAID interaction',
    message: 'Ibuprofen can increase gastrointestinal and systemic bleeding risk with warfarin.',
  },
  {
    medications: ['amlodipine', 'hydrochlorothiazide'],
    severity: 'MODERATE',
    title: 'Additive blood-pressure lowering',
    message: 'Monitor blood pressure and dizziness when combining these antihypertensives.',
  },
];

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function tokenizeList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
}

function findMedication(value) {
  const normalized = normalize(value);
  return MEDICATION_CATALOG.find(
    (medication) => normalized.includes(medication.genericName) || normalized.includes(normalize(medication.name))
  );
}

export function searchClinicalCatalog(search = '', type = 'all') {
  const query = normalize(search);
  const codes = type === 'medication' ? [] : ICD10_CATALOG.filter((item) =>
    !query || `${item.code} ${item.description} ${item.category}`.toLowerCase().includes(query)
  ).map((item) => ({ ...item, type: 'ICD10' }));
  const medications = type === 'icd10' ? [] : MEDICATION_CATALOG.filter((item) =>
    !query || `${item.name} ${item.genericName} ${item.className}`.toLowerCase().includes(query)
  ).map((item) => ({ ...item, type: 'MEDICATION' }));
  return { icd10: codes, medications };
}

export function evaluateClinicalSafety({ allergies = '', medications = [], icd10Codes = [] } = {}) {
  const allergyValues = tokenizeList(allergies).map(normalize);
  const medicationValues = tokenizeList(medications);
  const normalizedMedications = medicationValues.map(normalize);
  const alerts = [];

  normalizedMedications.forEach((medication, index) => {
    const catalogEntry = findMedication(medication);
    if (!catalogEntry) return;
    ALLERGY_CLASS_RULES.forEach((rule) => {
      const allergyMatch = allergyValues.find((allergy) => rule.terms.some((term) => allergy.includes(term)));
      if (allergyMatch && (rule.terms.some((term) => medication.includes(term)) || catalogEntry.className === rule.className)) {
        alerts.push({
          id: `allergy-${index}-${rule.className}`,
          type: 'ALLERGY',
          severity: rule.severity,
          title: `Allergy conflict: ${allergyMatch}`,
          message: `${catalogEntry.name} belongs to the ${rule.className} class listed in the patient's allergies.`,
          medication: medicationValues[index],
        });
      }
    });
  });

  INTERACTION_RULES.forEach((rule) => {
    if (rule.medications.every((term) => normalizedMedications.some((medication) => medication.includes(term)))) {
      alerts.push({ id: `interaction-${rule.medications.join('-')}`, type: 'INTERACTION', ...rule });
    }
  });

  return {
    allergies: tokenizeList(allergies),
    medications: medicationValues,
    icd10Codes: tokenizeList(icd10Codes),
    alerts,
    hasCriticalAlerts: alerts.some((alert) => alert.severity === 'CRITICAL'),
    hasWarnings: alerts.length > 0,
  };
}
