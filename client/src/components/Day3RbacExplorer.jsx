import React, { useState, useEffect } from 'react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { rbacAPI } from '../services/api';
import {
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Users,
  Layers,
  ArrowRight,
  Sparkles,
  Stethoscope,
  ClipboardList,
  HeartPulse,
  Pill,
  User,
  Sliders,
  Check,
  Terminal,
} from 'lucide-react';

export const Day3RbacExplorer = ({ onOpenAuthModal }) => {
  const { user, token, isAuthenticated, quickLogin, role: currentRole } = useAuth();

  // Matrix and Users state
  const [matrixData, setMatrixData] = useState(null);
  const [systemUsers, setSystemUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Live Guard Simulator State
  const [guardTestResult, setGuardTestResult] = useState(null);
  const [testingGuard, setTestingGuard] = useState(false);
  const [guardLogs, setGuardLogs] = useState([]);

  useEffect(() => {
    loadRbacData();
  }, [isAuthenticated, currentRole]);

  const loadRbacData = async () => {
    setLoading(true);
    try {
      const matrixRes = await rbacAPI.getMatrix().catch(() => null);
      if (matrixRes && matrixRes.success) {
        setMatrixData(matrixRes);
      }

      // If user is Admin, fetch all system users
      if (currentRole === 'ADMIN') {
        const usersRes = await rbacAPI.getUsers().catch(() => null);
        if (usersRes && usersRes.success) {
          setSystemUsers(usersRes.users || []);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSwitch = async (demo) => {
    const res = await quickLogin(demo.email, demo.password);
    if (res.success) {
      setActionSuccess(`Switched active session to: ${demo.label} (${demo.role})`);
      setTimeout(() => setActionSuccess(null), 3000);
      setGuardTestResult(null);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingUserId(userId);
    try {
      const res = await rbacAPI.updateUserRole(userId, newRole);
      if (res.success) {
        setActionSuccess(res.message);
        setTimeout(() => setActionSuccess(null), 3000);
        loadRbacData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    setUpdatingUserId(userId);
    try {
      const res = await rbacAPI.updateUserStatus(userId, !currentStatus);
      if (res.success) {
        setActionSuccess(res.message);
        setTimeout(() => setActionSuccess(null), 3000);
        loadRbacData();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const testRoleGuardEndpoint = async (roleType) => {
    setTestingGuard(true);
    const timestamp = new Date().toLocaleTimeString();
    let logEntry = null;

    try {
      const res = await rbacAPI.testRoleGuard(roleType);
      logEntry = {
        time: timestamp,
        endpoint: `/api/rbac/guard/${roleType}`,
        status: 200,
        statusText: '200 OK - Access Authorized',
        allowed: true,
        message: res.message,
        data: res,
      };
      setGuardTestResult(logEntry);
    } catch (err) {
      const status = err.response?.status || 403;
      const msg = err.response?.data?.message || 'Forbidden: Insufficient role permissions';
      logEntry = {
        time: timestamp,
        endpoint: `/api/rbac/guard/${roleType}`,
        status,
        statusText: `${status} Forbidden - Route Guard Blocked`,
        allowed: false,
        message: msg,
        data: err.response?.data || { error: msg },
      };
      setGuardTestResult(logEntry);
    } finally {
      if (logEntry) {
        setGuardLogs((prev) => [logEntry, ...prev.slice(0, 6)]);
      }
      setTestingGuard(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-xs font-semibold text-indigo-300 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              Module 1 &bull; Day 3 Deliverable
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Role-Based Access Control (RBAC) Architecture
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Strict multi-role authorization guards (Admin, Doctor, Receptionist, Nurse, Patient),
              fine-grained permissions matrix, and dynamic user privilege management.
            </p>
          </div>

          {/* Active Persona Pill */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-4 min-w-[280px]">
            <div className="text-xs text-indigo-200 font-semibold mb-1 flex items-center justify-between">
              <span>Active Persona:</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {currentRole || 'Unauthenticated'}
              </span>
            </div>
            {isAuthenticated ? (
              <div>
                <div className="text-sm font-bold text-white truncate">{user?.fullName}</div>
                <div className="text-xs text-slate-300 font-mono mt-0.5">{user?.email}</div>
                <div className="mt-2.5 text-[11px] text-cyan-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Access Level: {matrixData?.descriptions?.[currentRole]?.title || currentRole}</span>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-300 mt-1">Select a role to test authorization:</p>
                <button
                  onClick={() => onOpenAuthModal('demo')}
                  className="mt-2 w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition"
                >
                  Choose Persona
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300 font-medium animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <div>{actionSuccess}</div>
        </div>
      )}

      {/* 2. 1-Click Role Persona Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              1-Click Persona Switcher for Testing
            </h3>
            <p className="text-xs text-slate-400">
              Click any role to switch your active JWT token and test permission boundaries instantly:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {DEMO_USERS.map((demo) => {
            const isSelected = user?.email === demo.email;
            return (
              <button
                key={demo.email}
                type="button"
                onClick={() => handleQuickSwitch(demo)}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-400/30 shadow-lg'
                    : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : demo.role === 'ADMIN'
                          ? 'bg-red-500/20 text-red-300'
                          : demo.role === 'DOCTOR'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : demo.role === 'RECEPTIONIST'
                          ? 'bg-blue-500/20 text-blue-300'
                          : demo.role === 'NURSE'
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {demo.role}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div className="text-xs font-bold truncate">{demo.label}</div>
                  <div className="text-[10px] opacity-75 font-mono truncate mt-0.5">
                    {demo.badge}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Live Route Guard Simulator & Test Console */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Role-Guarded Resource Testers */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Live Route Guard Security Simulator</h3>
              <p className="text-xs text-slate-400">
                Test how the backend protects endpoints based on the active role
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {/* 1. Admin Guard */}
            <div className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-xl flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">🛡️ Admin Control Panel</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-300 border border-red-500/30 rounded font-mono">
                    ADMIN ONLY
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  GET /api/rbac/guard/admin
                </div>
              </div>
              <button
                onClick={() => testRoleGuardEndpoint('admin')}
                disabled={testingGuard}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
              >
                Test Access
              </button>
            </div>

            {/* 2. Doctor Guard */}
            <div className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-xl flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">🩺 Doctor Consultation Desk</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded font-mono">
                    DOCTOR, ADMIN
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  GET /api/rbac/guard/doctor
                </div>
              </div>
              <button
                onClick={() => testRoleGuardEndpoint('doctor')}
                disabled={testingGuard}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
              >
                Test Access
              </button>
            </div>

            {/* 3. Receptionist Guard */}
            <div className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-xl flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">📋 Reception Intake Desk</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded font-mono">
                    RECEPTIONIST, ADMIN
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  GET /api/rbac/guard/receptionist
                </div>
              </div>
              <button
                onClick={() => testRoleGuardEndpoint('receptionist')}
                disabled={testingGuard}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
              >
                Test Access
              </button>
            </div>

            {/* 4. Nurse Guard */}
            <div className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-xl flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">💉 Nurse Triage & Vitals</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded font-mono">
                    NURSE, ADMIN
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  GET /api/rbac/guard/nurse
                </div>
              </div>
              <button
                onClick={() => testRoleGuardEndpoint('nurse')}
                disabled={testingGuard}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
              >
                Test Access
              </button>
            </div>

            {/* 5. Patient Guard */}
            <div className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-xl flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">👤 Patient Health Portal</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded font-mono">
                    PATIENT, ADMIN
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  GET /api/rbac/guard/patient
                </div>
              </div>
              <button
                onClick={() => testRoleGuardEndpoint('patient')}
                disabled={testingGuard}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
              >
                Test Access
              </button>
            </div>
          </div>
        </div>

        {/* Right: Real-Time Guard Authorization Console */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Guard Execution Console</h3>
                <p className="text-xs text-slate-400">Live response verification from backend API</p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-black/60 rounded-xl font-mono text-xs max-h-80 overflow-y-auto space-y-2 border border-slate-800">
            {guardLogs.length > 0 ? (
              guardLogs.map((log, idx) => (
                <div key={idx} className="border-b border-slate-800/80 pb-2.5 last:border-b-0">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-cyan-400 font-bold">
                      [{log.time}] {log.endpoint}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        log.allowed
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}
                    >
                      {log.statusText}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1">{log.message}</div>
                  <pre className="text-[10px] text-slate-400 bg-slate-950/80 p-2 rounded mt-1 overflow-x-auto">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                </div>
              ))
            ) : (
              <div className="text-slate-500 text-center py-10">
                Click any 'Test Access' button on the left to verify real-time authorization...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Granular Permissions Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Comprehensive Role-Permission Matrix (6 Roles)
              </h3>
              <p className="text-xs text-slate-400">
                Granular capability allocation across clinical, administrative, and patient domains
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-800/80 text-slate-300 border-b border-slate-700">
              <tr>
                <th className="py-2.5 px-4 font-semibold">System Permission</th>
                <th className="py-2.5 px-3 font-semibold text-center text-red-400">ADMIN</th>
                <th className="py-2.5 px-3 font-semibold text-center text-emerald-400">DOCTOR</th>
                <th className="py-2.5 px-3 font-semibold text-center text-blue-400">RECEPTIONIST</th>
                <th className="py-2.5 px-3 font-semibold text-center text-purple-400">NURSE</th>
                <th className="py-2.5 px-3 font-semibold text-center text-teal-400">PHARMACIST</th>
                <th className="py-2.5 px-3 font-semibold text-center text-amber-400">PATIENT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
              {matrixData?.permissions ? (
                matrixData.permissions.map((perm) => (
                  <tr key={perm} className="hover:bg-slate-800/40">
                    <td className="py-2 px-4 text-slate-300 font-sans font-medium">{perm}</td>
                    {['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE', 'PHARMACIST', 'PATIENT'].map(
                      (roleKey) => {
                        const has = matrixData.matrix[roleKey]?.includes(perm);
                        return (
                          <td key={roleKey} className="py-2 px-3 text-center">
                            {has ? (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                                ✓
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-800/40 text-slate-600 text-xs">
                                ✕
                              </span>
                            )}
                          </td>
                        );
                      }
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">
                    Loading role matrix...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Admin Dynamic User & Role Management Table (If Admin or Demo) */}
      {currentRole === 'ADMIN' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Live User Privilege & Role Management
                </h3>
                <p className="text-xs text-slate-400">
                  Admins can dynamically promote/demote user roles and toggle account active states
                </p>
              </div>
            </div>
            <button
              onClick={loadRbacData}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-800/80 text-slate-300 border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">User Details</th>
                  <th className="py-2.5 px-3 font-semibold">Current Role</th>
                  <th className="py-2.5 px-3 font-semibold">Change Role</th>
                  <th className="py-2.5 px-3 font-semibold">Account State</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {systemUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4">
                      <div className="font-bold text-white">{u.fullName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.role === 'ADMIN'
                            ? 'bg-red-500/20 text-red-300'
                            : u.role === 'DOCTOR'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : u.role === 'RECEPTIONIST'
                            ? 'bg-blue-500/20 text-blue-300'
                            : u.role === 'NURSE'
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        value={u.role}
                        disabled={updatingUserId === u.id}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="DOCTOR">DOCTOR</option>
                        <option value="RECEPTIONIST">RECEPTIONIST</option>
                        <option value="NURSE">NURSE</option>
                        <option value="PHARMACIST">PHARMACIST</option>
                        <option value="PATIENT">PATIENT</option>
                      </select>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                          u.isActive ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {u.isActive ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" /> Deactivated
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleStatusToggle(u.id, u.isActive)}
                        disabled={updatingUserId === u.id}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                          u.isActive
                            ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30'
                            : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
