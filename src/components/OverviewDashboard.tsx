import React, { useState } from 'react';
import { Account, Order, Invoice, Payment, StockMovement, Product, Alert } from '../types';
import { formatCurrency } from '../utils/export';
import { ComponentStateMode } from '../App';
import { 
  TrendingUp, DollarSign, CreditCard, Users, Box, AlertTriangle, 
  ArrowUpRight, ShieldAlert, Clock, CheckCircle2, ChevronRight, BarChart2, RefreshCw 
} from 'lucide-react';

interface OverviewDashboardProps {
  accounts: Account[];
  orders: Order[];
  invoices: Invoice[];
  payments: Payment[];
  products: Product[];
  alerts: Alert[];
  setCurrentTab: (tab: string) => void;
  stateMode: ComponentStateMode;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  accounts,
  orders,
  invoices,
  payments,
  products,
  alerts,
  setCurrentTab,
  stateMode
}) => {
  // 1. Loading State (Skeleton matching real layout)
  if (stateMode === 'loading') {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-slate-200 h-40 rounded-2xl w-full"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white p-5 rounded-xl h-28 border border-slate-200"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white h-72 rounded-xl lg:col-span-2 border border-slate-200"></div>
          <div className="bg-white h-72 rounded-xl border border-slate-200"></div>
        </div>
      </div>
    );
  }

  // 2. Error State
  if (stateMode === 'error') {
    return (
      <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-red-200 max-w-xl mx-auto my-12 space-y-4">
        <div className="p-3 bg-red-50 text-red-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Failed to Load Kano Depot Overview Data</h3>
        <p className="text-xs text-slate-500">
          Network timeout while fetching live receivables and stock metrics from Kano server. Please verify connection.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow transition-colors inline-flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  // 3. Empty State
  if (stateMode === 'empty' || orders.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200 max-w-xl mx-auto my-12 space-y-4">
        <div className="p-3 bg-slate-100 text-slate-500 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
          <BarChart2 className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">No Operations Data Recorded Yet</h3>
        <p className="text-xs text-slate-500">
          There are no orders or invoices recorded in the current period. Start by adding customer accounts or recording sales.
        </p>
        <button
          onClick={() => setCurrentTab('orders')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow transition-colors cursor-pointer"
        >
          Go to Orders & Invoices
        </button>
      </div>
    );
  }

  // 4. Populated State (Calculations & Metrics)
  const totalSales = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  let totalGrossMarginNGN = 0;
  orders
    .filter(o => o.status !== 'Cancelled')
    .forEach(o => {
      o.lines.forEach(l => {
        const lineMargin = (l.unitPrice - l.landedCost) * l.quantity;
        totalGrossMarginNGN += lineMargin;
      });
    });

  const grossMarginPct = totalSales > 0 ? (totalGrossMarginNGN / totalSales) * 100 : 0;
  const cashCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  let aging0_30 = 0;
  let aging31_60 = 0;
  let aging61Plus = 0;
  let totalReceivables = 0;

  invoices.forEach(inv => {
    const balance = inv.totalAmount - inv.paidAmount;
    if (balance > 0) {
      totalReceivables += balance;
      if (inv.daysOverdue <= 30) {
        aging0_30 += balance;
      } else if (inv.daysOverdue <= 60) {
        aging31_60 += balance;
      } else {
        aging61Plus += balance;
      }
    }
  });

  const totalApprovedLimits = accounts
    .filter(a => a.paymentType === 'Credit' && a.status === 'Active')
    .reduce((sum, a) => sum + a.creditLimit, 0);

  const creditExposureRatio = totalApprovedLimits > 0 ? (totalReceivables / totalApprovedLimits) * 100 : 0;

  const litresByProduct: Record<string, number> = {};
  orders
    .filter(o => o.status !== 'Cancelled')
    .forEach(o => {
      o.lines.forEach(l => {
        const prod = products.find(p => p.id === l.productId);
        const litres = prod ? prod.litresPerUnit * l.quantity : 0;
        litresByProduct[l.productName] = (litresByProduct[l.productName] || 0) + litres;
      });
    });

  const activeAccountsCount = accounts.filter(a => {
    const hasOrder = orders.some(o => o.accountId === a.id && o.status !== 'Cancelled');
    return hasOrder && a.status === 'Active';
  }).length;

  const quietAccounts = accounts.filter(a => {
    const accountOrders = orders.filter(o => o.accountId === a.id && o.status !== 'Cancelled');
    if (accountOrders.length === 0) return true;
    const latestOrderDate = new Date(Math.max(...accountOrders.map(o => new Date(o.date).getTime())));
    const daysSince = (new Date().getTime() - latestOrderDate.getTime()) / (1000 * 3600 * 24);
    return daysSince > 30;
  });

  const dailySales30 = totalSales > 0 ? totalSales / 30 : 1;
  const dso = Math.round(totalReceivables / dailySales30);

  const accountsWithOrders = accounts.filter(a => orders.some(o => o.accountId === a.id));
  const repeatAccounts = accounts.filter(a => orders.filter(o => o.accountId === a.id).length >= 2);
  const repeatRate = accountsWithOrders.length > 0 ? (repeatAccounts.length / accountsWithOrders.length) * 100 : 0;

  const totalUnitsInStock = products.reduce((sum, p) => sum + p.currentStock, 0);
  const totalUnitsOrdered = orders.reduce((sum, o) => sum + o.lines.reduce((lSum, l) => lSum + l.quantity, 0), 0);
  const dailyUnitsDispatch = Math.max(1, totalUnitsOrdered / 30);
  const blendedStockCover = (totalUnitsInStock / dailyUnitsDispatch).toFixed(1);

  const keyMetrics = [
    {
      title: 'Gross Margin per Litre',
      value: formatCurrency(totalGrossMarginNGN / (Object.values(litresByProduct).reduce((a,b)=>a+b, 0) || 1)),
      subtext: 'Blended across all products',
      why: 'Shows whether the business is actually making money on each product',
      tab: 'reports'
    },
    {
      title: 'Receivable Days (DSO)',
      value: `${dso} Days`,
      subtext: 'Average collection period',
      why: 'Early warning for cash trouble & slow payers',
      tab: 'payments'
    },
    {
      title: 'Active Accounts',
      value: `${activeAccountsCount} Accounts`,
      subtext: 'Ordered in last 30 days',
      why: 'Shows whether the distribution network is alive and active',
      tab: 'accounts'
    },
    {
      title: 'Network Repeat Rate',
      value: `${repeatRate.toFixed(1)}%`,
      subtext: 'Share of accounts with repeat orders',
      why: 'Shows customer loyalty and real value of the network',
      tab: 'accounts'
    },
    {
      title: 'Stock Cover',
      value: `${blendedStockCover} Days`,
      subtext: 'Average inventory buffer at depot',
      why: 'Prevents stockouts on top lubricants and dead stock',
      tab: 'stock'
    },
    {
      title: 'Credit Exposure Ratio',
      value: `${creditExposureRatio.toFixed(1)}%`,
      subtext: `Total Outstanding / ${formatCurrency(totalApprovedLimits)} limits`,
      why: 'Shows how much financial risk the business is carrying',
      tab: 'accounts'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 rounded-2xl p-6 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Kano Central Depot Monitor
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Operations Overview
            </h2>
            <p className="text-slate-300 text-sm mt-1">
              Single record of accounts, orders, stock, credit limits, and cash collections for Kano depot.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="bg-slate-800/80 backdrop-blur border border-slate-700 px-4 py-2.5 rounded-xl text-right">
              <div className="text-xs text-slate-400">Total Sales (NGN)</div>
              <div className="text-lg sm:text-xl font-bold text-emerald-400">{formatCurrency(totalSales)}</div>
            </div>
            <button
              onClick={() => setCurrentTab('reports')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-3 rounded-xl text-xs sm:text-sm shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
            >
              <span>Export P&L & Reports</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Alerts Ticker */}
      {alerts.length > 0 && (
        <div 
          onClick={() => setCurrentTab('alerts')}
          className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-amber-500/20 transition-all"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-amber-900">
                {alerts.length} Operational Alert{alerts.length > 1 ? 's' : ''} Require Attention
              </div>
              <div className="text-xs text-slate-600">
                {alerts[0].title}: {alerts[0].message}
              </div>
            </div>
          </div>
          <div className="text-xs text-amber-700 font-semibold flex items-center gap-1">
            <span>View all</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Core Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => setCurrentTab('orders')}
          className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Sales</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{formatCurrency(totalSales)}</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">+{orders.length} orders recorded</div>
        </div>

        <div 
          onClick={() => setCurrentTab('reports')}
          className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Margin</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{formatCurrency(totalGrossMarginNGN)}</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">{grossMarginPct.toFixed(1)}% margin average</div>
        </div>

        <div 
          onClick={() => setCurrentTab('payments')}
          className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Cash Collected</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{formatCurrency(cashCollected)}</div>
          <div className="text-xs text-blue-600 font-medium mt-1">{payments.length} verified payments</div>
        </div>

        <div 
          onClick={() => setCurrentTab('payments')}
          className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Receivables</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{formatCurrency(totalReceivables)}</div>
          <div className="text-xs text-amber-600 font-medium mt-1">Exposure: {creditExposureRatio.toFixed(1)}%</div>
        </div>
      </div>

      {/* Aging & Quiet Accounts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Outstanding Receivables Aging Buckets</h3>
              <p className="text-xs text-slate-500">Tracking overdue exposure by aging periods</p>
            </div>
            <button
              onClick={() => setCurrentTab('payments')}
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>View invoices</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-xs font-bold text-slate-500 uppercase">0 - 30 Days (Current)</div>
              <div className="text-xl font-black text-slate-900 mt-1">{formatCurrency(aging0_30)}</div>
            </div>
            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200">
              <div className="text-xs font-bold text-amber-700 uppercase">31 - 60 Days</div>
              <div className="text-xl font-black text-amber-900 mt-1">{formatCurrency(aging31_60)}</div>
            </div>
            <div className="bg-red-50/50 p-4 rounded-xl border border-red-200">
              <div className="text-xs font-bold text-red-700 uppercase">61+ Days (Critical)</div>
              <div className="text-xl font-black text-red-900 mt-1">{formatCurrency(aging61Plus)}</div>
            </div>
          </div>

          <h4 className="text-sm font-bold text-slate-800 mb-3">Litres Sold by Product Line</h4>
          <div className="space-y-2.5">
            {Object.entries(litresByProduct).map(([prodName, litres]) => {
              const maxLitres = Math.max(...Object.values(litresByProduct), 1);
              const pct = (litres / maxLitres) * 100;
              return (
                <div key={prodName} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-700">
                    <span>{prodName}</span>
                    <span className="font-bold">{litres.toLocaleString()} Litres</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${Math.max(pct, 5)}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Quiet Accounts</h3>
              <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-0.5 rounded-full">
                {quietAccounts.length} flagged
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">No orders in 30+ days requiring sales reactivation.</p>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {quietAccounts.map(acc => (
                <div 
                  key={acc.id}
                  onClick={() => setCurrentTab('accounts')}
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="text-xs font-bold text-slate-900">{acc.name}</div>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">{acc.area}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Table */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-base font-bold text-slate-900 mb-4">Key Dashboard Metrics</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                <th className="p-3">Metric</th>
                <th className="p-3">Current Value</th>
                <th className="p-3">Definition</th>
                <th className="p-3">Why It Matters</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {keyMetrics.map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80">
                  <td className="p-3 font-bold text-slate-900">{m.title}</td>
                  <td className="p-3 font-black text-blue-600">{m.value}</td>
                  <td className="p-3 text-slate-600">{m.subtext}</td>
                  <td className="p-3 text-slate-500 italic">{m.why}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setCurrentTab(m.tab)}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
