import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Building2,
  ArrowUpRight,
  FileText,
  Download,
  Check,
  RefreshCw,
} from 'lucide-react';
import {
  MedicalStore,
  SubscriptionInvoice,
  SubscriptionPlanTier,
  Customer,
} from '../types';
import { formatCurrency, daysDifference, exportToCSV } from '../utils/formatters';

interface SubscriptionViewProps {
  stores: MedicalStore[];
  activeStoreId: string;
  invoices: SubscriptionInvoice[];
  customersCount: number;
  onOpenSubscribeModal: (plan?: SubscriptionPlanTier, targetStoreId?: string) => void;
  onViewInvoice: (invoice: SubscriptionInvoice) => void;
}

export const SubscriptionView: React.FC<SubscriptionViewProps> = ({
  stores,
  activeStoreId,
  invoices,
  customersCount,
  onOpenSubscribeModal,
  onViewInvoice,
}) => {
  const activeStore = stores.find(s => s.id === activeStoreId) || stores[0];
  const [filterStoreId, setFilterStoreId] = useState<string>('all');

  // Validity calculation for active store
  const daysLeft = activeStore ? daysDifference(activeStore.subscriptionExpiresAt) : 0;
  const isExpiringSoon = daysLeft <= 14 && daysLeft >= 0;
  const isExpired = daysLeft < 0;

  // Plan catalog
  const plans: {
    tier: SubscriptionPlanTier;
    name: string;
    price: number;
    period: string;
    badge?: string;
    description: string;
    patientLimit: string;
    features: string[];
    highlighted?: boolean;
  }[] = [
    {
      tier: 'Trial',
      name: 'Free Trial',
      price: 0,
      period: '14-day evaluation',
      description: 'Ideal for newly onboarded pharmacy stores testing digital refill reminders.',
      patientLimit: '25 Patients max',
      features: [
        'Up to 25 chronic patient cards',
        'Manual WhatsApp click-to-chat links',
        'Expiry stock tracking with 60-day alerts',
        'Basic Udhaar ledger recording',
      ],
    },
    {
      tier: 'Monthly',
      name: 'Pro Monthly',
      price: 999,
      period: 'per month + GST',
      description: 'Full featured automation suite for busy neighbourhood retail chemists.',
      patientLimit: 'Unlimited Patients',
      features: [
        'Unlimited chronic patient profiles',
        'Automated 9:00 AM WhatsApp refill cron engine',
        'High-resolution prescription zoom desk',
        'Udhaar ledger with WhatsApp balance reminders',
        'Weekly WhatsApp logs & delivery reports',
        'Local SQLite / Browser automatic sync',
      ],
    },
    {
      tier: 'Annual VIP',
      name: 'Annual VIP',
      price: 9999,
      period: 'per year + GST (Save 20%)',
      badge: 'RECOMMENDED FOR PHARMACIES',
      description: 'Best value for high-volume pharmacies. Includes VIP branding & direct API assistance.',
      patientLimit: 'Unlimited Patients',
      highlighted: true,
      features: [
        'Everything included in Pro Monthly',
        'Save ₹1,989 vs monthly renewals (2 months free)',
        'Custom pharmacy branding on all WhatsApp messages',
        'Priority Meta WhatsApp Cloud API gateway setup',
        'Distributor return sheet generator (Print & CSV)',
        'Priority telephone & remote desk support by Automindz',
      ],
    },
    {
      tier: 'Enterprise',
      name: 'Enterprise Multi-Store',
      price: 24999,
      period: 'per year + GST',
      badge: 'CHAIN PHARMACIES',
      description: 'Centralized multi-branch control for pharmacy chains, hospitals & distributors.',
      patientLimit: 'Unlimited across branches',
      features: [
        'Everything included in Annual VIP',
        'Connect up to 5 medical store branches',
        'Centralized dashboard & cross-branch customer transfers',
        'Multi-counter pharmacist logins & audit logs',
        'Consolidated vendor purchase & expiry returns desk',
        'Dedicated onboarding engineer from Automindz Digital Labs',
      ],
    },
  ];

  // Filter invoices
  const filteredInvoices = filterStoreId === 'all'
    ? invoices
    : invoices.filter(inv => inv.storeId === filterStoreId);

  const handleExportInvoicesCSV = () => {
    const headers = [
      'Invoice Number',
      'Medical Store',
      'Plan Tier',
      'Invoice Date',
      'Taxable Base (INR)',
      'GST 18% (INR)',
      'Total Paid (INR)',
      'Payment Method',
      'Transaction Ref',
      'Status',
    ];

    const rows = filteredInvoices.map(inv => [
      inv.invoiceNumber,
      inv.storeName,
      inv.plan,
      inv.date,
      inv.amount,
      inv.gstAmount,
      inv.totalAmount,
      inv.paymentMethod,
      inv.transactionRef,
      inv.status,
    ]);

    exportToCSV(
      `RefillDesk_Invoices_${new Date().toISOString().slice(0, 10)}.csv`,
      headers,
      rows,
      'Automindz Digital Labs — RefillDesk SaaS Tax Invoices & Billing Register'
    );
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Subscription & SaaS Licensing
            </h2>
            <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Automindz Digital Labs
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage software plans, license validity periods, and download official 18% GST tax invoices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenSubscribeModal('Annual VIP', activeStore?.id)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>Renew / Upgrade License</span>
          </button>
        </div>
      </div>

      {/* Active Store License Status Card */}
      {activeStore && (
        <div
          className={`p-6 rounded-2xl border transition-all ${
            isExpired
              ? 'bg-rose-50/60 border-rose-200'
              : isExpiringSoon
              ? 'bg-amber-50/60 border-amber-200'
              : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Current Active Workspace
                </span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="text-xs font-semibold text-teal-800">
                  {activeStore.city} Branch
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{activeStore.name}</h3>
              <p className="text-xs text-slate-600">
                Drug License: <span className="font-mono text-slate-800">{activeStore.licenseNumber}</span>
                <span className="mx-2 text-slate-300">·</span>
                Proprietor: <span className="font-medium text-slate-800">{activeStore.ownerName}</span>
              </p>
            </div>

            {/* Plan & Expiry badge */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-50/90 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Enrolled Plan
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-sm font-bold text-slate-900">{activeStore.plan}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeStore.status === 'Active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : activeStore.status === 'Trial'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {activeStore.status}
                  </span>
                </div>
              </div>

              <div className="sm:border-l border-slate-200 sm:pl-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  License Validity
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock className={`w-3.5 h-3.5 ${isExpired ? 'text-rose-600' : isExpiringSoon ? 'text-amber-600' : 'text-teal-600'}`} />
                  <span className={`text-xs font-bold tabular-nums ${
                    isExpired ? 'text-rose-700' : isExpiringSoon ? 'text-amber-700' : 'text-slate-800'
                  }`}>
                    {isExpired
                      ? `Expired (${Math.abs(daysLeft)} days ago)`
                      : `${daysLeft} days remaining · till ${activeStore.subscriptionExpiresAt}`}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onOpenSubscribeModal('Annual VIP', activeStore.id)}
                className="px-3.5 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors cursor-pointer border border-teal-200 shrink-0"
              >
                Extend Validity
              </button>
            </div>
          </div>

          {/* Quota meters */}
          <div className="mt-6 pt-5 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 text-[11px] block">Chronic Patient Cards</span>
              <span className="text-sm font-bold text-slate-900 tabular-nums">
                {customersCount} / {activeStore.plan === 'Trial' ? '25' : 'Unlimited'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">9:00 AM Automated Scan</span>
              <span className="text-sm font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Active</span>
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">WhatsApp Cloud API</span>
              <span className="text-sm font-bold text-teal-800">
                {activeStore.whatsappAccessToken ? 'Connected' : 'Click-to-chat ready'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Software Provider</span>
              <span className="text-sm font-bold text-slate-800">Automindz Digital Labs</span>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Comparison Cards */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Subscription Plans for Medical Stores</h3>
          <p className="text-xs text-slate-500">
            Transparent pricing designed for independent retail chemists and pharmacy chains.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map(p => {
            const isCurrentStorePlan = activeStore?.plan === p.tier;
            return (
              <div
                key={p.tier}
                className={`relative rounded-2xl p-5 flex flex-col justify-between transition-all ${
                  p.highlighted
                    ? 'bg-white border-2 border-teal-700 shadow-md ring-1 ring-teal-700/20'
                    : 'bg-white border border-slate-200 shadow-2xs hover:shadow-xs'
                }`}
              >
                <div>
                  {p.badge && (
                    <div className="inline-block px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900 text-[9px] font-extrabold uppercase tracking-wider mb-2">
                      {p.badge}
                    </div>
                  )}
                  <h4 className="text-base font-bold text-slate-900">{p.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 min-h-[32px]">{p.description}</p>

                  <div className="mt-4 pb-4 border-b border-slate-200">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-slate-950 tabular-nums">
                        {p.price === 0 ? 'Free' : formatCurrency(p.price)}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5">{p.period}</span>
                    <span className="text-[10px] font-bold text-teal-700 mt-1 block">
                      Quota: {p.patientLimit}
                    </span>
                  </div>

                  {/* Feature checklist */}
                  <ul className="mt-4 space-y-2 text-xs text-slate-600">
                    {p.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-tight">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/80">
                  <button
                    onClick={() => onOpenSubscribeModal(p.tier, activeStore?.id)}
                    className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                      isCurrentStorePlan
                        ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                        : p.highlighted
                        ? 'bg-teal-700 hover:bg-teal-800 text-white shadow-xs'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <span>{isCurrentStorePlan ? 'Renew Current Plan' : `Choose ${p.name}`}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Multi-Store License Overview Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Medical Stores Network Licenses</h3>
            <p className="text-xs text-slate-500">
              Track validity dates across all chemist branches connected to your Automindz SaaS account.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto touch-scroll">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Store & Location</th>
                  <th className="py-3 px-4">Owner / Reg. Pharmacist</th>
                  <th className="py-3 px-4">Plan Tier</th>
                  <th className="py-3 px-4">License Expiry Date</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {stores.map(st => {
                  const days = daysDifference(st.subscriptionExpiresAt);
                  const isStoreActive = st.id === activeStoreId;
                  return (
                    <tr key={st.id} className={isStoreActive ? 'bg-teal-50/30' : 'hover:bg-slate-50/60'}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-teal-700 shrink-0" />
                          <div>
                            <span className="font-bold text-slate-900 block">{st.name}</span>
                            <span className="text-[11px] text-slate-500">{st.city} · {st.licenseNumber}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {st.ownerName}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900">{st.plan}</span>
                      </td>
                      <td className="py-3 px-4 tabular-nums">
                        <span className="font-semibold text-slate-900">{st.subscriptionExpiresAt}</span>
                        <span className={`block text-[11px] ${days < 0 ? 'text-rose-600 font-bold' : days <= 14 ? 'text-amber-600 font-bold' : 'text-slate-500'}`}>
                          {days < 0 ? `Expired (${Math.abs(days)}d ago)` : `${days} days left`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          st.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : st.status === 'Trial'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {st.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onOpenSubscribeModal('Annual VIP', st.id)}
                          className="px-2.5 py-1 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-md transition-colors cursor-pointer"
                        >
                          Renew / Upgrade
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Tax Invoices & Billing History Section */}
      <div className="space-y-3 pt-4 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Billing History & GST Tax Invoices</h3>
            <p className="text-xs text-slate-500">
              Compliant tax invoices with 18% GST (CGST + SGST), SAC Code 998314.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterStoreId}
              onChange={e => setFilterStoreId(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none"
            >
              <option value="all">All Stores ({invoices.length} invoices)</option>
              {stores.map(st => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </select>

            <button
              onClick={handleExportInvoicesCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto touch-scroll">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Invoice No.</th>
                  <th className="py-3 px-4">Medical Store</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Taxable (Base)</th>
                  <th className="py-3 px-4 text-right">GST (18%)</th>
                  <th className="py-3 px-4 text-right">Total Paid</th>
                  <th className="py-3 px-4">Payment Ref</th>
                  <th className="py-3 px-4 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No invoices found for the selected store.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {inv.storeName}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-teal-900">{inv.plan}</span>
                      </td>
                      <td className="py-3 px-4 tabular-nums text-slate-600">
                        {inv.date}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-slate-600">
                        {formatCurrency(inv.amount)}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-slate-600">
                        {formatCurrency(inv.gstAmount)}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums font-bold text-slate-900">
                        {formatCurrency(inv.totalAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-mono text-slate-500 block">
                          {inv.paymentMethod}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {inv.transactionRef}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onViewInvoice(inv)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-md border border-teal-200 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Invoice</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
