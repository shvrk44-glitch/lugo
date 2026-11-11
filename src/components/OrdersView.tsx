import React, { useState } from 'react';
import { Order, OrderLine, Account, Product, Invoice, Delivery, StockMovement, UserRole, OrderStatus } from '../types';
import { formatCurrency, generateInvoicePDF, exportToCSV } from '../utils/export';
import { ComponentStateMode } from '../App';
import { 
  ShoppingCart, Plus, Search, FileText, AlertCircle, X, Trash2, 
  AlertTriangle, ShieldAlert, CheckCircle2, DollarSign, Truck, Calendar, MapPin
} from 'lucide-react';

interface OrdersViewProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  accounts: Account[];
  products: Product[];
  setProducts?: React.Dispatch<React.SetStateAction<Product[]>>;
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  deliveries?: Delivery[];
  setDeliveries?: React.Dispatch<React.SetStateAction<Delivery[]>>;
  stockMovements?: StockMovement[];
  setStockMovements?: React.Dispatch<React.SetStateAction<StockMovement[]>>;
  currentRole: UserRole;
  stateMode: ComponentStateMode;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  setOrders,
  accounts,
  products,
  setProducts,
  invoices,
  setInvoices,
  deliveries,
  setDeliveries,
  stockMovements,
  setStockMovements,
  currentRole,
  stateMode
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  // Form states for creating order
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);
  const [currentProductId, setCurrentProductId] = useState(products[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(5);
  const [lineDiscount, setLineDiscount] = useState<number>(0);
  const [deliveryFee, setDeliveryFee] = useState<number>(10000);
  
  // Price Override
  const [isPriceOverridden, setIsPriceOverridden] = useState(false);
  const [customUnitPrice, setCustomUnitPrice] = useState<number>(0);
  const [priceOverrideReason, setPriceOverrideReason] = useState('');

  // Credit Limit Check & CEO Override
  const [overCreditWarning, setOverCreditWarning] = useState<string | null>(null);
  const [overCreditReason, setOverCreditReason] = useState('');
  const [allowOverCreditOverride, setAllowOverCreditOverride] = useState(false);

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
        <AlertTriangle className="w-12 h-12 text-red-600 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Failed to Load Orders Ledger</h3>
        <p className="text-xs text-slate-500">Error retrieving confirmed orders and invoice records.</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg cursor-pointer">
          Retry
        </button>
      </div>
    );
  }

  // 3. Empty State
  if (stateMode === 'empty' || orders.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200 max-w-xl mx-auto my-12 space-y-4">
        <ShoppingCart className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">No Orders Recorded</h3>
        <p className="text-xs text-slate-500">There are no orders in the system. Create an order to generate invoices and dispatch orders.</p>
        {currentRole !== 'Viewer' && currentRole !== 'Depot / Dispatch' && (
          <button onClick={() => setIsCreateModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg cursor-pointer">
            Create First Order
          </button>
        )}
      </div>
    );
  }

  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || accounts[0];
  const selectedProduct = products.find(p => p.id === currentProductId) || products[0];

  // Calculate current customer outstanding balance
  const customerUnpaidInvoices = invoices.filter(i => i.accountId === selectedAccount?.id && i.status !== 'Paid');
  const customerCurrentReceivables = customerUnpaidInvoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0);
  
  const currentLinesSubtotal = orderLines.reduce((sum, l) => sum + l.subtotal, 0);
  const potentialTotalAmount = currentLinesSubtotal + deliveryFee;
  const potentialExposure = customerCurrentReceivables + potentialTotalAmount;
  const isCreditBreached = selectedAccount?.paymentType === 'Credit' && potentialExposure > (selectedAccount?.creditLimit || 0);

  const filteredOrders = orders.filter(ord => {
    const matchesSearch = ord.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ord.accountName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || ord.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddLineItem = () => {
    if (!selectedProduct) return;
    if (quantity <= 0) {
      alert('Quantity must be greater than zero.');
      return;
    }

    const unitPrice = isPriceOverridden && customUnitPrice > 0 ? customUnitPrice : selectedProduct.listPrice;
    
    if (isPriceOverridden && !priceOverrideReason.trim()) {
      alert('PRD Requirement: Overriding list price requires a recorded justification reason.');
      return;
    }

    const subtotal = Math.max(0, (unitPrice * quantity) - lineDiscount);

    const newLine: OrderLine = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      packSize: selectedProduct.packSize,
      quantity,
      unitPrice,
      landedCost: selectedProduct.landedCost,
      discount: lineDiscount,
      subtotal
    };

    setOrderLines([...orderLines, newLine]);
    // Reset line fields
    setLineDiscount(0);
    setIsPriceOverridden(false);
    setCustomUnitPrice(0);
    setPriceOverrideReason('');
  };

  const handleRemoveLineItem = (index: number) => {
    setOrderLines(orderLines.filter((_, idx) => idx !== index));
  };

  const handleCreateOrder = (status: OrderStatus = 'Confirmed') => {
    if (orderLines.length === 0) {
      alert('Please add at least one line item to the order.');
      return;
    }

    if (!selectedAccount) return;

    // Credit limit check on Confirmed orders
    if (status === 'Confirmed' && selectedAccount.paymentType === 'Credit') {
      if (isCreditBreached) {
        if (currentRole !== 'CEO') {
          alert(`Credit Limit Exceeded!\nCustomer approved limit is ${formatCurrency(selectedAccount.creditLimit)}, but current exposure would reach ${formatCurrency(potentialExposure)}.\n\nOnly CEO / Owner Al-Amin can authorize credit limit overrides.`);
          return;
        } else if (!allowOverCreditOverride || !overCreditReason.trim()) {
          alert('As CEO, you must provide an override reason to approve this order beyond the customer credit limit.');
          return;
        }
      }
    }

    const orderSubtotal = orderLines.reduce((sum, l) => sum + l.subtotal, 0);
    const totalOrderAmount = orderSubtotal + deliveryFee;
    const totalDiscount = orderLines.reduce((sum, l) => sum + l.discount, 0);

    const newOrderId = `ORD-2026-${Math.floor(100 + Math.random() * 900)}`;
    const today = new Date().toISOString().split('T')[0];

    const newOrder: Order = {
      id: newOrderId,
      accountId: selectedAccount.id,
      accountName: selectedAccount.name,
      date: today,
      lines: orderLines,
      deliveryFee,
      discount: totalDiscount,
      totalAmount: totalOrderAmount,
      status,
      priceOverrideReason: priceOverrideReason || undefined,
      overCreditOverride: isCreditBreached && allowOverCreditOverride,
      overCreditReason: isCreditBreached ? overCreditReason : undefined,
      createdBy: currentRole,
      createdAt: today
    };

    // If confirmed, automatically generate official Invoice
    if (status === 'Confirmed') {
      const newInvoice: Invoice = {
        id: `INV-${newOrderId}`,
        orderId: newOrderId,
        accountId: selectedAccount.id,
        accountName: selectedAccount.name,
        issueDate: today,
        dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
        totalAmount: totalOrderAmount,
        paidAmount: selectedAccount.paymentType === 'Cash' ? 0 : 0,
        status: 'Unpaid',
        daysOverdue: 0
      };
      setInvoices([newInvoice, ...invoices]);

      // Automatically generate daily delivery dispatch entry
      if (setDeliveries && deliveries) {
        const newDelivery: Delivery = {
          id: `DEL-${Date.now()}`,
          orderId: newOrderId,
          accountId: selectedAccount.id,
          accountName: selectedAccount.name,
          area: selectedAccount.area,
          scheduledDate: today,
          status: 'Pending',
          dispatchDriver: 'Musa Garba'
        };
        setDeliveries([newDelivery, ...deliveries]);
      }

      // Record dispatch movements in inventory
      if (setStockMovements && stockMovements && setProducts) {
        const newMovements: StockMovement[] = orderLines.map(l => ({
          id: `SM-DISP-${Date.now()}-${l.productId}`,
          productId: l.productId,
          productName: l.productName,
          packSize: l.packSize,
          type: 'Dispatched',
          quantity: l.quantity,
          referenceId: newOrderId,
          reason: `Dispatched for order ${newOrderId}`,
          date: today,
          createdBy: currentRole
        }));
        setStockMovements([...newMovements, ...stockMovements]);

        // Decrement stock in products
        setProducts(products.map(p => {
          const matchedLine = orderLines.find(l => l.productId === p.id);
          return matchedLine ? { ...p, currentStock: Math.max(0, p.currentStock - matchedLine.quantity) } : p;
        }));
      }
    }

    setOrders([newOrder, ...orders]);
    setIsCreateModalOpen(false);
    resetOrderForm();
  };

  const resetOrderForm = () => {
    setOrderLines([]);
    setDeliveryFee(10000);
    setIsPriceOverridden(false);
    setCustomUnitPrice(0);
    setPriceOverrideReason('');
    setOverCreditWarning(null);
    setOverCreditReason('');
    setAllowOverCreditOverride(false);
  };

  const canCreateOrder = currentRole === 'CEO' || currentRole === 'Sales Lead';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
            Orders & Invoices Directory ({orders.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Confirmed lubricant orders, price override auditing, credit exposure checks, and instant PDF sales invoices.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => exportToCSV('kano_mobil_orders', orders)} 
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer transition-colors"
          >
            Export CSV
          </button>
          {canCreateOrder && (
            <button 
              onClick={() => setIsCreateModalOpen(true)} 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Order</span>
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
            placeholder="Search by Order ID or Customer Account..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium"
          >
            <option value="All">All Order Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                <th className="p-4">Order ID & Date</th>
                <th className="p-4">Customer Account</th>
                <th className="p-4">Line Items</th>
                <th className="p-4">Total Amount (NGN)</th>
                <th className="p-4">Status & Flags</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredOrders.map(ord => {
                const acc = accounts.find(a => a.id === ord.accountId);
                const inv = invoices.find(i => i.orderId === ord.id);

                return (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{ord.id}</div>
                      <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{ord.date}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{ord.accountName}</div>
                      <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-blue-500" />
                        <span>{acc?.area || 'Kano Depot'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-700">
                      <div className="font-semibold">{ord.lines.length} products</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">
                        {ord.lines.map(l => `${l.quantity}× ${l.productName}`).join(', ')}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-black text-slate-900 text-sm">{formatCurrency(ord.totalAmount)}</div>
                      {ord.discount > 0 && (
                        <div className="text-[10px] text-emerald-600">Disc: -{formatCurrency(ord.discount)}</div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          ord.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' :
                          ord.status === 'Delivered' ? 'bg-blue-100 text-blue-800' :
                          ord.status === 'Draft' ? 'bg-slate-200 text-slate-700' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {ord.status}
                        </span>
                        {ord.overCreditOverride && (
                          <span className="text-[9px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded border border-amber-300">
                            CEO Credit Override
                          </span>
                        )}
                        {ord.priceOverrideReason && (
                          <span className="text-[9px] font-bold bg-purple-100 text-purple-900 px-1.5 py-0.2 rounded border border-purple-300">
                            Price Override
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedOrderDetails(ord)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs cursor-pointer"
                        >
                          View
                        </button>
                        <button
                          onClick={() => {
                            const accountData = acc || { name: ord.accountName, area: 'Kano', contact: 'N/A', phone: 'N/A', paymentType: 'Credit' };
                            const invoiceData = inv || { 
                              id: `INV-${ord.id}`, 
                              issueDate: ord.date, 
                              dueDate: ord.date, 
                              totalAmount: ord.totalAmount, 
                              paidAmount: 0 
                            };
                            generateInvoicePDF(ord, accountData, invoiceData);
                          }}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded text-xs inline-flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>PDF Invoice</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">{selectedOrderDetails.id}</h3>
                <p className="text-xs text-slate-500">Customer: {selectedOrderDetails.accountName} | Date: {selectedOrderDetails.date}</p>
              </div>
              <button onClick={() => setSelectedOrderDetails(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b">
                    <tr>
                      <th className="p-3">Product Description</th>
                      <th className="p-3">Qty</th>
                      <th className="p-3">Unit Price</th>
                      <th className="p-3">Discount</th>
                      <th className="p-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-xs">
                    {selectedOrderDetails.lines.map((l, i) => (
                      <tr key={i}>
                        <td className="p-3 font-bold text-slate-900">{l.productName} ({l.packSize})</td>
                        <td className="p-3 text-slate-700">{l.quantity}</td>
                        <td className="p-3 text-slate-700">{formatCurrency(l.unitPrice)}</td>
                        <td className="p-3 text-slate-500">{formatCurrency(l.discount)}</td>
                        <td className="p-3 text-right font-black text-slate-900">{formatCurrency(l.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between p-3 bg-slate-50 rounded-xl font-bold">
                <span>Delivery Fee:</span>
                <span>{formatCurrency(selectedOrderDetails.deliveryFee)}</span>
              </div>

              <div className="flex justify-between p-3 bg-blue-50 rounded-xl font-black text-sm text-blue-950">
                <span>Total Order Amount:</span>
                <span>{formatCurrency(selectedOrderDetails.totalAmount)}</span>
              </div>

              {selectedOrderDetails.priceOverrideReason && (
                <div className="p-3 bg-purple-50 text-purple-900 rounded-lg border border-purple-200">
                  <strong>Price Override Reason:</strong> {selectedOrderDetails.priceOverrideReason}
                </div>
              )}

              {selectedOrderDetails.overCreditReason && (
                <div className="p-3 bg-amber-50 text-amber-900 rounded-lg border border-amber-200">
                  <strong>CEO Credit Override Reason:</strong> {selectedOrderDetails.overCreditReason}
                </div>
              )}

              <div className="flex justify-end pt-4 border-t">
                <button onClick={() => setSelectedOrderDetails(null)} className="px-5 py-2 bg-slate-800 text-white font-bold rounded-lg cursor-pointer">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">Create New Sales Order</h3>
                <p className="text-xs text-slate-500">Record customer order with automatic credit check and delivery dispatch</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Account Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Account *</label>
                <select
                  value={selectedAccountId}
                  onChange={e => setSelectedAccountId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 font-medium"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.area}) - {a.paymentType} {a.paymentType === 'Credit' ? `[Limit: ${formatCurrency(a.creditLimit)}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Account Exposure Info Banner */}
              {selectedAccount && (
                <div className={`p-3.5 rounded-xl border text-xs ${
                  isCreditBreached ? 'bg-red-50/80 border-red-300 text-red-950' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-bold">Terms: </span>{selectedAccount.paymentType}
                      {selectedAccount.paymentType === 'Credit' && ` (Approved Limit: ${formatCurrency(selectedAccount.creditLimit)})`}
                    </div>
                    <div>
                      <span className="font-bold">Current Receivables: </span>{formatCurrency(customerCurrentReceivables)}
                    </div>
                  </div>
                  {isCreditBreached && (
                    <div className="mt-2 text-red-700 font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Warning: This order exceeds customer credit limit by {formatCurrency(potentialExposure - selectedAccount.creditLimit)}. CEO approval required to confirm.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Add Line Items Section */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-900 text-sm">Add Lubricant Line Item</div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-medium text-slate-600 mb-1">Product</label>
                    <select
                      value={currentProductId}
                      onChange={e => {
                        setCurrentProductId(e.target.value);
                        setIsPriceOverridden(false);
                      }}
                      className="w-full p-2 border border-slate-300 rounded bg-white text-xs"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.packSize}) — List Price: {formatCurrency(p.listPrice)} (Stock: {p.currentStock})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Quantity (Units)</label>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={e => setQuantity(Number(e.target.value))}
                      className="w-full p-2 border border-slate-300 rounded text-xs font-bold"
                    />
                  </div>
                </div>

                {/* Price Override Options */}
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="priceOverrideCheck"
                      checked={isPriceOverridden}
                      onChange={e => setIsPriceOverridden(e.target.checked)}
                      className="rounded text-blue-600 cursor-pointer"
                    />
                    <label htmlFor="priceOverrideCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                      Override Standard Price List
                    </label>
                  </div>

                  {isPriceOverridden && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 p-3 bg-purple-50/70 border border-purple-200 rounded-lg">
                      <div>
                        <label className="block font-bold text-purple-900 mb-1">Overridden Unit Price (NGN) *</label>
                        <input
                          type="number"
                          value={customUnitPrice}
                          onChange={e => setCustomUnitPrice(Number(e.target.value))}
                          placeholder={`Standard: ${selectedProduct?.listPrice}`}
                          className="w-full p-2 border border-purple-300 rounded bg-white text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-purple-900 mb-1">Override Reason / Justification *</label>
                        <input
                          type="text"
                          value={priceOverrideReason}
                          onChange={e => setPriceOverrideReason(e.target.value)}
                          placeholder="e.g. Bulk promotional agreement, competitor match"
                          className="w-full p-2 border border-purple-300 rounded bg-white text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-slate-500">
                    Line Total: <strong className="text-slate-900">{formatCurrency((isPriceOverridden && customUnitPrice > 0 ? customUnitPrice : (selectedProduct?.listPrice || 0)) * quantity)}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer"
                  >
                    Add Product to Order
                  </button>
                </div>
              </div>

              {/* Order Lines List */}
              <div>
                <span className="font-bold text-slate-900 block mb-2">Order Line Items ({orderLines.length})</span>
                {orderLines.length === 0 ? (
                  <p className="text-slate-400 italic p-3 bg-slate-50 rounded-lg border text-center">No line items added yet.</p>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 border-b">
                        <tr>
                          <th className="p-2.5">Product</th>
                          <th className="p-2.5">Qty</th>
                          <th className="p-2.5">Price</th>
                          <th className="p-2.5 text-right">Subtotal</th>
                          <th className="p-2.5 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {orderLines.map((l, idx) => (
                          <tr key={idx}>
                            <td className="p-2.5 font-bold text-slate-900">{l.productName} ({l.packSize})</td>
                            <td className="p-2.5">{l.quantity}</td>
                            <td className="p-2.5">{formatCurrency(l.unitPrice)}</td>
                            <td className="p-2.5 text-right font-bold text-slate-900">{formatCurrency(l.subtotal)}</td>
                            <td className="p-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveLineItem(idx)}
                                className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Delivery Fee & Total */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Depot Dispatch Delivery Fee (NGN)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={deliveryFee}
                    onChange={e => setDeliveryFee(Number(e.target.value))}
                    className="w-full p-2.5 border rounded-lg font-bold"
                  />
                </div>
                <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-200 flex flex-col justify-center text-right">
                  <span className="text-[11px] font-bold text-blue-900">Grand Total Payable</span>
                  <span className="text-xl font-black text-blue-950">{formatCurrency(potentialTotalAmount)}</span>
                </div>
              </div>

              {/* CEO Credit Limit Override Section (if credit breached) */}
              {isCreditBreached && (
                <div className="p-4 bg-amber-50/80 border border-amber-300 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="overCreditCheck"
                      disabled={currentRole !== 'CEO'}
                      checked={allowOverCreditOverride}
                      onChange={e => setAllowOverCreditOverride(e.target.checked)}
                      className="rounded text-amber-600 cursor-pointer"
                    />
                    <label htmlFor="overCreditCheck" className="text-xs font-bold text-amber-950 cursor-pointer">
                      Authorize CEO Credit Limit Override
                    </label>
                  </div>
                  {currentRole !== 'CEO' ? (
                    <p className="text-[11px] text-amber-800">
                      You are signed in as <strong>{currentRole}</strong>. Overriding credit limits requires switching to <strong>CEO / Owner</strong>.
                    </p>
                  ) : allowOverCreditOverride ? (
                    <div>
                      <label className="block font-bold text-amber-950 mb-1">Reason for Credit Limit Override *</label>
                      <input
                        type="text"
                        required
                        value={overCreditReason}
                        onChange={e => setOverCreditReason(e.target.value)}
                        placeholder="e.g. Promised payment clearance on Friday from state transport tender"
                        className="w-full p-2 border border-amber-300 rounded bg-white text-xs"
                      />
                    </div>
                  ) : null}
                </div>
              )}

              {/* Form Actions */}
              <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateOrder('Draft')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg cursor-pointer"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateOrder('Confirmed')}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow cursor-pointer"
                >
                  Confirm Order & Generate Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
