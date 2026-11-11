import React, { useState } from 'react';
import { Payment, Invoice, Account, PaymentMethod, UserRole } from '../types';
import { formatCurrency, exportToCSV } from '../utils/export';
import { ComponentStateMode } from '../App';
import { CreditCard, Plus, Search, FileSpreadsheet, AlertTriangle, X } from 'lucide-react';

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
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<PaymentMethod>('Bank Transfer');
  const [reference, setReference] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');

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
        <p className="text-xs text-slate-500">Database timeout while fetching cash and bank transfer records.</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg">Retry</button>
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
        <button onClick={() => setIsRecordModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg">Record Payment</button>
      </div>
    );
  }

  const filteredPayments = payments.filter(p =>
    p.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.reference.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !reference.trim()) {
      alert('Please enter valid amount and reference.');
      return;
    }

    const account = accounts.find(a => a.id === selectedAccountId);
    if (!account) return;

    const newPayment: Payment = {
      id: `PAY-${Math.floor(600 + Math.random() * 400)}`,
      accountId: account.id,
      accountName: account.name,
      date: new Date().toISOString().split('T')[0],
      amount,
      method,
      reference,
      allocatedInvoices: selectedInvoiceId ? [{ invoiceId: selectedInvoiceId, amount }] : [],
      createdBy: currentRole,
      createdAt: new Date().toISOString().split('T')[0]
    };

    if (selectedInvoiceId) {
      setInvoices(invoices.map(inv => {
        if (inv.id === selectedInvoiceId) {
          const newPaid = inv.paidAmount + amount;
          return { ...inv, paidAmount: newPaid, status: newPaid >= inv.totalAmount ? 'Paid' : 'Partial' };
        }
        return inv;
      }));
    }

    setPayments([newPayment, ...payments]);
    setIsRecordModalOpen(false);
    setAmount(0);
    setReference('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-blue-600" />
            Payments & Receivables ({payments.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Record customer cash, bank transfer, and POS payments allocated to invoices.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={() => exportToCSV('kano_mobil_payments', payments)} className="px-3.5 py-2 bg-slate-100 rounded-lg text-xs font-bold cursor-pointer">Export CSV</button>
          {currentRole !== 'Viewer' && (
            <button onClick={() => setIsRecordModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold shadow cursor-pointer flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              <span>Record Payment</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-base font-bold text-slate-900 mb-4">Outstanding Invoices & Aging</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                <th className="p-3">Invoice ID</th>
                <th className="p-3">Account</th>
                <th className="p-3">Due Date</th>
                <th className="p-3">Total Amount</th>
                <th className="p-3">Balance Due</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/80">
                  <td className="p-3 font-bold text-slate-900">{inv.id}</td>
                  <td className="p-3 text-slate-800 font-semibold">{inv.accountName}</td>
                  <td className="p-3 text-slate-500">{inv.dueDate}</td>
                  <td className="p-3 font-black text-slate-900">{formatCurrency(inv.totalAmount)}</td>
                  <td className="p-3 font-black text-red-600">{formatCurrency(inv.totalAmount - inv.paidAmount)}</td>
                  <td className="p-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">{inv.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isRecordModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <h3 className="text-lg font-black text-slate-900">Record Payment</h3>
              <button onClick={() => setIsRecordModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Account *</label>
                <select value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)} className="w-full p-2.5 border rounded-lg">
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Amount Paid (NGN) *</label>
                <input type="number" required min="1" value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full p-2.5 border rounded-lg font-bold" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Reference / UTR *</label>
                <input type="text" required value={reference} onChange={e => setReference(e.target.value)} className="w-full p-2.5 border rounded-lg" />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => setIsRecordModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded font-bold">Save Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
