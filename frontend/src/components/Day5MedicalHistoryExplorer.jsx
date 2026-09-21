import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { medicalHistoryAPI } from '../services/api';
import {
  Search,
  FileText,
  HeartPulse,
  Pill,
  ShieldAlert,
  Phone,
  UserCheck,
  Calendar,
  Clock,
  Droplet,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Printer,
  ChevronRight,
  Filter,
  Edit3,
  Sparkles,
  Stethoscope,
  Activity,
  AlertCircle,
  X,
  Plus,
} from 'lucide-react';

const BLOOD_OPTIONS = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const Day5MedicalHistoryExplorer = () => {
  const { user, isAuthenticated, role } = useAuth();

  // Search & Query state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlood, setSelectedBlood] = useState('');
  const [filterAlertsOnly, setFilterAlertsOnly] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [medicalDossier, setMedicalDossier] = useState(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingDossier, setLoadingDossier] = useState(false);

  // Modals state
  const [editEmergencyOpen, setEditEmergencyOpen] = useState(false);
  const [editAllergiesOpen, setEditAllergiesOpen] = useState(false);
  const [emergencyForm, setEmergencyForm] = useState({
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
  });
  const [baselineForm, setBaselineForm] = useState({
    allergies: '',
    chronicConditions: '',
  });
  const [actionSuccess, setActionSuccess] = useState(null);

  useEffect(() => {
    handleSearch();
  }, [selectedBlood, filterAlertsOnly]);

  const handleSearch = async (query = searchQuery) => {
    setLoadingSearch(true);
    try {
      const res = await medicalHistoryAPI.searchPatients({
        q: query,
        bloodGroup: selectedBlood,
        hasAllergies: filterAlertsOnly ? 'true' : undefined,
      });
      if (res && res.success) {
        setSearchResults(res.patients || []);
        // Auto-select first patient if none selected
        if (!selectedPatient && res.patients?.length > 0) {
          selectPatient(res.patients[0]);
        }
      }
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setLoadingSearch(false);
    }
  };

  const selectPatient = async (patient) => {
    setSelectedPatient(patient);
    setLoadingDossier(true);
    try {
      const res = await medicalHistoryAPI.getHistory(patient.id);
      if (res && res.success) {
        setMedicalDossier(res);
        setEmergencyForm({
          emergencyContactName: res.patient.emergencyContactName || '',
          emergencyContactPhone: res.patient.emergencyContactPhone || '',
          emergencyContactRelation: res.patient.emergencyContactRelation || 'Guardian',
        });
        setBaselineForm({
          allergies: res.patient.allergies || '',
          chronicConditions: res.patient.chronicConditions || '',
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDossier(false);
    }
  };

  const handleUpdateEmergency = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    try {
      const res = await medicalHistoryAPI.updateEmergencyContact(
        selectedPatient.id,
        emergencyForm
      );
      if (res.success) {
        setActionSuccess('Emergency contact updated successfully!');
        setEditEmergencyOpen(false);
        selectPatient(selectedPatient);
        handleSearch();
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleUpdateBaseline = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    try {
      const res = await medicalHistoryAPI.updateBaseline(selectedPatient.id, baselineForm);
      if (res.success) {
        setActionSuccess('Medical baseline and allergies updated successfully!');
        setEditAllergiesOpen(false);
        selectPatient(selectedPatient);
        handleSearch();
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl border border-blue-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-xs font-semibold text-blue-300 mb-2">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              Module 1 &bull; Day 5 Deliverable
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Patient Search, Medical History & Emergency Management
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Multi-criteria patient search engine, longitudinal EHR clinical history timeline,
              emergency contact management, and allergy safety registry.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-4 min-w-[260px]">
            <div className="text-xs text-blue-200 font-semibold">Active Record In Focus:</div>
            <div className="text-base font-bold text-white mt-1 truncate">
              {selectedPatient ? selectedPatient.fullName : 'Select a patient...'}
            </div>
            <div className="text-xs text-cyan-300 font-mono mt-0.5">
              {selectedPatient ? `MRN: ${selectedPatient.mrn}` : '---'}
            </div>
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

      {/* 2. Main 2-Column Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Multi-Criteria Patient Search (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-cyan-400" />
              Patient Search Engine
            </h3>
            <button
              onClick={() => handleSearch()}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search Inputs */}
          <div className="space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                placeholder="Search MRN, Name, Phone, CNIC..."
                className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <select
                value={selectedBlood}
                onChange={(e) => setSelectedBlood(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 font-semibold focus:outline-none"
              >
                <option value="">All Blood Groups</option>
                {BLOOD_OPTIONS.filter(Boolean).map((bg) => (
                  <option key={bg} value={bg}>
                    Blood: {bg}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setFilterAlertsOnly(!filterAlertsOnly)}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold whitespace-nowrap transition ${
                  filterAlertsOnly
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700'
                }`}
              >
                ⚠️ Has Allergies
              </button>
            </div>
          </div>

          {/* Results List */}
          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {loadingSearch ? (
              <div className="py-10 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                <span>Searching directory...</span>
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((p) => {
                const isSelected = selectedPatient?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => selectPatient(p)}
                    className={`p-3 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500/60 ring-1 ring-blue-500/30'
                        : 'bg-slate-800/40 hover:bg-slate-800/80 border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-white truncate">{p.fullName}</div>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                        {p.mrn}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span>
                        {p.gender} &bull; {p.age} yrs
                      </span>
                      <span className="text-red-400 font-bold">Blood: {p.bloodGroup}</span>
                    </div>

                    {p.hasAlerts && (
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 truncate">
                        <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{p.allergies || p.chronicConditions}</span>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-xs text-slate-500">
                No patients match the search criteria.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Longitudinal EHR & Clinical Dossier (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedPatient ? (
            <>
              {/* 1. Patient Master Demographic Header Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-lg font-bold text-white">
                        {medicalDossier?.patient?.fullName || selectedPatient.fullName}
                      </h2>
                      <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {selectedPatient.mrn}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                      <span>
                        {selectedPatient.gender} &bull; {selectedPatient.age} yrs (DOB:{' '}
                        {new Date(selectedPatient.dateOfBirth).toLocaleDateString()})
                      </span>
                      <span>&bull;</span>
                      <span className="font-mono text-white">{selectedPatient.phone}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditAllergiesOpen(true)}
                      className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Edit Allergies</span>
                    </button>
                    <button
                      onClick={() => setEditEmergencyOpen(true)}
                      className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Emergency Contact</span>
                    </button>
                  </div>
                </div>

                {/* Patient Vitals & Safety Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400">Blood Group</span>
                    <div className="font-bold text-red-400 text-sm mt-0.5">
                      {selectedPatient.bloodGroup || 'UNKNOWN'}
                    </div>
                  </div>
                  <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400">Total Visits</span>
                    <div className="font-bold text-white text-sm mt-0.5">
                      {medicalDossier?.summary?.totalConsultations || 0}
                    </div>
                  </div>
                  <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400">Prescriptions</span>
                    <div className="font-bold text-white text-sm mt-0.5">
                      {medicalDossier?.summary?.totalPrescriptions || 0}
                    </div>
                  </div>
                  <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400">Vitals Recorded</span>
                    <div className="font-bold text-white text-sm mt-0.5">
                      {medicalDossier?.summary?.totalVitalsLogged || 0}
                    </div>
                  </div>
                </div>

                {/* Emergency Contact & Allergies Preview Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-xl text-xs">
                    <div className="flex items-center justify-between text-red-400 font-bold text-[11px] mb-1">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> Emergency Contact
                      </span>
                    </div>
                    <div className="text-white font-semibold">
                      {selectedPatient.emergencyContactName || 'None listed'} (
                      {selectedPatient.emergencyContactRelation || 'Guardian'})
                    </div>
                    <div className="text-cyan-300 font-mono text-[11px] mt-0.5">
                      {selectedPatient.emergencyContactPhone || 'No contact phone'}
                    </div>
                  </div>

                  <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl text-xs">
                    <div className="flex items-center justify-between text-amber-400 font-bold text-[11px] mb-1">
                      <span className="flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> Allergies & Chronic Conditions
                      </span>
                    </div>
                    <div className="text-amber-200">
                      <strong>Allergies:</strong> {selectedPatient.allergies || 'None'}
                    </div>
                    <div className="text-slate-300 text-[11px] mt-0.5 truncate">
                      <strong>Chronic:</strong> {selectedPatient.chronicConditions || 'None'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Longitudinal Clinical Timeline (EHR History) */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    Longitudinal Medical Record & Clinical Timeline
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">Chronological Events</span>
                </div>

                <div className="space-y-4">
                  {loadingDossier ? (
                    <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                      <span>Loading clinical timeline...</span>
                    </div>
                  ) : medicalDossier?.timeline?.length > 0 ? (
                    medicalDossier.timeline.map((event, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-2.5 hover:border-slate-600 transition"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                event.type === 'CONSULTATION'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                                  : event.type === 'VITAL_SIGNS'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                                  : event.type === 'PRESCRIPTION'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                              }`}
                            >
                              {event.type}
                            </span>
                            <h4 className="text-xs font-bold text-white">{event.title}</h4>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(event.date).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Consultation Details */}
                        {event.type === 'CONSULTATION' && (
                          <div className="space-y-1.5 text-xs text-slate-300">
                            <div>
                              <strong>Attending:</strong> {event.physician} &bull;{' '}
                              <span className="text-emerald-400 font-bold">{event.status}</span>
                            </div>
                            {event.reason && (
                              <div className="text-slate-400">
                                <strong>Reason for Visit:</strong> {event.reason}
                              </div>
                            )}
                            {event.note && (
                              <div className="mt-2 p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1 text-[11px]">
                                <div className="font-bold text-cyan-300">SOAP Assessment:</div>
                                <div>{event.note.assessment}</div>
                                <div className="text-slate-400">
                                  <strong>Plan:</strong> {event.note.plan}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Vital Signs Details */}
                        {event.type === 'VITAL_SIGNS' && event.data && (
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                            <div>
                              <span className="text-slate-400">Blood Pressure:</span>
                              <div className="font-bold text-white">{event.data.bp}</div>
                            </div>
                            <div>
                              <span className="text-slate-400">Pulse:</span>
                              <div className="font-bold text-white">{event.data.pulse}</div>
                            </div>
                            <div>
                              <span className="text-slate-400">Temp:</span>
                              <div className="font-bold text-white">{event.data.temperature}</div>
                            </div>
                            <div>
                              <span className="text-slate-400">SpO2:</span>
                              <div className="font-bold text-white">{event.data.spo2}</div>
                            </div>
                            <div>
                              <span className="text-slate-400">BMI:</span>
                              <div className="font-bold text-white">{event.data.bmi}</div>
                            </div>
                          </div>
                        )}

                        {/* Prescription Details */}
                        {event.type === 'PRESCRIPTION' && (
                          <div className="space-y-1 text-xs text-slate-300">
                            <div>
                              <strong>Prescribed by:</strong> {event.physician}
                            </div>
                            {event.instructions && (
                              <div className="text-emerald-300 text-[11px]">
                                {event.instructions}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-xs text-slate-500">
                      No clinical events logged yet for this patient.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
              Select a patient from the left panel to inspect medical history and emergency contacts.
            </div>
          )}
        </div>
      </div>

      {/* Edit Emergency Contact Modal */}
      {editEmergencyOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Phone className="w-4 h-4 text-cyan-400" />
                Update Emergency Contact
              </h3>
              <button
                onClick={() => setEditEmergencyOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateEmergency} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Contact Person Name *
                </label>
                <input
                  type="text"
                  required
                  value={emergencyForm.emergencyContactName}
                  onChange={(e) =>
                    setEmergencyForm({ ...emergencyForm, emergencyContactName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Relationship to Patient *
                </label>
                <input
                  type="text"
                  required
                  value={emergencyForm.emergencyContactRelation}
                  onChange={(e) =>
                    setEmergencyForm({ ...emergencyForm, emergencyContactRelation: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Emergency Phone Number *
                </label>
                <input
                  type="text"
                  required
                  value={emergencyForm.emergencyContactPhone}
                  onChange={(e) =>
                    setEmergencyForm({ ...emergencyForm, emergencyContactPhone: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditEmergencyOpen(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Allergies / Chronic Baseline Modal */}
      {editAllergiesOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Update Medical Baseline & Allergies
              </h3>
              <button
                onClick={() => setEditAllergiesOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateBaseline} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Known Drug / Food Allergies
                </label>
                <textarea
                  rows={2}
                  value={baselineForm.allergies}
                  onChange={(e) => setBaselineForm({ ...baselineForm, allergies: e.target.value })}
                  placeholder="e.g. Penicillin, Shellfish, Dust"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Chronic Illnesses & Diagnoses
                </label>
                <textarea
                  rows={2}
                  value={baselineForm.chronicConditions}
                  onChange={(e) =>
                    setBaselineForm({ ...baselineForm, chronicConditions: e.target.value })
                  }
                  placeholder="e.g. Hypertension, Type-2 Diabetes"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditAllergiesOpen(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold"
                >
                  Save Baseline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
