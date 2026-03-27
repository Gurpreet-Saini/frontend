'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment, getCenters } from '@/lib/api';
import { Department } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Building2, Users, ArrowRight, Loader2, Info, Plus, Edit2, Trash2, X, Search, LayoutGrid, Activity, Building } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function DepartmentsPage() {
  const { isSuperAdmin, token } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [centerFilter, setCenterFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [currentDept, setCurrentDept] = useState<Department | null>(null);
  const [deleteDeptId, setDeleteDeptId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', center_id: '' });
  const [search, setSearch] = useState('');

  const filteredDepartments = departments.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.description?.toLowerCase().includes(search.toLowerCase())
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (centerFilter) params.center_id = centerFilter;
      const { data } = await getDepartments(params);
      setDepartments(data || []);
    } catch (err) {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin && token) {
      getCenters().then(res => setCenters(res.data)).catch(() => {});
    }
  }, [isSuperAdmin, token]);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [centerFilter, token]);

  const openModal = (type: 'add' | 'edit', dept?: Department) => {
    setModalType(type);
    setCurrentDept(dept || null);
    if (dept) {
      setFormData({ name: dept.name, description: dept.description, center_id: String(dept.center_id) });
    } else {
      setFormData({ name: '', description: '', center_id: centerFilter || '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalType === 'add') {
        const payload = { ...formData, center_id: formData.center_id ? Number(formData.center_id) : undefined };
        await createDepartment(payload);
        toast.success('Department created');
      } else if (modalType === 'edit' && currentDept) {
        const payload = { ...formData, center_id: formData.center_id ? Number(formData.center_id) : undefined };
        await updateDepartment(currentDept.id, payload);
        toast.success('Department updated');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleDeleteRequest = (id: number) => {
    setDeleteDeptId(id);
  };

  const handleDeleteConfirm = async () => {
    if (deleteDeptId === null) return;
    try {
      await deleteDepartment(deleteDeptId);
      toast.success('Department deleted');
      setDeleteDeptId(null);
      fetchData();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-2xl text-blue-600 shadow-sm">
                <LayoutGrid size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Departments</h1>
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100 w-max mt-1">
                  <Activity size={14} className="text-blue-500 animate-pulse" />
                  <span>{departments.length} Active Departments</span>
                </div>
              </div>
            </div>
          </div>
          <button 
            onClick={() => openModal('add')} 
            className="btn-primary flex items-center gap-2 px-6 py-3.5 shadow-lg shadow-primary-200 hover:shadow-primary-300 transition-all scale-105 active:scale-95 whitespace-nowrap"
          >
            <Plus size={20} /> <span className="font-bold">Add Department</span>
          </button>
        </div>

        {/* Search & Stats Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-2 card p-2 bg-white flex items-center shadow-sm border-gray-100">
             <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Search by name or description..." 
                  className="w-full bg-transparent border-none focus:ring-0 pl-12 pr-4 py-3 text-gray-600 placeholder:text-gray-400 font-medium"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
             </div>
          </div>
          <div className="lg:col-span-1">
            {isSuperAdmin && (
              <div className="card p-2 bg-white flex items-center shadow-sm border-gray-100 h-full">
                <Building className="ml-4 text-gray-400" size={20} />
                <select
                  className="w-full bg-transparent border-none focus:ring-0 pl-3 pr-4 py-3 text-gray-600 font-bold appearance-none cursor-pointer"
                  value={centerFilter}
                  onChange={(e) => setCenterFilter(e.target.value)}
                >
                  <option value="">All Centers</option>
                  {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-3xl p-4 text-white shadow-xl flex items-center justify-between">
             <div className="space-y-0.5">
                <p className="text-xs font-bold text-blue-100 uppercase tracking-tighter">Total Members</p>
                <p className="text-2xl font-black">{departments.reduce((acc, d) => acc + (d.sewadar_count || 0), 0)}</p>
             </div>
             <Users className="opacity-20 translate-x-2" size={48} />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />
            <p className="font-bold animate-pulse">Loading Departments...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDepartments.map((dept) => (
              <div key={dept.id} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
                <div className="card relative h-full bg-white/80 backdrop-blur-xl border-none shadow-2xl shadow-gray-200/50 overflow-hidden group-hover:scale-[1.02] transition-all duration-500 rounded-[2rem]">
                  <div className="p-8 space-y-6">
                    <div className="flex items-start justify-between">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner">
                        <Building2 size={28} />
                      </div>
                      <div className="flex flex-col items-end gap-2">
                         <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                            <button onClick={() => openModal('edit', dept)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all active:scale-90">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDeleteRequest(dept.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-all active:scale-90">
                              <Trash2 size={16} />
                            </button>
                         </div>
                         <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] bg-blue-50/50 px-2 py-1 rounded-lg border border-blue-100/50">
                           {dept.center?.name || 'All Centers'}
                         </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                       <h3 className="text-2xl font-black text-gray-900 tracking-tight group-hover:text-blue-700 transition-colors truncate">{dept.name}</h3>
                       <p className="text-sm text-gray-500 font-medium leading-relaxed line-clamp-2 min-h-[2.5rem]">
                         {dept.description || 'Department dedicated to excellence and service.'}
                       </p>
                    </div>

                    <div className="flex items-center gap-6 pt-6 border-t border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100 shadow-sm">
                           <Users size={14} />
                        </div>
                        <span className="text-sm font-black text-gray-700">{dept.sewadar_count || 0} Members</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <Link 
                        href={`/sewadars?department_id=${dept.id}`}
                        className="flex items-center justify-center gap-2 py-3.5 bg-gray-50 text-gray-500 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-200 transition-all"
                      >
                        View Members
                        <ArrowRight size={14} />
                      </Link>
                      <Link 
                        href={`/attendance?department_id=${dept.id}`}
                        className="flex items-center justify-center gap-2 py-3.5 bg-gray-50 text-gray-500 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-600 hover:text-white hover:shadow-lg hover:shadow-indigo-200 transition-all font-mono"
                      >
                        Attendance
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredDepartments.length === 0 && (
              <div className="col-span-full py-32 text-center card bg-white/50 border-dashed border-2 border-gray-200 flex flex-col items-center gap-4 rounded-[2.5rem]">
                <Search size={64} className="text-gray-100" />
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-gray-400 uppercase tracking-widest">No Matches Found</h3>
                  <p className="text-gray-400 text-sm font-medium italic">Adjust your filters to find departments.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Innovative Modal Design */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="relative h-24 bg-gradient-to-r from-blue-600 to-indigo-800 flex items-center px-10">
               <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full translate-x-12 -translate-y-12" />
               <h3 className="font-black text-2xl text-white tracking-tight">{modalType === 'add' ? 'Add Department' : 'Edit Department'}</h3>
               <button 
                 onClick={() => setIsModalOpen(false)} 
                 className="absolute right-6 top-6 text-white/50 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full"
               >
                 <X size={20} />
               </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                     <LayoutGrid size={14} className="text-blue-500" />
                      Department Name
                  </label>
                  <input 
                    required 
                    autoFocus
                    type="text" 
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300" 
                    placeholder="e.g. General"
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                     <Info size={14} className="text-blue-500" />
                      Description
                  </label>
                  <textarea 
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300 min-h-[120px] resize-none" 
                    placeholder="Describe the department's responsibilities..."
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                  />
                </div>
                {isSuperAdmin && modalType === 'add' && (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       <Building size={14} className="text-blue-500" />
                       Center
                    </label>
                    <select
                      className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-900"
                      value={formData.center_id}
                      onChange={(e) => setFormData({ ...formData, center_id: e.target.value })}
                      required
                    >
                      <option value="">Select Center</option>
                      {centers.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 py-4 text-sm font-black text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-200 transition-all active:scale-[0.98]"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteDeptId !== null && (
        <div className="modal-overlay z-[60]">
          <div className="modal-box max-w-sm">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Department?</h3>
              <p className="text-gray-500 mb-6">This action cannot be undone. Associated records will lose their department linkage.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setDeleteDeptId(null)} className="btn-secondary px-6">Cancel</button>
                <button onClick={handleDeleteConfirm} className="btn-primary bg-red-600 hover:bg-red-700 border-none px-6">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
