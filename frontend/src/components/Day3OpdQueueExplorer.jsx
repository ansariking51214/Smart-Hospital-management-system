import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { opdQueueAPI, doctorRosterAPI, patientsAPI } from '../services/api';
import {
  Ticket,
  Users,
  Volume2,
  Clock,
  Play,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Stethoscope,
  Building2,
  RefreshCw,
  PlusCircle,
  X,
  SkipForward,
  RotateCcw,
  Sparkles,
  Tv,
  Monitor,
  Flame,
  ArrowRight,
} from 'lucide-react';

export const Day3OpdQueueExplorer = () => {
  const { user, isAuthenticated, role } = useAuth();

  const [queueBoard, setQueueBoard] = useState(null);
  const [stats, setStats] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [loading, setLoading] = useState(true);
  const [callingAlert, setCallingAlert] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Walk-in Modal State
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [walkInForm, setWalkInForm] = useState({
    doctorId: '',
    patientId: '',
    reasonForVisit: 'General OPD Consultation',
  });

  // Display Mode: 'desk' (Staff Control Desk) vs 'tv' (Public Waiting Area TV Board)
  const [viewMode, setViewMode] = useState('desk');

  useEffect(() => {
    loadDoctorsAndPatients();
  }, []);

  useEffect(() => {
    loadQueueData();
    const interval = setInterval(loadQueueData, 8000); // 8s auto-refresh for live board
    return () => clearInterval(interval);
  }, [selectedDoctorId, selectedDeptId]);

  const loadDoctorsAndPatients = async () => {
    try {
      const [docsRes, patsRes] = await Promise.all([
        doctorRosterAPI.getAll(),
        patientsAPI.getAll({ limit: 50 }),
      ]);
      if (docsRes.success) {
        setDoctors(docsRes.doctors || []);
        if (docsRes.doctors?.length > 0 && !walkInForm.doctorId) {
          setWalkInForm((prev) => ({ ...prev, doctorId: docsRes.doctors[0].id }));
        }
      }
      if (patsRes.success) {
        setPatients(patsRes.patients || []);
        if (patsRes.patients?.length > 0 && !walkInForm.patientId) {
          setWalkInForm((prev) => ({ ...prev, patientId: patsRes.patients[0].id }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadQueueData = async () => {
    try {
      const [boardRes, statsRes] = await Promise.all([
        opdQueueAPI.getLiveBoard({
          doctorId: selectedDoctorId || undefined,
          departmentId: selectedDeptId || undefined,
        }),
        opdQueueAPI.getStats().catch(() => null),
      ]);

      if (boardRes && boardRes.success) {
        setQueueBoard(boardRes);
      }
      if (statsRes && statsRes.success) {
        setStats(statsRes);
      }
    } catch (err) {
      console.error('Queue load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCallNext = async (doctorId) => {
    const targetDocId = doctorId || selectedDoctorId || doctors[0]?.id;
    if (!targetDocId) return;

    try {
      const res = await opdQueueAPI.callNext(targetDocId);
      if (res.success) {
        if (res.isQueueEmpty) {
          alert(res.message);
        } else {
          setCallingAlert(res.calledToken);
          setActionSuccess(res.message);
          loadQueueData();
          setTimeout(() => setCallingAlert(null), 8000);
          setTimeout(() => setActionSuccess(null), 4000);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleUpdateStatus = async (tokenId, newStatus) => {
    try {
      const res = await opdQueueAPI.updateStatus(tokenId, newStatus);
      if (res.success) {
        setActionSuccess(`Token status updated to ${newStatus}`);
        loadQueueData();
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleIssueWalkIn = async (e) => {
    e.preventDefault();
    try {
      const res = await opdQueueAPI.issueWalkIn(walkInForm);
      if (res.success) {
        setActionSuccess(`Token ${res.token?.tokenCode} issued!`);
        setWalkInModalOpen(false);
        loadQueueData();
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
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
              <Ticket className="w-3.5 h-3.5 text-teal-400" />
              Module 2 &bull; Day 3 Deliverable
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              OPD Live Queue & Token Display System
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Real-time patient calling board, sequential token numbering, live waiting area display, and physician consultation triage desk.
            </p>
          </div>

          {/* Action Controls: Switch TV Mode vs Desk & Issue Walk-in */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode(viewMode === 'desk' ? 'tv' : 'desk')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition ${
                viewMode === 'tv'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-600/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              <Tv className="w-4 h-4" />
              <span>{viewMode === 'tv' ? 'Staff Control View' : 'Waiting Area TV Display'}</span>
            </button>

            <button
              onClick={() => setWalkInModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-2 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Issue Walk-in Token</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chime / Audio Alert Banner when token called */}
      {callingAlert && (
        <div className="p-4 bg-gradient-to-r from-teal-600 to-indigo-700 text-white rounded-2xl shadow-2xl flex items-center justify-between animate-bounce border border-teal-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl">
              <Volume2 className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-teal-200">
                🔔 Now Calling Patient
              </div>
              <div className="text-lg font-black tracking-wide">
                TOKEN {callingAlert.tokenCode} — {callingAlert.patientFullName} &rarr; Proceed to{' '}
                {callingAlert.roomNumber}
              </div>
            </div>
          </div>
          <button onClick={() => setCallingAlert(null)} className="p-1 hover:bg-white/20 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Success Notification */}
      {actionSuccess && !callingAlert && (
        <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300 font-medium animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 2. Live OPD Queue Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Now Serving / Called</span>
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-teal-400 mt-2">
            {queueBoard?.counts?.currentlyServing || 0}
          </div>
          <span className="text-[11px] text-teal-300 font-medium mt-1 inline-block">
            In Doctor's Room
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Waiting in Line</span>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-400 mt-2">
            {queueBoard?.counts?.waiting || 0}
          </div>
          <span className="text-[11px] text-slate-400 font-medium mt-1 inline-block">
            Est. Wait: ~{queueBoard?.counts?.waiting ? queueBoard.counts.waiting * 15 : 0} mins
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Completed Consultations</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-2">
            {queueBoard?.counts?.completed || 0}
          </div>
          <span className="text-[11px] text-emerald-400 font-medium mt-1 inline-block">
            Successfully Checked Out
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Tokens Today</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-indigo-400 mt-2">
            {queueBoard?.totalTokens || 0}
          </div>
          <span className="text-[11px] text-indigo-300 font-medium mt-1 inline-block">
            Online + Walk-in
          </span>
        </div>
      </div>

      {/* 3. Doctor Filter & Quick Call Strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <label className="text-xs font-bold text-slate-300 whitespace-nowrap">
            Physician Desk:
          </label>
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none flex-1 max-w-sm"
          >
            <option value="">All Hospital Departments & Doctors</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                Dr. {d.fullName} ({d.department?.name || 'OPD'} &bull; {d.roomNumber || 'Room 101'})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCallNext()}
            className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition"
          >
            <Volume2 className="w-4 h-4" />
            <span>Call Next Patient</span>
          </button>

          <button
            onClick={loadQueueData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl"
            title="Refresh Live Queue"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4. Display Boards */}
      {viewMode === 'tv' ? (
        /* ================= PUBLIC WAITING AREA TV DISPLAY MODE ================= */
        <div className="space-y-6 animate-in fade-in">
          {/* Top Row: NOW SERVING BIG DISPLAY CARDS */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-teal-400 mb-3 flex items-center gap-2">
              <Tv className="w-4 h-4" /> Public OPD Waiting Hall Screen
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {queueBoard?.currentlyServing?.length > 0 ? (
                queueBoard.currentlyServing.map((serving) => (
                  <div
                    key={serving.id}
                    className="bg-gradient-to-br from-slate-900 via-teal-950/40 to-slate-900 border-2 border-teal-500 rounded-3xl p-6 shadow-2xl space-y-4 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping"></span>
                        NOW SERVING
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-200 border border-teal-400/40 font-mono">
                        {serving.roomNumber}
                      </span>
                    </div>

                    <div className="text-center py-3 bg-black/40 rounded-2xl border border-teal-500/30">
                      <span className="text-[11px] text-slate-400 uppercase font-semibold">
                        Token Number
                      </span>
                      <div className="text-4xl font-black text-teal-300 font-mono tracking-wider mt-1">
                        {serving.tokenCode}
                      </div>
                    </div>

                    <div className="space-y-1 text-center">
                      <h4 className="text-base font-bold text-white truncate">
                        {serving.patientFullName}
                      </h4>
                      <div className="text-xs text-slate-300">
                        Dr. {serving.doctorFullName} &bull;{' '}
                        <span className="text-teal-400">{serving.departmentName}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-500">
                  No patients currently called. Click "Call Next Patient" to page the next person in line.
                </div>
              )}
            </div>
          </div>

          {/* Bottom Table: UPCOMING IN LINE */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Upcoming Patients in Queue (Waiting Hall)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {queueBoard?.waitingQueue?.map((w, idx) => (
                <div
                  key={w.id}
                  className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-black text-amber-300 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">
                      {w.tokenCode}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Wait: {w.estimatedTimeText}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white truncate">
                    {w.patientFullName}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    Dr. {w.doctorFullName} ({w.departmentName})
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ================= STAFF CONTROL DESK VIEW ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in">
          {/* Left 5 Cols: Active Call Desk & Currently Serving */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-teal-400" />
                  Active Room Console
                </h3>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded font-bold uppercase font-mono">
                  Live Desk
                </span>
              </div>

              {queueBoard?.currentlyServing?.length > 0 ? (
                queueBoard.currentlyServing.map((serving) => (
                  <div
                    key={serving.id}
                    className="p-4 bg-teal-950/30 border border-teal-500/40 rounded-xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-black text-teal-300 px-2.5 py-1 rounded bg-teal-500/20 border border-teal-500/40">
                        {serving.tokenCode}
                      </span>
                      <span className="text-xs font-bold text-purple-300">
                        {serving.roomNumber}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-white">
                        {serving.patientFullName}
                      </h4>
                      <div className="text-xs text-slate-400 mt-0.5">
                        MRN: <span className="text-cyan-300 font-mono">{serving.patient?.mrn}</span> &bull; Blood: {serving.patient?.bloodGroup || 'N/A'}
                      </div>
                      <div className="text-xs text-teal-300 mt-1">
                        Doctor: Dr. {serving.doctorFullName}
                      </div>
                    </div>

                    {/* Action Controls for Current Patient */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                      {serving.status === 'CALLED' && (
                        <button
                          onClick={() => handleUpdateStatus(serving.id, 'IN_CONSULTATION')}
                          className="py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Start Consultation</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleUpdateStatus(serving.id, 'COMPLETED')}
                        className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Complete & Check-out</span>
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(serving.id, 'SKIPPED')}
                        className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                      >
                        <SkipForward className="w-3.5 h-3.5" />
                        <span>Skip / No-Show</span>
                      </button>

                      <button
                        onClick={() => handleCallNext(serving.doctorId)}
                        className="py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Call Next</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 bg-slate-800/40 rounded-xl border border-slate-800 text-xs text-slate-500 space-y-3">
                  <p>Room is currently idle. Click below to page the next patient.</p>
                  <button
                    onClick={() => handleCallNext()}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-xs inline-flex items-center gap-2"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Call Next Patient</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right 7 Cols: Waiting Queue & Action Board */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    Waiting Queue Patients ({queueBoard?.waitingQueue?.length || 0})
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Chronological triage line for consultation
                  </span>
                </div>

                <span className="text-xs text-amber-400 font-mono font-bold">
                  Ordered by Token #
                </span>
              </div>

              {/* Waiting List */}
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {queueBoard?.waitingQueue?.length > 0 ? (
                  queueBoard.waitingQueue.map((t, idx) => (
                    <div
                      key={t.id}
                      className="p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-xl hover:border-slate-600 transition flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-black text-amber-300 px-2 py-1 rounded bg-amber-500/20 border border-amber-500/30">
                          {t.tokenCode}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-white">
                            {t.patientFullName}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Dr. {t.doctorFullName} &bull; {t.departmentName} ({t.timeSlot})
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-slate-400 font-mono">
                          Est. Wait: {t.estimatedTimeText}
                        </span>
                        <button
                          onClick={() => handleUpdateStatus(t.id, 'CALLED')}
                          className="px-3 py-1.5 bg-teal-600/20 hover:bg-teal-600 text-teal-300 hover:text-white border border-teal-500/40 rounded-lg text-xs font-bold transition flex items-center gap-1"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-xs text-slate-500">
                    No patients currently waiting in the OPD queue.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Walk-in Token Generator Modal */}
      {walkInModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-teal-400" />
                Issue Walk-in OPD Queue Token
              </h3>
              <button
                onClick={() => setWalkInModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleIssueWalkIn} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Physician *</label>
                <select
                  required
                  value={walkInForm.doctorId}
                  onChange={(e) => setWalkInForm({ ...walkInForm, doctorId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.fullName} — {d.department?.name || 'OPD'} ({d.roomNumber || 'Room 101'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Patient *</label>
                <select
                  required
                  value={walkInForm.patientId}
                  onChange={(e) => setWalkInForm({ ...walkInForm, patientId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.mrn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Chief Complaint / Triage</label>
                <input
                  type="text"
                  required
                  value={walkInForm.reasonForVisit}
                  onChange={(e) => setWalkInForm({ ...walkInForm, reasonForVisit: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setWalkInModalOpen(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-teal-500/20"
                >
                  Issue OPD Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
