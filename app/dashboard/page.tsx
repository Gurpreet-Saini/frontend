'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { getDashboard, getCenters } from '@/lib/api';
import { DashboardStats } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { 
  Users, 
  UserCheck, 
  Clock, 
  Building2,
  CalendarDays,
  ShieldCheck,
  TrendingUp,
  ChevronLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { token, isSuperAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCenter, setSelectedCenter] = useState<{ id: number; name: string } | null>(null);

  async function fetchStats(centerId?: number) {
    setLoading(true);
    try {
      const params: any = {};
      if (centerId) params.center_id = centerId;
      const { data } = await getDashboard(params);
      setStats(data);
    } catch (err) {
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      fetchStats();
    }
  }, [token]);

  const handleCenterClick = (center: { id: number; name: string }) => {
    setSelectedCenter(center);
    fetchStats(center.id);
  };

  const handleBack = () => {
    setSelectedCenter(null);
    fetchStats();
  };

  const attendanceRate = stats ? Math.round((stats.today_attendance / stats.total_sewadars) * 100) || 0 : 0;

  const cards = [
    { title: 'Total Sewadars', value: stats?.total_sewadars || 0, icon: Users, color: 'bg-blue-600' },
    { title: "Today's Attendance", value: stats?.today_attendance || 0, icon: UserCheck, color: 'bg-green-600' },
    { title: 'Attendance Rate', value: `${attendanceRate}%`, icon: TrendingUp, color: 'bg-indigo-600' },
  ];

  // Decide which breakdown to show
  const showCenterMetrics = isSuperAdmin && !selectedCenter && (stats?.today_by_center || []).length > 0;
  const breakdownList = showCenterMetrics ? (stats?.today_by_center || []) : (stats?.today_by_dept || []);
  const breakdownTitle = showCenterMetrics ? 'Center Distribution' : 'Department Distribution';
  const breakdownSubtitle = showCenterMetrics
    ? 'Click a center to view its department breakdown'
    : selectedCenter
      ? `Departments in ${selectedCenter.name}`
      : "Today's attendance by department";

  return (
    <DashboardLayout>
      <div className="p-6 max-w-[1400px] mx-auto space-y-6 animate-fade-in pb-16">
        {/* Elite Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-gray-900 tracking-tighter">Dashboard Overview</h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-indigo-50 px-4 py-1.5 rounded-2xl border border-indigo-100/50 shadow-sm">
                <CalendarDays size={16} className="text-indigo-600" />
                <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest whitespace-nowrap">
                   {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div className="h-6 w-px bg-gray-100 hidden sm:block" />
              <div className="hidden sm:flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest px-3 py-1 bg-gray-50 rounded-lg border border-gray-100">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                System Online
              </div>
            </div>
          </div>
        </div>

        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card, i) => (
            <div key={i} className="group relative">
               <div className={`absolute -inset-1 ${card.color} rounded-3xl blur-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
               <div className="card relative bg-white border-none shadow-sm p-6 flex flex-col gap-4 rounded-3xl hover:-translate-y-1 transition-all duration-500">
                 <div className="flex justify-between items-start">
                    <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center text-white shadow-lg transition-transform group-hover:rotate-6 group-hover:scale-105`}>
                      <card.icon size={24} />
                    </div>
                    <div className="flex -space-x-1">
                       {[1,2].map(j => <div key={j} className="w-6 h-6 rounded-full border-2 border-white bg-gray-50" />)}
                    </div>
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{card.title}</p>
                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter tabular-nums">
                      {loading ? <div className="w-20 h-8 bg-gray-50 animate-pulse rounded-lg" /> : card.value}
                    </h3>
                 </div>
                 <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-2">
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Live Updates</span>
                    <TrendingUp size={14} className="text-gray-200" />
                 </div>
               </div>
            </div>
          ))}
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          {/* Breakdown */}
          <div className="xl:col-span-7 space-y-6">
             <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-4">
                   {selectedCenter && (
                     <button
                       onClick={handleBack}
                       className="p-2 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all"
                     >
                       <ChevronLeft size={20} />
                     </button>
                   )}
                   <div className={`p-3 rounded-2xl text-white shadow-xl ${showCenterMetrics ? 'bg-indigo-600' : 'bg-gray-900'}`}>
                      <Building2 size={24} />
                   </div>
                   <div>
                      <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none">{breakdownTitle}</h2>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{breakdownSubtitle}</p>
                   </div>
                </div>
                <div className="h-10 px-6 bg-white border border-gray-100 rounded-full flex items-center gap-2 shadow-sm">
                   <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Today</span>
                </div>
             </div>

             <div className="card relative bg-white/70 backdrop-blur-3xl border-none shadow-sm rounded-3xl p-6 min-h-[400px]">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-full py-20 gap-6 opacity-40">
                    <div className="w-16 h-16 border-4 border-gray-100 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="text-[10px] font-black text-indigo-900 uppercase tracking-[0.3em] pulse">Loading Statistics...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {breakdownList.map((item: any) => (
                      <div
                        key={item.id}
                        className={`group p-4 rounded-2xl bg-gray-50 border border-gray-100 transition-all hover:bg-white hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-50/50 hover:-translate-y-1 ${showCenterMetrics ? 'cursor-pointer' : ''}`}
                        onClick={() => showCenterMetrics && handleCenterClick({ id: Number(item.id), name: item.name })}
                      >
                        <div className="flex items-center gap-3 mb-3">
                           <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 font-black text-sm shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all">
                              {item.name[0]}
                           </div>
                           <div className="flex-1 min-w-0">
                             <h4 className="font-bold text-gray-900 tracking-tight leading-none truncate uppercase text-sm">{item.name}</h4>
                             {showCenterMetrics && <p className="text-[9px] font-black text-indigo-400 uppercase tracking-wider mt-0.5">Click to drill down →</p>}
                           </div>
                        </div>
                        <div className="flex items-end justify-between">
                           <div>
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Total Present</p>
                              <p className="text-2xl font-black text-indigo-600 tracking-tighter tabular-nums">{item.count}</p>
                           </div>
                           <div className="w-2 h-2 rounded-full bg-green-500 border-2 border-green-100 shadow-sm" />
                        </div>
                      </div>
                    ))}
                    {breakdownList.length === 0 && (
                      <div className="col-span-full flex flex-col items-center justify-center py-20 gap-8">
                         <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-gray-200 border-2 border-white shadow-xl">
                            <Building2 size={40} />
                         </div>
                         <div className="space-y-1 text-center">
                            <p className="text-lg font-black text-gray-400 tracking-tight uppercase">No Data Recorded</p>
                            <p className="text-xs text-gray-300 italic font-medium px-10">No attendance records have been captured for today yet.</p>
                         </div>
                      </div>
                    )}
                  </div>
                )}
             </div>
          </div>

          {/* Quick Links */}
          <div className="xl:col-span-5 space-y-6">
             <div className="flex items-center gap-4 px-4">
                <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl">
                   <ShieldCheck size={24} />
                </div>
                <div>
                   <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none">Quick Links</h2>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Quick Access</p>
                </div>
             </div>

             <div className="card relative bg-gray-900 shadow-2xl rounded-3xl p-8 overflow-hidden min-h-[400px] group/hub">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover/hub:scale-110 transition-transform duration-1000" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                
                <div className="relative z-10 flex flex-col h-full justify-between">
                   <div className="space-y-4">
                       <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.4em]">Administration</p>
                       <h3 className="text-4xl font-black text-white tracking-widest uppercase">Quick<br/>Management</h3>
                      <p className="text-gray-500 text-sm font-bold max-w-xs leading-relaxed mt-4">Manage your center and sewadars through this administrative portal.</p>
                   </div>

                   <div className="grid grid-cols-1 gap-4 mt-8">
                      <a href="/attendance" className="group/btn relative h-16 bg-white/5 hover:bg-white border-2 border-white/10 hover:border-white rounded-2xl px-6 flex items-center justify-between transition-all hover:-translate-x-1">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white/10 group-hover/btn:bg-indigo-600 rounded-xl flex items-center justify-center transition-colors shadow-2xl">
                               <UserCheck size={20} className="text-white" />
                            </div>
                            <div className="text-left">
                               <p className="text-[9px] font-black text-gray-400 group-hover/btn:text-indigo-400 uppercase tracking-widest mb-0.5">Attendance</p>
                               <span className="text-base font-black text-white group-hover/btn:text-gray-900 tracking-tight">Daily Records</span>
                            </div>
                         </div>
                         <div className="w-8 h-8 bg-white/5 group-hover/btn:bg-indigo-50 rounded-lg flex items-center justify-center text-white group-hover/btn:text-indigo-600 transition-all opacity-0 group-hover/btn:opacity-100 -translate-x-2 group-hover/btn:translate-x-0">
                            <TrendingUp size={16} />
                         </div>
                      </a>

                      <a href="/sewadars" className="group/btn relative h-16 bg-white/5 hover:bg-white border-2 border-white/10 hover:border-white rounded-2xl px-6 flex items-center justify-between transition-all hover:-translate-x-1">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white/10 group-hover/btn:bg-indigo-600 rounded-xl flex items-center justify-center transition-colors shadow-2xl">
                               <Users size={20} className="text-white" />
                            </div>
                            <div className="text-left">
                               <p className="text-[9px] font-black text-gray-500 group-hover/btn:text-indigo-400 uppercase tracking-widest mb-0.5">Sewadars</p>
                               <span className="text-base font-black text-white group-hover/btn:text-gray-900 tracking-tight">Manage Records</span>
                            </div>
                         </div>
                         <div className="w-8 h-8 bg-white/5 group-hover/btn:bg-indigo-50 rounded-lg flex items-center justify-center text-white group-hover/btn:text-indigo-600 transition-all opacity-0 group-hover/btn:opacity-100 -translate-x-2 group-hover/btn:translate-x-0">
                            <TrendingUp size={16} />
                         </div>
                      </a>
                   </div>
                </div>

                <Clock size={320} className="absolute -right-24 -bottom-24 text-white/[0.03] rotate-12 group-hover/hub:rotate-45 transition-transform duration-[3000ms]" />
             </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
