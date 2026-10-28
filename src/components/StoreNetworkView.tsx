import React, { useState } from 'react';
import {
  Building2,
  Plus,
  CheckCircle2,
  Phone,
  MapPin,
  FileText,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  Trash2,
  Edit,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { MedicalStore } from '../types';
import { formatCurrency, formatDate, buildWhatsAppUrl, exportToCSV } from '../utils/formatters';

interface StoreNetworkViewProps {
  stores: MedicalStore[];
  activeStoreId: string;
  onSelectStore: (storeId: string) => void;
  onOpenAddStore: () => void;
  onDeleteStore: (storeId: string) => void;
  onManageSubscription?: (storeId: string) => void;
}

export const StoreNetworkView: React.FC<StoreNetworkViewProps> = ({
  stores,
  activeStoreId,
  onSelectStore,
  onOpenAddStore,
  onDeleteStore,
  onManageSubscription,
}) => {
  const [search, setSearch] = useState('');

  const filteredStores = stores.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.city.toLowerCase().includes(search.toLowerCase()) ||
    s.ownerName.toLowerCase().includes(search.toLowerCase()) ||
    s.phone.includes(search)
  );

  const activeCount = stores.filter(s => s.status === 'Active').length;
  const trialCount = stores.filter(s => s.status === 'Trial').length;

  const handleExportClientsCSV = () => {
    const headers = [
      'Store ID',
      'Medical Store Name',
      'City',
      'Registered Pharmacist / Owner',
      'Contact Phone',
      'Drug License No',
      'SaaS Plan',
      'Account Status',
      'Enrolled Date',
      'Address',
    ];

    const rows = stores.map(s => [
      s.id,
      s.name,
      s.city,
      s.ownerName,
      s.phone,
      s.licenseNumber,
      s.plan,
      s.status,
      formatDate(s.createdAt),
      s.address,
    ]);

    exportToCSV(
      'pharmacy-network-automindz.csv',
      headers,
      rows,
      'Automindz Digital Labs — Medical Store Client & SaaS Subscription Directory'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Pharmacy Network &amp; Multi-Store SaaS
            </h1>
            <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
              Automindz B2B
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Sell and deploy RefillDesk to different medical stores, manage client subscription licenses, and switch workspaces.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportClientsCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <span>Export Client Directory</span>
          </button>

          <button
            onClick={onOpenAddStore}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard New Medical Store</span>
          </button>
        </div>
      </div>

      {/* SaaS Network KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Enrolled Medical Stores</span>
            <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {stores.length}
          </div>
          <div className="text-[11px] text-teal-700 font-medium mt-1">
            {activeCount} active client licenses
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Active Subscriptions</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {activeCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {trialCount} stores on 14-day trial
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Automindz SaaS Model</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-base font-bold tracking-tight text-slate-900">
            Multi-Tenant Ready
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Sell license per medical store
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Recommended Pricing</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold tracking-tight text-slate-900 tabular-nums">
            ₹999 / mo
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            or ₹9,999/yr per store license
          </div>
        </div>
      </div>

      {/* Guide Banner for Selling RefillDesk */}
      <div className="p-4 bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-xl shadow-sm text-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-bold text-sm text-teal-200">
            <Sparkles className="w-4 h-4" />
            <span>How to Sell RefillDesk to Retail Medical Stores</span>
          </div>
          <p className="text-teal-100 text-[11px] leading-relaxed max-w-2xl">
            You can onboard unlimited chemist dispensaries! Click <strong>&quot;Onboard New Medical Store&quot;</strong>, enter the pharmacist&apos;s store name, drug license number, and WhatsApp number. Once created, select <strong>&quot;Switch to this Store&quot;</strong> to manage their independent chronic patient records, stock, and orders.
          </p>
        </div>

        <button
          onClick={onOpenAddStore}
          className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer shrink-0"
        >
          + Add New Store
        </button>
      </div>

      {/* Stores Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStores.map(store => {
          const isCurrentActive = store.id === activeStoreId;

          return (
            <div
              key={store.id}
              className={`p-5 rounded-xl border bg-white shadow-xs flex flex-col justify-between transition-all ${
                isCurrentActive
                  ? 'border-teal-600 ring-2 ring-teal-600/20 shadow-md'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Header: Store Name & Plan Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-base leading-tight">
                        {store.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{store.city}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span>Enrolled {formatDate(store.createdAt)}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                      store.plan === 'Annual VIP'
                        ? 'bg-purple-100 text-purple-800'
                        : store.plan === 'Monthly'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {store.plan}
                  </span>
                </div>

                {/* Tagline */}
                <p className="text-xs text-slate-600 italic mt-2.5">
                  &quot;{store.tagline}&quot;
                </p>

                {/* Key Details Strip */}
                <div className="mt-4 p-3 bg-slate-50 rounded-lg space-y-1.5 text-xs text-slate-700 border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[11px]">Pharmacist:</span>
                    <span className="font-semibold text-slate-900">{store.ownerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[11px]">WhatsApp:</span>
                    <span className="font-mono tabular-nums text-slate-800">{store.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[11px]">Drug License:</span>
                    <span className="font-mono text-slate-800 text-[11px] truncate max-w-[150px]">
                      {store.licenseNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[11px]">Full Address:</span>
                    <span className="text-slate-700 truncate max-w-[170px]" title={store.address}>
                      {store.address}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <a
                    href={buildWhatsAppUrl(
                      store.phone,
                      `Namaste ${store.ownerName}, greeting from Automindz Digital Labs regarding your RefillDesk pharmacy management system.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                    title="WhatsApp Store Owner"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>

                  {onManageSubscription && (
                    <button
                      onClick={() => onManageSubscription(store.id)}
                      className="p-1.5 text-slate-400 hover:text-teal-800 hover:bg-teal-50 rounded-md transition-colors cursor-pointer"
                      title="Manage Subscription & License"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {stores.length > 1 && (
                    <button
                      onClick={() => onDeleteStore(store.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                      title="Delete store record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {isCurrentActive ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>Active Workspace</span>
                  </span>
                ) : (
                  <button
                    onClick={() => onSelectStore(store.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-teal-700 rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    <span>Switch to Store</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
