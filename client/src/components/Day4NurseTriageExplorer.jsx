import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { triageAPI, patientsAPI, doctorRosterAPI } from '../services/api';
import {
  Activity,
  Heart,
  Thermometer,
  Wind,
  Droplet,
  Weight,
  Ruler,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Users,
  Search,
  RefreshCw,
  PlusCircle,
  FileText,
  Clock,
  Flame,
  X,
  Stethoscope,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export const Day4NurseTriageExplorer = () => {
  const { user, isAuthenticated, role } = useAuth();

  // Intake Form State
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [triageQueue, setTriageQueue] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Form Inputs
  const [form, setForm] = useState({
    systolicBp: 120,
    diastolicBp: 80,
    pulseRate: 72,
    temperature: 98.6,
    respiratoryRate: 16,
    oxygenSaturation: 98,
    heightCm: 172,
    weightKg: 68,
    triageNotes: 'Routine outpatient pre-consultation vital signs check.',
  });

  // Longitudinal History State
  const [historyPatientId, setHistoryPatientId] = useState('');
  const [patientHistory, setPatientHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (historyPatientId) {
      loadHistory(historyPatientId);
    }
  }, [historyPatientId]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [patsRes, queueRes, statsRes] = await Promise.all([
        patientsAPI.getAll({ limit: 50 }),
        triageAPI.getQueue().catch(() => null),
        triageAPI.getStats().catch(() => null),
      ]);

      if (patsRes && patsRes.success) {
        setPatients(patsRes.patients || []);
        if (patsRes.patients?.length > 0 && !selectedPatient) {
          setSelectedPatient(patsRes.patients[0]);
          setHistoryPatientId(patsRes.patients[0].id);
        }
      }
      if (queueRes && queueRes.success) {
        setTriageQueue(queueRes);
      }
      if (statsRes && statsRes.success) {
        setStats(statsRes);
      }
    } catch (e) {
      console.error('Triage initial load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (patId) => {
    setLoadingHistory(true);
    try {
      const res = await triageAPI.getPatientHistory(patId);
      if (res && res.success) {
        setPatientHistory(res);
      }
    } catch (e) {
      console.error('History load error:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Live Auto-BMI Calculation
  const computedBmi =
    form.heightCm && form.weightKg
      ? (Number(form.weightKg) / Math.pow(Number(form.heightCm) / 100, 2)).toFixed(1)
      : '---';

  const getBmiCategory = (bmiVal) => {
    const val = Number(bmiVal);
    if (!val || isNaN(val)) return { label: 'Unrecorded', color: 'text-slate-400' };
    if (val < 18.5) return { label: 'Underweight', color: 'text-blue-400' };
    if (val <= 24.9) return { label: 'Normal Weight', color: 'text-emerald-400' };
    if (val <= 29.9) return { label: 'Overweight', color: 'text-amber-400' };
    return { label: 'Obese', color: 'text-red-400' };
  };

  // Live Early Warning Score (NEWS / Triage Severity Flag)
  const getLiveTriageRisk = () => {
    const sys = Number(form.systolicBp);
    const dia = Number(form.diastolicBp);
    const pulse = Number(form.pulseRate);
    const temp = Number(form.temperature);
    const spo2 = Number(form.oxygenSaturation);

    if (spo2 < 90 || sys >= 180 || dia >= 110 || pulse >= 130 || temp >= 103.5) {
      return {
        level: 'RED',
        label: 'CRITICAL ALERT (Red Level)',
        desc: 'Immediate Physician Attention Required (Severe Hypoxia / Hypertensive Crisis)',
        bg: 'bg-red-500/20 text-red-300 border-red-500/40',
        badgeBg: 'bg-red-600 text-white',
      };
    }
    if (spo2 <= 94 || sys >= 140 || dia >= 90 || pulse >= 100 || temp >= 100.4) {
      return {
        level: 'AMBER',
        label: 'URGENT WATCHLIST (Amber Level)',
        desc: 'Elevated Physiological Parameters (Mild Hypoxemia / Stage-1 HTN / Pyrexia)',
        bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        badgeBg: 'bg-amber-600 text-white',
      };
    }
    return {
      level: 'GREEN',
      label: 'STABLE / NORMAL (Green Level)',
      desc: 'All Vital Signs within Standard Clinical Reference Baseline',
      bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      badgeBg: 'bg-emerald-600 text-white',
    };
  };

  const currentRisk = getLiveTriageRisk();
  const currentBmi = getBmiCategory(computedBmi);

  const handleSubmitVitals = async (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      alert('Please select a patient first.');
      return;
    }

    try {
      const res = await triageAPI.recordVitals({
        patientId: selectedPatient.id,
        ...form,
      });

      if (res && res.success) {
        setActionSuccess(`Vitals recorded for ${selectedPatient.firstName} (${currentRisk.label})`);
        loadInitialData();
        if (selectedPatient.id === historyPatientId) {
          loadHistory(selectedPatient.id);
        }
        setTimeout(() => setActionSuccess(null), 4000);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleSelectQueuePatient = (qItem) => {
    const pat = patients.find((p) => p.id === qItem.patientId);
    if (pat) {
      setSelectedPatient(pat);
      setHistoryPatientId(pat.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl border border-teal-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/20 border border-teal-400/30 rounded-full text-xs font-semibold text-teal-300 mb-2">
              <Activity className="w-3.5 h-3.5 text-teal-400" />
              Module 2 &bull; Day 4 Deliverable
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Nurse Vitals Triage Desk & Early Warning System
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Pre-consultation clinical intake, auto-BMI computation, NEWS physiological early warning score, triage risk categorization (Green/Amber/Red), and longitudinal vitals tracking.
            </p>
          </div>

          {/* Real-time Triage Counters */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-3 text-center min-w-[90px]">
              <span className="text-[10px] text-red-400 font-bold block uppercase">Red Alerts</span>
              <span className="text-xl font-black text-red-400">{stats?.redAlerts || 0}</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-3 text-center min-w-[90px]">
              <span className="text-[10px] text-amber-400 font-bold block uppercase">Amber Alerts</span>
              <span className="text-xl font-black text-amber-400">{stats?.amberAlerts || 0}</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-3 text-center min-w-[90px]">
              <span className="text-[10px] text-emerald-400 font-bold block uppercase">Stable</span>
              <span className="text-xl font-black text-emerald-400">{stats?.greenStable || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Notification */}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300 font-medium animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 2. Main 2-Column Interface: Vitals Intake Form (Left) & Triage Queue / History (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Clinical Vitals Intake Form (6 Cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-400" />
              Pre-Consultation Vitals Intake Form
            </h3>
            <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded font-mono font-bold">
              Nurse Desk
            </span>
          </div>

          <form onSubmit={handleSubmitVitals} className="space-y-4">
            {/* Patient Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Select Patient (or search by MRN):
              </label>
              <select
                required
                value={selectedPatient?.id || ''}
                onChange={(e) => {
                  const pat = patients.find((p) => p.id === e.target.value);
                  setSelectedPatient(pat);
                  if (pat) setHistoryPatientId(pat.id);
                }}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} — ({p.mrn}) — Blood: {p.bloodGroup || 'N/A'} — DOB: {new Date(p.dateOfBirth).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            {/* Live Triage Severity Assessment Box */}
            <div className={`p-3.5 rounded-xl border space-y-1.5 transition ${currentRisk.bg}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  {currentRisk.level === 'RED' ? (
                    <AlertOctagon className="w-4 h-4 text-red-400" />
                  ) : currentRisk.level === 'AMBER' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  {currentRisk.label}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${currentRisk.badgeBg}`}>
                  Triage: {currentRisk.level}
                </span>
              </div>
              <p className="text-[11px] opacity-90">{currentRisk.desc}</p>
            </div>

            {/* Vitals Form Grid (2 Columns) */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Blood Pressure Systolic */}
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 space-y-1">
                <label className="text-slate-400 flex items-center gap-1 font-semibold">
                  <Heart className="w-3.5 h-3.5 text-red-400" /> Systolic BP (mmHg)
                </label>
                <input
                  type="number"
                  required
                  min="50"
                  max="260"
                  value={form.systolicBp}
                  onChange={(e) => setForm({ ...form, systolicBp: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold"
                />
                <span className="text-[10px] text-slate-500">Normal: 90 - 120 mmHg</span>
              </div>

              {/* Blood Pressure Diastolic */}
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 space-y-1">
                <label className="text-slate-400 flex items-center gap-1 font-semibold">
                  <Heart className="w-3.5 h-3.5 text-red-400" /> Diastolic BP (mmHg)
                </label>
                <input
                  type="number"
                  required
                  min="30"
                  max="160"
                  value={form.diastolicBp}
                  onChange={(e) => setForm({ ...form, diastolicBp: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold"
                />
                <span className="text-[10px] text-slate-500">Normal: 60 - 80 mmHg</span>
              </div>

              {/* Pulse Rate */}
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 space-y-1">
                <label className="text-slate-400 flex items-center gap-1 font-semibold">
                  <Activity className="w-3.5 h-3.5 text-pink-400" /> Pulse Rate (bpm)
                </label>
                <input
                  type="number"
                  required
                  min="30"
                  max="240"
                  value={form.pulseRate}
                  onChange={(e) => setForm({ ...form, pulseRate: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold"
                />
                <span className="text-[10px] text-slate-500">Normal: 60 - 100 bpm</span>
              </div>

              {/* Oxygen Saturation (SpO2) */}
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 space-y-1">
                <label className="text-slate-400 flex items-center gap-1 font-semibold">
                  <Droplet className="w-3.5 h-3.5 text-cyan-400" /> Oxygen Saturation (SpO2 %)
                </label>
                <input
                  type="number"
                  required
                  min="50"
                  max="100"
                  step="0.1"
                  value={form.oxygenSaturation}
                  onChange={(e) => setForm({ ...form, oxygenSaturation: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold"
                />
                <span className="text-[10px] text-slate-500">Normal: 95% - 100%</span>
              </div>

              {/* Body Temperature */}
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 space-y-1">
                <label className="text-slate-400 flex items-center gap-1 font-semibold">
                  <Thermometer className="w-3.5 h-3.5 text-amber-400" /> Temperature (°F)
                </label>
                <input
                  type="number"
                  required
                  min="85"
                  max="110"
                  step="0.1"
                  value={form.temperature}
                  onChange={(e) => setForm({ ...form, temperature: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold"
                />
                <span className="text-[10px] text-slate-500">Normal: 97.5°F - 99.0°F</span>
              </div>

              {/* Respiratory Rate */}
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 space-y-1">
                <label className="text-slate-400 flex items-center gap-1 font-semibold">
                  <Wind className="w-3.5 h-3.5 text-indigo-400" /> Respiratory Rate (bpm)
                </label>
                <input
                  type="number"
                  min="6"
                  max="60"
                  value={form.respiratoryRate}
                  onChange={(e) => setForm({ ...form, respiratoryRate: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold"
                />
                <span className="text-[10px] text-slate-500">Normal: 12 - 20 breaths/min</span>
              </div>

              {/* Height */}
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 space-y-1">
                <label className="text-slate-400 flex items-center gap-1 font-semibold">
                  <Ruler className="w-3.5 h-3.5 text-teal-400" /> Height (cm)
                </label>
                <input
                  type="number"
                  min="30"
                  max="250"
                  value={form.heightCm}
                  onChange={(e) => setForm({ ...form, heightCm: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold"
                />
              </div>

              {/* Weight & Auto BMI */}
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-slate-400 flex items-center gap-1 font-semibold">
                    <Weight className="w-3.5 h-3.5 text-teal-400" /> Weight (kg)
                  </label>
                  <span className={`text-[10px] font-bold ${currentBmi.color}`}>
                    BMI: {computedBmi} ({currentBmi.label})
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="300"
                  step="0.1"
                  value={form.weightKg}
                  onChange={(e) => setForm({ ...form, weightKg: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold"
                />
              </div>
            </div>

            {/* Triage Clinical Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Nurse Triage Clinical Notes:
              </label>
              <textarea
                rows="2"
                value={form.triageNotes}
                onChange={(e) => setForm({ ...form, triageNotes: e.target.value })}
                placeholder="Document patient presenting condition, allergies check, or urgent nursing concerns..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition"
            >
              <Activity className="w-4 h-4" />
              <span>Record Vital Signs & Confirm Triage</span>
            </button>
          </form>
        </div>

        {/* Right Column: Triage Waiting Queue & Longitudinal History (6 Cols) */}
        <div className="lg:col-span-6 space-y-5">
          {/* 1. Triage Waiting Desk Queue */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Pre-Consultation Triage Queue
                </h3>
                <span className="text-[11px] text-slate-400">
                  Patients waiting for initial vitals screening
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                {triageQueue?.pendingTriageCount || 0} Pending
              </span>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 text-xs">
              {triageQueue?.pendingQueue?.length > 0 ? (
                triageQueue.pendingQueue.map((q) => (
                  <div
                    key={q.appointmentId}
                    className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-xl flex items-center justify-between hover:border-slate-600 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{q.patientName}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300">
                          {q.patientMrn}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300">
                          {q.tokenCode}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Dr. {q.doctorName} &bull; {q.department} ({q.timeSlot})
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectQueuePatient(q)}
                      className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow transition"
                    >
                      <span>Triage</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-500">
                  All checked-in patients have completed nurse triage screening!
                </div>
              )}
            </div>
          </div>

          {/* 2. Patient Longitudinal Vitals History Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-400" />
                  Longitudinal Vitals Trend & History
                </h3>
                <span className="text-[11px] text-slate-400">
                  Time-series records for {patientHistory?.patient?.fullName || 'Selected Patient'}
                </span>
              </div>
              <button
                onClick={() => historyPatientId && loadHistory(historyPatientId)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                title="Refresh History"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin text-teal-400' : ''}`} />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 text-xs">
              {loadingHistory ? (
                <div className="py-8 text-center text-slate-500">Loading history...</div>
              ) : patientHistory?.vitals?.length > 0 ? (
                patientHistory.vitals.map((v) => (
                  <div
                    key={v.id}
                    className="p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-mono text-[11px]">
                          {new Date(v.recordedAt).toLocaleString()}
                        </span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            v.triageAssessment?.level === 'RED'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : v.triageAssessment?.level === 'AMBER'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {v.triageAssessment?.level || 'GREEN'}
                        </span>
                      </div>
                      <span className="text-[10px] text-teal-300 font-mono">
                        BMI: {v.bmi || '---'} ({v.bmiCategory})
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center text-[11px] bg-slate-900/60 p-2 rounded-lg">
                      <div>
                        <span className="text-slate-400 block text-[9px]">BP</span>
                        <strong className="text-white font-mono">{v.systolicBp}/{v.diastolicBp}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px]">Pulse</span>
                        <strong className="text-white font-mono">{v.pulseRate} bpm</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px]">SpO2</span>
                        <strong className="text-white font-mono">{v.oxygenSaturation}%</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px]">Temp</span>
                        <strong className="text-white font-mono">{v.temperature}°F</strong>
                      </div>
                    </div>

                    {v.triageNotes && (
                      <p className="text-[11px] text-slate-400 italic">
                        &ldquo;{v.triageNotes}&rdquo;
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No previous vital signs on record for this patient.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
