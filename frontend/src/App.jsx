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
import { Day5MedicalHistoryExplorer } from './components/Day5MedicalHistoryExplorer';
import { Day1DoctorRosterExplorer } from './components/Day1DoctorRosterExplorer';
import { Day2AppointmentBookingExplorer } from './components/Day2AppointmentBookingExplorer';
import { Day3OpdQueueExplorer } from './components/Day3OpdQueueExplorer';
import { Day4NurseTriageExplorer } from './components/Day4NurseTriageExplorer';
import { Day5AppointmentFlowExplorer } from './components/Day5AppointmentFlowExplorer';
import { Day1ConsultationWorkspaceExplorer } from './components/Day1ConsultationWorkspaceExplorer';
import { Day2SoapNotesExplorer } from './components/Day2SoapNotesExplorer';
import { Day3ClinicalSafetyExplorer } from './components/Day3ClinicalSafetyExplorer';
import { Day4EPrescribingExplorer } from './components/Day4EPrescribingExplorer';
import { Day5LabOrdersExportExplorer } from './components/Day5LabOrdersExportExplorer';
import { Day1PharmacyStockExplorer } from './components/Day1PharmacyStockExplorer';
import { Day2IpdBedMatrixExplorer } from './components/Day2IpdBedMatrixExplorer';
import { Day3AutoBillingExplorer } from './components/Day3AutoBillingExplorer';
import { Day4InvoicePdfExplorer } from './components/Day4InvoicePdfExplorer';
import { Day5IntegrationExplorer } from './components/Day5IntegrationExplorer';
import { AuthModal } from './components/AuthModal';
import { AuthProvider } from './context/AuthContext';
import { fetchHealthStatus, fetchSchemaDetails } from './services/api';
import { RefreshCw, Building2 } from 'lucide-react';

function DashboardContent() {
  const [activeTab, setActiveTab] = useState('integration-m4');
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
                    <Building2 className="w-5 h-5 text-emerald-400" />
                    Smart Hospital Management System Workspace
                  </h2>
                  <p className="text-xs text-slate-400">
                    Module 4 &bull; Pharmacy Stock, IPD Bed Matrix, Integrated Billing Invoices &amp; Final Deployment
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
            {activeTab === 'integration-m4' && (
              <div className="space-y-8">
                <Day5IntegrationExplorer />
                <ModuleTimeline />
              </div>
            )}

            {activeTab === 'invoice-pdf' && (
              <div className="space-y-8">
                <Day4InvoicePdfExplorer />
                <ModuleTimeline />
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-8">
                <Day3AutoBillingExplorer />
                <ModuleTimeline />
              </div>
            )}

            {activeTab === 'ipd' && (
              <div className="space-y-8">
                <Day2IpdBedMatrixExplorer />
                <ModuleTimeline />
              </div>
            )}

            {activeTab === 'pharmacy' && (
              <div className="space-y-8">
                <Day1PharmacyStockExplorer />
                <ModuleTimeline />
              </div>
            )}

            {activeTab === 'lab-orders' && (
              <div className="space-y-8">
                <Day5LabOrdersExportExplorer />
                <ModuleTimeline />
              </div>
            )}

            {activeTab === 'eprescribing' && (
              <div className="space-y-8">
                <Day4EPrescribingExplorer />
                <ModuleTimeline />
              </div>
            )}

            {activeTab === 'soap' && (
              <div className="space-y-8">
                <Day2SoapNotesExplorer />
                <ModuleTimeline />
              </div>
            )}

            {activeTab === 'clinical-safety' && (
              <div className="space-y-8">
                <Day3ClinicalSafetyExplorer />
                <ModuleTimeline />
              </div>
            )}

            {activeTab === 'consultation' && (
              <div className="space-y-8">
                <Day1ConsultationWorkspaceExplorer />
                <ModuleTimeline />
              </div>
            )}

            {activeTab === 'flow' && (
              <div className="space-y-8">
                <Day5AppointmentFlowExplorer />
                <ModuleTimeline />
              </div>
            )}

            {activeTab === 'triage' && (
              <div className="space-y-8">
                <Day4NurseTriageExplorer />
                <ModuleTimeline />
              </div>
            )}

            {activeTab === 'queue' && (
              <div className="space-y-8">
                <Day3OpdQueueExplorer />
                <ModuleTimeline />
              </div>
            )}

            {activeTab === 'booking' && (
              <div className="space-y-8">
                <Day2AppointmentBookingExplorer />
                <ModuleTimeline />
              </div>
            )}

            {activeTab === 'roster' && (
              <div className="space-y-8">
                <Day1DoctorRosterExplorer />
                <ModuleTimeline />
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-8">
                <Day5MedicalHistoryExplorer />
                <ModuleTimeline />
              </div>
            )}

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
          Cloud-Based Hospital Management System (HMS) &bull; Module 4: Pharmacy, Beds, Billing &amp; Final Deployment (100% Complete)
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
