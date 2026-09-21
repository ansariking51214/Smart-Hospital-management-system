import React, { useState } from 'react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import {
  Lock,
  Mail,
  User,
  Phone,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  ArrowRight,
  UserPlus,
  LogIn,
} from 'lucide-react';

export const AuthModal = ({ isOpen, onClose, initialTab = 'login' }) => {
  const { login, register, quickLogin, authError, setAuthError } = useAuth();
  const [tab, setTab] = useState(initialTab); // 'login', 'signup', 'demo'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupRole, setSignupRole] = useState('PATIENT');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);
    const res = await login(loginEmail, loginPassword);
    setLoading(false);
    if (res.success) {
      setSuccessMsg(`Welcome back, ${res.user.fullName}!`);
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1000);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setSuccessMsg(null);

    if (signupPassword !== signupConfirm) {
      setAuthError('Passwords do not match');
      return;
    }

    setLoading(true);
    const res = await register({
      fullName: signupName,
      email: signupEmail,
      phone: signupPhone,
      role: signupRole,
      password: signupPassword,
    });
    setLoading(false);

    if (res.success) {
      setSuccessMsg(
        `Account created! ${
          res.user.patientProfile?.mrn ? `Assigned MRN: ${res.user.patientProfile.mrn}` : ''
        }`
      );
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1400);
    }
  };

  const handleQuickLogin = async (demo) => {
    setLoading(true);
    setSuccessMsg(null);
    const res = await quickLogin(demo.email, demo.password);
    setLoading(false);
    if (res.success) {
      setSuccessMsg(`Logged in as ${demo.label}`);
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden transition-all transform">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-lg">
              🏥
            </div>
            <div>
              <h2 className="text-xl font-bold">Smart HMS Portal</h2>
              <p className="text-xs text-blue-100 font-medium">
                Day 2: JWT Authentication & Password Security
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-black/20 p-1 rounded-xl mt-4 text-xs font-semibold">
            <button
              onClick={() => {
                setTab('login');
                setAuthError(null);
              }}
              className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                tab === 'login' ? 'bg-white text-blue-700 shadow-sm' : 'text-white/80 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" /> Sign In
            </button>
            <button
              onClick={() => {
                setTab('signup');
                setAuthError(null);
              }}
              className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                tab === 'signup' ? 'bg-white text-blue-700 shadow-sm' : 'text-white/80 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" /> Register
            </button>
            <button
              onClick={() => {
                setTab('demo');
                setAuthError(null);
              }}
              className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                tab === 'demo' ? 'bg-white text-blue-700 shadow-sm' : 'text-white/80 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> 1-Click Demo
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Alerts */}
          {authError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div>{authError}</div>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-700 font-medium animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div>{successMsg}</div>
            </div>
          )}

          {/* Tab 1: Login Form */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. admin@hms.hospital"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('admin@hms.hospital');
                      setLoginPassword('Admin@12345');
                    }}
                    className="text-[11px] text-blue-600 hover:underline font-medium"
                  >
                    Fill Admin Pass
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Bcrypt Hashed & JWT Signed
                </span>
                <span className="text-slate-400">Auth Token: 7 Days</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In to HMS <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Tab 2: Signup Form */}
          {tab === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="e.g. Eleanor Vance"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="name@mail.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={signupRole}
                    onChange={(e) => setSignupRole(e.target.value)}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PATIENT">Patient (Auto MRN)</option>
                    <option value="DOCTOR">Doctor</option>
                    <option value="RECEPTIONIST">Receptionist</option>
                    <option value="NURSE">Nurse</option>
                    <option value="PHARMACIST">Pharmacist</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    placeholder="+1 555 0199"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password (Min 6)
                  </label>
                  <input
                    type="password"
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm Pass
                  </label>
                  <input
                    type="password"
                    required
                    value={signupConfirm}
                    onChange={(e) => setSignupConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {signupRole === 'PATIENT' && (
                <div className="p-2.5 bg-blue-50/80 border border-blue-200/70 rounded-xl text-[11px] text-blue-800 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <span>
                    Auto-generates sequential Medical Record Number (e.g.{' '}
                    <code>MRN-2026-XXXX</code>).
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-semibold rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Create Account & Generate Token</>
                )}
              </button>
            </form>
          )}

          {/* Tab 3: Demo Quick-Switcher */}
          {tab === 'demo' && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500 mb-2">
                Click any pre-seeded persona to authenticate immediately and receive a signed JWT:
              </p>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {DEMO_USERS.map((demo) => (
                  <button
                    key={demo.email}
                    type="button"
                    onClick={() => handleQuickLogin(demo)}
                    className="w-full p-2.5 bg-slate-50 hover:bg-blue-50/80 hover:border-blue-300 border border-slate-200 rounded-xl text-left transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                          {demo.label}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            demo.role === 'ADMIN'
                              ? 'bg-red-100 text-red-700'
                              : demo.role === 'DOCTOR'
                              ? 'bg-emerald-100 text-emerald-700'
                              : demo.role === 'RECEPTIONIST'
                              ? 'bg-blue-100 text-blue-700'
                              : demo.role === 'NURSE'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {demo.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {demo.email} &bull; {demo.badge}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
