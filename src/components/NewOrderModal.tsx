import React, { useState } from 'react';
import { X, Upload, Sparkles, FileText, Check } from 'lucide-react';
import { Customer, Order, OrderStatus } from '../types';
import { generateSampleRxSvg } from '../utils/formatters';

interface NewOrderModalProps {
  isOpen: boolean;
  customers: Customer[];
  onClose: () => void;
  onSubmit: (order: Omit<Order, 'id' | 'orderNumber' | 'date' | 'time'>) => void;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
  isOpen,
  customers,
  onClose,
  onSubmit,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [itemsSummary, setItemsSummary] = useState('');
  const [status, setStatus] = useState<OrderStatus>('Review needed');
  const [amount, setAmount] = useState<number>(0);
  const [prescriptionUrl, setPrescriptionUrl] = useState<string>('');
  const [prescriptionFileName, setPrescriptionFileName] = useState<string>('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSelectCustomer = (customerId: number) => {
    const found = customers.find(c => c.id === customerId);
    if (found) {
      setCustomerName(found.name);
      setPhone(found.phone);
      setItemsSummary(found.meds);
      setAmount(found.lastBill);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPrescriptionFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setPrescriptionUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const loadSampleChronicRx = () => {
    const name = customerName || 'Pooja Verma';
    const svgUrl = generateSampleRxSvg(name, 'S. M. Joshi', [
      'Telmisartan 40mg + Hydrochlorothiazide 12.5mg (30 Tabs)',
      'Metformin 500mg SR (60 Tabs)',
      'Atorvastatin 10mg (30 Tabs)',
    ]);
    setPrescriptionUrl(svgUrl);
    setPrescriptionFileName(`sample_rx_${name.toLowerCase().replace(/\s+/g, '_')}.svg`);
    if (!itemsSummary) {
      setItemsSummary('Monthly Chronic course: Telmisartan 40mg, Metformin 500mg, Atorvastatin 10mg');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone || !itemsSummary) return;

    onSubmit({
      customerName: customerName.trim(),
      phone: phone.trim(),
      itemsSummary: itemsSummary.trim(),
      status,
      amount: Number(amount) || 0,
      prescriptionUrl: prescriptionUrl || undefined,
      prescriptionFileName: prescriptionFileName || undefined,
      isVerified: false,
      notes: notes.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="relative w-full max-w-xl max-h-[92vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-slate-50/70 shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Create New Order / Rx Entry
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Log incoming WhatsApp prescriptions, customer counter requests &amp; bills.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {/* Quick select existing patient */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Select from Registered Chronic Patients (Optional)
            </label>
            <select
              onChange={e => e.target.value && handleSelectCustomer(Number(e.target.value))}
              defaultValue=""
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white cursor-pointer"
            >
              <option value="">-- Choose existing patient to autofill --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone}) — {c.meds}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Patient / Customer Name *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="e.g. Ramesh Patel"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                WhatsApp Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. 919876543210"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Medicine List &amp; Dosage Summary *
            </label>
            <textarea
              required
              rows={3}
              value={itemsSummary}
              onChange={e => setItemsSummary(e.target.value)}
              placeholder="e.g. Amlodipine 5mg (30 tabs), Pan-D (15 caps), Paracetamol 650mg"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white leading-relaxed"
            />
          </div>

          {/* Prescription Attachment Section */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-800">
                Prescription Attachment (Image / PDF)
              </label>
              <button
                type="button"
                onClick={loadSampleChronicRx}
                className="flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Sample Doctor Rx</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex-1 flex items-center justify-center gap-2 p-3 bg-white border border-dashed border-slate-300 hover:border-teal-500 rounded-lg cursor-pointer transition-colors text-slate-600 hover:text-teal-700">
                <Upload className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-xs">Upload Prescription Photo</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {prescriptionFileName && (
              <div className="flex items-center justify-between p-2 bg-emerald-50 text-emerald-800 rounded-lg text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-medium truncate">{prescriptionFileName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPrescriptionUrl('');
                    setPrescriptionFileName('');
                  }}
                  className="text-emerald-700 hover:text-rose-600 font-semibold text-[11px] cursor-pointer"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Order Pipeline Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as OrderStatus)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white cursor-pointer"
              >
                <option value="Review needed">Review needed</option>
                <option value="Quoted">Quoted</option>
                <option value="Ready for pickup">Ready for pickup</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Estimated Bill Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={amount || ''}
                onChange={e => setAmount(Number(e.target.value))}
                placeholder="0"
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
              />
            </div>
          </div>

          {/* Form Actions */}
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
              Save Order &amp; Queue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
