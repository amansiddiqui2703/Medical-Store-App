import React, { useState } from 'react';
import {
  Clock,
  Search,
  Send,
  Plus,
  RefreshCw,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Edit2,
  MessageSquare,
} from 'lucide-react';
import { Customer, StoreSettings } from '../types';
import { formatCurrency, formatDate, daysDifference, buildWhatsAppUrl } from '../utils/formatters';

interface RefillDueViewProps {
  customers: Customer[];
  settings: StoreSettings;
  onOpenCustomerModal: (customer?: Customer) => void;
  onTriggerCron: () => void;
  isCronRunning: boolean;
  onSendBulkReminders: (targetCustomers: Customer[]) => void;
}

export const RefillDueView: React.FC<RefillDueViewProps> = ({
  customers,
  settings,
  onOpenCustomerModal,
  onTriggerCron,
  isCronRunning,
  onSendBulkReminders,
}) => {
  const [filter, setFilter] = useState<'all' | 'today' | '3days' | 'week' | 'overdue'>('week');
  const [search, setSearch] = useState('');

  // Filter logic
  const filteredCustomers = customers.filter(c => {
    const days = daysDifference(c.refillDate);
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.meds.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'today') return days === 0;
    if (filter === '3days') return days >= 0 && days <= 3;
    if (filter === 'week') return days >= 0 && days <= 7;
    if (filter === 'overdue') return days < 0;
    return true;
  });

  const dueTodayCount = customers.filter(c => daysDifference(c.refillDate) === 0).length;
  const due3DaysCount = customers.filter(c => {
    const d = daysDifference(c.refillDate);
    return d >= 0 && d <= 3;
  }).length;
  const overdueCount = customers.filter(c => daysDifference(c.refillDate) < 0).length;
  const dueWeekCount = customers.filter(c => {
    const d = daysDifference(c.refillDate);
    return d >= 0 && d <= 7;
  }).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Refill Due Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Reach out to patients with chronic conditions before their medicine runs out.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onTriggerCron}
            disabled={isCronRunning}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCronRunning ? 'animate-spin' : ''}`} />
            <span>Simulate 9 AM Scan</span>
          </button>

          <button
            onClick={() => onSendBulkReminders(filteredCustomers)}
            disabled={filteredCustomers.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Remind Filtered ({filteredCustomers.length})</span>
          </button>
        </div>
      </div>

      {/* Notice Card for Cron Setup */}
      <div className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-xl text-xs text-teal-900 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-1.5 bg-teal-100 rounded-lg text-teal-800 shrink-0 mt-0.5">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-teal-950">
              Automated 9:00 AM WhatsApp Dispatch by Automindz Digital Labs
            </div>
            <p className="text-teal-800 text-[11px] mt-0.5 leading-relaxed">
              Every morning at 09:00 AM (Asia/Kolkata), RefillDesk scans all registered chronic patients. Patients whose refill is exactly {settings.reminderDaysBefore} days away receive an automated polite WhatsApp check-in with pre-filled dosage details.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
        {/* Segmented Filter Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setFilter('week')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              filter === 'week' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Due This Week ({dueWeekCount})
          </button>
          <button
            onClick={() => setFilter('3days')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              filter === '3days' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Next 3 Days ({due3DaysCount})
          </button>
          <button
            onClick={() => setFilter('today')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              filter === 'today' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Due Today ({dueTodayCount})
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              filter === 'overdue' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overdue ({overdueCount})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              filter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Patients ({customers.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient, medicine..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
          />
        </div>
      </div>

      {/* Mobile Card List (Phones) */}
      <div className="md:hidden space-y-3">
        {filteredCustomers.map(customer => {
          const days = daysDifference(customer.refillDate);
          const isToday = days === 0;
          const isOverdue = days < 0;

          const defaultMsg = settings.reminderTemplate
            .replace('{name}', customer.name)
            .replace('{store}', settings.storeName)
            .replace('{meds}', customer.meds)
            .replace('{refill_date}', formatDate(customer.refillDate));

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
                  {customer.doctorName && (
                    <div className="text-[11px] text-slate-400 mt-0.5">Dr. {customer.doctorName}</div>
                  )}
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                    isToday
                      ? 'bg-amber-100 text-amber-900'
                      : isOverdue
                      ? 'bg-rose-100 text-rose-900'
                      : days <= 3
                      ? 'bg-teal-100 text-teal-900'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {isToday ? 'Due Today' : isOverdue ? `${Math.abs(days)}d Overdue` : `In ${days} days`}
                </span>
              </div>

              <div className="bg-slate-50 rounded-lg p-2.5 text-xs text-slate-700 border border-slate-100">
                <span className="font-semibold text-slate-900 block">{customer.meds}</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  {customer.dosageNotes || `${customer.cycleDays}-day regular cycle`}
                </span>
                <div className="flex items-center justify-between text-[11px] pt-2 mt-2 border-t border-slate-200/60">
                  <span className="text-slate-500">Scheduled: <strong className="text-slate-800">{formatDate(customer.refillDate)}</strong></span>
                  <span className="tabular-nums font-medium text-slate-900">Last: {formatCurrency(customer.lastBill)}</span>
                </div>
                {customer.credit > 0 && (
                  <div className="text-[11px] text-rose-700 font-bold mt-1">
                    Pending Udhaar: {formatCurrency(customer.credit)}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <a
                  href={buildWhatsAppUrl(customer.phone, defaultMsg)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 h-10 px-4 text-xs font-semibold text-white bg-emerald-600 active:bg-emerald-700 rounded-lg shadow-2xs transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send WhatsApp</span>
                </a>
                <button
                  onClick={() => onOpenCustomerModal(customer)}
                  className="h-10 px-3.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  title="Edit patient"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredCustomers.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500">
            No patients match this filter.
          </div>
        )}
      </div>

      {/* Desktop / Tablet Table */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto touch-scroll">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Prescription &amp; Dosage</th>
                <th className="py-3 px-4">Refill Date</th>
                <th className="py-3 px-4">Last Bill</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map(customer => {
                const days = daysDifference(customer.refillDate);
                const isToday = days === 0;
                const isOverdue = days < 0;

                const defaultMsg = settings.reminderTemplate
                  .replace('{name}', customer.name)
                  .replace('{store}', settings.storeName)
                  .replace('{meds}', customer.meds)
                  .replace('{refill_date}', formatDate(customer.refillDate));

                return (
                  <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{customer.name}</div>
                      <div className="text-[11px] text-slate-500 tabular-nums font-mono mt-0.5">
                        {customer.phone}
                      </div>
                      {customer.doctorName && (
                        <div className="text-[10px] text-slate-400">Dr. {customer.doctorName}</div>
                      )}
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-medium text-slate-800 truncate">{customer.meds}</div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {customer.dosageNotes || `${customer.cycleDays}-day cycle`}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900">{formatDate(customer.refillDate)}</div>
                      <div
                        className={`text-[11px] font-semibold mt-0.5 ${
                          isToday
                            ? 'text-amber-600'
                            : isOverdue
                            ? 'text-rose-600'
                            : days <= 3
                            ? 'text-teal-600'
                            : 'text-slate-500'
                        }`}
                      >
                        {isToday ? 'Due Today' : isOverdue ? `${Math.abs(days)}d Overdue` : `In ${days} days`}
                      </div>
                    </td>

                    <td className="py-3 px-4 tabular-nums">
                      <div className="font-medium text-slate-900">
                        {formatCurrency(customer.lastBill)}
                      </div>
                      {customer.credit > 0 && (
                        <div className="text-[10px] text-rose-600 font-medium">
                          Udhaar: {formatCurrency(customer.credit)}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onOpenCustomerModal(customer)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="Edit patient details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <a
                          href={buildWhatsAppUrl(customer.phone, defaultMsg)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                        >
                          <Send className="w-3 h-3 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-slate-500">
                    No customers found matching this filter or search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
