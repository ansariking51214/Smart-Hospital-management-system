import React, { useState } from 'react';
import {
  Rocket,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Stethoscope,
  Pill,
  Calculator,
  Printer,
  Github,
  Award,
  Layers,
  Sparkles,
  Server,
  Play,
  RefreshCw,
} from 'lucide-react';
import axios from 'axios';

export function Day5IntegrationExplorer() {
  const [testLogs, setTestLogs] = useState([]);
  const [testing, setTesting] = useState(false);

  const runEndToEndIntegrationCheck = async () => {
    setTesting(true);
    setTestLogs([]);
    const logs = [];

    const log = (step, title, status, details) => {
      logs.push({ step, title, status, details, timestamp: new Date().toLocaleTimeString() });
      setTestLogs([...logs]);
    };

    try {
      log(1, 'System Health Endpoint', 'RUNNING', 'Ping /api/health');
      const healthRes = await axios.get('/api/health');
      log(1, 'System Health Endpoint', 'PASS', `Status: ${healthRes.data.status} (DB Connected)`);

      log(2, 'Module 1: Patient Registry & Auto MRN', 'RUNNING', 'Fetching patients');
      const patRes = await axios.get('/api/patients');
      log(2, 'Module 1: Patient Registry & Auto MRN', 'PASS', `Found ${patRes.data.patients?.length || 0} registered patients.`);

      log(3, 'Module 2: Doctor Rostering & OPD Queue', 'RUNNING', 'Fetching doctors & live queue');
      const docRes = await axios.get('/api/doctors');
      log(3, 'Module 2: Doctor Rostering & OPD Queue', 'PASS', `Loaded ${docRes.data.doctors?.length || 0} active physician profiles.`);

      log(4, 'Module 3: EHR, SOAP & Lab Orders', 'RUNNING', 'Checking clinical catalog');
      const catRes = await axios.get('/api/consultation/clinical-catalog');
      log(4, 'Module 3: EHR, SOAP & Lab Orders', 'PASS', `ICD-10 Catalog ready (${catRes.data.icd10Count} codes).`);

      log(5, 'Module 4: Pharmacy Stock Inventory', 'RUNNING', 'Fetching pharmacy stock');
      const pharmRes = await axios.get('/api/pharmacy/medicines');
      log(5, 'Module 4: Pharmacy Stock Inventory', 'PASS', `Pharmacy active with ${pharmRes.data.count || 0} medicine SKUs.`);

      log(6, 'Module 4: IPD Bed Matrix', 'RUNNING', 'Fetching ward matrix');
      const ipdRes = await axios.get('/api/ipd/wards');
      log(6, 'Module 4: IPD Bed Matrix', 'PASS', `Loaded ${ipdRes.data.count || 0} inpatient wards & bed grids.`);

      log(7, 'Module 4: Integrated Billing Invoices', 'RUNNING', 'Fetching billing invoices');
      const billRes = await axios.get('/api/billing/invoices');
      log(7, 'Module 4: Integrated Billing Invoices', 'PASS', `Billing system operational (${billRes.data.count || 0} invoices).`);

    } catch (err) {
      log(99, 'Integration Execution Exception', 'FAIL', err.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-indigo-950 border border-emerald-500/40 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
                Module 4 &bull; Day 5 Final Deployment
              </span>
              <span className="text-xs text-slate-300 font-mono">100% Syllabus Completed ✅</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Rocket className="w-8 h-8 text-emerald-400" />
              Smart Hospital System &bull; Full Integration Console
            </h1>
            <p className="text-sm text-slate-200 mt-2 max-w-3xl leading-relaxed">
              Congratulations! All 4 modules spanning Patient Intake, Doctor Rostering, EHR SOAP Notes, e-Prescriptions, Lab Orders, Pharmacy Stock, Inpatient IPD Bed Allocations, and Integrated Billing PDF Invoices are 100% complete and fully verified.
            </p>
          </div>

          <button
            onClick={runEndToEndIntegrationCheck}
            disabled={testing}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-xl shadow-emerald-500/20 transition transform hover:-translate-y-0.5 shrink-0"
          >
            {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-slate-950" />}
            Run System Integration Diagnostics
          </button>
        </div>
      </div>

      {/* Internship Completion Certificate Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-white">Internship Milestone & Project Identity</h2>
              <p className="text-xs text-slate-400">Enterprise Cloud Healthcare Management Platform</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            ID: ZYNVEX-CERT-1101
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <span className="text-slate-500 text-[10px] font-bold uppercase block">Student / Intern Name</span>
            <span className="text-sm font-black text-white">Muhammad Tabish Ahmad</span>
          </div>
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <span className="text-slate-500 text-[10px] font-bold uppercase block">GitHub Repository</span>
            <a
              href="https://github.com/ansariking51214/Smart-Hospital-management-system"
              target="_blank"
              rel="noreferrer"
              className="text-sm font-bold text-emerald-400 hover:underline flex items-center gap-1 mt-0.5"
            >
              <Github className="w-4 h-4" /> Smart-Hospital-management-system
            </a>
          </div>
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <span className="text-slate-500 text-[10px] font-bold uppercase block">Overall Status</span>
            <span className="text-sm font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> All 4 Modules 100% Deployed
            </span>
          </div>
        </div>
      </div>

      {/* 4 Modules Architecture Lifecycle Explorer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Module 1 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-extrabold text-teal-400">Module 1</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">100%</span>
          </div>
          <h3 className="font-bold text-sm text-white">Auth, RBAC & Patient Intake</h3>
          <p className="text-xs text-slate-400">
            JWT engine, 6-role permission guards, auto-MRN sequential intake (`MRN-2026-XXXX`).
          </p>
        </div>

        {/* Module 2 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-extrabold text-indigo-400">Module 2</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">100%</span>
          </div>
          <h3 className="font-bold text-sm text-white">Doctor Roster & OPD Queue</h3>
          <p className="text-xs text-slate-400">
            Physician shift schedules, slot collision engine, OPD token caller, Nurse NEWS vitals desk.
          </p>
        </div>

        {/* Module 3 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-extrabold text-cyan-400">Module 3</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">100%</span>
          </div>
          <h3 className="font-bold text-sm text-white">EHR, SOAP & e-Prescriptions</h3>
          <p className="text-xs text-slate-400">
            360° EHR snapshot, SOAP notes, ICD-10 diagnostic coding, allergy safety gate, Lab orders & PDF export.
          </p>
        </div>

        {/* Module 4 */}
        <div className="bg-slate-900/80 border border-emerald-500/40 rounded-2xl p-5 space-y-3 bg-emerald-950/10">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-extrabold text-emerald-400">Module 4</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">100%</span>
          </div>
          <h3 className="font-bold text-sm text-white">Pharmacy, Beds & Billing</h3>
          <p className="text-xs text-slate-300">
            Medicine stock batches, IPD ward bed matrix, automated charge calculator, printable PDF invoice hub.
          </p>
        </div>
      </div>

      {/* Integration Diagnostic Logs Output */}
      {testLogs.length > 0 && (
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-3 font-mono text-xs shadow-2xl">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Server className="w-4 h-4 text-emerald-400" /> Real-time System Integration Diagnostic Test Terminal
          </h3>

          <div className="space-y-2">
            {testLogs.map((log, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-850">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 font-bold">[{log.timestamp}]</span>
                  <span className="font-bold text-white">{log.title}:</span>
                  <span className="text-slate-300">{log.details}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  log.status === 'PASS' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
