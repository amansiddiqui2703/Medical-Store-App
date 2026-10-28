import React from 'react';
import {
  LayoutDashboard,
  Clock,
  MessageSquare,
  History,
  Users,
  AlertTriangle,
  BookOpen,
  Send,
  Building2,
  CheckCircle2,
  CreditCard,
} from 'lucide-react';
import { ActiveTab } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  dueCount: number;
  ordersCount: number;
  completedCount?: number;
  expiringCount: number;
  udhaarCount: number;
  storesCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  dueCount,
  ordersCount,
  completedCount = 0,
  expiringCount,
  udhaarCount,
  storesCount = 0,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badgeCount?: number }[] = [
    {
      id: 'dashboard',
      label: 'Store Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'network',
      label: 'Stores Network',
      icon: <Building2 className="w-4 h-4" />,
      badgeCount: storesCount,
    },
    {
      id: 'refill',
      label: 'Refill Due',
      icon: <Clock className="w-4 h-4" />,
      badgeCount: dueCount,
    },
    {
      id: 'orders',
      label: 'WhatsApp Orders',
      icon: <MessageSquare className="w-4 h-4" />,
      badgeCount: ordersCount,
    },
    {
      id: 'history',
      label: 'Order History',
      icon: <History className="w-4 h-4" />,
      badgeCount: completedCount,
    },
    {
      id: 'customers',
      label: 'Customer Cards',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'expiry',
      label: 'Expiry Alerts',
      icon: <AlertTriangle className="w-4 h-4" />,
      badgeCount: expiringCount,
    },
    {
      id: 'udhaar',
      label: 'Udhaar Ledger',
      icon: <BookOpen className="w-4 h-4" />,
      badgeCount: udhaarCount,
    },
    {
      id: 'messages',
      label: 'WhatsApp Logs',
      icon: <Send className="w-4 h-4" />,
    },
    {
      id: 'subscription',
      label: 'Subscription & Plans',
      icon: <CreditCard className="w-4 h-4" />,
    },
  ];

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col justify-between p-4 bg-slate-50/80 border-r border-slate-200 min-h-[calc(100vh-57px)]">
      <div>
        <div className="px-3 pb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          Pharmacy Desk
        </div>
        <nav className="space-y-1">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-teal-200' : 'text-slate-500'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badgeCount !== undefined && item.badgeCount > 0 && (
                  <span
                    className={`tabular-nums text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-teal-800 text-teal-100'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Automindz Digital Labs Attribution & Guidance */}
      <div className="pt-4 border-t border-slate-200/80 space-y-3">
        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
            <span>Automated 9 AM Scan</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Checks all chronic patients due in 3 days. Ready for click-to-chat or Meta Cloud API.
          </p>
        </div>

        <div className="px-3 py-2 rounded-lg bg-teal-50/70 border border-teal-100/80 text-[11px] text-teal-900">
          <div className="flex items-center gap-1.5 font-bold mb-0.5">
            <Building2 className="w-3 h-3 text-teal-700" />
            <span>Automindz Digital Labs</span>
          </div>
          <p className="text-[10px] text-teal-700">
            Medical store operating system · Production Edition
          </p>
        </div>
      </div>
    </aside>
  );
};
