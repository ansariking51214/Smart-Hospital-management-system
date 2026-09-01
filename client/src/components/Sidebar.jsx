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
  Users,
  UserPlus,
  Search,
  Stethoscope,
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
      badge: 'In Progress (Day 1 Active) 🚀',
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      days: [
        { day: 'Day 1', label: 'Doctor Profile & Shift Roster', status: 'completed' },
        { day: 'Day 2', label: 'Slot Booking Engine', status: 'upcoming' },
        { day: 'Day 3', label: 'OPD Queue & Token Display', status: 'upcoming' },
        { day: 'Day 4', label: 'Nurse Vitals Triage Desk', status: 'upcoming' },
        { day: 'Day 5', label: 'Appointment Status Flow', status: 'upcoming' },
      ],
      icon: CalendarClock,
    },
    {
      id: 'module3',
      title: 'Module 3: EHR & e-Prescriptions',
      badge: 'Upcoming (Module 3)',
      badgeColor: 'bg-slate-800 text-slate-400 border-slate-700',
      days: [
        { day: 'Day 1', label: 'Doctor Consultation UI' },
        { day: 'Day 2', label: 'Clinical SOAP Notes' },
        { day: 'Day 3', label: 'ICD-10 & Allergy Alerts' },
        { day: 'Day 4', label: 'e-Prescribing Engine' },
        { day: 'Day 5', label: 'Lab Orders & PDF Export' },
      ],
      icon: FileText,
    },
    {
      id: 'module4',
      title: 'Module 4: Pharmacy, Beds & Billing',
      badge: 'Upcoming (Module 4)',
      badgeColor: 'bg-slate-800 text-slate-400 border-slate-700',
      days: [
        { day: 'Day 1', label: 'Pharmacy Stock Inventory' },
        { day: 'Day 2', label: 'Inpatient Bed Matrix' },
        { day: 'Day 3', label: 'Auto Billing Calculator' },
        { day: 'Day 4', label: 'Printable Invoice Generator' },
        { day: 'Day 5', label: 'Integration & Deployment' },
      ],
      icon: Building2,
    },
  ];

  return (
    <aside className="w-full lg:w-80 shrink-0 space-y-6">
      {/* Navigation Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-teal-400" />
          Active Workspaces
        </h2>
        <nav className="space-y-1">
          {/* Module 2 Day 1: Doctor Shift Roster */}
          <button
            onClick={() => setActiveTab('roster')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'roster'
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-600/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Stethoscope className="w-4 h-4 text-teal-300" />
              <span>M2 Day 1: Doctor Shift Roster</span>
            </div>
            <span className="text-[10px] bg-teal-400/20 text-teal-200 border border-teal-400/30 px-1.5 py-0.5 rounded-md font-bold uppercase">
              Current
            </span>
          </button>

          {/* Module 1 Day 5: Search & History Tab */}
          <button
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4" />
              <span>M1 Day 5: Patient Search & EHR</span>
            </div>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded-md">M1</span>
          </button>

          {/* Module 1 Day 4: Patient Registration Tab */}
          <button
            onClick={() => setActiveTab('patients')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'patients'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <UserPlus className="w-4 h-4" />
              <span>M1 Day 4: Patient Registration</span>
            </div>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded-md">MRN</span>
          </button>

          {/* Module 1 Day 3: RBAC Tab */}
          <button
            onClick={() => setActiveTab('rbac')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'rbac'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4" />
              <span>M1 Day 3: RBAC Access Control</span>
            </div>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded-md">RBAC</span>
          </button>

          {/* Module 1 Day 2: JWT Auth Tab */}
          <button
            onClick={() => setActiveTab('auth')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'auth'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4" />
              <span>M1 Day 2: JWT Security</span>
            </div>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded-md">Auth</span>
          </button>

          {/* Module 1 Day 1: Schema Tab */}
          <button
            onClick={() => setActiveTab('schema')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'schema'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4" />
              <span>M1 Day 1: Database & ERD</span>
            </div>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded-md">11 Models</span>
          </button>
        </nav>
      </div>

      {/* 4-Module Internship Project Roadmap */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Internship Syllabus Roadmap
          </h2>
          <span className="text-[10px] text-teal-400 font-mono font-bold">Module 2 Active</span>
        </div>

        <div className="space-y-3">
          {modules.map((m) => {
            const Icon = m.icon;
            const isCurrentModule = m.id === 'module2';

            return (
              <div
                key={m.id}
                className={`p-3 rounded-xl border transition ${
                  isCurrentModule
                    ? 'bg-teal-950/20 border-teal-500/40 ring-1 ring-teal-500/20'
                    : m.id === 'module1'
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-slate-800/40 border-slate-800/80 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isCurrentModule
                          ? 'bg-teal-600 text-white font-bold'
                          : m.id === 'module1'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-200">{m.title}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mb-2.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${m.badgeColor}`}>
                    {m.badge}
                  </span>
                </div>

                {isCurrentModule && (
                  <div className="mt-2 space-y-1.5 pt-2 border-t border-teal-500/20">
                    {m.days.map((d, dIdx) => (
                      <div key={dIdx} className="flex items-center justify-between text-xs py-0.5">
                        <div className="flex items-center gap-1.5">
                          {d.status === 'completed' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          ) : (
                            <CircleDot className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          )}
                          <span
                            className={
                              d.status === 'completed'
                                ? 'text-teal-300 font-semibold'
                                : 'text-slate-400'
                            }
                          >
                            <strong className="text-slate-300">{d.day}:</strong> {d.label}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                            d.status === 'completed'
                              ? 'bg-teal-500/20 text-teal-300'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {d.status === 'completed' ? 'Done' : 'Next'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
