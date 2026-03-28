'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  getSewadars, 
  getDepartments, 
  createSewadar, 
  updateSewadar, 
  deleteSewadar, 
  transferSewadar,
  bulkUploadSewadars,
  exportSewadars,
  getCenters
} from '@/lib/api';
import { Sewadar, Department } from '@/lib/types';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  MoveHorizontal, 
  Upload, 
  Download, 
  Search, 
  X,
  UserPlus,
  Loader2,
  AlertCircle,
  Users,
  Filter,
  ChevronRight,
  MoreVertical,
  UserCheck,
  Phone,
  Mail,
  Building2,
  ArrowRight,
  Activity,
  User,
  Shield,
  LayoutGrid,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';
import debounce from 'lodash/debounce';

import { useAuth } from '@/lib/auth-context';

export default function SewadarsPage() {
  const { isSuperAdmin, token } = useAuth();
  const [sewadars, setSewadars] = useState<Sewadar[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [centerFilter, setCenterFilter] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'transfer' | 'upload'>('add');
  const [currentSewadar, setCurrentSewadar] = useState<Sewadar | null>(null);
  const [deleteSewadarId, setDeleteSewadarId] = useState<number | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    sewadar_id: '',
    department_id: '',
    parent_spouse_name: '',
    gender: 'Male',
    badge_status: 'Permanent',
    center_id: '',
    phone: '',
    email: ''
  });
  const [newDeptId, setNewDeptId] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCenterId, setUploadCenterId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [limit, setLimit] = useState(25);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkTransferDeptId, setBulkTransferDeptId] = useState('');
  const [showBulkTransfer, setShowBulkTransfer] = useState(false);

  useEffect(() => {
    if (isSuperAdmin && token) {
      getCenters().then(res => setCenters(res.data)).catch(() => {});
    }
  }, [isSuperAdmin, token]);

  const [debouncedSearch, setDebouncedSearch] = useState('');

  const updateSearch = useCallback(
    debounce((val: string) => {
      setDebouncedSearch(val);
    }, 500),
    []
  );

  useEffect(() => {
    updateSearch(search);
  }, [search, updateSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [centerFilter, deptFilter, debouncedSearch]);

  useEffect(() => {
    if (token) {
      fetchData(currentPage);
    }
  }, [centerFilter, deptFilter, debouncedSearch, token, currentPage, limit]);

  async function fetchData(page = currentPage) {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (centerFilter) params.center_id = centerFilter;
      if (deptFilter) params.department_id = deptFilter;
      if (debouncedSearch) params.q = debouncedSearch;

      const [sewsRes, deptsRes] = await Promise.all([
        getSewadars(params),
        getDepartments({ center_id: centerFilter })
      ]);
      
      const { data, pagination } = sewsRes.data;
      setSewadars(data || []);
      if (pagination) {
        setTotalPages(Math.ceil(pagination.total / limit));
        setTotalRecords(pagination.total);
      }
      setDepartments(deptsRes.data || []);
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  const filteredSewadars = sewadars;

  const openModal = (type: 'add' | 'edit' | 'transfer' | 'upload', sewadar?: Sewadar) => {
    setModalType(type);
    setCurrentSewadar(sewadar || null);
    if (sewadar) {
      setFormData({
        name: sewadar.name,
        sewadar_id: sewadar.sewadar_id,
        department_id: String(sewadar.department_id),
        parent_spouse_name: sewadar.parent_spouse_name || '',
        gender: sewadar.gender || 'Male',
        badge_status: sewadar.badge_status || 'Permanent',
        center_id: String(sewadar.center_id),
        phone: sewadar.phone || '',
        email: sewadar.email || ''
      });
      setNewDeptId('');
    } else {
      setFormData({ name: '', sewadar_id: '', department_id: '', parent_spouse_name: '', gender: 'Male', badge_status: 'Permanent', center_id: centerFilter || '', phone: '', email: '' });
    }
    if (type === 'upload') {
      setUploadCenterId('');
      setUploadFile(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalType === 'add') {
        await createSewadar({ 
          ...formData, 
          department_id: formData.department_id ? Number(formData.department_id) : null,
          center_id: Number(formData.center_id)
        });
        toast.success('Sewadar added');
      } else if (modalType === 'edit' && currentSewadar) {
        await updateSewadar(currentSewadar.id, { 
          ...formData, 
          department_id: formData.department_id ? Number(formData.department_id) : null,
          center_id: Number(formData.center_id)
        });
        toast.success('Sewadar updated');
      } else if (modalType === 'transfer' && currentSewadar) {
        await transferSewadar(currentSewadar.id, Number(newDeptId));
        toast.success('Sewadar transferred');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleBulkUpload = async () => {
    if (!uploadFile) return;
    try {
      setLoading(true);
      await bulkUploadSewadars(uploadFile, uploadCenterId ? Number(uploadCenterId) : undefined);
      toast.success('Bulk upload successful');
      setIsModalOpen(false);
      setUploadFile(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Bulk upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params: any = {};
      if (deptFilter) params.department_id = Number(deptFilter);
      if (centerFilter) params.center_id = Number(centerFilter);
      
      const { data } = await exportSewadars(params);
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sewadars.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Export failed');
    }
  };

  const handleDeleteRequest = (id: number) => {
    setDeleteSewadarId(id);
  };

  const handleDeleteConfirm = async () => {
    if (deleteSewadarId === null) return;
    try {
      await deleteSewadar(deleteSewadarId);
      toast.success('Sewadar deleted');
      setDeleteSewadarId(null);
      fetchData();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sewadars.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sewadars.map(s => s.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} selected sewadars? This cannot be undone.`)) return;
    try {
      await Promise.all(Array.from(selectedIds).map(id => deleteSewadar(id)));
      toast.success(`${selectedIds.size} sewadars deleted`);
      setSelectedIds(new Set());
      fetchData();
    } catch (err) {
      toast.error('Bulk delete partially failed');
      fetchData();
    }
  };

  const handleBulkTransfer = async () => {
    if (!bulkTransferDeptId) { toast.error('Select a department first'); return; }
    try {
      await Promise.all(Array.from(selectedIds).map(id => transferSewadar(id, Number(bulkTransferDeptId))));
      toast.success(`${selectedIds.size} sewadars transferred`);
      setSelectedIds(new Set());
      setShowBulkTransfer(false);
      setBulkTransferDeptId('');
      fetchData();
    } catch (err) {
      toast.error('Bulk transfer partially failed');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto space-y-4 md:space-y-6 pb-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-100 -rotate-2 hover:rotate-0 transition-transform duration-500">
                <Users size={24} />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tighter uppercase leading-none">Sewadar Management</h1>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{sewadars.length} Active Records</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button 
              onClick={handleExport} 
              className="flex-1 sm:flex-none h-10 px-4 bg-white hover:bg-gray-50 border-2 border-gray-100 rounded-xl text-[11px] font-black text-gray-700 shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Download size={15} className="text-indigo-400" /> 
              <span>Export</span>
            </button>
            <button 
              onClick={() => openModal('upload')} 
              className="flex-1 sm:flex-none h-10 px-4 bg-white hover:bg-gray-50 border-2 border-gray-100 rounded-xl text-[11px] font-black text-gray-700 shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Upload size={15} className="text-indigo-400" /> 
              <span>Import</span>
            </button>
            <button 
              onClick={() => openModal('add')} 
              className="flex-1 sm:flex-none h-10 px-5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-[11px] font-black text-white shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Plus size={16} /> 
              <span>Add Sewadar</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
           <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search by Name or ID..." 
                className="w-full h-11 bg-white border-2 border-gray-100 focus:border-indigo-600 rounded-2xl pl-11 pr-4 text-sm font-bold text-gray-900 placeholder:text-gray-300 transition-all shadow-sm outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-full text-gray-400 transition-all"
                >
                  <X size={14} />
                </button>
              )}
           </div>

           <div className="card p-2 bg-white flex items-center shadow-sm border-gray-100 rounded-2xl h-11 min-w-0">
              <Building2 className="ml-3 text-indigo-400 shrink-0" size={16} />
              <select
                className="w-full bg-transparent border-none focus:ring-0 pl-2 pr-2 py-1.5 text-gray-700 font-bold text-sm appearance-none cursor-pointer min-w-0"
                value={centerFilter}
                onChange={(e) => { setCenterFilter(e.target.value); setDeptFilter(''); }}
              >
                <option value="">All Centers</option>
                {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
           </div>

           <div className="card p-2 bg-white flex items-center shadow-sm border-gray-100 rounded-2xl h-11 min-w-0">
              <Filter className="ml-3 text-indigo-400 shrink-0" size={16} />
              <select
                className="w-full bg-transparent border-none focus:ring-0 pl-2 pr-2 py-1.5 text-gray-700 font-bold text-sm appearance-none cursor-pointer min-w-0"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
              >
                <option value="">All Departments</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
           </div>
        </div>

        {/* Data View */}
        <div className="card bg-white border border-gray-100 shadow-sm overflow-hidden rounded-3xl">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse hidden md:table">
                <thead>
                  <tr className="bg-gray-50/30 border-b border-gray-100">
                    <th className="px-4 py-4 w-10">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 cursor-pointer"
                        checked={sewadars.length > 0 && selectedIds.size === sewadars.length}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.4em]">Name</th>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.4em]">Center</th>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.4em]">Department</th>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.4em]">Gender</th>
                    <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.4em]">Contact</th>
                    <th className="px-6 py-4 text-right text-[11px] font-black text-gray-400 uppercase tracking-[0.4em]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/50">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-40">
                         <div className="flex flex-col items-center justify-center gap-6">
                            <div className="w-24 h-24 border-[12px] border-gray-100 border-t-indigo-600 rounded-full animate-spin shadow-inner" />
                            <div className="text-center space-y-1">
                               <p className="text-lg font-black text-indigo-900 tracking-widest uppercase">Loading Sewadars...</p>
                               <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Updating Records</p>
                            </div>
                         </div>
                      </td>
                    </tr>
                  ) : sewadars.length > 0 ? (
                    sewadars.map((sw) => (
                       <tr key={sw.id} className={`group hover:bg-white hover:shadow-xl transition-all duration-300 ${selectedIds.has(sw.id) ? 'bg-indigo-50/50' : ''}`}>
                        <td className="px-4 py-3">
                           <input
                             type="checkbox"
                             className="w-4 h-4 rounded border-gray-300 text-indigo-600 cursor-pointer"
                             checked={selectedIds.has(sw.id)}
                             onChange={() => toggleSelect(sw.id)}
                             onClick={e => e.stopPropagation()}
                           />
                         </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-sm shadow-sm transition-all duration-300">
                               {sw.name[0]}
                             </div>
                             <div className="space-y-1">
                                <p className="text-base font-black text-gray-900 tracking-tight group-hover:text-indigo-700 transition-colors uppercase leading-tight">{sw.name}</p>
                                <div className="flex items-center gap-2">
                                   <span className="text-[9px] font-black text-indigo-400 tracking-widest uppercase px-1.5 py-0.5 bg-indigo-50 rounded">ID: {sw.sewadar_id}</span>
                                   <span className={`text-[9px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded ${
                                     sw.badge_status === 'Permanent' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                                   }`}>{sw.badge_status}</span>
                                </div>
                             </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                               <Building2 size={14} className="text-gray-300 shrink-0" />
                               <p className="text-xs font-bold text-gray-700 truncate">{sw.center?.name || '—'}</p>
                            </div>
                         </td>
                         <td className="px-4 py-3">
                            <p className="text-xs font-bold text-gray-700 truncate">{sw.department?.name || '—'}</p>
                         </td>
                         <td className="px-4 py-3">
                            <span className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                              sw.gender === 'Male' ? 'bg-blue-50 text-blue-600' : sw.gender === 'Female' ? 'bg-pink-50 text-pink-600' : 'bg-gray-50 text-gray-400'
                            }`}>{sw.gender || '—'}</span>
                         </td>
                        <td className="px-6 py-4">
                           <div className="space-y-1.5">
                              {sw.phone && (
                                <div className="flex items-center gap-2 text-gray-600 group-hover:text-indigo-600 transition-colors">
                                   <Phone size={14} className="opacity-40" />
                                   <span className="text-[11px] font-black tabular-nums">{sw.phone}</span>
                                </div>
                              )}
                              {sw.email && (
                                <div className="flex items-center gap-2 text-gray-400">
                                   <Mail size={14} className="opacity-40" />
                                   <span className="text-[10px] font-bold truncate max-w-[120px]">{sw.email}</span>
                                </div>
                              )}
                              {!sw.phone && !sw.email && <span className="text-[9px] font-black text-gray-300 tracking-widest uppercase italic bg-gray-50 px-2 py-0.5 rounded">No Metadata</span>}
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                              <button 
                                onClick={() => openModal('transfer', sw)} 
                                className="p-2.5 bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-indigo-100 transition-all hover:scale-105"
                                title="Transfer Department"
                              >
                                <MoveHorizontal size={18} />
                              </button>
                              <button 
                                onClick={() => openModal('edit', sw)} 
                                className="p-2.5 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-blue-100 transition-all hover:scale-105"
                                title="Edit Profile"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button 
                                onClick={() => handleDeleteRequest(sw.id)} 
                                className="p-2.5 bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-red-100 transition-all hover:scale-105"
                                title="Delete Record"
                              >
                                <Trash2 size={18} />
                              </button>
                           </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-48 text-center">
                         <div className="flex flex-col items-center justify-center gap-8 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/20 to-transparent pointer-events-none" />
                            <div className="w-32 h-32 bg-gray-50 rounded-[3rem] flex items-center justify-center text-gray-100 border-4 border-white shadow-2xl relative z-10">
                               <Users size={64} />
                            </div>
                            <div className="space-y-2 relative z-10 text-center">
                              <p className="text-3xl font-black text-gray-400 tracking-tighter uppercase">No Records Found</p>
                              <p className="text-gray-300 text-sm italic font-medium max-w-sm mx-auto">No records found matching your search criteria.</p>
                             </div>
                          </div>
                       </td>
                     </tr>
                   )}
                 </tbody>
               </table>

               {/* Mobile card list */}
               <div className="md:hidden divide-y divide-gray-50">
                 {loading ? (
                   <div className="py-16 flex flex-col items-center gap-4 text-gray-400">
                     <div className="w-10 h-10 border-4 border-gray-100 border-t-indigo-600 rounded-full animate-spin" />
                     <p className="text-sm font-bold">Loading...</p>
                   </div>
                 ) : sewadars.length > 0 ? sewadars.map((sw) => (
                   <div key={sw.id} className={`p-4 flex items-center gap-3 ${selectedIds.has(sw.id) ? 'bg-indigo-50' : 'bg-white'}`}>
                     <input
                       type="checkbox"
                       className="w-4 h-4 rounded border-gray-300 text-indigo-600 cursor-pointer flex-shrink-0"
                       checked={selectedIds.has(sw.id)}
                       onChange={() => toggleSelect(sw.id)}
                     />
                     <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-sm flex-shrink-0">
                       {sw.name[0]}
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="text-sm font-black text-gray-900 uppercase truncate">{sw.name}</p>
                       <p className="text-xs text-gray-400 font-medium truncate">
                         {sw.department?.name || '—'} • <span className="text-indigo-500">{sw.sewadar_id}</span>
                       </p>
                     </div>
                     <div className="flex items-center gap-1.5 flex-shrink-0">
                       <button onClick={() => openModal('transfer', sw)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><MoveHorizontal size={15} /></button>
                       <button onClick={() => openModal('edit', sw)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={15} /></button>
                       <button onClick={() => handleDeleteRequest(sw.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={15} /></button>
                     </div>
                   </div>
                 )) : (
                   <div className="py-20 text-center">
                     <Users size={40} className="text-gray-200 mx-auto mb-3" />
                     <p className="text-base font-black text-gray-400 uppercase">No Records Found</p>
                   </div>
                 )}
               </div>
            </div>
            {/* Pagination Bar */}
            <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
              {/* Left: per-page selector + record summary */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Show</span>
                <select
                  className="h-9 px-3 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-700 appearance-none cursor-pointer outline-none focus:border-indigo-400 transition-all shadow-sm"
                  value={limit}
                  onChange={e => { setLimit(Number(e.target.value)); setCurrentPage(1); }}
                >
                  {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">per page</span>
                <div className="h-4 w-px bg-gray-200" />
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                  {totalRecords} Total Sewadars
                </span>
              </div>

              {/* Right: page nav */}
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-indigo-600 hover:border-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                  >
                    ← Prev
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                      Math.max(0, currentPage - 3),
                      Math.min(totalPages, currentPage + 2)
                    ).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-9 h-9 rounded-xl text-[10px] font-black transition-all ${
                          currentPage === page
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                          : 'bg-white text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-indigo-600 hover:border-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                  >
                    Next →
                  </button>
                  <span className="text-[10px] font-black text-gray-400 ml-2">Page {currentPage}/{totalPages}</span>
                </div>
              )}
            </div>
          </div>

        {/* Floating Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-gray-900 text-white rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4 border border-white/10">
              <span className="text-sm font-black">{selectedIds.size} selected</span>
              <div className="w-px h-5 bg-white/20" />
              {!showBulkTransfer ? (
                <>
                  <button
                    onClick={() => setShowBulkTransfer(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                  >
                    Transfer Dept
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                  >
                    Delete
                  </button>
                </>
              ) : (
                <>
                  <select
                    className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm font-bold text-white appearance-none outline-none"
                    value={bulkTransferDeptId}
                    onChange={e => setBulkTransferDeptId(e.target.value)}
                  >
                    <option value="">Select Department...</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <button
                    onClick={handleBulkTransfer}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => { setShowBulkTransfer(false); setBulkTransferDeptId(''); }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                </>
              )}
              <button
                onClick={() => { setSelectedIds(new Set()); setShowBulkTransfer(false); }}
                className="ml-2 text-gray-400 hover:text-white transition-colors text-xs font-black uppercase tracking-widest"
              >
                ✕ Clear
              </button>
            </div>
          </div>
        )}

        {/* Modal Engine */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6 animate-in fade-in duration-300">
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
            <div className={`relative bg-white w-full sm:rounded-[2.5rem] rounded-t-[2.5rem] shadow-[0_-32px_128px_-32px_rgba(0,0,0,0.15)] sm:shadow-[0_64px_256px_-64px_rgba(0,0,0,0.3)] overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 sm:slide-in-from-bottom-0 duration-300 pb-safe ${modalType === 'transfer' ? 'sm:max-w-lg' : 'sm:max-w-xl'}`}>`
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-900 p-5 text-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                 <div className="relative z-10 flex justify-between items-center">
                    <div>
                       <p className="text-[7px] font-black uppercase tracking-[0.4em] text-indigo-200 mb-1">RSSB Management</p>
                       <h3 className="text-lg font-black tracking-tight uppercase">
                         {modalType === 'add' && 'Add Sewadar'}
                         {modalType === 'edit' && 'Update Sewadar'}
                         {modalType === 'transfer' && 'Transfer Sewadar'}
                         {modalType === 'upload' && 'Import Excel Data'}
                       </h3>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all active:scale-90">
                       <X size={18} />
                    </button>
                 </div>
              </div>

              <div className="p-5">
                {modalType === 'upload' ? (
                  <div className="space-y-6">
                    {/* Center Selection for Super Admin */}
                    {isSuperAdmin && (
                      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-4">
                         <div className="flex items-center gap-3">
                           <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                             <Building2 size={16} />
                           </div>
                           <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">
                             Target Center
                           </p>
                         </div>
                         <select
                           className="w-full h-11 bg-white border-2 border-gray-100 focus:border-indigo-600 rounded-xl px-4 text-gray-900 font-bold transition-all outline-none text-sm"
                           value={uploadCenterId}
                           onChange={(e) => setUploadCenterId(e.target.value)}
                           required
                         >
                           <option value="">Choose a center...</option>
                           {centers.map(c => (
                             <option key={c.id} value={c.id}>{c.name}</option>
                           ))}
                         </select>
                      </div>
                    )}

                    <div className="flex flex-col items-center py-8 bg-white rounded-3xl border-4 border-dashed border-gray-100 hover:border-indigo-200 transition-colors relative group overflow-hidden">
                      <div className="absolute inset-0 bg-indigo-50/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="w-20 h-20 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform relative z-10">
                        <Upload size={32} />
                      </div>
                      <label className="cursor-pointer relative z-10 text-center">
                        <span className="text-xl font-black text-gray-900 block mb-1">Upload Excel Records</span>
                        <span className="text-indigo-600 font-bold hover:underline text-sm">Browse Files</span>
                        <input type="file" className="hidden" accept=".xlsx" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
                      </label>
                      
                      {uploadFile && (
                        <div className="mt-6 p-4 bg-indigo-600 text-white rounded-2xl flex items-center gap-3 animate-in slide-in-from-bottom-2 shadow-xl relative z-20">
                          <CheckCircle2 size={20} />
                          <div className="text-left">
                             <p className="text-[8px] font-black uppercase tracking-widest text-indigo-200 line-clamp-1">{uploadFile.name}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                       <div className="flex-1 bg-gray-50 rounded-2xl p-5 border border-gray-100">
                          <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                             Format Instructions
                          </p>
                          <div className="space-y-2 text-[10px] font-bold text-gray-500">
                            <div className="flex justify-between border-b pb-1 font-black text-[8px] text-gray-400"><span>Column</span><span>Field</span></div>
                            <div className="flex justify-between"><span>Col A</span><span className="text-indigo-600">Sewadar ID</span></div>
                            <div className="flex justify-between"><span>Col B</span><span className="text-indigo-600">Full Name</span></div>
                            <div className="flex justify-between"><span>Col C</span><span className="text-indigo-600">Parent/Spouse</span></div>
                          </div>
                       </div>
                       <button onClick={handleBulkUpload} disabled={!uploadFile || loading} className="h-20 md:w-48 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 text-white rounded-2xl flex flex-col items-center justify-center gap-1 shadow-lg transition-all active:scale-95">
                          {loading ? <Loader2 className="animate-spin" size={24} /> : (
                             <>
                               <p className="text-lg font-black tracking-tight">Process File</p>
                               <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Save to System</p>
                             </>
                          )}
                       </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {(modalType === 'add' || modalType === 'edit') && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
                         <div className="space-y-4">
                            <div className="space-y-1.5 px-1">
                               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                               <div className="relative group">
                                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                                  <input
                                    type="text"
                                    className="w-full h-11 bg-gray-50 focus:bg-white border-2 border-transparent focus:border-indigo-600 rounded-xl pl-10 pr-4 text-gray-900 font-bold transition-all shadow-inner outline-none text-sm"
                                    value={formData.name || ''}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter name"
                                    required
                                  />
                               </div>
                            </div>

                            <div className="space-y-1.5 px-1">
                               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sewadar ID</label>
                               <div className="relative group">
                                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-600 transition-colors" size={16} />
                                  <input
                                    type="text"
                                    className="w-full h-11 bg-gray-50 focus:bg-white border-2 border-transparent focus:border-indigo-600 rounded-xl pl-10 pr-4 text-gray-900 font-bold uppercase transition-all shadow-inner outline-none text-sm tracking-tight"
                                    value={formData.sewadar_id}
                                    onChange={(e) => setFormData({ ...formData, sewadar_id: e.target.value.toUpperCase() })}
                                    placeholder="ID-0000X"
                                    required
                                  />
                               </div>
                            </div>

                            <div className="space-y-1.5 px-1">
                               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Department</label>
                               <div className="relative group">
                                  <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-600 transition-colors" size={16} />
                                  <select
                                    className="w-full h-11 bg-gray-50 focus:bg-white border-2 border-transparent focus:border-indigo-600 rounded-xl pl-10 pr-6 text-gray-900 font-bold appearance-none transition-all shadow-inner outline-none cursor-pointer text-sm"
                                    value={formData.department_id}
                                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                                  >
                                    <option value="">Map to Department...</option>
                                    {departments.map((d) => (
                                      <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                  </select>
                               </div>
                            </div>
                         </div>

                         <div className="space-y-4">
                            <div className="space-y-1.5 px-1">
                               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Parent/Spouse</label>
                               <div className="relative group">
                                  <UserCheck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
                                  <input
                                    type="text"
                                    className="w-full h-11 bg-gray-50 focus:bg-white border-2 border-transparent focus:border-indigo-600 rounded-xl pl-10 pr-4 text-gray-900 font-bold transition-all shadow-inner outline-none text-sm"
                                    value={formData.parent_spouse_name}
                                    onChange={(e) => setFormData({ ...formData, parent_spouse_name: e.target.value })}
                                    placeholder="Enter parent/spouse"
                                    required
                                  />
                               </div>
                            </div>

                            <div className="space-y-1.5 px-1">
                               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                               <div className="relative group">
                                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-600 transition-colors" size={16} />
                                  <input
                                    type="text"
                                    className="w-full h-11 bg-gray-50 focus:bg-white border-2 border-transparent focus:border-indigo-600 rounded-xl pl-10 pr-4 text-gray-900 font-bold transition-all shadow-inner outline-none text-sm"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+91-0000000000"
                                    required
                                  />
                               </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 px-1">
                               <div className="space-y-1.5">
                                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Status</label>
                                  <select
                                    className="w-full h-11 bg-indigo-50 border-2 border-indigo-100 focus:border-indigo-600 focus:bg-white rounded-xl px-3 text-indigo-700 font-bold appearance-none transition-all outline-none cursor-pointer text-[12px] shadow-inner"
                                    value={formData.badge_status}
                                    onChange={(e) => setFormData({ ...formData, badge_status: e.target.value })}
                                    required
                                  >
                                    <option value="Permanent">Permanent</option>
                                    <option value="Open">Open</option>
                                    <option value="Elderly">Elderly</option>
                                  </select>
                               </div>
                               <div className="space-y-1.5">
                                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Gender</label>
                                  <select
                                    className="w-full h-11 bg-gray-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-xl px-3 text-gray-700 font-bold appearance-none transition-all outline-none cursor-pointer text-[12px] shadow-inner"
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    required
                                  >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                  </select>
                               </div>
                            </div>
                         </div>

                         {isSuperAdmin && (
                            <div className="md:col-span-2 space-y-1.5 px-1 animate-in slide-in-from-top-2 duration-500">
                               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Center Assignment</label>
                               <div className="relative group">
                                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-600 transition-colors" size={16} />
                                  <select
                                    className="w-full h-11 bg-gray-900 text-white border-2 border-transparent focus:border-indigo-400 rounded-xl pl-10 pr-6 text-sm font-bold appearance-none transition-all shadow-xl outline-none cursor-pointer"
                                    value={formData.center_id}
                                    onChange={(e) => setFormData({ ...formData, center_id: e.target.value })}
                                    required
                                  >
                                    <option value="">Select Center...</option>
                                    {centers.map((c) => (
                                      <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                  </select>
                               </div>
                            </div>
                         )}
                      </div>
                    )}

                    {modalType === 'transfer' && (
                      <div className="space-y-6 py-2 px-1 animate-in fade-in zoom-in-95 duration-500">
                        <div className="p-6 bg-gradient-to-br from-indigo-50 via-white to-gray-50 rounded-3xl border-2 border-indigo-100 flex items-center gap-5 shadow-sm">
                           <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100 flex-shrink-0">
                              <MoveHorizontal size={28} />
                           </div>
                           <div className="flex-1 min-w-0">
                             <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Transferring Sewadar</p>
                             <h4 className="text-xl font-black text-gray-900 truncate uppercase tracking-tight">{currentSewadar?.name}</h4>
                             <div className="mt-1 flex items-center gap-2">
                               <span className="text-[10px] font-bold text-gray-400 uppercase">From:</span>
                               <span className="text-[11px] font-black text-indigo-700 px-2 py-0.5 bg-indigo-50 rounded-md border border-indigo-100">{currentSewadar?.department?.name}</span>
                             </div>
                           </div>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Target Department</label>
                           <div className="relative group">
                              <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600" size={18} />
                              <select
                                className="w-full h-12 bg-white border-2 border-gray-100 focus:border-indigo-600 rounded-xl pl-11 pr-8 text-sm font-bold appearance-none transition-all shadow-sm outline-none cursor-pointer"
                                value={newDeptId}
                                onChange={(e) => setNewDeptId(e.target.value)}
                                required
                              >
                                <option value="">Select Department...</option>
                                {departments.map((d) => (
                                  <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                              </select>
                           </div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row gap-3 pt-4 border-t border-gray-100">
                      <button type="button" onClick={() => setIsModalOpen(false)} className="h-11 flex-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-400 font-black uppercase tracking-widest text-[10px] rounded-xl transition-all hover:text-gray-900">Cancel</button>
                      <button type="submit" className="h-11 flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-widest rounded-xl shadow-lg transition-all hover:-translate-y-0.5 active:scale-95">
                        {modalType === 'add' ? 'Add Sewadar' : modalType === 'edit' ? 'Save Changes' : 'Transfer Sewadar'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Protocol */}
        {deleteSewadarId !== null && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-3xl" onClick={() => setDeleteSewadarId(null)} />
            <div className="relative bg-white rounded-[3rem] p-10 text-center max-w-md shadow-[0_64px_256px_-64px_rgba(220,38,38,0.4)] animate-in zoom-in-95 duration-500 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600" />
              <div className="w-20 h-20 rounded-[2rem] bg-red-50 flex items-center justify-center text-red-600 mx-auto mb-6 shadow-inner">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight mb-3 uppercase">Delete Record</h3>
              <p className="text-gray-500 font-bold text-sm leading-relaxed mb-8">This will permanently delete this record. <span className="text-red-600 underline">Irreversible.</span></p>
              <div className="flex flex-col gap-2">
                <button onClick={handleDeleteConfirm} className="h-14 bg-red-600 hover:bg-red-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-red-100 transition-all hover:-translate-y-0.5 active:scale-95 uppercase tracking-widest">Confirm Delete</button>
                <button onClick={() => setDeleteSewadarId(null)} className="h-10 bg-white hover:bg-gray-50 text-gray-400 font-black rounded-xl transition-all uppercase tracking-widest text-[9px]">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
