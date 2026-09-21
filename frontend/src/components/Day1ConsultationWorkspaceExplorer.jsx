import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { consultationAPI, patientsAPI, doctorRosterAPI } from '../services/api';
import {
  Stethoscope,
  Heart,
  Activity,
  AlertTriangle,
  ShieldAlert,
  UserCheck,
  Clock,
  CheckCircle2,
  FileText,
  Search,
  RefreshCw,
  Droplet,
  Thermometer,
  Wind,
  Weight,
  Phone,
  Calendar,
  Sparkles,
  Play,
  Layers,
  ChevronRight,
  Eye,
  X,
  History,
  Pill,
  AlertOctagon,
} from 'lucide-react';

export const Day1ConsultationWorkspaceExplorer = () => {
  const { user, isAuthenticated, role } = useAuth();

  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [activeSnapshot, setActiveSnapshot] = useState(null);
  const [worklist, setWorklist] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingSnapshot, setLoadingSnapshot] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      loadPatientSnapshot(selectedPatientId);
    }
  }, [selectedPatientId]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [patsRes, worklistRes, statsRes] = await Promise.all([
        patientsAPI.getAll({ limit: 50 }),
        consultationAPI.getDoctorWorklist().catch(() => null),
        consultationAPI.getStats().catch(() => null),
      ]);

      if (patsRes && patsRes.success) {
        setPatients(patsRes.patients || []);
        if (patsRes.patients?.length > 0 && !selectedPatientId) {
          setSelectedPatientId(patsRes.patients[0].id);
        }
      }
      if (worklistRes && worklistRes.success) {
        setWorklist(worklistRes);
      }
      if (statsRes && statsRes.success) {
        setStats(statsRes);
      }
    } catch (e) {
      console.error('Consultation workspace load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientSnapshot = async (patId) => {
    setLoadingSnapshot(true);
    try {
      const res = await consultationAPI.getActivePatientSnapshot(patId);
      if (res && res.success) {
        setActiveSnapshot(res);
      }
    } catch (e) {
      console.error('Snapshot load error:', e);
    } finally {
      setLoadingSnapshot(false);
    }
  };

  const handleStartEncounter = async (appointmentId, patientId) => {
    try {
      const res = await consultationAPI.startEncounter({
        appointmentId,
        patientId,
      });

      if (res && res.success) {
        setActionSuccess(res.message);
        loadInitialData();
        if (patientId) loadPatientSnapshot(patientId);
        setTimeout(() => setActionSuccess(null), 4000);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const p = activeSnapshot?.patient;
  const v = activeSnapshot?.latestVitals;
  const vAssess = activeSnapshot?.vitalsAssessment;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl border border-teal-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/20 border border-teal-400/30 rounded-full text-xs font-semibold text-teal-300 mb-2">
              <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
              Module 3 &bull; Day 1 Deliverable
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Doctor Consultation UI & Clinical EHR Workspace
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Physician consultation workstation, 360° patient electronic health record, real-time vitals radar, critical allergy & drug warning banners, and clinical encounter management.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setHistoryDrawerOpen(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow"
            >
              <History className="w-4 h-4" />
              <span>Patient History Drawer</span>
            </button>

            <button
              onClick={loadInitialData}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl"
              title="Refresh Workspace"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-400' : ''}`} />
            </button>
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

      {/* 2. Critical Allergy & Clinical Warning Alert Banner */}
      {p?.hasCriticalAllergies && (
        <div className="p-4 bg-gradient-to-r from-red-950/80 via-red-900/60 to-slate-900 border-2 border-red-500 rounded-2xl shadow-xl flex items-center justify-between text-red-200 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600/30 rounded-xl">
              <AlertOctagon className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>CRITICAL CLINICAL ALLERGY WARNING</span>
              </div>
              <div className="text-sm font-black text-white mt-0.5">
                Known Drug Allergies: {p.allergies}
              </div>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 bg-red-600 text-white font-bold rounded-lg uppercase">
            High Anaphylaxis Risk
          </span>
        </div>
      )}

      {/* 3. Patient Selector & Quick Overview Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <label className="text-xs font-bold text-slate-300 whitespace-nowrap">
            Active Clinical Patient:
          </label>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none flex-1 max-w-md"
          >
            {patients.map((pat) => (
              <option key={pat.id} value={pat.id}>
                {pat.firstName} {pat.lastName} — ({pat.mrn}) — Blood: {pat.bloodGroup || 'N/A'} — Age: {new Date().getFullYear() - new Date(pat.dateOfBirth).getFullYear()}y
              </option>
            ))}
          </select>
        </div>

        {p && (
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="px-2.5 py-1 bg-slate-800 rounded-lg border border-slate-700 font-mono text-cyan-300 font-bold">
              {p.mrn}
            </span>
            <span className="px-2.5 py-1 bg-slate-800 rounded-lg border border-slate-700">
              Gender: <strong className="text-white">{p.gender}</strong>
            </span>
            <span className="px-2.5 py-1 bg-slate-800 rounded-lg border border-slate-700">
              Blood: <strong className="text-red-400">{p.bloodGroup}</strong>
            </span>
          </div>
        )}
      </div>

      {/* 4. 2-Column Clinical Layout: Patient 360° EHR (Left) & Vitals Radar / Queue (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 360° EHR Encounter Snapshot (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Patient Profile Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-400" />
                360° Electronic Health Record (EHR)
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold">
                Encounter Active
              </span>
            </div>

            {loadingSnapshot ? (
              <div className="py-12 text-center text-xs text-slate-500">Loading patient snapshot...</div>
            ) : p ? (
              <div className="space-y-4 text-xs">
                {/* Demographics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 block text-[10px]">Full Name</span>
                    <strong className="text-white text-sm">{p.fullName}</strong>
                  </div>
                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 block text-[10px]">Age & Gender</span>
                    <strong className="text-white text-sm">{p.age} years &bull; {p.gender}</strong>
                  </div>
                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 block text-[10px]">Blood Group</span>
                    <strong className="text-red-400 text-sm font-mono">{p.bloodGroup}</strong>
                  </div>
                </div>

                {/* Chronic Conditions & Medical Baseline */}
                <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300">Medical Baseline & Chronic Diagnoses:</span>
                  </div>
                  <div className="text-slate-300 text-xs leading-relaxed">
                    {p.medicalHistory || 'No documented chronic illnesses.'}
                  </div>
                  {p.chronicConditions && (
                    <div className="inline-block px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[11px] font-semibold">
                      Chronic Tag: {p.chronicConditions}
                    </div>
                  )}
                </div>

                {/* Past Consultations Summary */}
                <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300">Recent Consultation Encounter:</span>
                    <button
                      onClick={() => setHistoryDrawerOpen(true)}
                      className="text-[11px] text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1"
                    >
                      <span>View All ({activeSnapshot.consultationHistory?.length || 0})</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {activeSnapshot.consultationHistory?.length > 0 ? (
                    <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-teal-300">
                          {activeSnapshot.consultationHistory[0].assessment}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(activeSnapshot.consultationHistory[0].createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        <strong>Plan:</strong> {activeSnapshot.consultationHistory[0].plan}
                      </p>
                    </div>
                  ) : (
                    <div className="text-slate-500 text-center py-2">No previous consultation notes on file.</div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Right Column: Live Triage Vitals Radar & Outpatient Worklist (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Triage Vitals Radar Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-pink-400" />
                Live Vitals Radar & Triage Status
              </h3>
              {vAssess && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    vAssess.level === 'RED'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : vAssess.level === 'AMBER'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {vAssess.level}
                </span>
              )}
            </div>

            {v ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 block text-[10px]">Blood Pressure</span>
                    <strong className="text-white text-sm font-mono">{v.systolicBp}/{v.diastolicBp}</strong>
                    <span className="text-[9px] text-slate-500 block">mmHg</span>
                  </div>

                  <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 block text-[10px]">Pulse Rate</span>
                    <strong className="text-pink-400 text-sm font-mono">{v.pulseRate}</strong>
                    <span className="text-[9px] text-slate-500 block">bpm</span>
                  </div>

                  <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 block text-[10px]">Oxygen (SpO2)</span>
                    <strong className="text-cyan-400 text-sm font-mono">{v.oxygenSaturation}%</strong>
                    <span className="text-[9px] text-slate-500 block">Saturation</span>
                  </div>

                  <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 block text-[10px]">Temperature</span>
                    <strong className="text-amber-400 text-sm font-mono">{v.temperature}°F</strong>
                    <span className="text-[9px] text-slate-500 block">Fahrenheit</span>
                  </div>
                </div>

                <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Auto-BMI Assessment:</span>
                  <span className="font-bold text-teal-300 font-mono">
                    {v.bmi || '---'} kg/m²
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-500">
                No pre-consultation vitals recorded yet.
              </div>
            )}
          </div>

          {/* Today's Outpatient Worklist */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-400" />
                Today's Doctor Worklist
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold">
                {worklist?.totalAppointments || 0} Total
              </span>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 text-xs">
              {worklist?.waitingQueue?.length > 0 ? (
                worklist.waitingQueue.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-xl flex items-center justify-between hover:border-slate-600 transition"
                  >
                    <div>
                      <div className="font-bold text-white">
                        {item.patient?.firstName} {item.patient?.lastName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {item.timeSlot} &bull; Token: <strong className="text-teal-400">{item.queueToken?.tokenCode || '---'}</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartEncounter(item.id, item.patient?.id)}
                      className="px-2.5 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow transition"
                    >
                      <Play className="w-3 h-3" />
                      <span>Start Visit</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-500">No waiting patients in queue.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Patient Longitudinal History Quick-Drawer Modal */}
      {historyDrawerOpen && p && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-end">
          <div className="bg-slate-900 border-l border-slate-700 max-w-lg w-full h-full p-6 shadow-2xl space-y-4 overflow-y-auto animate-in slide-in-from-right">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-teal-400" />
                  Longitudinal Clinical History Drawer
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  {p.fullName} ({p.mrn})
                </span>
              </div>
              <button onClick={() => setHistoryDrawerOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {activeSnapshot?.consultationHistory?.length > 0 ? (
                activeSnapshot.consultationHistory.map((note, idx) => (
                  <div
                    key={note.id}
                    className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-teal-300 text-sm">
                        Visit #{activeSnapshot.consultationHistory.length - idx} &bull; {note.assessment}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-slate-300">
                      <strong>Subjective:</strong> {note.subjective}
                    </p>
                    <p className="text-slate-300">
                      <strong>Objective:</strong> {note.objective}
                    </p>
                    <p className="text-slate-300">
                      <strong>Plan & Advice:</strong> {note.plan}
                    </p>
                    {note.icd10Codes && (
                      <span className="inline-block px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded font-mono text-[10px]">
                        ICD-10: {note.icd10Codes}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-500">No previous consultation notes on record.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
