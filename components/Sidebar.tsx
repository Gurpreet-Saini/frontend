'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { 
  BarChart3, 
  Users, 
  UserCheck, 
  Building2, 
  Building,
  UserCog,
  LogOut, 
  LayoutDashboard,
  X
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout, isAdmin, isSuperAdmin, canMarkAttendance } = useAuth();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    onClose();
  }, [pathname]);

  const links = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Centers', href: '/dashboard/centers', icon: Building, show: isSuperAdmin },
    { name: 'Users', href: '/dashboard/users', icon: UserCog, show: isAdmin },
    { name: 'Sewadars', href: '/sewadars', icon: Users, show: isAdmin },
    { name: 'Attendance', href: '/attendance', icon: UserCheck, show: canMarkAttendance },
    { name: 'Departments', href: '/departments', icon: Building2 },
  ];

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[40] md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          // Base styles — always fixed, full height
          "fixed left-0 top-0 h-screen w-[--sidebar-width] bg-white border-r border-gray-100 flex flex-col z-[50] transition-transform duration-300 ease-in-out",
          // On mobile, slide in/out. On md+, always visible
          "md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Header: Logo + mobile close */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-[#7a0000] shadow-md flex-shrink-0">
              <Image src="/logo.svg" alt="RSSB Logo" width={40} height={40} className="object-cover" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-none">RSSB</h2>
              <p className="text-[10px] text-[#7a0000] font-bold uppercase tracking-widest mt-1">Attendance</p>
            </div>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 mt-2 overflow-y-auto">
          {links.map((link) => {
            if (link.show === false) return null;
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "sidebar-link",
                  isActive && "sidebar-link-active"
                )}
              >
                <Icon size={18} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-3">
          <div className="px-3 py-3.5 rounded-2xl bg-gray-50/50 border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Connected as</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#7a0000]/10 text-[#7a0000] flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                {user?.username?.[0] || 'U'}
              </div>
              <div className="overflow-hidden min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate uppercase mt-0.5">{user?.username}</p>
                <p className="text-[10px] text-gray-500 font-medium truncate uppercase tracking-tighter">
                  {user?.role?.replace('_', ' ')}
                  {user?.center ? ` • ${user.center.name}` : ''}
                </p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={logout}
            className="sidebar-link w-full text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
