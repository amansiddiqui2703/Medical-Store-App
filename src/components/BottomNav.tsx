import React from 'react';
import {
  LayoutDashboard,
  Clock,
  MessageSquare,
  BookOpen,
  Menu,
} from 'lucide-react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenMenu: () => void;
  dueCount: number;
  ordersCount: number;
  udhaarCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenMenu,
  dueCount,
  ordersCount,
  udhaarCount,
}) => {
  const isMoreActive = [
    'network',
    'history',
    'customers',
    'expiry',
    'messages',
    'subscription',
  ].includes(activeTab);

  const mainTabs: {
    id: ActiveTab;
    label: string;
    icon: React.ReactNode;
    badgeCount?: number;
  }[] = [
    {
      id: 'dashboard',
      label: 'Overview',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'refill',
      label: 'Refill Due',
      icon: <Clock className="w-5 h-5" />,
      badgeCount: dueCount,
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: <MessageSquare className="w-5 h-5" />,
      badgeCount: ordersCount,
    },
    {
      id: 'udhaar',
      label: 'Udhaar',
      icon: <BookOpen className="w-5 h-5" />,
      badgeCount: udhaarCount,
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg pb-safe select-none"
    >
      <div className="grid grid-cols-5 h-14">
        {mainTabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
                isActive
                  ? 'text-teal-800 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                {tab.icon}
                {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-teal-700 text-white text-[9px] font-bold flex items-center justify-center tabular-nums leading-none shadow-xs">
                    {tab.badgeCount > 99 ? '99+' : tab.badgeCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight leading-none">
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-teal-700 rounded-full" />
              )}
            </button>
          );
        })}

        {/* More / Full Menu Button */}
        <button
          onClick={onOpenMenu}
          className={`relative flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
            isMoreActive
              ? 'text-teal-800 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight leading-none">More</span>
          {isMoreActive && (
            <span className="absolute bottom-0 w-8 h-0.5 bg-teal-700 rounded-full" />
          )}
        </button>
      </div>
    </nav>
  );
};
