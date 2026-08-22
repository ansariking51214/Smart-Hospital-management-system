import React from 'react';
import { Calendar, CheckCircle2, Clock, ShieldCheck, UserPlus, FileCheck, Stethoscope, Receipt } from 'lucide-react';

export default function ModuleTimeline() {
  const dayTasks = [
    {
      day: 'Day 1',
      date: 'Aug 24, 2026',
      title: 'DB Schema Design & Project Setup',
      status: 'completed',
      deliverables: [
        'Multi-module Prisma ORM schema design (11 Models, 5 Enums)',
        'Role-Based Access Control (RBAC) user hierarchy',
        'Patient Demographics & Medical Record Number (MRN) format',
        'Express.js backend with DB connection check & schema inspector',
        'React + Tailwind CSS frontend dashboard & seed data viewer',
      ],
      icon: ShieldCheck,
    },
    {
      day: 'Day 2',
      date: 'Aug 25, 2026',
      title: 'JWT Auth (Login/Signup/Logout & Password Hashing)',
      status: 'upcoming',
      deliverables: [
        'Secure JWT authentication token generation and cookie/header transport',
        'Bcrypt.js password hashing & salt generation',
        'Login, registration, profile update, and logout API endpoints',
      ],
      icon: KeyRoundIcon,
    },
    {
      day: 'Day 3',
      date: 'Aug 26, 2026',
      title: 'Role-Based Access Control (Admin, Doctor, Receptionist, Patient)',
      status: 'upcoming',
      deliverables: [
        'RBAC authorization middleware (requireRole, requireAuth)',
        'Route guarding for sensitive administrative and medical endpoints',
        'Role-specific dashboard navigation and capability restrictions',
      ],
      icon: ShieldCheck,
    },
    {
      day: 'Day 4',
      date: 'Aug 27, 2026',
      title: 'Patient Registration & Demographic Forms (Auto MRN ID)',
      status: 'upcoming',
      deliverables: [
        'Dynamic patient intake forms with validation (React Hook Form)',
        'Auto MRN generator integration (MRN-YYYY-XXXX)',
        'Emergency contact details, allergies, and blood group logging',
      ],
      icon: UserPlus,
    },
    {
      day: 'Day 5',
      date: 'Aug 28, 2026',
      title: 'Patient Search, Medical History & Emergency Contact Management',
      status: 'upcoming',
      deliverables: [
        'Fast patient search by MRN, name, phone, and national ID',
        'Chronic ailment tags & drug allergy alert banners',
        'Audit logging for patient profile modifications',
      ],
      icon: FileCheck,
    },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-400" />
            Module 1: 5-Day Task Breakdown & Milestones
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Module 1 Submission Deadline: Aug 30, 2026 @ 4:00 PM
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold font-mono">
          Day 1 Completed
        </span>
      </div>

      <div className="space-y-4">
        {dayTasks.map((t, idx) => {
          const isDone = t.status === 'completed';
          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition ${
                isDone
                  ? 'bg-teal-950/20 border-teal-500/40 ring-1 ring-teal-500/20'
                  : 'bg-slate-950/40 border-slate-800/80 opacity-80'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isDone
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {t.day}: {t.title}
                    </h4>
                    <span className="text-[11px] text-slate-400 font-mono">{t.date}</span>
                  </div>
                </div>
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    isDone
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {isDone ? 'Completed' : 'Scheduled'}
                </span>
              </div>

              <ul className="mt-3 pl-8 space-y-1 text-xs text-slate-300 list-disc">
                {t.deliverables.map((item, dIdx) => (
                  <li key={dIdx} className={isDone ? 'text-teal-200' : 'text-slate-400'}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KeyRoundIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" />
      <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
    </svg>
  );
}
