'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/DashboardLayout';
import { getCenters, createCenter, updateCenter, deleteCenter } from '@/lib/api';
import { Building, Plus, Pencil, Trash2, X, MapPin, Globe, Activity, Search, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Center {
  id: number;
  name: string;
  location: string;
}

export default function CentersPage() {
  const { isSuperAdmin, token } = useAuth();
  const [centers, setCenters] = useState<Center[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', location: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSuperAdmin && token) {
      fetchCenters();
    } else if (!isSuperAdmin) {
      setLoading(false);
    }
  }, [isSuperAdmin, token]);

  const fetchCenters = async () => {
    try {
      const { data } = await getCenters();
      setCenters(data || []);
    } catch {
      toast.error('Failed to load centers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateCenter(editingId, formData);
        toast.success('Center updated');
      } else {
        await createCenter(formData);
        toast.success('Center created');
      }
      setIsModalOpen(false);
      fetchCenters();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save center');
    }
  };

  const openEdit = (center: Center) => {
    setEditingId(center.id);
    setFormData({ name: center.name, location: center.location });
    setIsModalOpen(true);
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData({ name: '', location: '' });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this center?')) return;
    try {
      await deleteCenter(id);
      toast.success('Center deleted');
      fetchCenters();
    } catch {
      toast.error('Failed to delete center');
    }
  };

  const [search, setSearch] = useState('');

  const filteredCenters = centers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.location.toLowerCase().includes(search.toLowerCase())
  );

  if (!isSuperAdmin && !loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-red-500 font-bold bg-white rounded-3xl shadow-sm border border-red-50 m-8">
           <X size={64} className="mb-4 opacity-20" />
           <p className="text-xl">Access Restricted</p>
           <p className="text-sm font-normal text-gray-400 mt-2">Only Super Admins can manage centers.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in pb-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
              <Globe size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">Centers</h1>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{centers.length} active centers</p>
            </div>
          </div>
          <button 
            onClick={openCreate} 
            className="h-10 px-5 bg-gray-900 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-lg"
          >
            <Plus size={16} />
            <span>Add Center</span>
          </button>
        </div>

        {/* Search */}
        <div className="card p-2 bg-white flex items-center shadow-sm border-gray-100 rounded-2xl">
           <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search centers by name or location..." 
                className="w-full h-10 bg-transparent border-none focus:ring-0 pl-10 pr-4 text-gray-900 font-bold placeholder:text-gray-300 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
        </div>

        {/* Centers List */}
        <div className="card bg-white border border-gray-100 shadow-sm overflow-hidden rounded-3xl">
          {loading ? (
            <div className="p-20 flex flex-col items-center gap-6 text-gray-400">
              <div className="w-12 h-12 border-4 border-gray-100 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm font-bold uppercase tracking-widest">Loading Centers...</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="overflow-x-auto hidden md:block">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-white/50 border-b border-gray-100">
                      <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">ID</th>
                      <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Name</th>
                      <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Location</th>
                      <th className="px-6 py-4 text-right text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50/50">
                    {filteredCenters.map(center => (
                      <tr key={center.id} className="group hover:bg-gray-50 transition-all">
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 bg-gray-900 text-white text-[9px] font-black tracking-widest rounded-lg shadow-sm">
                            ID-{center.id.toString().padStart(3, '0')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                               <Building size={16} />
                            </div>
                            <p className="text-sm font-black text-gray-900 uppercase">{center.name}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-indigo-400" />
                            <span className="text-sm font-bold text-gray-600 uppercase">{center.location}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openEdit(center)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all active:scale-90"><Pencil size={15} /></button>
                            <button onClick={() => handleDelete(center.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all active:scale-90"><Trash2 size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredCenters.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-20 text-center">
                          <Search size={36} className="text-gray-200 mx-auto mb-3" />
                          <p className="text-sm font-black text-gray-400 uppercase">No Centers Found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="md:hidden divide-y divide-gray-50">
                {filteredCenters.map(center => (
                  <div key={center.id} className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                      <Building size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-gray-900 uppercase truncate">{center.name}</p>
                      <p className="text-xs text-gray-400 font-medium truncate flex items-center gap-1">
                        <MapPin size={10} /> {center.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => openEdit(center)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(center.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
                {filteredCenters.length === 0 && (
                  <div className="py-16 text-center">
                    <Search size={36} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-sm font-black text-gray-400 uppercase">No Centers Found</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Information */}
        <div className="flex items-center gap-4 p-5 bg-gray-900 rounded-2xl text-white shadow-xl overflow-hidden relative group">
           <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 group-hover:scale-125 transition-transform duration-1000" />
           <div className="p-2.5 bg-white/10 rounded-xl border border-white/10 backdrop-blur-md">
              <Info size={18} className="text-indigo-400" />
           </div>
           <div className="space-y-1 relative z-10">
              <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.4em]">Information</p>
              <p className="text-xs font-bold text-gray-400 leading-relaxed">Each center functions as an <span className="text-white">independent administrative center</span> with localized department controls.</p>
           </div>
        </div>

        {/* Center Details Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6 animate-in fade-in duration-300">
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
            <div className="relative bg-white w-full sm:rounded-[2.5rem] rounded-t-[2.5rem] sm:max-w-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-gray-900 to-indigo-950 p-6 text-white relative overflow-hidden">
                 <div className="absolute right-0 top-0 w-48 h-48 bg-indigo-600/20 rounded-full translate-x-12 -translate-y-12 blur-3xl" />
                 <div className="relative z-10 flex justify-between items-center">
                    <div>
                       <p className="text-[7px] font-black uppercase tracking-[0.4em] text-indigo-300 mb-1">Administrative Unit</p>
                       <h3 className="text-xl font-black tracking-tight uppercase">{editingId ? 'Update Center Details' : 'Register New Center'}</h3>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all active:scale-90">
                       <X size={18} />
                    </button>
                 </div>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-4">
                  <div className="space-y-1.5 px-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Center Name</label>
                    <div className="relative group">
                       <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600" size={16} />
                       <input 
                         required 
                         autoFocus
                         type="text" 
                         className="w-full h-11 pl-10 pr-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-xl outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300 text-sm shadow-inner" 
                         placeholder="e.g. RSSB Delhi Center"
                         value={formData.name} 
                         onChange={e => setFormData({...formData, name: e.target.value})} 
                       />
                    </div>
                  </div>
                  <div className="space-y-1.5 px-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Location Address</label>
                    <div className="relative group">
                       <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600" size={16} />
                       <input 
                         required 
                         type="text" 
                         className="w-full h-11 pl-10 pr-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-xl outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300 text-sm shadow-inner" 
                         placeholder="Enter full address"
                         value={formData.location} 
                         onChange={e => setFormData({...formData, location: e.target.value})} 
                       />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="h-11 flex-1 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 rounded-xl transition-all border border-gray-100">Cancel</button>
                  <button type="submit" className="h-11 flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg transition-all active:scale-95">{editingId ? 'Save Changes' : 'Create Center'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
