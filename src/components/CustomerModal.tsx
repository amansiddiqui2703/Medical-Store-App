import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save } from 'lucide-react';
import { Customer } from '../types';

interface CustomerModalProps {
  isOpen: boolean;
  customer?: Customer | null;
  onClose: () => void;
  onSubmit: (customer: Omit<Customer, 'id' | 'lastVisit'>, editId?: number) => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  customer,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [meds, setMeds] = useState('');
  const [dosageNotes, setDosageNotes] = useState('');
  const [refillDate, setRefillDate] = useState('');
  const [cycleDays, setCycleDays] = useState(30);
  const [lastBill, setLastBill] = useState(0);
  const [credit, setCredit] = useState(0);
  const [doctorName, setDoctorName] = useState('');

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone);
      setMeds(customer.meds);
      setDosageNotes(customer.dosageNotes || '');
      setRefillDate(customer.refillDate);
      setCycleDays(customer.cycleDays || 30);
      setLastBill(customer.lastBill || 0);
      setCredit(customer.credit || 0);
      setDoctorName(customer.doctorName || '');
    } else {
      setName('');
      setPhone('');
      setMeds('');
      setDosageNotes('');
      // default refill date: 30 days from today
      const d = new Date();
      d.setDate(d.getDate() + 30);
      setRefillDate(d.toISOString().slice(0, 10));
      setCycleDays(30);
      setLastBill(0);
      setCredit(0);
      setDoctorName('');
    }
  }, [customer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !meds) return;

    onSubmit(
      {
        name: name.trim(),
        phone: phone.trim(),
        meds: meds.trim(),
        dosageNotes: dosageNotes.trim(),
        refillDate: refillDate || new Date().toISOString().slice(0, 10),
        cycleDays: Number(cycleDays) || 30,
        lastBill: Number(lastBill) || 0,
        credit: Number(credit) || 0,
        doctorName: doctorName.trim(),
      },
      customer?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="relative w-full max-w-xl max-h-[92vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-slate-50/70 shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              {customer ? 'Edit Chronic Patient Card' : 'Add Chronic Patient Card'}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Record medication regimen, refill cycle schedule, and Udhaar balance.
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Patient Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
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
              Regular Prescribed Medicines *
            </label>
            <input
              type="text"
              required
              value={meds}
              onChange={e => setMeds(e.target.value)}
              placeholder="e.g. Amlodipine 5mg, Telmisartan 40mg, Atorvastatin 10mg"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Dosage &amp; Timing Notes
              </label>
              <input
                type="text"
                value={dosageNotes}
                onChange={e => setDosageNotes(e.target.value)}
                placeholder="e.g. 1 tab morning after food"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Prescribing Doctor Name
              </label>
              <input
                type="text"
                value={doctorName}
                onChange={e => setDoctorName(e.target.value)}
                placeholder="e.g. Dr. Sunil Rao"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Next Refill Scheduled Date *
              </label>
              <input
                type="date"
                required
                value={refillDate}
                onChange={e => setRefillDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Refill Course Cycle (Days)
              </label>
              <select
                value={cycleDays}
                onChange={e => setCycleDays(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white cursor-pointer"
              >
                <option value={15}>15 days course</option>
                <option value={30}>30 days course (Monthly standard)</option>
                <option value={60}>60 days course</option>
                <option value={90}>90 days course (Quarterly)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Last Bill Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={lastBill}
                onChange={e => setLastBill(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Current Udhaar Balance (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={credit}
                onChange={e => setCredit(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono font-bold text-rose-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
              />
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
              className="px-5 py-2 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {customer ? 'Update Patient Card' : 'Save Patient Card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
