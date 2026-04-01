'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getInventoryItems, createInventoryItem, updateInventoryItem, deleteInventoryItem, updateInventoryStock, getDepartments, getCenters } from '@/lib/api';
import { Item, Department, Center } from '@/lib/types';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Package, Plus, Search, Filter, Edit2, Trash2, 
  ArrowUpRight, ArrowDownRight, PackageOpen, LayoutGrid, 
  Building, Building2, Loader2, RefreshCcw, X, Save, Box
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface StockModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
  onSuccess: () => void;
}

function StockModal({ isOpen, onClose, item, onSuccess }: StockModalProps) {
  const [type, setType] = useState<'ADD' | 'SUBTRACT'>('ADD');
  const [quantity, setQuantity] = useState(1);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setRemarks('');
      setType('ADD');
    }
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }
    setLoading(true);
    try {
      await updateInventoryStock(item.id, {
        quantity_changed: quantity,
        transaction_type: type,
        remarks
      });
      toast.success('Stock updated successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className={cn("p-6 flex justify-between items-center text-white transition-colors", type === 'ADD' ? "bg-green-600" : "bg-red-600")}>
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white/20 rounded-xl">
                 {type === 'ADD' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
             </div>
             <div>
               <p className="text-[10px] font-black text-white/70 uppercase tracking-widest leading-none mb-1">Update Stock</p>
               <h3 className="text-xl font-black uppercase tracking-tight leading-none truncate max-w-[200px]">{item.name}</h3>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setType('ADD')}
              className={cn(
                "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all",
                type === 'ADD' ? "border-green-600 bg-green-50 text-green-700 font-bold" : "border-gray-100 text-gray-400 hover:border-gray-200"
              )}
            >
              <ArrowUpRight size={24} className="mb-2" />
              <span>Add Stock</span>
            </button>
            <button
              type="button"
              onClick={() => setType('SUBTRACT')}
              className={cn(
                "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all",
                type === 'SUBTRACT' ? "border-red-600 bg-red-50 text-red-700 font-bold" : "border-gray-100 text-gray-400 hover:border-gray-200"
              )}
            >
              <ArrowDownRight size={24} className="mb-2" />
              <span>Reduce Stock</span>
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Quantity to {type === 'ADD' ? 'Add' : 'Deduct'}</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              placeholder={`Enter amount in ${item.unit || 'units'}`}
              required
              className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl transition-all outline-none text-xl font-black text-gray-900 placeholder:text-gray-300"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Remarks (Optional)</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Replenishment from main hub"
              className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl transition-all outline-none text-sm font-bold text-gray-900 placeholder:text-gray-300"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full py-4 text-white rounded-2xl font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2",
              type === 'ADD' ? "bg-green-600 hover:bg-green-700 shadow-lg shadow-green-900/20 hover:shadow-green-900/40" : "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900/20 hover:shadow-red-900/40"
            )}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            <span>Confirm Update</span>
          </button>
        </form>
      </div>
    </div>
  );
}

// Main Page Component
export default function InventoryPage() {
  const { isSuperAdmin, isAdmin, user } = useAuth();
  
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isStockOpen, setIsStockOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  
  // Filtering
  const [search, setSearch] = useState('');
  
  // Options
  const [departments, setDepartments] = useState<Department[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    unit: 'pcs',
    center_id: user?.center_id || 0,
    department_id: '' as number | '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, deptsRes] = await Promise.all([
        getInventoryItems(),
        getDepartments()
      ]);
      setItems(itemsRes.data);
      setDepartments(deptsRes.data);
      if (isSuperAdmin) {
        const centersRes = await getCenters();
        setCenters(centersRes.data);
        if(!formData.center_id && centersRes.data.length > 0) {
            setFormData(prev => ({...prev, center_id: centersRes.data[0].id}));
        }
      }
    } catch (err) {
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isSuperAdmin, user]);

  const handleOpenForm = (item?: Item) => {
    if (item) {
      setSelectedItem(item);
      setFormData({
        name: item.name,
        category: item.category,
        description: item.description,
        unit: item.unit,
        center_id: item.center_id,
        department_id: item.department_id || '',
      });
    } else {
      setSelectedItem(null);
      setFormData({
        name: '',
        category: '',
        description: '',
        unit: 'pcs',
        center_id: formData.center_id || (centers.length > 0 ? centers[0].id : 0),
        department_id: '',
      });
    }
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        department_id: formData.department_id === '' ? null : formData.department_id,
      };

      if (selectedItem) {
        await updateInventoryItem(selectedItem.id, payload);
        toast.success('Item updated');
      } else {
        await createInventoryItem(payload);
        toast.success('Item created');
      }
      setIsFormOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save item');
    }
  };

  const handleDeleteItem = async (id: number) => {
    if(!confirm("Are you sure? This will delete the item and all its transaction history.")) return;
    try {
      await deleteInventoryItem(id);
      toast.success('Item deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete item');
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.category.toLowerCase().includes(search.toLowerCase())
  );



  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-[3rem] shadow-xl shadow-gray-200/40 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-50 border-[20px] border-indigo-100 rounded-full opacity-50 pointer-events-none" />
          
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-900/20">
                <Package size={28} strokeWidth={2.5} />
              </div>
              <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight leading-none pt-1">Inventory</h1>
            </div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest ml-1">
              Manage Center Assets & Stock
            </p>
          </div>
          
          <div className="relative z-10 flex items-center gap-3">
            <button 
              onClick={fetchData}
              className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-100 hover:text-gray-900 transition-all"
              title="Refresh Items"
            >
              <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
            </button>
            { (isAdmin || isSuperAdmin) && (
              <button 
                onClick={() => handleOpenForm()}
                className="flex items-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0"
              >
                <Plus size={18} />
                <span>New Item</span>
              </button>
            )}
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text"
              placeholder="SEARCH ITEMS OR CATEGORIES..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-white border-none rounded-full shadow-lg shadow-gray-200/20 text-sm font-black text-gray-900 placeholder:text-gray-300 uppercase tracking-widest focus:ring-4 focus:ring-indigo-600/10 transition-all outline-none"
            />
          </div>
          <div className="flex items-center gap-2 px-6 py-5 bg-white rounded-full shadow-lg shadow-gray-200/20 text-gray-500 font-bold uppercase tracking-widest text-[10px]">
            <LayoutGrid size={16} />
            <span>{filteredItems.length} Items Found</span>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20">
            <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Inventory...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 bg-white/50 border-2 border-dashed border-gray-200 rounded-[3rem] text-center">
            <Box size={48} className="text-gray-200 mb-6" />
            <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">No Items Found</h3>
            <p className="text-sm font-medium text-gray-400 mt-2 max-w-sm">
              Your inventory is currently empty. Add items to start tracking your stock.
            </p>
            { (isAdmin || isSuperAdmin) && (
              <button 
                onClick={() => handleOpenForm()}
                className="mt-6 flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-indigo-100 transition-colors"
              >
                <Plus size={16} />
                <span>Add First Item</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredItems.map(item => (
              <div key={item.id} className="group bg-white rounded-[2.5rem] p-6 shadow-xl shadow-gray-200/30 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-2 border-transparent hover:border-indigo-50">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center border border-gray-100">
                      <PackageOpen size={24} />
                    </div>
                    <div>
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-md text-[9px] font-black uppercase tracking-widest">{item.category || 'General'}</span>
                      <h3 className="text-lg font-black text-gray-900 tracking-tight leading-tight mt-1">{item.name}</h3>
                    </div>
                  </div>
                  <div className="relative">
                     {/* Actions - show on hover/focus */}
                    { (isAdmin || isSuperAdmin) && (
                      <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenForm(item)} className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-colors" title="Edit Item">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDeleteItem(item.id)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-colors" title="Delete Item">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Available Stock</p>
                     <div className="flex items-baseline gap-1">
                        <span className={cn("text-2xl font-black tracking-tight", item.quantity > 10 ? "text-green-600" : item.quantity > 0 ? "text-amber-500" : "text-red-500")}>
                          {item.quantity}
                        </span>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{item.unit}</span>
                     </div>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col justify-center">
                    <button 
                      onClick={() => { setSelectedItem(item); setIsStockOpen(true); }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-white rounded-xl shadow-sm text-xs font-black text-gray-900 uppercase tracking-widest border border-gray-200 hover:border-indigo-600 hover:text-indigo-600 transition-all"
                    >
                      Update Stock
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-t border-gray-50 pt-4">
                  <div className="flex items-center gap-1.5 truncate">
                    <Building size={14} />
                    <span className="truncate">{item.center?.name || 'Center'}</span>
                  </div>
                  {item.department && (
                    <div className="flex items-center gap-1.5 truncate border-l border-gray-200 pl-4">
                      <Building2 size={14} />
                      <span className="truncate">{item.department.name}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Item create/edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-6 bg-indigo-600 text-white flex justify-between items-center shrink-0">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-white/20 rounded-xl">
                     <Package size={20} />
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest leading-none mb-1">Asset Directory</p>
                   <h3 className="text-xl font-black uppercase tracking-tight leading-none">{selectedItem ? 'Edit Item' : 'New Item'}</h3>
                 </div>
               </div>
               <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                 <X size={20} />
               </button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Item Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData(prev => ({...prev, name: e.target.value}))}
                      required
                      className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none text-sm font-bold text-gray-900 transition-all"
                      placeholder="e.g. Broom, Walkie Talkie"
                    />
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={e => setFormData(prev => ({...prev, category: e.target.value}))}
                      className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none text-sm font-bold text-gray-900 transition-all"
                      placeholder="e.g. Cleaning Supplies"
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Unit of Measure</label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={e => setFormData(prev => ({...prev, unit: e.target.value}))}
                      className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none text-sm font-bold text-gray-900 transition-all"
                      placeholder="e.g. pcs, kg, boxes"
                    />
                 </div>

                 {isSuperAdmin && (
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Center</label>
                      <select
                        value={formData.center_id}
                        onChange={e => setFormData(prev => ({...prev, center_id: Number(e.target.value)}))}
                        required
                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none text-sm font-bold text-gray-900 transition-all appearance-none"
                      >
                        {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                   </div>
                 )}

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Department (Optional)</label>
                    <select
                        value={formData.department_id}
                        onChange={e => setFormData(prev => ({...prev, department_id: e.target.value ? Number(e.target.value) : ''}))}
                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none text-sm font-bold text-gray-900 transition-all appearance-none"
                    >
                      <option value="">All Departments (Global)</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                 </div>

                 <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData(prev => ({...prev, description: e.target.value}))}
                      rows={3}
                      className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none text-sm font-medium text-gray-900 transition-all resize-none"
                      placeholder="Additional details about the item..."
                    />
                 </div>
               </div>

               <div className="pt-6 border-t border-gray-100 flex gap-4">
                  <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                    {selectedItem ? 'Save Changes' : 'Create Item'}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Update Modal */}
      <StockModal 
        isOpen={isStockOpen} 
        onClose={() => setIsStockOpen(false)} 
        item={selectedItem} 
        onSuccess={fetchData} 
      />
    </DashboardLayout>
  );
}
