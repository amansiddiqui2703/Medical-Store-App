import React from 'react';
import { Pill, Plus, RefreshCw, Settings, Sparkles, Building2, CreditCard, Menu } from 'lucide-react';
import { StoreSettings, MedicalStore, ActiveTab } from '../types';

interface HeaderProps {
  settings: StoreSettings;
  stores?: MedicalStore[];
  activeStoreId?: string;
  onSelectStore?: (storeId: string) => void;
  onOpenAddStore?: () => void;
  onNavigate?: (tab: ActiveTab) => void;
  onOpenMenu?: () => void;
  onNewOrder: () => void;
  onOpenSettings: () => void;
  onOpenBranding: () => void;
  onTriggerCron: () => void;
  isCronRunning: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  stores = [],
  activeStoreId,
  onSelectStore,
  onOpenAddStore,
  onNavigate,
  onOpenMenu,
  onNewOrder,
  onOpenSettings,
  onOpenBranding,
  onTriggerCron,
  isCronRunning,
}) => {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const activeStore = stores.find(s => s.id === activeStoreId);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-2 sm:gap-6 px-3 sm:px-6 py-2.5 sm:py-3.5 bg-white border-b border-slate-200 pt-safe">
      {/* Zone 1: Hamburger Menu (Mobile) + Wordmark & Store Switcher */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onOpenMenu && (
          <button
            type="button"
            onClick={onOpenMenu}
            className="md:hidden p-2 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0 -ml-1"
            aria-label="Open mobile navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-teal-800 text-white shadow-xs shrink-0">
          <Pill className="w-4 h-4 sm:w-5 sm:h-5 text-teal-200" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
              RefillDesk
            </span>
            <span className="hidden sm:inline text-xs text-slate-400 font-medium whitespace-nowrap">
              by Automindz Digital Labs
            </span>
          </div>

          <div className="flex items-center gap-1 mt-0.5">
            <div className="text-[11px] sm:text-xs text-slate-500 whitespace-nowrap truncate max-w-[140px] sm:max-w-[240px]">
              {activeStore?.name || settings.storeName}
            </div>
          </div>
        </div>
      </div>

      {/* Zone 2: Store Status & Today's Date (Desktop only) */}
      <div className="hidden lg:flex items-center gap-4 text-xs text-slate-600">
        <span className="tabular-nums font-medium text-slate-700">{currentDate}</span>
        <span aria-hidden="true" className="text-slate-300">·</span>
        <span className="text-slate-500">Manual reminder scan</span>
        <span aria-hidden="true" className="text-slate-300">·</span>
        <button
          onClick={onTriggerCron}
          disabled={isCronRunning}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-md transition-colors cursor-pointer"
          title="Prepare a local reminder scan; no messages are sent automatically"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isCronRunning ? 'animate-spin' : ''}`} />
          <span>{isCronRunning ? 'Scanning...' : 'Run Reminder Scan'}</span>
        </button>
      </div>

      {/* Zone 3: Actions & Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <button
          onClick={onOpenBranding}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>Automindz Labs</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="hidden sm:flex p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Store Settings"
          aria-label="Store Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        <button
          onClick={onNewOrder}
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 active:bg-teal-900 rounded-lg shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Order / Rx</span>
          <span className="sm:hidden font-bold">+ Rx</span>
        </button>
      </div>
    </header>
  );
};
