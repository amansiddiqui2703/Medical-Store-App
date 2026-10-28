import React, { useState } from 'react';
import {
  Plus,
  Search,
  Download,
  Send,
  Edit2,
  Trash2,
  Phone,
  Calendar,
  AlertCircle,
  CreditCard,
} from 'lucide-react';
import { Customer, StoreSettings } from '../types';
import { formatCurrency, formatDate, daysDifference, buildWhatsAppUrl, exportToCSV } from '../utils/formatters';

interface CustomersViewProps {
  customers: Customer[];
  settings: StoreSettings;
  onOpenCustomerModal: (customer?: Customer) => void;
  onDeleteCustomer: (id: number) => void;
  onOpenUdhaarSettle: (customer: Customer) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  settings,
  onOpenCustomerModal,
  onDeleteCustomer,
  onOpenUdhaarSettle,
}) => {
  const [search, setSearch] = useState('');

  const filteredCustomers = customers.filter(c => {
    return (
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.meds.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleExportCSV = () => {
    const headers = [
      'Customer ID',
      'Patient Name',
      'WhatsApp Phone',
      'Regular Medicines',
      'Dosage Instructions',
      'Refill Due Date',
      'Cycle Days',
      'Last Bill (INR)',
      'Outstanding Udhaar (INR)',
      'Doctor Name',
    ];

    const rows = customers.map(c => [
      c.id,
      c.name,
      c.phone,
      c.meds,
      c.dosageNotes || '',
      c.refillDate,
      c.cycleDays,
      c.lastBill,
      c.credit,
      c.doctorName || '',
    ]);

    exportToCSV('customers-automindz.csv', headers, rows, `${settings.storeName} — Chronic Patient Master`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Customer Cards
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Registered chronic care patients, medicine dosage history, and credit ledger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => onOpenCustomerModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Patient Card</span>
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient name, WhatsApp phone number, or medication..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
          />
        </div>
        <div className="text-xs text-slate-500 tabular-nums whitespace-nowrap">
          {filteredCustomers.length} registered patients
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                {/* Header: Name, Initials, Phone */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                      {customer.name
                        .split(' ')
                        .map(n => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">
                        {customer.name}
                      </h3>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {customer.phone}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenCustomerModal(customer)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                      title="Edit patient"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteCustomer(customer.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                      title="Delete patient"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Chronic Medicines */}
                <div className="mt-3.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Prescribed Medicines
                  </div>
                  <div className="text-xs font-semibold text-slate-800 mt-1 line-clamp-2">
                    {customer.meds}
                  </div>
                  {customer.dosageNotes && (
                    <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                      {customer.dosageNotes}
                    </div>
                  )}
                </div>

                {/* Refill Status Strip */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px]">Next Refill:</span>{' '}
                    <span className="font-semibold text-slate-800">{formatDate(customer.refillDate)}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      isToday
                        ? 'bg-amber-100 text-amber-800'
                        : isOverdue
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-teal-50 text-teal-800'
                    }`}
                  >
                    {isToday ? 'Today' : isOverdue ? `${Math.abs(days)}d Overdue` : `In ${days}d`}
                  </span>
                </div>

                {/* Udhaar (Credit) ledger tag */}
                <div className="mt-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px]">Udhaar Balance:</span>{' '}
                    <span
                      className={`font-bold tabular-nums ${
                        customer.credit > 0 ? 'text-rose-600' : 'text-slate-700'
                      }`}
                    >
                      {formatCurrency(customer.credit)}
                    </span>
                  </div>

                  {customer.credit > 0 && (
                    <button
                      onClick={() => onOpenUdhaarSettle(customer)}
                      className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 cursor-pointer"
                    >
                      Settle →
                    </button>
                  )}
                </div>
              </div>

              {/* Card Footer: WhatsApp Direct Action */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">
                  Last Bill: <span className="tabular-nums font-medium text-slate-700">{formatCurrency(customer.lastBill)}</span>
                </span>

                <a
                  href={buildWhatsAppUrl(customer.phone, defaultMsg)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                >
                  <Send className="w-3 h-3 text-emerald-600" />
                  <span>Chat / Remind</span>
                </a>
              </div>
            </div>
          );
        })}

        {filteredCustomers.length === 0 && (
          <div className="col-span-full py-16 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
            No customers found. Click "+ Add Patient Card" to add one.
          </div>
        )}
      </div>
    </div>
  );
};
