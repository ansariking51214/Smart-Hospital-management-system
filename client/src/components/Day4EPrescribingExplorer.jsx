import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, FilePlus2, Pill, ShieldCheck } from 'lucide-react';
import { consultationAPI, patientsAPI } from '../services/api';

const emptyItem = { medicineName: '', dosage: '', frequency: 'Once daily', timing: 'After meals', duration: '5 days', instructions: '' };

export function Day4EPrescribingExplorer() {
  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState('');
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [advice, setAdvice] = useState('');
  const [safety, setSafety] = useState(null);
  const [issued, setIssued] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    patientsAPI.getAll({ limit: 50 }).then((response) => {
      setPatients(response.patients || []);
      if (response.patients?.[0]) setPatientId(response.patients[0].id);
    }).catch((err) => setError(err.response?.data?.message || err.message));
  }, []);

  const updateItem = (index, field, value) => setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  const removeItem = (index) => setItems((current) => current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index));

  const issuePrescription = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSafety(null);
    setIssued(null);
    try {
      const response = await consultationAPI.issuePrescription({ patientId, items, generalAdvice: advice });
      setSafety(response.safety);
      setIssued(response.prescription);
      setItems([{ ...emptyItem }]);
      setAdvice('');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setSafety(err.response?.data?.safety || null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-teal-800/50 bg-gradient-to-r from-teal-950 via-slate-900 to-cyan-950 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div><div className="mb-2 inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-500/15 px-3 py-1 text-xs font-semibold text-teal-200"><FilePlus2 className="h-3.5 w-3.5" /> Module 3 &bull; Day 4 Deliverable</div><h1 className="text-2xl font-bold">Electronic Prescribing Engine</h1><p className="mt-1 max-w-2xl text-sm text-slate-300">Build a structured prescription, run the Day 3 safety gate, and issue an auditable prescription for the selected patient.</p></div>
          <div className="rounded-xl border border-white/10 bg-white/10 p-4 text-right"><div className="text-xs uppercase tracking-wider text-teal-200">Prescription state</div><div className="mt-1 text-lg font-bold">{issued?.prescriptionNumber || 'Draft'}</div></div>
        </div>
      </section>

      {error && <div className="rounded-xl border border-rose-500/40 bg-rose-950/50 p-3 text-sm text-rose-200">{error}</div>}
      <form onSubmit={issuePrescription} className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Patient record<select required value={patientId} onChange={(event) => setPatientId(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"><option value="">Select a patient</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.mrn} - {patient.firstName} {patient.lastName}</option>)}</select></label>
        <div className="flex items-center justify-between"><h2 className="flex items-center gap-2 font-bold text-white"><Pill className="h-5 w-5 text-teal-400" /> Medication orders</h2><button type="button" onClick={() => setItems((current) => [...current, { ...emptyItem }])} className="rounded-lg border border-teal-500/40 px-3 py-2 text-xs font-bold text-teal-300 hover:bg-teal-500/10">Add medication</button></div>
        <div className="space-y-3">{items.map((item, index) => <div key={index} className="grid gap-2 rounded-xl border border-slate-800 bg-slate-950/50 p-3 md:grid-cols-6"><input required value={item.medicineName} onChange={(event) => updateItem(index, 'medicineName', event.target.value)} placeholder="Medicine name" className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white md:col-span-2" /><input required value={item.dosage} onChange={(event) => updateItem(index, 'dosage', event.target.value)} placeholder="Dosage e.g. 500mg" className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" /><input required value={item.frequency} onChange={(event) => updateItem(index, 'frequency', event.target.value)} placeholder="Frequency" className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" /><input required value={item.duration} onChange={(event) => updateItem(index, 'duration', event.target.value)} placeholder="Duration" className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" /><button type="button" onClick={() => removeItem(index)} className="rounded-lg border border-slate-700 px-2 text-xs text-slate-400 hover:text-rose-300">Remove</button><input value={item.instructions} onChange={(event) => updateItem(index, 'instructions', event.target.value)} placeholder="Patient instructions (optional)" className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white md:col-span-5" /></div>)}</div>
        <textarea value={advice} onChange={(event) => setAdvice(event.target.value)} placeholder="General advice and follow-up instructions" rows="3" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" />
        <button disabled={loading || !patientId} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"><ShieldCheck className="h-4 w-4" />{loading ? 'Running safety gate...' : 'Check safety and issue prescription'}</button>
      </form>

      {safety && <section className={`rounded-2xl border p-5 ${safety.hasWarnings ? 'border-amber-500/40 bg-amber-950/20' : 'border-emerald-500/30 bg-emerald-950/20'}`}><div className="flex items-center gap-2">{safety.hasWarnings ? <AlertTriangle className="h-5 w-5 text-amber-400" /> : <CheckCircle2 className="h-5 w-5 text-emerald-400" />}<h2 className="font-bold text-white">Safety gate result</h2></div><p className="mt-2 text-sm text-slate-300">{safety.alerts?.length ? safety.alerts.map((alert) => `${alert.severity}: ${alert.title}`).join(' | ') : 'No allergy or interaction alerts were identified.'}</p></section>}
      {issued && <section className="rounded-2xl border border-teal-500/30 bg-teal-950/20 p-5"><h2 className="font-bold text-teal-200">{issued.prescriptionNumber} issued</h2><p className="mt-1 text-sm text-slate-300">{issued.items.length} medication(s) recorded for {issued.patient.firstName} {issued.patient.lastName}.</p></section>}
    </div>
  );
}