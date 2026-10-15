'use client';

import React from 'react';
import { Scale, Users, FileText, BarChart3, Clock, Truck, ShieldAlert, Store } from 'lucide-react';
import { UserRole } from '../../types';

interface HeaderNavProps {
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  activeWarehouseId: number;
  setActiveWarehouseId: (id: number) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function HeaderNav({
  activeRole,
  setActiveRole,
  activeWarehouseId,
  setActiveWarehouseId,
  activeTab,
  setActiveTab,
}: HeaderNavProps) {
  const warehouses = [
    { id: 1, name: 'Gudang 1 (Cakung)' },
    { id: 2, name: 'Gudang 2 (Bekasi)' },
    { id: 3, name: 'Gudang 3 (Tangerang)' },
    { id: 4, name: 'Gudang 4 (Semarang)' },
  ];

  return (
    <header className="border-b border-zinc-800 bg-black px-4 py-3 text-zinc-100">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Brand & Warehouse Selector */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 font-bold text-white shadow-md shadow-emerald-900/40">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white">PT DAVID ERP</h1>
              <span className="rounded bg-emerald-950/80 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-800/60">
                TIMBANGAN RONGSOK
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Store className="h-3.5 w-3.5 text-zinc-500" />
              <span>Gudang Aktif:</span>
              <select
                value={activeWarehouseId}
                onChange={(e) => setActiveWarehouseId(Number(e.target.value))}
                className="rounded bg-zinc-900 px-2 py-0.5 text-xs font-medium text-zinc-200 border border-zinc-800 focus:outline-none focus:border-emerald-500"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab('pos')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'pos'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-700/50'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <Scale className="h-3.5 w-3.5" />
            Kasir Timbangan (POS)
          </button>

          <button
            onClick={() => setActiveTab('shifts')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'shifts'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-700/50'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            Shift Kasir
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'attendance'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-700/50'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Absensi & Kasbon
          </button>

          {/* Owner Only Tab */}
          {activeRole === 'OWNER' ? (
            <button
              onClick={() => setActiveTab('owner')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === 'owner'
                  ? 'bg-amber-600 text-white shadow-sm shadow-amber-700/50'
                  : 'text-amber-400/90 hover:bg-amber-950/40 hover:text-amber-300'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Laba/Rugi & Kas Global (Owner)
            </button>
          ) : (
            <div className="flex items-center gap-1 rounded bg-zinc-900/60 px-2 py-1 text-[11px] text-zinc-600 border border-zinc-800/40" title="Dibatasi untuk role ADMIN">
              <ShieldAlert className="h-3 w-3 text-zinc-600" />
              <span>Finansial Terkunci</span>
            </div>
          )}
        </nav>

        {/* Role Switcher */}
        <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/70 p-1">
          <span className="text-[11px] font-medium text-zinc-400 pl-1">Role:</span>
          <button
            onClick={() => {
              setActiveRole('ADMIN');
              if (activeTab === 'owner') setActiveTab('pos');
            }}
            className={`rounded px-2.5 py-1 text-xs font-semibold transition-all ${
              activeRole === 'ADMIN'
                ? 'bg-blue-600 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            ADMIN (Kasir)
          </button>
          <button
            onClick={() => setActiveRole('OWNER')}
            className={`rounded px-2.5 py-1 text-xs font-semibold transition-all ${
              activeRole === 'OWNER'
                ? 'bg-amber-600 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            OWNER (Bos)
          </button>
        </div>
      </div>
    </header>
  );
}
