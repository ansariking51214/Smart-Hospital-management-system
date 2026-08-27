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
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const modules = [
    {
      id: 'module1',
      title: 'Module 1: Auth, RBAC & Patients',
      badge: 'Active (Day 1, 2, 3 & 4 Done)',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      days: [
        { day: 'Day 1', label: 'DB Schema Design & Setup', status: 'completed' },
        { day: 'Day 2', label: 'JWT Auth & Password Hash', status: 'completed' },
        { day: 'Day 3', label: 'RBAC (Admin, Doctor, Receptionist, Patient)', status: 'completed' },
        { day: 'Day 4', label: 'Patient Registration & Auto MRN', status: 'completed' },
        { day: 'Day 5', label: 'Search & Medical History Logs', status: 'upcoming' },
      ],
      icon: KeyRound,
    },
    {
      id: 'module2',
      title: 'Module 2: Doctor Rostering & OPD',
      badge: 'Upcoming (Aug 31)',
      badgeColor: 'bg-slate-800 text-slate-400 border-slate-700',
      days: [
        { day: 'Day 1', label: 'Doctor Profile & Shift Roster' },
        { day: 'Day 2', label: 'Slot Booking Engine' },
        { day: 'Day 3', label: 'OPD Queue & Token Display' },
        { day: 'Day 4', label: 'Nurse Vitals Triage Desk' },
        { day: 'Day 5', label: 'Appointment Status Flow' },
      ],
      icon: CalendarClock,
    },
    {
      id: 'module3',
      title: 'Module 3: EHR & e-Prescriptions',
      badge: 'Upcoming (Sep 07)',
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
      badge: 'Upcoming (Sep 14)',
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
          <Layers className="w-4 h-4 text-emerald-400" />
          Module 1 Navigation
        </h2>
        <nav className="space-y-1">
          {/* Day 4 Primary Tab */}
          <button
            onClick={() => setActiveTab('patients')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'patients'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <UserPlus className="w-4 h-4 text-emerald-300" />
              <span>Day 4: Patient Registration</span>
            </div>
            <span className="text-[10px] bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 px-1.5 py-0.5 rounded-md font-bold uppercase">
              Current
            </span>
          </button>

          {/* Day 3 RBAC Tab */}
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
              <span>Day 3: Role-Based Access (RBAC)</span>
            </div>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded-md">RBAC</span>
          </button>

          {/* Day 2 JWT Auth Tab */}
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
              <span>Day 2: JWT Auth & Security</span>
            </div>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded-md">Auth</span>
          </button>

          {/* Day 1 Schema Tab */}
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
              <span>Day 1: Schema & ERD</span>
            </div>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded-md">11 Models</span>
          </button>

          {/* Seed Data Tab */}
          <button
            onClick={() => setActiveTab('seed')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'seed'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <KeyRound className="w-4 h-4" />
              <span>Seed Credentials & Data</span>
            </div>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded-md">6 Roles</span>
          </button>
        </nav>
      </div>

      {/* 4-Module Internship Project Roadmap */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Project Roadmap & Schedule
          </h2>
          <span className="text-[10px] text-emerald-400 font-mono">Module 1 / Day 4</span>
        </div>

        <div className="space-y-3">
          {modules.map((m) => {
            const Icon = m.icon;
            const isCurrentModule = m.id === 'module1';

            return (
              <div
                key={m.id}
                className={`p-3 rounded-xl border transition ${
                  isCurrentModule
                    ? 'bg-emerald-950/20 border-emerald-500/40 ring-1 ring-emerald-500/20'
                    : 'bg-slate-800/40 border-slate-800/80 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isCurrentModule
                          ? 'bg-emerald-600 text-white font-bold'
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
                  <div className="mt-2 space-y-1.5 pt-2 border-t border-emerald-500/20">
                    {m.days.map((d, dIdx) => (
                      <div key={dIdx} className="flex items-center justify-between text-xs py-0.5">
                        <div className="flex items-center gap-1.5">
                          {d.status === 'completed' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <CircleDot className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          )}
                          <span
                            className={
                              d.status === 'completed'
                                ? 'text-emerald-300 font-semibold'
                                : 'text-slate-400'
                            }
                          >
                            <strong className="text-slate-300">{d.day}:</strong> {d.label}
                          </span>
                        </div>
                        {d.status === 'completed' && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                            Done
                          </span>
                        )}
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
