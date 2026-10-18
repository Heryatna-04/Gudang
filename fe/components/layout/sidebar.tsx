'use client';

import React from 'react';
import Image from 'next/image';
import {
  LayoutDashboard,
  Scale,
  Clock,
  Users,
  BarChart3,
  Fuel,
  Truck,
  Landmark,
  BadgeDollarSign,
  UserPlus,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { UserRole } from '../../types';

interface SidebarProps {
  activeRole: UserRole;
  setActiveRole?: (role: UserRole) => void;
  activeWarehouseId?: number;
  setActiveWarehouseId?: (id: number) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  warehouses?: unknown[];
  isOnline?: boolean;
  isDark?: boolean;
  onToggleTheme?: () => void;
  scaleStatus?: {
    isConnected: boolean;
    isMock: boolean;
    portInfo: string | null;
  };
}

export function Sidebar({
  activeRole,
  activeTab,
  setActiveTab,
  isOnline = true,
  isDark = false,
  scaleStatus,
}: SidebarProps) {
  const allNavItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roleRequired: 'ALL',
    },
    {
      id: 'pos',
      label: 'Kasir Timbangan',
      icon: Scale,
      roleRequired: 'ALL',
    },
    {
      id: 'sales',
      label: 'Stok & Penjualan',
      icon: BadgeDollarSign,
      roleRequired: 'ALL',
    },
    {
      id: 'shifts',
      label: 'Shift Kasir',
      icon: Clock,
      roleRequired: 'ALL',
      badge: 'Aktif',
    },
    {
      id: 'opex',
      label: 'Biaya Operasional',
      icon: Fuel,
      roleRequired: 'ALL',
    },
    {
      id: 'mutations',
      label: 'Mutasi Stok',
      icon: Truck,
      roleRequired: 'ALL',
    },
    {
      id: 'attendance',
      label: activeRole === 'OWNER' ? 'Absensi & Kasbon' : 'Absensi Karyawan',
      icon: Users,
      roleRequired: 'ALL',
    },
    {
      id: 'employees',
      label: 'Kelola Pegawai',
      icon: UserPlus,
      roleRequired: 'OWNER',
    },
    {
      id: 'debts',
      label: 'Hutang & Piutang',
      icon: Landmark,
      roleRequired: 'OWNER',
    },
    {
      id: 'owner',
      label: 'Laba / Rugi',
      icon: BarChart3,
      roleRequired: 'OWNER',
    },
    {
      id: 'profile',
      label: 'Pengaturan',
      icon: KeyRound,
      roleRequired: 'ALL',
    },
  ];

  const visibleNavItems = allNavItems.filter((item) => {
    if (item.roleRequired === 'OWNER') {
      return activeRole === 'OWNER';
    }
    return true;
  });

  return (
    <aside className={`w-full lg:w-72 h-auto lg:h-[calc(100vh-2rem)] lg:fixed lg:top-4 lg:bottom-4 lg:left-4 lg:z-30 rounded-[28px] p-5 flex flex-col justify-between text-white shrink-0 select-none shadow-xl transition-colors duration-200 overflow-hidden ${
      isDark
        ? 'bg-[#0f172a] border border-blue-600/30 shadow-blue-950/40'
        : 'bg-[#022c22] border border-emerald-950/20'
    }`}>
      {/* Bagian Atas: Brand & Nav Scrollable */}
      <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
        
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-1 pb-4 flex-shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-white p-1.5 flex items-center justify-center border border-amber-500/40 shadow-sm shrink-0">
            <Image
              src="/logo.png"
              alt="Green Cycle Kuningan Logo"
              width={32}
              height={32}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight leading-none text-white">GREEN CYCLE</span>
              <span className="text-[9px] font-bold text-amber-400 bg-amber-950/80 px-1 py-0.5 rounded tracking-wide">KUNINGAN</span>
            </div>
            <p className={`text-[10px] font-medium tracking-tight mt-1 ${isDark ? 'text-sky-300' : 'text-emerald-300'}`}>
              Bersih, Hijau, Berkelanjutan
            </p>
          </div>
        </div>

        {/* Role Pill */}
        <div className={`px-3 py-2 rounded-xl flex items-center justify-between text-xs border mb-3 flex-shrink-0 ${
          isDark
            ? 'bg-[#1e293b]/70 border-blue-500/20 text-slate-200'
            : 'bg-emerald-900/60 border-emerald-700/40 text-emerald-200'
        }`}>
          <span className="flex items-center gap-1.5 text-[11px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>{activeRole === 'OWNER' ? 'Executive Owner' : 'Kasir Timbangan'}</span>
          </span>
          <span className={`w-2 h-2 rounded-full ${isOnline ? (isDark ? 'bg-sky-400 animate-pulse' : 'bg-emerald-400 animate-pulse') : 'bg-amber-400'}`}></span>
        </div>

        {/* Navigation Menu (Scrollable if height overflow) */}
        <nav className="space-y-1 text-xs font-semibold overflow-y-auto pr-1 flex-1">
          {visibleNavItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all cursor-pointer text-left ${
                  isActive
                    ? isDark
                      ? 'bg-blue-600 text-white font-extrabold shadow-md shadow-blue-900/50'
                      : 'bg-emerald-800 text-white font-extrabold shadow-md shadow-emerald-950/40'
                    : isDark
                    ? 'text-slate-300/80 hover:text-white hover:bg-blue-950/50'
                    : 'text-emerald-200/80 hover:text-white hover:bg-emerald-900/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : isDark ? 'text-slate-400' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Hardware Status Card di Bawah Sidebar (Real Scale Hardware Indicator) */}
      {(() => {
        const isRealConnected = Boolean(scaleStatus?.isConnected && !scaleStatus?.isMock);
        const isVirtual = Boolean(scaleStatus?.isMock || (!scaleStatus?.isConnected && scaleStatus?.portInfo));
        const isDisconnected = !scaleStatus?.isConnected && !scaleStatus?.isMock;

        return (
          <button
            type="button"
            onClick={() => setActiveTab('pos')}
            title="Klik untuk membuka Kasir & mengelola koneksi port serial timbangan"
            className={`mt-3 p-3 rounded-2xl border text-left transition-all flex-shrink-0 cursor-pointer ${
              isDark
                ? isRealConnected
                  ? 'bg-blue-950/60 hover:bg-blue-950/90 border-blue-500/50 text-slate-100'
                  : 'bg-[#18181b] hover:bg-[#202024] border-zinc-800 text-slate-300'
                : isRealConnected
                ? 'bg-emerald-900/80 hover:bg-emerald-900 border-emerald-500/50 text-white'
                : 'bg-emerald-950/40 hover:bg-emerald-950/60 border-emerald-900/40 text-emerald-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isRealConnected
                      ? 'bg-emerald-400 animate-pulse'
                      : isVirtual
                      ? 'bg-amber-400'
                      : 'bg-rose-500'
                  }`}
                />
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    isRealConnected
                      ? isDark
                        ? 'text-sky-300'
                        : 'text-emerald-300'
                      : isVirtual
                      ? 'text-amber-300'
                      : 'text-rose-400'
                  }`}
                >
                  Scale Device
                </span>
              </div>
              <span
                className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  isRealConnected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : isVirtual
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {isRealConnected ? 'RS-232 ON' : isVirtual ? 'MOCK / VIRTUAL' : 'DISCONNECTED'}
              </span>
            </div>

            <p className="font-bold text-xs mt-1.5 flex items-center justify-between">
              <span className={isRealConnected ? 'text-white font-extrabold' : 'text-slate-200'}>
                {isRealConnected
                  ? 'Alexa BFS Terhubung'
                  : isVirtual
                  ? 'Alexa BFS (Simulasi)'
                  : 'Timbangan Terputus'}
              </span>
              <span className="text-[10px] opacity-75 font-mono">
                {isRealConnected ? 'Kabel USB/COM' : 'Belum Konek'}
              </span>
            </p>
          </button>
        );
      })()}
    </aside>
  );
}
