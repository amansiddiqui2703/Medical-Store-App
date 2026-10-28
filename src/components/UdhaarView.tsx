import React, { useState } from 'react';
import {
  BookOpen,
  IndianRupee,
  Search,
  Send,
  PlusCircle,
  CheckCircle2,
  Calendar,
  Download,
} from 'lucide-react';
import { Customer, CreditTransaction, StoreSettings } from '../types';
import { formatCurrency, formatDate, buildWhatsAppUrl, exportToCSV } from '../utils/formatters';

interface UdhaarViewProps {
  customers: Customer[];
  transactions: CreditTransaction[];
  settings: StoreSettings;
  onOpenSettleModal: (customer: Customer) => void;
  onOpenAddCreditModal: (customer: Customer) => void;
}

export const UdhaarView: React.FC<UdhaarViewProps> = ({
  customers,
  transactions,
  settings,
  onOpenSettleModal,
  onOpenAddCreditModal,
}) => {
  const [search, setSearch] = useState('');
  const [viewTab, setViewTab] = useState<'balances' | 'history'>('balances');

  const customersWithCredit = customers.filter(c => (c.credit || 0) > 0);
  const totalOutstanding = customersWithCredit.reduce((sum, c) => sum + c.credit, 0);

  const filteredBalances = customersWithCredit.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  const handleExportLedgerCSV = () => {
    const headers = ['Patient Name', 'WhatsApp Phone', 'Outstanding Udhaar (INR)', 'Last Visit', 'Prescription Meds'];
    const rows = customersWithCredit.map(c => [
      c.name,
      c.phone,
      c.credit,
      formatDate(c.lastVisit || ''),
      c.meds,
    ]);

    exportToCSV(
      'udhaar-ledger-automindz.csv',
      headers,
      rows,
      `${settings.storeName} — Active Udhaar / Credit Ledger`
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Udhaar &amp; Khata Book
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track patient credit ledgers, record settlement receipts, and send polite WhatsApp payment reminders.
          </p>
        </div>

        <button
          onClick={handleExportLedgerCSV}
          disabled={customersWithCredit.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Khata CSV</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Total Outstanding Udhaar</div>
          <div className="mt-2 text-2xl font-bold text-rose-600 tabular-nums">
            {formatCurrency(totalOutstanding)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Pending recovery</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Patients with Credit</div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            {customersWithCredit.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Active ledger accounts</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Recorded Ledger Entries</div>
          <div className="mt-2 text-2xl font-bold text-teal-800 tabular-nums">
            {transactions.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Payments &amp; debits</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setViewTab('balances')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              viewTab === 'balances' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active Balances ({customersWithCredit.length})
          </button>
          <button
            onClick={() => setViewTab('history')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              viewTab === 'history' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Transaction History ({transactions.length})
          </button>
        </div>

        {viewTab === 'balances' && (
          <div className="relative min-w-[220px]">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search debtor name, phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
            />
          </div>
        )}
      </div>

      {/* Content depending on tab */}
      {/* Content depending on tab */}
      {viewTab === 'balances' ? (
        <>
          {/* Mobile Cards (Phones) */}
          <div className="md:hidden space-y-3">
            {filteredBalances.map(customer => {
              const reminderMsg = `Namaste ${customer.name}, gentle reminder from ${settings.storeName}. Your medicine ledger has an outstanding balance of ${formatCurrency(customer.credit)}. Kindly settle at your next store visit or via UPI. Thank you!`;

              return (
                <div
                  key={customer.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{customer.name}</h3>
                      <div className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                        {customer.phone}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Outstanding
                      </span>
                      <span className="text-base font-extrabold text-rose-700 tabular-nums">
                        {formatCurrency(customer.credit)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-2.5 text-xs text-slate-700 border border-slate-100">
                    <span className="text-slate-500 text-[11px] block">Regular Medicines:</span>
                    <span className="font-medium text-slate-900 block mt-0.5">{customer.meds}</span>
                    <span className="text-[11px] text-slate-400 block mt-1">
                      Last visit: {formatDate(customer.lastVisit || '')}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      onClick={() => onOpenSettleModal(customer)}
                      className="py-2 px-2 text-xs font-semibold text-white bg-teal-700 active:bg-teal-800 rounded-lg shadow-2xs transition-colors cursor-pointer text-center"
                    >
                      Settle
                    </button>
                    <button
                      onClick={() => onOpenAddCreditModal(customer)}
                      className="py-2 px-2 text-xs font-semibold text-slate-700 bg-slate-100 active:bg-slate-200 rounded-lg transition-colors cursor-pointer text-center"
                    >
                      + Bill
                    </button>
                    <a
                      href={buildWhatsAppUrl(customer.phone, reminderMsg)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 py-2 px-2 text-xs font-semibold text-emerald-800 bg-emerald-50 active:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors text-center"
                    >
                      <Send className="w-3 h-3 text-emerald-600" />
                      <span>Remind</span>
                    </a>
                  </div>
                </div>
              );
            })}

            {filteredBalances.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500">
                No outstanding credit balances found. All accounts are clean!
              </div>
            )}
          </div>

          {/* Desktop / Tablet Table */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto touch-scroll">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Patient Name</th>
                    <th className="py-3 px-4">WhatsApp Contact</th>
                    <th className="py-3 px-4">Regular Medicines</th>
                    <th className="py-3 px-4">Outstanding Udhaar</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBalances.map(customer => {
                    const reminderMsg = `Namaste ${customer.name}, gentle reminder from ${settings.storeName}. Your medicine ledger has an outstanding balance of ${formatCurrency(customer.credit)}. Kindly settle at your next store visit or via UPI. Thank you!`;

                    return (
                      <tr key={customer.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{customer.name}</div>
                          <div className="text-[11px] text-slate-400">
                            Last visit: {formatDate(customer.lastVisit || '')}
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                          {customer.phone}
                        </td>

                        <td className="py-3 px-4 max-w-xs text-slate-700 truncate">
                          {customer.meds}
                        </td>

                        <td className="py-3 px-4 font-bold text-rose-600 tabular-nums">
                          {formatCurrency(customer.credit)}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onOpenAddCreditModal(customer)}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                            >
                              + Add Bill
                            </button>

                            <button
                              onClick={() => onOpenSettleModal(customer)}
                              className="px-2.5 py-1 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-md transition-colors cursor-pointer"
                            >
                              Settle Payment
                            </button>

                            <a
                              href={buildWhatsAppUrl(customer.phone, reminderMsg)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                            >
                              <Send className="w-3 h-3 text-emerald-600" />
                              <span>Remind</span>
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredBalances.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-xs text-slate-500">
                        No outstanding credit balances found. All accounts are clean!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* History Tab */
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Note / Reason</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4 text-right">Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 tabular-nums">
                      {formatDate(t.date)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {t.customerName}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          t.type === 'payment'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {t.type === 'payment' ? 'Payment Received' : 'Udhaar Added'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-sm truncate">
                      {t.note || '—'}
                    </td>
                    <td
                      className={`py-3 px-4 font-bold tabular-nums ${
                        t.type === 'payment' ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {t.type === 'payment' ? '-' : '+'}
                      {formatCurrency(t.amount)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-900 tabular-nums">
                      {formatCurrency(t.balanceAfter)}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                      No transactions recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
