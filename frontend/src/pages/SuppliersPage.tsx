import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { 
  ShieldCheck, Star, Clock, DollarSign, Search, Award, RefreshCw, 
  Plus, Edit2, Trash2, X, Phone, Mail 
} from 'lucide-react';
import api from '../services/api';

interface Supplier {
  id: number;
  name: string;
  material: string;
  price: number;
  delivery_days: number;
  rating: number;
  is_preferred: boolean;
  phone?: string;
  email?: string;
}

interface SupplierComparison {
  supplier_id: number;
  supplier_name: string;
  unit_price: number;
  delivery_days: number;
  rating: number;
  total_price: number;
  savings: number;
  comparison: Array<{
    id: number;
    name: string;
    price: number;
    delivery_days: number;
    rating: number;
    is_recommended: boolean;
  }>;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [comparison, setComparison] = useState<SupplierComparison | null>(null);
  
  const [loadingList, setLoadingList] = useState(true);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<number | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [material, setMaterial] = useState('Iron Rods (10m)');
  const [price, setPrice] = useState(0.0);
  const [deliveryDays, setDeliveryDays] = useState(3);
  const [rating, setRating] = useState(5.0);
  const [isPreferred, setIsPreferred] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Sorting
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      setSuppliers(res.data);
      
      // Extract unique material names
      const uniqueMaterials: string[] = Array.from(new Set(res.data.map((s: Supplier) => s.material)));
      setMaterials(uniqueMaterials);
      if (uniqueMaterials.length > 0 && !selectedMaterial) {
        setSelectedMaterial(uniqueMaterials[0]);
      }
    } catch (e) {
      console.error("Error fetching suppliers", e);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const runComparison = async () => {
    if (!selectedMaterial) return;
    setLoadingCompare(true);
    try {
      const res = await api.get(`/suppliers/compare?material=${encodeURIComponent(selectedMaterial)}&quantity=100`);
      setComparison(res.data);
    } catch (e) {
      console.error("Error comparing suppliers", e);
    } finally {
      setLoadingCompare(false);
    }
  };

  useEffect(() => {
    if (selectedMaterial) {
      runComparison();
    }
  }, [selectedMaterial]);

  const openAddModal = () => {
    setEditingSupplier(null);
    setName('');
    setMaterial(materials[0] || 'Iron Rods (10m)');
    setPrice(0.0);
    setDeliveryDays(3);
    setRating(5.0);
    setIsPreferred(false);
    setPhone('');
    setEmail('');
    setShowFormModal(true);
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setName(supplier.name);
    setMaterial(supplier.material);
    setPrice(supplier.price);
    setDeliveryDays(supplier.delivery_days);
    setRating(supplier.rating);
    setIsPreferred(supplier.is_preferred);
    setPhone(supplier.phone || '');
    setEmail(supplier.email || '');
    setShowFormModal(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      material,
      price: Number(price),
      delivery_days: Number(deliveryDays),
      rating: Number(rating),
      is_preferred: isPreferred,
      phone: phone || null,
      email: email || null
    };

    try {
      if (editingSupplier) {
        await api.put(`/suppliers/${editingSupplier.id}`, payload);
      } else {
        await api.post('/suppliers', payload);
      }
      setShowFormModal(false);
      fetchSuppliers();
      if (material === selectedMaterial) {
        runComparison();
      }
    } catch (error) {
      console.error("Error saving supplier", error);
    }
  };

  const confirmDelete = (id: number) => {
    setSupplierToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDeleteSupplier = async () => {
    if (supplierToDelete === null) return;
    try {
      await api.delete(`/suppliers/${supplierToDelete}`);
      setShowDeleteModal(false);
      setSupplierToDelete(null);
      fetchSuppliers();
      runComparison();
    } catch (error) {
      console.error("Error deleting supplier", error);
    }
  };

  // Sort logic for suppliers list
  const sortedSuppliers = [...suppliers].sort((a, b) => {
    if (!sortOrder) return 0;
    return sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
  });

  const toggleSort = () => {
    if (sortOrder === null) setSortOrder('asc');
    else if (sortOrder === 'asc') setSortOrder('desc');
    else setSortOrder(null);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-blue-500" />
            Supplier Intelligence
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">AI-driven supplier evaluation, scoring algorithms, and automated quote audits.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" /> Add Supplier
        </button>
      </div>

      {/* Supplier Comparison Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selector card */}
        <div className="glass-card flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Search className="w-4 h-4 text-blue-400" />
              <h3 className="font-semibold text-xs text-slate-300 uppercase tracking-wider">Select Material Audit</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">Choose a raw material to audit supplier prices and delivery estimates.</p>
            
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs font-semibold">Audit Item</label>
              {materials.length === 0 ? (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-500 text-xs">
                  No materials registered. Add a supplier first.
                </div>
              ) : (
                <select
                  value={selectedMaterial}
                  onChange={(e) => setSelectedMaterial(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                >
                  {materials.map((m, i) => (
                    <option key={i} value={m}>{m}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-800/80">
            {comparison && (
              <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2 text-blue-400">
                  <Award className="w-5 h-5 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider">AI Recommendation</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200">{comparison.supplier_name}</h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Recommended supplier based on price score (45%), lead delivery score (25%), and QA rating (30%).
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-300">
                  <div>Unit Price: <span className="font-semibold text-slate-100">${comparison.unit_price}</span></div>
                  <div>Delivery Days: <span className="font-semibold text-slate-100">{comparison.delivery_days} days</span></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Comparison Details / Charts */}
        <div className="glass-card lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Quotes & Lead Delivery Matrix</h3>
            {comparison && comparison.savings > 0 && (
              <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                Est Savings: ${comparison.savings.toLocaleString()} (on 100 units)
              </span>
            )}
          </div>

          {loadingCompare ? (
            <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-500 mr-2" />
              Running scoring algorithms...
            </div>
          ) : !comparison ? (
            <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
              Select a material to compare quotes.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Supplier Comparison Chart */}
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparison.comparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 9 }} />
                    <YAxis yAxisId="left" stroke="#3b82f6" tick={{ fontSize: 9 }} label={{ value: 'Price ($)', angle: -90, position: 'insideLeft', style: { fill: '#3b82f6', fontSize: 10 } }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" tick={{ fontSize: 9 }} label={{ value: 'Rating', angle: 90, position: 'insideRight', style: { fill: '#f59e0b', fontSize: 10 } }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }} />
                    <Bar yAxisId="left" dataKey="price" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                      {comparison.comparison.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.is_recommended ? '#10b981' : '#3b82f6'} />
                      ))}
                    </Bar>
                    <Bar yAxisId="right" dataKey="rating" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Comparison list - highlights cheapest supplier in green */}
              <div className="space-y-3.5 max-h-56 overflow-y-auto pr-2">
                {comparison.comparison.map((c) => (
                  <div 
                    key={c.id} 
                    className={`p-3 rounded-lg border text-xs flex justify-between items-center ${
                      c.is_recommended 
                        ? 'bg-emerald-500/10 border-emerald-500/30' 
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-slate-200">{c.name}</h4>
                      <div className="flex gap-4 mt-1.5 text-slate-500 text-[10px]">
                        <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-amber-500 fill-amber-500" /> {c.rating.toFixed(1)}</span>
                        <span className="flex items-center gap-0.5"><Clock className="w-3 h-3 text-slate-400" /> {c.delivery_days} days</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold text-sm ${c.is_recommended ? 'text-emerald-400' : 'text-slate-100'}`}>
                        ${c.price.toFixed(2)}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-0.5">per unit</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Suppliers Directory */}
      <div className="glass-card">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Qualified Supplier Directory
          </h3>
          
          <button
            onClick={toggleSort}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded border border-slate-700/50 flex items-center gap-1.5 transition-all"
          >
            <DollarSign className="w-3.5 h-3.5" />
            Sort by Price {sortOrder === 'asc' ? '▲' : sortOrder === 'desc' ? '▼' : ''}
          </button>
        </div>
        
        <div className="overflow-x-auto -mx-6 -mb-6">
          <table className="w-full text-left border-collapse text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-4 px-6">Supplier Name</th>
                <th className="py-4 px-6">Material Category</th>
                <th className="py-4 px-6 text-right">Standard Price</th>
                <th className="py-4 px-6 text-right">Delivery Days</th>
                <th className="py-4 px-6 text-right">QA Rating</th>
                <th className="py-4 px-6">Contact Info</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loadingList ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    <RefreshCw className="w-4 h-4 animate-spin inline-block mr-2 text-blue-500" />
                    Querying suppliers directories...
                  </td>
                </tr>
              ) : sortedSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No suppliers registered.
                  </td>
                </tr>
              ) : (
                sortedSuppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-200">{s.name}</td>
                    <td className="py-4 px-6 font-medium text-slate-400">{s.material}</td>
                    <td className="py-4 px-6 text-right font-bold text-slate-200">${s.price.toFixed(2)}</td>
                    <td className="py-4 px-6 text-right text-slate-400">{s.delivery_days} days</td>
                    <td className="py-4 px-6 text-right text-slate-100 font-medium">
                      <span className="inline-flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                        {s.rating.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-4 px-6 space-y-1 text-[11px] text-slate-400">
                      {s.phone && <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-500" /> {s.phone}</div>}
                      {s.email && <div className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-slate-500" /> {s.email}</div>}
                      {!s.phone && !s.email && <span className="text-slate-600">N/A</span>}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {s.is_preferred ? (
                        <span className="badge-success">Preferred</span>
                      ) : (
                        <span className="bg-slate-800 text-slate-400 border border-slate-700/50 text-[10px] px-2 py-0.5 rounded-full font-semibold">Active</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center gap-1.5">
                        <button 
                          onClick={() => openEditModal(s)}
                          className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
                          title="Edit Supplier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => confirmDelete(s.id)}
                          className="p-1.5 hover:bg-rose-950/20 rounded text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete Supplier"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supplier Add/Edit Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-200">{editingSupplier ? 'Edit Supplier' : 'Register New Supplier'}</h3>
              <button onClick={() => setShowFormModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveSupplier} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Supplier Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Apex Metals Corp"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Material Supplied</label>
                  <input 
                    type="text" 
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    required
                    placeholder="e.g. Iron Rods (10m)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Standard Price ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    required
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Lead Delivery Days</label>
                  <input 
                    type="number" 
                    value={deliveryDays}
                    onChange={(e) => setDeliveryDays(Number(e.target.value))}
                    required
                    placeholder="3"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">QA Rating (1-5)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    min="1.0"
                    max="5.0"
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    required
                    placeholder="5.0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Phone</label>
                  <input 
                    type="text" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +1 555-0199"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Email</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. contact@apexmetals.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="preferred"
                  checked={isPreferred}
                  onChange={(e) => setIsPreferred(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-800 text-blue-600 bg-slate-950 focus:ring-0"
                />
                <label htmlFor="preferred" className="text-slate-300 font-medium cursor-pointer">
                  Mark as Preferred Supplier for this material
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setShowFormModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-primary"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-xl shadow-2xl p-6 text-xs text-slate-300 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <Plus className="w-6 h-6 shrink-0 text-rose-500 transform rotate-45" />
              <h3 className="font-bold text-sm text-slate-200">Delete Supplier?</h3>
            </div>
            <p className="text-slate-400 leading-normal">
              Are you sure you want to delete this supplier? This will remove them from the supplier directories and comparisons.
            </p>
            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button 
                onClick={() => setShowDeleteModal(false)} 
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteSupplier} 
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
