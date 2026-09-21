import React, { useState } from 'react';
import { Database, Code2, Layers, Key, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function Day1SchemaExplorer({ schemaData }) {
  const [selectedEntityIndex, setSelectedEntityIndex] = useState(0);
  const entities = schemaData?.data?.entities || [];
  const currentEntity = entities[selectedEntityIndex] || {
    name: 'User',
    module: 'Module 1 (RBAC)',
    description: 'Core authentication & credential entity with role assignments.',
    fields: ['id (CUID)', 'email (Unique)', 'passwordHash (Bcrypt)', 'fullName', 'phone', 'role (Enum)', 'avatarUrl', 'isActive', 'lastLoginAt', 'createdAt', 'updatedAt'],
    relations: ['doctorProfile (1:1)', 'patientProfile (1:1)', 'auditLogs (1:N)', 'createdNotes (1:N)'],
    count: 6,
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 font-bold uppercase tracking-wider">
                Module 1 : Day 1 Deliverable
              </span>
              <span className="text-xs text-slate-400 font-mono">Aug 24, 2026</span>
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Hospital Database Schema & Prisma ORM Architecture
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Normalized relational schema designed with multi-role RBAC, patient demographic records, auto-increment MRN formatting (`MRN-YYYY-XXXX`), and future-proof hooks for Modules 2, 3, and 4.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> 11 Tables Designed
            </span>
          </div>
        </div>
      </div>

      {/* Model Explorer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Entity List */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center justify-between">
            <span>Prisma Models</span>
            <span className="text-teal-400 font-mono">{entities.length || 10} Models</span>
          </h3>

          <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
            {entities.map((ent, idx) => (
              <button
                key={ent.name}
                onClick={() => setSelectedEntityIndex(idx)}
                className={`w-full text-left p-3 rounded-xl transition flex items-center justify-between group ${
                  selectedEntityIndex === idx
                    ? 'bg-teal-600/20 border border-teal-500/50 text-white'
                    : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-teal-300">{ent.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {ent.module}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate max-w-[200px] mt-0.5">
                    {ent.description}
                  </p>
                </div>
                <ArrowRight
                  className={`w-4 h-4 transition ${
                    selectedEntityIndex === idx
                      ? 'text-teal-400 translate-x-1'
                      : 'text-slate-600 group-hover:text-slate-400'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Selected Entity Details */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-start justify-between border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white font-mono">{currentEntity.name}</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 font-semibold">
                  {currentEntity.module}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">{currentEntity.description}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Database Records</span>
              <span className="text-xl font-extrabold text-emerald-400 font-mono">
                {currentEntity.count}
              </span>
            </div>
          </div>

          {/* Fields List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              Attributes & Data Types
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentEntity.fields.map((field, fIdx) => (
                <div
                  key={fIdx}
                  className="px-3 py-2 rounded-lg bg-slate-950/70 border border-slate-800 font-mono text-xs text-slate-300 flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                  <span>{field}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Foreign Keys & Relationships */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              Foreign Key Relations
            </h4>
            <div className="flex flex-wrap gap-2">
              {currentEntity.relations.map((rel, rIdx) => (
                <span
                  key={rIdx}
                  className="px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono text-xs"
                >
                  {rel}
                </span>
              ))}
            </div>
          </div>

          {/* MRN / RBAC Special Design Callout */}
          {currentEntity.name === 'PatientProfile' && (
            <div className="p-4 rounded-xl bg-teal-950/30 border border-teal-500/40 text-xs text-slate-300 space-y-1">
              <span className="font-bold text-teal-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Auto-Generated Medical Record Number (MRN) Rule:
              </span>
              <p>
                Each patient is assigned a standardized institutional MRN: <code>MRN-[YEAR]-[0001...]</code> (e.g. <code>MRN-2026-0001</code>). Unique indexes and phone indices ensure rapid lookup and zero duplicates.
              </p>
            </div>
          )}

          {currentEntity.name === 'User' && (
            <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/40 text-xs text-slate-300 space-y-1">
              <span className="font-bold text-blue-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Role-Based Access Control (RBAC) Enum:
              </span>
              <p>
                Roles configured: <code>ADMIN</code>, <code>DOCTOR</code>, <code>RECEPTIONIST</code>, <code>NURSE</code>, <code>PHARMACIST</code>, <code>PATIENT</code>. Passwords hashed using standard BCrypt (10 rounds).
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
