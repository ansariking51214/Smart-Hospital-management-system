import React, { useState, useEffect } from 'react';
import { pharmacyAPI } from '../services/api';
import {
  Pill,
  Search,
  Plus,
  AlertTriangle,
  Package,
  Layers,
  DollarSign,
  TrendingDown,
  CheckCircle2,
  RefreshCw,
  Boxes,
  Calendar,
} from 'lucide-react';

export function Day1PharmacyStockExplorer() {
  const [medicines, setMedicines] = useState([]);
  const [batches, setBatches] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('inventory'); // 'inventory' | 'batches'

  // Modal states
  const [addMedModal, setAddMedModal] = useState(false);
  const [addBatchModal, setAddBatchModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Form states
  const [medForm, setMedForm] = useState({
    name: '',
    genericName: '',
    category: 'Antibiotic',
    manufacturer: '',
    unitPrice: '',
    stockQuantity: '',
    reorderLevel: '10',
    dosageForm: 'Tablet',
  });

  const [batchForm, setBatchForm] = useState({
    medicineId: '',
    batchNumber: '',
    quantity: '',
    expiryDate: '',
    costPrice: '',
  });

  const loadPharmacyData = async () => {
    setLoading(true);
    try {
      const [medRes, batchRes, statsRes] = await Promise.all([
        pharmacyAPI.getMedicines({ search, lowStockOnly }),
        pharmacyAPI.getBatches(),
        pharmacyAPI.getStats(),
      ]);
      setMedicines(medRes.medicines || []);
      setBatches(batchRes.batches || []);
      setStats(statsRes.stats || null);
    } catch (err) {
      console.error('Error loading pharmacy data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPharmacyData();
  }, [search, lowStockOnly]);

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await pharmacyAPI.addMedicine(medForm);
      if (res.success) {
        setMessage({ type: 'success', text: 'Medicine added successfully!' });
        setAddMedModal(false);
        setMedForm({
          name: '',
          genericName: '',
          category: 'Antibiotic',
          manufacturer: '',
          unitPrice: '',
          stockQuantity: '',
          reorderLevel: '10',
          dosageForm: 'Tablet',
        });
        loadPharmacyData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to add medicine.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddBatch = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await pharmacyAPI.addBatch(batchForm);
      if (res.success) {
        setMessage({ type: 'success', text: 'Batch logged and medicine stock updated!' });
        setAddBatchModal(false);
        setBatchForm({ medicineId: '', batchNumber: '', quantity: '', expiryDate: '', costPrice: '' });
        loadPharmacyData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to add batch.' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900/40 via-slate-900 to-teal-900/40 border border-emerald-500/30 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Module 4 &bull; Day 1
              </span>
              <span className="text-xs text-slate-400 font-mono">Sep 14 Deliverable</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Pill className="w-7 h-7 text-emerald-400" />
              Pharmacy Stock & Medicine Inventory Desk
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Real-time pharmaceutical inventory tracking, automatic reorder level alerts, multi-batch expiration monitoring, and unit price valuation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAddBatchModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 font-semibold text-xs transition shadow-lg"
            >
              <Boxes className="w-4 h-4" />
              Log Batch
            </button>
            <button
              onClick={() => setAddMedModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition"
            >
              <Plus className="w-4 h-4" />
              Add Medicine
            </button>
          </div>
        </div>
      </div>

      {/* Overview Metric Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Medicines</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-white">{stats.totalMedicines}</div>
            <span className="text-[11px] text-slate-500">Active SKUs in catalog</span>
          </div>

          <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">Low Stock Alerts</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-amber-400">{stats.lowStockCount}</div>
            <span className="text-[11px] text-amber-300/70">At or below reorder limit</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inventory Value</span>
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-teal-300">${stats.totalInventoryValue.toLocaleString()}</div>
            <span className="text-[11px] text-slate-500">Total stock valuation</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Expiring Batches</span>
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-rose-400">{stats.expiringBatchesCount}</div>
            <span className="text-[11px] text-slate-500">Expiring in &le; 30 days</span>
          </div>
        </div>
      )}

      {/* Alert Messages */}
      {message && (
        <div
          className={`p-4 rounded-2xl border text-xs font-medium flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white font-bold">
            &times;
          </button>
        </div>
      )}

      {/* Main Workspace Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
          {/* Sub Tab Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 w-full sm:w-auto">
            <button
              onClick={() => setActiveSubTab('inventory')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeSubTab === 'inventory'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Medicine Inventory ({medicines.length})
            </button>
            <button
              onClick={() => setActiveSubTab('batches')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeSubTab === 'batches'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Inventory Batches ({batches.length})
            </button>
          </div>

          {/* Search & Low Stock Toggle */}
          {activeSubTab === 'inventory' && (
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search medicine, generic, brand..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-full sm:w-64"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={lowStockOnly}
                  onChange={(e) => setLowStockOnly(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="font-semibold text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Low Stock Only
                </span>
              </label>

              <button
                onClick={loadPharmacyData}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                title="Refresh inventory"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            </div>
          )}
        </div>

        {/* Tab 1: Medicine Inventory Table */}
        {activeSubTab === 'inventory' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold bg-slate-950/60">
                  <th className="py-3 px-4">Medicine Name</th>
                  <th className="py-3 px-4">Category / Form</th>
                  <th className="py-3 px-4">Manufacturer</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-center">Stock Level</th>
                  <th className="py-3 px-4 text-center">Reorder Limit</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {medicines.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                      No medicines match the search criteria.
                    </td>
                  </tr>
                ) : (
                  medicines.map((med) => (
                    <tr key={med.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <Pill className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div>
                            <div>{med.name}</div>
                            {med.genericName && (
                              <div className="text-[11px] text-slate-400 font-normal">
                                Generic: {med.genericName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700 text-[11px]">
                          {med.category || 'General'} &bull; {med.dosageForm || 'Tablet'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{med.manufacturer || 'N/A'}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                        ${med.unitPrice.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-base">
                        <span className={med.isLowStock ? 'text-amber-400' : 'text-white'}>
                          {med.stockQuantity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono">
                        {med.reorderLevel}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {med.isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            <AlertTriangle className="w-3 h-3" /> Reorder Needed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <CheckCircle2 className="w-3 h-3" /> In Stock
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Inventory Batches Table */}
        {activeSubTab === 'batches' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold bg-slate-950/60">
                  <th className="py-3 px-4">Batch Number</th>
                  <th className="py-3 px-4">Medicine Item</th>
                  <th className="py-3 px-4 text-center">Quantity</th>
                  <th className="py-3 px-4 text-right">Cost Price</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Date Logged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {batches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                      No inventory batches logged yet.
                    </td>
                  </tr>
                ) : (
                  batches.map((batch) => (
                    <tr key={batch.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-teal-300">
                        {batch.batchNumber}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">
                        {batch.medicine?.name || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-200">
                        +{batch.quantity}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-300">
                        ${batch.costPrice.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-rose-300 font-mono">
                        {new Date(batch.expiryDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(batch.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Medicine Modal */}
      {addMedModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" /> Add New Medicine SKU
              </h3>
              <button onClick={() => setAddMedModal(false)} className="text-slate-400 hover:text-white font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleAddMedicine} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Medicine Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amoxicillin 500mg"
                  value={medForm.name}
                  onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Generic Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Amoxicillin"
                    value={medForm.genericName}
                    onChange={(e) => setMedForm({ ...medForm, genericName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Dosage Form</label>
                  <select
                    value={medForm.dosageForm}
                    onChange={(e) => setMedForm({ ...medForm, dosageForm: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Inhaler">Inhaler</option>
                    <option value="Ointment">Ointment</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Antibiotic"
                    value={medForm.category}
                    onChange={(e) => setMedForm({ ...medForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Manufacturer</label>
                  <input
                    type="text"
                    placeholder="e.g. GSK / Pfizer"
                    value={medForm.manufacturer}
                    onChange={(e) => setMedForm({ ...medForm, manufacturer: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Unit Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="12.50"
                    value={medForm.unitPrice}
                    onChange={(e) => setMedForm({ ...medForm, unitPrice: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Initial Stock</label>
                  <input
                    type="number"
                    placeholder="100"
                    value={medForm.stockQuantity}
                    onChange={(e) => setMedForm({ ...medForm, stockQuantity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Reorder Limit</label>
                  <input
                    type="number"
                    placeholder="10"
                    value={medForm.reorderLevel}
                    onChange={(e) => setMedForm({ ...medForm, reorderLevel: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAddMedModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition"
                >
                  {actionLoading ? 'Saving...' : 'Save Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Batch Modal */}
      {addBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Boxes className="w-5 h-5 text-emerald-400" /> Log Inventory Batch
              </h3>
              <button onClick={() => setAddBatchModal(false)} className="text-slate-400 hover:text-white font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleAddBatch} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Select Medicine *</label>
                <select
                  required
                  value={batchForm.medicineId}
                  onChange={(e) => setBatchForm({ ...batchForm, medicineId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Choose Medicine --</option>
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Current Stock: {m.stockQuantity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Batch Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BATCH-2026-009"
                  value={batchForm.batchNumber}
                  onChange={(e) => setBatchForm({ ...batchForm, batchNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Quantity Received *</label>
                  <input
                    type="number"
                    required
                    placeholder="100"
                    value={batchForm.quantity}
                    onChange={(e) => setBatchForm({ ...batchForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Cost Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="8.50"
                    value={batchForm.costPrice}
                    onChange={(e) => setBatchForm({ ...batchForm, costPrice: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Expiry Date *</label>
                <input
                  type="date"
                  required
                  value={batchForm.expiryDate}
                  onChange={(e) => setBatchForm({ ...batchForm, expiryDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAddBatchModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition"
                >
                  {actionLoading ? 'Logging...' : 'Log Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
