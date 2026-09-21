import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doctorRosterAPI } from '../services/api';
import {
  CalendarClock,
  Stethoscope,
  Clock,
  Building2,
  DollarSign,
  UserPlus,
  Edit3,
  CheckCircle2,
  Search,
  Filter,
  RefreshCw,
  Award,
  Sparkles,
  MapPin,
  Calendar,
  X,
  ShieldCheck,
  Activity,
  ChevronRight,
} from 'lucide-react';

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const Day1DoctorRosterExplorer = () => {
  const { user, isAuthenticated, role } = useAuth();

  const [doctors, setDoctors] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [onlyOnDuty, setOnlyOnDuty] = useState(false);

  // Modals state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [onboardModalOpen, setOnboardModalOpen] = useState(false);
  const [activeDoctor, setActiveDoctor] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Edit Roster Form
  const [editForm, setEditForm] = useState({
    shiftStart: '09:00',
    shiftEnd: '17:00',
    roomNumber: '',
    consultationFee: 100,
    availableDays: 'Mon,Tue,Wed,Thu,Fri',
  });

  // Onboard Doctor Form
  const [onboardForm, setOnboardForm] = useState({
    fullName: '',
    email: '',
    phone: '+1-555-0100',
    password: 'Password@123',
    specialization: '',
    qualification: 'MBBS, MD',
    licenseNumber: '',
    consultationFee: 120,
    roomNumber: 'Room 201',
    shiftStart: '09:00',
    shiftEnd: '15:00',
    availableDays: 'Mon,Tue,Wed,Thu,Fri',
    bio: '',
  });

  useEffect(() => {
    loadRoster();
  }, [selectedDept, onlyOnDuty]);

  const loadRoster = async () => {
    setLoading(true);
    try {
      const [rosterRes, statsRes] = await Promise.all([
        doctorRosterAPI.getAll({
          search: searchQuery,
          availableToday: onlyOnDuty ? 'true' : undefined,
        }),
        doctorRosterAPI.getStats().catch(() => null),
      ]);

      if (rosterRes && rosterRes.success) {
        setDoctors(rosterRes.doctors || []);
      }
      if (statsRes && statsRes.success) {
        setStats(statsRes);
      }
    } catch (err) {
      console.error('Error loading doctor roster:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditRoster = (doc) => {
    setActiveDoctor(doc);
    setEditForm({
      shiftStart: doc.shiftStart || '09:00',
      shiftEnd: doc.shiftEnd || '17:00',
      roomNumber: doc.roomNumber || '',
      consultationFee: doc.consultationFee || 100,
      availableDays: doc.availableDays || 'Mon,Tue,Wed,Thu,Fri',
    });
    setEditModalOpen(true);
  };

  const toggleEditDay = (day) => {
    const current = editForm.availableDays ? editForm.availableDays.split(',').map((d) => d.trim()).filter(Boolean) : [];
    let updated;
    if (current.includes(day)) {
      updated = current.filter((d) => d !== day);
    } else {
      updated = [...current, day];
    }
    setEditForm({ ...editForm, availableDays: updated.join(',') });
  };

  const toggleOnboardDay = (day) => {
    const current = onboardForm.availableDays ? onboardForm.availableDays.split(',').map((d) => d.trim()).filter(Boolean) : [];
    let updated;
    if (current.includes(day)) {
      updated = current.filter((d) => d !== day);
    } else {
      updated = [...current, day];
    }
    setOnboardForm({ ...onboardForm, availableDays: updated.join(',') });
  };

  const handleSaveRoster = async (e) => {
    e.preventDefault();
    if (!activeDoctor) return;
    try {
      const res = await doctorRosterAPI.updateRoster(activeDoctor.id, editForm);
      if (res.success) {
        setActionSuccess(`Shift roster updated for Dr. ${activeDoctor.fullName}!`);
        setEditModalOpen(false);
        loadRoster();
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleOnboardDoctor = async (e) => {
    e.preventDefault();
    try {
      const res = await doctorRosterAPI.create(onboardForm);
      if (res.success) {
        setActionSuccess(`Dr. ${onboardForm.fullName} onboarded with shift roster!`);
        setOnboardModalOpen(false);
        loadRoster();
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
              <CalendarClock className="w-3.5 h-3.5 text-teal-400" />
              Module 2 &bull; Day 1 Deliverable
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Doctor Profiles & Clinical Shift Rostering
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Manage physician schedules, consultation fees, examination room assignments, weekly shift rosters, and real-time on-duty status.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setOnboardModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-500/20 flex items-center gap-2 transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Onboard New Physician</span>
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

      {/* 2. Roster Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Physicians</span>
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <Stethoscope className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white mt-2">
            {stats?.totalDoctors || doctors.length}
          </div>
          <span className="text-[11px] text-teal-400 font-medium mt-1 inline-block">
            Across 4 Clinical Depts
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">On Duty Today ({stats?.todayDay || 'Today'})</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-2">
            {stats?.onDutyToday ?? doctors.filter((d) => d.isOnDutyToday).length}
          </div>
          <span className="text-[11px] text-slate-400 font-medium mt-1 inline-block">
            Active OPD consultations
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Avg Consultation Fee</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-indigo-400 mt-2">
            ${stats?.averageFee || '135.00'}
          </div>
          <span className="text-[11px] text-slate-400 font-medium mt-1 inline-block">
            Standard OPD rate
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Shift Coverage</span>
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-purple-400 mt-2">100%</div>
          <span className="text-[11px] text-purple-400 font-medium mt-1 inline-block">
            Morning & Evening Shifts
          </span>
        </div>
      </div>

      {/* 3. Search & Roster Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              doctorRosterAPI.getAll({ search: e.target.value }).then((res) => {
                if (res.success) setDoctors(res.doctors || []);
              });
            }}
            placeholder="Search physician by name, specialization, license, room..."
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setOnlyOnDuty(!onlyOnDuty)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              onlyOnDuty
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>On Duty Today</span>
          </button>

          <button
            onClick={loadRoster}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl transition"
            title="Refresh Roster"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4. Doctors Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-16 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-teal-400" />
            <span>Loading clinical shift rosters...</span>
          </div>
        ) : doctors.length > 0 ? (
          doctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4 transition flex flex-col justify-between"
            >
              <div>
                {/* Card Top: Avatar, Name & Duty Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        doc.avatarUrl ||
                        `https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100`
                      }
                      alt={doc.fullName}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-700 flex-shrink-0"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-white leading-tight">
                        {doc.fullName}
                      </h3>
                      <p className="text-xs text-teal-300 font-medium mt-0.5">
                        {doc.specialization}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {doc.qualification}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      doc.isOnDutyToday
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {doc.isOnDutyToday ? '● On Duty' : '○ Off Today'}
                  </span>
                </div>

                {/* Details Table: Department, License, Room, Fee */}
                <div className="grid grid-cols-2 gap-2 mt-4 text-[11px] bg-slate-800/40 p-3 rounded-xl border border-slate-700/60">
                  <div>
                    <span className="text-slate-400">Department</span>
                    <div className="font-bold text-white mt-0.5 truncate">
                      {doc.department?.name || 'General OPD'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">License #</span>
                    <div className="font-mono text-cyan-300 mt-0.5">{doc.licenseNumber}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Exam Room</span>
                    <div className="font-bold text-white mt-0.5">{doc.roomNumber || 'Room 101'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Consultation Fee</span>
                    <div className="font-bold text-emerald-400 mt-0.5">
                      ${doc.consultationFee?.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Shift Hours & Working Days */}
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-teal-400" /> Shift Hours:
                    </span>
                    <span className="font-mono font-bold text-white">{doc.shiftTimeFormatted}</span>
                  </div>

                  <div className="flex items-center gap-1 pt-1 flex-wrap">
                    {WEEK_DAYS.map((day) => {
                      const isWorking = doc.workingDaysList?.includes(day);
                      return (
                        <span
                          key={day}
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                            isWorking
                              ? 'bg-teal-500/20 text-teal-300 border border-teal-400/30'
                              : 'bg-slate-800 text-slate-500 border border-slate-800'
                          }`}
                        >
                          {day}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-800 mt-4">
                <button
                  onClick={() => handleOpenEditRoster(doc)}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Edit3 className="w-3.5 h-3.5 text-teal-400" />
                  <span>Configure Shift Roster</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 text-center text-xs text-slate-500">
            No doctors found matching the search criteria.
          </div>
        )}
      </div>

      {/* 5. Edit Doctor Shift Roster Modal */}
      {editModalOpen && activeDoctor && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-teal-400" />
                Configure Shift Roster — {activeDoctor.fullName}
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRoster} className="space-y-3.5 text-xs">
              {/* Working Days Selector */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Available Working Days (Mon - Sun)
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {WEEK_DAYS.map((day) => {
                    const isSelected = editForm.availableDays
                      .split(',')
                      .map((d) => d.trim())
                      .includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleEditDay(day)}
                        className={`px-2.5 py-1.5 rounded-lg border font-mono font-bold text-xs transition ${
                          isSelected
                            ? 'bg-teal-500 text-slate-950 border-teal-400'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Shift Start & End */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Shift Start Time</label>
                  <input
                    type="time"
                    required
                    value={editForm.shiftStart}
                    onChange={(e) => setEditForm({ ...editForm, shiftStart: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Shift End Time</label>
                  <input
                    type="time"
                    required
                    value={editForm.shiftEnd}
                    onChange={(e) => setEditForm({ ...editForm, shiftEnd: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Examination Room & Consultation Fee */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Assigned Room</label>
                  <input
                    type="text"
                    required
                    value={editForm.roomNumber}
                    onChange={(e) => setEditForm({ ...editForm, roomNumber: e.target.value })}
                    placeholder="e.g. Room 204"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Consultation Fee ($)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="5"
                    value={editForm.consultationFee}
                    onChange={(e) =>
                      setEditForm({ ...editForm, consultationFee: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold"
                >
                  Save Shift Roster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Onboard New Physician Modal */}
      {onboardModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-teal-400" />
                Onboard Physician & Setup Shift Roster
              </h3>
              <button
                onClick={() => setOnboardModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleOnboardDoctor} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={onboardForm.fullName}
                    onChange={(e) => setOnboardForm({ ...onboardForm, fullName: e.target.value })}
                    placeholder="e.g. Dr. Arthur Conan, MD"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Work Email *</label>
                  <input
                    type="email"
                    required
                    value={onboardForm.email}
                    onChange={(e) => setOnboardForm({ ...onboardForm, email: e.target.value })}
                    placeholder="doctor@hms.hospital"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Specialization *</label>
                  <input
                    type="text"
                    required
                    value={onboardForm.specialization}
                    onChange={(e) =>
                      setOnboardForm({ ...onboardForm, specialization: e.target.value })
                    }
                    placeholder="e.g. Orthopedic Trauma"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">License Number *</label>
                  <input
                    type="text"
                    required
                    value={onboardForm.licenseNumber}
                    onChange={(e) =>
                      setOnboardForm({ ...onboardForm, licenseNumber: e.target.value })
                    }
                    placeholder="e.g. LIC-ORTHO-88319"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Qualification *</label>
                  <input
                    type="text"
                    required
                    value={onboardForm.qualification}
                    onChange={(e) =>
                      setOnboardForm({ ...onboardForm, qualification: e.target.value })
                    }
                    placeholder="MBBS, FCPS"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Room #</label>
                  <input
                    type="text"
                    required
                    value={onboardForm.roomNumber}
                    onChange={(e) => setOnboardForm({ ...onboardForm, roomNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Fee ($)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={onboardForm.consultationFee}
                    onChange={(e) =>
                      setOnboardForm({ ...onboardForm, consultationFee: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Shift Hours */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Shift Start</label>
                  <input
                    type="time"
                    required
                    value={onboardForm.shiftStart}
                    onChange={(e) => setOnboardForm({ ...onboardForm, shiftStart: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Shift End</label>
                  <input
                    type="time"
                    required
                    value={onboardForm.shiftEnd}
                    onChange={(e) => setOnboardForm({ ...onboardForm, shiftEnd: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Working Days */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Weekly Working Days</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {WEEK_DAYS.map((day) => {
                    const isSelected = onboardForm.availableDays
                      .split(',')
                      .map((d) => d.trim())
                      .includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleOnboardDay(day)}
                        className={`px-2.5 py-1.5 rounded-lg border font-mono font-bold text-xs transition ${
                          isSelected
                            ? 'bg-teal-500 text-slate-950 border-teal-400'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setOnboardModalOpen(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-teal-500/20"
                >
                  Onboard Physician
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
