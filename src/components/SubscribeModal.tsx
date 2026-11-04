import React, { useState } from 'react';
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
  }) => void;
}

export const SubscribeModal: React.FC<SubscribeModalProps> = ({
  isOpen,
  stores,
  activeStoreId,
  initialSelectedPlan = 'Annual VIP',
  onClose,
  onSubmit,
}) => {
  const [selectedStoreId, setSelectedStoreId] = useState<string>(activeStoreId || (stores[0]?.id || ''));
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanTier>(initialSelectedPlan);
  const [paymentMethod] = useState<'UPI' | 'NetBanking' | 'Card' | 'Cash/Bank Transfer'>('UPI');

  if (!isOpen) return null;

  // Pricing matrix
  const planDetails: Record<SubscriptionPlanTier, {
    name: string;
    price: number;
    billingPeriod: 'Monthly' | 'Annual';
    cadenceText: string;
    highlight?: string;
    features: string[];
  }> = {
    'Trial': {
      name: 'Free Trial',
      price: 0,
      billingPeriod: 'Monthly',
      cadenceText: '14 Days Free Demo',
      features: ['25 chronic patient profiles', 'Manual click-to-chat links', 'Standard expiry tracker'],
    },
    'Monthly': {
      name: 'Pro Monthly',
      price: 999,
      billingPeriod: 'Monthly',
      cadenceText: '₹999 / month (total payable)',
      features: [
        'Customer and refill records on this device',
        'Medicine stock and batch tracking',
        'Orders, completed sales and receipt printing',
        'Udhaar ledger and transaction history',
        'Local JSON backup and restore',
        'Manual reminder drafts (WhatsApp is not auto-sent)',
        'Single-device local storage; no cloud sync',
      ],
    },
    'Annual VIP': {
      name: 'Annual VIP',
      price: 9999,
      billingPeriod: 'Annual',
      cadenceText: 'Not for sale',
      highlight: 'RECOMMENDED · SAVE 20%',
      features: [
        'Not available in the current pilot release',
        'Annual billing and add-on services are not being sold yet',
        'Choose the monthly pilot only after reviewing the live demo',
      ],
    },
    'Enterprise': {
      name: 'Enterprise Multi-Store',
      price: 24999,
      billingPeriod: 'Annual',
      cadenceText: 'Not for sale',
      highlight: 'MULTI-BRANCH CHAINS',
      features: [
        'Not available in the current pilot release',
        'Multi-user accounts and multi-device sync are not included',
        'Do not purchase this tier; contact the developer for future availability',
      ],
    },
  };

  const currentPlanInfo = planDetails[selectedPlan];
  // Calculate preview-only values in render scope; paid checkout remains disabled.
  const baseAmount: number = currentPlanInfo.price;
  const totalAmount: number = selectedPlan === 'Monthly' ? 999 : baseAmount;
  const gstAmount: number = selectedPlan === 'Monthly' ? Math.round((totalAmount - totalAmount / 1.18) * 100) / 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPlan !== 'Trial') {
      window.alert('Paid-plan checkout is not connected to a verified payment gateway yet. No payment has been taken. Please use the free trial for now.');
      return;
    }
    onSubmit({
      storeId: selectedStoreId,
      plan: 'Trial',
      billingPeriod: 'Monthly',
      paymentMethod,
      transactionRef: 'TRIAL-ACTIVATION',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-3 sm:my-6 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-300">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-xs sm:text-sm">Automindz SaaS Licensing & Subscription</h3>
              <p className="text-[11px] sm:text-xs text-slate-400">Activate or extend software license for medical stores</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Target Store Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Medical Store to License / Renew
            </label>
            <div className="relative">
              <select
                value={selectedStoreId}
                onChange={e => setSelectedStoreId(e.target.value)}
                className="w-full text-xs font-medium text-slate-900 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-teal-700 focus:outline-none"
              >
                {stores.map(st => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.city}) — Current: {st.plan} (Expires: {st.subscriptionExpiresAt})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Plan Selection Tiers */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select Subscription Plan
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
              {(Object.keys(planDetails) as SubscriptionPlanTier[]).map(planKey => {
                const plan = planDetails[planKey];
                const isSelected = selectedPlan === planKey;
                return (
                  <div
                    key={planKey}
                    onClick={() => setSelectedPlan(planKey)}
                    className={`relative p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-teal-700 bg-teal-50/50 shadow-xs ring-1 ring-teal-700'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      {plan.highlight && (
                        <span className="block text-[9px] font-extrabold uppercase tracking-wider text-teal-800 mb-1">
                          {plan.highlight}
                        </span>
                      )}
                      <h4 className="text-xs font-bold text-slate-900">{plan.name}</h4>
                      <p className="text-sm font-extrabold text-slate-950 mt-1 tabular-nums">
                        {plan.price === 0 ? 'Free' : formatCurrency(plan.price)}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{plan.cadenceText}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/80">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-teal-800">
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Selected</span>
                          </>
                        ) : (
                          <span className="text-slate-400 font-normal">Click to select</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pricing Breakdown & Features Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <p className="font-semibold text-slate-900 mb-2">Included in {currentPlanInfo.name}:</p>
              <ul className="space-y-1.5 text-slate-600 text-[11px]">
                {currentPlanInfo.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-200 md:pl-4 pt-3 md:pt-0">
              <p className="font-semibold text-slate-900">Tax Invoice Summary (GST 18%):</p>
              <div className="space-y-1 text-slate-600 text-[11px]">
                <div className="flex justify-between">
                  <span>Base Software License:</span>
                  <span className="tabular-nums font-medium">{formatCurrency(baseAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST @ 18% (CGST 9% + SGST 9%):</span>
                  <span className="tabular-nums font-medium">{formatCurrency(gstAmount)}</span>
                </div>
                <div className="pt-2 border-t border-slate-300 flex justify-between font-bold text-slate-950 text-xs">
                  <span>Total Amount Payable:</span>
                  <span className="tabular-nums text-teal-800 text-sm font-extrabold">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {selectedPlan === 'Monthly' && (
            <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-xs text-slate-800">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="shrink-0 rounded-xl bg-white p-2 border border-slate-200">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent('upi://pay?pa=amanriyazsiddiqui.12@oksbi&pn=Aman%20Siddiqui&am=999&cu=INR&tn=Refill%20Desk%20Monthly%20Subscription')}`}
                    alt="UPI payment QR for ₹999 to Aman Siddiqui"
                    width="190"
                    height="190"
                    className="w-44 h-44"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 text-sm">Pay ₹999 for 30 days</p>
                  <p className="mt-1">Scan this QR using any UPI app. Confirm the recipient is <strong>Aman Siddiqui</strong> and the amount is <strong>₹999</strong> before paying.</p>
                  <p className="mt-2 font-semibold">UPI ID</p>
                  <p className="break-all rounded-md bg-white border border-teal-200 px-2 py-1 font-mono select-all">amanriyazsiddiqui.12@oksbi</p>
                  <p className="mt-2 text-slate-600">After payment, send the UPI UTR / transaction ID to the administrator for manual verification. Access must only be enabled after the payment is verified.</p>
                </div>
              </div>
              <p className="mt-3 border-t border-teal-200 pt-2 text-[11px] text-amber-800">This QR only initiates a UPI payment. It does not verify payment or activate a subscription automatically. Manual approval and secure cross-device licensing still need a server-side license service.</p>
            </div>
          )}
          {selectedPlan !== 'Monthly' && totalAmount > 0 && (
            <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950">
              <p className="font-bold">This plan is not available for purchase</p>
              <p className="mt-1">Only the ₹999 monthly pilot is currently offered. Annual and Enterprise plans are not available.</p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>UPI QR · manual payment verification</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={selectedPlan !== 'Trial'}
                className="px-5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {selectedPlan === 'Trial' ? 'Activate 14-Day Trial' : 'Pay by QR; request manual approval'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
