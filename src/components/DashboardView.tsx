import React from 'react';
import {
  Users,
  Clock,
  MessageSquare,
  IndianRupee,
  AlertTriangle,
  ArrowRight,
  Send,
  Eye,
  Plus,
  Package,
  History,
  Building2,
} from 'lucide-react';
import { Customer, StockItem, Order, CreditTransaction } from '../types';
import { formatCurrency, formatDate, daysDifference, buildWhatsAppUrl } from '../utils/formatters';

interface DashboardViewProps {
  customers: Customer[];
  stock: StockItem[];
  orders: Order[];
  transactions: CreditTransaction[];
  onNavigate: (tab: any) => void;
  onOpenOrder: () => void;
  onOpenNewCustomer: () => void;
  onViewPrescription: (order: Order) => void;
  onAddToReturns: (item: StockItem) => void;
  returnIds: Set<number>;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  customers,
  stock,
  orders,
  transactions,
  onNavigate,
  onOpenOrder,
  onOpenNewCustomer,
  onViewPrescription,
  onAddToReturns,
  returnIds,
}) => {
  // Compute key stats
  const dueThisWeek = customers.filter(c => {
    const d = daysDifference(c.refillDate);
    return d >= 0 && d <= 7;
  });

  const expiringStock = stock.filter(s => {
    const d = daysDifference(s.expiry);
    return d >= 0 && d <= 60;
  });

  const totalUdhaar = customers.reduce((sum, c) => sum + (c.credit || 0), 0);
  const activeOrders = orders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled');
  const readyOrders = orders.filter(o => o.status === 'Ready for pickup');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Store Overview
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time pharmacy counters, chronic care schedule &amp; order fulfillment.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewCustomer}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Patient</span>
          </button>
          <button
            onClick={onOpenOrder}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Order / Rx</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards (4 columns) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1 */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Chronic Patients</span>
            <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {customers.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Active prescription profiles</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Refills Due (7 Days)</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {dueThisWeek.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {customers.filter(c => daysDifference(c.refillDate) === 0).length} due today
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>WhatsApp Queue</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {activeOrders.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {readyOrders.length} packed for pickup
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Udhaar Ledger</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-700">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {formatCurrency(totalUdhaar)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {customers.filter(c => (c.credit || 0) > 0).length} pending patient balances
          </div>
        </div>
      </div>

      {/* Main 2-Column Split: Refills vs Expiries */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Urgent Refills (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Refills Due This Week
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Proactive medicine reminders to maintain patient adherence
              </p>
            </div>
            <button
              onClick={() => onNavigate('refill')}
              className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 cursor-pointer"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="pb-2.5">Patient</th>
                  <th className="pb-2.5">Prescribed Medicines</th>
                  <th className="pb-2.5">Refill Due</th>
                  <th className="pb-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dueThisWeek.slice(0, 4).map(c => {
                  const days = daysDifference(c.refillDate);
                  const isToday = days === 0;
                  const isOverdue = days < 0;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 pr-3">
                        <div className="font-semibold text-slate-900">{c.name}</div>
                        <div className="text-[11px] text-slate-500 tabular-nums">{c.phone}</div>
                      </td>
                      <td className="py-3 pr-3 max-w-[200px]">
                        <div className="text-slate-800 truncate font-medium">{c.meds}</div>
                        <div className="text-[11px] text-slate-400 truncate">{c.dosageNotes || 'Regular cycle'}</div>
                      </td>
                      <td className="py-3 pr-3 whitespace-nowrap">
                        <div className="font-medium text-slate-900">{formatDate(c.refillDate)}</div>
                        <div className={`text-[10px] font-semibold ${isToday ? 'text-amber-600' : isOverdue ? 'text-rose-600' : 'text-teal-600'}`}>
                          {isToday ? 'Due Today' : isOverdue ? `${Math.abs(days)}d overdue` : `In ${days} days`}
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <a
                          href={buildWhatsAppUrl(
                            c.phone,
                            `Namaste ${c.name}, gentle reminder from your medical store. Your medicine refill (${c.meds}) is scheduled for ${formatDate(c.refillDate)}. Would you like us to pack your prescription for pickup? Reply YES to confirm.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                        >
                          <Send className="w-3 h-3 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>
                      </td>
                    </tr>
                  );
                })}
                {dueThisWeek.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-xs text-slate-500">
                      No refills scheduled in the next 7 days.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Expiry Watchlist (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Near-Expiry Batches
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Stock expiring within 60 days
              </p>
            </div>
            <button
              onClick={() => onNavigate('expiry')}
              className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 cursor-pointer"
            >
              <span>Manage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {expiringStock.slice(0, 4).map(item => {
              const days = daysDifference(item.expiry);
              const isUrgent = days <= 30;
              const isAdded = returnIds.has(item.id);

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50/80 border border-slate-200/80"
                >
                  <div className="min-w-0 pr-3">
                    <div className="font-semibold text-slate-900 text-xs truncate">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                      <span className="font-mono">B: {item.batch}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{item.qty} units</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className={`text-xs font-bold tabular-nums ${isUrgent ? 'text-rose-600' : 'text-amber-600'}`}>
                        {days} days
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {formatDate(item.expiry)}
                      </div>
                    </div>

                    <button
                      onClick={() => onAddToReturns(item)}
                      disabled={isAdded}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                        isAdded
                          ? 'bg-slate-200 text-slate-500 cursor-default'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {isAdded ? 'Claimed' : '+ Return'}
                    </button>
                  </div>
                </div>
              );
            })}
            {expiringStock.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-500">
                No items expiring within the next 60 days.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Second Row: WhatsApp Orders Queue & Operations Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Orders Queue (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Active Prescription Orders
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Incoming orders from WhatsApp and pharmacy counter
              </p>
            </div>
            <button
              onClick={() => onNavigate('orders')}
              className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 cursor-pointer"
            >
              <span>All orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {activeOrders.slice(0, 3).map(order => (
              <div
                key={order.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">
                        #{order.orderNumber}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="font-semibold text-slate-800 text-xs truncate">
                        {order.customerName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {order.itemsSummary}
                    </p>
                    <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-2">
                      <span className="tabular-nums">{order.time}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums font-semibold text-slate-700">
                        {order.amount ? formatCurrency(order.amount) : 'Quote Pending'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                        order.status === 'Ready for pickup'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'Review needed'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {order.status}
                    </span>

                    {order.prescriptionUrl && (
                      <button
                        onClick={() => onViewPrescription(order)}
                        className="flex items-center gap-1 text-[11px] text-teal-700 hover:text-teal-900 font-semibold cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View Rx</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {activeOrders.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-500">
                No active orders in the queue.
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Operations & Automindz Digital Labs Card (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl shadow-xs p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Pharmacy Operations Engine
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Engineered by Automindz Digital Labs
            </p>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="text-slate-600 font-medium">Automatic Refill Cron</span>
              <span className="font-semibold text-emerald-700">Active (9:00 AM Daily)</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="text-slate-600 font-medium">Prescription File Storage</span>
              <span className="font-semibold text-slate-800">Local &amp; Offline Resilient</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="text-slate-600 font-medium">Distributor Return Claims</span>
              <span className="font-semibold text-slate-800 tabular-nums">
                {returnIds.size} queued for wholesaler
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="text-slate-600 font-medium">WhatsApp Delivery Mode</span>
              <span className="font-semibold text-teal-800">1-Click Direct + Cloud API</span>
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <button
              onClick={() => onNavigate('history')}
              className="w-full flex items-center justify-center gap-2 p-2.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-teal-700" />
              <span>30-Day Order History &amp; Revenue Trends</span>
            </button>

            <button
              onClick={() => onNavigate('udhaar')}
              className="w-full flex items-center justify-center gap-2 p-2.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Package className="w-3.5 h-3.5 text-slate-600" />
              <span>Open Khata / Udhaar Book</span>
            </button>

            <button
              onClick={() => onNavigate('network')}
              className="w-full flex items-center justify-center gap-2 p-2.5 text-xs font-semibold text-purple-900 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors cursor-pointer border border-purple-200/60"
            >
              <Building2 className="w-3.5 h-3.5 text-purple-700" />
              <span>Pharmacy Network (SaaS Hub)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
