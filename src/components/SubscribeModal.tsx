import React, { useState } from 'react';
import { X, Check, QrCode, CreditCard, Building2, Smartphone, ShieldCheck, Copy, CheckCheck } from 'lucide-react';
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
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'NetBanking' | 'Card' | 'Cash/Bank Transfer'>('UPI');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [selectedBank, setSelectedBank] = useState<string>('HDFC Bank');
  const [copiedUPI, setCopiedUPI] = useState(false);

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
  const totalAmount = currentPlanInfo.price;
  const baseAmount = totalAmount > 0 ? Math.round(totalAmount / 1.18) : 0;
  const gstAmount = totalAmount - baseAmount;
  const upiId = 'automindz@icici';

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUPI(true);
    setTimeout(() => setCopiedUPI(false), 2500);
  };

  const handleFillDemoRef = () => {
    if (paymentMethod === 'UPI') {
      setTransactionRef(`UPI/${Math.floor(100000000000 + Math.random() * 900000000000)}`);
    } else if (paymentMethod === 'NetBanking') {
      setTransactionRef(`NB-${selectedBank.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`);
    } else if (paymentMethod === 'Card') {
      setTransactionRef(`CARD-AUTH-${Date.now().toString().slice(-6)}`);
    } else {
      setTransactionRef(`CHQ-${Date.now().toString().slice(-6)}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTx = transactionRef.trim() || (selectedPlan === 'Trial' ? 'TRIAL-ACTIVATION' : `TXN-${Date.now().toString().slice(-8)}`);
    onSubmit({
      storeId: selectedStoreId,
      plan: selectedPlan,
      billingPeriod: currentPlanInfo.billingPeriod,
      paymentMethod,
      transactionRef: finalTx,
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

          {/* Payment Method Selector (Only needed if price > 0) */}
          {totalAmount > 0 && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Choose Payment Method
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'UPI', label: 'UPI / QR', icon: <Smartphone className="w-3.5 h-3.5" /> },
                  { id: 'NetBanking', label: 'Net Banking', icon: <Building2 className="w-3.5 h-3.5" /> },
                  { id: 'Card', label: 'Debit / Card', icon: <CreditCard className="w-3.5 h-3.5" /> },
                  { id: 'Cash/Bank Transfer', label: 'Bank RTGS', icon: <QrCode className="w-3.5 h-3.5" /> },
                ].map(opt => (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => setPaymentMethod(opt.id as any)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                      paymentMethod === opt.id
                        ? 'border-teal-700 bg-teal-50 text-teal-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {opt.icon}
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>

              {/* Dynamic Payment Details Section */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                {paymentMethod === 'UPI' && (
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Visual QR Code Representation */}
                    <div className="shrink-0 p-2 bg-white rounded-lg border border-slate-200 shadow-2xs text-center">
                      <div className="w-24 h-24 bg-slate-900 rounded flex flex-col items-center justify-center text-white p-2">
                        <QrCode className="w-12 h-12 text-teal-400" />
                        <span className="text-[9px] font-bold mt-1 tracking-wider">BHIM · UPI</span>
                      </div>
                      <span className="block text-[9px] text-slate-500 mt-1 font-mono">Scan & Pay</span>
                    </div>

                    <div className="space-y-2 flex-1 text-xs">
                      <div>
                        <span className="text-slate-500 text-[11px]">Automindz Official UPI ID:</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <code className="px-2 py-1 bg-white border border-slate-200 rounded text-teal-900 font-bold font-mono">
                            {upiId}
                          </code>
                          <button
                            type="button"
                            onClick={handleCopyUPI}
                            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            {copiedUPI ? <CheckCheck className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedUPI ? 'Copied' : 'Copy UPI'}</span>
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Scan with Google Pay, PhonePe, Paytm, or BHIM. Enter transaction reference/UTR below.
                      </p>
                    </div>
                  </div>
                )}

                {paymentMethod === 'NetBanking' && (
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Select Corporate / Retail Bank
                      </label>
                      <select
                        value={selectedBank}
                        onChange={e => setSelectedBank(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-700"
                      >
                        <option value="HDFC Bank">HDFC Bank</option>
                        <option value="State Bank of India">State Bank of India (SBI)</option>
                        <option value="ICICI Bank">ICICI Bank</option>
                        <option value="Axis Bank">Axis Bank</option>
                        <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                      </select>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      You will be directed to {selectedBank} payment gateway upon confirmation.
                    </p>
                  </div>
                )}

                {paymentMethod === 'Card' && (
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Card Number</label>
                      <input
                        type="text"
                        placeholder="4532 •••• •••• 8821"
                        defaultValue="4532 9012 3456 8821"
                        className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Expiry</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        defaultValue="08/29"
                        className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">CVV</label>
                      <input
                        type="password"
                        placeholder="•••"
                        defaultValue="842"
                        className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono"
                      />
                    </div>
                    <div className="flex items-end">
                      <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold mb-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>256-Bit SSL</span>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'Cash/Bank Transfer' && (
                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-900">Direct NEFT / RTGS Transfer Details:</p>
                    <p><span className="font-medium text-slate-700">Account Name:</span> Automindz Digital Labs Pvt. Ltd.</p>
                    <p><span className="font-medium text-slate-700">Account Number:</span> 982001199014 (Current Account)</p>
                    <p><span className="font-medium text-slate-700">IFSC Code:</span> ICIC0000011 (BKC Branch, Mumbai)</p>
                  </div>
                )}

                {/* Transaction Reference Input */}
                <div className="mt-3 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2">
                  <div className="w-full sm:w-auto flex-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      UTR / Transaction Reference No.
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. UPI/283910283910 or Cheque No."
                      value={transactionRef}
                      onChange={e => setTransactionRef(e.target.value)}
                      className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-700"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleFillDemoRef}
                    className="shrink-0 text-[11px] text-teal-800 hover:text-teal-950 font-semibold px-2 py-1 hover:bg-slate-200/50 rounded transition-colors cursor-pointer"
                  >
                    Auto-Fill Demo UTR
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>Instant activation & GST Tax Invoice receipt generation</span>
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
                className="px-5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                {selectedPlan === 'Trial' ? 'Activate 14-Day Trial' : `Pay ${formatCurrency(totalAmount)} & Activate`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
