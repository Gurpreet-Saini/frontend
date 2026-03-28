'use client';

import Sidebar from './Sidebar';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken && !token) {
      router.replace('/login');
    }
  }, [token, router]);

  if (!token && typeof window !== 'undefined' && !localStorage.getItem('token')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 min-h-screen relative md:ml-[--sidebar-width]">
        {/* Mobile top bar with hamburger */}
        <div className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 shadow-sm">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all active:scale-90"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-base font-black text-gray-900 tracking-tight">RSSB</span>
            <span className="text-[10px] text-[#7a0000] font-bold uppercase tracking-widest">Attendance</span>
          </div>
        </div>

        <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
