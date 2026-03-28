'use client';

import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  getAttendance, 
  checkIn, 
  checkOut, 
  getSewadars,
  getDepartments,
  exportAttendance,
  getCenters
} from '@/lib/api';
import { Attendance, Sewadar, Department } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { 
  Search, 
  UserCheck, 
  UserMinus, 
  Download, 
  Filter, 
  Calendar as CalendarIcon, 
  Loader2,
  CheckCircle2,
  Clock,
  Activity,
  Building2,
  RefreshCw,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatTime, formatDate } from '@/lib/utils';
import debounce from 'lodash/debounce';

export default function AttendancePage() {
  const { user, canMarkAttendance, isAdmin, isSuperAdmin, token } = useAuth();
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLiveStatus, setShowLiveStatus] = useState(false);
  
  // Derived stats
  const stats = {
    total: attendance.length,
    present: attendance.filter(a => !a.check_out).length,
    completed: attendance.filter(a => !!a.check_out).length,
    lastActivity: attendance.length > 0 ? attendance[0].check_in : null
  };
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Sewadar[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Filters
  const [deptFilter, setDeptFilter] = useState<string>('');
  const [centerFilter, setCenterFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);

  // Edit state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Attendance | null>(null);
  const [editFormData, setEditFormData] = useState({ check_in: '', check_out: '' });

  // Table search state
  const [tableSearch, setTableSearch] = useState('');

  // Checkout search state
  const [checkoutQuery, setCheckoutQuery] = useState('');

  // Derived: sewadars currently on duty (no checkout yet)
  const activeSewadars = attendance.filter(a => !a.check_out);
  const filteredCheckoutResults = checkoutQuery.trim()
    ? activeSewadars.filter(a =>
        a.sewadar?.name.toLowerCase().includes(checkoutQuery.toLowerCase()) ||
        a.sewadar?.sewadar_id.toLowerCase().includes(checkoutQuery.toLowerCase())
      )
    : [];

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        date_from: dateFilter,
        date_to: dateFilter,
      };
      if (deptFilter) params.department_id = deptFilter;
      if (centerFilter) params.center_id = centerFilter;
      
      const { data } = await getAttendance(params);
      setAttendance(data);
    } catch (err) {
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  }, [dateFilter, deptFilter, centerFilter]);

  useEffect(() => {
    if (isSuperAdmin && token) {
      getCenters().then(res => setCenters(res.data)).catch(() => {});
    }
  }, [isSuperAdmin, token]);

  useEffect(() => {
    if (token) {
      fetchAttendance();
      const params: any = {};
      if (centerFilter) params.center_id = centerFilter;
      getDepartments(params).then(res => setDepartments(res.data)).catch(() => {});
    }
  }, [fetchAttendance, centerFilter, token]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const { data } = await getSewadars({ 
          q: query, 
          center_id: centerFilter ? Number(centerFilter) : undefined 
        });
        setSearchResults(data.data || []); // Accessing .data from the nested response
      } catch (err) {
        toast.error('Search failed');
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);
  
  // Polling for live mode
  useEffect(() => {
    let interval: any;
    if (showLiveStatus && token) {
      interval = setInterval(() => {
        fetchAttendance();
      }, 30000); // 30 seconds
    }
    return () => clearInterval(interval);
  }, [showLiveStatus, token, fetchAttendance]);

  const handleCheckIn = async (sewadar: Sewadar) => {
    try {
      await checkIn(sewadar.id, sewadar.department_id);
      toast.success(`${sewadar.name} checked in`);
      setSearchQuery('');
      setSearchResults([]);
      fetchAttendance();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Check-in failed');
    }
  };

  const handleCheckOut = async (id: number) => {
    try {
      await checkOut(id);
      toast.success('Check-out recorded');
      fetchAttendance();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Check-out failed');
    }
  };

  const handleBulkCheckOut = async () => {
    const presentRecords = attendance.filter(a => !a.check_out);
    if (presentRecords.length === 0) {
      toast.error('No active sewadars to check out');
      return;
    }
    
    if (!confirm(`Are you sure you want to check out all ${presentRecords.length} sewadars?`)) return;
    
    setLoading(true);
    try {
      await Promise.all(presentRecords.map(r => checkOut(r.id)));
      toast.success(`Successfully checked out ${presentRecords.length} sewadars`);
      fetchAttendance();
    } catch (err) {
      toast.error('Bulk check-out partially failed. Please refresh.');
      fetchAttendance();
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params: any = { date_from: dateFilter, date_to: dateFilter };
      if (deptFilter) params.department_id = deptFilter;
      if (centerFilter) params.center_id = centerFilter;
      const { data } = await exportAttendance(params);
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_${dateFilter}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Export failed');
    }
  };

  const openEditModal = (record: Attendance) => {
    setEditingRecord(record);
    setEditFormData({
      check_in: record.check_in.substring(11, 16),
      check_out: record.check_out ? record.check_out.substring(11, 16) : ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    
    try {
      const date = editingRecord.check_in.split('T')[0];
      const payload: any = {
        check_in: `${date}T${editFormData.check_in}:00Z`,
        check_out: editFormData.check_out ? `${date}T${editFormData.check_out}:00Z` : null
      };
      
      const { updateAttendance } = await import('@/lib/api');
      await updateAttendance(editingRecord.id, payload);
      toast.success('Attendance updated');
      setIsEditModalOpen(false);
      fetchAttendance();
    } catch (err) {
      toast.error('Failed to update attendance');
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in pb-20">
        {/* Header — Two Search Bars */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
              <CalendarIcon size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase leading-none">Attendance Tracking</h1>
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live Attendance Log
              </div>
            </div>
          </div>

          {canMarkAttendance && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Check-in Search */}
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                  <UserCheck size={16} className="text-indigo-500" />
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest hidden sm:block">Check-In</span>
                </div>
                <input 
                  type="text" 
                  placeholder="Search sewadar to check in..." 
                  className="w-full bg-white border-2 border-gray-200 focus:border-indigo-600 rounded-2xl pl-24 pr-4 py-3 text-gray-900 font-bold placeholder:text-gray-300 transition-all shadow-sm outline-none text-xs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {(isSearching || searchResults.length > 0) && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-in zoom-in-95 duration-200">
                    {isSearching ? (
                      <div className="p-8 flex items-center justify-center text-indigo-600 gap-3">
                        <Loader2 className="animate-spin" size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Searching...</span>
                      </div>
                    ) : (
                      <div className="p-2 space-y-1 max-h-72 overflow-y-auto">
                        {searchResults.map((sw) => (
                          <button
                            key={sw.id}
                            onClick={() => handleCheckIn(sw)}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-indigo-50 rounded-xl transition-all group/item text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-700 font-black text-sm group-hover/item:bg-indigo-600 group-hover/item:text-white transition-all">
                                {sw.name[0]}
                              </div>
                              <div>
                                <p className="font-black text-gray-900 text-sm tracking-tight group-hover/item:text-indigo-700">{sw.name}</p>
                                <p className="text-[9px] text-gray-400 font-black tracking-widest uppercase">
                                  {sw.sewadar_id} • {sw.department?.name || 'General'}
                                </p>
                              </div>
                            </div>
                            <UserCheck size={16} className="text-indigo-400 group-hover/item:text-indigo-600" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Check-out Search */}
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                  <UserMinus size={16} className="text-red-400" />
                  <span className="text-[9px] font-black text-red-400 uppercase tracking-widest hidden sm:block">Check-Out</span>
                </div>
                <input 
                  type="text" 
                  placeholder="Search active sewadar to check out..." 
                  className="w-full bg-white border-2 border-gray-200 focus:border-red-400 rounded-2xl pl-28 pr-4 py-3 text-gray-900 font-bold placeholder:text-gray-300 transition-all shadow-sm outline-none text-xs"
                  value={checkoutQuery}
                  onChange={(e) => setCheckoutQuery(e.target.value)}
                />
                {filteredCheckoutResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="p-2 space-y-1 max-h-72 overflow-y-auto">
                      {filteredCheckoutResults.map((record) => (
                        <button
                          key={record.id}
                          onClick={() => { handleCheckOut(record.id); setCheckoutQuery(''); }}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-red-50 rounded-xl transition-all group/item text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-500 font-black text-sm group-hover/item:bg-red-500 group-hover/item:text-white transition-all">
                              {record.sewadar?.name[0]}
                            </div>
                            <div>
                              <p className="font-black text-gray-900 text-sm tracking-tight group-hover/item:text-red-600">{record.sewadar?.name}</p>
                              <p className="text-[9px] text-gray-400 font-black tracking-widest uppercase">
                                {record.sewadar?.sewadar_id} • In: {formatTime(record.check_in)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">
                            <UserMinus size={12} />
                            Out
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {checkoutQuery.trim() && filteredCheckoutResults.length === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 p-4 text-center">
                    <p className="text-xs font-black text-gray-400 uppercase">No active sewadars found</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Dashboard Control Panel & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
           <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card p-1 bg-white/80 backdrop-blur-md flex items-center shadow-lg shadow-gray-200/50 border-white border-2 rounded-xl h-12">
                 <CalendarIcon className="ml-5 text-indigo-400" size={18} />
                 <input 
                   type="date"
                   className="w-full bg-transparent border-none focus:ring-0 px-4 py-3 text-gray-900 font-black text-sm cursor-pointer"
                   value={dateFilter}
                   onChange={(e) => setDateFilter(e.target.value)}
                 />
              </div>

              <div className="card p-1 bg-white/80 backdrop-blur-md flex items-center shadow-lg shadow-gray-200/50 border-white border-2 rounded-xl h-12">
                 <Building2 className="ml-5 text-indigo-400" size={18} />
                 <select
                   className="w-full bg-transparent border-none focus:ring-0 px-4 py-3 text-gray-700 font-bold text-sm appearance-none cursor-pointer"
                   value={centerFilter}
                   onChange={(e) => { setCenterFilter(e.target.value); setDeptFilter(''); }}
                 >
                   <option value="">ALL CENTERS</option>
                   {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
              </div>

              <div className="card p-1 bg-white/80 backdrop-blur-md flex items-center shadow-lg shadow-gray-200/50 border-white border-2 rounded-xl h-12">
                 <Filter className="ml-5 text-indigo-400" size={18} />
                 <select
                   className="w-full bg-transparent border-none focus:ring-0 px-4 py-3 text-gray-700 font-bold text-sm appearance-none cursor-pointer"
                   value={deptFilter}
                   onChange={(e) => setDeptFilter(e.target.value)}
                 >
                   <option value="">ALL DEPARTMENTS</option>
                   {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                 </select>
              </div>
           </div>

           <div className="flex gap-3 h-12">
              <button 
                onClick={() => setShowLiveStatus(!showLiveStatus)}
                className={`flex-1 rounded-xl px-4 flex items-center justify-between shadow-xl border-2 transition-all ${showLiveStatus ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white border-gray-100 text-gray-400 hover:border-indigo-200'}`}
              >
                <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${showLiveStatus ? 'bg-white animate-pulse' : 'bg-gray-300'}`} />
                   <span className="text-[10px] font-black uppercase tracking-widest">Live Mode</span>
                </div>
                <RefreshCw size={16} className={showLiveStatus ? 'animate-spin' : ''} />
              </button>
              <button 
               onClick={handleExport}
               className="w-12 bg-gray-900 hover:bg-black border-2 border-gray-800 rounded-xl flex items-center justify-center text-white transition-all shadow-xl active:scale-95"
              >
                <Download size={22} />
              </button>
           </div>
        </div>

        {/* Stats Summary Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
           <div className="bg-white border-2 border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-6 flex flex-col justify-between group hover:scale-[1.02] transition-all">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Total Logins</p>
              <div className="flex items-end justify-between mt-2">
                 <h4 className="text-4xl font-black text-gray-900 tracking-tighter">{stats.total}</h4>
                 <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Activity size={20} />
                 </div>
              </div>
           </div>

           <div className="bg-white border-2 border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-6 flex flex-col justify-between group hover:scale-[1.02] transition-all border-l-4 border-l-green-500">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Active Now</p>
              <div className="flex items-end justify-between mt-2">
                 <h4 className="text-4xl font-black text-gray-900 tracking-tighter">{stats.present}</h4>
                 <div className="p-3 bg-green-50 text-green-600 rounded-2xl group-hover:bg-green-600 group-hover:text-white transition-colors relative">
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping" />
                    <UserCheck size={20} />
                 </div>
              </div>
           </div>

           <div className="bg-white border-2 border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-6 flex flex-col justify-between group hover:scale-[1.02] transition-all border-l-4 border-l-amber-500">
              <div className="flex justify-between items-start">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Completed</p>
              </div>
              <div className="flex items-end justify-between mt-2">
                 <h4 className="text-4xl font-black text-gray-900 tracking-tighter">{stats.completed}</h4>
                 <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <UserMinus size={20} />
                 </div>
              </div>
              {stats.present > 0 && canMarkAttendance && (
                <button
                  onClick={handleBulkCheckOut}
                  className="mt-4 w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-red-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <UserMinus size={14} />
                  Checkout All ({stats.present} Active)
                </button>
              )}
           </div>


           <div className="bg-gray-900 shadow-2xl rounded-[2rem] p-6 flex flex-col justify-between group border-4 border-gray-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl -translate-y-12 translate-x-12" />
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] relative z-10">Latest Entry</p>
              <div className="flex items-end justify-between mt-2 relative z-10">
                 <h4 className="text-2xl font-black text-white tracking-widest tabular-nums uppercase">{stats.lastActivity ? formatTime(stats.lastActivity) : 'N/A'}</h4>
                 <div className="p-3 bg-white/10 text-white rounded-2xl">
                    <Clock size={20} />
                 </div>
              </div>
           </div>
        </div>

        {/* Data Grid Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight w-full sm:w-auto">Daily Log</h2>
            <div className="relative w-full sm:w-72 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Search Check-ins..." 
                className="w-full bg-white border-2 border-gray-100 focus:border-indigo-600 rounded-xl pl-10 pr-4 py-2 text-sm font-bold text-gray-900 placeholder:text-gray-300 transition-all shadow-sm outline-none"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
              />
              {tableSearch && (
                <button 
                  onClick={() => setTableSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full text-gray-400 transition-all"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {loading ? (
          <div className="group/table relative animate-pulse">
             <div className="card relative bg-white/50 backdrop-blur-3xl border-none shadow-sm overflow-hidden rounded-[3rem]">
               <div className="p-12 space-y-8">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="flex items-center justify-between gap-8 opacity-40">
                       <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gray-200 rounded-2xl" />
                          <div className="space-y-3">
                             <div className="w-48 h-6 bg-gray-200 rounded-lg" />
                             <div className="w-32 h-3 bg-gray-100 rounded" />
                          </div>
                       </div>
                       <div className="flex-1 space-y-2">
                          <div className="w-24 h-4 bg-gray-200 rounded" />
                          <div className="w-16 h-2 bg-gray-100 rounded" />
                       </div>
                       <div className="w-32 h-12 bg-gray-200 rounded-xl" />
                    </div>
                  ))}
               </div>
             </div>
          </div>
        ) : (
          <div className="group/table relative transition-all duration-700">
             <div className="absolute -inset-1 bg-gradient-to-b from-indigo-50 via-transparent to-indigo-50 rounded-[3.5rem] blur-2xl opacity-0 group-hover/table:opacity-100 transition-opacity" />
             <div className="card relative bg-white/70 backdrop-blur-3xl border-none shadow-[0_32px_128px_-16px_rgba(0,0,0,0.08)] overflow-hidden rounded-[3rem]">
               <div className="overflow-x-auto custom-scrollbar">
                 <table className="w-full border-collapse">
                   <thead>
                     <tr className="bg-white/50 border-b border-gray-100">
                      <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Name</th>
                      <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Center & Department</th>
                      <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">In Time</th>
                      <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Out Time</th>
                      <th className="px-6 py-4 text-right text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Actions</th>
                    </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50/50">
                     {attendance
                        .filter(record => 
                          !tableSearch || 
                          record.sewadar?.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
                          record.sewadar?.sewadar_id.toLowerCase().includes(tableSearch.toLowerCase())
                        )
                        .map((record) => (
                       <tr key={record.id} className="group hover:bg-white hover:shadow-2xl hover:shadow-indigo-100/30 transition-all duration-500">                        <td className="px-6 py-2">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 flex items-center justify-center text-indigo-700 font-bold text-xs shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                 {record.sewadar?.name[0]}
                               </div>
                               <div>
                                  <p className="text-sm font-black text-gray-900 tracking-tight uppercase leading-none">{record.sewadar?.name}</p>
                                  <p className="text-[9px] font-black text-indigo-300 tracking-widest uppercase mt-0.5">{record.sewadar?.sewadar_id}</p>
                               </div>
                            </div>
                          </td>
                         <td className="px-6 py-4">
                            <div className="space-y-1">
                               <p className="text-xs font-black text-gray-800 tracking-tight uppercase leading-none">{record.department?.name || 'GENERAL'}</p>
                               <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 text-[9px] font-black text-gray-400 rounded group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                                 <Building2 size={10} />
                                 {record.sewadar?.center?.name || 'GLOBAL HQ'}
                               </span>
                            </div>
                         </td>
                          <td className="px-6 py-2">
                            <div className="flex items-center gap-2.5">
                               <div className="w-6 h-6 rounded-lg bg-green-50 flex items-center justify-center text-green-500 border border-green-100 shadow-sm">
                                  <Clock size={12} />
                               </div>
                               <span className="text-xs font-black text-gray-900 tabular-nums leading-none">{formatTime(record.check_in)}</span>
                            </div>
                          </td>
                         <td className="px-6 py-2">
                            {record.check_out ? (
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 border border-amber-100 shadow-sm">
                                   <Clock size={12} />
                                </div>
                                <span className="text-xs font-black text-gray-400 tabular-nums leading-none">{formatTime(record.check_out)}</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-[0.15em] rounded-lg shadow-sm border border-white/20">
                                 <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                 ON DUTY
                              </div>
                            )}
                         </td>                          <td className="px-6 py-2 text-right">
                            {!record.check_out && canMarkAttendance ? (
                              <button
                                onClick={() => handleCheckOut(record.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md hover:bg-red-700 transition-all active:scale-95"
                              >
                                <UserMinus size={14} />
                                CHECK OUT
                              </button>
                           ) : (
                             <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                {canMarkAttendance && (
                                  <button 
                                    onClick={() => openEditModal(record)}
                                    className="p-2 text-indigo-400 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                                    title="Manual Correction"
                                  >
                                     <Clock size={16} />
                                  </button>
                                )}
                                <div className="p-2 text-green-500 bg-green-50 border border-green-100 rounded-lg shadow-inner">
                                   <CheckCircle2 size={16} />
                                </div>
                             </div>
                           )}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
               
               {attendance.length === 0 && (
                 <div className="py-48 text-center flex flex-col items-center justify-center gap-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/20 to-transparent pointer-events-none" />
                    <div className="w-32 h-32 bg-gray-50 rounded-[3rem] flex items-center justify-center text-gray-100 border-4 border-white shadow-2xl relative z-10">
                       <UserCheck size={64} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-black text-gray-400 capitalize tracking-tight">No Attendance Records</p>
                      <p className="text-gray-300 text-sm italic font-medium max-w-xs mx-auto">No attendance has been recorded for this date yet.</p>
                    </div>
                 </div>
                )}
              </div>
           </div>
         )}
       </div>
        {/* Edit Attendance Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/80 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="bg-gray-900 p-8 flex justify-between items-center text-white">
                <div>
                   <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Correction Mode</p>
                   <h3 className="text-xl font-black uppercase tracking-tight">Adjust Times</h3>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="p-8 space-y-6">
                 <div className="space-y-2 text-center pb-4 border-b border-gray-100">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none">Record For</p>
                    <p className="text-xl font-black text-gray-900 tracking-tighter uppercase leading-none">{editingRecord?.sewadar?.name}</p>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Check In</label>
                       <input 
                         type="time" 
                         required
                         className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-indigo-600 rounded-xl font-black text-gray-900 outline-none transition-all shadow-inner"
                         value={editFormData.check_in}
                         onChange={e => setEditFormData({...editFormData, check_in: e.target.value})}
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Check Out</label>
                       <input 
                         type="time" 
                         className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-indigo-600 rounded-xl font-black text-gray-900 outline-none transition-all shadow-inner"
                         value={editFormData.check_out}
                         onChange={e => setEditFormData({...editFormData, check_out: e.target.value})}
                       />
                    </div>
                 </div>

                 <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 rounded-xl transition-all">Cancel</button>
                    <button type="submit" className="flex-[2] py-4 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl hover:bg-indigo-600 transition-all active:scale-95">Save Changes</button>
                 </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
