'use client';

import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  getAttendance, 
  checkIn, 
  checkOut, 
  searchSewadars,
  getDepartments,
  exportAttendance
} from '@/lib/api';
import { Attendance, Sewadar, Department } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { 
  Search, 
  UserCheck, 
  UserMinus, 
  Download, 
  Filter, 
  Calendar,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatTime, formatDate } from '@/lib/utils';
import debounce from 'lodash/debounce';

export default function AttendancePage() {
  const { user, canMarkAttendance, isAdmin } = useAuth();
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Sewadar[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Filters
  const [deptFilter, setDeptFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        date_from: dateFilter,
        date_to: dateFilter,
      };
      if (deptFilter) params.department_id = deptFilter;
      
      const { data } = await getAttendance(params);
      setAttendance(data);
    } catch (err) {
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  }, [dateFilter, deptFilter]);

  useEffect(() => {
    fetchAttendance();
    getDepartments().then(res => setDepartments(res.data)).catch(() => {});
  }, [fetchAttendance]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const { data } = await searchSewadars(query);
        setSearchResults(data);
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

  const handleExport = async () => {
    try {
      const params: any = { date_from: dateFilter, date_to: dateFilter };
      if (deptFilter) params.department_id = deptFilter;
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

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-500 mt-1">Mark and monitor daily check-ins</p>
        </div>
        <button onClick={handleExport} className="btn-secondary">
          <Download size={18} />
          Export Excel
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Marking Area */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-6 shadow-md border-primary-100 bg-white">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <UserCheck size={20} className="text-primary-600" />
              Quick Check-In
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                className="input pl-10 h-11"
                placeholder="Search Name or Sewadar ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {isSearching && (
                <div className="absolute right-3 top-2.5">
                  <Loader2 className="animate-spin text-primary-500" size={18} />
                </div>
              )}
            </div>

            {/* Search Results Dropdown-like UI */}
            {searchResults.length > 0 && searchQuery && (
              <div className="mt-2 border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50 bg-white shadow-xl animate-fade-in z-20 relative">
                {searchResults.map((sw) => (
                  <button
                    key={sw.id}
                    onClick={() => handleCheckIn(sw)}
                    className="w-full p-4 flex items-center justify-between hover:bg-primary-50 transition-colors group text-left"
                  >
                    <div>
                      <p className="font-bold text-gray-900 group-hover:text-primary-700">{sw.name}</p>
                      <p className="text-xs text-gray-500 font-medium">
                        ID: {sw.sewadar_id} • {sw.department?.name}
                      </p>
                    </div>
                    <UserCheck size={18} className="text-gray-300 group-hover:text-primary-600" />
                  </button>
                ))}
              </div>
            )}
            
            {searchQuery && !isSearching && searchResults.length === 0 && (
              <div className="mt-4 p-4 text-center text-gray-500 text-sm italic bg-gray-50 rounded-xl">
                No sewadars found matching "{searchQuery}"
              </div>
            )}
          </div>

          <div className="card p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Filters</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <input
                    type="date"
                    className="input pl-10"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="label">Department</label>
                <div className="relative">
                  <Filter className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <select
                    className="select pl-10"
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                  >
                    <option value="">All Departments</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Attendance List */}
        <div className="lg:col-span-2">
          <div className="card shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
              <h2 className="text-lg font-bold text-gray-900">Today's Records</h2>
              <span className="badge badge-blue">{attendance.length} Total</span>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-12 flex flex-col items-center justify-center text-gray-400">
                  <Loader2 className="animate-spin mb-4" size={32} />
                  <p>Loading records...</p>
                </div>
              ) : attendance.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="table-th">Sewadar</th>
                      <th className="table-th">Department</th>
                      <th className="table-th">Check-In</th>
                      <th className="table-th">Check-Out</th>
                      <th className="table-th text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {attendance.map((record) => (
                      <tr key={record.id} className="table-tr">
                        <td className="table-td">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{record.sewadar?.name}</span>
                            <span className="text-xs text-gray-500 font-mono tracking-tighter uppercase">{record.sewadar?.sewadar_id}</span>
                          </div>
                        </td>
                        <td className="table-td">
                          <span className="badge badge-gray">{record.department?.name}</span>
                        </td>
                        <td className="table-td font-semibold text-gray-600">
                          {formatTime(record.check_in)}
                        </td>
                        <td className="table-td font-semibold text-gray-600">
                          {record.check_out ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <CheckCircle2 size={14} />
                              {formatTime(record.check_out)}
                            </span>
                          ) : (
                            <span className="text-amber-500 flex items-center gap-1">
                              <Clock size={14} />
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="table-td text-right">
                          {!record.check_out && canMarkAttendance && (
                            <button
                              onClick={() => handleCheckOut(record.id)}
                              className="text-primary-600 hover:text-primary-700 font-bold text-xs uppercase tracking-wider flex items-center gap-1 ml-auto"
                            >
                              <UserMinus size={14} />
                              Check Out
                            </button>
                          )}
                          {record.check_out && (
                            <span className="text-gray-300">
                              <CheckCircle2 size={20} className="ml-auto" />
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center text-gray-400">
                  <UserCheck size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="font-medium">No attendance records found for this date</p>
                  <p className="text-sm">Use the search to mark check-in</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
