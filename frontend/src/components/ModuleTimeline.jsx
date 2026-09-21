import React from 'react';
import { Calendar, CheckCircle2, ShieldCheck, Pill, BedDouble, Calculator, Printer, Rocket } from 'lucide-react';

export default function ModuleTimeline() {
  const dayTasks = [
    {
      day: 'Day 1',
      date: 'Sep 14, 2026',
      title: 'Pharmacy Stock & Inventory Management',
      status: 'completed',
      deliverables: [
        'Medicine CRUD catalog with unit price, dosage form, and stock quantity tracking',
        'Automatic low-stock reorder warning alerts when stock <= reorder limit',
        'Multi-batch expiration tracking & cost valuation logging',
      ],
      icon: Pill,
    },
    {
      day: 'Day 2',
      date: 'Sep 15, 2026',
      title: 'Inpatient (IPD) Ward & Bed Allocation Matrix',
      status: 'completed',
      deliverables: [
        'Interactive Ward & Bed status grid (AVAILABLE, OCCUPIED, MAINTENANCE)',
        '1-Click patient admission modal & bed assignment locking',
        'Patient discharge engine with live stay duration calculation & room rate billing',
      ],
      icon: BedDouble,
    },
    {
      day: 'Day 3',
      date: 'Sep 16, 2026',
      title: 'Automated Integrated Billing Calculation Engine',
      status: 'completed',
      deliverables: [
        'Cross-module unbilled charge aggregation (Consultations + Tests + Medicines + Bed Stay)',
        'Itemized financial breakdown table with category tags',
        'Dynamic healthcare tax rate (%) & discount ($) computation with invoice creation',
      ],
      icon: Calculator,
    },
    {
      day: 'Day 4',
      date: 'Sep 17, 2026',
      title: 'Printable PDF Invoice Generator & Payment Status Tracking',
      status: 'completed',
      deliverables: [
        'Payment status lifecycle management (PENDING, PARTIAL, PAID)',
        'Payment entry modal with cash, card, insurance & online method recording',
        'High-fidelity printable PDF invoice template matching professional hospital standards',
      ],
      icon: Printer,
    },
    {
      day: 'Day 5',
      date: 'Sep 18, 2026',
      title: 'System Integration, Diagnostics & Final GitHub Deployment',
      status: 'completed',
      deliverables: [
        'End-to-end integration diagnostic test terminal verifying all 4 modules',
        'Updated README documentation, syllabus progress matrix & deployment guides',
        'All code committed and pushed to GitHub main repository',
      ],
      icon: Rocket,
    },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            Module 4: 5-Day Deliverables Timeline (100% Completed)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Module 4 Syllabus Progress &bull; Completed Sep 18, 2026
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold font-mono">
          All Days Completed ✅
        </span>
      </div>

      <div className="space-y-4">
        {dayTasks.map((t, idx) => {
          const isDone = t.status === 'completed';
          const Icon = t.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition ${
                isDone
                  ? 'bg-emerald-950/20 border-emerald-500/40 ring-1 ring-emerald-500/20'
                  : 'bg-slate-950/40 border-slate-800/80 opacity-80'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-emerald-500 text-slate-950">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Icon className="w-4 h-4 text-emerald-400" />
                      {t.day}: {t.title}
                    </h4>
                    <span className="text-[11px] text-slate-400 font-mono">{t.date}</span>
                  </div>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Completed
                </span>
              </div>

              <ul className="mt-3 pl-8 space-y-1 text-xs text-emerald-200 list-disc">
                {t.deliverables.map((item, dIdx) => (
                  <li key={dIdx}>
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
