import React, { useState } from 'react';
import { X, CheckCircle, IndianRupee, Send } from 'lucide-react';
import { Customer, StoreSettings } from '../types';
import { formatCurrency, buildWhatsAppUrl } from '../utils/formatters';

interface SettleUdhaarModalProps {
  isOpen: boolean;
  customer: Customer | null;
  mode: 'settle' | 'add';
  settings: StoreSettings;
  onClose: () => void;
  onSubmit: (customerId: number, amount: number, note: string, type: 'payment' | 'debit') => void;
}

export const SettleUdhaarModal: React.FC<SettleUdhaarModalProps> = ({
  isOpen,
  customer,
  mode,
  settings,
  onClose,
  onSubmit,
}) => {
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState('');

  if (!isOpen || !customer) return null;

  const currentBalance = customer.credit || 0;
  const newBalance =
    mode === 'settle' ? Math.max(0, currentBalance - (amount || 0)) : currentBalance + (amount || 0);

  const handleSettleFull = () => {
    setAmount(currentBalance);
    setNote('Full account clearance payment');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    onSubmit(
      customer.id,
      amount,
      note || (mode === 'settle' ? 'Payment received' : 'Medicines purchased on credit'),
      mode === 'settle' ? 'payment' : 'debit'
    );

    // Option to notify via WhatsApp
    if (mode === 'settle') {
      const receiptMsg = `Namaste ${customer.name}, received payment of ${formatCurrency(
        amount
      )} towards your medicine bill at ${settings.storeName}. Your updated Udhaar balance is ${formatCurrency(
        newBalance
      )}. Thank you!`;
      window.open(buildWhatsAppUrl(customer.phone, receiptMsg), '_blank', 'noopener,noreferrer');
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-slate-50/70 shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              {mode === 'settle' ? 'Record Udhaar Settlement' : 'Add to Udhaar Ledger'}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Patient: <strong className="text-slate-800">{customer.name}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs">
          {/* Current balance card */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <span className="text-slate-600 font-medium">Current Balance:</span>
            <span className="text-base font-bold text-rose-700 tabular-nums">
              {formatCurrency(currentBalance)}
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">
                {mode === 'settle' ? 'Payment Amount Received (₹) *' : 'New Debit / Bill Amount (₹) *'}
              </label>
              {mode === 'settle' && currentBalance > 0 && (
                <button
                  type="button"
                  onClick={handleSettleFull}
                  className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 cursor-pointer"
                >
                  Pay Full ({formatCurrency(currentBalance)})
                </button>
              )}
            </div>
            <input
              type="number"
              min="1"
              required
              value={amount || ''}
              onChange={e => setAmount(Number(e.target.value))}
              placeholder="0"
              className="w-full px-3 py-2 text-sm font-bold font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Payment Note / Bill Reference
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={mode === 'settle' ? 'e.g. UPI / Cash settlement' : 'e.g. Monthly medicine credit'}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
            />
          </div>

          {/* New Balance Projection */}
          <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-100 flex items-center justify-between">
            <span className="text-teal-900 font-medium">Balance After Transaction:</span>
            <span className="font-bold text-teal-950 tabular-nums text-sm">
              {formatCurrency(newBalance)}
            </span>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {mode === 'settle' ? 'Record Payment & WhatsApp Receipt' : 'Add to Ledger'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
