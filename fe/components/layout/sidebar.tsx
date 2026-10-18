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
  LogOut,
  ShieldCheck,
  UserPlus,
  KeyRound,
  Radio,
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
}

export function Sidebar({
  activeRole,
  activeTab,
  setActiveTab,
  isOnline = true,
  isDark = false,
}: SidebarProps) {
  const allNavItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roleRequired: 'ALL',
      description: 'Ringkasan komoditas & gudang',
    },
    {
      id: 'pos',
      label: 'Kasir Timbangan',
      icon: Scale,
      roleRequired: 'ALL',
      description: 'Timbang & nota masuk',
    },
    {
      id: 'sales',
      label: 'Stok & Penjualan',
      icon: BadgeDollarSign,
      roleRequired: 'ALL',
      description: 'Inventaris & kirim pabrik',
    },
    {
      id: 'shifts',
      label: 'Shift Kasir',
      icon: Clock,
      roleRequired: 'ALL',
      description: 'Rekonsiliasi modal kasir',
      badge: 'Aktif',
    },
    {
      id: 'opex',
      label: 'Biaya Operasional',
      icon: Fuel,
      roleRequired: 'ALL',
      description: 'Solar & kas kecil',
    },
    {
      id: 'mutations',
      label: 'Mutasi Stok',
      icon: Truck,
      roleRequired: 'ALL',
      description: 'Surat jalan antar gudang',
    },
    {
      id: 'attendance',
      label: activeRole === 'OWNER' ? 'Absensi & Kasbon' : 'Absensi Karyawan',
      icon: Users,
      roleRequired: 'ALL',
      description: activeRole === 'OWNER' ? 'Karyawan harian & kasbon' : 'Check-in pagi & malam',
    },
    {
      id: 'employees',
      label: 'Kelola Pegawai',
      icon: UserPlus,
      roleRequired: 'OWNER',
      description: 'Master data pegawai',
    },
    {
      id: 'debts',
      label: 'Hutang & Piutang',
      icon: Landmark,
      roleRequired: 'OWNER',
      description: 'Tempo pabrik & titip timbang',
    },
    {
      id: 'owner',
      label: 'Laba / Rugi',
      icon: BarChart3,
      roleRequired: 'OWNER',
      description: 'Finansial & ekspor Excel',
    },
    {
      id: 'profile',
      label: 'Pengaturan',
      icon: KeyRound,
      roleRequired: 'ALL',
      description: 'Profil & ganti PIN',
    },
  ];

  const visibleNavItems = allNavItems.filter((item) => {
    if (item.roleRequired === 'OWNER') {
      return activeRole === 'OWNER';
    }
    return true;
  });

  return (
    <aside className={`w-full lg:w-64 rounded-[28px] p-5 flex flex-col justify-between text-white shrink-0 select-none shadow-xl transition-colors duration-200 ${
      isDark
        ? 'bg-[#070b14] border border-slate-800/80 shadow-black/50'
        : 'bg-[#022c22] border border-emerald-950/20'
    }`}>
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-1">
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
            <p className="text-[10px] text-emerald-300 font-medium tracking-tight mt-1">Bersih, Hijau, Berkelanjutan</p>
          </div>
        </div>

        {/* Role Pill */}
        <div className={`px-3 py-2 rounded-xl flex items-center justify-between text-xs border ${
          isDark
            ? 'bg-[#0f172a] border-slate-800 text-slate-300'
            : 'bg-emerald-900/60 border-emerald-700/40 text-emerald-200'
        }`}>
          <span className="flex items-center gap-1.5 text-[11px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>{activeRole === 'OWNER' ? 'Executive Owner' : 'Kasir Timbangan'}</span>
          </span>
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
        </div>

        {/* Navigation Menu (Eduplex Style Curve & Pill) */}
        <nav className="space-y-1.5 text-xs font-semibold">
          {visibleNavItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl transition-all cursor-pointer text-left ${
                  isActive
                    ? 'bg-emerald-800 text-white font-extrabold shadow-md shadow-emerald-950/40'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    : 'text-emerald-200/80 hover:text-white hover:bg-emerald-900/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
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

      {/* Hardware Status Card di Bawah Sidebar */}
      <div className={`mt-6 p-3.5 rounded-2xl border transition-colors ${
        isDark
          ? 'bg-[#0f172a] border-slate-800 text-slate-200'
          : 'bg-emerald-900/70 border-emerald-700/40 text-white'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Scale Device</span>
          </div>
          <span className="text-[10px] text-amber-300 font-mono font-bold">COM3</span>
        </div>
        <p className="font-bold text-xs mt-1 text-emerald-100">Alexa BFS Ready</p>
      </div>
    </aside>
  );
}
