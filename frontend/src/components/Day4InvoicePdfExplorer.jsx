import React, { useState, useEffect } from 'react';
import { billingAPI } from '../services/api';
import {
  Printer,
  FileText,
  DollarSign,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  RefreshCw,
  Eye,
  ShieldCheck,
  Building,
} from 'lucide-react';

export function Day4InvoicePdfExplorer() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal States
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await billingAPI.getInvoices({ search, paymentStatus: statusFilter });
      if (res.success) {
        setInvoices(res.invoices || []);
      }
    } catch (err) {
      console.error('Error loading invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [search, statusFilter]);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentModalInvoice) return;

    setActionLoading(true);
    setMessage(null);
    try {
      const res = await billingAPI.recordPayment(paymentModalInvoice.id, {
        amount: paymentAmount,
        paymentMethod,
      });

      if (res.success) {
        setMessage({ type: 'success', text: res.message });
        setPaymentModalInvoice(null);
        setPaymentAmount('');
        loadInvoices();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to record payment.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900/40 via-slate-900 to-indigo-900/40 border border-purple-500/30 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Module 4 &bull; Day 4
              </span>
              <span className="text-xs text-slate-400 font-mono">Sep 17 Deliverable</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Printer className="w-7 h-7 text-purple-400" />
              Printable Invoice PDF Hub & Payment Tracking Desk
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Professional printable PDF invoice generator, itemized financial statements, payment recording engine with PENDING / PARTIAL / PAID lifecycle tracking.
            </p>
          </div>

          <button
            onClick={loadInvoices}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
            title="Refresh invoices"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
          </button>
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

      {/* Main Workspace Table & Filters */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" /> Hospital Billing Invoices
          </h3>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search invoice #, MRN, patient..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 w-full sm:w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
            >
              <option value="">All Payment Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="PARTIAL">PARTIAL</option>
              <option value="PAID">PAID</option>
            </select>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold bg-slate-950/60">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Patient Name & MRN</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-right">Paid Amount</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                    No billing invoices match the filter criteria.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-300">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      <div>
                        {inv.patient.firstName} {inv.patient.lastName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{inv.patient.mrn}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-white">
                      ${inv.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                      ${inv.paidAmount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-rose-300 font-mono">
                      ${inv.balanceDue.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                          inv.paymentStatus === 'PAID'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : inv.paymentStatus === 'PARTIAL'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}
                      >
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setPreviewInvoice(inv)}
                          className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 text-[11px] font-bold flex items-center gap-1 transition"
                        >
                          <Printer className="w-3.5 h-3.5" /> PDF View
                        </button>

                        {inv.paymentStatus !== 'PAID' && (
                          <button
                            onClick={() => {
                              setPaymentModalInvoice(inv);
                              setPaymentAmount(inv.balanceDue.toFixed(2));
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 transition"
                          >
                            <CreditCard className="w-3.5 h-3.5" /> Pay
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" /> Record Payment for {paymentModalInvoice.invoiceNumber}
              </h3>
              <button onClick={() => setPaymentModalInvoice(null)} className="text-slate-400 hover:text-white font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Patient:</span>
                  <span className="font-bold text-white">{paymentModalInvoice.patient.firstName} {paymentModalInvoice.patient.lastName}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total Invoice Amount:</span>
                  <span className="font-bold text-white">${paymentModalInvoice.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-rose-300 font-bold">
                  <span>Balance Due:</span>
                  <span>${paymentModalInvoice.balanceDue.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Payment Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Credit/Debit Card</option>
                  <option value="Insurance">Insurance Direct</option>
                  <option value="Online">Online Transfer</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaymentModalInvoice(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition"
                >
                  {actionLoading ? 'Recording...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Invoice PDF Preview Modal */}
      {previewInvoice && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 max-w-3xl w-full space-y-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 print:hidden">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Printer className="w-5 h-5 text-purple-400" /> Printable PDF Invoice Preview
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-lg"
                >
                  <Printer className="w-4 h-4" /> Print PDF / Save
                </button>
                <button
                  onClick={() => setPreviewInvoice(null)}
                  className="text-slate-400 hover:text-white font-bold text-lg"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* High-Fidelity Printable Invoice Document */}
            <div className="bg-white text-slate-900 rounded-2xl p-8 space-y-6 shadow-inner text-xs font-sans print:p-0">
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-900">
                    SMART HOSPITAL MANAGEMENT SYSTEM
                  </h1>
                  <p className="text-slate-600 font-medium">Cloud Healthcare Operations Platform</p>
                  <p className="text-slate-500 text-[11px]">700 Healthcare Parkway, Suite 400, Metro City</p>
                  <p className="text-slate-500 text-[11px]">Phone: +1 (555) 019-9000 &bull; Email: billing@smarthospital.org</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-purple-900 uppercase">INVOICE</span>
                  <div className="text-sm font-mono font-bold text-slate-800 mt-1">
                    {previewInvoice.invoiceNumber}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Date: {new Date(previewInvoice.issuedDate).toLocaleDateString()}
                  </div>
                  <span className={`inline-block mt-2 px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                    previewInvoice.paymentStatus === 'PAID'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    {previewInvoice.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Patient Info Card */}
              <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 font-bold uppercase text-[10px] block">Bill To Patient</span>
                  <div className="font-extrabold text-sm text-slate-900">
                    {previewInvoice.patient.firstName} {previewInvoice.patient.lastName}
                  </div>
                  <div className="text-slate-600 font-mono text-[11px]">MRN: {previewInvoice.patient.mrn}</div>
                  <div className="text-slate-500 text-[11px]">{previewInvoice.patient.phone || 'Phone: N/A'}</div>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 font-bold uppercase text-[10px] block">Insurance & Billing Info</span>
                  <div className="font-bold text-slate-800">
                    {previewInvoice.patient.insuranceProvider ? `${previewInvoice.patient.insuranceProvider}` : 'Self-Pay Patient'}
                  </div>
                  <div className="text-slate-500 text-[11px]">Policy #: {previewInvoice.patient.insurancePolicyNo || 'N/A'}</div>
                  <div className="text-slate-500 text-[11px]">Payment Method: {previewInvoice.paymentMethod || 'Cash'}</div>
                </div>
              </div>

              {/* Line Items Table */}
              <div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-900 text-slate-700 uppercase tracking-wider font-bold">
                      <th className="py-2.5">Item Description</th>
                      <th className="py-2.5 text-center">Category</th>
                      <th className="py-2.5 text-center">Qty</th>
                      <th className="py-2.5 text-right">Unit Price</th>
                      <th className="py-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {previewInvoice.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 font-bold text-slate-900">{item.description}</td>
                        <td className="py-2.5 text-center">
                          <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded text-[10px] font-mono">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-2.5 text-center font-bold text-slate-800">{item.quantity}</td>
                        <td className="py-2.5 text-right text-slate-600">${item.unitPrice.toFixed(2)}</td>
                        <td className="py-2.5 text-right font-bold text-slate-900">${item.totalPrice.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals */}
              <div className="flex justify-end border-t-2 border-slate-900 pt-4">
                <div className="w-64 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>${previewInvoice.subTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Tax ({previewInvoice.taxRate}%):</span>
                    <span>+${previewInvoice.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Discount:</span>
                    <span>-${previewInvoice.discount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm text-slate-900 border-t border-slate-300 pt-2">
                    <span>Total Amount:</span>
                    <span>${previewInvoice.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Paid Amount:</span>
                    <span>${previewInvoice.paidAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-rose-700 font-bold border-t border-slate-300 pt-1">
                    <span>Balance Due:</span>
                    <span>${previewInvoice.balanceDue.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Footer Signatures */}
              <div className="pt-8 border-t border-slate-200 flex justify-between items-end text-[10px] text-slate-500">
                <div>
                  <p>Thank you for choosing Smart Hospital System.</p>
                  <p>For questions concerning this invoice, contact accounts@smarthospital.org</p>
                </div>
                <div className="text-center border-t border-slate-400 w-44 pt-1">
                  <p className="font-bold text-slate-800">Authorized Signature</p>
                  <p className="text-[9px]">Accounts &amp; Billing Dept</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
