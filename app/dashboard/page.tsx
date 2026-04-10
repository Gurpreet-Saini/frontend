'use client';

import { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { getDashboard, getCenters, exportAttendance } from '@/lib/api';
import { DashboardStats } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { 
  Calendar,
  Search,
  Users, 
  UserCheck, 
  Clock, 
  TrendingUp, 
  BarChart3, 
  Download,
  Building2,
  ChevronLeft,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { format, subDays, subMonths, subYears } from 'date-fns';
import toast from 'react-hot-toast';

type Period = '7d' | '30d' | '6m' | '1y';

export default function DashboardPage() {
  const { token, isSuperAdmin, isOperator } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [centers, setCenters] = useState<{ id: number; name: string }[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<{ id: number; name: string } | null>(null);
  const [tempCenterId, setTempCenterId] = useState<string>('');
  const [period, setPeriod] = useState<Period>('7d');
  const [exporting, setExporting] = useState(false);
  
  // Custom Date Range State
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  async function fetchStats(options?: { centerId?: number; currentPeriod?: Period; from?: string; to?: string }) {
    setLoading(true);
    try {
      const params: any = {};
      const cid = options?.centerId ?? selectedCenter?.id;
      if (cid) params.center_id = cid;

      const p = options?.currentPeriod ?? period;
      
      let fromDateStr = '';
      let toDateStr = format(new Date(), 'yyyy-MM-dd');
      let interval = 'day';

      if (options?.from && options?.to) {
        fromDateStr = options.from;
        toDateStr = options.to;
        const diff = (new Date(options.to).getTime() - new Date(options.from).getTime()) / (1000 * 3600 * 24);
        if (diff > 180) interval = 'month';
        else if (diff > 45) interval = 'week';
      } else {
        let fromDate = subDays(new Date(), 6);
        if (p === '30d') fromDate = subDays(new Date(), 29);
        else if (p === '6m') {
          fromDate = subMonths(new Date(), 6);
          interval = 'week';
        } else if (p === '1y') {
          fromDate = subYears(new Date(), 1);
          interval = 'month';
        }
        fromDateStr = format(fromDate, 'yyyy-MM-dd');
      }

      params.date_from = fromDateStr;
      params.date_to = toDateStr;
      params.interval = interval;

      const { data } = await getDashboard(params);
      setStats(data);
    } catch (err) {
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  }

  async function fetchCentersList() {
    try {
      const { data } = await getCenters();
      setCenters(data);
    } catch (err) {
      console.error('Failed to fetch centers:', err);
    }
  }

  useEffect(() => {
    if (token) {
      if (isOperator) {
        setLoading(false);
        return;
      }
      fetchStats();
      if (isSuperAdmin) {
        fetchCentersList();
      }
    }
  }, [token, isSuperAdmin, isOperator]);

  const handleApplyFilters = () => {
    const centerObj = centers.find(c => c.id.toString() === tempCenterId) || null;
    setSelectedCenter(centerObj);
    
    if (dateFrom && dateTo) {
      fetchStats({ centerId: centerObj?.id, from: dateFrom, to: dateTo });
    } else {
      fetchStats({ centerId: centerObj?.id });
    }
  };

  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
    setDateFrom('');
    setDateTo('');
    fetchStats({ centerId: selectedCenter?.id, currentPeriod: newPeriod });
  };

  const handleCenterClick = (center: { id: number; name: string }) => {
    setSelectedCenter(center);
    setTempCenterId(center.id.toString());
    fetchStats({ centerId: center.id });
  };

  const handleBack = () => {
    setSelectedCenter(null);
    setTempCenterId('');
    fetchStats({ centerId: undefined });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      let finalFrom = dateFrom;
      let finalTo = dateTo;

      if (!finalFrom || !finalTo) {
        let d = subDays(new Date(), 6);
        if (period === '30d') d = subDays(new Date(), 29);
        else if (period === '6m') d = subMonths(new Date(), 6);
        else if (period === '1y') d = subYears(new Date(), 1);
        finalFrom = format(d, 'yyyy-MM-dd');
        finalTo = format(new Date(), 'yyyy-MM-dd');
      }

      const params: any = {
        date_from: finalFrom,
        date_to: finalTo
      };
      if (selectedCenter) params.center_id = selectedCenter.id;

      const response = await exportAttendance(params);
      
      // Handle the blob download more robustly
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `organized_report_${finalFrom}_to_${finalTo}.xlsx`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup after a delay to ensure the browser has triggered the download
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        link.remove();
      }, 100);

      toast.success('Organized report downloaded');
    } catch (error: any) {
      console.error('Export Error:', error);
      const msg = error.response?.data?.error || 'Failed to download report';
      toast.error(msg);
    } finally {
      setExporting(false);
    }
  };

  const trendData = useMemo(() => {
    if (!stats?.historical_trend) return [];
    return stats.historical_trend.map(item => ({
      name: format(new Date(item.period), period === '1y' ? 'MMM yy' : 'dd MMM'),
      count: item.count
    }));
  }, [stats?.historical_trend, period]);

  const analytics = useMemo(() => {
    if (!stats?.historical_trend || stats.historical_trend.length === 0) return { avg: 0, peak: 0 };
    const counts = stats.historical_trend.map(d => d.count);
    return {
      avg: Math.round(counts.reduce((a, b) => a + b, 0) / counts.length),
      peak: Math.max(...counts)
    };
  }, [stats?.historical_trend]);

  const cards = [
    { title: 'Total Sewadars', value: stats?.total_sewadars || 0, icon: Users, color: 'bg-blue-600' },
    { title: "Today's Attendance", value: stats?.today_attendance || 0, icon: UserCheck, color: 'bg-green-600' },
    { title: 'Period Average', value: analytics.avg, icon: TrendingUp, color: 'bg-indigo-600' },
    { title: 'Period Peak', value: analytics.peak, icon: BarChart3, color: 'bg-slate-900' },
  ];

  const showCenterMetrics = isSuperAdmin && !selectedCenter && (stats?.today_by_center || []).length > 0;
  const breakdownList = showCenterMetrics ? (stats?.today_by_center || []) : (stats?.today_by_dept || []);

  return (
    <DashboardLayout>
      <div className="p-6 max-w-[1400px] mx-auto space-y-8 animate-fade-in pb-16">
        {/* Elite Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Dashboard Overview</h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-indigo-50 px-4 py-1.5 rounded-2xl border border-indigo-100/50 shadow-sm">
                <Calendar size={16} className="text-indigo-600" />
                <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest whitespace-nowrap">
                   {format(new Date(), 'EEEE, dd MMMM yyyy')}
                </span>
              </div>
              <div className="h-6 w-px bg-gray-100 hidden sm:block" />
              <div className="hidden sm:flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest px-3 py-1 bg-gray-50 rounded-lg border border-gray-100">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live Hub
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-[2rem] shadow-sm border border-gray-100">
            {isSuperAdmin && (
              <div className="flex items-center gap-2 px-4 border-r border-gray-100">
                <Search size={16} className="text-gray-400" />
                <select 
                  value={tempCenterId}
                  onChange={(e) => setTempCenterId(e.target.value)}
                  className="text-[10px] font-bold text-gray-900 uppercase tracking-widest bg-transparent border-none focus:ring-0 cursor-pointer min-w-[150px]"
                >
                  <option value="">All Centers</option>
                  {centers.map(center => (
                    <option key={center.id} value={center.id}>{center.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-4 px-4 border-r border-gray-100">
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-900 uppercase">
                <span className="text-gray-400">From</span>
                <input 
                  type="date" 
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 p-0 cursor-pointer"
                />
                <span className="text-gray-400 ml-2">To</span>
                <input 
                  type="date" 
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 p-0 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center gap-1">
              {(['7d', '30d', '6m', '1y'] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePeriodChange(p)}
                  className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                    period === p && !dateFrom
                      ? 'bg-gray-900 text-white shadow-lg' 
                      : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="w-px h-6 bg-gray-100 mx-1" />

            <button
              onClick={handleApplyFilters}
              className="px-6 py-2 bg-gray-900 border border-gray-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all hover:bg-indigo-600 hover:border-indigo-600 shadow-lg active:scale-95"
            >
              Apply filters
            </button>

            <button
              onClick={handleExport}
              disabled={loading || exporting}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50 border border-indigo-100 shadow-sm"
              title="Export Report"
            >
              {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span className="text-[10px] font-black uppercase tracking-widest">
                {exporting ? 'Exporting' : 'Export'}
              </span>
            </button>
          </div>
        </div>

        {isOperator ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] shadow-sm border border-dashed border-gray-200">
            <ShieldCheck size={64} className="text-gray-200 mb-6" />
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Access Restricted</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2 px-12 text-center">
              Analytics are reserved for administration. Please use the sidebar to manage attendance.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {cards.map((card, i) => (
                <div key={i} className="group relative">
                   <div className="card relative bg-white border border-gray-100 shadow-sm p-6 flex flex-col gap-4 rounded-3xl hover:-translate-y-1 transition-all duration-500">
                     <div className="flex justify-between items-start">
                        <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center text-white shadow-lg`}>
                          <card.icon size={24} />
                        </div>
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{card.title}</p>
                        <h3 className="text-3xl font-black text-gray-900 tracking-tighter tabular-nums">
                          {loading ? <div className="w-20 h-8 bg-gray-50 animate-pulse rounded-lg" /> : card.value}
                        </h3>
                     </div>
                     <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-2">
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none">Live Metrics</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                     </div>
                   </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              <div className="xl:col-span-8 space-y-6">
                 <div className="flex items-center gap-4 px-4">
                    <div className="p-3 bg-gray-900 rounded-2xl text-white shadow-xl">
                       <TrendingUp size={24} />
                    </div>
                    <div>
                       <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none uppercase">Attendance Trend</h2>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Real-time movement trajectory</p>
                    </div>
                 </div>

                 <div className="card bg-white border border-gray-100 shadow-sm rounded-[2.5rem] p-8 min-h-[450px]">
                    {loading ? (
                       <div className="flex flex-col items-center justify-center h-[350px] gap-6 opacity-40">
                          <div className="w-16 h-16 border-4 border-gray-100 border-t-indigo-600 rounded-full animate-spin" />
                          <p className="text-xs font-black text-indigo-900 uppercase tracking-widest pulse">Analyzing Trends...</p>
                       </div>
                    ) : trendData.length > 0 ? (
                      <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={trendData}>
                            <defs>
                              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis 
                              dataKey="name" 
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }}
                              dy={10}
                            />
                            <YAxis 
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                borderRadius: '1.5rem', 
                                border: 'none', 
                                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                fontSize: '10px',
                                fontWeight: '900',
                                textTransform: 'uppercase'
                              }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="count" 
                              stroke="#4f46e5" 
                              strokeWidth={4}
                              fillOpacity={1} 
                              fill="url(#colorCount)" 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[350px] gap-6 text-gray-300">
                        <BarChart3 size={64} className="opacity-20" />
                        <p className="text-sm font-black uppercase tracking-widest text-gray-400">No telemetry recorded for this period</p>
                      </div>
                    )}
                 </div>
              </div>

              <div className="xl:col-span-4 space-y-6">
                 <div className="flex items-center gap-4 px-4">
                    <div className={`p-3 rounded-2xl text-white shadow-xl ${showCenterMetrics ? 'bg-indigo-600' : 'bg-slate-900'}`}>
                       <Building2 size={24} />
                    </div>
                    <div>
                       <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none uppercase">
                         {showCenterMetrics ? 'Nexus' : 'Sector'} Distribution
                       </h2>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Resource allocation</p>
                    </div>
                 </div>

                 <div className="card bg-white border border-gray-100 shadow-sm rounded-[2.5rem] p-6 space-y-4">
                   {selectedCenter && (
                     <button onClick={handleBack} className="flex items-center gap-2 text-indigo-600 font-black text-[10px] bg-indigo-50 px-4 py-2 rounded-full uppercase tracking-widest mb-4 hover:bg-indigo-600 hover:text-white transition-all">
                       <ChevronLeft size={14} /> Back to Network
                     </button>
                   )}
                   
                   <div className="space-y-3">
                     {breakdownList.map((item: any) => (
                       <div
                         key={item.id}
                         onClick={() => showCenterMetrics && handleCenterClick({ id: Number(item.id), name: item.name })}
                         className="group p-4 rounded-3xl bg-gray-50/50 hover:bg-white border border-gray-100 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
                       >
                         <div className="flex items-center justify-between relative z-10">
                           <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[10px] font-black text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all uppercase">
                               {item.name.substring(0, 2)}
                             </div>
                             <div className="text-left">
                               <h4 className="font-black text-gray-900 text-sm tracking-tighter uppercase leading-none">{item.name}</h4>
                               <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mt-1">Operational Node</p>
                             </div>
                           </div>
                           <div className="text-right">
                             <span className="text-xl font-black text-gray-900 tabular-nums">{item.count}</span>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
