import React, { useState } from 'react';
import { X, Send, CheckSquare, Square, Clock } from 'lucide-react';
import { Customer, StoreSettings } from '../types';
import { formatDate, buildWhatsAppUrl } from '../utils/formatters';

interface BulkReminderModalProps {
  isOpen: boolean;
  targetCustomers: Customer[];
  settings: StoreSettings;
  onClose: () => void;
  onConfirmDispatch: (selectedCustomers: Customer[]) => void;
}

export const BulkReminderModal: React.FC<BulkReminderModalProps> = ({
  isOpen,
  targetCustomers,
  settings,
  onClose,
  onConfirmDispatch,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    new Set(targetCustomers.map(c => c.id))
  );

  if (!isOpen) return null;

  const toggleSelect = (id: number) => {
    const updated = new Set(selectedIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedIds(updated);
  };

  const toggleAll = () => {
    if (selectedIds.size === targetCustomers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(targetCustomers.map(c => c.id)));
    }
  };

  const selectedCustomers = targetCustomers.filter(c => selectedIds.has(c.id));

  const handleDispatch = () => {
    onConfirmDispatch(selectedCustomers);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="relative w-full max-w-xl max-h-[92vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-slate-50/70 shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Bulk Refill WhatsApp Blast
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Review and dispatch medicine refill notices to patients due this week.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
          {/* Template preview */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600">
            <span className="font-semibold text-slate-800 block mb-1">
              Sample Message Preview:
            </span>
            <p className="italic text-[11px] leading-relaxed">
              &quot;Namaste [Patient Name], this is a gentle reminder from {settings.storeName}. Your regular medicine refill ([Prescription]) is scheduled for [Date]. Would you like us to pack your package for pickup? Reply YES to confirm.&quot;
            </p>
          </div>

          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>Select Patients to Notify:</span>
            <button
              onClick={toggleAll}
              className="text-teal-700 hover:text-teal-900 cursor-pointer"
            >
              {selectedIds.size === targetCustomers.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {targetCustomers.map(customer => {
              const isChecked = selectedIds.has(customer.id);
              return (
                <div
                  key={customer.id}
                  onClick={() => toggleSelect(customer.id)}
                  className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-teal-50/60 border-teal-200'
                      : 'bg-white border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-3">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-teal-700 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <div className="truncate">
                      <span className="font-semibold text-slate-900">{customer.name}</span>{' '}
                      <span className="text-slate-500 font-mono text-[11px]">({customer.phone})</span>
                      <div className="text-[11px] text-slate-600 truncate">{customer.meds}</div>
                    </div>
                  </div>

                  <span className="text-[11px] font-medium text-slate-600 shrink-0">
                    Due: {formatDate(customer.refillDate)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            Selected: <strong className="text-slate-900">{selectedCustomers.length}</strong> of{' '}
            {targetCustomers.length}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDispatch}
              disabled={selectedCustomers.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Queue &amp; Dispatch ({selectedCustomers.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
