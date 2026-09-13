import React, { useEffect, useState } from 'react';
import {
  FlaskConical,
  FileText,
  Printer,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Activity,
  FileCheck2,
  Calendar,
  X,
  Stethoscope,
  Radio,
} from 'lucide-react';
import { labOrdersAPI, consultationAPI, patientsAPI } from '../services/api';

const QUICK_PANELS = [
  { name: 'Complete Blood Count (CBC)', category: 'Hematology', code: 'CBC', turnaround: '4 hrs', price: '$35' },
  { name: 'Fasting Blood Glucose (FBG)', category: 'Biochemistry', code: 'FBG', turnaround: '2 hrs', price: '$15' },
  { name: 'Glycated Hemoglobin (HbA1c)', category: 'Biochemistry', code: 'HBA1C', turnaround: '4 hrs', price: '$40' },
  { name: 'Comprehensive Lipid Profile', category: 'Biochemistry', code: 'LIPID', turnaround: '4 hrs', price: '$50' },
  { name: 'Renal Function Test (RFT)', category: 'Biochemistry', code: 'RFT', turnaround: '3 hrs', price: '$45' },
  { name: 'Liver Function Test (LFT)', category: 'Biochemistry', code: 'LFT', turnaround: '3 hrs', price: '$50' },
  { name: 'Chest X-Ray PA View', category: 'Radiology', code: 'CXR-PA', turnaround: '2 hrs', price: '$40' },
  { name: '12-Lead ECG (Resting)', category: 'Radiology', code: 'ECG-12', turnaround: '1 hr', price: '$30' },
  { name: 'Ultrasound Abdomen & Pelvis', category: 'Radiology', code: 'USG-ABD', turnaround: '4 hrs', price: '$60' },
];

export function Day5LabOrdersExportExplorer() {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Orders State
  const [patientOrders, setPatientOrders] = useState([]);
  const [patientPrescriptions, setPatientPrescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // New Order Form State
  const [testName, setTestName] = useState('');
  const [category, setCategory] = useState('Hematology');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Status Filter
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Result Entry Modal
  const [activeResultOrder, setActiveResultOrder] = useState(null);
  const [resultInput, setResultInput] = useState('');
  const [savingResult, setSavingResult] = useState(false);

  // Load patients on mount
  useEffect(() => {
    loadPatients();
  }, []);

  // Load patient data whenever selected patient changes
  useEffect(() => {
    if (selectedPatientId) {
      const patient = patients.find((p) => p.id === selectedPatientId);
      setSelectedPatient(patient || null);
      loadPatientDetails(selectedPatientId);
    }
  }, [selectedPatientId]);

  const loadPatients = async () => {
    try {
      const res = await patientsAPI.getAll({ limit: 50 });
      const pts = res.patients || [];
      setPatients(pts);
      if (pts.length > 0 && !selectedPatientId) {
        setSelectedPatientId(pts[0].id);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const loadPatientDetails = async (patientId) => {
    setLoading(true);
    setError('');
    try {
      const [ordersRes, rxRes] = await Promise.all([
        labOrdersAPI.getByPatient(patientId).catch(() => ({ orders: [] })),
        consultationAPI.getPatientPrescriptions(patientId).catch(() => ({ prescriptions: [] })),
      ]);
      setPatientOrders(ordersRes.orders || []);
      setPatientPrescriptions(rxRes.prescriptions || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = (panel) => {
    setTestName(panel.name);
    setCategory(panel.category);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!selectedPatientId || !testName.trim()) return;

    setSubmittingOrder(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await labOrdersAPI.create({
        patientId: selectedPatientId,
        testName: testName.trim(),
        category,
        resultsSummary: clinicalNotes ? `Indication: ${clinicalNotes}` : null,
      });

      setSuccessMsg(res.message || 'Diagnostic test order placed successfully!');
      setTestName('');
      setClinicalNotes('');
      await loadPatientDetails(selectedPatientId);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleAdvanceStatus = async (order, nextStatus) => {
    try {
      await labOrdersAPI.updateStatus(order.id, { status: nextStatus });
      await loadPatientDetails(selectedPatientId);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleOpenResultModal = (order) => {
    setActiveResultOrder(order);
    setResultInput(order.resultsSummary || '');
  };

  const handleSaveResult = async () => {
    if (!activeResultOrder) return;
    setSavingResult(true);
    try {
      await labOrdersAPI.updateStatus(activeResultOrder.id, {
        status: 'COMPLETED',
        resultsSummary: resultInput.trim(),
      });
      setActiveResultOrder(null);
      await loadPatientDetails(selectedPatientId);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSavingResult(false);
    }
  };

  const filteredOrders = patientOrders.filter((o) => {
    if (statusFilter === 'ALL') return true;
    return o.status === statusFilter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'REQUESTED':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">⏳ REQUESTED</span>;
      case 'SAMPLE_COLLECTED':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">🧪 SAMPLE COLLECTED</span>;
      case 'PROCESSING':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">⚙️ PROCESSING</span>;
      case 'COMPLETED':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">✅ COMPLETED</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/30">{status}</span>;
    }
  };

  const handleOpenPdfWindow = (url) => {
    window.open(url, '_blank', 'width=900,height=950,scrollbars=yes,resizable=yes');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <section className="rounded-2xl border border-teal-800/50 bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-500/15 px-3 py-1 text-xs font-semibold text-teal-200">
              <FlaskConical className="h-3.5 w-3.5" /> Module 3 &bull; Day 5 Deliverable
            </div>
            <h1 className="text-2xl font-bold">Diagnostic Test Orders & PDF Export</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-300">
              Request diagnostic laboratory and radiology tests, track specimen processing, record clinical results, and export high-definition printable Prescriptions & 360° EHR Summaries.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-white/10 bg-white/10 p-3 text-center">
              <div className="text-[11px] uppercase tracking-wider text-teal-200 font-semibold">Active Orders</div>
              <div className="text-xl font-black">{patientOrders.length}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/10 p-3 text-center">
              <div className="text-[11px] uppercase tracking-wider text-cyan-200 font-semibold">Completed</div>
              <div className="text-xl font-black text-emerald-400">
                {patientOrders.filter((o) => o.status === 'COMPLETED').length}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Patient Selection & Quick Stats Bar */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Select Active Patient for Diagnostic Workstation:
          </label>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white focus:border-teal-500 focus:outline-none"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.mrn} &bull; {p.firstName} {p.lastName} ({p.gender}, Blood: {p.bloodGroup || 'O+'})
              </option>
            ))}
          </select>
          {selectedPatient && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-md bg-slate-800 px-2.5 py-1 text-slate-300 border border-slate-700">
                MRN: <strong className="text-white">{selectedPatient.mrn}</strong>
              </span>
              <span className="rounded-md bg-slate-800 px-2.5 py-1 text-slate-300 border border-slate-700">
                Allergies: <strong className="text-rose-400">{selectedPatient.allergies || 'NKDA'}</strong>
              </span>
              <span className="rounded-md bg-slate-800 px-2.5 py-1 text-slate-300 border border-slate-700">
                Chronic: <strong className="text-amber-300">{selectedPatient.chronicConditions || 'None'}</strong>
              </span>
            </div>
          )}
        </div>

        {/* 1-Click Export Center Card */}
        <div className="rounded-2xl border border-teal-500/30 bg-teal-950/20 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-teal-300 font-bold text-sm">
              <Printer className="w-4 h-4" /> 1-Click PDF Export Center
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Official hospital letterhead with doctor signatures and verified timestamps.
            </p>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            <button
              onClick={() => handleOpenPdfWindow(consultationAPI.getClinicalSummaryExportUrl(selectedPatientId))}
              disabled={!selectedPatientId}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-3 py-2 text-xs font-bold text-white hover:from-teal-500 hover:to-cyan-500 shadow-sm transition disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" /> Export 360° EHR Summary (PDF)
            </button>
            {patientPrescriptions.length > 0 && (
              <button
                onClick={() => handleOpenPdfWindow(consultationAPI.getPrescriptionPdfUrl(patientPrescriptions[0].id))}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 border border-teal-500/40 px-3 py-2 text-xs font-bold text-teal-300 hover:bg-slate-700 transition"
              >
                <Printer className="w-3.5 h-3.5" /> Print Latest Rx ({patientPrescriptions[0].prescriptionNumber})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-3 text-sm text-rose-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3 text-sm text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid: Ordering Pad vs Results Pipeline */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Col (5 cols): Diagnostic Test Ordering Pad */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-teal-400" />
              Order Diagnostic Tests
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select from common clinical panels or enter custom laboratory & radiology tests.
            </p>

            {/* Quick Panel Buttons */}
            <div className="mt-4">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Quick-Pick Common Diagnostic Panels:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_PANELS.map((p) => (
                  <button
                    key={p.code}
                    type="button"
                    onClick={() => handleQuickAdd(p)}
                    className={`text-left p-2.5 rounded-xl border transition text-xs ${
                      testName === p.name
                        ? 'border-teal-500 bg-teal-500/20 text-white font-bold'
                        : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold truncate">{p.name}</div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                      <span>{p.category}</span>
                      <span className="text-teal-400 font-bold">{p.price}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Manual Order Form */}
            <form onSubmit={handlePlaceOrder} className="mt-4 space-y-3 pt-3 border-t border-slate-800">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Test Name / Procedure:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete Blood Count (CBC) or CT Brain"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-white focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Category:
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                  >
                    <option value="Hematology">Hematology (Blood)</option>
                    <option value="Biochemistry">Biochemistry (Chemistry)</option>
                    <option value="Radiology">Radiology & Imaging</option>
                    <option value="Microbiology">Microbiology & Urinalysis</option>
                    <option value="Immunology">Immunology / Serology</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Clinical Priority:
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                  >
                    <option value="ROUTINE">Routine OPD</option>
                    <option value="URGENT">Urgent (Within 4 hrs)</option>
                    <option value="STAT">STAT / Emergency</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Clinical Indication / Physician Notes:
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Evaluate chronic headaches; screen for anemia & renal impairment"
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingOrder || !testName.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:from-teal-400 hover:to-emerald-500 shadow-md transition disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                {submittingOrder ? 'Placing Lab Order...' : 'Generate & Issue Lab Order'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Col (7 cols): Orders Pipeline & Results Tracking */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-teal-400" />
                  Diagnostic Order Tracking & Results Board
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time status pipeline for {selectedPatient ? `${selectedPatient.firstName}'s` : 'Patient'} test orders.
                </p>
              </div>

              {/* Status Filter Pills */}
              <div className="flex flex-wrap gap-1">
                {['ALL', 'REQUESTED', 'SAMPLE_COLLECTED', 'PROCESSING', 'COMPLETED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition ${
                      statusFilter === st
                        ? 'bg-teal-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {st === 'SAMPLE_COLLECTED' ? 'SAMPLE' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders List */}
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
                <span>Loading diagnostic orders...</span>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No diagnostic orders match filter "{statusFilter}". Use the ordering pad to create one!
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-slate-700"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-extrabold text-teal-400">
                            {order.orderNumber}
                          </span>
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {order.category}
                          </span>
                          {getStatusBadge(order.status)}
                        </div>
                        <h3 className="text-sm font-bold text-white mt-1.5">{order.testName}</h3>
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3">
                          <span>
                            Requested: {new Date(order.requestedAt).toLocaleDateString()} at{' '}
                            {new Date(order.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {order.completedAt && (
                            <span className="text-emerald-400 font-semibold">
                              &bull; Completed: {new Date(order.completedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Progression Controls */}
                      <div className="flex items-center gap-2 shrink-0 mt-2 sm:mt-0">
                        {order.status === 'REQUESTED' && (
                          <button
                            onClick={() => handleAdvanceStatus(order, 'SAMPLE_COLLECTED')}
                            className="px-2.5 py-1.5 rounded-lg bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-600/30 text-xs font-bold transition"
                          >
                            Collect Sample
                          </button>
                        )}
                        {order.status === 'SAMPLE_COLLECTED' && (
                          <button
                            onClick={() => handleAdvanceStatus(order, 'PROCESSING')}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 text-xs font-bold transition"
                          >
                            Start Processing
                          </button>
                        )}
                        {(order.status === 'PROCESSING' || order.status === 'SAMPLE_COLLECTED' || order.status === 'REQUESTED') && (
                          <button
                            onClick={() => handleOpenResultModal(order)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 text-xs font-bold transition flex items-center gap-1"
                          >
                            <FileCheck2 className="w-3.5 h-3.5" />
                            Record Results
                          </button>
                        )}
                        {order.status === 'COMPLETED' && (
                          <button
                            onClick={() => handleOpenResultModal(order)}
                            className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                          >
                            Edit Results
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Results Display */}
                    {order.resultsSummary && (
                      <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900/90 p-3 text-xs">
                        <div className="font-bold text-teal-300 mb-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Diagnostic Findings / Lab Report Summary:
                        </div>
                        <p className="text-slate-200 whitespace-pre-wrap">{order.resultsSummary}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Result Entry Modal */}
      {activeResultOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-teal-400" />
                  Record Diagnostic Findings
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Order: <span className="font-mono text-teal-300">{activeResultOrder.orderNumber}</span> &bull; {activeResultOrder.testName}
                </p>
              </div>
              <button
                onClick={() => setActiveResultOrder(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Clinical Results Summary / Quantitative Values:
                </label>
                <textarea
                  rows="4"
                  required
                  placeholder="e.g. Hb: 14.2 g/dL (Normal: 13.5-17.5), WBC: 7,400 /uL (Normal), Platelets: 260,000 /uL. No abnormal cellular morphology detected."
                  value={resultInput}
                  onChange={(e) => setResultInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-sm text-white focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveResultOrder(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveResult}
                disabled={savingResult || !resultInput.trim()}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-xs font-bold text-white hover:from-teal-400 hover:to-emerald-500 shadow-md transition disabled:opacity-50"
              >
                {savingResult ? 'Saving Findings...' : 'Finalize & Mark Completed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
