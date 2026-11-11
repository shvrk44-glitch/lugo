import React, { useState } from 'react';
import { Account, Order, Invoice, Payment, StockMovement, Product, PnLEntry, UserRole } from '../types';
import { formatCurrency, generatePDFReport, exportToCSV } from '../utils/export';
import { ComponentStateMode } from '../App';
import { FileText, FileSpreadsheet, Download, AlertTriangle } from 'lucide-react';

interface ReportsViewProps {
  accounts: Account[];
  orders: Order[];
  invoices: Invoice[];
  payments: Payment[];
  products: Product[];
  pnlData: PnLEntry[];
  setPnLData: React.Dispatch<React.SetStateAction<PnLEntry[]>>;
  currentRole: UserRole;
  stateMode: ComponentStateMode;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  accounts,
  orders,
  invoices,
  payments,
  products,
  pnlData,
  setPnLData,
  currentRole,
  stateMode
}) => {
  const [newMonth, setNewMonth] = useState('March 2026 (MTD)');
  const [newRev, setNewRev] = useState<number>(31000000);
  const [newCogs, setNewCogs] = useState<number>(24000000);
  const [newOpex, setNewOpex] = useState<number>(1900000);

  // 1. Loading State
  if (stateMode === 'loading') {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-slate-200 h-20 rounded-xl w-full"></div>
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white h-48 rounded-xl border"></div>
          <div className="bg-white h-48 rounded-xl border"></div>
          <div className="bg-white h-48 rounded-xl border"></div>
        </div>
      </div>
    );
  }

  // 2. Error State
  if (stateMode === 'error') {
    return (
      <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-red-200 max-w-xl mx-auto my-12 space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-600 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Failed to Generate Reports</h3>
        <p className="text-xs text-slate-500">Error assembling monthly P&L and financial statements.</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg">Retry</button>
      </div>
    );
  }

  // 3. Empty State
  if (stateMode === 'empty' || pnlData.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200 max-w-xl mx-auto my-12 space-y-4">
        <FileText className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">No P&L Records Found</h3>
        <p className="text-xs text-slate-500">There are no monthly profit and loss entries recorded.</p>
      </div>
    );
  }

  const handleAddPnLEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const grossMargin = newRev - newCogs;
    const netProfit = grossMargin - newOpex;
    setPnLData([{ month: newMonth, revenue: newRev, costOfGoodsSold: newCogs, grossMargin, operatingExpenses: newOpex, netProfit }, ...pnlData]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Standard Reports & Monthly P&L
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Export professional PDF reports for management, bank conversations, and monthly profit & loss.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Weekly Sales & Margin Summary</h3>
            <p className="text-xs text-slate-500 mt-1">Complete itemized sales orders, product margins, and customer breakdown.</p>
          </div>
          <button
            onClick={() => generatePDFReport('Weekly Sales & Margin Summary', 'Kano Depot Sales Report', ['Order ID', 'Account', 'Date', 'Total', 'Status'], orders.map(o => [o.id, o.accountName, o.date, formatCurrency(o.totalAmount), o.status]))}
            className="mt-6 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow cursor-pointer flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF Report</span>
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Receivables Aging Report</h3>
            <p className="text-xs text-slate-500 mt-1">Aging buckets (0-30, 31-60, 61+ days) for credit exposure.</p>
          </div>
          <button
            onClick={() => generatePDFReport('Receivables Aging Report', 'Outstanding Customer Balances', ['Invoice ID', 'Account', 'Due Date', 'Total', 'Balance', 'Status'], invoices.map(i => [i.id, i.accountName, i.dueDate, formatCurrency(i.totalAmount), formatCurrency(i.totalAmount - i.paidAmount), i.status]))}
            className="mt-6 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs shadow cursor-pointer flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF Report</span>
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Depot Stock Position Report</h3>
            <p className="text-xs text-slate-500 mt-1">Current stock levels, pack sizes, reorder thresholds.</p>
          </div>
          <button
            onClick={() => generatePDFReport('Depot Stock Position Report', 'Kano Warehouse Inventory', ['Product', 'Pack Size', 'Category', 'Stock', 'Reorder'], products.map(p => [p.name, p.packSize, p.category, `${p.currentStock}`, `${p.reorderLevel}`]))}
            className="mt-6 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs shadow cursor-pointer flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF Report</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold text-slate-900">Monthly Business P&L</h3>
          <button onClick={() => exportToCSV('kano_mobil_pnl', pnlData)} className="px-3.5 py-2 bg-slate-100 rounded-lg text-xs font-bold cursor-pointer">Export P&L CSV</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b">
                <th className="p-3">Month</th>
                <th className="p-3">Revenue</th>
                <th className="p-3">COGS</th>
                <th className="p-3">Gross Margin</th>
                <th className="p-3">OpEx</th>
                <th className="p-3">Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs">
              {pnlData.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-3 font-bold">{p.month}</td>
                  <td className="p-3 font-black">{formatCurrency(p.revenue)}</td>
                  <td className="p-3 text-slate-600">{formatCurrency(p.costOfGoodsSold)}</td>
                  <td className="p-3 font-bold text-emerald-600">{formatCurrency(p.grossMargin)}</td>
                  <td className="p-3 text-slate-600">{formatCurrency(p.operatingExpenses)}</td>
                  <td className="p-3 font-black text-blue-600">{formatCurrency(p.netProfit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
