import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import StatsCards from './components/StatsCards';
import Day1SchemaExplorer from './components/Day1SchemaExplorer';
import SeedDataViewer from './components/SeedDataViewer';
import ModuleTimeline from './components/ModuleTimeline';
import { fetchHealthStatus, fetchSchemaDetails } from './services/api';
import { RefreshCw, Database, CheckCircle2, ShieldCheck, FileSpreadsheet, GitBranch } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'schema' | 'seed'
  const [healthData, setHealthData] = useState(null);
  const [schemaData, setSchemaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [health, schema] = await Promise.all([
        fetchHealthStatus().catch(() => null),
        fetchSchemaDetails().catch(() => null),
      ]);
      setHealthData(health);
      setSchemaData(schema);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Unable to reach backend API. Check if server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar healthData={healthData} isLoading={loading} />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar */}
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Right Workspace Area */}
          <div className="flex-1 space-y-8 min-w-0">
            {/* Top Stat Counters */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight">
                    Hospital Operations & Database Dashboard
                  </h2>
                  <p className="text-xs text-slate-400">
                    Day 1 Baseline System State & Model Metrics
                  </p>
                </div>
                <button
                  onClick={loadData}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition"
                  title="Refresh status from backend"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-400' : ''}`} />
                  <span>Sync</span>
                </button>
              </div>

              <StatsCards schemaData={schemaData} isLoading={loading} />
            </div>

            {/* Dynamic Tab Body */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Day 1 Quick Highlights Card */}
                <div className="p-6 rounded-2xl bg-gradient-to-r from-teal-950/40 via-slate-900 to-slate-900 border border-teal-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-xs font-bold font-mono">
                      DAY 1 PROGRESS REPORT
                    </span>
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Ready for Day 2 JWT Auth
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                      <h4 className="text-xs font-bold text-teal-400 uppercase">1. Normalized Schema</h4>
                      <p className="text-xs text-slate-300">
                        11 Prisma models designed with relationships for RBAC, patients, vitals, prescriptions, and billing.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                      <h4 className="text-xs font-bold text-teal-400 uppercase">2. Auto MRN Generation</h4>
                      <p className="text-xs text-slate-300">
                        Medical Record Number standard: <code>MRN-2026-XXXX</code> with collision-safe autosequence.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                      <h4 className="text-xs font-bold text-teal-400 uppercase">3. Full Stack Scaffold</h4>
                      <p className="text-xs text-slate-300">
                        Express + Prisma REST backend connected to React + Tailwind UI with live seed fixtures.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 5-Day Breakdown for Module 1 */}
                <ModuleTimeline />
              </div>
            )}

            {activeTab === 'schema' && (
              <Day1SchemaExplorer schemaData={schemaData} />
            )}

            {activeTab === 'seed' && (
              <SeedDataViewer schemaData={schemaData} />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-4 px-6 text-center text-xs text-slate-500">
        <p>
          Cloud-Based Hospital Management System (HMS) • Internship Project • Module 1: Day 1 Milestone
        </p>
      </footer>
    </div>
  );
}
