import React, { useState, useEffect } from 'react';
import { ipdAPI, patientsAPI } from '../services/api';
import {
  Building2,
  BedDouble,
  UserCheck,
  UserMinus,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  DollarSign,
  Users,
} from 'lucide-react';

export function Day2IpdBedMatrixExplorer() {
  const [wards, setWards] = useState([]);
  const [beds, setBeds] = useState([]);
  const [activeAllocations, setActiveAllocations] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedWardId, setSelectedWardId] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals & Action States
  const [admitModal, setAdmitModal] = useState(false);
  const [selectedBedForAdmit, setSelectedBedForAdmit] = useState(null);
  const [addBedModal, setAddBedModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Form States
  const [admitForm, setAdmitForm] = useState({
    patientId: '',
    notes: '',
  });

  const [bedForm, setBedForm] = useState({
    wardId: '',
    bedNumber: '',
    dailyCharge: '200.00',
  });

  const loadIpdData = async () => {
    setLoading(true);
    try {
      const [wardsRes, bedsRes, allocRes, patRes] = await Promise.all([
        ipdAPI.getWards(),
        ipdAPI.getBeds(selectedWardId ? { wardId: selectedWardId } : {}),
        ipdAPI.getActiveAllocations(),
        patientsAPI.getAll(),
      ]);

      setWards(wardsRes.wards || []);
      setBeds(bedsRes.beds || []);
      setActiveAllocations(allocRes.allocations || []);
      setPatients(patRes.patients || []);

      if (!selectedWardId && wardsRes.wards?.length > 0) {
        setSelectedWardId(wardsRes.wards[0].id);
      }
    } catch (err) {
      console.error('Error loading IPD data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIpdData();
  }, [selectedWardId]);

  const handleAllocateBed = async (e) => {
    e.preventDefault();
    if (!selectedBedForAdmit) return;

    setActionLoading(true);
    setMessage(null);
    try {
      const res = await ipdAPI.allocateBed({
        bedId: selectedBedForAdmit.id,
        patientId: admitForm.patientId,
        notes: admitForm.notes,
      });

      if (res.success) {
        setMessage({ type: 'success', text: res.message });
        setAdmitModal(false);
        setSelectedBedForAdmit(null);
        setAdmitForm({ patientId: '', notes: '' });
        loadIpdData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to admit patient.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDischarge = async (allocationId) => {
    if (!window.confirm('Are you sure you want to discharge this inpatient?')) return;

    setActionLoading(true);
    setMessage(null);
    try {
      const res = await ipdAPI.dischargeBed(allocationId, { notes: 'Discharged by attending physician.' });
      if (res.success) {
        setMessage({
          type: 'success',
          text: `Patient discharged successfully. Stayed ${res.dischargeDetails.daysStayed} day(s), Total Bed Charge: $${res.dischargeDetails.totalBedCharge.toFixed(2)}`,
        });
        loadIpdData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to discharge patient.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateBed = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await ipdAPI.createBed(bedForm);
      if (res.success) {
        setMessage({ type: 'success', text: 'Bed added successfully to ward matrix.' });
        setAddBedModal(false);
        setBedForm({ wardId: '', bedNumber: '', dailyCharge: '200.00' });
        loadIpdData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create bed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const currentWard = wards.find((w) => w.id === selectedWardId);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-cyan-900/40 via-slate-900 to-indigo-900/40 border border-cyan-500/30 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                Module 4 &bull; Day 2
              </span>
              <span className="text-xs text-slate-400 font-mono">Sep 15 Deliverable</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Building2 className="w-7 h-7 text-cyan-400" />
              Inpatient (IPD) Ward & Bed Allocation Matrix Desk
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Real-time inpatient bed status tracking matrix, ward occupancy indicators, 1-click patient admission & discharge stay duration billing engine.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setBedForm({ ...bedForm, wardId: selectedWardId || (wards[0]?.id || '') });
                setAddBedModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-semibold text-xs transition shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Add Bed to Ward
            </button>
            <button
              onClick={loadIpdData}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
              title="Refresh IPD data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {message && (
        <div
          className={`p-4 rounded-2xl border text-xs font-medium flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white font-bold">
            &times;
          </button>
        </div>
      )}

      {/* Ward Selector Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {wards.map((ward) => {
          const isSelected = ward.id === selectedWardId;
          return (
            <button
              key={ward.id}
              onClick={() => setSelectedWardId(ward.id)}
              className={`px-4 py-3 rounded-2xl border text-xs font-bold transition flex items-center gap-3 ${
                isSelected
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white border-cyan-400/50 shadow-lg shadow-cyan-600/20'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <BedDouble className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-cyan-400'}`} />
              <div>
                <div className="font-extrabold">{ward.name} ({ward.code})</div>
                <div className="text-[10px] opacity-80 font-normal">
                  {ward.availableBeds} Free / {ward.totalBedsCount} Total
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bed Matrix Grid */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BedDouble className="w-5 h-5 text-cyan-400" />
              {currentWard ? `${currentWard.name} (${currentWard.type} Ward)` : 'Bed Allocation Matrix'}
            </h3>
            <p className="text-xs text-slate-400">
              Click any AVAILABLE bed to admit a patient, or manage active inpatient stays.
            </p>
          </div>

          {/* Matrix Status Legend */}
          <div className="flex items-center gap-3 text-[11px] font-semibold">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Available
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span> Occupied
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span> Maintenance
            </span>
          </div>
        </div>

        {/* Beds Matrix Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {beds.length === 0 ? (
            <div className="col-span-full py-8 text-center text-slate-500 italic">
              No beds currently configured in this ward. Click "Add Bed to Ward" above.
            </div>
          ) : (
            beds.map((bed) => {
              const activeAlloc = bed.allocations?.[0];
              const isAvailable = bed.status === 'AVAILABLE';
              const isOccupied = bed.status === 'OCCUPIED';

              return (
                <div
                  key={bed.id}
                  className={`rounded-2xl border p-4 transition-all flex flex-col justify-between space-y-3 ${
                    isAvailable
                      ? 'bg-slate-950/80 border-emerald-500/40 hover:border-emerald-400 shadow-sm'
                      : isOccupied
                      ? 'bg-slate-950/80 border-rose-500/40'
                      : 'bg-slate-950/80 border-amber-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-mono font-bold text-sm text-white flex items-center gap-2">
                      <BedDouble className={`w-4 h-4 ${isAvailable ? 'text-emerald-400' : 'text-rose-400'}`} />
                      {bed.bedNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        isAvailable
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : isOccupied
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {bed.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Daily Charge:</span>
                      <span className="font-bold text-cyan-300">${bed.dailyCharge.toFixed(2)}/day</span>
                    </div>

                    {isOccupied && activeAlloc?.patient && (
                      <div className="bg-rose-950/30 border border-rose-900/50 rounded-xl p-2.5 text-[11px] space-y-1">
                        <div className="font-bold text-rose-200">
                          {activeAlloc.patient.firstName} {activeAlloc.patient.lastName}
                        </div>
                        <div className="text-slate-400 font-mono text-[10px]">
                          MRN: {activeAlloc.patient.mrn}
                        </div>
                        <div className="text-slate-400 flex items-center gap-1 text-[10px]">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          Admitted: {new Date(activeAlloc.admittedAt).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div>
                    {isAvailable ? (
                      <button
                        onClick={() => {
                          setSelectedBedForAdmit(bed);
                          setAdmitModal(true);
                        }}
                        className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Admit Patient
                      </button>
                    ) : isOccupied && activeAlloc ? (
                      <button
                        onClick={() => handleDischarge(activeAlloc.id)}
                        disabled={actionLoading}
                        className="w-full py-2 rounded-xl bg-slate-800 hover:bg-rose-900/50 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <UserMinus className="w-3.5 h-3.5 text-rose-400" /> Discharge Patient
                      </button>
                    ) : (
                      <div className="text-center py-1 text-slate-500 text-[11px] font-mono italic">
                        Maintenance Mode
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Active IPD Admissions Summary Desk */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-400" /> Active Inpatient Admissions ({activeAllocations.length})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold bg-slate-950/60">
                <th className="py-3 px-4">Patient Name & MRN</th>
                <th className="py-3 px-4">Ward & Bed</th>
                <th className="py-3 px-4 text-right">Daily Rate</th>
                <th className="py-3 px-4">Admitted Date</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {activeAllocations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500 italic">
                    No active inpatient admissions currently.
                  </td>
                </tr>
              ) : (
                activeAllocations.map((alloc) => (
                  <tr key={alloc.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-bold text-white">
                      <div>
                        {alloc.patient.firstName} {alloc.patient.lastName}
                      </div>
                      <div className="text-[10px] text-cyan-400 font-mono">{alloc.patient.mrn}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-200">
                      {alloc.bed?.ward?.name || 'Ward'} &bull; Bed {alloc.bed?.bedNumber}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-cyan-300">
                      ${alloc.bed?.dailyCharge.toFixed(2)}/day
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono">
                      {new Date(alloc.admittedAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-400 italic max-w-xs truncate">
                      {alloc.notes || 'Routine admission'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDischarge(alloc.id)}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold hover:bg-rose-500/30 transition text-[11px]"
                      >
                        Discharge
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admit Patient Modal */}
      {admitModal && selectedBedForAdmit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-400" /> Admit Patient to Bed {selectedBedForAdmit.bedNumber}
              </h3>
              <button onClick={() => setAdmitModal(false)} className="text-slate-400 hover:text-white font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleAllocateBed} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Select Patient *</label>
                <select
                  required
                  value={admitForm.patientId}
                  onChange={(e) => setAdmitForm({ ...admitForm, patientId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- Select Patient from Registry --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.mrn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Admission Notes / Reason</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Post-operative recovery observation..."
                  value={admitForm.notes}
                  onChange={(e) => setAdmitForm({ ...admitForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-400 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Daily Bed Rate:</span>
                  <span className="font-bold text-white">${selectedBedForAdmit.dailyCharge.toFixed(2)} / day</span>
                </div>
                <div className="flex justify-between">
                  <span>Admission Date:</span>
                  <span className="font-bold text-cyan-300">Today ({new Date().toLocaleDateString()})</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdmitModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition"
                >
                  {actionLoading ? 'Admitting...' : 'Confirm Admission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Bed Modal */}
      {addBedModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" /> Add New Bed to Ward
              </h3>
              <button onClick={() => setAddBedModal(false)} className="text-slate-400 hover:text-white font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateBed} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Target Ward *</label>
                <select
                  required
                  value={bedForm.wardId}
                  onChange={(e) => setBedForm({ ...bedForm, wardId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- Choose Ward --</option>
                  {wards.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Bed Number / Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ICU-05 or BED-102"
                  value={bedForm.bedNumber}
                  onChange={(e) => setBedForm({ ...bedForm, bedNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Daily Charge Rate ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="250.00"
                  value={bedForm.dailyCharge}
                  onChange={(e) => setBedForm({ ...bedForm, dailyCharge: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAddBedModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition"
                >
                  {actionLoading ? 'Adding...' : 'Add Bed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
