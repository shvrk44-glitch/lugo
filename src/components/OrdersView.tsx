import React, { useState } from 'react';
import { Order, OrderLine, Account, Product, Invoice, UserRole } from '../types';
import { formatCurrency, generateInvoicePDF, exportToCSV } from '../utils/export';
import { ComponentStateMode } from '../App';
import { ShoppingCart, Plus, Search, Filter, FileText, AlertCircle, X, Trash2, AlertTriangle } from 'lucide-react';

interface OrdersViewProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  accounts: Account[];
  products: Product[];
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  currentRole: UserRole;
  stateMode: ComponentStateMode;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  setOrders,
  accounts,
  products,
  invoices,
  setInvoices,
  currentRole,
  stateMode
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);
  const [currentProductId, setCurrentProductId] = useState(products[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(10);
  const [discount, setDiscount] = useState<number>(0);
  const [deliveryFee, setDeliveryFee] = useState<number>(10000);
  const [priceOverrideReason, setPriceOverrideReason] = useState('');
  const [isPriceOverridden, setIsPriceOverridden] = useState(false);
  const [customUnitPrice, setCustomUnitPrice] = useState<number>(0);
  const [overCreditReason, setOverCreditReason] = useState('');
  const [overrideWarning, setOverrideWarning] = useState<string | null>(null);

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
        <h3 className="text-lg font-bold text-slate-900">Failed to Load Orders Ledger</h3>
        <p className="text-xs text-slate-500">Error retrieving confirmed orders and invoice records.</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg">Retry</button>
      </div>
    );
  }

  // 3. Empty State
  if (stateMode === 'empty' || orders.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200 max-w-xl mx-auto my-12 space-y-4">
        <ShoppingCart className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">No Orders Recorded</h3>
        <p className="text-xs text-slate-500">There are no orders in the system. Create an order to generate invoices.</p>
        <button onClick={() => setIsCreateModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg">Create Order</button>
      </div>
    );
  }

  const filteredOrders = orders.filter(ord => {
    const matchesSearch = ord.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ord.accountName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || ord.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddLineItem = () => {
    const prod = products.find(p => p.id === currentProductId);
    if (!prod) return;

    const unitPrice = isPriceOverridden && customUnitPrice > 0 ? customUnitPrice : prod.listPrice;
    const subtotal = (unitPrice * quantity) - discount;

    const newLine: OrderLine = {
      productId: prod.id,
      productName: prod.name,
      packSize: prod.packSize,
      quantity,
      unitPrice,
      landedCost: prod.landedCost,
      discount,
      subtotal: subtotal > 0 ? subtotal : 0
    };

    setOrderLines([...orderLines, newLine]);
    setIsPriceOverridden(false);
    setCustomUnitPrice(0);
  };

  const checkCreditAndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderLines.length === 0) {
      alert('Please add at least one line item.');
      return;
    }

    const account = accounts.find(a => a.id === selectedAccountId);
    if (!account) return;

    const orderSubtotal = orderLines.reduce((sum, l) => sum + l.subtotal, 0);
    const totalOrderAmount = orderSubtotal + deliveryFee;

    const newOrderId = `ORD-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newOrder: Order = {
      id: newOrderId,
      accountId: account.id,
      accountName: account.name,
      date: new Date().toISOString().split('T')[0],
      lines: orderLines,
      deliveryFee,
      discount: orderLines.reduce((sum, l) => sum + l.discount, 0),
      totalAmount: totalOrderAmount,
      status: 'Confirmed',
      createdBy: currentRole,
      createdAt: new Date().toISOString().split('T')[0]
    };

    const newInvoice: Invoice = {
      id: `INV-${newOrderId}`,
      orderId: newOrderId,
      accountId: account.id,
      accountName: account.name,
      issueDate: newOrder.date,
      dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
      totalAmount: totalOrderAmount,
      paidAmount: 0,
      status: 'Unpaid',
      daysOverdue: 0
    };

    setOrders([newOrder, ...orders]);
    setInvoices([newInvoice, ...invoices]);
    setIsCreateModalOpen(false);
    setOrderLines([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
            Orders & Invoices ({orders.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Confirmed orders, pricing list overrides, credit checks, and PDF invoice generation.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={() => exportToCSV('kano_mobil_orders', orders)} className="px-3.5 py-2 bg-slate-100 rounded-lg text-xs font-bold cursor-pointer">Export CSV</button>
          {currentRole !== 'Viewer' && (
            <button onClick={() => setIsCreateModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold shadow cursor-pointer flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              <span>Create Order</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                <th className="p-4">Order ID & Date</th>
                <th className="p-4">Customer Account</th>
                <th className="p-4">Items Count</th>
                <th className="p-4">Total Amount (NGN)</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredOrders.map(ord => (
                <tr key={ord.id} className="hover:bg-slate-50/80">
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{ord.id}</div>
                    <div className="text-slate-500 text-[11px]">{ord.date}</div>
                  </td>
                  <td className="p-4 font-bold text-slate-800">{ord.accountName}</td>
                  <td className="p-4 text-slate-600">{ord.lines.length} items</td>
                  <td className="p-4 font-black text-slate-900">{formatCurrency(ord.totalAmount)}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">{ord.status}</span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => {
                        const acc = accounts.find(a => a.id === ord.accountId) || { name: ord.accountName, area: 'Kano', contact: 'N/A', phone: 'N/A', paymentType: 'Credit' };
                        const inv = invoices.find(i => i.orderId === ord.id) || { id: `INV-${ord.id}`, issueDate: ord.date, dueDate: ord.date, totalAmount: ord.totalAmount, paidAmount: 0 };
                        generateInvoicePDF(ord, acc, inv);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg inline-flex items-center gap-1 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>PDF Invoice</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <h3 className="text-lg font-black text-slate-900">Create Order</h3>
              <button onClick={() => setIsCreateModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={checkCreditAndSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Account *</label>
                <select value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)} className="w-full p-2.5 border rounded-lg">
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border space-y-3">
                <span className="font-bold">Add Order Line</span>
                <div className="grid grid-cols-3 gap-2">
                  <select value={currentProductId} onChange={e => setCurrentProductId(e.target.value)} className="col-span-2 p-2 border rounded">
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.packSize})</option>)}
                  </select>
                  <input type="number" min="1" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="p-2 border rounded" />
                </div>
                <button type="button" onClick={handleAddLineItem} className="px-4 py-1.5 bg-slate-900 text-white font-bold rounded">Add Item</button>
              </div>

              <div>
                <span className="font-bold">Lines ({orderLines.length})</span>
                {orderLines.map((l, i) => (
                  <div key={i} className="flex justify-between p-2 bg-slate-50 rounded mt-1">
                    <span>{l.productName} ({l.packSize}) × {l.quantity}</span>
                    <span>{formatCurrency(l.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded font-bold">Confirm & Generate Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
