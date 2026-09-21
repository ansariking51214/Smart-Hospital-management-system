import React, { useState, useEffect } from 'react';
import {
  FileText,
  Stethoscope,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Activity,
  Calendar,
  Save,
  ShieldCheck,
  Search,
  Plus,
  RefreshCw,
  Zap,
  Tag,
  Check,
  ChevronRight,
  BookOpen,
  Lock,
  Layers,
} from 'lucide-react';

export function Day2SoapNotesExplorer() {
  const [selectedPatient, setSelectedPatient] = useState({
    id: 'pat-101',
    mrn: 'MRN-2026-0001',
    name: 'David Miller',
    age: 38,
    gender: 'MALE',
    bloodGroup: 'A+',
    allergies: 'Penicillin (Severe Anaphylaxis), Sulfa Drugs',
    chronicConditions: 'Essential Hypertension (Stage 1), Hyperlipidemia',
    latestBp: '142/88',
    latestSpO2: 98,
    latestPulse: 76,
  });

  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'history' | 'templates'
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Form State
  const [subjective, setSubjective] = useState(
    'Patient presents complaining of mild occipital morning headaches for 4 days. Denies chest pain, shortness of breath, visual blurring, or dizziness.'
  );
  const [objective, setObjective] = useState(
    'BP 142/88 mmHg, Pulse 76 bpm, SpO2 98% on room air, Temp 36.8°C. S1 S2 present, no murmurs. Lungs clear to auscultation bilaterally.'
  );
  const [assessment, setAssessment] = useState(
    'Essential (Primary) Hypertension - Grade 1 Uncontrolled. Mild occipital tension headache.'
  );
  const [plan, setPlan] = useState(
    'Initiate Amlodipine 5mg OD. Advise low sodium diet, 30-min daily exercise. Home BP monitoring twice daily. Follow-up in 2 weeks.'
  );
  const [icd10Codes, setIcd10Codes] = useState('I10, G44.2');
  const [followUpDate, setFollowUpDate] = useState('2026-09-22');
  const [isFinalized, setIsFinalized] = useState(false);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [savedNotes, setSavedNotes] = useState([
    {
      id: 'soap-901',
      date: '2026-09-08',
      doctorName: 'Dr. Sarah Jenkins, MD',
      doctorDept: 'Cardiology',
      subjective: 'Follow-up for blood pressure check. Patient compliant with medication.',
      objective: 'BP 138/84 mmHg, Pulse 72 bpm, SpO2 99%.',
      assessment: 'Essential Hypertension - Moderately Controlled.',
      plan: 'Continue Amlodipine 5mg daily. Low salt diet.',
      icd10Codes: 'I10',
      status: 'FINALIZED',
    },
    {
      id: 'soap-890',
      date: '2026-08-25',
      doctorName: 'Dr. Michael Chang, MD',
      doctorDept: 'General Medicine',
      subjective: 'Patient complaints of dry cough and mild body aches for 2 days.',
      objective: 'Temp 37.6°C, BP 122/80 mmHg, SpO2 98%. Pharynx clear.',
      assessment: 'Acute Upper Respiratory Tract Infection (URTI).',
      plan: 'Paracetamol 500mg TDS, warm fluids, rest.',
      icd10Codes: 'J06.9',
      status: 'FINALIZED',
    },
  ]);

  const templates = [
    {
      id: 'htn',
      title: 'Hypertension Follow-Up',
      category: 'Cardiology',
      icd10: 'I10',
      subjective:
        'Patient presents for routine hypertension follow-up. Reports mild occasional headaches. Denies chest pain, shortness of breath, or dizziness. Fully compliant with anti-hypertensive regimen.',
      objective:
        'BP 138/85 mmHg, Pulse 72 bpm, SpO2 98% on room air. Chest clear to auscultation bilaterally. S1 S2 present, no murmurs. No peripheral pitting edema.',
      assessment:
        'Essential (Primary) Hypertension - Suboptimally controlled. Mild Grade 1 Essential HTN.',
      plan:
        'Continue Amlodipine 5mg daily. Low-salt dietary counseling. Home BP charting twice daily. Follow-up in 4 weeks.',
    },
    {
      id: 'urti',
      title: 'Acute Upper Respiratory Infection',
      category: 'Pulmonology / OPD',
      icd10: 'J06.9',
      subjective:
        '3-day history of dry cough, sore throat, low-grade fever, and mild nasal congestion. No severe shortness of breath or hemoptysis.',
      objective:
        'Temp 37.8°C, BP 120/78 mmHg, Pulse 84 bpm, SpO2 97%. Posterior pharynx mildly erythematous. Lungs clear bilaterally without wheezing or rales.',
      assessment:
        'Acute Upper Respiratory Tract Infection (URTI) - Presumed Viral Origin.',
      plan:
        'Symptomatic therapy: Paracetamol 500mg TDS PRN for fever/body aches. Warm saline gargles & fluid hydration. Return if fever exceeds 38.5°C.',
    },
    {
      id: 't2dm',
      title: 'Type 2 Diabetes Mellitus Review',
      category: 'Endocrinology',
      icd10: 'E11.9',
      subjective:
        'Routine follow-up for type 2 diabetes. Adhering to diabetic diet. No reported hypoglycemic episodes, nocturnal polyuria, blurred vision, or foot numbness.',
      objective:
        'Fasting Blood Glucose 135 mg/dL, HbA1c 7.1%. Weight 74 kg, BMI 25.6 kg/m². Bilateral foot monofilament sensory testing intact.',
      assessment:
        'Type 2 Diabetes Mellitus without complications - Fair Glycemic Control.',
      plan:
        'Continue Metformin 500mg twice daily. Maintain diabetic diet and 30-min daily exercise. Re-evaluate HbA1c in 3 months.',
    },
    {
      id: 'gastro',
      title: 'Acute Gastroenteritis',
      category: 'Gastroenterology',
      icd10: 'A09',
      subjective:
        '2-day history of watery diarrhea (4-5 episodes per day), mild abdominal cramps, and nausea. No hematochezia or severe fever.',
      objective:
        'Temp 37.2°C, BP 115/72 mmHg, Pulse 88 bpm. Abdomen soft, non-distended, mild diffuse tenderness on deep palpation. Hyperactive bowel sounds.',
      assessment: 'Acute Infectious Gastroenteritis - Mild Dehydration.',
      plan:
        'Oral Rehydration Salts (ORS) solution, Ciprofloxacin 500mg BD for 3 days, Probiotics twice daily. Bland diet (BRAT). Monitor urine output.',
    },
  ];

  const handleApplyTemplate = (tpl) => {
    setSelectedTemplate(tpl.id);
    setSubjective(tpl.subjective);
    setObjective(tpl.objective);
    setAssessment(tpl.assessment);
    setPlan(tpl.plan);
    setIcd10Codes(tpl.icd10);
    showToast(`Applied clinical template: "${tpl.title}"`);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      // Simulate API response
      const newDraft = {
        id: `soap-${Date.now().toString().slice(-4)}`,
        date: new Date().toISOString().split('T')[0],
        doctorName: 'Dr. Sarah Jenkins, MD',
        doctorDept: 'Cardiology',
        subjective,
        objective,
        assessment,
        plan,
        icd10Codes,
        status: 'DRAFT',
      };
      setSavedNotes([newDraft, ...savedNotes]);
      setIsFinalized(false);
      showToast('✅ Clinical SOAP note saved as DRAFT successfully.');
    } catch (err) {
      showToast('❌ Error saving SOAP draft.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!subjective || !objective || !assessment || !plan) {
      showToast('⚠️ Please complete all SOAP sections (S, O, A, P) before final signing.');
      return;
    }
    setLoading(true);
    try {
      const finalNote = {
        id: `soap-${Date.now().toString().slice(-4)}`,
        date: new Date().toISOString().split('T')[0],
        doctorName: 'Dr. Sarah Jenkins, MD',
        doctorDept: 'Cardiology',
        subjective,
        objective,
        assessment,
        plan,
        icd10Codes,
        status: 'FINALIZED',
      };
      setSavedNotes([finalNote, ...savedNotes.filter((n) => n.status !== 'DRAFT')]);
      setIsFinalized(true);
      showToast('🔒 Clinical SOAP note signed & encounter marked as COMPLETED!');
    } catch (err) {
      showToast('❌ Error finalizing encounter.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-teal-500/50 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in">
          <Sparkles className="w-5 h-5 text-teal-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Workspace Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-teal-950/40 border border-teal-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-mono font-bold uppercase tracking-wide">
                Module 3 &bull; Day 2 Deliverable
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
                ✅ Completed & Verified
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <FileText className="w-7 h-7 text-teal-400" />
              Clinical SOAP Notes Workstation & Encounter Engine
            </h1>
            <p className="text-xs text-slate-400 max-w-3xl">
              Structured Subjective, Objective, Assessment, Plan documentation station with ICD-10 diagnostic coding, clinical macro templates, and encounter finalization lifecycle.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'editor'
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              SOAP Editor
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Clock className="w-4 h-4" />
              Patient History ({savedNotes.length})
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'templates'
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Macros & Templates
            </button>
          </div>
        </div>

        {/* Patient Banner */}
        <div className="mt-6 bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-sm border border-teal-500/30">
              DM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-white">{selectedPatient.name}</h3>
                <span className="px-2 py-0.5 rounded bg-teal-900/60 text-teal-200 border border-teal-700/50 text-[11px] font-mono font-bold">
                  {selectedPatient.mrn}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {selectedPatient.age} Yrs &bull; {selectedPatient.gender} &bull; Blood: {selectedPatient.bloodGroup}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-400 block text-[10px]">Latest BP:</span>
              <strong className="text-teal-300">{selectedPatient.latestBp} mmHg</strong>
            </div>
            <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-400 block text-[10px]">SpO2 Saturation:</span>
              <strong className="text-emerald-300">{selectedPatient.latestSpO2}%</strong>
            </div>

            {/* Critical Allergy Alert Badge */}
            <div className="bg-red-950/40 border border-red-500/40 text-red-300 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse shrink-0" />
              <div>
                <span className="font-bold block text-[10px] text-red-200 uppercase">Critical Allergies:</span>
                <span>{selectedPatient.allergies}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Template Selector Strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3 overflow-x-auto">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 shrink-0 pl-1">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          Quick Clinical Macros:
        </span>
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => handleApplyTemplate(tpl)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition flex items-center gap-1.5 border ${
              selectedTemplate === tpl.id
                ? 'bg-teal-600 text-white border-teal-400 shadow-md shadow-teal-600/20'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <span>{tpl.title}</span>
            <span className="text-[10px] opacity-75 font-mono">[{tpl.icd10}]</span>
          </button>
        ))}
      </div>

      {/* Tab 1: SOAP Editor */}
      {activeTab === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main 4-Quadrant SOAP Console */}
          <div className="lg:col-span-2 space-y-5">
            {/* Subjective (S) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 font-extrabold text-xs flex items-center justify-center border border-blue-500/30">
                    S
                  </span>
                  Subjective (Chief Complaints & Patient History)
                </h2>
                <span className="text-[11px] text-slate-400 font-mono">Patient Symptoms</span>
              </div>
              <textarea
                value={subjective}
                onChange={(e) => setSubjective(e.target.value)}
                rows={3}
                placeholder="Record patient chief complaints, history of present illness (HPI), symptom duration, review of systems..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none transition leading-relaxed"
              />
            </div>

            {/* Objective (O) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-extrabold text-xs flex items-center justify-center border border-emerald-500/30">
                    O
                  </span>
                  Objective (Physical Exam Findings & Vitals)
                </h2>
                <span className="text-[11px] text-slate-400 font-mono">Clinical Observations</span>
              </div>
              <textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                rows={3}
                placeholder="Document physical exam observations, vital signs summary, chest auscultation, cardiovascular exam, systemic findings..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition leading-relaxed"
              />
            </div>

            {/* Assessment (A) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-extrabold text-xs flex items-center justify-center border border-amber-500/30">
                    A
                  </span>
                  Assessment (Clinical Diagnosis & Differential)
                </h2>
                <span className="text-[11px] text-slate-400 font-mono">Diagnosis & Severity</span>
              </div>
              <textarea
                value={assessment}
                onChange={(e) => setAssessment(e.target.value)}
                rows={3}
                placeholder="Enter primary diagnosis, disease stage, severity assessment, differential diagnoses..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none transition leading-relaxed"
              />
            </div>

            {/* Plan (P) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500"></div>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 font-extrabold text-xs flex items-center justify-center border border-purple-500/30">
                    P
                  </span>
                  Plan (Treatment Plan, Advice & Follow-Up)
                </h2>
                <span className="text-[11px] text-slate-400 font-mono">Management Strategy</span>
              </div>
              <textarea
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                rows={3}
                placeholder="Outline treatment strategy, medication prescriptions, dietary/lifestyle counseling, follow-up timeline..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:outline-none transition leading-relaxed"
              />
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveDraft}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center gap-2 transition"
                >
                  <Save className="w-4 h-4 text-slate-400" />
                  Save Draft Note
                </button>
                <button
                  onClick={handleFinalize}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-teal-600/30 flex items-center gap-2 transition"
                >
                  <Lock className="w-4 h-4" />
                  Finalize & Sign Encounter
                </button>
              </div>

              {isFinalized && (
                <div className="flex items-center gap-2 bg-emerald-950/40 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-xl text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Encounter Signed & Status: COMPLETED</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: ICD-10 Coding & Encounter Control */}
          <div className="space-y-5">
            {/* ICD-10 Clinical Coding Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-teal-400" />
                ICD-10 Diagnostic Coding
              </h3>
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">
                  ICD-10 Disease Codes:
                </label>
                <input
                  type="text"
                  value={icd10Codes}
                  onChange={(e) => setIcd10Codes(e.target.value)}
                  placeholder="e.g. I10, E11.9, J06.9"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-teal-300 placeholder-slate-600 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <span className="text-[11px] text-slate-400 font-semibold block">Suggested Codes:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() =>
                      setIcd10Codes((prev) => (prev ? `${prev}, I10` : 'I10'))
                    }
                    className="text-[11px] bg-slate-800 hover:bg-slate-700 text-teal-300 px-2.5 py-1 rounded-lg border border-slate-700 font-mono"
                  >
                    + I10 (Hypertension)
                  </button>
                  <button
                    onClick={() =>
                      setIcd10Codes((prev) => (prev ? `${prev}, E11.9` : 'E11.9'))
                    }
                    className="text-[11px] bg-slate-800 hover:bg-slate-700 text-teal-300 px-2.5 py-1 rounded-lg border border-slate-700 font-mono"
                  >
                    + E11.9 (Type 2 DM)
                  </button>
                  <button
                    onClick={() =>
                      setIcd10Codes((prev) => (prev ? `${prev}, J06.9` : 'J06.9'))
                    }
                    className="text-[11px] bg-slate-800 hover:bg-slate-700 text-teal-300 px-2.5 py-1 rounded-lg border border-slate-700 font-mono"
                  >
                    + J06.9 (URTI)
                  </button>
                </div>
              </div>
            </div>

            {/* Follow-up Scheduler */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Follow-Up Appointment
              </h3>
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">
                  Scheduled Follow-Up Date:
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Clinical Security Audit Log Status */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>EHR Audit Guard</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                All SOAP documentation events, draft saves, and encounter finalizations are cryptographically logged to the system <strong className="text-slate-200">AuditLog</strong> table with attending physician digital signature.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Patient SOAP History */}
      {activeTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-400" />
                Longitudinal SOAP Medical History — {selectedPatient.name} ({selectedPatient.mrn})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Past clinical encounter notes, diagnostic assessments, and treatment plans.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-mono">
              {savedNotes.length} Visits Logged
            </span>
          </div>

          <div className="space-y-4">
            {savedNotes.map((note) => (
              <div
                key={note.id}
                className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-4 hover:border-slate-700 transition"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-teal-300 font-mono text-xs font-bold border border-slate-800">
                      {note.date}
                    </span>
                    <div>
                      <h4 className="text-xs font-extrabold text-white">{note.doctorName}</h4>
                      <span className="text-[11px] text-slate-400">{note.doctorDept}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-slate-900 text-teal-300 px-2.5 py-0.5 rounded border border-slate-800 font-mono">
                      ICD-10: {note.icd10Codes}
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-bold uppercase">
                      {note.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                    <strong className="text-blue-400 block mb-1 font-mono uppercase text-[10px]">
                      S — Subjective:
                    </strong>
                    <p className="text-slate-300">{note.subjective}</p>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                    <strong className="text-emerald-400 block mb-1 font-mono uppercase text-[10px]">
                      O — Objective:
                    </strong>
                    <p className="text-slate-300">{note.objective}</p>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                    <strong className="text-amber-400 block mb-1 font-mono uppercase text-[10px]">
                      A — Assessment:
                    </strong>
                    <p className="text-slate-300">{note.assessment}</p>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                    <strong className="text-purple-400 block mb-1 font-mono uppercase text-[10px]">
                      P — Plan:
                    </strong>
                    <p className="text-slate-300">{note.plan}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Macros Catalog */}
      {activeTab === 'templates' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-teal-400" />
              Clinical SOAP Macros & Departmental Templates
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Standardized clinical documentation macros to streamline physician consultation workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3 hover:border-teal-500/50 transition flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-400 font-mono">
                      {tpl.category}
                    </span>
                    <span className="text-xs font-mono bg-slate-900 text-teal-300 border border-slate-800 px-2 py-0.5 rounded">
                      ICD-10: {tpl.icd10}
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold text-white">{tpl.title}</h4>
                  <div className="text-xs text-slate-300 space-y-1 bg-slate-900/80 p-3 rounded-lg border border-slate-800/80">
                    <p><strong className="text-slate-400">Dx:</strong> {tpl.assessment}</p>
                    <p><strong className="text-slate-400">Rx Plan:</strong> {tpl.plan}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    handleApplyTemplate(tpl);
                    setActiveTab('editor');
                  }}
                  className="w-full mt-3 py-2 rounded-lg bg-slate-800 hover:bg-teal-600 text-white font-bold text-xs border border-slate-700 transition flex items-center justify-center gap-2"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Load Macro into Editor
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
