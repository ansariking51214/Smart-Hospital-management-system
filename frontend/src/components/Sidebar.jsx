import React from 'react';
import { 
  KeyRound, 
  CalendarClock, 
  FileText, 
  Building2, 
  CheckCircle2, 
  CircleDot, 
  Database,
  Layers,
  Sparkles,
  ShieldCheck,
  FilePlus2,
  Users,
  UserPlus,
  Search,
  Stethoscope,
  CalendarCheck,
  Ticket,
  Activity,
  GitPullRequest,
  FlaskConical,
  Printer,
  Pill,
  BedDouble,
  Calculator,
  Rocket,
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const modules = [
    {
      id: 'module1',
      title: 'Module 1: Auth, RBAC & Patients',
      badge: 'Completed (Days 1 - 5 Done) ✅',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      days: [
        { day: 'Day 1', label: 'DB Schema Design & Setup', status: 'completed' },
        { day: 'Day 2', label: 'JWT Auth & Password Hash', status: 'completed' },
        { day: 'Day 3', label: 'RBAC Multi-Role Guards', status: 'completed' },
        { day: 'Day 4', label: 'Patient Registration & Auto MRN', status: 'completed' },
        { day: 'Day 5', label: 'Search & Medical History Logs', status: 'completed' },
      ],
      icon: KeyRound,
    },
    {
      id: 'module2',
      title: 'Module 2: Doctor Rostering & OPD',
      badge: 'Completed (Days 1 - 5 Done) ✅',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      days: [
        { day: 'Day 1', label: 'Doctor Profile & Shift Roster', status: 'completed' },
        { day: 'Day 2', label: 'Slot Booking Engine & Scheduling', status: 'completed' },
        { day: 'Day 3', label: 'OPD Queue & Token Display Board', status: 'completed' },
        { day: 'Day 4', label: 'Nurse Vitals Triage Desk', status: 'completed' },
        { day: 'Day 5', label: 'Appointment Status Flow & SOAP', status: 'completed' },
      ],
      icon: CalendarClock,
    },
    {
      id: 'module3',
      title: 'Module 3: EHR & e-Prescriptions',
      badge: 'Completed (Days 1 - 5 Done) ✅',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      days: [
        { day: 'Day 1', label: 'Doctor Consultation UI & EHR', status: 'completed' },
        { day: 'Day 2', label: 'Clinical SOAP Notes', status: 'completed' },
        { day: 'Day 3', label: 'ICD-10 & Allergy Alerts', status: 'completed' },
        { day: 'Day 4', label: 'e-Prescribing Engine', status: 'completed' },
        { day: 'Day 5', label: 'Lab Orders & PDF Export', status: 'completed' },
      ],
      icon: FileText,
    },
    {
      id: 'module4',
      title: 'Module 4: Pharmacy, Beds & Billing',
      badge: 'Completed (Days 1 - 5 Done) ✅',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      days: [
        { day: 'Day 1', label: 'Pharmacy Stock Inventory', status: 'completed' },
        { day: 'Day 2', label: 'Inpatient Bed Matrix', status: 'completed' },
        { day: 'Day 3', label: 'Auto Billing Calculator', status: 'completed' },
        { day: 'Day 4', label: 'Printable Invoice Generator', status: 'completed' },
        { day: 'Day 5', label: 'Integration & Deployment', status: 'completed' },
      ],
      icon: Building2,
    },
  ];

  return (
    <aside className="w-full lg:w-80 shrink-0 space-y-6">
      {/* Navigation Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          Active Workspaces
        </h2>
        <nav className="space-y-1">
          {/* Module 4 Workspaces */}
          <button
            onClick={() => setActiveTab('integration-m4')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'integration-m4'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20 font-bold'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Rocket className="w-4 h-4 text-emerald-300" />
              <span>M4 Day 5: Full Deployment</span>
            </div>
            <span className="text-[10px] bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 px-1.5 py-0.5 rounded-md font-bold uppercase">
              100%
            </span>
          </button>

          <button
            onClick={() => setActiveTab('invoice-pdf')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'invoice-pdf'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Printer className="w-4 h-4 text-purple-300" />
              <span>M4 Day 4: PDF Invoice &amp; Pay</span>
            </div>
            <span className="text-[10px] bg-purple-400/20 text-purple-200 border border-purple-400/30 px-1.5 py-0.5 rounded-md font-bold uppercase">
              M4
            </span>
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'billing'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Calculator className="w-4 h-4 text-indigo-300" />
              <span>M4 Day 3: Auto Billing Engine</span>
            </div>
            <span className="text-[10px] bg-indigo-400/20 text-indigo-200 border border-indigo-400/30 px-1.5 py-0.5 rounded-md font-bold uppercase">
              M4
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ipd')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'ipd'
                ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-600/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <BedDouble className="w-4 h-4 text-cyan-300" />
              <span>M4 Day 2: IPD Bed Matrix</span>
            </div>
            <span className="text-[10px] bg-cyan-400/20 text-cyan-200 border border-cyan-400/30 px-1.5 py-0.5 rounded-md font-bold uppercase">
              M4
            </span>
          </button>

          <button
            onClick={() => setActiveTab('pharmacy')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'pharmacy'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Pill className="w-4 h-4 text-emerald-300" />
              <span>M4 Day 1: Pharmacy Stock</span>
            </div>
            <span className="text-[10px] bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 px-1.5 py-0.5 rounded-md font-bold uppercase">
              M4
            </span>
          </button>

          {/* Module 3 Workspaces */}
          <div className="pt-2 border-t border-slate-800/80 my-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase px-3 block mb-1">Module 3 Workspaces</span>
          </div>

          <button
            onClick={() => setActiveTab('lab-orders')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'lab-orders'
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FlaskConical className="w-4 h-4 text-teal-300" />
              <span>M3 Day 5: Lab &amp; PDF Export</span>
            </div>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded-md">M3</span>
          </button>

          <button
            onClick={() => setActiveTab('eprescribing')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'eprescribing'
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5"><FilePlus2 className="w-4 h-4 text-teal-300" /><span>M3 Day 4: e-Prescribing</span></div>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded-md">M3</span>
          </button>

          <button
            onClick={() => setActiveTab('clinical-safety')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'clinical-safety'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              <span>M3 Day 3: Safety Alerts</span>
            </div>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded-md">M3</span>
          </button>

          <button
            onClick={() => setActiveTab('soap')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'soap'
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-teal-300" />
              <span>M3 Day 2: Clinical SOAP Notes</span>
            </div>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded-md">M3</span>
          </button>

          <button
            onClick={() => setActiveTab('consultation')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'consultation'
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Stethoscope className="w-4 h-4 text-teal-300" />
              <span>M3 Day 1: Consultation UI</span>
            </div>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded-md">M3</span>
          </button>

          {/* Module 2 & 1 Workspaces */}
          <div className="pt-2 border-t border-slate-800/80 my-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase px-3 block mb-1">Module 1 &amp; 2 Workspaces</span>
          </div>

          <button
            onClick={() => setActiveTab('flow')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'flow'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <GitPullRequest className="w-4 h-4" />
              <span>M2 Day 5: Consultation Flow</span>
            </div>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded-md">M2</span>
          </button>

          <button
            onClick={() => setActiveTab('triage')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'triage'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Activity className="w-4 h-4" />
              <span>M2 Day 4: Nurse Triage Desk</span>
            </div>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded-md">M2</span>
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'queue'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Ticket className="w-4 h-4" />
              <span>M2 Day 3: OPD Live Queue</span>
            </div>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded-md">M2</span>
          </button>

          <button
            onClick={() => setActiveTab('booking')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'booking'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CalendarCheck className="w-4 h-4" />
              <span>M2 Day 2: Slot Booking</span>
            </div>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded-md">M2</span>
          </button>

          <button
            onClick={() => setActiveTab('roster')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'roster'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Stethoscope className="w-4 h-4" />
              <span>M2 Day 1: Doctor Roster</span>
            </div>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded-md">M2</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4" />
              <span>M1 Day 5: Patient EHR History</span>
            </div>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded-md">M1</span>
          </button>

          <button
            onClick={() => setActiveTab('patients')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'patients'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <UserPlus className="w-4 h-4" />
              <span>M1 Day 4: Auto-MRN Intake</span>
            </div>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded-md">M1</span>
          </button>

          <button
            onClick={() => setActiveTab('rbac')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'rbac'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4" />
              <span>M1 Day 3: RBAC Guards</span>
            </div>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded-md">M1</span>
          </button>

          <button
            onClick={() => setActiveTab('auth')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'auth'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <KeyRound className="w-4 h-4" />
              <span>M1 Day 2: JWT Engine</span>
            </div>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded-md">M1</span>
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'schema'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-blue-300" />
              <span>M1 Day 1: Relational Schema</span>
            </div>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded-md">M1</span>
          </button>

          <button
            onClick={() => setActiveTab('seed')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'seed'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>Seed Data Viewer</span>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-md font-semibold">
              Live
            </span>
          </button>
        </nav>
      </div>

      {/* Course Milestone Overview Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          Syllabus Milestones (100%)
        </h2>
        <div className="space-y-3">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div key={mod.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Icon className="w-4 h-4 text-emerald-400" />
                    <span>{mod.title}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${mod.badgeColor}`}>
                    {mod.badge}
                  </span>
                </div>
                <div className="space-y-1 pl-6">
                  {mod.days.map((d, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>{d.day}: {d.label}</span>
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono">Done</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
