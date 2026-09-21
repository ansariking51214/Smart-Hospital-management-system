import React, { useState, useEffect } from 'react';
import { billingAPI, patientsAPI } from '../services/api';
import {
  Calculator,
  Receipt,
  Search,
  FileCheck,
  Percent,
  DollarSign,
  PlusCircle,
  CheckCircle2,
  Stethoscope,
  FlaskConical,
  Pill,
  BedDouble,
  ShieldAlert,
} from 'lucide-react';

export function Day3AutoBillingExplorer() {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [unbilledData, setUnbilledData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Financial Adjustment Inputs
  const [taxRate, setTaxRate] = useState(5.0);
  const [discount, setDiscount] = useState(0.0);
  const [paymentStatus, setPaymentStatus] = useState('PENDING');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [createdInvoice, setCreatedInvoice] = useState(null);

  useEffect(() => {
    patientsAPI.getAll().then((res) => {
      if (res.patients?.length > 0) {
        setPatients(res.patients);
        setSelectedPatientId(res.patients[0].id);
      }
    });
  }, []);

  const handleFetchUnbilled = async (patientIdToFetch) => {
    const pId = patientIdToFetch || selectedPatientId;
    if (!pId) return;

    setLoading(true);
    setMessage(null);
    setCreatedInvoice(null);
    try {
      const res = await billingAPI.getUnbilledCharges(pId);
      if (res.success) {
        setUnbilledData(res);
      }
    } catch (err) {
      console.error('Error fetching unbilled charges:', err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to calculate unbilled charges.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPatientId) {
      handleFetchUnbilled(selectedPatientId);
    }
  }, [selectedPatientId]);

  // Financial Computations
  const subTotal = unbilledData ? unbilledData.estimatedSubTotal : 0;
  const taxAmount = (subTotal * taxRate) / 100;
  const totalAmount = Math.max(0, subTotal + taxAmount - discount);

  const handleGenerateInvoice = async () => {
    if (!unbilledData || unbilledData.unbilledItems.length === 0) {
      alert('No unbilled items to generate invoice.');
      return;
    }

    setActionLoading(true);
    setMessage(null);
    try {
      const payload = {
        patientId: selectedPatientId,
        items: unbilledData.unbilledItems,
        taxRate: parseFloat(taxRate),
        discount: parseFloat(discount),
        paymentStatus,
        paymentMethod: paymentStatus === 'PAID' ? paymentMethod : null,
      };

      const res = await billingAPI.createInvoice(payload);
      if (res.success) {
        setCreatedInvoice(res.invoice);
        setMessage({ type: 'success', text: `Invoice ${res.invoice.invoiceNumber} created successfully!` });
        // Refresh unbilled charges (which will now be empty or updated)
        handleFetchUnbilled();
      }
    } catch (err) {
      console.error('Error generating invoice:', err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to generate invoice.' });
    } finally {
      setActionLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'CONSULTATION':
        return <Stethoscope className="w-4 h-4 text-teal-400" />;
      case 'LAB':
        return <FlaskConical className="w-4 h-4 text-indigo-400" />;
      case 'PHARMACY':
        return <Pill className="w-4 h-4 text-emerald-400" />;
      case 'ROOM_CHARGE':
        return <BedDouble className="w-4 h-4 text-cyan-400" />;
      default:
        return <Receipt className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-slate-900 to-purple-900/40 border border-indigo-500/30 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                Module 4 &bull; Day 3
              </span>
              <span className="text-xs text-slate-400 font-mono">Sep 16 Deliverable</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Calculator className="w-7 h-7 text-indigo-400" />
              Automated Integrated Billing Calculation Engine
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Cross-module automated charge compilation: aggregates Consultation Fees + Diagnostic Tests + Prescribed Medicines + IPD Room Stay into unified itemized invoices.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} ({p.mrn})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
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

      {/* Created Invoice Success Snapshot */}
      {createdInvoice && (
        <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-3xl p-6 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Invoice Generated Successfully
            </h3>
            <span className="font-mono text-xs font-bold text-emerald-200 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
              {createdInvoice.invoiceNumber}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">Subtotal:</span>
              <span className="text-white font-bold">${createdInvoice.subTotal.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Tax &amp; Discount:</span>
              <span className="text-white font-bold">+${createdInvoice.taxAmount.toFixed(2)} / -${createdInvoice.discount.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Total Amount:</span>
              <span className="text-emerald-300 font-bold text-sm">${createdInvoice.totalAmount.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Payment Status:</span>
              <span className="text-amber-300 font-bold">{createdInvoice.paymentStatus}</span>
            </div>
          </div>
        </div>
      )}

      {/* Itemized Charges & Financial Calculation Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Itemized Unbilled Charges Table */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-400" /> Itemized Unbilled Clinical Charges
              </h3>
              <p className="text-xs text-slate-400">
                {unbilledData?.patient ? `Patient: ${unbilledData.patient.fullName} (${unbilledData.patient.mrn})` : 'Select patient above'}
              </p>
            </div>

            <button
              onClick={() => handleFetchUnbilled()}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-indigo-300 border border-slate-700 font-semibold transition"
            >
              Re-Calculate
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold bg-slate-950/60">
                  <th className="py-3 px-3">Service / Item Description</th>
                  <th className="py-3 px-3 text-center">Category</th>
                  <th className="py-3 px-3 text-center">Qty</th>
                  <th className="py-3 px-3 text-right">Unit Price</th>
                  <th className="py-3 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Calculating unbilled charges across modules...
                    </td>
                  </tr>
                ) : !unbilledData || unbilledData.unbilledItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                      No unbilled charges found for this patient.
                    </td>
                  </tr>
                ) : (
                  unbilledData.unbilledItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(item.category)}
                          <span>{item.description}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="bg-slate-950 border border-slate-800 text-slate-400 px-2 py-0.5 rounded text-[10px] font-mono">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold">{item.quantity}</td>
                      <td className="py-3 px-3 text-right text-slate-400">${item.unitPrice.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right font-bold text-indigo-300">
                        ${item.totalPrice.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Invoice Financial Parameters & Generator */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <DollarSign className="w-5 h-5 text-indigo-400" /> Invoice Calculations
          </h3>

          <div className="space-y-4 text-xs">
            {/* Subtotal Display */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400 font-semibold">Subtotal (Unbilled):</span>
              <span className="text-lg font-black text-white">${subTotal.toFixed(2)}</span>
            </div>

            {/* Tax Rate Input */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-indigo-400" /> Healthcare Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Calculated Tax: +${taxAmount.toFixed(2)}</span>
            </div>

            {/* Discount Input */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Discount Amount ($)
              </label>
              <input
                type="number"
                step="1"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Payment Status Option */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="PAID">PAID (Instant)</option>
                </select>
              </div>

              {paymentStatus === 'PAID' && (
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Online">Online</option>
                  </select>
                </div>
              )}
            </div>

            {/* Total Grand Amount Banner */}
            <div className="bg-gradient-to-r from-indigo-950 to-purple-950 border border-indigo-500/40 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Grand Total Due</span>
                <div className="text-2xl font-black text-white">${totalAmount.toFixed(2)}</div>
              </div>
              <FileCheck className="w-8 h-8 text-indigo-400" />
            </div>

            {/* Generate Invoice Action */}
            <button
              onClick={handleGenerateInvoice}
              disabled={actionLoading || !unbilledData || unbilledData.unbilledItems.length === 0}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
            >
              {actionLoading ? 'Generating Invoice...' : 'Generate Official Invoice'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
