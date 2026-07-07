import React, { useEffect, useState } from 'react';
import { 
  Package, AlertTriangle, Plus, Edit2, Trash2, CheckCircle2, 
  Cpu, RefreshCw, X, Search as SearchIcon, ChevronLeft, ChevronRight, RotateCcw
} from 'lucide-react';
import api from '../services/api';

interface InventoryItem {
  id: number;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  reorder_point: number;
  reorder_quantity: number;
  overstock_threshold: number;
  unit_price: number;
  last_checked: string;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [triggeringCheck, setTriggeringCheck] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [msg, setMsg] = useState('');

  // Search & Filter & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Form State
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Raw Materials');
  const [quantity, setQuantity] = useState(0);
  const [reorderPoint, setReorderPoint] = useState(10);
  const [reorderQuantity, setReorderQuantity] = useState(50);
  const [overstockThreshold, setOverstockThreshold] = useState(500);
  const [unitPrice, setUnitPrice] = useState(0.0);

  const fetchInventory = async () => {
    try {
      const res = await api.get('/inventory');
      setItems(res.data);
    } catch (e) {
      console.error("Error fetching inventory data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setSku('');
    setName('');
    setCategory('Raw Materials');
    setQuantity(0);
    setReorderPoint(10);
    setReorderQuantity(50);
    setOverstockThreshold(500);
    setUnitPrice(0.0);
    setShowModal(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setSku(item.sku);
    setName(item.name);
    setCategory(item.category);
    setQuantity(item.quantity);
    setReorderPoint(item.reorder_point);
    setReorderQuantity(item.reorder_quantity);
    setOverstockThreshold(item.overstock_threshold);
    setUnitPrice(item.unit_price);
    setShowModal(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      sku,
      name,
      category,
      quantity: Number(quantity),
      reorder_point: Number(reorderPoint),
      reorder_quantity: Number(reorderQuantity),
      overstock_threshold: Number(overstockThreshold),
      unit_price: Number(unitPrice),
    };

    try {
      if (editingItem) {
        await api.put(`/inventory/${editingItem.id}`, payload);
      } else {
        await api.post('/inventory', payload);
      }
      setShowModal(false);
      fetchInventory();
    } catch (error) {
      console.error("Error saving inventory item", error);
    }
  };

  const confirmDelete = (id: number) => {
    setItemToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDeleteItem = async () => {
    if (itemToDelete === null) return;
    try {
      await api.delete(`/inventory/${itemToDelete}`);
      setShowDeleteModal(false);
      setItemToDelete(null);
      fetchInventory();
    } catch (error) {
      console.error("Error deleting inventory item", error);
    }
  };

  const triggerInventoryAgent = async () => {
    setTriggeringCheck(true);
    setMsg('');
    try {
      const res = await api.post('/inventory/check');
      setMsg(res.data.message);
      fetchInventory();
      setTimeout(() => setMsg(''), 5000);
    } catch (e) {
      console.error("Error triggering check", e);
    } finally {
      setTriggeringCheck(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    setMsg('');
    try {
      const res = await api.post('/inventory/reset');
      setMsg(res.data.message);
      fetchInventory();
      setTimeout(() => setMsg(''), 5000);
    } catch (e) {
      console.error("Resetting failed", e);
      setMsg("Failed to reset database to demo state.");
    } finally {
      setResetting(false);
    }
  };

  const getStatusBadge = (item: InventoryItem) => {
    if (item.quantity <= item.reorder_point) {
      return (
        <span className="badge-danger flex items-center gap-1 w-fit">
          <AlertTriangle className="w-3 h-3" /> Low Stock
        </span>
      );
    } else if (item.quantity >= item.overstock_threshold) {
      return (
        <span className="badge-warning flex items-center gap-1 w-fit">
          <AlertTriangle className="w-3 h-3" /> Overstock
        </span>
      );
    }
    return (
      <span className="badge-success flex items-center gap-1 w-fit">
        <CheckCircle2 className="w-3 h-3" /> Normal
      </span>
    );
  };

  // Filter and Search Logic
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const categories = ['All', 'Raw Materials', 'Electronics', 'Fasteners', 'Packaging'];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <Package className="w-6 h-6 text-blue-500" />
            Inventory Management
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">Audit supply levels, set stock limits, and monitor autonomous procurement triggers.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleReset}
            disabled={resetting || triggeringCheck}
            className="btn-secondary"
          >
            <RotateCcw className={`w-4 h-4 text-rose-400 ${resetting ? 'animate-spin' : ''}`} />
            {resetting ? 'Resetting DB...' : 'Reset to Demo State'}
          </button>

          <button 
            onClick={triggerInventoryAgent}
            disabled={triggeringCheck || resetting}
            className="btn-secondary"
          >
            <Cpu className={`w-4 h-4 text-blue-400 ${triggeringCheck ? 'animate-spin' : ''}`} />
            Scan Stock Shortages
          </button>
          
          <button 
            onClick={openAddModal}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg animate-pulse">
          {msg}
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/40 p-4 border border-slate-800 rounded-xl">
        <div className="relative w-full md:w-80">
          <SearchIcon className="absolute left-3 top-2.5 h-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search material or SKU..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { setCategoryFilter(cat); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                categoryFilter === cat 
                  ? 'bg-blue-600 border-blue-500 text-white' 
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table Card */}
      <div className="glass-card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-4 px-6">SKU</th>
                <th className="py-4 px-6">Material Name</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6 text-right">Quantity</th>
                <th className="py-4 px-6 text-right">Reorder Point</th>
                <th className="py-4 px-6 text-right">Unit Price</th>
                <th className="py-4 px-6 text-right">Inventory Value</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    <RefreshCw className="w-4 h-4 animate-spin inline-block mr-2 text-blue-500" />
                    Querying inventory state...
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No matching inventory materials registered.
                  </td>
                </tr>
              ) : (
                paginatedItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-4 px-6 font-mono text-slate-400 font-semibold">{item.sku}</td>
                    <td className="py-4 px-6 font-medium text-slate-200">{item.name}</td>
                    <td className="py-4 px-6">
                      <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-slate-100">{item.quantity}</td>
                    <td className="py-4 px-6 text-right text-slate-400">{item.reorder_point}</td>
                    <td className="py-4 px-6 text-right font-medium text-slate-300">${item.unit_price.toFixed(2)}</td>
                    <td className="py-4 px-6 text-right font-bold text-blue-400">
                      ${(item.quantity * item.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6">{getStatusBadge(item)}</td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center gap-1.5">
                        <button 
                          onClick={() => openEditModal(item)}
                          className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
                          title="Edit Item"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => confirmDelete(item.id)}
                          className="p-1.5 hover:bg-rose-950/20 rounded text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete Item"
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

        {/* Pagination Panel */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing <span className="font-semibold text-slate-200">{Math.min(filteredItems.length, (currentPage - 1) * itemsPerPage + 1)}</span> to{' '}
              <span className="font-semibold text-slate-200">{Math.min(filteredItems.length, currentPage * itemsPerPage)}</span> of{' '}
              <span className="font-semibold text-slate-200">{filteredItems.length}</span> items
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 bg-slate-900 border border-slate-800 rounded hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 text-slate-300 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 bg-slate-900 border border-slate-800 rounded hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 text-slate-300 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-200">{editingItem ? 'Edit Material' : 'Add New Material'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveItem} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">SKU Code</label>
                  <input 
                    type="text" 
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    required
                    disabled={!!editingItem}
                    placeholder="e.g. COP-WIR-02"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Material Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Copper wire roll"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Category</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Raw Materials">Raw Materials</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Fasteners">Fasteners</option>
                    <option value="Packaging">Packaging</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Unit Price ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    required
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Initial Quantity</label>
                  <input 
                    type="number" 
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    required
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Reorder Point</label>
                  <input 
                    type="number" 
                    value={reorderPoint}
                    onChange={(e) => setReorderPoint(Number(e.target.value))}
                    required
                    placeholder="10"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Reorder Quantity</label>
                  <input 
                    type="number" 
                    value={reorderQuantity}
                    onChange={(e) => setReorderQuantity(Number(e.target.value))}
                    required
                    placeholder="50"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Overstock Limit</label>
                <input 
                  type="number" 
                  value={overstockThreshold}
                  onChange={(e) => setOverstockThreshold(Number(e.target.value))}
                  required
                  placeholder="500"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-primary"
                >
                  Save Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-xl shadow-2xl p-6 text-xs text-slate-300 animate-in fade-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0 text-rose-500" />
              <h3 className="font-bold text-sm text-slate-200">Delete Material?</h3>
            </div>
            <p className="text-slate-400 leading-normal">
              Are you sure you want to delete this material? This will remove it from inventory logs and cannot be undone.
            </p>
            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button 
                onClick={() => setShowDeleteModal(false)} 
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteItem} 
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
