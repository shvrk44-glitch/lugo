import React from 'react';
import { UserRole, Alert } from '../types';
import { Shield, Bell, Wifi, WifiOff, Users, ShoppingCart, Truck, CreditCard, Box, BarChart3, FileText, Database } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;
  alerts: Alert[];
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  currentRole,
  setCurrentRole,
  isOffline,
  setIsOffline,
  alerts
}) => {
  const roles: UserRole[] = ['CEO', 'Sales Lead', 'Depot / Dispatch', 'Finance / Cashier', 'Viewer'];

  const navItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'accounts', label: 'Accounts', icon: Users },
    { id: 'orders', label: 'Orders & Invoices', icon: ShoppingCart },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'stock', label: 'Stock & Batches', icon: Box },
    { id: 'deliveries', label: 'Deliveries', icon: Truck },
    { id: 'alerts', label: `Alerts (${alerts.length})`, icon: Bell },
    { id: 'reports', label: 'Reports & P&L', icon: FileText }
  ];

  return (
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 sm:h-16 gap-3">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white font-black tracking-wider flex items-center justify-center shadow-md">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-2">
                Kano Operations
                <span className="text-[10px] bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded-full border border-blue-700/50">
                  Enterprise
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">Depot Distribution System</p>
            </div>
          </div>

          {/* Role Switcher & Offline Mode */}
          <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-4">
            <button
              onClick={() => setIsOffline(!isOffline)}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                isOffline 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
              title="Click to simulate online/offline sync status"
            >
              {isOffline ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
              <span className="truncate">{isOffline ? 'Offline' : 'Synced'}</span>
            </button>

            <div className="flex items-center space-x-1.5 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <select
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value as UserRole)}
                className="bg-slate-900 text-white text-[11px] font-semibold rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 border border-slate-700 cursor-pointer"
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role} {role === 'CEO' ? '(Al-Amin)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto py-2 border-t border-slate-800 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.id === 'alerts' && alerts.length > 0 && (
                  <span className="ml-1 bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                    {alerts.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
