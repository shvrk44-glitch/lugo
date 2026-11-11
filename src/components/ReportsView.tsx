import React, { useState } from 'react';
import { Account, Order, Invoice, Payment, StockMovement, Product, PnLEntry, UserRole } from '../types';
import { formatCurrency, generatePDFReport, exportToCSV } from '../utils/export';
import { ComponentStateMode } from '../App';
import { 
  FileText, FileSpreadsheet, Download, AlertTriangle, Plus, 
  MessageSquare, Check, DollarSign, TrendingUp, Users, Box, Clock
} from 'lucide-react';

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
  const [copiedReport, setCopiedReport] = useState<string | null>(null);
  const [isAddPnLModalOpen, setIsAddPnLModalOpen] = useState(false);

  // Form states for manual P&L entry
  const [pnlMonth, setPnlMonth] = useState('April 2026 (Projected)');
  const [pnlRevenue, setPnlRevenue] = useState<number>(35000000);
  const [pnlCOGS, setPnlCOGS] = useState<number>(27000000);
  const [pnlOpEx, setPnlOpEx] = useState<number>(2100000);

  // 1. Loading State
  if (stateMode === 'loading') {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-slate-200 h-20 rounded-xl w-full"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white h-48 rounded-xl border border-slate-200"></div>
          ))}
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
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg cursor-pointer">
          Retry
        </button>
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

  const handleAddPnL = (e: React.FormEvent) => {
    e.preventDefault();
    const grossMargin = pnlRevenue - pnlCOGS;
    const netProfit = grossMargin - pnlOpEx;

    const newEntry: PnLEntry = {
      month: pnlMonth,
      revenue: pnlRevenue,
      costOfGoodsSold: pnlCOGS,
      grossMargin,
      operatingExpenses: pnlOpEx,
      netProfit
    };

    setPnLData([newEntry, ...pnlData]);
    setIsAddPnLModalOpen(false);
  };

  const copyWhatsAppText = (reportId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedReport(reportId);
    setTimeout(() => setCopiedReport(null), 3000);
  };

  // Generate Report 1: Weekly Sales and Margin
  const downloadSalesMarginPDF = () => {
    const headers = ['Order ID', 'Customer Account', 'Date', 'Sales (NGN)', 'Status'];
    const rows = orders.map(o => [
      o.id,
      o.accountName,
      o.date,
      formatCurrency(o.totalAmount),
      o.status
    ]);
    const totalSales = orders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + o.totalAmount, 0);
    generatePDFReport(
      'Weekly Sales and Margin Summary',
      'Kano Central Depot Operations Report',
      headers,
      rows,
      `Total Confirmed Sales: ${formatCurrency(totalSales)} | Verified Records: ${orders.length} orders.`
    );
  };

  const getSalesMarginWhatsApp = () => {
    const totalSales = orders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + o.totalAmount, 0);
    return `*KANO MOBIL - WEEKLY SALES & MARGIN REPORT*\nDate: ${new Date().toLocaleDateString('en-GB')}\nTotal Sales: ${formatCurrency(totalSales)}\nOrders Count: ${orders.length}\nTop Customer: ${orders[0]?.accountName || 'N/A'}`;
  };

  // Generate Report 2: Receivables Aging
  const downloadReceivablesAgingPDF = () => {
    const headers = ['Invoice ID', 'Customer', 'Due Date', 'Total NGN', 'Balance NGN', 'Days Overdue', 'Status'];
    const rows = invoices.map(i => [
      i.id,
      i.accountName,
      i.dueDate,
      formatCurrency(i.totalAmount),
      formatCurrency(i.totalAmount - i.paidAmount),
      `${i.daysOverdue}d`,
      i.status
    ]);
    const totalBalance = invoices.reduce((sum, i) => sum + (i.totalAmount - i.paidAmount), 0);
    generatePDFReport(
      'Receivables Aging Report',
      'Customer Outstanding Balances & Days Overdue',
      headers,
      rows,
      `Total Outstanding Receivables: ${formatCurrency(totalBalance)} | Active Invoices: ${invoices.length}`
    );
  };

  const getReceivablesWhatsApp = () => {
    const totalBalance = invoices.reduce((sum, i) => sum + (i.totalAmount - i.paidAmount), 0);
    const critical60Plus = invoices.filter(i => i.daysOverdue > 60).reduce((sum, i) => sum + (i.totalAmount - i.paidAmount), 0);
    return `*KANO MOBIL - RECEIVABLES AGING SUMMARY*\nTotal Outstanding: ${formatCurrency(totalBalance)}\nCritical (>60d): ${formatCurrency(critical60Plus)}\nInvoices: ${invoices.length}`;
  };

  // Generate Report 3: Stock Position
  const downloadStockPositionPDF = () => {
    const headers = ['Product Name', 'Pack Size', 'Category', 'List Price', 'Current Stock', 'Reorder Level'];
    const rows = products.map(p => [
      p.name,
      p.packSize,
      p.category,
      formatCurrency(p.listPrice),
      `${p.currentStock} units`,
      `${p.reorderLevel} units`
    ]);
    generatePDFReport(
      'Depot Stock Position Report',
      'Kano Lubricant Warehouse Physical Inventory',
      headers,
      rows,
      `Tracked Products: ${products.length} line items | Mobil Quality Guaranteed`
    );
  };

  const getStockPositionWhatsApp = () => {
    const lowStock = products.filter(p => p.currentStock <= p.reorderLevel);
    return `*KANO MOBIL - DEPOT STOCK POSITION*\nTotal Product SKUs: ${products.length}\nLow Stock Warnings: ${lowStock.length}\nImmediate Reorder Needed: ${lowStock.map(p => p.name).join(', ') || 'None'}`;
  };

  // Generate Report 4: Customer Account Activity
  const downloadAccountActivityPDF = () => {
    const headers = ['Account Name', 'Kano Area', 'Segment', 'Payment Type', 'Credit Limit', 'Status'];
    const rows = accounts.map(a => [
      a.name,
      a.area,
      a.segment,
      a.paymentType,
      a.paymentType === 'Credit' ? formatCurrency(a.creditLimit) : 'Cash',
      a.status
    ]);
    generatePDFReport(
      'Customer Account Activity Report',
      'Network of Fleets, Workshops, and Resellers in Kano',
      headers,
      rows,
      `Total Distribution Accounts: ${accounts.length}`
    );
  };

  // Generate Report 5: Monthly P&L Statement
  const downloadMonthlyPnLPDF = () => {
    const headers = ['Period Month', 'Revenue (NGN)', 'Cost of Goods (COGS)', 'Gross Margin', 'OpEx', 'Net Profit'];
    const rows = pnlData.map(p => [
      p.month,
      formatCurrency(p.revenue),
      formatCurrency(p.costOfGoodsSold),
      formatCurrency(p.grossMargin),
      formatCurrency(p.operatingExpenses),
      formatCurrency(p.netProfit)
    ]);
    generatePDFReport(
      'Monthly Profit & Loss Statement',
      'Kano Mobil Distribution Financial Performance',
      headers,
      rows,
      `Executive Statement for Management & Partner/Bank Conversations`
    );
  };

  const canEditPnL = currentRole === 'CEO';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Standard Reports & Monthly Business P&L
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Export professional PDF reports for management, supplier reviews, and bank or partner conversations with WhatsApp summaries.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => exportToCSV('kano_mobil_monthly_pnl', pnlData)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export P&L CSV</span>
          </button>
          {canEditPnL && (
            <button
              onClick={() => setIsAddPnLModalOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add P&L Month</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Standard Report Cards (PRD Section 5.8) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg w-fit mb-3">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Weekly Sales & Margin</h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Itemized sales orders, customer breakdown, and product margin calculation.
            </p>
          </div>
          <div className="mt-4 space-y-2">
            <button
              onClick={downloadSalesMarginPDF}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={() => copyWhatsAppText('sales', getSalesMarginWhatsApp())}
              className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[11px] flex items-center justify-center gap-1 cursor-pointer"
            >
              {copiedReport === 'sales' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <MessageSquare className="w-3.5 h-3.5" />}
              <span>{copiedReport === 'sales' ? 'Copied WhatsApp' : 'WhatsApp Text'}</span>
            </button>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg w-fit mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Receivables Aging</h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Aging buckets (0-30, 31-60, 61+ days) to manage credit exposure and overdue collection.
            </p>
          </div>
          <div className="mt-4 space-y-2">
            <button
              onClick={downloadReceivablesAgingPDF}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs shadow cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={() => copyWhatsAppText('receivables', getReceivablesWhatsApp())}
              className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[11px] flex items-center justify-center gap-1 cursor-pointer"
            >
              {copiedReport === 'receivables' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <MessageSquare className="w-3.5 h-3.5" />}
              <span>{copiedReport === 'receivables' ? 'Copied WhatsApp' : 'WhatsApp Text'}</span>
            </button>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg w-fit mb-3">
              <Box className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Depot Stock Position</h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Warehouse inventory, pack sizes, reorder thresholds, and days of cover.
            </p>
          </div>
          <div className="mt-4 space-y-2">
            <button
              onClick={downloadStockPositionPDF}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs shadow cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={() => copyWhatsAppText('stock', getStockPositionWhatsApp())}
              className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[11px] flex items-center justify-center gap-1 cursor-pointer"
            >
              {copiedReport === 'stock' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <MessageSquare className="w-3.5 h-3.5" />}
              <span>{copiedReport === 'stock' ? 'Copied WhatsApp' : 'WhatsApp Text'}</span>
            </button>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg w-fit mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Account Activity</h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Active customer directory, credit limits, order frequency, and territory list.
            </p>
          </div>
          <div className="mt-4 space-y-2">
            <button
              onClick={downloadAccountActivityPDF}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs shadow cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={() => exportToCSV('kano_mobil_accounts_report', accounts)}
              className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[11px] flex items-center justify-center gap-1 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Business P&L Table (Revenue, COGS, Gross Margin, OpEx, Net Profit) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Monthly Profit & Loss (P&L) Statement
            </h3>
            <p className="text-xs text-slate-500">
              Revenue, cost of goods, gross margin, and operating expenses entered manually.
            </p>
          </div>
          <button
            onClick={downloadMonthlyPnLPDF}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download P&L Statement PDF</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                <th className="p-3">Period Month</th>
                <th className="p-3">Revenue (NGN)</th>
                <th className="p-3">Cost of Goods (COGS)</th>
                <th className="p-3">Gross Margin (NGN)</th>
                <th className="p-3">Operating Expenses</th>
                <th className="p-3">Net Profit</th>
                <th className="p-3">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {pnlData.map((p, idx) => {
                const gmPct = p.revenue > 0 ? (p.grossMargin / p.revenue) * 100 : 0;
                const netPct = p.revenue > 0 ? (p.netProfit / p.revenue) * 100 : 0;

                return (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="p-3 font-bold text-slate-900">{p.month}</td>
                    <td className="p-3 font-black text-slate-900">{formatCurrency(p.revenue)}</td>
                    <td className="p-3 text-slate-600">{formatCurrency(p.costOfGoodsSold)}</td>
                    <td className="p-3 font-bold text-emerald-600">{formatCurrency(p.grossMargin)}</td>
                    <td className="p-3 text-slate-600">{formatCurrency(p.operatingExpenses)}</td>
                    <td className="p-3 font-black text-blue-600">{formatCurrency(p.netProfit)}</td>
                    <td className="p-3">
                      <span className="font-bold text-slate-700">{gmPct.toFixed(1)}% GM</span>
                      <span className="text-[10px] text-slate-400 block">{netPct.toFixed(1)}% Net</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add P&L Month Modal */}
      {isAddPnLModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Add Monthly P&L Entry</h3>
                <p className="text-xs text-slate-500">Record closed monthly financials with manual operating expenses</p>
              </div>
              <button onClick={() => setIsAddPnLModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPnL} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Period Month *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. April 2026"
                  value={pnlMonth}
                  onChange={e => setPnlMonth(e.target.value)}
                  className="w-full p-2.5 border rounded-lg font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Monthly Revenue (NGN) *</label>
                <input
                  type="number"
                  required
                  value={pnlRevenue}
                  onChange={e => setPnlRevenue(Number(e.target.value))}
                  className="w-full p-2.5 border rounded-lg font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Cost of Goods Sold - COGS (NGN) *</label>
                <input
                  type="number"
                  required
                  value={pnlCOGS}
                  onChange={e => setPnlCOGS(Number(e.target.value))}
                  className="w-full p-2.5 border rounded-lg font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Operating Expenses - OpEx (NGN) *</label>
                <input
                  type="number"
                  required
                  placeholder="Rent, diesel generator, staff salaries, transport..."
                  value={pnlOpEx}
                  onChange={e => setPnlOpEx(Number(e.target.value))}
                  className="w-full p-2.5 border rounded-lg font-bold text-slate-900"
                />
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs">
                <div className="flex justify-between font-bold text-slate-700">
                  <span>Gross Margin:</span>
                  <span className="text-emerald-700">{formatCurrency(pnlRevenue - pnlCOGS)}</span>
                </div>
                <div className="flex justify-between font-black text-slate-900 mt-1">
                  <span>Net Profit:</span>
                  <span className="text-blue-700">{formatCurrency(pnlRevenue - pnlCOGS - pnlOpEx)}</span>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddPnLModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 rounded-lg font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow cursor-pointer"
                >
                  Save P&L Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
