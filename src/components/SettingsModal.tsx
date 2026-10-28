import React, { useState } from 'react';
import { X, Save, RotateCcw, Download, Upload, Shield } from 'lucide-react';
import { StoreSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  settings: StoreSettings;
  onClose: () => void;
  onSave: (updated: StoreSettings) => void;
  onResetData: () => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSave,
  onResetData,
  onExportData,
  onImportData,
}) => {
  const [formData, setFormData] = useState<StoreSettings>(settings);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="relative w-full max-w-xl max-h-[92vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-slate-50/70 shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Pharmacy &amp; RefillDesk Configuration
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Customize pharmacy store identity, reminder schedules, and templates.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {/* Store Profile */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-[10px] text-slate-400">
              Store Profile
            </h4>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Medical Store Name
              </label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={e => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Owner / Registered Pharmacist
                </label>
                <input
                  type="text"
                  value={formData.ownerName}
                  onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Drug License Number
                </label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Store Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
              />
            </div>
          </div>

          {/* Automated Schedule */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-[10px] text-slate-400">
              Refill Automation Schedule
            </h4>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Advance Notice Days (Target for 9 AM Cron Scan)
              </label>
              <select
                value={formData.reminderDaysBefore}
                onChange={e =>
                  setFormData({ ...formData, reminderDaysBefore: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white cursor-pointer"
              >
                <option value={1}>1 day before refill date</option>
                <option value={2}>2 days before refill date</option>
                <option value={3}>3 days before refill date (Recommended standard)</option>
                <option value={5}>5 days before refill date</option>
                <option value={7}>7 days before refill date</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Refill Reminder WhatsApp Template
              </label>
              <textarea
                rows={3}
                value={formData.reminderTemplate}
                onChange={e => setFormData({ ...formData, reminderTemplate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white leading-relaxed"
              />
              <div className="text-[10px] text-slate-400 mt-1">
                Placeholders: {'{name}'}, {'{store}'}, {'{meds}'}, {'{refill_date}'}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Ready for Pickup WhatsApp Template
              </label>
              <textarea
                rows={2}
                value={formData.readyTemplate}
                onChange={e => setFormData({ ...formData, readyTemplate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white leading-relaxed"
              />
              <div className="text-[10px] text-slate-400 mt-1">
                Placeholders: {'{name}'}, {'{order_id}'}, {'{store}'}, {'{amount}'}
              </div>
            </div>
          </div>

          {/* Data Backup & Factory Reset */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-[10px] text-slate-400">
              Data Backup &amp; Recovery
            </h4>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onExportData}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export All Data (JSON)</span>
              </button>

              <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Import Backup</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={onImportData}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={onResetData}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors cursor-pointer ml-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Demo Data</span>
              </button>
            </div>
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
              className="flex items-center gap-1.5 px-5 py-2 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
