import React from 'react';
import { Users, UserCheck, Stethoscope, Building, Shield, Database } from 'lucide-react';

export default function StatsCards({ schemaData, isLoading }) {
  const records = schemaData?.data?.records || {};
  const entities = schemaData?.data?.entities || [];

  const stats = [
    {
      title: 'Active Users (RBAC)',
      count: records.users?.length ?? 6,
      subtext: 'Admin, Doctors, Nurse, Receptionist, Patient',
      icon: Users,
      color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-400',
    },
    {
      title: 'Patient Demographics',
      count: records.patients?.length ?? 3,
      subtext: 'Auto MRN generated (MRN-2026-0001..)',
      icon: UserCheck,
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400',
    },
    {
      title: 'Specialist Doctors',
      count: records.doctors?.length ?? 2,
      subtext: 'Cardiology, Pediatrics & OPD Roster',
      icon: Stethoscope,
      color: 'from-purple-500/20 to-violet-500/20 border-purple-500/30 text-purple-400',
    },
    {
      title: 'Clinical Departments',
      count: records.departments?.length ?? 5,
      subtext: 'CARD, PED, NEUR, ORTH, GEN',
      icon: Building,
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400',
    },
    {
      title: 'Database Entities Defined',
      count: entities.length || 10,
      subtext: 'Prisma Models across 4 Modules',
      icon: Database,
      color: 'from-cyan-500/20 to-teal-500/20 border-cyan-500/30 text-cyan-400',
    },
    {
      title: 'Security & Audit Logs',
      count: records.auditLogs?.length ?? 1,
      subtext: 'Role-Based Action Logging Active',
      icon: Shield,
      color: 'from-rose-500/20 to-red-500/20 border-rose-500/30 text-rose-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className={`p-5 rounded-2xl bg-gradient-to-br border backdrop-blur-sm shadow-sm transition hover:translate-y-[-2px] ${stat.color}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                {stat.title}
              </span>
              <div className="p-2 rounded-xl bg-slate-900/60 border border-white/10">
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white font-mono">
                {isLoading ? '...' : stat.count}
              </span>
              <span className="text-xs text-emerald-400 font-medium">Ready</span>
            </div>
            <p className="text-xs text-slate-400 mt-2 font-medium">{stat.subtext}</p>
          </div>
        );
      })}
    </div>
  );
}
