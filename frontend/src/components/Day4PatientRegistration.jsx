import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { patientsAPI } from '../services/api';
import {
  UserPlus,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Printer,
  Sparkles,
  HeartPulse,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Shield,
  FileText,
  RefreshCw,
  Clock,
  IdCard,
  Droplet,
  Filter,
  Check,
  ChevronRight,
  Eye,
  X,
} from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const Day4PatientRegistration = () => {
  const { user, isAuthenticated, role } = useAuth();

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'MALE',
    dateOfBirth: '1998-05-15',
    bloodGroup: 'B+',
    phone: '+92-300-1234567',
    email: '',
    address: '12-B Hospital Road, Sector G-9/1, Islamabad',
    nationalId: '61101-9876543-1',
    emergencyContactName: 'Asad Ali',
    emergencyContactPhone: '+92-302-7654321',
    emergencyContactRelation: 'Brother',
    allergies: 'Penicillin, Dust Mites',
    chronicConditions: 'None',
    notes: 'Initial clinical OPD walk-in registration.',
  });

  // Calculation & Registry State
  const [submitting, setSubmitting] = useState(false);
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBloodGroup, setFilterBloodGroup] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [registeredCard, setRegisteredCard] = useState(null);
  const [selectedPatientModal, setSelectedPatientModal] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadPatientsAndStats();
  }, []);

  const loadPatientsAndStats = async () => {
    setLoading(true);
    try {
      const [patientsRes, statsRes] = await Promise.all([
        patientsAPI.getAll().catch(() => null),
        patientsAPI.getStats().catch(() => null),
      ]);
      if (patientsRes && patientsRes.success) {
        setPatients(patientsRes.patients || []);
      }
      if (statsRes && statsRes.success) {
        setStats(statsRes);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const diff = Date.now() - birthDate.getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await patientsAPI.register(formData);
      if (res.success) {
        setRegisteredCard(res.patient);
        setMessage({
          type: 'success',
          text: `Success! Patient registered with MRN: ${res.patient.mrn}`,
        });
        loadPatientsAndStats();
        // Reset form to defaults
        setFormData({
          firstName: '',
          lastName: '',
          gender: 'FEMALE',
          dateOfBirth: '1996-08-20',
          bloodGroup: 'O+',
          phone: '+92-300-5551234',
          email: '',
          address: '',
          nationalId: '',
          emergencyContactName: '',
          emergencyContactPhone: '',
          emergencyContactRelation: 'Spouse',
          allergies: 'None',
          chronicConditions: 'None',
          notes: '',
        });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      searchTerm === '' ||
      p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm);

    const matchesBlood = !filterBloodGroup || p.bloodGroup === filterBloodGroup;
    const matchesGender = !filterGender || p.gender === filterGender;

    return matchesSearch && matchesBlood && matchesGender;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-teal-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-xs font-semibold text-emerald-300 mb-2">
              <UserPlus className="w-3.5 h-3.5 text-teal-400" />
              Module 1 &bull; Day 4 Deliverable
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Patient Registration & Demographic Management
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Intelligent clinical intake forms, collision-safe sequential Medical Record Number (MRN-YYYY-XXXX)
              generator, emergency contact registry, and real-time patient demographics.
            </p>
          </div>

          {/* Counters Pill */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-4 min-w-[260px] flex items-center justify-between">
            <div>
              <div className="text-xs text-emerald-200 font-semibold">Total Registered Patients</div>
              <div className="text-2xl font-extrabold text-white mt-1">
                {patients.length || '...'}
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-medium animate-in fade-in ${
            message.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-red-950/60 border-red-500/40 text-red-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* 2. Registered Patient ID Card Preview (If newly registered) */}
      {registeredCard && (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border-2 border-emerald-500/40 rounded-2xl p-6 shadow-2xl relative">
          <button
            onClick={() => setRegisteredCard(null)}
            className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <IdCard className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
                  New Patient ID Card Issued
                </div>
                <h3 className="text-lg font-bold text-white">{registeredCard.fullName}</h3>
              </div>
            </div>
            <div className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-xs font-mono font-bold text-emerald-300">
              MRN: {registeredCard.mrn}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs">
            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/60">
              <span className="text-slate-400">Gender / Age:</span>
              <div className="font-bold text-white mt-0.5">
                {registeredCard.gender} &bull; {registeredCard.age} yrs
              </div>
            </div>
            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/60">
              <span className="text-slate-400">Blood Group:</span>
              <div className="font-bold text-red-400 mt-0.5">{registeredCard.bloodGroup}</div>
            </div>
            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/60">
              <span className="text-slate-400">Phone Contact:</span>
              <div className="font-bold text-white font-mono mt-0.5">{registeredCard.phone}</div>
            </div>
            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/60">
              <span className="text-slate-400">Emergency Contact:</span>
              <div className="font-bold text-cyan-300 mt-0.5 truncate">
                {registeredCard.emergencyContactName} ({registeredCard.emergencyContactRelation})
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Form & Side Quick Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Patient Demographic Intake Form (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Clinical Patient Registration Form</h3>
                <p className="text-xs text-slate-400">
                  Fill in demographics &bull; Auto-assigned sequential MRN
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-lg">
              Auto MRN ID
            </span>
          </div>

          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {/* 1. Personal Demographics */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <IdCard className="w-3.5 h-3.5 text-blue-400" />
                1. Personal Demographics
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="e.g. Fatima"
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="e.g. Tariq"
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    required
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Gender *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Blood Group *
                  </label>
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Contact & Address */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                2. Contact & Identification
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Primary Phone Number *
                  </label>
                  <input
                    type="text"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+92-300-XXXXXXX"
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    National ID / CNIC
                  </label>
                  <input
                    type="text"
                    name="nationalId"
                    value={formData.nationalId}
                    onChange={handleInputChange}
                    placeholder="61101-XXXXXXX-X"
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Residential Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="House, Street, Sector, City"
                  className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* 3. Emergency Contacts & Guardian */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-red-400" />
                3. Emergency Contact & Guardian
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    name="emergencyContactName"
                    required
                    value={formData.emergencyContactName}
                    onChange={handleInputChange}
                    placeholder="Name of relative"
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Relationship *
                  </label>
                  <input
                    type="text"
                    name="emergencyContactRelation"
                    required
                    value={formData.emergencyContactRelation}
                    onChange={handleInputChange}
                    placeholder="e.g. Spouse / Brother"
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Emergency Phone *
                  </label>
                  <input
                    type="text"
                    name="emergencyContactPhone"
                    required
                    value={formData.emergencyContactPhone}
                    onChange={handleInputChange}
                    placeholder="+92-300-XXXXXXX"
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 4. Medical Baseline & Allergies */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                4. Medical Baseline & Allergies
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Known Drug / Food Allergies
                  </label>
                  <input
                    type="text"
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleInputChange}
                    placeholder="e.g. Penicillin, Sulfa, Peanuts"
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Chronic Conditions
                  </label>
                  <input
                    type="text"
                    name="chronicConditions"
                    value={formData.chronicConditions}
                    onChange={handleInputChange}
                    placeholder="e.g. Diabetes, Hypertension"
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Registering Patient & Issuing MRN...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Register Patient & Generate MRN</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Live Patient Directory & Quick Explorer (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Patient Directory</h3>
                <p className="text-xs text-slate-400">Live database record registry</p>
              </div>
            </div>
            <button
              onClick={loadPatientsAndStats}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Refresh Registry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Name, MRN, Phone..."
              className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Patient Cards List */}
          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {filteredPatients.length > 0 ? (
              filteredPatients.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPatientModal(p)}
                  className="p-3.5 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 rounded-xl transition cursor-pointer space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition">
                        {p.fullName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {p.gender} &bull; {p.age} yrs
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {p.mrn}
                      </span>
                      <div className="text-[10px] font-bold text-red-400 mt-1">
                        Blood: {p.bloodGroup}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-700/40">
                    <span className="truncate font-mono">{p.phone}</span>
                    <span className="text-[10px] text-cyan-300 flex items-center gap-1">
                      <Eye className="w-3 h-3" /> View Profile
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-xs text-slate-500">
                No patients match the search query.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Demographic Detail Modal */}
      {selectedPatientModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400">
                  Patient Medical Dossier
                </span>
                <h3 className="text-lg font-bold text-white">{selectedPatientModal.fullName}</h3>
              </div>
              <button
                onClick={() => setSelectedPatientModal(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-800/50 p-2.5 rounded-xl">
                <span className="text-slate-400">MRN:</span>
                <div className="font-mono font-bold text-indigo-300 mt-0.5">
                  {selectedPatientModal.mrn}
                </div>
              </div>
              <div className="bg-slate-800/50 p-2.5 rounded-xl">
                <span className="text-slate-400">Blood Group:</span>
                <div className="font-bold text-red-400 mt-0.5">
                  {selectedPatientModal.bloodGroup}
                </div>
              </div>
              <div className="bg-slate-800/50 p-2.5 rounded-xl">
                <span className="text-slate-400">Gender / Age:</span>
                <div className="font-bold text-white mt-0.5">
                  {selectedPatientModal.gender} &bull; {selectedPatientModal.age} years
                </div>
              </div>
              <div className="bg-slate-800/50 p-2.5 rounded-xl">
                <span className="text-slate-400">Phone Contact:</span>
                <div className="font-mono text-white mt-0.5">{selectedPatientModal.phone}</div>
              </div>
            </div>

            <div className="bg-slate-800/30 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
              <div className="text-slate-400 font-bold uppercase text-[10px]">
                Emergency Contact & Guardian
              </div>
              <div className="text-white font-medium">
                {selectedPatientModal.emergencyContactName} (
                {selectedPatientModal.emergencyContactRelation}) &bull;{' '}
                <span className="font-mono text-cyan-300">
                  {selectedPatientModal.emergencyContactPhone}
                </span>
              </div>
            </div>

            <div className="bg-slate-800/30 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
              <div className="text-slate-400 font-bold uppercase text-[10px]">
                Allergies & Chronic Conditions
              </div>
              <div className="text-amber-300 font-medium">
                Allergies: {selectedPatientModal.allergies || 'None recorded'}
              </div>
              <div className="text-slate-300 font-medium">
                Chronic: {selectedPatientModal.chronicConditions || 'None recorded'}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedPatientModal(null)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
