import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { appointmentFlowAPI, doctorRosterAPI, patientsAPI } from '../services/api';
import {
  GitPullRequest,
  CheckCircle2,
  Clock,
  UserCheck,
  Stethoscope,
  FileText,
  Calendar,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Activity,
  PlusCircle,
  X,
  RefreshCw,
  Eye,
  Layers,
  Heart,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';

export const Day5AppointmentFlowExplorer = () => {
  const { user, isAuthenticated, role } = useAuth();

  const [pipeline, setPipeline] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState(null);

  // SOAP Consultation Note Modal
  const [soapModalOpen, setSoapModalOpen] = useState(false);
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [soapForm, setSoapForm] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    icd10Codes: 'I10',
    followUpDate: '',
  });

  // Clinical Timeline Modal
  const [timelineModalOpen, setTimelineModalOpen] = useState(false);
  const [timelineData, setTimelineData] = useState(null);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // Follow-up Modal
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [followUpForm, setFollowUpForm] = useState({
    followUpDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    timeSlot: '10:00 - 10:30',
    reasonForVisit: 'Post-Consultation Review',
  });

  useEffect(() => {
    loadFlowData();
    const interval = setInterval(loadFlowData, 10000); // 10s auto-sync
    return () => clearInterval(interval);
  }, []);

  const loadFlowData = async () => {
    try {
      const [boardRes, statsRes] = await Promise.all([
        appointmentFlowAPI.getBoard(),
        appointmentFlowAPI.getStats().catch(() => null),
      ]);

      if (boardRes && boardRes.success) {
        setPipeline(boardRes.pipeline);
      }
      if (statsRes && statsRes.success) {
        setStats(statsRes);
      }
    } catch (err) {
      console.error('Error loading flow data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (apptId, status) => {
    try {
      const res = await appointmentFlowAPI.updateStatus(apptId, { status });
      if (res.success) {
        setActionSuccess(`Status transitioned to ${status}!`);
        loadFlowData();
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleOpenSoapModal = (appt) => {
    setActiveAppointment(appt);
    setSoapForm({
      subjective: appt.reasonForVisit || 'Patient reports worsening symptoms over past 3 days.',
      objective: appt.vitalSign
        ? `BP: ${appt.vitalSign.systolicBp}/${appt.vitalSign.diastolicBp} mmHg, Pulse: ${appt.vitalSign.pulseRate} bpm, SpO2: ${appt.vitalSign.oxygenSaturation}%, Temp: ${appt.vitalSign.temperature}°F, BMI: ${appt.vitalSign.bmi}`
        : 'Physical examination completed. Chest clear, heart sounds normal.',
      assessment: 'Essential (Primary) Hypertension',
      plan: 'Start Tab Amlodipine 5mg OD, low-sodium dietary advice, follow-up in 2 weeks.',
      icd10Codes: 'I10',
      followUpDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    });
    setSoapModalOpen(true);
  };

  const handleSubmitSoapNote = async (e) => {
    e.preventDefault();
    if (!activeAppointment) return;

    try {
      const res = await appointmentFlowAPI.recordNote(activeAppointment.id, {
        ...soapForm,
        isCompleted: true,
      });

      if (res.success) {
        setActionSuccess('SOAP Consultation Note recorded & Outpatient visit completed!');
        setSoapModalOpen(false);
        loadFlowData();
        setTimeout(() => setActionSuccess(null), 4000);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleOpenTimeline = async (apptId) => {
    setLoadingTimeline(true);
    setTimelineModalOpen(true);
    try {
      const res = await appointmentFlowAPI.getTimeline(apptId);
      if (res.success) {
        setTimelineData(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const handleOpenFollowUp = (appt) => {
    setActiveAppointment(appt);
    setFollowUpModalOpen(true);
  };

  const handleSubmitFollowUp = async (e) => {
    e.preventDefault();
    if (!activeAppointment) return;

    try {
      const res = await appointmentFlowAPI.scheduleFollowUp(activeAppointment.id, followUpForm);
      if (res.success) {
        setActionSuccess(`Follow-up appointment booked for ${followUpForm.followUpDate}!`);
        setFollowUpModalOpen(false);
        loadFlowData();
        setTimeout(() => setActionSuccess(null), 4000);
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
              <GitPullRequest className="w-3.5 h-3.5 text-teal-400" />
              Module 2 &bull; Day 5 (Milestone Complete! 🎉)
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Appointment Status & Clinical Consultation Flow
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              End-to-end outpatient lifecycle: Reception check-in, nurse vitals verification, doctor in-consultation, clinical SOAP documentation, visit checkout, and longitudinal journey timelines.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadFlowData}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-400' : ''}`} />
              <span>Sync Floor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300 font-medium animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 2. Lifecycle Overview Stat Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-slate-400 font-medium block">Scheduled / In-Queue</span>
          <div className="text-2xl font-black text-amber-400 mt-1">
            {(pipeline?.scheduled?.length || 0) + (pipeline?.checkedIn?.length || 0)}
          </div>
          <span className="text-[11px] text-slate-400">Waiting for doctor</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-slate-400 font-medium block">In Active Consultation</span>
          <div className="text-2xl font-black text-teal-400 mt-1">
            {pipeline?.inConsultation?.length || 0}
          </div>
          <span className="text-[11px] text-teal-300">Exam Room Active</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-slate-400 font-medium block">Completed Today</span>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {pipeline?.completed?.length || 0}
          </div>
          <span className="text-[11px] text-emerald-400">SOAP Notes Recorded</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs text-slate-400 font-medium block">Avg Consultation Time</span>
          <div className="text-2xl font-black text-indigo-400 mt-1">~18m</div>
          <span className="text-[11px] text-indigo-300">Standard Clinical Flow</span>
        </div>
      </div>

      {/* 3. OPD Floor Kanban Board Pipeline (4 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Column 1: Scheduled / Booked */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              1. Booked / Scheduled
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
              {pipeline?.scheduled?.length || 0}
            </span>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {pipeline?.scheduled?.length > 0 ? (
              pipeline.scheduled.map((a) => (
                <div
                  key={a.id}
                  className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-2 hover:border-slate-600 transition"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">
                      {a.patient?.firstName} {a.patient?.lastName}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-300">{a.patient?.mrn}</span>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Dr. {a.doctor?.user?.fullName} &bull;{' '}
                    <span className="text-teal-400">{a.timeSlot}</span>
                  </div>

                  <button
                    onClick={() => handleUpdateStatus(a.id, 'CHECKED_IN')}
                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Check-In Patient</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-500">No scheduled patients.</div>
            )}
          </div>
        </div>

        {/* Column 2: Checked-In / Waiting Hall */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              2. Waiting Hall / Triaged
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
              {pipeline?.checkedIn?.length || 0}
            </span>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {pipeline?.checkedIn?.length > 0 ? (
              pipeline.checkedIn.map((a) => (
                <div
                  key={a.id}
                  className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-2 hover:border-slate-600 transition"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">
                      {a.patient?.firstName} {a.patient?.lastName}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded font-bold">
                      {a.queueToken?.tokenCode || 'OPD-001'}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Dr. {a.doctor?.user?.fullName} ({a.doctor?.roomNumber})
                  </div>

                  {a.vitalSign ? (
                    <div className="text-[10px] text-emerald-300 flex items-center gap-1 bg-emerald-950/40 p-1.5 rounded border border-emerald-800/40">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Vitals: BP {a.vitalSign.systolicBp}/{a.vitalSign.diastolicBp} &bull; SpO2 {a.vitalSign.oxygenSaturation}%</span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400">Pending nurse vitals</div>
                  )}

                  <button
                    onClick={() => handleUpdateStatus(a.id, 'IN_CONSULTATION')}
                    className="w-full py-1.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Call to Consultation</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-500">Waiting hall is clear.</div>
            )}
          </div>
        </div>

        {/* Column 3: In Active Consultation */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
              3. In Consultation Room
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold">
              {pipeline?.inConsultation?.length || 0}
            </span>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {pipeline?.inConsultation?.length > 0 ? (
              pipeline.inConsultation.map((a) => (
                <div
                  key={a.id}
                  className="p-3.5 bg-teal-950/30 border border-teal-500/40 rounded-xl space-y-2.5 shadow-md"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">
                      {a.patient?.firstName} {a.patient?.lastName}
                    </span>
                    <span className="text-[10px] font-mono text-purple-300 font-bold">
                      {a.doctor?.roomNumber || 'Room 101'}
                    </span>
                  </div>

                  <div className="text-[11px] text-teal-300">
                    Dr. {a.doctor?.user?.fullName} ({a.doctor?.department?.name})
                  </div>

                  <button
                    onClick={() => handleOpenSoapModal(a)}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition shadow"
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    <span>Record SOAP Note & Complete</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-500">No active room visits.</div>
            )}
          </div>
        </div>

        {/* Column 4: Completed & Checked Out */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              4. Completed Visits
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
              {pipeline?.completed?.length || 0}
            </span>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {pipeline?.completed?.length > 0 ? (
              pipeline.completed.map((a) => (
                <div
                  key={a.id}
                  className="p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-2 hover:border-slate-600 transition"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">
                      {a.patient?.firstName} {a.patient?.lastName}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase">
                      ✓ Done
                    </span>
                  </div>

                  {a.consultationNote && (
                    <div className="text-[11px] text-slate-300 truncate">
                      <strong>Dx:</strong> {a.consultationNote.assessment}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      onClick={() => handleOpenTimeline(a.id)}
                      className="py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 border border-slate-700 transition"
                    >
                      <Eye className="w-3 h-3 text-teal-400" />
                      <span>Timeline</span>
                    </button>
                    <button
                      onClick={() => handleOpenFollowUp(a)}
                      className="py-1.5 bg-teal-950/40 hover:bg-teal-900/60 text-teal-300 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 border border-teal-700/40 transition"
                    >
                      <PlusCircle className="w-3 h-3" />
                      <span>Follow-up</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-500">No completed visits today.</div>
            )}
          </div>
        </div>
      </div>

      {/* SOAP Consultation Note Modal */}
      {soapModalOpen && activeAppointment && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-teal-400" />
                  Clinical SOAP Consultation Note
                </h3>
                <span className="text-[11px] text-slate-400">
                  Patient: <strong>{activeAppointment.patient?.firstName} {activeAppointment.patient?.lastName}</strong> ({activeAppointment.patient?.mrn})
                </span>
              </div>
              <button onClick={() => setSoapModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitSoapNote} className="space-y-3.5 text-xs">
              {/* Subjective */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  [S] Subjective (Chief Complaints & History):
                </label>
                <textarea
                  rows="2"
                  required
                  value={soapForm.subjective}
                  onChange={(e) => setSoapForm({ ...soapForm, subjective: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
              </div>

              {/* Objective */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  [O] Objective (Physical Exam & Nurse Vitals Findings):
                </label>
                <textarea
                  rows="2"
                  required
                  value={soapForm.objective}
                  onChange={(e) => setSoapForm({ ...soapForm, objective: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
              </div>

              {/* Assessment */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-300 font-bold mb-1">
                    [A] Assessment (Clinical Diagnosis) *:
                  </label>
                  <input
                    type="text"
                    required
                    value={soapForm.assessment}
                    onChange={(e) => setSoapForm({ ...soapForm, assessment: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">ICD-10 Code</label>
                  <input
                    type="text"
                    value={soapForm.icd10Codes}
                    onChange={(e) => setSoapForm({ ...soapForm, icd10Codes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Plan */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  [P] Plan (Treatment, Prescriptions & Patient Advice) *:
                </label>
                <textarea
                  rows="2"
                  required
                  value={soapForm.plan}
                  onChange={(e) => setSoapForm({ ...soapForm, plan: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
              </div>

              {/* Follow-up Date */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Recommended Follow-up Date</label>
                <input
                  type="date"
                  value={soapForm.followUpDate}
                  onChange={(e) => setSoapForm({ ...soapForm, followUpDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSoapModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 text-white rounded-xl font-bold shadow-lg shadow-teal-500/20"
                >
                  Save SOAP Note & Mark Visit Completed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clinical Timeline Modal */}
      {timelineModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-400" />
                Patient Outpatient Journey Timeline
              </h3>
              <button onClick={() => setTimelineModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingTimeline ? (
              <div className="py-12 text-center text-xs text-slate-500">Loading timeline...</div>
            ) : timelineData?.timeline?.length > 0 ? (
              <div className="space-y-4 text-xs">
                {timelineData.timeline.map((step) => (
                  <div key={step.step} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-teal-600/30 text-teal-300 border border-teal-500/50 flex items-center justify-center font-bold font-mono text-xs">
                        {step.step}
                      </div>
                      {step.step < 5 && <div className="w-0.5 h-10 bg-slate-800 my-1" />}
                    </div>

                    <div className="flex-1 bg-slate-800/40 p-3 rounded-xl border border-slate-700/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-white">{step.title}</h4>
                        {step.timestamp && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(step.timestamp).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300">{step.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">Timeline not available.</div>
            )}
          </div>
        </div>
      )}

      {/* Follow-up Appointment Modal */}
      {followUpModalOpen && activeAppointment && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-400" />
                Schedule Follow-up Consultation
              </h3>
              <button onClick={() => setFollowUpModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitFollowUp} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Follow-up Date *</label>
                <input
                  type="date"
                  required
                  value={followUpForm.followUpDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, followUpDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Time Slot *</label>
                <select
                  value={followUpForm.timeSlot}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, timeSlot: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none"
                >
                  <option value="09:00 - 09:30">09:00 - 09:30</option>
                  <option value="10:00 - 10:30">10:00 - 10:30</option>
                  <option value="11:00 - 11:30">11:00 - 11:30</option>
                  <option value="14:00 - 14:30">14:00 - 14:30</option>
                  <option value="15:00 - 15:30">15:00 - 15:30</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Reason for Visit</label>
                <input
                  type="text"
                  value={followUpForm.reasonForVisit}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, reasonForVisit: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setFollowUpModalOpen(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold shadow"
                >
                  Book Follow-up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
