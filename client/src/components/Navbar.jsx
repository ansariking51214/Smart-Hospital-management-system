import React from 'react';
import { Activity, ShieldCheck, Database, Github, CheckCircle2, Server } from 'lucide-react';

export default function Navbar({ healthData, isLoading }) {
  const isHealthy = healthData?.data?.status === 'healthy';

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20 text-white font-bold">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">Smart HMS</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 font-semibold font-mono">
                v1.0.0
              </span>
            </div>
            <p className="text-xs text-slate-400">Cloud-Based Hospital Management System</p>
          </div>
        </div>

        {/* Center Pill: Current Module & Day */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-slate-300 font-medium">Module 1 : Day 1</span>
          <span className="text-slate-500">•</span>
          <span className="text-teal-400 font-semibold">DB Schema Design & Setup</span>
        </div>

        {/* Right Status & GitHub */}
        <div className="flex items-center gap-3">
          {/* DB & Server Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs">
            <Server className={`w-3.5 h-3.5 ${isHealthy ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className="text-slate-400">Backend:</span>
            {isLoading ? (
              <span className="text-slate-400 animate-pulse">Connecting...</span>
            ) : isHealthy ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Online (SQLite/Prisma)
              </span>
            ) : (
              <span className="text-amber-400 font-semibold">Offline / Initializing</span>
            )}
          </div>

          <a
            href="https://github.com/ansariking51214/Smart-Hospital-management-.git"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition"
          >
            <Github className="w-4 h-4" />
            <span className="hidden sm:inline">GitHub Repo</span>
          </a>
        </div>
      </div>
    </header>
  );
}
