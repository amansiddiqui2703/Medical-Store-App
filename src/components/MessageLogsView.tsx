import React, { useState } from 'react';
import {
  Send,
  Search,
  CheckCircle2,
  Clock,
  MessageSquare,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { MessageLog, StoreSettings } from '../types';
import { buildWhatsAppUrl, cleanPhone } from '../utils/formatters';

interface MessageLogsViewProps {
  logs: MessageLog[];
  settings: StoreSettings;
  onSendDirect: (phone: string, name: string, message: string) => void;
}

export const MessageLogsView: React.FC<MessageLogsViewProps> = ({
  logs,
  settings,
  onSendDirect,
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Custom message composer states
  const [directPhone, setDirectPhone] = useState('');
  const [directName, setDirectName] = useState('');
  const [directMessage, setDirectMessage] = useState('');
  const [showComposer, setShowComposer] = useState(false);

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.name.toLowerCase().includes(search.toLowerCase()) ||
      log.phone.includes(search) ||
      log.message.toLowerCase().includes(search.toLowerCase());

    const matchesType = filterType === 'all' || log.triggerType === filterType;
    return matchesSearch && matchesType;
  });

  const handleSendDirectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directPhone || !directMessage) return;

    onSendDirect(directPhone, directName || 'Customer', directMessage);
    // Open WhatsApp URL for real sending
    window.open(buildWhatsAppUrl(directPhone, directMessage), '_blank', 'noopener,noreferrer');

    setDirectPhone('');
    setDirectName('');
    setDirectMessage('');
    setShowComposer(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            WhatsApp Communications Log
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Audit trail of all automated refill notices, prescription quotes, and manual patient messages.
          </p>
        </div>

        <button
          onClick={() => setShowComposer(!showComposer)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>{showComposer ? 'Close Composer' : 'Compose Message'}</span>
        </button>
      </div>

      {/* Composer Drawer (if toggled) */}
      {showComposer && (
        <form
          onSubmit={handleSendDirectSubmit}
          className="p-5 bg-white border border-teal-200 rounded-xl shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Direct WhatsApp Dispatch
            </h3>
            <span className="text-[11px] text-teal-700 font-semibold">
              Opens wa.me &amp; records log entry
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Recipient Patient Name
              </label>
              <input
                type="text"
                value={directName}
                onChange={e => setDirectName(e.target.value)}
                placeholder="e.g. Ramesh Patel"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                WhatsApp Phone Number *
              </label>
              <input
                type="tel"
                required
                value={directPhone}
                onChange={e => setDirectPhone(e.target.value)}
                placeholder="e.g. 919876543210"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Message Content *
            </label>
            <textarea
              required
              rows={3}
              value={directMessage}
              onChange={e => setDirectMessage(e.target.value)}
              placeholder="Type message or paste prescription summary..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowComposer(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send via WhatsApp</span>
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              filterType === 'all' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Logs ({logs.length})
          </button>
          <button
            onClick={() => setFilterType('refill_reminder')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              filterType === 'refill_reminder' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Refill Reminders
          </button>
          <button
            onClick={() => setFilterType('order_update')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              filterType === 'order_update' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Order Updates
          </button>
          <button
            onClick={() => setFilterType('custom')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              filterType === 'custom' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Direct / Custom
          </button>
        </div>

        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Message Preview</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map(log => {
                const date = new Date(log.createdAt);
                const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                const dateStr = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

                return (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px] tabular-nums">
                      <div>{timeStr}</div>
                      <div className="text-[10px] text-slate-400">{dateStr}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{log.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {log.phone}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-[11px] font-medium text-slate-700 capitalize">
                        {log.triggerType.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4 max-w-md">
                      <div className="text-slate-700 line-clamp-2 leading-relaxed">
                        {log.message}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          log.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-teal-50 text-teal-800'
                        }`}
                      >
                        {log.status === 'delivered' ? 'Sent (API)' : 'Simulated (wa.me)'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <a
                        href={buildWhatsAppUrl(log.phone, log.message)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900"
                        title="Re-open in WhatsApp"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                );
              })}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                    No logs match this search criteria.
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
