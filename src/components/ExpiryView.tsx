import React, { useState } from 'react';
import {
  AlertTriangle,
  Plus,
  Download,
  Trash2,
  Package,
  Building2,
  Calendar,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { StockItem, DistributorReturn, StoreSettings } from '../types';
import { formatCurrency, formatDate, daysDifference, exportToCSV } from '../utils/formatters';

interface ExpiryViewProps {
  stock: StockItem[];
  returns: DistributorReturn[];
  settings: StoreSettings;
  onOpenNewStock: () => void;
  onAddToReturns: (item: StockItem) => void;
  onRemoveReturn: (id: number) => void;
  onSubmitReturns: (supplier: string) => void;
  onDeleteStock: (id: number) => void;
}

export const ExpiryView: React.FC<ExpiryViewProps> = ({
  stock,
  returns,
  settings,
  onOpenNewStock,
  onAddToReturns,
  onRemoveReturn,
  onSubmitReturns,
  onDeleteStock,
}) => {
  const [filter, setFilter] = useState<'all' | '60days' | '30days'>('60days');

  // Filter batches
  const filteredStock = stock.filter(item => {
    const days = daysDifference(item.expiry);
    if (filter === '30days') return days <= 30;
    if (filter === '60days') return days <= 60;
    return true;
  });

  const expiring60Count = stock.filter(s => daysDifference(s.expiry) <= 60).length;
  const expiring30Count = stock.filter(s => daysDifference(s.expiry) <= 30).length;
  const returnIds = new Set(returns.map(r => r.stockId));

  // Group returns by supplier
  const returnsBySupplier = returns.reduce((acc, ret) => {
    acc[ret.supplier] = acc[ret.supplier] || [];
    acc[ret.supplier].push(ret);
    return acc;
  }, {} as Record<string, DistributorReturn[]>);

  const totalReturnValue = returns.reduce((sum, r) => sum + r.cost * r.qty, 0);

  const handleExportReturnsCSV = () => {
    const headers = [
      'Return ID',
      'Medicine Name',
      'Batch Number',
      'Distributor / Wholesaler',
      'Return Quantity',
      'Unit Cost (INR)',
      'Total Claim Amount (INR)',
      'Expiry Date',
      'Return Reason',
      'Claim Date',
    ];

    const rows = returns.map(r => [
      r.id,
      r.name,
      r.batch,
      r.supplier,
      r.qty,
      r.cost,
      r.cost * r.qty,
      r.expiry,
      r.reason,
      formatDate(r.addedAt.slice(0, 10)),
    ]);

    exportToCSV(
      'distributor-returns-automindz.csv',
      headers,
      rows,
      `${settings.storeName} — Official Distributor Return & Credit Note Claim`
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Expiry Alerts &amp; Return Claims
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Detect near-expiry batches early and generate credit-note claims for pharmaceutical wholesalers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportReturnsCSV}
            disabled={returns.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Return CSV</span>
          </button>

          <button
            onClick={onOpenNewStock}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log Medicine Batch</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Expiring ≤ 60 Days</div>
          <div className="mt-2 text-2xl font-bold text-amber-600 tabular-nums">
            {expiring60Count}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Batches needing review</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Critical ≤ 30 Days</div>
          <div className="mt-2 text-2xl font-bold text-rose-600 tabular-nums">
            {expiring30Count}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Urgent distributor return</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Queued Return Claims</div>
          <div className="mt-2 text-2xl font-bold text-teal-800 tabular-nums">
            {returns.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Ready for wholesaler</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Refundable Claim Value</div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            {formatCurrency(totalReturnValue)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Credit note recoverable</div>
        </div>
      </div>

      {/* Expiry Watchlist Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Inventory Batch Expiry Watch
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click &quot;+ Return Claim&quot; to queue an expiring medicine for wholesaler credit note
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setFilter('60days')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                filter === '60days' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Expiring &le; 60 Days ({expiring60Count})
            </button>
            <button
              onClick={() => setFilter('30days')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                filter === '30days' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Critical &le; 30 Days ({expiring30Count})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                filter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Batches ({stock.length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto touch-scroll">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Medicine &amp; Batch</th>
                <th className="py-3 px-4">Wholesaler / Distributor</th>
                <th className="py-3 px-4">Units in Stock</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Time Left</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStock.map(item => {
                const days = daysDifference(item.expiry);
                const isUrgent = days <= 30;
                const isQueued = returnIds.has(item.id);

                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Batch: {item.batch} {item.strength ? `· ${item.strength}` : ''}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-700">
                      {item.supplier}
                    </td>

                    <td className="py-3 px-4 tabular-nums font-semibold text-slate-800">
                      {item.qty} units
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900">{formatDate(item.expiry)}</div>
                      <div className="text-[10px] text-slate-400">MRP {formatCurrency(item.mrp)}</div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          days <= 0
                            ? 'bg-rose-100 text-rose-800'
                            : isUrgent
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : days <= 60
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {days <= 0 ? 'Expired' : `${days} days`}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onDeleteStock(item.id)}
                          className="p-1 text-slate-300 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete batch"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onAddToReturns(item)}
                          disabled={isQueued}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                            isQueued
                              ? 'bg-teal-50 text-teal-700 cursor-default'
                              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {isQueued ? 'Claim Added ✓' : '+ Return Claim'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredStock.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                    No batches match this expiry criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Distributor Claims Section */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Distributor Return Claims Sheet
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Organized by wholesale supplier for direct credit note submission
            </p>
          </div>

          <button
            onClick={handleExportReturnsCSV}
            disabled={returns.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Wholesaler Claim CSV</span>
          </button>
        </div>

        {Object.keys(returnsBySupplier).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(returnsBySupplier).map(([supplier, items]) => {
              const supplierTotal = items.reduce((sum, it) => sum + it.cost * it.qty, 0);

              return (
                <div
                  key={supplier}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-600" />
                      <span className="font-bold text-slate-900 text-xs">{supplier}</span>
                      <span className="text-slate-400 text-xs">({items.length} items)</span>
                    </div>

                    <div className="text-xs font-semibold text-slate-800 tabular-nums">
                      Claim Total: {formatCurrency(supplierTotal)}
                    </div>
                  </div>

                  <div className="divide-y divide-slate-200 bg-white rounded-lg border border-slate-200/80 overflow-hidden">
                    {items.map(ret => (
                      <div
                        key={ret.id}
                        className="p-2.5 flex items-center justify-between text-xs gap-3"
                      >
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-900">{ret.name}</span>{' '}
                          <span className="text-slate-500 font-mono text-[11px]">
                            (Batch {ret.batch})
                          </span>
                          <div className="text-[11px] text-slate-400">
                            Exp: {formatDate(ret.expiry)} · {ret.qty} units @ {formatCurrency(ret.cost)}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-bold text-slate-800 tabular-nums">
                            {formatCurrency(ret.cost * ret.qty)}
                          </span>

                          <button
                            onClick={() => onRemoveReturn(ret.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Remove from claim"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400">
            No return claims queued. Click &quot;+ Return Claim&quot; on any near-expiry batch above.
          </div>
        )}
      </div>
    </div>
  );
};
