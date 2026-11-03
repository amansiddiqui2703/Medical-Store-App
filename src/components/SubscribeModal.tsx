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
    licenseToken?: string;
    expiresAt?: string;
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
  const [isPaying, setIsPaying] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

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
      cadenceText: '₹999 / month + GST',
      features: [
        'Unlimited chronic patients',
        '9:00 AM Automated WhatsApp cron reminders',
        'Prescription zoom desk & verification',
        'Udhaar ledger with WhatsApp balance reminders',
      ],
    },
    'Annual VIP': {
      name: 'Annual VIP',
      price: 9999,
      billingPeriod: 'Annual',
      cadenceText: '₹9,999 / year + GST',
      highlight: 'RECOMMENDED · SAVE 20%',
      features: [
        'Everything in Pro Monthly',
        'Save ₹1,989 vs monthly renewals',
        'Custom store branding on WhatsApp messages',
        'Priority Meta WhatsApp Cloud API gateway setup',
        'Distributor return sheet generator (CSV & Print)',
        'Dedicated account manager support by Automindz',
      ],
    },
    'Enterprise': {
      name: 'Enterprise Multi-Store',
      price: 24999,
      billingPeriod: 'Annual',
      cadenceText: '₹24,999 / year + GST',
      highlight: 'MULTI-BRANCH CHAINS',
      features: [
        'Everything in Annual VIP',
        'Up to 5 pharmacy branches supported',
        'Multi-counter pharmacist logins',
        'Consolidated stock expiry return coordinator',
        'Custom ERP / billing software integration assist',
      ],
    },
  };

  const currentPlanInfo = planDetails[selectedPlan];
  // Calculate preview-only values in render scope; paid checkout remains disabled.
  const baseAmount: number = currentPlanInfo.price;
  const gstAmount: number = Math.round(baseAmount * 0.18 * 100) / 100;
  const totalAmount: number = Math.round((baseAmount + gstAmount) * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPaying || !selectedStoreId) return;
    if (selectedPlan === 'Trial') {
      onSubmit({ storeId: selectedStoreId, plan: 'Trial', billingPeriod: 'Monthly', paymentMethod, transactionRef: 'TRIAL-ACTIVATION' });
      return;
    }
    const selectedStore = stores.find(store => store.id === selectedStoreId);
    if (!selectedStore) { setCheckoutError('Select a valid store before checkout.'); return; }
    setIsPaying(true);
    setCheckoutError('');
    try {
      const planKey = selectedPlan === 'Monthly' ? 'monthly' : selectedPlan === 'Annual VIP' ? 'annual_vip' : 'enterprise';
      const orderResponse = await fetch('/api/billing/order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeName: selectedStore.name, plan: planKey }),
      });
      const orderData = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(orderData.error || 'Could not start secure checkout.');
      const RazorpayConstructor = (window as any).Razorpay;
      if (!RazorpayConstructor) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Razorpay Checkout could not load. Check your internet connection.'));
          document.body.appendChild(script);
        });
      }
      const Checkout = (window as any).Razorpay;
      if (!Checkout) throw new Error('Secure payment checkout is unavailable.');
      const result = await new Promise<any>((resolve, reject) => {
        const checkout = new Checkout({
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: selectedStore.name,
          description: currentPlanInfo.name,
          order_id: orderData.orderId,
          prefill: { name: selectedStore.ownerName || '', contact: selectedStore.phone || '' },
          theme: { color: '#0f766e' },
          handler: (response: any) => resolve(response),
          modal: { ondismiss: () => reject(new Error('Payment window closed. No license was activated.')) },
        });
        checkout.on('payment.failed', (response: any) => reject(new Error(response?.error?.description || 'Payment failed. No license was activated.')));
        checkout.open();
      });
      const verifyResponse = await fetch('/api/billing/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      });
      const verified = await verifyResponse.json();
      if (!verifyResponse.ok || !verified.ok || !verified.licenseToken || !verified.expiresAt) {
        throw new Error(verified.error || 'Payment could not be verified. Do not pay again until the transaction is checked.');
      }
      onSubmit({
        storeId: selectedStoreId, plan: selectedPlan,
        billingPeriod: currentPlanInfo.billingPeriod, paymentMethod: 'UPI',
        transactionRef: result.razorpay_payment_id,
        licenseToken: verified.licenseToken, expiresAt: verified.expiresAt,
      });
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'Checkout failed. No license was activated.');
    } finally {
      setIsPaying(false);
    }
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

          {checkoutError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{checkoutError}</p>}

          {totalAmount > 0 && (
            <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950">
              <p className="font-bold">Secure online checkout</p>
              <p className="mt-1">Payment is processed by Razorpay. Your pharmacy records remain on this device; only store name, selected plan and payment identifiers are sent for subscription verification.</p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>Secure payment verification required for paid plans</span>
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
                disabled={isPaying}
                className="px-5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isPaying ? 'Processing securely…' : selectedPlan === 'Trial' ? 'Activate 14-Day Trial' : `Pay ${formatCurrency(totalAmount)} securely`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
