import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardPlus, Pill, Search, ShieldCheck, Stethoscope, XCircle } from 'lucide-react';
import { consultationAPI, patientsAPI } from '../services/api';

export function Day3ClinicalSafetyExplorer() {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [search, setSearch] = useState('');
  const [catalog, setCatalog] = useState({ icd10: [], medications: [] });
  const [selectedCodes, setSelectedCodes] = useState([]);
  const [medications, setMedications] = useState([]);
  const [medicationInput, setMedicationInput] = useState('');
  const [safety, setSafety] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    patientsAPI.getAll({ limit: 50 }).then((response) => {
      if (response.success) {
        setPatients(response.patients || []);
        if (response.patients?.[0]) setSelectedPatientId(response.patients[0].id);
      }
    }).catch((err) => setError(err.response?.data?.message || err.message));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      consultationAPI.getClinicalCatalog({ search }).then((response) => {
        if (response.success) setCatalog({ icd10: response.icd10 || [], medications: response.medications || [] });
      }).catch((err) => setError(err.response?.data?.message || err.message));
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const addCode = (code) => setSelectedCodes((current) => current.includes(code) ? current : [...current, code]);
  const addMedication = (name) => setMedications((current) => current.includes(name) ? current : [...current, name]);
  const runSafetyCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await consultationAPI.checkClinicalSafety({
        patientId: selectedPatientId,
        medications,
        icd10Codes: selectedCodes,
      });
      setSafety(response);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-amber-800/40 bg-gradient-to-r from-amber-950 via-slate-900 to-rose-950 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-200">
              <ShieldCheck className="h-3.5 w-3.5" /> Module 3 &bull; Day 3 Deliverable
            </div>
            <h1 className="text-2xl font-bold tracking-tight">ICD-10 Coding & Clinical Safety Alerts</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-300">Attach structured diagnoses and screen proposed medicines against the patient&apos;s known allergies and high-risk combinations before prescribing.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/10 p-4 text-right">
            <div className="text-xs uppercase tracking-wider text-amber-200">Safety state</div>
            <div className="mt-1 text-lg font-bold">{safety ? (safety.hasWarnings ? `${safety.alerts.length} alert(s)` : 'Clear to review') : 'Not checked'}</div>
          </div>
        </div>
      </section>

      {error && <div className="rounded-xl border border-rose-500/40 bg-rose-950/50 p-3 text-sm text-rose-200">{error}</div>}

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-2"><Stethoscope className="h-5 w-5 text-teal-400" /><h2 className="font-bold text-white">Patient & diagnosis context</h2></div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Patient record
            <select value={selectedPatientId} onChange={(event) => setSelectedPatientId(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white">
              <option value="">Select a patient</option>
              {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.mrn} - {patient.firstName} {patient.lastName}</option>)}
            </select>
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Search clinical catalog
            <div className="relative mt-2"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="I10, hypertension, amoxicillin..." className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-teal-400" /></div>
          </label>
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">ICD-10 suggestions</div>
            {catalog.icd10.slice(0, 5).map((item) => <button key={item.code} type="button" onClick={() => addCode(item.code)} className="flex w-full items-center justify-between rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-left text-xs hover:border-teal-400"><span><strong className="text-teal-300">{item.code}</strong> <span className="text-slate-300">{item.description}</span></span><ClipboardPlus className="h-4 w-4 text-slate-500" /></button>)}
          </div>
          <div className="flex flex-wrap gap-2">{selectedCodes.map((code) => <span key={code} className="rounded-md bg-teal-500/15 px-2 py-1 text-xs font-bold text-teal-300">{code} <button type="button" onClick={() => setSelectedCodes((current) => current.filter((item) => item !== code))} aria-label={`Remove ${code}`}>&times;</button></span>)}</div>
        </div>

        <div className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center gap-2"><Pill className="h-5 w-5 text-rose-400" /><h2 className="font-bold text-white">Medication safety review</h2></div>
          <div className="flex gap-2"><input value={medicationInput} onChange={(event) => setMedicationInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && medicationInput.trim()) { addMedication(medicationInput.trim()); setMedicationInput(''); } }} placeholder="Add medication and press Enter" className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-rose-400" /><button type="button" onClick={() => { if (medicationInput.trim()) { addMedication(medicationInput.trim()); setMedicationInput(''); } }} className="rounded-lg bg-rose-600 px-3 text-xs font-bold text-white hover:bg-rose-500">Add</button></div>
          <div className="flex flex-wrap gap-2">{medications.map((medication) => <span key={medication} className="rounded-md bg-rose-500/15 px-2 py-1 text-xs font-bold text-rose-300">{medication} <button type="button" onClick={() => setMedications((current) => current.filter((item) => item !== medication))} aria-label={`Remove ${medication}`}>&times;</button></span>)}</div>
          <div className="space-y-2"><div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Medication catalog</div>{catalog.medications.slice(0, 6).map((item) => <button key={item.name} type="button" onClick={() => addMedication(item.name)} className="mr-2 mb-2 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-2 text-left text-xs text-slate-300 hover:border-rose-400"><strong className="text-white">{item.name}</strong><span className="ml-2 text-slate-500">{item.className}</span></button>)}</div>
          <button type="button" onClick={runSafetyCheck} disabled={!selectedPatientId || loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"><ShieldCheck className="h-4 w-4" />{loading ? 'Checking patient safety...' : 'Run allergy & interaction check'}</button>
        </div>
      </section>

      {safety && <section className={`rounded-2xl border p-5 ${safety.hasWarnings ? 'border-rose-500/40 bg-rose-950/30' : 'border-emerald-500/30 bg-emerald-950/20'}`}><div className="mb-4 flex items-center gap-2">{safety.hasWarnings ? <AlertTriangle className="h-5 w-5 text-rose-400" /> : <CheckCircle2 className="h-5 w-5 text-emerald-400" />}<h2 className="font-bold text-white">Clinical safety result</h2></div>{safety.alerts.length ? <div className="space-y-3">{safety.alerts.map((alert) => <div key={alert.id} className="flex gap-3 rounded-xl border border-rose-400/20 bg-slate-950/50 p-3"><XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" /><div><div className="text-sm font-bold text-rose-200">{alert.title} <span className="ml-2 rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] uppercase">{alert.severity}</span></div><p className="mt-1 text-xs text-slate-300">{alert.message}</p></div></div>)}</div> : <p className="text-sm text-emerald-200">No allergy or interaction alerts were identified for the selected medicines. Continue clinical review before signing.</p>}</section>}
    </div>
  );
}
