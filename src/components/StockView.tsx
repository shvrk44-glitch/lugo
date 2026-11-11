import React, { useState } from 'react';
import { Product, StockMovement, UserRole, StockMovementType } from '../types';
import { exportToCSV, formatCurrency } from '../utils/export';
import { ComponentStateMode } from '../App';
import { 
  Box, Plus, Search, FileSpreadsheet, ShieldCheck, AlertTriangle, 
  X, ArrowDownLeft, ArrowUpRight, SlidersHorizontal, ShieldAlert, CheckCircle2 
} from 'lucide-react';

interface StockViewProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  stockMovements: StockMovement[];
  setStockMovements: React.Dispatch<React.SetStateAction<StockMovement[]>>;
  currentRole: UserRole;
  stateMode: ComponentStateMode;
}

export const StockView: React.FC<StockViewProps> = ({
  products,
  setProducts,
  stockMovements,
  setStockMovements,
  currentRole,
  stateMode
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

  // Form state for receiving goods
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [quantityReceived, setQuantityReceived] = useState<number>(100);
  const [batchNumber, setBatchNumber] = useState(`MOB-BAT-2026-${Math.floor(10 + Math.random() * 90)}`);
  const [supplierRef, setSupplierRef] = useState(`SUP-REC-${Math.floor(100 + Math.random() * 900)}`);

  // Form state for adjustment
  const [adjustmentProductId, setAdjustmentProductId] = useState(products[0]?.id || '');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState('Physical stock count reconciliation');

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
        <h3 className="text-lg font-bold text-slate-900">Failed to Load Depot Inventory</h3>
        <p className="text-xs text-slate-500">Database connection error while retrieving stock movements.</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg cursor-pointer">
          Retry
        </button>
      </div>
    );
  }

  // 3. Empty State
  if (stateMode === 'empty' || products.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200 max-w-xl mx-auto my-12 space-y-4">
        <Box className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">No Inventory Products Configured</h3>
        <p className="text-xs text-slate-500">There are no lubricant products configured in the Kano depot ledger.</p>
        {currentRole !== 'Viewer' && (
          <button onClick={() => setIsReceiveModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg cursor-pointer">
            Receive Goods
          </button>
        )}
      </div>
    );
  }

  const categories = Array.from(new Set(products.map(p => p.category)));

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.packSize.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleReceiveGoods = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    if (quantityReceived <= 0) {
      alert('Quantity received must be greater than zero.');
      return;
    }

    if (!batchNumber.trim()) {
      alert('PRD Requirement: Supplier batch number is mandatory for anti-counterfeit traceability.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    // Update product stock
    setProducts(products.map(p => p.id === prod.id ? { ...p, currentStock: p.currentStock + quantityReceived } : p));

    // Record stock movement
    const newMovement: StockMovement = {
      id: `SM-REC-${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      packSize: prod.packSize,
      type: 'Received',
      quantity: quantityReceived,
      batchNumber,
      referenceId: supplierRef,
      reason: 'Depot replenishment shipment',
      date: today,
      createdBy: currentRole
    };

    setStockMovements([newMovement, ...stockMovements]);
    setIsReceiveModalOpen(false);
    setQuantityReceived(100);
    setBatchNumber(`MOB-BAT-2026-${Math.floor(10 + Math.random() * 90)}`);
  };

  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.id === adjustmentProductId);
    if (!prod) return;

    if (adjustmentQuantity === 0) {
      alert('Adjustment quantity cannot be 0.');
      return;
    }

    if (!adjustmentReason.trim()) {
      alert('PRD Requirement: Stock adjustments require an explicit operational reason.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const newStock = Math.max(0, prod.currentStock + adjustmentQuantity);

    // Update product stock
    setProducts(products.map(p => p.id === prod.id ? { ...p, currentStock: newStock } : p));

    // Record stock movement
    const newMovement: StockMovement = {
      id: `SM-ADJ-${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      packSize: prod.packSize,
      type: 'Adjustment',
      quantity: adjustmentQuantity,
      reason: adjustmentReason,
      date: today,
      createdBy: currentRole
    };

    setStockMovements([newMovement, ...stockMovements]);
    setIsAdjustmentModalOpen(false);
    setAdjustmentQuantity(0);
    setAdjustmentReason('');
  };

  const canManageStock = currentRole === 'CEO' || currentRole === 'Depot / Dispatch';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Box className="w-6 h-6 text-blue-600" />
            Depot Stock & Anti-Counterfeit Batch Traceability ({products.length} Products)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Single warehouse record for genuine Mobil lubricants, supplier batch tracking, and days of cover.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => exportToCSV('kano_mobil_stock', products)} 
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer transition-colors"
          >
            Export Stock CSV
          </button>
          {canManageStock && (
            <>
              <button 
                onClick={() => setIsAdjustmentModalOpen(true)} 
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shadow cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Adjust Stock</span>
              </button>
              <button 
                onClick={() => setIsReceiveModalOpen(true)} 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Receive Goods</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search product name or pack size..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium"
          >
            <option value="All">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Products Stock Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          Current Depot Stock & Days of Cover
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                <th className="p-3">Product Name</th>
                <th className="p-3">Pack Size</th>
                <th className="p-3">Category</th>
                <th className="p-3">List Price (NGN)</th>
                <th className="p-3">Landed Cost (NGN)</th>
                <th className="p-3">Current Stock</th>
                <th className="p-3">Reorder Threshold</th>
                <th className="p-3">Days of Cover</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredProducts.map(prod => {
                const isLow = prod.currentStock <= prod.reorderLevel;
                // Calculate estimated days of cover: currentStock / (reorderLevel / 14)
                const estimatedDailyDispatch = Math.max(1, prod.reorderLevel / 14);
                const daysOfCover = Math.round(prod.currentStock / estimatedDailyDispatch);

                return (
                  <tr key={prod.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-bold text-slate-900">{prod.name}</td>
                    <td className="p-3">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-semibold">
                        {prod.packSize}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{prod.category}</td>
                    <td className="p-3 font-bold text-slate-900">{formatCurrency(prod.listPrice)}</td>
                    <td className="p-3 text-slate-500">{formatCurrency(prod.landedCost)}</td>
                    <td className="p-3 font-black text-slate-900 text-sm">{prod.currentStock} units</td>
                    <td className="p-3 text-slate-500">{prod.reorderLevel} units</td>
                    <td className="p-3 font-semibold text-slate-700">{daysOfCover} Days</td>
                    <td className="p-3">
                      {isLow ? (
                        <span className="px-2.5 py-1 bg-red-100 text-red-800 font-bold rounded-full text-[10px]">
                          Reorder Needed
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">
                          Adequate
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Movements & Batch Traceability Log */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-blue-600" />
              Stock Movement Ledger & Anti-Counterfeit Batches ({stockMovements.length})
            </h3>
            <p className="text-xs text-slate-500">Depot intake, customer dispatches, and audit adjustments with manufacturer batch codes</p>
          </div>
          <button 
            onClick={() => exportToCSV('kano_mobil_stock_movements', stockMovements)} 
            className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
          >
            Export Movement Log
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                <th className="p-3">Date</th>
                <th className="p-3">Movement Type</th>
                <th className="p-3">Product</th>
                <th className="p-3">Quantity</th>
                <th className="p-3">Batch Number</th>
                <th className="p-3">Reference / Order</th>
                <th className="p-3">Reason / Justification</th>
                <th className="p-3">Officer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {stockMovements.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/80">
                  <td className="p-3 text-slate-600">{m.date}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit ${
                      m.type === 'Received' ? 'bg-emerald-100 text-emerald-800' :
                      m.type === 'Dispatched' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {m.type === 'Received' ? <ArrowDownLeft className="w-3 h-3" /> :
                       m.type === 'Dispatched' ? <ArrowUpRight className="w-3 h-3" /> :
                       <SlidersHorizontal className="w-3 h-3" />}
                      <span>{m.type}</span>
                    </span>
                  </td>
                  <td className="p-3 font-bold text-slate-900">{m.productName} ({m.packSize})</td>
                  <td className="p-3 font-black text-slate-900">
                    {m.type === 'Received' ? `+${m.quantity}` :
                     m.type === 'Dispatched' ? `-${m.quantity}` :
                     m.quantity > 0 ? `+${m.quantity}` : m.quantity} units
                  </td>
                  <td className="p-3">
                    {m.batchNumber ? (
                      <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-bold text-[11px]">
                        {m.batchNumber}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">—</span>
                    )}
                  </td>
                  <td className="p-3 font-mono text-slate-700">{m.referenceId || '—'}</td>
                  <td className="p-3 text-slate-600">{m.reason || '—'}</td>
                  <td className="p-3 text-slate-500">{m.createdBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receive Goods Modal */}
      {isReceiveModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Receive Goods into Depot</h3>
                <p className="text-xs text-slate-500">Record incoming supplier shipments with verified batch number</p>
              </div>
              <button onClick={() => setIsReceiveModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReceiveGoods} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Description *</label>
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="w-full p-2.5 border rounded-lg bg-white text-slate-900 font-medium"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.packSize}) — Current: {p.currentStock} units
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Quantity Received (Units) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={quantityReceived}
                  onChange={e => setQuantityReceived(Number(e.target.value))}
                  className="w-full p-2.5 border rounded-lg font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Supplier Batch Number (Anti-Counterfeit) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MOB-BAT-2026-88"
                  value={batchNumber}
                  onChange={e => setBatchNumber(e.target.value)}
                  className="w-full p-2.5 border rounded-lg font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Supplier Delivery Reference / Waybill</label>
                <input
                  type="text"
                  placeholder="e.g. SUP-WB-10928"
                  value={supplierRef}
                  onChange={e => setSupplierRef(e.target.value)}
                  className="w-full p-2.5 border rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsReceiveModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow cursor-pointer"
                >
                  Confirm Intake
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {isAdjustmentModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Inventory Stock Adjustment</h3>
                <p className="text-xs text-slate-500">Record physical count reconciliation, damages, or audit variance</p>
              </div>
              <button onClick={() => setIsAdjustmentModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Description *</label>
                <select
                  value={adjustmentProductId}
                  onChange={e => setAdjustmentProductId(e.target.value)}
                  className="w-full p-2.5 border rounded-lg bg-white text-slate-900 font-medium"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.packSize}) — Current Stock: {p.currentStock} units
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Quantity Adjustment (+/- units) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. -5 for damaged cans or +10 for count surplus"
                  value={adjustmentQuantity}
                  onChange={e => setAdjustmentQuantity(Number(e.target.value))}
                  className="w-full p-2.5 border rounded-lg font-bold text-slate-900"
                />
                <p className="text-[10px] text-slate-500 mt-1">Use negative values for write-offs/damages, positive for count discovery.</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Adjustment *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly physical stock count reconciliation (-2 cans dented)"
                  value={adjustmentReason}
                  onChange={e => setAdjustmentReason(e.target.value)}
                  className="w-full p-2.5 border rounded-lg text-slate-900"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow cursor-pointer"
                >
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
