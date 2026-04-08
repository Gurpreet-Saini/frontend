'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface AuthUser {
  id: number;
  username: string;
   role: 'super_admin' | 'center_admin' | 'operator' | 'dept_viewer';
  department_id?: number | null;
  department?: { id: number; name: string } | null;
  center_id?: number | null;
  center?: { id: number; name: string; location: string } | null;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isOperator: boolean;
  canMarkAttendance: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const t = localStorage.getItem('token');
      const u = localStorage.getItem('user');
      if (t && u) {
        setToken(t);
        setUser(JSON.parse(u));
      }
    }

    // Keep-alive ping every 5 minutes
    const pingInterval = setInterval(async () => {
      try {
        const { pingHealth } = await import('@/lib/api');
        await pingHealth();
        console.log('Backend keep-alive ping successful');
      } catch (err) {
        console.error('Backend keep-alive ping failed', err);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(pingInterval);
  }, []);

  const login = (token: string, user: AuthUser) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{
      user, token, login, logout,
      isAdmin: user?.role === 'center_admin' || user?.role === 'super_admin',
      isSuperAdmin: user?.role === 'super_admin',
      isOperator: user?.role === 'operator',
      canMarkAttendance: user?.role === 'center_admin' || user?.role === 'operator' || user?.role === 'super_admin',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
