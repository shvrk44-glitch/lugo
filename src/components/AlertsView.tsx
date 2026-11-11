import React, { useState } from 'react';
import { Alert, UserRole } from '../types';
import { ComponentStateMode } from '../App';
import { Bell, ShieldAlert, CheckCircle2, MessageSquare, AlertTriangle } from 'lucide-react';

interface AlertsViewProps {
  alerts: Alert[];
  currentRole: UserRole;
  stateMode: ComponentStateMode;
}

export const AlertsView: React.FC<AlertsViewProps> = ({ alerts, currentRole, stateMode }) => {
  const [copied, setCopied] = useState(false);

  // 1. Loading State
  if (stateMode === 'loading') {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-slate-200 h-20 rounded-xl w-full"></div>
        <div className="bg-white h-64 rounded-xl border border-slate-200"></div>
      </div>
    );
  }

  // 2. Error State
  if (stateMode === 'error') {
    return (
      <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-red-200 max-w-xl mx-auto my-12 space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-600 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Failed to Load System Alerts</h3>
        <p className="text-xs text-slate-500">Error checking credit limit breaches and inventory thresholds.</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg">Retry</button>
      </div>
    );
  }

  // 3. Empty State
  if (stateMode === 'empty' || alerts.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200 max-w-xl mx-auto my-12 space-y-4">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">All Clear! No Active Alerts</h3>
        <p className="text-xs text-slate-500">All accounts are within credit limits, no invoices are overdue, and stock levels are healthy.</p>
      </div>
    );
  }

  const generateFridaySummary = () => {
    let summary = `*KANO MOBIL DISTRIBUTION - FRIDAY EXECUTIVE BRIEFING*\n`;
    summary += `Date: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}\n\n`;
    summary += `*Active Alerts (${alerts.length}):*\n`;
    alerts.forEach((a, idx) => {
      summary += `${idx + 1}. [${a.severity.toUpperCase()}] ${a.title}: ${a.message}\n`;
    });
    return summary;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-600" />
            System Alerts & Friday Summary ({alerts.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Automated flags for credit limits, overdue invoices (&gt;30 days), quiet accounts, and low stock.</p>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(generateFridaySummary());
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow cursor-pointer"
        >
          <MessageSquare className="w-4 h-4" />
          <span>{copied ? 'Copied Friday Summary!' : 'Copy WhatsApp / Email Summary'}</span>
        </button>
      </div>

      <div className="space-y-4">
        {alerts.map(alert => (
          <div key={alert.id} className="p-5 rounded-xl border bg-amber-50/70 border-amber-200 text-amber-900 flex items-start space-x-3">
            <div className="p-2.5 rounded-lg bg-amber-500 text-slate-950">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase">{alert.severity} priority</div>
              <h3 className="text-sm font-bold mt-1">{alert.title}</h3>
              <p className="text-xs mt-0.5">{alert.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
