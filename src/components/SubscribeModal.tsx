import React, { useEffect, useState } from 'react';
import { X, Check, CreditCard, ShieldCheck } from 'lucide-react';
import { SubscriptionPlanTier, MedicalStore } from '../types';
import { formatCurrency } from '../utils/formatters';

interface SubscribeModalProps {
  isOpen: boolean;
  stores: MedicalStore[];
  activeStoreId: string;
  initialSelectedPlan?: SubscriptionPlanTier;
  onClose: () => void;
  onSubmit: (params: {
    storeId: string;
    plan: SubscriptionPlanTier;
    billingPeriod: 'Monthly' | 'Annual';
    paymentMethod: 'UPI' | 'NetBanking' | 'Card' | 'Cash/Bank Transfer';
    transactionRef: string;
    licenseToken?: string;
    expiresAt?: string;
  }) => void;
}

const plans: Record<SubscriptionPlanTier, { name: string; price: number; period: 'Monthly' | 'Annual'; features: string[] }> = {
  Trial: { name: 'Free Trial', price: 0, period: 'Monthly', features: ['25 chronic patient profiles', 'Manual click-to-chat links', 'Standard expiry tracker'] },
  Monthly: { name: 'Pro Monthly', price: 999, period: 'Monthly', features: ['Unlimited chronic patients', 'WhatsApp reminders', 'Prescription zoom desk', 'Udhaar ledger'] },
  'Annual VIP': { name: 'Annual VIP', price: 9999, period: 'Annual', features: ['Everything in Pro Monthly', 'Custom store branding', 'Priority support', 'Distributor return sheet'] },
  Enterprise: { name: 'Enterprise Multi-Store', price: 24999, period: 'Annual', features: ['Everything in Annual VIP', 'Up to 5 branches', 'Multi-counter logins', 'ERP integration assistance'] },
};

export const SubscribeModal: React.FC<SubscribeModalProps> = ({ isOpen, stores, activeStoreId, initialSelectedPlan = 'Annual VIP', onClose, onSubmit }) => {
  const [selectedStoreId, setSelectedStoreId] = useState(activeStoreId || stores[0]?.id || '');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanTier>(initialSelectedPlan);
  const [utr, setUtr] = useState('');
  const [licenseToken, setLicenseToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setSelectedStoreId(activeStoreId || stores[0]?.id || '');
    setSelectedPlan(initialSelectedPlan);
    setUtr('');
    setLicenseToken('');
    setError('');
  }, [isOpen, activeStoreId, initialSelectedPlan, stores]);

  if (!isOpen) return null;
  const plan = plans[selectedPlan];
  const gst = Math.round(plan.price * 18) / 100;
  const total = plan.price + gst;
  const upiId = (import.meta as any).env?.VITE_SUBSCRIPTION_UPI_ID || 'amanriyazsiddiqui.12@oksbi';
  const store = stores.find(s => s.id === selectedStoreId);
  const upiLink = upiId && plan.price > 0
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent('Automindz Digital Labs')}&am=${total.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Medical Store ' + (store?.name || '') + ' ' + selectedPlan)}`
    : '';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !selectedStoreId) return;
    if (selectedPlan === 'Trial') {
      onSubmit({ storeId: selectedStoreId, plan: 'Trial', billingPeriod: 'Monthly', paymentMethod: 'UPI', transactionRef: 'TRIAL-ACTIVATION' });
      return;
    }
    if (!utr.trim() || !licenseToken.trim()) {
      setError('Payment UTR aur admin se mila activation code dono enter karo.');
      return;
    }
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/license/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseToken: licenseToken.trim() }),
      });
      const data = await response.json();
      if (!response.ok || !data.valid || data.storeId !== selectedStoreId || data.plan !== (selectedPlan === 'Monthly' ? 'monthly' : selectedPlan === 'Annual VIP' ? 'annual_vip' : 'enterprise')) {
        throw new Error('Activation code invalid hai, expire ho gaya hai, ya kisi doosre store/plan ka hai.');
      }
      onSubmit({ storeId: selectedStoreId, plan: selectedPlan, billingPeriod: plan.period, paymentMethod: 'UPI', transactionRef: utr.trim(), licenseToken: licenseToken.trim(), expiresAt: data.expiresAt });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'License verify nahi ho saka. Internet check karke dobara try karo.');
    } finally { setBusy(false); }
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 overflow-y-auto">
    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl my-4 overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-slate-900 text-white">
        <div className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-teal-300" /><div><h3 className="font-semibold text-sm">Subscription & License</h3><p className="text-xs text-slate-300">Manual UPI payment · No payment gateway</p></div></div>
        <button type="button" onClick={onClose} aria-label="Close"><X className="w-5 h-5" /></button>
      </div>
      <form onSubmit={submit} className="p-4 sm:p-6 space-y-4">
        <label className="block text-xs font-semibold text-slate-700">Medical store
          <select className="mt-1 w-full border rounded-lg p-2.5" value={selectedStoreId} onChange={e => setSelectedStoreId(e.target.value)}>
            {stores.map(s => <option key={s.id} value={s.id}>{s.name} ({s.city})</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(plans) as SubscriptionPlanTier[]).map(key => <button type="button" key={key} onClick={() => setSelectedPlan(key)} className={`rounded-xl border p-3 text-left ${selectedPlan === key ? 'border-teal-700 bg-teal-50' : 'border-slate-200'}`}>
            <span className="block text-xs font-bold">{plans[key].name}</span><span className="block mt-1 text-sm font-extrabold">{plans[key].price ? formatCurrency(plans[key].price) : 'Free'}</span>
          </button>)}
        </div>
        <div className="rounded-xl bg-slate-50 border p-4 text-sm space-y-2">
          <div className="flex justify-between"><span>Plan amount</span><b>{formatCurrency(plan.price)}</b></div>
          {plan.price > 0 && <div className="flex justify-between"><span>GST estimate (18%)</span><b>{formatCurrency(gst)}</b></div>}
          <div className="flex justify-between border-t pt-2 font-bold"><span>Total</span><b>{formatCurrency(total)}</b></div>
          <ul className="text-xs text-slate-600 list-disc pl-4">{plan.features.map(f => <li key={f}>{f}</li>)}</ul>
        </div>
        {plan.price > 0 && <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-3 text-sm">
          <b>Manual UPI payment</b>
          {upiLink ? <a href={upiLink} className="inline-flex rounded-lg bg-teal-700 text-white px-4 py-2 font-semibold">Pay {formatCurrency(total)} using UPI app</a> : <p className="text-amber-900">UPI payment details abhi configure nahi hain. Payment karne se pehle store administrator se official UPI ID/QR lo.</p>}
          <p className="text-xs text-slate-700">Payment ke baad bank/UPI app mein successful transaction verify karke UTR enter karo. Screenshot ko payment proof nahi maana jayega. Admin payment verify karke activation code share karega.</p>
          <label className="block text-xs font-semibold">UPI UTR / Transaction ID<input className="mt-1 w-full rounded-lg border p-2.5" value={utr} onChange={e => setUtr(e.target.value)} placeholder="12-digit / transaction reference" /></label>
          <label className="block text-xs font-semibold">Admin activation code<input className="mt-1 w-full rounded-lg border p-2.5" value={licenseToken} onChange={e => setLicenseToken(e.target.value)} placeholder="Paste signed license code" /></label>
        </div>}
        {error && <p role="alert" className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">{error}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <span className="flex items-center gap-1 text-xs text-slate-500"><ShieldCheck className="w-4 h-4 text-teal-700" /> Server-signed license validation</span>
          <div className="flex gap-2"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm border">Cancel</button><button type="submit" disabled={busy} className="rounded-lg px-4 py-2 text-sm font-semibold bg-teal-700 text-white disabled:opacity-50">{busy ? 'Verifying…' : selectedPlan === 'Trial' ? 'Activate free trial' : 'Verify & activate'}</button></div>
        </div>
      </form>
    </div>
  </div>;
};
