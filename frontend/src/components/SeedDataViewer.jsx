import React, { useState } from 'react';
import { Users, UserCheck, Stethoscope, Building, ShieldAlert, Key } from 'lucide-react';

export default function SeedDataViewer({ schemaData }) {
  const [subTab, setSubTab] = useState('users');
  const records = schemaData?.data?.records || {};

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setSubTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            subTab === 'users'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>RBAC Users ({records.users?.length || 6})</span>
        </button>

        <button
          onClick={() => setSubTab('patients')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            subTab === 'patients'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Patient Demographics & MRNs ({records.patients?.length || 3})</span>
        </button>

        <button
          onClick={() => setSubTab('doctors')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            subTab === 'doctors'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>Doctor Profiles ({records.doctors?.length || 2})</span>
        </button>

        <button
          onClick={() => setSubTab('departments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            subTab === 'departments'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Departments ({records.departments?.length || 5})</span>
        </button>
      </div>

      {/* Users Table */}
      {subTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              Role-Based Access Control (RBAC) Accounts
            </h3>
            <span className="text-xs text-slate-400">All passwords hashed via Bcrypt (10 salt rounds)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-mono">
                <tr>
                  <th className="p-3.5">Name</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Phone</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {(records.users || []).map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-medium text-white">{u.fullName}</td>
                    <td className="p-3.5 font-mono text-slate-400">{u.email}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : u.role === 'DOCTOR'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : u.role === 'NURSE'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : u.role === 'RECEPTIONIST'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-400">{u.phone || 'N/A'}</td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Patient Demographics & MRNs */}
      {subTab === 'patients' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              Patient Profiles & Medical Record Numbers (MRN)
            </h3>
            <span className="text-xs text-teal-400 font-mono">Format: MRN-YYYY-XXXX</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-mono">
                <tr>
                  <th className="p-3.5">MRN Code</th>
                  <th className="p-3.5">Full Name</th>
                  <th className="p-3.5">Gender / DOB</th>
                  <th className="p-3.5">Blood Group</th>
                  <th className="p-3.5">Emergency Contact</th>
                  <th className="p-3.5">Allergies / Conditions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {(records.patients || []).map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-mono font-bold text-teal-300">{p.mrn}</td>
                    <td className="p-3.5 font-medium text-white">
                      {p.firstName} {p.lastName}
                    </td>
                    <td className="p-3.5">
                      {p.gender} • {new Date(p.dateOfBirth).toLocaleDateString()}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-mono font-bold">
                        {p.bloodGroup || 'N/A'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="text-slate-200">{p.emergencyContactName}</div>
                      <div className="text-slate-500 font-mono text-[11px]">
                        {p.emergencyContactPhone}
                      </div>
                    </td>
                    <td className="p-3.5 max-w-xs">
                      {p.allergies && (
                        <div className="text-amber-300 font-medium">Allergy: {p.allergies}</div>
                      )}
                      {p.chronicConditions && (
                        <div className="text-slate-400 text-[11px]">{p.chronicConditions}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Doctor Profiles */}
      {subTab === 'doctors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(records.doctors || []).map((doc) => (
            <div
              key={doc.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-base font-bold text-white">{doc.user?.fullName}</h4>
                  <p className="text-xs text-teal-400 font-medium">{doc.specialization}</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono">
                  {doc.licenseNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">{doc.bio}</p>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 block">Department</span>
                  <span className="text-slate-300 font-medium">{doc.department?.name || 'OPD'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Consultation Fee</span>
                  <span className="text-emerald-400 font-mono font-bold">${doc.consultationFee}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">OPD Room</span>
                  <span className="text-slate-300 font-mono">{doc.roomNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Shift Timing</span>
                  <span className="text-slate-300 font-mono">
                    {doc.shiftStart} - {doc.shiftEnd}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Departments */}
      {subTab === 'departments' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {(records.departments || []).map((dept) => (
            <div
              key={dept.id}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">{dept.name}</h4>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold">
                  {dept.code}
                </span>
              </div>
              <p className="text-xs text-slate-400">{dept.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
