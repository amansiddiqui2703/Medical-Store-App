import React, { useState } from 'react';
import {
  History,
  TrendingUp,
  Download,
  Search,
  IndianRupee,
  Calendar,
  CheckCircle2,
  Eye,
  Send,
  FileText,
  BarChart3,
  Receipt,
  ArrowUpDown,
  Filter,
  Printer,
} from 'lucide-react';
import { Order, StoreSettings } from '../types';
import { formatCurrency, formatDate, daysDifference, buildWhatsAppUrl, exportToCSV } from '../utils/formatters';

interface OrderHistoryViewProps {
  orders: Order[];
  settings: StoreSettings;
  onViewPrescription: (order: Order) => void;
}

export const OrderHistoryView: React.FC<OrderHistoryViewProps> = ({
  orders,
  settings,
  onViewPrescription,
}) => {
  const [timeRange, setTimeRange] = useState<'7' | '14' | '30' | 'all'>('30');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);

  const orderActivityDate = (order: Order) => order.completedAt ? order.completedAt.slice(0, 10) : order.date;

  // Filter completed orders only
  const allCompletedOrders = orders.filter(o => o.status === 'Completed');

  // Filter by time range
  const filteredOrders = allCompletedOrders.filter(order => {
    const daysAgo = Math.abs(daysDifference(orderActivityDate(order)));

    let inRange = true;
    if (timeRange === '7') inRange = daysAgo <= 7;
    else if (timeRange === '14') inRange = daysAgo <= 14;
    else if (timeRange === '30') inRange = daysAgo <= 30;

    const matchesSearch =
      order.customerName.toLowerCase().includes(search.toLowerCase()) ||
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.phone.includes(search) ||
      order.itemsSummary.toLowerCase().includes(search.toLowerCase());

    return inRange && matchesSearch;
  });

  // Sort logic
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortBy === 'date_desc') return new Date(orderActivityDate(b)).getTime() - new Date(orderActivityDate(a)).getTime();
    if (sortBy === 'date_asc') return new Date(orderActivityDate(a)).getTime() - new Date(orderActivityDate(b)).getTime();
    if (sortBy === 'amount_desc') return b.amount - a.amount;
    if (sortBy === 'amount_asc') return a.amount - b.amount;
    return 0;
  });

  // Analytics Metrics calculations
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
  const totalOrdersCount = filteredOrders.length;
  const averageOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

  // Weekly/Trend Distribution calculation for past 30 days
  const weeklyBuckets = [
    { label: 'Week 1 (Recent)', minDays: 0, maxDays: 7, count: 0, revenue: 0 },
    { label: 'Week 2 (8-14d)', minDays: 8, maxDays: 14, count: 0, revenue: 0 },
    { label: 'Week 3 (15-21d)', minDays: 15, maxDays: 21, count: 0, revenue: 0 },
    { label: 'Week 4 (22-30d)', minDays: 22, maxDays: 30, count: 0, revenue: 0 },
  ];

  filteredOrders.forEach(o => {
    const daysAgo = Math.abs(daysDifference(orderActivityDate(o)));
    for (const bucket of weeklyBuckets) {
      if (daysAgo >= bucket.minDays && daysAgo <= bucket.maxDays) {
        bucket.count += 1;
        bucket.revenue += o.amount || 0;
        break;
      }
    }
  });

  const maxWeeklyRevenue = Math.max(...weeklyBuckets.map(b => b.revenue), 1);

  const handlePrintReceipt = () => {
    const receipt = document.getElementById('sale-receipt-content');
    if (!receipt) return;
    const printWindow = window.open('', '_blank', 'width=720,height=800');
    if (!printWindow) { window.alert('Please allow pop-ups to print the receipt.'); return; }
    printWindow.document.open();
    printWindow.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Sale receipt</title><style>body{font:13px Arial,sans-serif;color:#111;margin:24px}table{width:100%;border-collapse:collapse}th,td{padding:7px;border-bottom:1px solid #ddd;text-align:left}button{display:none}.text-right{text-align:right}.text-center{text-align:center}.text-amber-700{color:#92400e}</style></head><body>' + receipt.innerHTML + '</body></html>');
    printWindow.document.close();
    window.setTimeout(() => { printWindow.focus(); printWindow.print(); }, 250);
  };
  // Export CSV handler
  const handleExportCSV = () => {
    const headers = [
      'Order ID',
      'Patient Name',
      'WhatsApp Phone',
      'Fulfilled Medicines & Items',
      'Fulfillment Date',
      'Fulfillment Time',
      'Billed Amount (INR)',
      'Prescription Attached',
      'Verified by Pharmacist',
      'Notes',
    ];

    const rows = sortedOrders.map(o => [
      o.orderNumber,
      o.customerName,
      o.phone,
      o.itemsSummary,
      orderActivityDate(o),
      o.completedAt ? new Date(o.completedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : o.time,
      o.amount,
      o.prescriptionUrl ? 'YES' : 'NO',
      o.isVerified ? 'YES' : 'NO',
      o.notes || '',
    ]);

    exportToCSV(
      `order-history-30d-automindz.csv`,
      headers,
      rows,
      `${settings.storeName} — Completed Orders & Revenue History (Past ${timeRange === 'all' ? 'All' : timeRange + ' Days'})`
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Order History &amp; Revenue Analytics
            </h1>
            <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
              Past 30 Days
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track fulfilled prescriptions, average order values, and 30-day chronic care revenue trends.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={sortedOrders.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Revenue CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Revenue Strip (4 metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Total Revenue */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Completed Revenue</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across {totalOrdersCount} fulfilled orders
          </div>
        </div>

        {/* Metric 2: Completed Volume */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Fulfilled Prescriptions</span>
            <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {totalOrdersCount}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            100% fulfillment success rate
          </div>
        </div>

        {/* Metric 3: Average Order Value */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Average Order Value (AOV)</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {formatCurrency(averageOrderValue)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Per fulfilled customer cart
          </div>
        </div>

        {/* Metric 4: Top Therapy Driver */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Itemized Sale Receipts</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-700">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {filteredOrders.filter(order => (order.saleItems?.length || 0) > 0).length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Completed sales with saved batch details
          </div>
        </div>
      </div>

      {/* 30-Day Revenue Trend Breakdown Bars */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              30-Day Revenue Trend &amp; Weekly Velocity
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown of medicine sales collected over consecutive 7-day intervals
            </p>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Max Weekly Revenue: <span className="font-bold text-slate-800 tabular-nums">{formatCurrency(maxWeeklyRevenue)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          {weeklyBuckets.map((bucket, i) => {
            const percent = Math.round((bucket.revenue / maxWeeklyRevenue) * 100);
            return (
              <div
                key={i}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-2"
              >
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">{bucket.label}</span>
                  <span className="text-[11px] font-mono tabular-nums text-slate-500">{bucket.count} orders</span>
                </div>

                <div className="text-lg font-bold text-slate-900 tabular-nums">
                  {formatCurrency(bucket.revenue)}
                </div>

                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-teal-700 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="text-[10px] text-slate-400 text-right tabular-nums">
                  {percent}% of peak interval
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Tabs, Search & Sort Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
        {/* Time Period Filter */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setTimeRange('30')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              timeRange === '30' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Past 30 Days ({allCompletedOrders.filter(o => Math.abs(daysDifference(orderActivityDate(o))) <= 30).length})
          </button>
          <button
            onClick={() => setTimeRange('14')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              timeRange === '14' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Past 14 Days ({allCompletedOrders.filter(o => Math.abs(daysDifference(orderActivityDate(o))) <= 14).length})
          </button>
          <button
            onClick={() => setTimeRange('7')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              timeRange === '7' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Past 7 Days ({allCompletedOrders.filter(o => Math.abs(daysDifference(orderActivityDate(o))) <= 7).length})
          </button>
          <button
            onClick={() => setTimeRange('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              timeRange === 'all' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Time ({allCompletedOrders.length})
          </button>
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-56">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient, order #..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white cursor-pointer"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="amount_desc">Highest Amount</option>
              <option value="amount_asc">Lowest Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Completed Orders Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto touch-scroll">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Patient Details</th>
                <th className="py-3 px-4">Fulfilled Medications &amp; Care</th>
                <th className="py-3 px-4">Fulfillment Date</th>
                <th className="py-3 px-4">Prescription</th>
                <th className="py-3 px-4 text-right">Revenue (₹)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedOrders.map(order => {
                const daysAgo = Math.abs(daysDifference(orderActivityDate(order)));

                return (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-slate-900">
                      #{order.orderNumber}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{order.customerName}</div>
                      <div className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                        {order.phone}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="text-slate-800 font-medium line-clamp-2 leading-relaxed">
                        {order.itemsSummary}
                      </div>
                      {order.notes && (
                        <div className="text-[11px] text-slate-400 italic mt-0.5">
                          Note: {order.notes}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900 tabular-nums">
                        {formatDate(orderActivityDate(order))}
                      </div>
                      <div className="text-[10px] text-slate-400 tabular-nums">
                        {order.completedAt ? new Date(order.completedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : order.time} · {daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {order.prescriptionUrl ? (
                        <button
                          onClick={() => onViewPrescription(order)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-md border border-teal-200 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-teal-700" />
                          <span>View Rx</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Counter sale</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-slate-900 tabular-nums text-sm">
                      {formatCurrency(order.amount)}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedReceiptOrder(order)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                          title="View receipt"
                        >
                          <Receipt className="w-3 h-3 text-slate-600" />
                          <span>Receipt</span>
                        </button>

                        <a
                          href={buildWhatsAppUrl(
                            order.phone,
                            `Namaste ${order.customerName}, thank you for choosing ${settings.storeName}! Your order #${order.orderNumber} for ${formatCurrency(order.amount)} was fulfilled. Please reach out if you need medicine refills or assistance.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                          title="Send follow-up WhatsApp"
                        >
                          <Send className="w-3 h-3 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sortedOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-xs text-slate-500">
                    No completed orders found for the selected time range or search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Receipt Modal */}
      {selectedReceiptOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div id="sale-receipt-content" className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 p-6 space-y-4 text-xs">
            {/* Pharmacy Receipt Header */}
            <div className="text-center border-b border-slate-200 pb-4">
              <div className="font-bold text-base text-slate-900">
                {settings.storeName}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {settings.address}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Lic: {settings.licenseNumber || 'Not provided'} · Store owner: {settings.ownerName || 'Not provided'}
              </div>
            </div>

            {/* Receipt Details */}
            <div className="space-y-2 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Receipt No:</span>
                <span className="font-mono font-bold text-slate-900">#{selectedReceiptOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date &amp; Time:</span>
                <span className="font-mono">{selectedReceiptOrder.completedAt ? new Date(selectedReceiptOrder.completedAt).toLocaleString('en-IN') : `${formatDate(selectedReceiptOrder.date)} ${selectedReceiptOrder.time}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-semibold text-slate-900">{selectedReceiptOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">WhatsApp:</span>
                <span className="font-mono">{selectedReceiptOrder.phone}</span>
              </div>

              <div className="pt-2 border-t border-dashed border-slate-200">
                <div className="text-[11px] font-bold text-slate-900 mb-1">
                  Fulfilled Items:
                </div>
                {selectedReceiptOrder.saleItems?.length ? (
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-left text-[11px]">
                      <thead><tr className="bg-slate-50 text-slate-500"><th className="p-2">Medicine</th><th className="p-2">Batch</th><th className="p-2 text-right">Qty</th><th className="p-2 text-right">Price</th><th className="p-2 text-right">Total</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">{selectedReceiptOrder.saleItems.map((item, index) => <tr key={item.stockId + '-' + index}><td className="p-2">{item.name}</td><td className="p-2">{item.batch}</td><td className="p-2 text-right">{item.qty}</td><td className="p-2 text-right">{formatCurrency(item.unitPrice)}</td><td className="p-2 text-right font-semibold">{formatCurrency(item.lineTotal)}</td></tr>)}</tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-2.5 bg-slate-50 rounded-lg text-slate-800 leading-relaxed font-mono text-[11px]">{selectedReceiptOrder.itemsSummary}<p className="mt-2 text-amber-700 font-sans">This older order has no saved batch-wise item breakdown.</p></div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold">
                <span>Sale Total:</span>
                <span className="text-teal-900 tabular-nums">
                  {formatCurrency(selectedReceiptOrder.amount)}
                </span>
              </div>

              <div className="text-[10px] text-slate-400 text-center pt-2">
                Sale receipt only — not a GST/tax invoice. Verify applicable legal and tax requirements before issuing official invoices.
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={handlePrintReceipt}
                className="inline-flex items-center gap-2 px-4 py-2 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Print / Save PDF
              </button>
              <button
                onClick={() => setSelectedReceiptOrder(null)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
