import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import StatsCards from './components/StatsCards';
import Day1SchemaExplorer from './components/Day1SchemaExplorer';
import SeedDataViewer from './components/SeedDataViewer';
import ModuleTimeline from './components/ModuleTimeline';
import { Day2AuthExplorer } from './components/Day2AuthExplorer';
import { Day3RbacExplorer } from './components/Day3RbacExplorer';
import { Day4PatientRegistration } from './components/Day4PatientRegistration';
import { AuthModal } from './components/AuthModal';
import { AuthProvider } from './context/AuthContext';
import { fetchHealthStatus, fetchSchemaDetails } from './services/api';
import { RefreshCw, UserPlus } from 'lucide-react';

function DashboardContent() {
  const [activeTab, setActiveTab] = useState('patients'); // 'patients' | 'rbac' | 'auth' | 'schema' | 'seed'
  const [healthData, setHealthData] = useState(null);
  const [schemaData, setSchemaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login');

  const loadData = async () => {
    setLoading(true);
    try {
      const [health, schema] = await Promise.all([
        fetchHealthStatus().catch(() => null),
        fetchSchemaDetails().catch(() => null),
      ]);
      setHealthData(health);
      setSchemaData(schema);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAuthModal = (tab = 'login') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        healthData={healthData}
        isLoading={loading}
        onOpenAuthModal={handleOpenAuthModal}
      />

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
                  <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-emerald-400" />
                    Patient Intake & Clinical Registration Center
                  </h2>
                  <p className="text-xs text-slate-400">
                    Module 1 &bull; Day 4: Patient Registration, Demographics & Auto MRN ID Generator (MRN-YYYY-XXXX)
                  </p>
                </div>
                <button
                  onClick={loadData}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition"
                  title="Refresh status from backend"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
                  <span>Sync</span>
                </button>
              </div>

              <StatsCards schemaData={schemaData} isLoading={loading} />
            </div>

            {/* Dynamic Tab Body */}
            {activeTab === 'patients' && (
              <div className="space-y-8">
                <Day4PatientRegistration />
                <ModuleTimeline />
              </div>
            )}

            {activeTab === 'rbac' && (
              <div className="space-y-8">
                <Day3RbacExplorer onOpenAuthModal={handleOpenAuthModal} />
                <ModuleTimeline />
              </div>
            )}

            {activeTab === 'auth' && (
              <div className="space-y-8">
                <Day2AuthExplorer onOpenAuthModal={handleOpenAuthModal} />
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

      {/* Interactive Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authModalTab}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-4 px-6 text-center text-xs text-slate-500">
        <p>
          Cloud-Based Hospital Management System (HMS) &bull; Module 1: Day 4 Deliverable (Aug 27, 2026)
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}
