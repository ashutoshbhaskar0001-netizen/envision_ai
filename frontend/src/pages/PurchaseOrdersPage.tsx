import React, { useEffect, useState } from 'react';
import { FileText, CheckCircle2, XCircle, Clock, ExternalLink, RefreshCw } from 'lucide-react';
import api from '../services/api';

interface PurchaseOrder {
  id: number;
  sku: string;
  quantity: number;
  supplier_id: number;
  total_price: number;
  status: string;
  created_at: string;
  approved_at: string | null;
  notes: string | null;
  supplier?: {
    name: string;
    material: string;
  };
}

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/purchase-orders');
      setOrders(res.data);
    } catch (e) {
      console.error("Error fetching purchase orders", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const changeStatus = async (poId: number, status: string) => {
    try {
      await api.put(`/purchase-orders/${poId}/status?status=${status}`);
      fetchOrders();
    } catch (e) {
      console.error("Error changing purchase order status", e);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APPROVED':
      case 'COMPLETED':
        return (
          <span className="badge-success flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3" /> {status}
          </span>
        );
      case 'REJECTED':
        return (
          <span className="badge-danger flex items-center gap-1 w-fit">
            <XCircle className="w-3 h-3" /> {status}
          </span>
        );
      default:
        return (
          <span className="badge-warning flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3 animate-pulse" /> {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Purchase Order Ledger</h2>
          <p className="text-slate-400 text-sm mt-0.5">Procurement transactions history, supplier details, and authorization controls.</p>
        </div>
        <button 
          onClick={fetchOrders}
          className="btn-secondary"
        >
          <RefreshCw className="w-4 h-4 text-blue-400" /> Refresh Ledger
        </button>
      </div>

      {/* PO Table Card */}
      <div className="glass-card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-4 px-6">PO Number</th>
                <th className="py-4 px-6">SKU Code</th>
                <th className="py-4 px-6">Selected Supplier</th>
                <th className="py-4 px-6 text-right">Quantity</th>
                <th className="py-4 px-6 text-right">Total Price</th>
                <th className="py-4 px-6">Date Created</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Audit Notes</th>
                <th className="py-4 px-6 text-center">Admin Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    <RefreshCw className="w-4 h-4 animate-spin inline-block mr-2 text-blue-500" />
                    Querying transaction history...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No purchase orders recorded yet.
                  </td>
                </tr>
              ) : (
                orders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-4 px-6 font-mono text-blue-400 font-bold">PO-{po.id.toString().padStart(5, '0')}</td>
                    <td className="py-4 px-6 font-mono text-slate-400">{po.sku}</td>
                    <td className="py-4 px-6 font-semibold text-slate-200">
                      {po.supplier ? po.supplier.name : `Supplier ID: ${po.supplier_id}`}
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-slate-300">{po.quantity}</td>
                    <td className="py-4 px-6 text-right font-bold text-slate-100">${po.total_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="py-4 px-6 text-slate-500">{new Date(po.created_at).toLocaleString()}</td>
                    <td className="py-4 px-6">{getStatusBadge(po.status)}</td>
                    <td className="py-4 px-6 max-w-xs truncate text-slate-400" title={po.notes || ''}>
                      {po.notes || 'N/A'}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {po.status === 'Pending' ? (
                        <div className="flex gap-1.5 justify-center">
                          <button 
                            onClick={() => changeStatus(po.id, 'Approved')}
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-[10px] font-semibold border border-emerald-500/20 transition-all"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => changeStatus(po.id, 'Rejected')}
                            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-2 py-1 rounded text-[10px] font-semibold border border-rose-500/20 transition-all"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500">Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
