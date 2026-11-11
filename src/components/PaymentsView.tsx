import React, { useState } from 'react';
import { Payment, Invoice, Account, PaymentMethod, UserRole } from '../types';
import { formatCurrency, exportToCSV } from '../utils/export';
import { ComponentStateMode } from '../App';
import { 
  CreditCard, Plus, Search, FileSpreadsheet, AlertTriangle, X, 
  Clock, CheckCircle2, DollarSign, Calendar, Filter, User
} from 'lucide-react';

interface PaymentsViewProps {
  payments: Payment[];
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  accounts: Account[];
  currentRole: UserRole;
  stateMode: ComponentStateMode;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  payments,
  setPayments,
  invoices,
  setInvoices,
  accounts,
  currentRole,
  stateMode
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [agingFilter, setAgingFilter] = useState<string>('All');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  // Form states
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [reference, setReference] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');

  // 1. Loading State
  if (stateMode === 'loading') {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-slate-200 h-20 rounded-xl w-full"></div>
        <div className="bg-white h-96 rounded-xl border border-slate-200"></div>
      </div>
    );
  }

  // 2. Error State
  if (stateMode === 'error') {
    return (
      <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-red-200 max-w-xl mx-auto my-12 space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-600 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Failed to Load Payments Ledger</h3>
        <p className="text-xs text-slate-500">Database timeout while fetching cash, bank transfer, and POS records.</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg cursor-pointer">
          Retry
        </button>
      </div>
    );
  }

  // 3. Empty State
  if (stateMode === 'empty' || payments.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200 max-w-xl mx-auto my-12 space-y-4">
        <CreditCard className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">No Payments Recorded</h3>
        <p className="text-xs text-slate-500">There are no payment receipts recorded. Record a customer payment to clear invoices.</p>
        {currentRole !== 'Viewer' && currentRole !== 'Depot / Dispatch' && (
          <button onClick={() => setIsRecordModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg cursor-pointer">
            Record First Payment
          </button>
        )}
      </div>
    );
  }

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const accountUnpaidInvoices = invoices.filter(i => i.accountId === selectedAccountId && i.status !== 'Paid');

  // Filter invoices by aging buckets
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inv.accountName.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesAging = true;
    if (agingFilter === '0-30') {
      matchesAging = inv.daysOverdue <= 30;
    } else if (agingFilter === '31-60') {
      matchesAging = inv.daysOverdue > 30 && inv.daysOverdue <= 60;
    } else if (agingFilter === '61+') {
      matchesAging = inv.daysOverdue > 60;
    } else if (agingFilter === 'Overdue') {
      matchesAging = inv.daysOverdue > 0;
    }

    return matchesSearch && matchesAging;
  });

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) {
      alert('Payment amount must be greater than zero.');
      return;
    }
    if (!reference.trim()) {
      alert('PRD Requirement: Payment reference or teller number is required.');
      return;
    }

    if (!selectedAccount) return;

    const today = new Date().toISOString().split('T')[0];
    const newPaymentId = `PAY-${Math.floor(600 + Math.random() * 400)}`;

    const newPayment: Payment = {
      id: newPaymentId,
      accountId: selectedAccount.id,
      accountName: selectedAccount.name,
      date: today,
      amount: paymentAmount,
      method: paymentMethod,
      reference,
      allocatedInvoices: selectedInvoiceId ? [{ invoiceId: selectedInvoiceId, amount: paymentAmount }] : [],
      createdBy: currentRole,
      createdAt: today
    };

    // Update allocated invoice
    if (selectedInvoiceId) {
      setInvoices(invoices.map(inv => {
        if (inv.id === selectedInvoiceId) {
          const newPaid = inv.paidAmount + paymentAmount;
          const isPaid = newPaid >= inv.totalAmount;
          return {
            ...inv,
            paidAmount: newPaid,
            status: isPaid ? 'Paid' : 'Partial'
          };
        }
        return inv;
      }));
    }

    setPayments([newPayment, ...payments]);
    setIsRecordModalOpen(false);
    setPaymentAmount(0);
    setReference('');
    setSelectedInvoiceId('');
  };

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalReceivables = invoices.reduce((sum, i) => sum + (i.totalAmount - i.paidAmount), 0);
  const overdue30Plus = invoices
    .filter(i => i.daysOverdue > 30)
    .reduce((sum, i) => sum + (i.totalAmount - i.paidAmount), 0);

  const canRecordPayment = currentRole === 'CEO' || currentRole === 'Finance / Cashier' || currentRole === 'Sales Lead';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-blue-600" />
            Payments & Receivables Ledger ({payments.length} Receipts)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Customer collections via Cash, Bank Transfer, and POS with line-by-line invoice allocation and aging buckets.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => exportToCSV('kano_mobil_payments', payments)} 
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer transition-colors"
          >
            Export CSV
          </button>
          {canRecordPayment && (
            <button 
              onClick={() => setIsRecordModalOpen(true)} 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Record Payment</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase">Total Cash Collected</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{formatCurrency(totalCollected)}</div>
          <div className="text-xs text-slate-400 mt-0.5">{payments.length} verified collections</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase">Outstanding Receivables</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalReceivables)}</div>
          <div className="text-xs text-slate-400 mt-0.5">Across all active accounts</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-red-600 uppercase">Overdue &gt;30 Days</div>
          <div className="text-2xl font-black text-red-600 mt-1">{formatCurrency(overdue30Plus)}</div>
          <div className="text-xs text-slate-400 mt-0.5">Critical credit collection focus</div>
        </div>
      </div>

      {/* Filter and Invoices Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Invoices & Receivables Aging Buckets</h3>
            <p className="text-xs text-slate-500">Tracking customer invoice balances and days overdue</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search invoice or customer..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border rounded-lg text-xs"
              />
            </div>

            <select
              value={agingFilter}
              onChange={e => setAgingFilter(e.target.value)}
              className="bg-slate-50 border rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800"
            >
              <option value="All">All Aging Buckets</option>
              <option value="0-30">0 - 30 Days (Current)</option>
              <option value="31-60">31 - 60 Days</option>
              <option value="61+">61+ Days (Critical)</option>
              <option value="Overdue">All Overdue</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                <th className="p-3">Invoice ID</th>
                <th className="p-3">Customer Account</th>
                <th className="p-3">Due Date</th>
                <th className="p-3">Total Amount</th>
                <th className="p-3">Balance Due</th>
                <th className="p-3">Days Overdue</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredInvoices.map(inv => {
                const balance = inv.totalAmount - inv.paidAmount;
                const isOverdue = inv.daysOverdue > 0;

                return (
                  <tr key={inv.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-bold text-slate-900">{inv.id}</td>
                    <td className="p-3 font-semibold text-slate-800">{inv.accountName}</td>
                    <td className="p-3 text-slate-600">{inv.dueDate}</td>
                    <td className="p-3 font-black text-slate-900">{formatCurrency(inv.totalAmount)}</td>
                    <td className="p-3 font-black text-red-600">{formatCurrency(balance)}</td>
                    <td className="p-3">
                      {isOverdue ? (
                        <span className={`font-bold ${inv.daysOverdue > 60 ? 'text-red-700' : 'text-amber-700'}`}>
                          {inv.daysOverdue} days
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-medium">On Schedule</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                        inv.status === 'Partial' ? 'bg-blue-100 text-blue-800' :
                        inv.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                        'bg-slate-200 text-slate-700'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {balance > 0 && canRecordPayment && (
                        <button
                          onClick={() => {
                            setSelectedAccountId(inv.accountId);
                            setSelectedInvoiceId(inv.id);
                            setPaymentAmount(balance);
                            setIsRecordModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded text-xs cursor-pointer"
                        >
                          Pay
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verified Payment Receipts History */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-base font-bold text-slate-900 mb-4">Payment Receipts Log ({payments.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                <th className="p-3">Receipt Ref</th>
                <th className="p-3">Account</th>
                <th className="p-3">Date</th>
                <th className="p-3">Method</th>
                <th className="p-3">Bank Reference / Teller</th>
                <th className="p-3">Amount (NGN)</th>
                <th className="p-3">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/80">
                  <td className="p-3 font-bold text-slate-900">{p.id}</td>
                  <td className="p-3 font-semibold text-slate-800">{p.accountName}</td>
                  <td className="p-3 text-slate-600">{p.date}</td>
                  <td className="p-3">
                    <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-semibold text-[11px]">
                      {p.method}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-600">{p.reference}</td>
                  <td className="p-3 font-black text-emerald-600">{formatCurrency(p.amount)}</td>
                  <td className="p-3 text-slate-500">{p.createdBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Record Payment Receipt</h3>
                <p className="text-xs text-slate-500">Record incoming cash, bank transfer, or POS settlement</p>
              </div>
              <button onClick={() => setIsRecordModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Account *</label>
                <select
                  value={selectedAccountId}
                  onChange={e => {
                    setSelectedAccountId(e.target.value);
                    setSelectedInvoiceId('');
                  }}
                  className="w-full p-2.5 border rounded-lg bg-white text-slate-900 font-medium"
                >
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.area})</option>)}
                </select>
              </div>

              {/* Invoices dropdown for allocation */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Allocate to Invoice (Optional)</label>
                <select
                  value={selectedInvoiceId}
                  onChange={e => {
                    setSelectedInvoiceId(e.target.value);
                    const inv = accountUnpaidInvoices.find(i => i.id === e.target.value);
                    if (inv) setPaymentAmount(inv.totalAmount - inv.paidAmount);
                  }}
                  className="w-full p-2.5 border rounded-lg bg-white text-slate-900"
                >
                  <option value="">General Account Credit</option>
                  {accountUnpaidInvoices.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.id} — Due: {i.dueDate} (Balance: {formatCurrency(i.totalAmount - i.paidAmount)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Method *</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full p-2.5 border rounded-lg bg-white text-slate-900"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash at Depot</option>
                    <option value="POS">POS Terminal</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount Paid (NGN) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(Number(e.target.value))}
                    className="w-full p-2.5 border rounded-lg font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reference / UTR / Teller Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ZEN-TRF-2948192 or POS-AUTH-8821"
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  className="w-full p-2.5 border rounded-lg text-slate-900 font-mono"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow cursor-pointer"
                >
                  Save Payment Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
