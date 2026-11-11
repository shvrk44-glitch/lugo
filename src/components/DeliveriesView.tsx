import React, { useState } from 'react';
import { Delivery, UserRole } from '../types';
import { exportToCSV } from '../utils/export';
import { ComponentStateMode } from '../App';
import { Truck, Search, Filter, FileSpreadsheet, CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface DeliveriesViewProps {
  deliveries: Delivery[];
  setDeliveries: React.Dispatch<React.SetStateAction<Delivery[]>>;
  currentRole: UserRole;
  stateMode: ComponentStateMode;
}

export const DeliveriesView: React.FC<DeliveriesViewProps> = ({
  deliveries,
  setDeliveries,
  currentRole,
  stateMode
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [receiverName, setReceiverName] = useState('');

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
        <h3 className="text-lg font-bold text-slate-900">Failed to Load Dispatch Deliveries</h3>
        <p className="text-xs text-slate-500">Error retrieving Kano area dispatch route records.</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg">Retry</button>
      </div>
    );
  }

  // 3. Empty State
  if (stateMode === 'empty' || deliveries.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200 max-w-xl mx-auto my-12 space-y-4">
        <Truck className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">No Deliveries Scheduled</h3>
        <p className="text-xs text-slate-500">There are no dispatch deliveries scheduled for Kano areas.</p>
      </div>
    );
  }

  const filteredDeliveries = deliveries.filter(d => {
    const matchesSearch = d.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.area.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDelivery) return;
    setDeliveries(deliveries.map(d => d.id === selectedDelivery.id ? { ...d, status: 'Delivered', receiverName } : d));
    setSelectedDelivery(null);
    setReceiverName('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-blue-600" />
            Daily Dispatch & Deliveries ({deliveries.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Grouped by Kano area with delivery verification and receiver confirmation.</p>
        </div>
        <button onClick={() => exportToCSV('kano_mobil_deliveries', deliveries)} className="px-3.5 py-2 bg-slate-100 rounded-lg text-xs font-bold cursor-pointer">Export CSV</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                <th className="p-4">Delivery & Order ID</th>
                <th className="p-4">Customer & Kano Area</th>
                <th className="p-4">Scheduled Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredDeliveries.map(d => (
                <tr key={d.id} className="hover:bg-slate-50/80">
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{d.id}</div>
                    <div className="text-slate-500 text-[11px]">{d.orderId}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{d.accountName}</div>
                    <div className="text-blue-600 font-semibold">{d.area}</div>
                  </td>
                  <td className="p-4 text-slate-600">{d.scheduledDate}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">{d.status}</span>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => setSelectedDelivery(d)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg cursor-pointer">Update</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedDelivery && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border">
            <h3 className="text-lg font-black mb-4">Confirm Delivery</h3>
            <form onSubmit={handleUpdate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">Receiver Name *</label>
                <input type="text" required value={receiverName} onChange={e => setReceiverName(e.target.value)} className="w-full p-2.5 border rounded" />
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setSelectedDelivery(null)} className="px-4 py-2 bg-slate-100 rounded font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded font-bold">Mark Delivered</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
