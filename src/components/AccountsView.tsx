import React, { useState } from 'react';
import { Account, Order, Invoice, Payment, UserRole, AccountSegment, PaymentType, AccountStatus } from '../types';
import { formatCurrency, exportToCSV } from '../utils/export';
import { ComponentStateMode } from '../App';
import { 
  Users, Plus, Search, Phone, MapPin, FileSpreadsheet, ChevronRight, X, 
  AlertTriangle, CreditCard, ShoppingCart, Clock, Shield, CheckCircle2, 
  Edit2, AlertCircle, Info, Calendar
} from 'lucide-react';

interface AccountsViewProps {
  accounts: Account[];
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  orders: Order[];
  invoices: Invoice[];
  payments: Payment[];
  currentRole: UserRole;
  stateMode: ComponentStateMode;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  accounts,
  setAccounts,
  orders,
  invoices,
  payments,
  currentRole,
  stateMode
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<string>('All');
  const [areaFilter, setAreaFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Form states for Add Account
  const [newName, setNewName] = useState('');
  const [newArea, setNewArea] = useState('Sabon Gari Market');
  const [newContact, setNewContact] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newSegment, setNewSegment] = useState<AccountSegment>('Reseller');
  const [newIntroducedBy, setNewIntroducedBy] = useState("Founder's Father");
  const [newPaymentType, setNewPaymentType] = useState<PaymentType>('Cash');
  const [newCreditLimit, setNewCreditLimit] = useState<number>(0);
  const [newStatus, setNewStatus] = useState<AccountStatus>('Active');
  const [newNotes, setNewNotes] = useState('');

  const kanoAreas = [
    'Sabon Gari Market',
    'Fagge Mechanic Village',
    'Kofar Ruwa',
    'Bompai Industrial',
    'Sharada Phase II',
    'Kantin Kwari',
    'Wapa'
  ];

  // 1. Loading State
  if (stateMode === 'loading') {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-slate-200 h-20 rounded-xl w-full"></div>
        <div className="bg-slate-200 h-16 rounded-xl w-full"></div>
        <div className="bg-white h-96 rounded-xl border border-slate-200"></div>
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
        <h3 className="text-lg font-bold text-slate-900">Failed to Load Customer Accounts</h3>
        <p className="text-xs text-slate-500">Database connection error while retrieving account ledger.</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg cursor-pointer">
          Retry Connection
        </button>
      </div>
    );
  }

  // 3. Empty State
  if (stateMode === 'empty' || accounts.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200 max-w-xl mx-auto my-12 space-y-4">
        <Users className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">No Customer Accounts Found</h3>
        <p className="text-xs text-slate-500">No accounts have been added to the Kano distribution ledger yet.</p>
        {currentRole !== 'Viewer' && currentRole !== 'Depot / Dispatch' && (
          <button onClick={() => setIsAddModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg cursor-pointer">
            Add First Account
          </button>
        )}
      </div>
    );
  }

  const filteredAccounts = accounts.filter(acc => {
    const matchesSearch = acc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          acc.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          acc.phone.includes(searchQuery);
    const matchesSegment = segmentFilter === 'All' || acc.segment === segmentFilter;
    const matchesArea = areaFilter === 'All' || acc.area === areaFilter;
    const matchesStatus = statusFilter === 'All' || acc.status === statusFilter;
    return matchesSearch && matchesSegment && matchesArea && matchesStatus;
  });

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newContact.trim() || !newPhone.trim()) {
      alert('Please fill in all required customer details.');
      return;
    }

    if (newPaymentType === 'Credit' && newCreditLimit <= 0) {
      alert('PRD Requirement: Adding a credit account requires an approved credit limit before orders can be placed.');
      return;
    }

    const newAcc: Account = {
      id: `acc-${Date.now()}`,
      name: newName,
      area: newArea,
      contact: newContact,
      phone: newPhone,
      segment: newSegment,
      introducedBy: newIntroducedBy,
      paymentType: newPaymentType,
      creditLimit: newPaymentType === 'Credit' ? Number(newCreditLimit) : 0,
      status: newStatus,
      notes: newNotes,
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: currentRole,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    setAccounts([newAcc, ...accounts]);
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleUpdateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    if (editingAccount.paymentType === 'Credit' && editingAccount.creditLimit <= 0) {
      alert('Credit accounts must have a designated credit limit.');
      return;
    }

    setAccounts(accounts.map(a => a.id === editingAccount.id ? {
      ...editingAccount,
      updatedAt: new Date().toISOString().split('T')[0]
    } : a));

    if (selectedAccount?.id === editingAccount.id) {
      setSelectedAccount(editingAccount);
    }

    setIsEditModalOpen(false);
    setEditingAccount(null);
  };

  const resetForm = () => {
    setNewName('');
    setNewArea('Sabon Gari Market');
    setNewContact('');
    setNewPhone('');
    setNewSegment('Reseller');
    setNewIntroducedBy("Founder's Father");
    setNewPaymentType('Cash');
    setNewCreditLimit(0);
    setNewStatus('Active');
    setNewNotes('');
  };

  const getAccountMetrics = (accountId: string) => {
    const accOrders = orders.filter(o => o.accountId === accountId && o.status !== 'Cancelled');
    const accInvoices = invoices.filter(i => i.accountId === accountId);
    const accPayments = payments.filter(p => p.accountId === accountId);
    const totalOrdered = accOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalBalance = accInvoices.reduce((sum, i) => sum + (i.totalAmount - i.paidAmount), 0);
    
    let daysSinceLastOrder = 'No orders yet';
    let isQuiet = false;
    if (accOrders.length > 0) {
      const latest = Math.max(...accOrders.map(o => new Date(o.date).getTime()));
      const diffDays = Math.floor((new Date().getTime() - latest) / (1000 * 3600 * 24));
      daysSinceLastOrder = `${diffDays} days ago`;
      if (diffDays > 30) isQuiet = true;
    } else {
      isQuiet = true;
    }

    return { totalOrdered, totalBalance, daysSinceLastOrder, isQuiet, accOrders, accInvoices, accPayments };
  };

  const canEditCreditLimit = currentRole === 'CEO';
  const canModifyAccounts = currentRole === 'CEO' || currentRole === 'Sales Lead';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Customer Accounts Directory ({accounts.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Single record for Kano Fleet, Workshop, and Reseller accounts with verified credit limits and order ledger.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => exportToCSV('kano_mobil_accounts', accounts)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          {canModifyAccounts && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Account</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, contact person, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium"
          >
            <option value="All">All Segments</option>
            <option value="Fleet">Fleet</option>
            <option value="Workshop">Workshop</option>
            <option value="Reseller">Reseller</option>
          </select>

          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium"
          >
            <option value="All">All Kano Areas</option>
            {kanoAreas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="On hold">On hold</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                <th className="p-4">Customer Name & Kano Area</th>
                <th className="p-4">Segment</th>
                <th className="p-4">Contact & Phone</th>
                <th className="p-4">Payment & Credit Terms</th>
                <th className="p-4">Activity Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredAccounts.map(acc => {
                const metrics = getAccountMetrics(acc.id);
                const isOverLimit = acc.paymentType === 'Credit' && metrics.totalBalance > acc.creditLimit;

                return (
                  <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 text-sm">{acc.name}</div>
                      <div className="text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
                        <span>{acc.area}</span>
                        <span className="text-[10px] text-slate-400 ml-1">({acc.introducedBy})</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        acc.segment === 'Fleet' ? 'bg-purple-100 text-purple-800' :
                        acc.segment === 'Workshop' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {acc.segment}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{acc.contact}</div>
                      <div className="text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{acc.phone}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <CreditCard className="w-3 h-3 text-slate-400" />
                        <span>{acc.paymentType}</span>
                        {acc.paymentType === 'Credit' && (
                          <span className="text-[11px] text-slate-600 font-semibold">
                            (Limit: {formatCurrency(acc.creditLimit)})
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] mt-0.5 flex items-center gap-1">
                        <span>Balance:</span>
                        <span className={`font-bold ${
                          isOverLimit ? 'text-red-600 underline' : 
                          metrics.totalBalance > 0 ? 'text-amber-700' : 'text-slate-600'
                        }`}>
                          {formatCurrency(metrics.totalBalance)}
                        </span>
                        {isOverLimit && (
                          <span className="bg-red-100 text-red-700 text-[9px] font-black px-1 rounded">OVER LIMIT</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          acc.status === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                          acc.status === 'On hold' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-200 text-slate-700'
                        }`}>
                          {acc.status}
                        </span>
                        <span className={`text-[10px] ${metrics.isQuiet ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
                          {metrics.daysSinceLastOrder}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedAccount(acc)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-800 font-semibold rounded-lg inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Account Details Modal (PRD Section 5.2 requirement: shows order history, payments, balance, days since last order) */}
      {selectedAccount && (() => {
        const metrics = getAccountMetrics(selectedAccount.id);
        const creditLimitUsedPct = selectedAccount.creditLimit > 0 
          ? Math.min(100, (metrics.totalBalance / selectedAccount.creditLimit) * 100)
          : 0;
        const isOverLimit = selectedAccount.paymentType === 'Credit' && metrics.totalBalance > selectedAccount.creditLimit;

        return (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-4 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">
                      {selectedAccount.segment}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedAccount.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {selectedAccount.status}
                    </span>
                    {metrics.isQuiet && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                        Quiet Account (&gt;30d)
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{selectedAccount.name}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    <span>{selectedAccount.area}</span>
                    <span>•</span>
                    <span>Introduced by: {selectedAccount.introducedBy}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {canModifyAccounts && (
                    <button
                      onClick={() => {
                        setEditingAccount(selectedAccount);
                        setIsEditModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Account</span>
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedAccount(null)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Account Quick Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Contact Person</div>
                  <div className="text-sm font-bold text-slate-900 mt-1">{selectedAccount.contact}</div>
                  <div className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{selectedAccount.phone}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Outstanding Balance</div>
                  <div className={`text-base font-black mt-1 ${isOverLimit ? 'text-red-600' : 'text-slate-900'}`}>
                    {formatCurrency(metrics.totalBalance)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Total Invoiced: {formatCurrency(metrics.totalOrdered)}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Payment Terms</div>
                  <div className="text-sm font-bold text-slate-900 mt-1">{selectedAccount.paymentType}</div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {selectedAccount.paymentType === 'Credit' 
                      ? `Limit: ${formatCurrency(selectedAccount.creditLimit)}` 
                      : 'Immediate Settlement'}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Last Order Activity</div>
                  <div className="text-sm font-bold text-slate-900 mt-1">{metrics.daysSinceLastOrder}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{metrics.accOrders.length} orders total</div>
                </div>
              </div>

              {/* Credit Limit Exposure Bar if Credit Account */}
              {selectedAccount.paymentType === 'Credit' && (
                <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 mb-6">
                  <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                    <span className="text-blue-900 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-blue-600" />
                      Approved Credit Limit Utilization
                    </span>
                    <span className={isOverLimit ? 'text-red-700 font-black' : 'text-blue-800'}>
                      {formatCurrency(metrics.totalBalance)} / {formatCurrency(selectedAccount.creditLimit)} ({creditLimitUsedPct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        isOverLimit ? 'bg-red-600' : creditLimitUsedPct > 80 ? 'bg-amber-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.min(creditLimitUsedPct, 100)}%` }}
                    ></div>
                  </div>
                  {isOverLimit && (
                    <p className="text-[11px] text-red-600 font-bold mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Credit limit exceeded by {formatCurrency(metrics.totalBalance - selectedAccount.creditLimit)}. New credit orders require CEO override.</span>
                    </p>
                  )}
                </div>
              )}

              {/* Order History Table */}
              <div className="mb-6">
                <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                  Order History ({metrics.accOrders.length})
                </h4>
                {metrics.accOrders.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-lg">No orders recorded for this account yet.</p>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 border-b">
                        <tr>
                          <th className="p-2.5">Order ID</th>
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5">Items</th>
                          <th className="p-2.5">Amount (NGN)</th>
                          <th className="p-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {metrics.accOrders.map(ord => (
                          <tr key={ord.id}>
                            <td className="p-2.5 font-bold text-slate-900">{ord.id}</td>
                            <td className="p-2.5 text-slate-600">{ord.date}</td>
                            <td className="p-2.5 text-slate-600">{ord.lines.length} items</td>
                            <td className="p-2.5 font-bold text-slate-900">{formatCurrency(ord.totalAmount)}</td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                {ord.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Payment Receipts History */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Payment Records ({metrics.accPayments.length})
                </h4>
                {metrics.accPayments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-lg">No payments recorded for this account yet.</p>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 border-b">
                        <tr>
                          <th className="p-2.5">Receipt ID</th>
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5">Method</th>
                          <th className="p-2.5">Reference / Teller</th>
                          <th className="p-2.5">Amount (NGN)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {metrics.accPayments.map(p => (
                          <tr key={p.id}>
                            <td className="p-2.5 font-bold text-slate-900">{p.id}</td>
                            <td className="p-2.5 text-slate-600">{p.date}</td>
                            <td className="p-2.5"><span className="bg-slate-100 px-2 py-0.5 rounded font-semibold">{p.method}</span></td>
                            <td className="p-2.5 text-slate-600">{p.reference}</td>
                            <td className="p-2.5 font-bold text-emerald-600">{formatCurrency(p.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {selectedAccount.notes && (
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="font-bold text-slate-700">Account Notes: </span>
                  <span className="text-slate-600">{selectedAccount.notes}</span>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedAccount(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Close Ledger
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add New Account Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Add Customer Account</h3>
                <p className="text-xs text-slate-500">Record customer details into the Kano distribution ledger</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Account / Business Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alh. Danladi & Sons Transport"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kano Area *</label>
                  <select
                    value={newArea}
                    onChange={e => setNewArea(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white"
                  >
                    {kanoAreas.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customer Segment *</label>
                  <select
                    value={newSegment}
                    onChange={e => setNewSegment(e.target.value as AccountSegment)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white"
                  >
                    <option value="Reseller">Reseller</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Fleet">Fleet</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alh. Danladi"
                    value={newContact}
                    onChange={e => setNewContact(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 0803 123 4567"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Type *</label>
                  <select
                    value={newPaymentType}
                    onChange={e => setNewPaymentType(e.target.value as PaymentType)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white"
                  >
                    <option value="Cash">Cash (Immediate)</option>
                    <option value="Credit">Credit (Pre-approved)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Introduced By Source</label>
                  <input
                    type="text"
                    value={newIntroducedBy}
                    onChange={e => setNewIntroducedBy(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              {/* Credit Limit Setting */}
              {newPaymentType === 'Credit' && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-blue-950 flex items-center gap-1">
                      <Shield className="w-4 h-4 text-blue-600" />
                      Approved Credit Limit (NGN) *
                    </label>
                    {!canEditCreditLimit && (
                      <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded">
                        CEO Approval Required
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    min="10000"
                    step="50000"
                    required
                    placeholder="e.g. 2500000"
                    value={newCreditLimit}
                    onChange={e => setNewCreditLimit(Number(e.target.value))}
                    disabled={!canEditCreditLimit}
                    className="w-full p-2.5 border border-blue-300 rounded-lg bg-white font-bold text-slate-900"
                  />
                  <p className="text-[10px] text-slate-500">
                    PRD Requirement: Credit accounts must have an approved credit limit before any order can be confirmed.
                  </p>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Initial Status</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as AccountStatus)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="On hold">On hold</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Operational Notes</label>
                <textarea
                  rows={2}
                  placeholder="Key relationship details, preferred delivery times, payment habits..."
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow cursor-pointer"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Account Modal */}
      {isEditModalOpen && editingAccount && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Edit Account: {editingAccount.name}</h3>
                <p className="text-xs text-slate-500">Update contact, status, or credit limit terms</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAccount} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Person *</label>
                <input
                  type="text"
                  required
                  value={editingAccount.contact}
                  onChange={e => setEditingAccount({ ...editingAccount, contact: e.target.value })}
                  className="w-full p-2.5 border rounded-lg text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={editingAccount.phone}
                  onChange={e => setEditingAccount({ ...editingAccount, phone: e.target.value })}
                  className="w-full p-2.5 border rounded-lg text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kano Area</label>
                  <select
                    value={editingAccount.area}
                    onChange={e => setEditingAccount({ ...editingAccount, area: e.target.value })}
                    className="w-full p-2.5 border rounded-lg bg-white"
                  >
                    {kanoAreas.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={editingAccount.status}
                    onChange={e => setEditingAccount({ ...editingAccount, status: e.target.value as AccountStatus })}
                    className="w-full p-2.5 border rounded-lg bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="On hold">On hold</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Type</label>
                <select
                  value={editingAccount.paymentType}
                  onChange={e => setEditingAccount({ 
                    ...editingAccount, 
                    paymentType: e.target.value as PaymentType,
                    creditLimit: e.target.value === 'Cash' ? 0 : editingAccount.creditLimit || 500000
                  })}
                  className="w-full p-2.5 border rounded-lg bg-white"
                >
                  <option value="Cash">Cash</option>
                  <option value="Credit">Credit</option>
                </select>
              </div>

              {editingAccount.paymentType === 'Credit' && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-blue-950">Credit Limit (NGN) *</label>
                    {!canEditCreditLimit && (
                      <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded">
                        Read-only (CEO only)
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    min="10000"
                    step="50000"
                    value={editingAccount.creditLimit}
                    disabled={!canEditCreditLimit}
                    onChange={e => setEditingAccount({ ...editingAccount, creditLimit: Number(e.target.value) })}
                    className="w-full p-2.5 border rounded-lg bg-white font-bold"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={editingAccount.notes}
                  onChange={e => setEditingAccount({ ...editingAccount, notes: e.target.value })}
                  className="w-full p-2.5 border rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg font-bold shadow"
                >
                  Update Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
