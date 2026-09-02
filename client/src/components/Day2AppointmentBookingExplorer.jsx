import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { appointmentsAPI, doctorRosterAPI, patientsAPI } from '../services/api';
import {
  Calendar,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Ticket,
  Search,
  Filter,
  RefreshCw,
  X,
  ChevronRight,
  ChevronLeft,
  CalendarCheck,
  DollarSign,
  Building2,
  Phone,
  AlertTriangle,
  RotateCcw,
  Ban,
  Printer,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export const Day2AppointmentBookingExplorer = () => {
  const { user, isAuthenticated, role } = useAuth();

  // Booking Flow State
  const [step, setStep] = useState(1); // 1: Select Doctor, 2: Select Date & Slot, 3: Select Patient & Confirm
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0] // Tomorrow by default
  );
  const [slotsData, setSlotsData] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [bookingType, setBookingType] = useState('OPD');
  const [reasonForVisit, setReasonForVisit] = useState('Routine Checkup');
  const [bookingNotes, setBookingNotes] = useState('');

  // Appointments Directory & Stats
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [issuedBooking, setIssuedBooking] = useState(null);

  // Reschedule & Cancel Modals
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [targetAppointment, setTargetAppointment] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState(null);
  const [rescheduleSelectedSlot, setRescheduleSelectedSlot] = useState(null);

  useEffect(() => {
    loadInitialData();
    loadAppointments();
  }, []);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      loadSlots(selectedDoctor.id, selectedDate);
    }
  }, [selectedDoctor, selectedDate]);

  const loadInitialData = async () => {
    try {
      const [docsRes, patsRes, statsRes] = await Promise.all([
        doctorRosterAPI.getAll(),
        patientsAPI.getAll({ limit: 50 }),
        appointmentsAPI.getStats().catch(() => null),
      ]);
      if (docsRes.success) {
        setDoctors(docsRes.doctors || []);
        if (docsRes.doctors?.length > 0 && !selectedDoctor) {
          setSelectedDoctor(docsRes.doctors[0]);
        }
      }
      if (patsRes.success) {
        setPatients(patsRes.patients || []);
        if (patsRes.patients?.length > 0 && !selectedPatient) {
          setSelectedPatient(patsRes.patients[0]);
        }
      }
      if (statsRes && statsRes.success) {
        setStats(statsRes);
      }
    } catch (err) {
      console.error('Initial load error:', err);
    }
  };

  const loadSlots = async (docId, dateStr) => {
    setLoadingSlots(true);
    try {
      const res = await appointmentsAPI.getAvailableSlots(docId, dateStr);
      if (res.success) {
        setSlotsData(res);
        setSelectedSlot(null);
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const loadAppointments = async () => {
    setLoadingList(true);
    try {
      const res = await appointmentsAPI.getAll({
        date: filterDate || undefined,
        status: filterStatus || undefined,
      });
      if (res.success) {
        setAppointments(res.appointments || []);
      }
    } catch (err) {
      console.error('Error loading appointments:', err);
    } finally {
      setLoadingList(false);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!selectedDoctor || !selectedSlot || !selectedPatient) {
      alert('Please select Doctor, Date/Time Slot, and Patient.');
      return;
    }

    try {
      const res = await appointmentsAPI.book({
        doctorId: selectedDoctor.id,
        patientId: selectedPatient.id,
        appointmentDate: selectedDate,
        timeSlot: selectedSlot.timeSlot,
        type: bookingType,
        reasonForVisit,
        notes: bookingNotes,
      });

      if (res.success) {
        setIssuedBooking(res.appointment);
        setActionSuccess(`Appointment successfully booked for ${selectedPatient.firstName}!`);
        loadSlots(selectedDoctor.id, selectedDate);
        loadAppointments();
        setStep(1);
        setSelectedSlot(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleOpenReschedule = async (appt) => {
    setTargetAppointment(appt);
    setRescheduleDate(appt.appointmentDate.split('T')[0]);
    setRescheduleModalOpen(true);
    try {
      const res = await appointmentsAPI.getAvailableSlots(
        appt.doctorId,
        appt.appointmentDate.split('T')[0]
      );
      if (res.success) {
        setRescheduleSlots(res);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRescheduleDateChange = async (newDate) => {
    setRescheduleDate(newDate);
    if (!targetAppointment) return;
    try {
      const res = await appointmentsAPI.getAvailableSlots(targetAppointment.doctorId, newDate);
      if (res.success) {
        setRescheduleSlots(res);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const submitReschedule = async () => {
    if (!targetAppointment || !rescheduleSelectedSlot) return;
    try {
      const res = await appointmentsAPI.reschedule(targetAppointment.id, {
        appointmentDate: rescheduleDate,
        timeSlot: rescheduleSelectedSlot.timeSlot,
        reason: 'Patient requested slot change',
      });
      if (res.success) {
        setActionSuccess('Appointment successfully rescheduled!');
        setRescheduleModalOpen(false);
        loadAppointments();
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleCancelAppointment = async (apptId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment and release the time slot?')) {
      return;
    }
    try {
      const res = await appointmentsAPI.cancel(apptId, {
        cancellationReason: 'Cancelled via OPD Desk',
      });
      if (res.success) {
        setActionSuccess('Appointment cancelled and slot released.');
        loadAppointments();
        if (selectedDoctor && selectedDate) {
          loadSlots(selectedDoctor.id, selectedDate);
        }
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
              <CalendarCheck className="w-3.5 h-3.5 text-teal-400" />
              Module 2 &bull; Day 2 Deliverable
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Slot Booking Engine & OPD Appointment Scheduling
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Dynamic time slot generation based on physician shift rosters, collision-free slot reservation, automated queue token issuance, and live schedule management.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-4 min-w-[240px]">
            <div className="text-xs text-teal-200 font-semibold">Today's OPD Bookings:</div>
            <div className="text-2xl font-black text-white mt-1">
              {stats?.todayTotal || appointments.length} <span className="text-xs font-normal text-teal-300">Slots Booked</span>
            </div>
            <div className="text-[11px] text-emerald-300 font-medium mt-0.5">
              ● Collision Guard Active
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

      {/* Issued Ticket Voucher Notification */}
      {issuedBooking && (
        <div className="bg-gradient-to-r from-slate-900 to-teal-950 border border-teal-500/40 rounded-2xl p-5 shadow-xl space-y-3 relative overflow-hidden animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
              <Ticket className="w-5 h-5 text-teal-400" />
              <span>OPD Appointment Voucher & Token Issued</span>
            </div>
            <button
              onClick={() => setIssuedBooking(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
              <span className="text-slate-400">Queue Token #</span>
              <div className="text-lg font-black text-teal-400 font-mono mt-0.5">
                {issuedBooking.queueToken?.tokenCode || 'OPD-001'}
              </div>
            </div>
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
              <span className="text-slate-400">Patient Details</span>
              <div className="font-bold text-white mt-0.5 truncate">
                {issuedBooking.patient?.firstName} {issuedBooking.patient?.lastName}
              </div>
              <span className="text-[10px] text-cyan-300 font-mono">
                {issuedBooking.patient?.mrn}
              </span>
            </div>
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
              <span className="text-slate-400">Attending Doctor</span>
              <div className="font-bold text-white mt-0.5 truncate">
                {issuedBooking.doctor?.user?.fullName}
              </div>
              <span className="text-[10px] text-teal-300">
                {issuedBooking.doctor?.roomNumber || 'Room 201'}
              </span>
            </div>
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
              <span className="text-slate-400">Date & Slot</span>
              <div className="font-bold text-white mt-0.5">
                {new Date(issuedBooking.appointmentDate).toLocaleDateString()}
              </div>
              <span className="text-[10px] text-purple-300 font-mono">
                {issuedBooking.timeSlot}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Main 2-Column Interface: Booking Wizard (Left) & Live Schedule Table (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive 3-Step Booking Wizard (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-400" />
              OPD Slot Booking Wizard
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold">
              Step {step} of 3
            </span>
          </div>

          {/* Wizard Step Progress Pills */}
          <div className="grid grid-cols-3 gap-1.5 text-[11px] font-semibold">
            <button
              onClick={() => setStep(1)}
              className={`py-1.5 rounded-lg transition text-center ${
                step === 1
                  ? 'bg-teal-600 text-white shadow'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              1. Doctor
            </button>
            <button
              onClick={() => selectedDoctor && setStep(2)}
              disabled={!selectedDoctor}
              className={`py-1.5 rounded-lg transition text-center ${
                step === 2
                  ? 'bg-teal-600 text-white shadow'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white disabled:opacity-40'
              }`}
            >
              2. Date & Slots
            </button>
            <button
              onClick={() => selectedSlot && setStep(3)}
              disabled={!selectedSlot}
              className={`py-1.5 rounded-lg transition text-center ${
                step === 3
                  ? 'bg-teal-600 text-white shadow'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white disabled:opacity-40'
              }`}
            >
              3. Patient & Confirm
            </button>
          </div>

          {/* STEP 1: Select Attending Physician */}
          {step === 1 && (
            <div className="space-y-3 animate-in fade-in">
              <label className="block text-xs font-bold text-slate-300">
                Select Attending Physician & Department:
              </label>

              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {doctors.map((doc) => {
                  const isSelected = selectedDoctor?.id === doc.id;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDoctor(doc)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-teal-600/20 border-teal-500/60 ring-1 ring-teal-500/40'
                          : 'bg-slate-800/40 hover:bg-slate-800/80 border-slate-700/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            doc.avatarUrl ||
                            'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100'
                          }
                          alt={doc.fullName}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-700"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-white">{doc.fullName}</h4>
                          <p className="text-[11px] text-teal-300">{doc.specialization}</p>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>{doc.department?.name || 'General OPD'}</span>
                            <span>&bull;</span>
                            <span className="text-emerald-400 font-bold">
                              ${doc.consultationFee}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-mono text-slate-400">
                          {doc.roomNumber || 'Room 101'}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1">
                          {doc.shiftStart} - {doc.shiftEnd}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedDoctor}
                  className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <span>Proceed to Select Date & Slots</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Select Date & Live Slot Grid */}
          {step === 2 && selectedDoctor && (
            <div className="space-y-4 animate-in fade-in">
              {/* Doctor Summary Header */}
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white">{selectedDoctor.fullName}</div>
                  <div className="text-[11px] text-teal-300">{selectedDoctor.specialization}</div>
                </div>
                <div className="text-right">
                  <span className="text-emerald-400 font-bold">${selectedDoctor.consultationFee}</span>
                  <div className="text-[10px] text-slate-400">{selectedDoctor.roomNumber}</div>
                </div>
              </div>

              {/* Date Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Choose Appointment Date:
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-teal-500 focus:outline-none font-mono"
                />
              </div>

              {/* Slot Occupancy Bar */}
              {slotsData?.summary && (
                <div className="flex items-center justify-between text-xs px-2 py-1.5 bg-slate-800/40 rounded-lg border border-slate-800">
                  <span className="text-slate-400">
                    Day: <strong>{slotsData.dayOfWeek}</strong> &bull; Total Slots:{' '}
                    <strong>{slotsData.summary.totalSlots}</strong>
                  </span>
                  <span className="text-teal-300 font-bold">
                    {slotsData.summary.availableSlots} Available
                  </span>
                </div>
              )}

              {/* Slots Grid */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  Select an Available Time Slot:
                </label>

                {loadingSlots ? (
                  <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
                    <span>Generating doctor slots...</span>
                  </div>
                ) : !slotsData?.isDoctorWorking ? (
                  <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl text-xs text-amber-300 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Doctor Not Scheduled
                    </div>
                    <p className="text-[11px] text-slate-400">{slotsData?.message}</p>
                  </div>
                ) : slotsData?.slots?.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
                    {slotsData.slots.map((slot) => {
                      const isSelected = selectedSlot?.timeSlot === slot.timeSlot;
                      const isAvail = slot.isAvailable;

                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={!isAvail}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-2.5 rounded-xl border text-xs font-mono font-bold transition flex items-center justify-between ${
                            isSelected
                              ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-md ring-2 ring-teal-400/50'
                              : isAvail
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                              : 'bg-red-950/20 text-red-400/50 border-red-900/30 cursor-not-allowed opacity-50'
                          }`}
                        >
                          <span>{slot.timeSlot}</span>
                          <span
                            className={`text-[9px] px-1 py-0.5 rounded font-sans uppercase ${
                              isAvail ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                            }`}
                          >
                            {isAvail ? 'Free' : 'Taken'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-slate-500">
                    No time slots configured.
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!selectedSlot}
                  onClick={() => setStep(3)}
                  className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <span>Confirm Slot ({selectedSlot?.timeSlot || 'Select'})</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Select Patient & Confirm Booking */}
          {step === 3 && (
            <form onSubmit={handleBookAppointment} className="space-y-4 animate-in fade-in text-xs">
              {/* Summary Card */}
              <div className="p-3.5 bg-slate-800/70 border border-teal-500/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Doctor:</span>
                  <span className="font-bold text-white">{selectedDoctor?.fullName}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Date & Slot:</span>
                  <span className="font-mono font-bold text-teal-300">
                    {selectedDate} &bull; {selectedSlot?.timeSlot}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Fee & Room:</span>
                  <span className="font-bold text-emerald-400">
                    ${selectedDoctor?.consultationFee} ({selectedDoctor?.roomNumber})
                  </span>
                </div>
              </div>

              {/* Patient Selector */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Select Patient (or search by MRN):
                </label>
                <select
                  required
                  value={selectedPatient?.id || ''}
                  onChange={(e) => {
                    const pat = patients.find((p) => p.id === e.target.value);
                    setSelectedPatient(pat);
                  }}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} — ({p.mrn}) — Blood: {p.bloodGroup || 'N/A'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Appointment Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Visit Type</label>
                  <select
                    value={bookingType}
                    onChange={(e) => setBookingType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                  >
                    <option value="OPD">OPD Consultation</option>
                    <option value="FOLLOW_UP">Follow-up Visit</option>
                    <option value="EMERGENCY">Emergency Triage</option>
                    <option value="ROUTINE">Routine Health Check</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Chief Complaint / Reason</label>
                  <input
                    type="text"
                    required
                    value={reasonForVisit}
                    onChange={(e) => setReasonForVisit(e.target.value)}
                    placeholder="e.g. Chest pain, Fever..."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Book Appointment & Generate Token</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Column: Live OPD Appointments Directory (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-teal-400" />
                  OPD Appointments & Schedule Registry
                </h3>
                <span className="text-[11px] text-slate-400">
                  Real-time booking and queue tokens registry
                </span>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => {
                    setFilterDate(e.target.value);
                    appointmentsAPI
                      .getAll({ date: e.target.value, status: filterStatus })
                      .then((res) => {
                        if (res.success) setAppointments(res.appointments || []);
                      });
                  }}
                  className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none"
                />
                <button
                  onClick={loadAppointments}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg"
                  title="Refresh"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingList ? 'animate-spin text-teal-400' : ''}`} />
                </button>
              </div>
            </div>

            {/* Appointments List */}
            <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
              {loadingList ? (
                <div className="py-16 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
                  <span>Loading scheduled appointments...</span>
                </div>
              ) : appointments.length > 0 ? (
                appointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl hover:border-slate-600 transition space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            {appt.patientFullName}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                            {appt.patient?.mrn}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              appt.status === 'SCHEDULED'
                                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                                : appt.status === 'CONFIRMED'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : appt.status === 'COMPLETED'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-red-500/20 text-red-300 border border-red-500/30'
                            }`}
                          >
                            {appt.status}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-300 mt-1">
                          <strong>Dr. {appt.doctorFullName}</strong> &bull;{' '}
                          <span className="text-teal-400">{appt.departmentName}</span>
                        </div>
                      </div>

                      {/* Token Code */}
                      {appt.queueToken && (
                        <div className="text-right">
                          <span className="text-[9px] text-slate-400 uppercase font-semibold">Token</span>
                          <div className="text-xs font-mono font-bold text-teal-400">
                            {appt.queueToken.tokenCode}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Time Slot & Date Bar */}
                    <div className="flex items-center justify-between text-xs bg-slate-900/60 px-3 py-2 rounded-lg border border-slate-800">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-teal-400" />
                        <span className="font-mono font-bold text-white">{appt.timeSlot}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-300 font-mono">
                          {new Date(appt.appointmentDate).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                        {appt.reasonForVisit || 'General Visit'}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {appt.status !== 'CANCELLED' && appt.status !== 'COMPLETED' && (
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => handleOpenReschedule(appt)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                        >
                          <RotateCcw className="w-3 h-3 text-teal-400" />
                          <span>Reschedule</span>
                        </button>
                        <button
                          onClick={() => handleCancelAppointment(appt.id)}
                          className="px-2.5 py-1 bg-red-950/30 hover:bg-red-900/40 text-red-400 hover:text-red-300 border border-red-800/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                        >
                          <Ban className="w-3 h-3" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-16 text-xs text-slate-500">
                  No appointments found for the selected filter criteria.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reschedule Modal */}
      {rescheduleModalOpen && targetAppointment && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-teal-400" />
                Reschedule Appointment
              </h3>
              <button
                onClick={() => setRescheduleModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">New Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => handleRescheduleDateChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Choose New Time Slot:
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto">
                  {rescheduleSlots?.slots?.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      disabled={!s.isAvailable}
                      onClick={() => setRescheduleSelectedSlot(s)}
                      className={`p-2 rounded-lg border text-xs font-mono font-bold transition ${
                        rescheduleSelectedSlot?.timeSlot === s.timeSlot
                          ? 'bg-teal-500 text-slate-950 border-teal-400'
                          : s.isAvailable
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                          : 'bg-red-950/20 text-red-400/40 border-slate-800 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      {s.timeSlot}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setRescheduleModalOpen(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!rescheduleSelectedSlot}
                  onClick={submitReschedule}
                  className="flex-1 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  Confirm Reschedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
