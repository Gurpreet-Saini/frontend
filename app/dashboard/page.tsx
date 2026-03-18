'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { getDashboard } from '@/lib/api';
import { DashboardStats } from '@/lib/types';
import { 
  Users, 
  UserCheck, 
  Clock, 
  TrendingUp,
  Building2,
  CalendarDays
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data } = await getDashboard();
        setStats(data);
      } catch (err) {
        toast.error('Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const attendanceRate = stats ? Math.round((stats.today_attendance / stats.total_sewadars) * 100) || 0 : 0;

  const cards = [
    { title: 'Total Sewadars', value: stats?.total_sewadars || 0, icon: Users, color: 'bg-blue-500' },
    { title: "Today's Attendance", value: stats?.today_attendance || 0, icon: UserCheck, color: 'bg-green-500' },
    { title: 'Attendance %', value: `${attendanceRate}%`, icon: TrendingUp, color: 'bg-purple-500' },
  ];

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <CalendarDays size={16} />
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {cards.map((card, i) => (
          <div key={i} className="card p-6 flex items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-14 h-14 rounded-2xl ${card.color} flex items-center justify-center text-white shadow-lg`}>
              <card.icon size={28} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{card.title}</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">
                {loading ? '...' : card.value}
              </h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card shadow-sm">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Building2 size={20} className="text-primary-600" />
              Department Breakdown
            </h2>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Today</span>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-50 animate-pulse rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-4">
                {(stats?.today_by_dept || []).map((dept: any) => (
                  <div key={dept.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100 transition-colors hover:bg-white hover:border-primary-100">
                    <span className="font-semibold text-gray-700">{dept.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-xs font-bold">
                        {dept.count} Present
                      </span>
                    </div>
                  </div>
                ))}
                {(stats?.today_by_dept || []).length === 0 && (
                  <p className="text-center py-8 text-gray-400 italic">No department data available</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="card shadow-sm overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 text-white p-8 relative">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
            <p className="text-primary-100 mb-8 max-w-xs text-sm">Efficiently manage your organization's attendance and personnel</p>
            <div className="grid grid-cols-2 gap-4">
              <a href="/attendance" className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-4 rounded-2xl flex flex-col gap-3 transition-colors group">
                <UserCheck size={24} className="text-primary-200" />
                <span className="font-bold">Mark Attendance</span>
              </a>
              <a href="/sewadars" className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-4 rounded-2xl flex flex-col gap-3 transition-colors group">
                <Users size={24} className="text-primary-200" />
                <span className="font-bold">Sewadar List</span>
              </a>
            </div>
          </div>
          <Clock size={200} className="absolute -right-16 -bottom-16 text-white/5 rotate-12" />
        </div>
      </div>
    </DashboardLayout>
  );
}
