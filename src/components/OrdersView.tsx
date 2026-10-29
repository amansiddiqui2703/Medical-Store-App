import React, { useState } from 'react';
import {
  Plus,
  Search,
  Send,
  Eye,
  FileText,
  CheckCircle2,
  Clock,
  Trash2,
  Edit3,
  History,
} from 'lucide-react';
import { Order, OrderStatus, StoreSettings, StockItem, SaleLineItem } from '../types';
import { formatCurrency, buildWhatsAppUrl } from '../utils/formatters';

interface OrdersViewProps {
  orders: Order[];
  stock: StockItem[];
  settings: StoreSettings;
  onCompleteSale: (orderId: number, items: SaleLineItem[]) => boolean;
  onOpenNewOrder: () => void;
  onViewPrescription: (order: Order) => void;
  onUpdateStatus: (orderId: number, newStatus: OrderStatus) => void;
  onUpdateAmount: (orderId: number, amount: number) => void;
  onDeleteOrder: (orderId: number) => void;
  onNavigateToHistory?: () => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  stock,
  settings,
  onCompleteSale,
  onOpenNewOrder,
  onViewPrescription,
  onUpdateStatus,
  onUpdateAmount,
  onDeleteOrder,
  onNavigateToHistory,
}) => {
  const [filter, setFilter] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [billingOrder, setBillingOrder] = useState<Order | null>(null);
  const [billRows, setBillRows] = useState<Array<{ stockId: number; qty: number }>>([]);
  const [billError, setBillError] = useState('');
  const today = new Date().toISOString().slice(0, 10);
  const sellableStock = stock.filter(item => item.qty > 0 && item.expiry >= today);
  const openBilling = (order: Order) => {
    setBillingOrder(order);
    setBillRows([{ stockId: sellableStock[0]?.id || 0, qty: 1 }]);
    setBillError('');
  };
  const submitBill = () => {
    if (!billingOrder || billRows.length === 0) return;
    const lines: SaleLineItem[] = [];
    for (const row of billRows) {
      const item = sellableStock.find(s => s.id === row.stockId);
      if (!item || !Number.isInteger(row.qty) || row.qty < 1 || row.qty > item.qty) {
        setBillError('Choose a valid unexpired batch and quantity within available stock.');
        return;
      }
      lines.push({ stockId: item.id, name: item.name, batch: item.batch, qty: row.qty, unitPrice: item.mrp, lineTotal: Math.round(item.mrp * row.qty * 100) / 100 });
    }
    const quantities = new Map<number, number>();
    for (const line of lines) quantities.set(line.stockId, (quantities.get(line.stockId) || 0) + line.qty);
    for (const [stockId, qty] of quantities) {
      const item = sellableStock.find(s => s.id === stockId);
      if (!item || qty > item.qty) { setBillError('Combined quantities exceed available stock for a selected batch.'); return; }
    }
    const completed = onCompleteSale(billingOrder.id, lines);
    if (!completed) return;
    setBillingOrder(null);
    setBillRows([]);
    setBillError('');
  };

  const statuses: OrderStatus[] = ['Review needed', 'Quoted', 'Ready for pickup', 'Completed', 'Cancelled'];

  const filteredOrders = orders.filter(o => {
    const matchesFilter = filter === 'All' || o.status === filter;
    const matchesSearch =
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.phone.includes(search) ||
      o.itemsSummary.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadgeStyle = (status: OrderStatus) => {
    switch (status) {
      case 'Review needed':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Quoted':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Ready for pickup':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Completed':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getWhatsAppMessageForOrder = (order: Order) => {
    if (order.status === 'Ready for pickup') {
      return settings.readyTemplate
        .replace('{name}', order.customerName)
        .replace('{order_id}', order.orderNumber)
        .replace('{store}', settings.storeName)
        .replace('{amount}', formatCurrency(order.amount));
    }
    if (order.status === 'Quoted') {
      return `Namaste ${order.customerName}, your prescription quote for Order #${order.orderNumber} is ${formatCurrency(order.amount)}. Would you like us to confirm and pack these medicines?`;
    }
    return `Namaste ${order.customerName}, we received your prescription order #${order.orderNumber} at ${settings.storeName}. Our pharmacist is currently verifying the dosages.`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            WhatsApp Prescription Orders
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Fulfill doctor prescriptions, issue price quotes, and notify patients when packed.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onNavigateToHistory && (
            <button
              onClick={onNavigateToHistory}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-slate-600" />
              <span>30-Day History</span>
            </button>
          )}

          <button
            onClick={onOpenNewOrder}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Order / Rx</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 rounded-lg">
          {['All', ...statuses].map(st => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                filter === st ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st} {st !== 'All' ? `(${orders.filter(o => o.status === st).length})` : `(${orders.length})`}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search order #, patient..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
          />
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredOrders.map(order => (
          <div
            key={order.id}
            className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
          >
            <div>
              {/* Card Top: Order Number & Status */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm font-mono">
                      #{order.orderNumber}
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="font-semibold text-slate-900 text-sm">
                      {order.customerName}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {order.phone} · Received {order.time}
                  </div>
                </div>

                {/* Status Dropdown */}
                <select
                  value={order.status}
                  onChange={e => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer ${getStatusBadgeStyle(
                    order.status
                  )}`}
                >
                  {statuses.map(st => (
                    <option key={st} value={st} disabled={st === 'Completed'}>
                      {st === 'Completed' ? 'Completed (billing not ready)' : st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Order Items Description */}
              <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-700 leading-relaxed">
                {order.itemsSummary}
              </div>

              {/* Prescription Attachment Preview */}
              {order.prescriptionUrl && (
                <div className="mt-3 flex items-center justify-between p-2.5 bg-teal-50/60 border border-teal-100 rounded-lg text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-teal-700 shrink-0" />
                    <span className="text-teal-900 font-medium truncate">
                      {order.prescriptionFileName || 'Doctor_Prescription.pdf'}
                    </span>
                  </div>
                  <button
                    onClick={() => onViewPrescription(order)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-800 bg-white border border-teal-200 hover:bg-teal-50 rounded-md transition-colors cursor-pointer shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View / Zoom</span>
                  </button>
                </div>
              )}
            </div>

            {/* Card Bottom: Bill Amount & WhatsApp Notification */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-medium">Bill:</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={order.amount || ''}
                  placeholder="₹0"
                  onChange={e => onUpdateAmount(order.id, Number(e.target.value))}
                  disabled={order.status === 'Completed'}
                  className="w-24 px-2 py-1 text-xs font-bold tabular-nums text-slate-900 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex items-center gap-2">
                {order.status !== 'Completed' && order.status !== 'Cancelled' && (
                  <button type="button" onClick={() => openBilling(order)} disabled={sellableStock.length === 0}
                    className="px-2.5 py-1.5 text-[11px] font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-md">
                    Create Bill
                  </button>
                )}
                <button
                  onClick={() => onDeleteOrder(order.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                  title="Remove order"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <a
                  href={buildWhatsAppUrl(order.phone, getWhatsAppMessageForOrder(order))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                >
                  <Send className="w-3 h-3 text-emerald-600" />
                  <span>Update Patient</span>
                </a>
              </div>
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="col-span-full py-16 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
            No orders found matching "{filter}". Click "+ New Order / Rx" to register one.
          </div>
        )}
      </div>

      {billingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/70">
          <div role="dialog" aria-modal="true" aria-label="Create medicine bill" className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900">Create Bill · #{billingOrder.orderNumber}</h2>
            <p className="mt-1 text-xs text-slate-500">Customer: {billingOrder.customerName}. Select the exact batch sold; quantities are deducted when confirmed.</p>
            {billRows.map((row, index) => {
              const selected = sellableStock.find(s => s.id === row.stockId);
              return (
                <div key={index} className="mt-4 grid grid-cols-1 sm:grid-cols-[1fr_90px_auto] gap-2 items-end">
                  <label className="text-xs font-semibold text-slate-700">Medicine / Batch
                    <select value={row.stockId || ''} onChange={e => setBillRows(prev => prev.map((r, i) => i === index ? { ...r, stockId: Number(e.target.value) } : r))} className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs">
                      <option value="">Select stock batch</option>
                      {sellableStock.map(item => <option key={item.id} value={item.id}>{item.name}{item.strength ? ' ' + item.strength : ''}{' · Batch ' + item.batch + ' · ' + item.qty + ' available · MRP ₹' + item.mrp.toFixed(2)}</option>)}
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-slate-700">Quantity
                    <input type="number" min="1" max={selected?.qty || 1} step="1" value={row.qty} onChange={e => setBillRows(prev => prev.map((r, i) => i === index ? { ...r, qty: Number(e.target.value) } : r))} className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-xs" />
                  </label>
                  <button type="button" onClick={() => setBillRows(prev => prev.filter((_, i) => i !== index))} disabled={billRows.length === 1} className="rounded-lg border border-slate-300 px-3 py-2 text-xs disabled:opacity-40">Remove</button>
                  {selected && <p className="sm:col-span-3 text-[11px] text-slate-500">Line total: ₹{(selected.mrp * row.qty).toFixed(2)} · Expiry: {selected.expiry}</p>}
                </div>
              );
            })}
            <button type="button" onClick={() => setBillRows(prev => [...prev, { stockId: sellableStock[0]?.id || 0, qty: 1 }])} disabled={sellableStock.length === 0} className="mt-3 rounded-lg border border-teal-700 px-3 py-2 text-xs font-semibold text-teal-800">+ Add medicine</button>
            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm font-bold flex justify-between"><span>Total (MRP)</span><span>₹{billRows.reduce((sum, row) => sum + (sellableStock.find(s => s.id === row.stockId)?.mrp || 0) * (Number.isFinite(row.qty) ? row.qty : 0), 0).toFixed(2)}</span></div>
            {billError && <p role="alert" className="mt-3 text-xs text-rose-700">{billError}</p>}
            <p className="mt-2 text-[11px] text-amber-700">Confirm only after checking the prescription and exact medicines. Uses listed MRP; GST invoice compliance and discounts are not calculated here.</p>
            <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setBillingOrder(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold">Cancel</button><button type="button" onClick={submitBill} className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white">Confirm Bill &amp; Deduct Stock</button></div>
          </div>
        </div>
      )}
    </div>
  );
};
