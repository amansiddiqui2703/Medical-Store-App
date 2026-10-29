import React from 'react';
import { X, Printer, CheckCircle2, ShieldCheck, Building2 } from 'lucide-react';
import { SubscriptionInvoice, MedicalStore } from '../types';
import { formatCurrency } from '../utils/formatters';

interface TaxInvoiceModalProps {
  invoice: SubscriptionInvoice | null;
  store?: MedicalStore;
  onClose: () => void;
}

export const TaxInvoiceModal: React.FC<TaxInvoiceModalProps> = ({ invoice, store, onClose }) => {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceDateFormatted = new Date(invoice.date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const isTrial = invoice.plan === 'Trial' && invoice.totalAmount === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-3 sm:my-8 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 bg-slate-900 text-white print:hidden gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="w-4 sm:w-5 h-4 sm:h-5 text-teal-400 shrink-0" />
            <span className="font-semibold text-xs sm:text-sm truncate">Subscription Record Preview</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / Save PDF</span>
              <span className="sm:hidden">Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-8 font-sans text-slate-800 space-y-4 sm:space-y-6 print:p-6" id="printable-tax-invoice">
          <div className="flex flex-col sm:flex-row items-start justify-between border-b border-slate-200 pb-4 sm:pb-5 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-950">RefillDesk</span>
                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded bg-teal-100 text-teal-900 font-bold uppercase tracking-wider">
                  Subscription Record
                </span>
              </div>
              <p className="text-xs font-bold text-teal-800 mt-0.5">M.S. Medical Store App</p>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Provider legal and tax details are not configured.<br />
                <span className="font-semibold text-amber-700">Draft preview only:</span> not a GST/tax invoice.
              </p>
            </div>

            <div className="sm:text-right">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400">
                Subscription Record Preview
              </span>
              <p className="text-xs sm:text-sm font-bold text-slate-900 tabular-nums mt-0.5">{invoice.invoiceNumber}</p>
              <p className="text-[11px] sm:text-xs text-slate-500 tabular-nums mt-0.5">Date: {invoiceDateFormatted}</p>
              <div className={`mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold ${isTrial ? 'bg-teal-50 text-teal-800 border border-teal-200' : invoice.status === 'Paid' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                {invoice.status === 'Paid' && !isTrial ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : null}
                <span>{isTrial ? 'FREE TRIAL · ₹0' : invoice.status === 'Paid' ? 'MARKED PAID — VERIFY PAYMENT' : 'PAYMENT PENDING'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 sm:p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Store</p>
              <p className="font-bold text-slate-900 text-sm">{invoice.storeName}</p>
              {store && (
                <div className="text-slate-600 space-y-0.5 mt-1 text-[11px]">
                  <p><span className="font-medium text-slate-700">Proprietor:</span> {store.ownerName}</p>
                  <p>{store.address}</p>
                  <p><span className="font-medium text-slate-700">Drug License:</span> {store.licenseNumber}</p>
                  <p><span className="font-medium text-slate-700">Contact:</span> {store.phone}</p>
                </div>
              )}
            </div>

            <div className="text-right space-y-1 text-[11px]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                {isTrial ? 'Trial Reference' : 'Payment Reference'}
              </p>
              {!isTrial && (
                <p className="font-semibold text-slate-800">
                  Payment Mode: <span className="text-teal-900 font-bold">{invoice.paymentMethod}</span>
                </p>
              )}
              <p className="font-mono text-slate-600 text-[11px]">Reference: {invoice.transactionRef}</p>
              <p className="text-amber-700 font-semibold">Verify all details before using this record for accounting.</p>
            </div>
          </div>

          <div className="overflow-hidden border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-center">Quantity</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                <tr>
                  <td className="py-3 px-3">
                    <p className="font-bold text-slate-900">RefillDesk software — {invoice.plan} plan</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Draft subscription record. This screen does not verify payment or tax compliance.</p>
                  </td>
                  <td className="py-3 px-3 text-center tabular-nums font-medium">1</td>
                  <td className="py-3 px-3 text-right tabular-nums font-semibold text-slate-900">{formatCurrency(invoice.amount)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-72 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Recorded base amount:</span>
                <span className="tabular-nums font-medium">{formatCurrency(invoice.amount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Recorded tax estimate:</span>
                <span className="tabular-nums font-medium">{formatCurrency(invoice.gstAmount)}</span>
              </div>
              <div className="pt-2 border-t-2 border-slate-900 flex justify-between font-bold text-sm text-slate-950">
                <span>Total recorded:</span>
                <span className="tabular-nums text-teal-800 font-extrabold">{formatCurrency(invoice.totalAmount)}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-500">
            <div className="flex items-start gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Draft preview only — not a GST/tax invoice or proof of payment. Have an accountant verify legal and tax details before issuing any invoice.</span>
            </div>
            <div className="sm:text-right font-medium text-slate-700">M.S. Medical Store App</div>
          </div>
        </div>
      </div>
    </div>
  );
};
