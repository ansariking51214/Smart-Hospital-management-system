/**
 * Module 3 - Day 5: Diagnostic Test Catalog (Laboratory & Radiology)
 * Official syllabus: Diagnostic test order requests (Lab/Radiology) & Prescription PDF export
 */

export const DIAGNOSTIC_TEST_CATALOG = [
  // -------------------------------------------------------------
  // LABORATORY - HEMATOLOGY
  // -------------------------------------------------------------
  {
    id: 'LAB-CBC',
    code: 'CBC',
    name: 'Complete Blood Count (CBC) with Differential',
    category: 'Hematology',
    type: 'LAB',
    specimen: 'Whole Blood (EDTA tube)',
    turnaroundHours: 4,
    normalRange: 'Hb: 13.5-17.5 g/dL (M), 12.0-15.5 g/dL (F); WBC: 4,500-11,000 /µL; Platelets: 150k-450k /µL',
    indications: 'Anemia, infection, leukocytosis, thrombocytopenia, fever investigation',
    price: 35.0,
  },
  {
    id: 'LAB-ESR',
    code: 'ESR',
    name: 'Erythrocyte Sedimentation Rate (ESR)',
    category: 'Hematology',
    type: 'LAB',
    specimen: 'Whole Blood (Sodium Citrate)',
    turnaroundHours: 2,
    normalRange: '0 - 20 mm/hr (age/gender dependent)',
    indications: 'Systemic inflammation, autoimmune disorders, temporal arteritis',
    price: 15.0,
  },
  {
    id: 'LAB-COAG',
    code: 'PT-INR',
    name: 'Prothrombin Time (PT) & INR Coagulation Profile',
    category: 'Hematology',
    type: 'LAB',
    specimen: 'Plasma (Sodium Citrate)',
    turnaroundHours: 3,
    normalRange: 'PT: 11.0 - 13.5 sec; INR: 0.8 - 1.1 (Therapeutic 2.0 - 3.0)',
    indications: 'Anticoagulation monitoring (Warfarin), bleeding disorders, pre-op clearance',
    price: 30.0,
  },
  {
    id: 'LAB-BLOOD-FILM',
    code: 'PBF',
    name: 'Peripheral Blood Film / Smear Examination',
    category: 'Hematology',
    type: 'LAB',
    specimen: 'Whole Blood (EDTA)',
    turnaroundHours: 6,
    normalRange: 'Normocytic normochromic RBCs, normal WBC morphology and platelet distribution',
    indications: 'Unexplained cytopenia, malaria parasite check, suspected hematological malignancy',
    price: 25.0,
  },

  // -------------------------------------------------------------
  // LABORATORY - BIOCHEMISTRY & CLINICAL CHEMISTRY
  // -------------------------------------------------------------
  {
    id: 'LAB-FBG',
    code: 'FBG',
    name: 'Fasting Blood Glucose (FBG)',
    category: 'Biochemistry',
    type: 'LAB',
    specimen: 'Plasma (Fluoride Oxalate / Serum)',
    turnaroundHours: 2,
    normalRange: '70 - 99 mg/dL (Normal); 100 - 125 mg/dL (Impaired); >= 126 mg/dL (Diabetes)',
    indications: 'Screening and monitoring for Diabetes Mellitus',
    price: 15.0,
  },
  {
    id: 'LAB-HBA1C',
    code: 'HBA1C',
    name: 'Glycated Hemoglobin (HbA1c)',
    category: 'Biochemistry',
    type: 'LAB',
    specimen: 'Whole Blood (EDTA)',
    turnaroundHours: 4,
    normalRange: '< 5.7% (Normal); 5.7% - 6.4% (Prediabetes); >= 6.5% (Diabetes)',
    indications: 'Long-term glycemic monitoring (past 90 days)',
    price: 40.0,
  },
  {
    id: 'LAB-LIPID',
    code: 'LIPID',
    name: 'Comprehensive Lipid Profile',
    category: 'Biochemistry',
    type: 'LAB',
    specimen: 'Serum (Fasting 10-12 hrs)',
    turnaroundHours: 4,
    normalRange: 'Total Cholesterol < 200 mg/dL; Triglycerides < 150 mg/dL; HDL > 40 mg/dL; LDL < 100 mg/dL',
    indications: 'Cardiovascular risk assessment, dyslipidemia, hypertension follow-up',
    price: 50.0,
  },
  {
    id: 'LAB-RFT',
    code: 'RFT',
    name: 'Renal Function Test (RFT / BUN & Serum Creatinine)',
    category: 'Biochemistry',
    type: 'LAB',
    specimen: 'Serum (SST)',
    turnaroundHours: 3,
    normalRange: 'BUN: 7 - 20 mg/dL; Creatinine: 0.7 - 1.3 mg/dL; eGFR: > 90 mL/min/1.73m²',
    indications: 'Renal impairment, hypertension, nephrotoxic drug surveillance',
    price: 45.0,
  },
  {
    id: 'LAB-LFT',
    code: 'LFT',
    name: 'Liver Function Test (LFT Panel)',
    category: 'Biochemistry',
    type: 'LAB',
    specimen: 'Serum (SST)',
    turnaroundHours: 3,
    normalRange: 'Bilirubin Total: 0.2-1.2 mg/dL; ALT (SGPT): 7-56 U/L; AST (SGOT): 10-40 U/L; Albumin: 3.5-5.0 g/dL',
    indications: 'Hepatotoxicity, viral hepatitis, jaundice, statin therapy baseline',
    price: 50.0,
  },
  {
    id: 'LAB-ELECTROLYTES',
    code: 'LYTES',
    name: 'Serum Electrolytes (Na+, K+, Cl-, HCO3-)',
    category: 'Biochemistry',
    type: 'LAB',
    specimen: 'Serum',
    turnaroundHours: 2,
    normalRange: 'Sodium: 136 - 145 mEq/L; Potassium: 3.5 - 5.1 mEq/L; Chloride: 98 - 107 mEq/L',
    indications: 'Dehydration, arrhythmia, diuretic therapy, acute renal failure',
    price: 35.0,
  },
  {
    id: 'LAB-TSH',
    code: 'TSH',
    name: 'Thyroid Stimulating Hormone (TSH)',
    category: 'Biochemistry',
    type: 'LAB',
    specimen: 'Serum',
    turnaroundHours: 6,
    normalRange: '0.4 - 4.0 µIU/mL',
    indications: 'Hypothyroidism, hyperthyroidism, unexplained fatigue, goiter',
    price: 35.0,
  },
  {
    id: 'LAB-TROP-I',
    code: 'TROP-I',
    name: 'Cardiac High-Sensitivity Troponin-I (STAT)',
    category: 'Biochemistry',
    type: 'LAB',
    specimen: 'Serum / Lithium Heparin Plasma',
    turnaroundHours: 1,
    normalRange: '< 0.04 ng/mL (Normal baseline)',
    indications: 'Acute coronary syndrome, myocardial infarction, acute chest pain',
    price: 65.0,
  },

  // -------------------------------------------------------------
  // LABORATORY - URINALYSIS & MICROBIOLOGY
  // -------------------------------------------------------------
  {
    id: 'LAB-URINE-RE',
    code: 'URINE-RE',
    name: 'Urine Routine Examination & Microscopy (R/E)',
    category: 'Microbiology',
    type: 'LAB',
    specimen: 'Clean Catch Mid-Stream Urine',
    turnaroundHours: 2,
    normalRange: 'Appearance: Clear, Pale Yellow; pH: 4.5-8.0; Protein: Nil; Glucose: Nil; RBC: 0-2/HPF; Pus Cells: 0-4/HPF',
    indications: 'Urinary tract infection, hematuria, proteinuria, nephrolithiasis',
    price: 15.0,
  },
  {
    id: 'LAB-URINE-CS',
    code: 'URINE-CS',
    name: 'Urine Culture & Antimicrobial Sensitivity (C/S)',
    category: 'Microbiology',
    type: 'LAB',
    specimen: 'Sterile Urine Container (Midstream)',
    turnaroundHours: 48,
    normalRange: 'No significant bacterial growth (< 10^3 CFU/mL)',
    indications: 'Recurrent UTI, pyelonephritis, targeted antibiotic selection',
    price: 45.0,
  },

  // -------------------------------------------------------------
  // RADIOLOGY & CLINICAL IMAGING
  // -------------------------------------------------------------
  {
    id: 'RAD-CXR-PA',
    code: 'CXR-PA',
    name: 'Chest X-Ray (Posteroanterior - PA View)',
    category: 'Radiology',
    type: 'RADIOLOGY',
    specimen: 'Digital Radiography (PA Projection)',
    turnaroundHours: 2,
    normalRange: 'Clear lung fields, normal cardiothoracic ratio (< 0.50), sharp costophrenic angles',
    indications: 'Pneumonia, cardiomegaly, COPD, pulmonary congestion, persistent cough',
    price: 40.0,
  },
  {
    id: 'RAD-ECG-12',
    code: 'ECG-12',
    name: '12-Lead Electrocardiogram (Resting ECG)',
    category: 'Radiology',
    type: 'RADIOLOGY',
    specimen: 'Resting Electrocardiography',
    turnaroundHours: 1,
    normalRange: 'Normal sinus rhythm, HR 60-100 bpm, normal axis, no acute ST-T deviations or Q waves',
    indications: 'Chest pain, palpitations, hypertension screening, syncope, preoperative baseline',
    price: 30.0,
  },
  {
    id: 'RAD-USG-ABD',
    code: 'USG-ABD',
    name: 'Ultrasound Whole Abdomen & Pelvis',
    category: 'Radiology',
    type: 'RADIOLOGY',
    specimen: 'Transabdominal Sonography',
    turnaroundHours: 4,
    normalRange: 'Normal size and echo-architecture of liver, gallbladder, spleen, pancreas, and kidneys; no free fluid',
    indications: 'Abdominal pain, gallstones, hepatomegaly, renal calculi, ascites',
    price: 60.0,
  },
  {
    id: 'RAD-CT-BRAIN',
    code: 'CT-BRAIN',
    name: 'CT Scan Brain / Head (Non-Contrast)',
    category: 'Radiology',
    type: 'RADIOLOGY',
    specimen: 'Multidetector Axial CT',
    turnaroundHours: 3,
    normalRange: 'Normal grey-white differentiation, ventricles within normal limits, no intracranial hemorrhage or mass effect',
    indications: 'Acute stroke, head injury, severe neurological deficit, altered mental state',
    price: 120.0,
  },
];

/**
 * Filter and query the diagnostic lab/radiology catalog
 */
export function searchDiagnosticCatalog(search = '', category = 'all') {
  const query = search.trim().toLowerCase();
  const selectedCategory = category.trim().toLowerCase();

  const filtered = DIAGNOSTIC_TEST_CATALOG.filter((test) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      test.category.toLowerCase() === selectedCategory ||
      test.type.toLowerCase() === selectedCategory;

    if (!matchesCategory) return false;

    if (!query) return true;

    return (
      test.name.toLowerCase().includes(query) ||
      test.code.toLowerCase().includes(query) ||
      test.category.toLowerCase().includes(query) ||
      test.indications.toLowerCase().includes(query)
    );
  });

  const categories = Array.from(new Set(DIAGNOSTIC_TEST_CATALOG.map((t) => t.category)));

  return {
    total: filtered.length,
    tests: filtered,
    categories,
  };
}

/**
 * Find a specific diagnostic test by code or ID
 */
export function getDiagnosticTestByCode(codeOrId) {
  if (!codeOrId) return null;
  const target = codeOrId.trim().toUpperCase();
  return (
    DIAGNOSTIC_TEST_CATALOG.find(
      (t) => t.code.toUpperCase() === target || t.id.toUpperCase() === target || t.name.toLowerCase() === codeOrId.trim().toLowerCase()
    ) || null
  );
}
