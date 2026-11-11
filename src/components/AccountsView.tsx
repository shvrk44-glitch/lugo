import React, { useState } from 'react';
import { Account, Order, Invoice, Payment, UserRole, AccountSegment, PaymentType, AccountStatus } from '../types';
import { formatCurrency, exportToCSV } from '../utils/export';
import { ComponentStateMode } from '../App';
import { Users, Plus, Search, Filter, Phone, MapPin, FileSpreadsheet, ChevronRight, X, AlertTriangle, RefreshCw } from 'lucide-react';

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
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [newName, setNewName] = useState('');
  const [newArea, setNewArea] = useState('Sabon Gari Market');
  const [newContact, setNewContact] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newSegment, setNewSegment] = useState<AccountSegment>('Reseller');
  const [newIntroducedBy, setNewIntroducedBy] = useState('Al-Amin');
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
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg">
          Retry
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
        <button onClick={() => setIsAddModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg">
          Add First Account
        </button>
      </div>
    );
  }

  const filteredAccounts = accounts.filter(acc => {
    const matchesSearch = acc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          acc.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          acc.phone.includes(searchQuery);
    const matchesSegment = segmentFilter === 'All' || acc.segment === segmentFilter;
    const matchesArea = areaFilter === 'All' || acc.area === areaFilter;
    return matchesSearch && matchesSegment && matchesArea;
  });

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newContact.trim()) {
      alert('Please fill in required fields.');
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
    setNewName('');
    setNewContact('');
    setNewPhone('');
  };

  const getAccountMetrics = (accountId: string) => {
    const accOrders = orders.filter(o => o.accountId === accountId && o.status !== 'Cancelled');
    const accInvoices = invoices.filter(i => i.accountId === accountId);
    const totalOrdered = accOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalBalance = accInvoices.reduce((sum, i) => sum + (i.totalAmount - i.paidAmount), 0);
    
    let daysSinceLastOrder = 'N/A';
    if (accOrders.length > 0) {
      const latest = Math.max(...accOrders.map(o => new Date(o.date).getTime()));
      const diffDays = Math.floor((new Date().getTime() - latest) / (1000 * 3600 * 24));
      daysSinceLastOrder = `${diffDays} days ago`;
    }

    return { totalOrdered, totalBalance, daysSinceLastOrder, accOrders, accInvoices };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Customer Accounts ({accounts.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Fleet, Workshop, and Reseller accounts across Kano distribution areas.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => exportToCSV('kano_mobil_accounts', accounts)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          {currentRole !== 'Viewer' && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Account</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by account name, contact person..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-medium"
          >
            <option value="All">All Segments</option>
            <option value="Fleet">Fleet</option>
            <option value="Workshop">Workshop</option>
            <option value="Reseller">Reseller</option>
          </select>
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 font-medium"
          >
            <option value="All">All Kano Areas</option>
            {kanoAreas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                <th className="p-4">Account Name & Area</th>
                <th className="p-4">Segment</th>
                <th className="p-4">Contact & Phone</th>
                <th className="p-4">Payment & Credit Limit</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredAccounts.map(acc => {
                const metrics = getAccountMetrics(acc.id);
                return (
                  <tr key={acc.id} className="hover:bg-slate-50/80">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 text-sm">{acc.name}</div>
                      <div className="text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-blue-500" />
                        <span>{acc.area}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        {acc.segment}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{acc.contact}</div>
                      <div className="text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{acc.phone}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">
                        {acc.paymentType} {acc.paymentType === 'Credit' && `(${formatCurrency(acc.creditLimit)})`}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Balance: <span className={metrics.totalBalance > 0 ? 'text-red-600 font-bold' : 'text-slate-700'}>{formatCurrency(metrics.totalBalance)}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {acc.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedAccount(acc)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg inline-flex items-center gap-1 cursor-pointer"
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

      {selectedAccount && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <h3 className="text-xl font-bold text-slate-900">{selectedAccount.name}</h3>
              <button onClick={() => setSelectedAccount(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="text-xs space-y-3">
              <div><strong>Area:</strong> {selectedAccount.area}</div>
              <div><strong>Contact:</strong> {selectedAccount.contact} ({selectedAccount.phone})</div>
              <div><strong>Payment Type:</strong> {selectedAccount.paymentType} {selectedAccount.paymentType === 'Credit' && `(Limit: ${formatCurrency(selectedAccount.creditLimit)})`}</div>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setSelectedAccount(null)} className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg">Close</button>
            </div>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <h3 className="text-lg font-black text-slate-900">Add New Account</h3>
              <button onClick={() => setIsAddModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateAccount} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Name *</label>
                <input type="text" required value={newName} onChange={e => setNewName(e.target.value)} className="w-full p-2.5 border rounded-lg" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Person *</label>
                <input type="text" required value={newContact} onChange={e => setNewContact(e.target.value)} className="w-full p-2.5 border rounded-lg" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                <input type="text" required value={newPhone} onChange={e => setNewPhone(e.target.value)} className="w-full p-2.5 border rounded-lg" />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-lg font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-lg font-bold">Save Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
