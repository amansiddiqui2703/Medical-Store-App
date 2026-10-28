import React from 'react';
import {
  X,
  LayoutDashboard,
  Clock,
  MessageSquare,
  History,
  Users,
  AlertTriangle,
  BookOpen,
  Send,
  Building2,
  CreditCard,
  Settings,
  Sparkles,
  RefreshCw,
  Pill,
  CheckCircle2,
} from 'lucide-react';
import { ActiveTab, MedicalStore } from '../types';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  stores: MedicalStore[];
  activeStoreId: string;
  onSelectStore: (storeId: string) => void;
  onOpenAddStore: () => void;
  onOpenSettings: () => void;
  onOpenBranding: () => void;
  onTriggerCron: () => void;
  isCronRunning: boolean;
  dueCount: number;
  ordersCount: number;
  completedCount: number;
  expiringCount: number;
  udhaarCount: number;
  storesCount: number;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  stores,
  activeStoreId,
  onSelectStore,
  onOpenAddStore,
  onOpenSettings,
  onOpenBranding,
  onTriggerCron,
  isCronRunning,
  dueCount,
  ordersCount,
  completedCount,
  expiringCount,
  udhaarCount,
  storesCount,
}) => {
  if (!isOpen) return null;

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badgeCount?: number }[] = [
    {
      id: 'dashboard',
      label: 'Store Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'network',
      label: 'Stores Network (Multi-Store)',
      icon: <Building2 className="w-4 h-4" />,
      badgeCount: storesCount,
    },
    {
      id: 'refill',
      label: 'Refill Due Reminders',
      icon: <Clock className="w-4 h-4" />,
      badgeCount: dueCount,
    },
    {
      id: 'orders',
      label: 'WhatsApp Orders & Rx',
      icon: <MessageSquare className="w-4 h-4" />,
      badgeCount: ordersCount,
    },
    {
      id: 'history',
      label: 'Completed Order History',
      icon: <History className="w-4 h-4" />,
      badgeCount: completedCount,
    },
    {
      id: 'customers',
      label: 'Customer Cards & Profiles',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'expiry',
      label: 'Expiry Alerts & Returns',
      icon: <AlertTriangle className="w-4 h-4" />,
      badgeCount: expiringCount,
    },
    {
      id: 'udhaar',
      label: 'Udhaar Credit Ledger',
      icon: <BookOpen className="w-4 h-4" />,
      badgeCount: udhaarCount,
    },
    {
      id: 'messages',
      label: 'WhatsApp Message Logs',
      icon: <Send className="w-4 h-4" />,
    },
    {
      id: 'subscription',
      label: 'Subscription & SaaS Licensing',
      icon: <CreditCard className="w-4 h-4" />,
    },
  ];

  const handleSelectNav = (tab: ActiveTab) => {
    onTabChange(tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      {/* Drawer content panel */}
      <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto pt-safe pb-safe z-10 animate-in slide-in-from-left duration-250">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-800 text-white flex items-center justify-center shadow-xs">
                <Pill className="w-4 h-4 text-teal-200" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 leading-tight">RefillDesk</h2>
                <p className="text-[10px] text-slate-400 font-medium">Automindz Digital Labs</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active Store Switcher inside Drawer */}
          <div className="p-3 bg-teal-50/60 border-b border-teal-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block mb-1">
              Active Medical Store
            </span>
            <select
              value={activeStoreId}
              onChange={e => {
                if (e.target.value === '__add_new__') {
                  onClose();
                  onOpenAddStore();
                } else {
                  onSelectStore(e.target.value);
                }
              }}
              className="w-full text-xs font-semibold text-teal-950 bg-white border border-teal-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              {stores.map(st => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.city})
                </option>
              ))}
              <option value="__add_new__">＋ Onboard New Medical Store...</option>
            </select>
          </div>

          {/* Nav Links */}
          <nav className="p-2 space-y-0.5">
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectNav(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer text-left ${
                    isActive
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
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

        {/* Bottom Drawer Actions */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/80 space-y-2">
          {/* 9 AM Cron Action */}
          <button
            onClick={() => {
              onClose();
              onTriggerCron();
            }}
            disabled={isCronRunning}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-teal-900 bg-teal-100/70 hover:bg-teal-100 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCronRunning ? 'animate-spin' : ''}`} />
            <span>{isCronRunning ? 'Running 9 AM Scan...' : 'Trigger 9 AM Auto Scan'}</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenBranding();
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Automindz</span>
            </button>
          </div>

          <div className="pt-2 text-center text-[10px] text-slate-400">
            RefillDesk by Automindz Digital Labs
          </div>
        </div>
      </div>
    </div>
  );
};
