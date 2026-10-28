import React, { useState } from 'react';
import { X, Building2, Check, Sparkles } from 'lucide-react';
import { MedicalStore } from '../types';

interface AddStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (storeData: Omit<MedicalStore, 'id' | 'createdAt'>, switchToNew: boolean) => void;
}

export const AddStoreModal: React.FC<AddStoreModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('Trusted Pharmacy & Healthcare');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [plan, setPlan] = useState<'Trial' | 'Monthly' | 'Annual VIP'>('Monthly');
  const [switchToNew, setSwitchToNew] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const daysToAdd = plan === 'Annual VIP' ? 365 : plan === 'Trial' ? 14 : 30;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysToAdd);
    const subscriptionExpiresAt = expiryDate.toISOString().slice(0, 10);

    onSubmit(
      {
        name: name.trim(),
        tagline: tagline.trim(),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        city: city.trim(),
        address: address.trim() || `${city}, India`,
        licenseNumber: licenseNumber.trim() || `20B/21B-${city.slice(0, 2).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`,
        plan,
        status: plan === 'Trial' ? 'Trial' : 'Active',
        subscriptionExpiresAt,
        reminderDaysBefore: 3,
        autoCronEnabled: true,
        reminderTemplate: `Namaste {name}, this is a gentle reminder from {store}. Your regular medicine refill ({meds}) is scheduled for {refill_date}. Would you like us to keep your package ready for quick pickup? Reply YES.`,
        readyTemplate: `Namaste {name}, your medicines for Order #{order_id} are packed and ready for pickup at {store}! Total bill: {amount}.`,
      },
      switchToNew
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="relative w-full max-w-xl max-h-[92vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 sm:p-2 bg-teal-100 text-teal-800 rounded-lg">
              <Building2 className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Onboard New Medical Store
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Add a new pharmacy client to your Automindz SaaS network.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Medical Store / Pharmacy Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Noble Chemist &amp; Druggist"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Owner / Registered Pharmacist *
              </label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                placeholder="e.g. Rajesh Gupta (B.Pharm)"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Store City / Location *
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="e.g. Mumbai, Delhi, Lucknow"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Store WhatsApp Number *
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

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Drug License Number (Optional)
              </label>
              <input
                type="text"
                value={licenseNumber}
                onChange={e => setLicenseNumber(e.target.value)}
                placeholder="e.g. 20B/21B-MH-49201"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Store Address / Landmark
            </label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="e.g. Shop 2, Near Civil Hospital, MG Road"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Store Tagline
            </label>
            <input
              type="text"
              value={tagline}
              onChange={e => setTagline(e.target.value)}
              placeholder="e.g. 24x7 Medicines &amp; Genuine Care"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
            />
          </div>

          {/* SaaS Pricing Plan */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Select Client SaaS Subscription Plan
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'Trial', name: '14-Day Trial', price: 'Free Demo' },
                { id: 'Monthly', name: 'Monthly Plan', price: '₹999 / mo' },
                { id: 'Annual VIP', name: 'Annual VIP Plan', price: '₹9,999 / yr' },
              ].map(p => (
                <div
                  key={p.id}
                  onClick={() => setPlan(p.id as any)}
                  className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                    plan === p.id
                      ? 'border-teal-700 bg-teal-50/70 font-bold text-teal-950 shadow-2xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-xs">{p.name}</div>
                  <div className="text-[11px] text-teal-700 mt-1 font-semibold">{p.price}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Switch toggle checkbox */}
          <div className="pt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="switchToNew"
              checked={switchToNew}
              onChange={e => setSwitchToNew(e.target.checked)}
              className="rounded text-teal-700 focus:ring-teal-600 cursor-pointer"
            />
            <label htmlFor="switchToNew" className="text-xs text-slate-700 cursor-pointer font-medium">
              Switch workspace to this medical store immediately upon creation
            </label>
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
              Onboard Store
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
