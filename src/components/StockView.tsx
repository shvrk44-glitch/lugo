import React, { useState } from 'react';
import { Product, StockMovement, UserRole } from '../types';
import { exportToCSV } from '../utils/export';
import { ComponentStateMode } from '../App';
import { Box, Plus, Search, FileSpreadsheet, ShieldCheck, AlertTriangle, X } from 'lucide-react';

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
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);

  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [quantityReceived, setQuantityReceived] = useState<number>(100);
  const [batchNumber, setBatchNumber] = useState(`MOB-BAT-2026-01`);
  const [supplierRef, setSupplierRef] = useState(`SUP-REC-991`);

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
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg">Retry</button>
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
        <button onClick={() => setIsReceiveModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg">Receive Goods</button>
      </div>
    );
  }

  const handleReceiveGoods = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    setProducts(products.map(p => p.id === prod.id ? { ...p, currentStock: p.currentStock + quantityReceived } : p));
    const newMovement: StockMovement = {
      id: `SM-${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      packSize: prod.packSize,
      type: 'Received',
      quantity: quantityReceived,
      batchNumber,
      referenceId: supplierRef,
      reason: 'Depot replenishment',
      date: new Date().toISOString().split('T')[0],
      createdBy: currentRole
    };
    setStockMovements([newMovement, ...stockMovements]);
    setIsReceiveModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Box className="w-6 h-6 text-blue-600" />
            Depot Stock & Batch Traceability ({products.length} Products)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Track lubricant inventory by product, pack size, and anti-counterfeit batch numbers.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={() => exportToCSV('kano_mobil_stock', products)} className="px-3.5 py-2 bg-slate-100 rounded-lg text-xs font-bold cursor-pointer">Export CSV</button>
          {currentRole !== 'Viewer' && (
            <button onClick={() => setIsReceiveModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold shadow cursor-pointer flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              <span>Receive Goods</span>
            </button>
          )}
        </div>
      </div>

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
                <th className="p-3">Current Stock</th>
                <th className="p-3">Reorder Level</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {products.map(prod => (
                <tr key={prod.id} className="hover:bg-slate-50/80">
                  <td className="p-3 font-bold text-slate-900">{prod.name}</td>
                  <td className="p-3"><span className="bg-slate-100 px-2 py-0.5 rounded font-semibold">{prod.packSize}</span></td>
                  <td className="p-3 text-slate-600">{prod.category}</td>
                  <td className="p-3 font-black text-slate-900">{prod.currentStock} units</td>
                  <td className="p-3 text-slate-500">{prod.reorderLevel} units</td>
                  <td className="p-3">
                    {prod.currentStock <= prod.reorderLevel ? (
                      <span className="px-2.5 py-1 bg-red-100 text-red-800 font-bold rounded-full text-[10px]">Reorder Needed</span>
                    ) : (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">Adequate</span>
                    )}
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
