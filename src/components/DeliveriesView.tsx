import React, { useState } from 'react';
import { Delivery, UserRole } from '../types';
import { exportToCSV } from '../utils/export';
import { ComponentStateMode } from '../App';
import { 
  Truck, Search, Filter, FileSpreadsheet, CheckCircle2, AlertTriangle, 
  X, MapPin, Calendar, User, Clock, AlertCircle 
} from 'lucide-react';

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
  const [areaFilter, setAreaFilter] = useState<string>('All');
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

  // Form states
  const [deliveryStatus, setDeliveryStatus] = useState<'Delivered' | 'Failed'>('Delivered');
  const [receiverName, setReceiverName] = useState('');
  const [failReason, setFailReason] = useState('');
  const [driverName, setDriverName] = useState('Musa Garba');

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
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg cursor-pointer">
          Retry
        </button>
      </div>
    );
  }

  // 3. Empty State
  if (stateMode === 'empty' || deliveries.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200 max-w-xl mx-auto my-12 space-y-4">
        <Truck className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">No Deliveries Scheduled</h3>
        <p className="text-xs text-slate-500">There are no dispatch deliveries scheduled for Kano areas currently.</p>
      </div>
    );
  }

  const kanoAreas = Array.from(new Set(deliveries.map(d => d.area)));

  const filteredDeliveries = deliveries.filter(d => {
    const matchesSearch = d.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.orderId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || d.status === statusFilter;
    const matchesArea = areaFilter === 'All' || d.area === areaFilter;
    return matchesSearch && matchesStatus && matchesArea;
  });

  const handleUpdateDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDelivery) return;

    if (deliveryStatus === 'Delivered' && !receiverName.trim()) {
      alert('PRD Requirement: Name of the receiver is mandatory to confirm delivery.');
      return;
    }

    if (deliveryStatus === 'Failed' && !failReason.trim()) {
      alert('PRD Requirement: A reason is mandatory for failed deliveries.');
      return;
    }

    setDeliveries(deliveries.map(d => d.id === selectedDelivery.id ? {
      ...d,
      status: deliveryStatus,
      receiverName: deliveryStatus === 'Delivered' ? receiverName : undefined,
      failReason: deliveryStatus === 'Failed' ? failReason : undefined,
      dispatchDriver: driverName || d.dispatchDriver
    } : d));

    setSelectedDelivery(null);
    setReceiverName('');
    setFailReason('');
  };

  const pendingCount = deliveries.filter(d => d.status === 'Pending').length;
  const deliveredCount = deliveries.filter(d => d.status === 'Delivered').length;
  const failedCount = deliveries.filter(d => d.status === 'Failed').length;

  const canUpdateDelivery = currentRole === 'CEO' || currentRole === 'Depot / Dispatch' || currentRole === 'Sales Lead';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-blue-600" />
            Daily Dispatch & Deliveries Ledger ({deliveries.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Grouped by Kano area with driver route assignment, receiver signature verification, and failed delivery auditing.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => exportToCSV('kano_mobil_deliveries', deliveries)} 
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer transition-colors"
          >
            Export Deliveries CSV
          </button>
        </div>
      </div>

      {/* Dispatch Status Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase">Pending Dispatch</div>
            <div className="text-2xl font-black text-amber-600 mt-1">{pendingCount} Orders</div>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase">Delivered & Verified</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{deliveredCount} Orders</div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase">Failed / Rescheduled</div>
            <div className="text-2xl font-black text-red-600 mt-1">{failedCount} Orders</div>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer, Kano area, or Order ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={areaFilter}
            onChange={e => setAreaFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium"
          >
            <option value="All">All Kano Areas</option>
            {kanoAreas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Delivered">Delivered</option>
            <option value="Failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                <th className="p-4">Delivery Ref & Order</th>
                <th className="p-4">Customer & Kano Area</th>
                <th className="p-4">Scheduled Date</th>
                <th className="p-4">Dispatch Driver</th>
                <th className="p-4">Status & Proof</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredDeliveries.map(d => (
                <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{d.id}</div>
                    <div className="text-slate-500 text-[11px] font-mono">{d.orderId}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-slate-900 text-sm">{d.accountName}</div>
                    <div className="text-blue-600 font-semibold flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-blue-500" />
                      <span>{d.area}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600 font-medium">{d.scheduledDate}</td>
                  <td className="p-4">
                    <span className="font-semibold text-slate-800">{d.dispatchDriver}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        d.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                        d.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {d.status}
                      </span>
                      {d.receiverName && (
                        <span className="text-[10px] text-slate-500">
                          Recv by: <strong className="text-slate-700">{d.receiverName}</strong>
                        </span>
                      )}
                      {d.failReason && (
                        <span className="text-[10px] text-red-600 italic">
                          Fail: {d.failReason}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    {canUpdateDelivery && (
                      <button
                        onClick={() => {
                          setSelectedDelivery(d);
                          setDeliveryStatus(d.status === 'Failed' ? 'Failed' : 'Delivered');
                          setReceiverName(d.receiverName || '');
                          setFailReason(d.failReason || '');
                          setDriverName(d.dispatchDriver);
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg cursor-pointer transition-colors"
                      >
                        Update
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Delivery Modal */}
      {selectedDelivery && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Update Dispatch Status</h3>
                <p className="text-xs text-slate-500">{selectedDelivery.accountName} ({selectedDelivery.area})</p>
              </div>
              <button onClick={() => setSelectedDelivery(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateDelivery} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Outcome Status *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryStatus('Delivered')}
                    className={`p-2.5 rounded-lg font-bold border transition-colors cursor-pointer ${
                      deliveryStatus === 'Delivered'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Delivered
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryStatus('Failed')}
                    className={`p-2.5 rounded-lg font-bold border transition-colors cursor-pointer ${
                      deliveryStatus === 'Failed'
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Delivery Failed
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Dispatch Driver</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={e => setDriverName(e.target.value)}
                  className="w-full p-2.5 border rounded-lg text-slate-900 font-medium"
                />
              </div>

              {deliveryStatus === 'Delivered' ? (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Name of Receiver *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Malam Aminu (Workshop Manager)"
                    value={receiverName}
                    onChange={e => setReceiverName(e.target.value)}
                    className="w-full p-2.5 border rounded-lg text-slate-900 font-medium"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">PRD Requirement: Name of receiver is mandatory to verify delivery.</p>
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Reason for Delivery Failure *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shop closed on arrival, road inaccessible due to rain, customer requested next day"
                    value={failReason}
                    onChange={e => setFailReason(e.target.value)}
                    className="w-full p-2.5 border rounded-lg text-slate-900 font-medium"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">PRD Requirement: Failed deliveries carry a mandatory reason.</p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedDelivery(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white font-bold rounded-lg shadow cursor-pointer ${
                    deliveryStatus === 'Delivered' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Save Dispatch Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
