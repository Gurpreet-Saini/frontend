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
        {/* Elite Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-100 group-hover:rotate-6 transition-transform">
                <Globe size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tighter uppercase leading-none">Centers</h1>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                    <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">{centers.length} Active Centers</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button 
            onClick={openCreate} 
            className="group relative px-6 py-3.5 bg-gray-900 text-white rounded-xl overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-800 translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
            <div className="relative flex items-center gap-3">
              <Plus size={22} className="group-hover:rotate-180 transition-transform duration-500" />
              <span className="text-xs font-black uppercase tracking-[0.2em]">Add Center</span>
            </div>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 card p-2 bg-white/80 backdrop-blur-xl flex items-center shadow-[0_16px_32px_-8px_rgba(0,0,0,0.05)] border-white border-2 rounded-2xl">
             <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Search centers..." 
                  className="w-full bg-transparent border-none focus:ring-0 pl-12 pr-6 py-3 text-gray-900 font-bold placeholder:text-gray-300 text-sm uppercase tracking-tight"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
             </div>
          </div>
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 to-black rounded-2xl p-5 text-white shadow-2xl flex items-center justify-between group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-12 -translate-y-12 group-hover:scale-150 transition-transform duration-1000" />
             <div className="relative z-10 space-y-1">
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em]">System Health</p>
                <div className="flex items-baseline gap-2">
                   <p className="text-3xl font-black tracking-tighter">100%</p>
                   <span className="text-[10px] font-bold text-gray-500">Uptime</span>
                </div>
             </div>
             <Activity className="relative z-10 text-indigo-500 group-hover:scale-110 transition-transform" size={32} />
          </div>
        </div>

        {/* Centers List */}
        <div className="group/table relative">
          <div className="absolute -inset-1 bg-gradient-to-b from-indigo-50 via-transparent to-indigo-50 rounded-[3.5rem] blur-2xl opacity-0 group-hover/table:opacity-100 transition-opacity" />
          <div className="card relative bg-white/70 backdrop-blur-3xl border-none shadow-[0_32px_128px_-32px_rgba(0,0,0,0.08)] overflow-hidden rounded-[3rem]">
            {loading ? (
              <div className="p-32 flex flex-col items-center justify-center gap-8 opacity-40">
                <div className="w-20 h-20 border-8 border-gray-100 border-t-indigo-600 rounded-full animate-spin shadow-inner" />
                <div className="space-y-1 text-center">
                   <p className="text-sm font-black uppercase tracking-[0.4em] animate-pulse">Loading Centers...</p>
                   <p className="text-[10px] font-medium italic">Fetching center information from the system.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
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
                      <tr key={center.id} className="group hover:bg-white hover:shadow-xl transition-all duration-300">
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1.5 bg-gray-900 text-white text-[9px] font-black tracking-[0.2em] rounded-lg shadow-md group-hover:bg-indigo-600 transition-colors">
                            ID-{center.id.toString().padStart(3, '0')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 flex items-center justify-center text-indigo-700 font-extrabold shadow-sm transition-all duration-300">
                               <Building size={20} />
                            </div>
                            <div>
                              <p className="text-base font-black text-gray-900 tracking-tighter group-hover:text-indigo-700 transition-colors uppercase leading-none">{center.name}</p>
                              <div className="flex items-center gap-1.5 mt-1.5">
                                 <div className="w-1 h-1 rounded-full bg-indigo-400" />
                                 <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Center</p>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5 group/loc">
                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-500 group-hover/loc:bg-indigo-600 group-hover/loc:text-white transition-all shadow-inner">
                               <MapPin size={16} />
                            </div>
                            <span className="text-sm font-black text-gray-600 tracking-tight uppercase group-hover/loc:text-gray-900 transition-colors">{center.location}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <button 
                              onClick={() => openEdit(center)} 
                              className="p-2.5 bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl shadow-sm border border-gray-100 hover:border-indigo-600 transition-all active:scale-95"
                              title="Edit Details"
                            >
                              <Pencil size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(center.id)} 
                              className="p-2.5 bg-white text-red-500 hover:bg-red-600 hover:text-white rounded-xl shadow-sm border border-gray-100 hover:border-red-600 transition-all active:scale-95"
                              title="Delete Center"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredCenters.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-48 text-center flex flex-col items-center justify-center gap-8 relative overflow-hidden">
                           <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/20 to-transparent pointer-events-none" />
                           <div className="w-32 h-32 bg-gray-50 rounded-[3rem] flex items-center justify-center text-gray-100 border-4 border-white shadow-2xl relative z-10">
                              <Search size={64} />
                           </div>
                           <div className="space-y-2 relative z-10">
                             <p className="text-2xl font-black text-gray-400 capitalize tracking-tight">No Centers Found</p>
                               <p className="text-gray-300 text-sm italic font-medium max-w-xs mx-auto">No centers match your current search.</p>
                           </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/80 backdrop-blur-xl animate-in fade-in duration-500">
            <div className="bg-white rounded-[3.5rem] w-full max-w-xl shadow-[0_64px_256px_-64px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-500 border-4 border-white">
              <div className="relative h-40 bg-gray-900 flex flex-col justify-center px-12">
                 <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-600/30 rounded-full translate-x-24 -translate-y-24 blur-3xl" />
                 <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.4em] mb-2">Center Details</p>
                 <h3 className="font-black text-4xl text-white tracking-widest uppercase">{editingId ? 'Edit Center' : 'Create Center'}</h3>
                 <button 
                   onClick={() => setIsModalOpen(false)} 
                   className="absolute right-10 top-10 text-white/30 hover:text-white transition-all bg-white/5 hover:bg-white/10 p-3 rounded-2xl"
                 >
                   <X size={24} />
                 </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-12 space-y-10">
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] px-1">Center Name</label>
                    <input 
                      required 
                      autoFocus
                      type="text" 
                      className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all font-black text-gray-900 placeholder:text-gray-200 text-lg shadow-inner" 
                      placeholder="e.g. RSSB Center"
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] px-1">Location</label>
                    <input 
                      required 
                      type="text" 
                      className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none transition-all font-black text-gray-900 placeholder:text-gray-200 text-lg shadow-inner" 
                      placeholder="e.g. Location"
                      value={formData.location} 
                      onChange={e => setFormData({...formData, location: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="pt-6 flex gap-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 text-xs font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 rounded-2xl transition-all">Cancel</button>
                  <button type="submit" className="flex-[2] py-5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-indigo-100 transition-all active:scale-[0.98]">Save Center</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
