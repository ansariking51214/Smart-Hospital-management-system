import React from 'react';
import { Activity, ShieldCheck, Database, Github, Server, Lock, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ healthData, isLoading, onOpenAuthModal }) {
  const { user, isAuthenticated, logout } = useAuth();
  const isHealthy = healthData?.data?.status === 'healthy';

  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-50 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-teal-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">Smart HMS</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-semibold font-mono">
                v1.2.0 (Day 3)
              </span>
            </div>
            <p className="text-xs text-slate-400">Cloud Healthcare Operations & Multi-Role RBAC</p>
          </div>
        </div>

        {/* Center Pill: Current Module & Day */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
          <span className="text-slate-300 font-medium">Module 1 : Day 3</span>
          <span className="text-slate-500">•</span>
          <span className="text-indigo-400 font-semibold">Role-Based Access Control (RBAC)</span>
        </div>

        {/* Right Actions & User Account Status */}
        <div className="flex items-center gap-3">
          {/* Server Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs">
            <Server className={`w-3.5 h-3.5 ${isHealthy ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className="text-slate-400">API:</span>
            {isLoading ? (
              <span className="text-slate-400 animate-pulse">Connecting...</span>
            ) : isHealthy ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                Online (Prisma/JWT)
              </span>
            ) : (
              <span className="text-amber-400 font-semibold">Offline</span>
            )}
          </div>

          {/* User Auth Control */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-950/80 border border-blue-800 text-xs">
                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                  {user.fullName ? user.fullName[0] : 'U'}
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-slate-200 font-bold leading-none truncate max-w-[120px]">
                    {user.fullName}
                  </div>
                  <div className="text-[10px] text-blue-300 font-semibold">{user.role}</div>
                </div>
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 hover:text-red-300 border border-slate-700 text-slate-400 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onOpenAuthModal('login')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md transition"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          <a
            href="https://github.com/ansariking51214/Smart-Hospital-management-system.git"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition"
          >
            <Github className="w-4 h-4" />
            <span className="hidden lg:inline">GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
}
