'use client';

import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  Scale,
  CloudCheck,
  Building2,
  Calendar,
  ChevronRight,
  ChevronLeft,
  ArrowUpRight,
  Receipt,
  Truck,
  Plus,
  Boxes,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';
import { Product, ScaleTransaction, FactorySale, UserRole } from '../../types';
import { InteractiveCalendar } from '../ui/interactive-calendar';
import { Button } from '../ui/button';

interface ExecutiveDashboardOverviewProps {
  activeRole: UserRole;
  currentUser: { fullName: string; role: UserRole; username: string };
  products: Product[];
  transactions: ScaleTransaction[];
  factorySales: FactorySale[];
  isDark?: boolean;
  isOnline?: boolean;
  onNavigateTab: (tab: string) => void;
}

export function ExecutiveDashboardOverview({
  activeRole,
  currentUser,
  products,
  transactions,
  factorySales,
  isDark = false,
  isOnline = true,
  onNavigateTab,
}: ExecutiveDashboardOverviewProps) {
  // Satu sumber kebenaran: tanggal terpilih (dipakai kalender, chart, dan daftar nota)
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>(() => new Date());

  // Kunci tanggal LOKAL (WIB), bukan UTC, agar nota malam hari tidak mundur sehari
  const localKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const txKg = (tx: ScaleTransaction) =>
    (tx.items || []).reduce((s, i) => s + (i.netWeightKg || 0), 0);

  // Senin-Minggu pada minggu tanggal terpilih, tonase dari transaksi nyata (hari kosong = 0)
  const { weeklyChartData, lastWeekTon } = useMemo(() => {
    const names = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    const fulls = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const monday = new Date(selectedCalendarDate);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));

    const kgByDay = new Map<string, number>();
    for (const tx of transactions) {
      if (!tx.createdAt) continue;
      const k = localKey(new Date(tx.createdAt));
      kgByDay.set(k, (kgByDay.get(k) || 0) + txKg(tx));
    }

    const days = names.map((name, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return {
        name,
        full: fulls[i],
        date,
        ton: Number(((kgByDay.get(localKey(date)) || 0) / 1000).toFixed(2)),
      };
    });

    let prev = 0;
    for (let i = 1; i <= 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() - i);
      prev += (kgByDay.get(localKey(d)) || 0) / 1000;
    }
    return { weeklyChartData: days, lastWeekTon: prev };
  }, [transactions, selectedCalendarDate]);

  const selectedDayIndex = (selectedCalendarDate.getDay() + 6) % 7;
  const maxTon = Math.max(...weeklyChartData.map((d) => d.ton), 0.01);
  const thisWeekTon = weeklyChartData.reduce((s, d) => s + d.ton, 0);
  const weekDeltaPct =
    lastWeekTon > 0 ? Math.round(((thisWeekTon - lastWeekTon) / lastWeekTon) * 100) : null;

  // Nota pada tanggal terpilih saja; tidak ada fallback ke tanggal lain
  const filteredTransactionsByCalendar = useMemo(() => {
    const key = localKey(selectedCalendarDate);
    return transactions.filter((tx) => tx.createdAt && localKey(new Date(tx.createdAt)) === key);
  }, [selectedCalendarDate, transactions]);

  // Volume pembelian tonase mingguan dummy / live
  const totalWeightToday = useMemo(() => {
    return transactions.reduce((acc, t) => {
      const itemsKg = (t.items || []).reduce((s, i) => s + (i.netWeightKg || 0), 0);
      return acc + itemsKg;
    }, 0);
  }, [transactions]);

  // Ringkasan 3 Komoditas Teratas
  const topProducts = useMemo(() => {
    return products.slice(0, 3);
  }, [products]);

  // Transaksi timbangan terbaru
  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 4);
  }, [transactions]);

  return (
    <div className="w-full flex flex-col xl:flex-row gap-6">
      
      {/* 1. KOLOM UTAMA (FEED METRIK, CHART, GUDANG, RECENT TX) */}
      <div className="flex-1 space-y-6 min-w-0">
        
        {/* Welcome Banner Card */}
        <div className={`p-6 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
          isDark
            ? 'bg-[#0b1220] border-slate-800/80 shadow-black/40'
            : 'bg-white border-slate-200/80 shadow-xs'
        }`}>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                activeRole === 'OWNER'
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
              }`}>
                {activeRole === 'OWNER' ? 'Executive Owner' : 'Kasir Timbangan'}
              </span>
              <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>&bull;</span>
              <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                PT DAVID &bull; Green Cycle Kuningan
              </span>
            </div>
            <h1 className={`text-2xl font-black tracking-tight mt-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Selamat Datang, {currentUser.fullName} 👋
            </h1>
            <p className={`text-xs font-medium mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Ringkasan komoditas, timbangan 4 cabang gudang, dan jadwal pengiriman pabrik hari ini.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab('pos')}
              className="bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Scale className="w-4 h-4 text-emerald-300" />
              <span>Buka Timbangan</span>
            </button>
          </div>
        </div>

        {/* 3 KARTU KOMODITAS UTAMA (HARGA & STOK HARI INI) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className={`font-black text-xs uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Harga Komoditas Hari Ini
            </h2>
            <button
              onClick={() => onNavigateTab('owner')}
              className={`text-xs font-bold transition hover:underline cursor-pointer ${
                isDark ? 'text-emerald-400' : 'text-emerald-800'
              }`}
            >
              Kelola Harga &amp; Benchmark &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {topProducts.map((prod, idx) => {
              const spread = (prod.marketPriceBenchmark || 0) - (prod.priceRegular || 0);
              return (
                <div
                  key={prod.id}
                  className={`p-4.5 rounded-2xl border transition-all flex flex-col justify-between ${
                    isDark
                      ? 'bg-[#0b1220] border-slate-800/80 shadow-black/30'
                      : 'bg-white border-slate-200/80 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${
                      idx === 0
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        : idx === 1
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        : 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                    }`}>
                      <Boxes className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className={`font-black text-xs truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {prod.name}
                      </h3>
                      <span className={`text-[11px] block mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Stok: <strong className="font-numeric">{Number(prod.currentStockKg || 0).toLocaleString('id-ID')} kg</strong>
                      </span>
                    </div>
                  </div>

                  <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs ${
                    isDark ? 'border-slate-800/80' : 'border-slate-100'
                  }`}>
                    <div>
                      <span className={`text-[10px] block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Beli Kasir:</span>
                      <span className={`font-numeric font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Rp{prod.priceRegular.toLocaleString('id-ID')}
                        <span className="text-[10px] font-normal text-slate-400">/kg</span>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        spread >= 0
                          ? isDark ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60' : 'bg-emerald-100 text-emerald-800'
                          : isDark ? 'bg-rose-950/80 text-rose-400 border border-rose-800/60' : 'bg-rose-100 text-rose-800'
                      }`}>
                        +{spread > 0 ? `Rp${spread.toLocaleString('id-ID')}` : 'Stabil'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* GRID TENGAH: CHART TONASE + STATUS 4 GUDANG */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Chart Tonase Mingguan (Interactive Bar Chart) */}
          <div className={`p-5 rounded-2xl border transition-colors ${
            isDark ? 'bg-[#121215] border-[#27272a]' : 'bg-white border-slate-200/80 shadow-xs'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className={`font-black text-xs uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Volume Timbangan (Ton)
                </h3>
                <span className={`text-[11px] font-bold flex items-center gap-1 mt-0.5 ${
                  weekDeltaPct !== null && weekDeltaPct < 0 ? 'text-rose-500' : 'text-emerald-500'
                }`}>
                  <TrendingUp className="w-3.5 h-3.5" />
                  {thisWeekTon.toFixed(1)} Ton minggu ini
                  {weekDeltaPct !== null && ` (${weekDeltaPct > 0 ? '+' : ''}${weekDeltaPct}% vs minggu lalu)`}
                </span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${
                isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}>
                Mingguan
              </span>
            </div>

            <div className="h-44 flex items-end justify-between pt-8 px-2 relative">
              {/* Tooltip Dinamis Sesuai Batang yang Diklik / Aktif */}
              <div
                className={`absolute top-1 text-white text-[10px] px-2.5 py-1 rounded-lg font-bold shadow-xs transition-all duration-300 pointer-events-none ${
                  isDark ? 'bg-blue-600 border border-blue-500/40' : 'bg-emerald-950'
                }`}
                style={{
                  left: `${((selectedDayIndex + 0.5) / weeklyChartData.length) * 100}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                {weeklyChartData[selectedDayIndex].ton} Ton &bull; {weeklyChartData[selectedDayIndex].full}
              </div>

              {weeklyChartData.map((d, idx) => {
                const isSelected = idx === selectedDayIndex;
                const heightPct = d.ton > 0 ? Math.max(12, Math.round((d.ton / maxTon) * 100)) : 4;

                return (
                  <button
                    key={d.name}
                    type="button"
                    onClick={() => setSelectedCalendarDate(d.date)}
                    title={`Klik untuk melihat detail ${d.full}: ${d.ton} Ton`}
                    className="flex flex-col items-center gap-2 group cursor-pointer focus:outline-none"
                  >
                    <div
                      className={`w-4 sm:w-5 rounded-full transition-all duration-300 ${
                        isSelected
                          ? isDark
                            ? 'bg-blue-600 ring-4 ring-blue-500/25 scale-105'
                            : 'bg-emerald-600 ring-4 ring-emerald-500/20 scale-105'
                          : isDark
                          ? 'bg-zinc-800 hover:bg-zinc-700'
                          : 'bg-slate-200 hover:bg-slate-300'
                      }`}
                      style={{ height: `${heightPct}px` }}
                    />
                    <span
                      className={`text-[10px] transition-colors ${
                        isSelected
                          ? isDark
                            ? 'font-black text-sky-400'
                            : 'font-black text-emerald-900'
                          : 'text-slate-400 font-bold group-hover:text-slate-200'
                      }`}
                    >
                      {d.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Operasional 4 Gudang */}
          <div className={`p-5 rounded-2xl border flex flex-col justify-between transition-colors ${
            isDark ? 'bg-[#0b1220] border-slate-800/80' : 'bg-white border-slate-200/80 shadow-xs'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`font-black text-xs uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Operasional 4 Gudang
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isDark ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60' : 'bg-emerald-100 text-emerald-800'
              }`}>
                Semua Buka
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <button
                type="button"
                onClick={() => onNavigateTab('shifts')}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left cursor-pointer transition-colors ${
                  isDark ? 'bg-[#101c36] hover:bg-[#152342] border-blue-900/30' : 'bg-slate-50 hover:bg-slate-100 border-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-lg font-black text-xs flex items-center justify-center ${
                    isDark ? 'bg-sky-500/15 text-sky-300' : 'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    G1
                  </span>
                  <div>
                    <p className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Gudang Pusat Kuningan
                    </p>
                    <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Kasir: Hendra &bull; Kas: Rp 42.5jt
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('shifts')}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left cursor-pointer transition-colors ${
                  isDark ? 'bg-[#101c36] hover:bg-[#152342] border-blue-900/30' : 'bg-slate-50 hover:bg-slate-100 border-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 font-black text-xs flex items-center justify-center">
                    G2
                  </span>
                  <div>
                    <p className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Gudang Cabang Cilimus
                    </p>
                    <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Kasir: Siti &bull; Kas: Rp 18.2jt
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('shifts')}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left cursor-pointer transition-colors ${
                  isDark ? 'bg-[#101c36] hover:bg-[#152342] border-blue-900/30' : 'bg-slate-50 hover:bg-slate-100 border-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 font-black text-xs flex items-center justify-center">
                    G3
                  </span>
                  <div>
                    <p className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Gudang Luragung
                    </p>
                    <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Kasir: Budi &bull; Kas: Rp 23.0jt
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

        </div>

        {/* TABEL TRANSAKSI TIMBANGAN TERBARU */}
        <div className={`p-5 rounded-2xl border transition-colors ${
          isDark ? 'bg-[#0b1220] border-slate-800/80' : 'bg-white border-slate-200/80 shadow-xs'
        }`}>
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <h3 className={`font-black text-xs uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Transaksi Timbangan Terbaru
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Tersinkronisasi otomatis dengan Dexie IndexedDB Lokal
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('pos')}
              className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nota Baru</span>
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {filteredTransactionsByCalendar.length === 0 ? (
              <div className={`p-6 text-center rounded-xl border border-dashed ${
                isDark ? 'border-zinc-800 text-zinc-500' : 'border-slate-200 text-slate-400'
              }`}>
                Belum ada transaksi timbangan pada tanggal {selectedCalendarDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}. Klik &quot;Nota Baru&quot; untuk mulai menimbang.
              </div>
            ) : (
              filteredTransactionsByCalendar.map((tx) => (
                <div
                  key={tx.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition ${
                    isDark ? 'bg-[#18181b] border-zinc-800' : 'bg-slate-50/70 border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      isDark ? 'bg-blue-500/15 text-sky-400' : 'bg-emerald-500/10 text-emerald-500'
                    }`}>
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {tx.invoiceNumber} &bull; {tx.sellerName}
                      </p>
                      <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Gudang {tx.warehouseId} &bull; {tx.items.length} Komoditas
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-numeric font-black ${isDark ? 'text-sky-300' : 'text-emerald-800'}`}>
                      Rp{tx.totalAmount.toLocaleString('id-ID')}
                    </p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                      isDark ? 'text-sky-300 bg-blue-500/20' : 'text-emerald-500 bg-emerald-500/10'
                    }`}>
                      Selesai &bull; Tunai
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* 2. PANEL KANAN (CLOUD SYNC BANNER, KALENDER & JADWAL PABRIK) */}
      <div className="w-full xl:w-80 space-y-5 shrink-0">
        
        {/* Banner Cloud Realtime Sync */}
        <div className={`p-5 rounded-3xl border relative overflow-hidden text-white ${
          isDark ? 'bg-[#070b14] border-slate-800' : 'bg-[#022c22] border-emerald-950/20 shadow-md'
        }`}>
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`}></span>
                Cloud Realtime Sync
              </span>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                isOnline
                  ? 'text-emerald-300 bg-emerald-950/80 border-emerald-600/30'
                  : 'text-rose-300 bg-rose-950/80 border-rose-600/30'
              }`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <h3 className="text-base font-black leading-snug">
              Data 4 Gudang Terintegrasi
            </h3>
            <p className="text-xs text-emerald-200/80 leading-relaxed font-normal">
              Sistem offline-first Dexie aktif. Seluruh nota aman tersimpan di IndexedDB browser.
            </p>
            <Button
              type="button"
              variant="amber"
              size="sm"
              onClick={() => onNavigateTab(activeRole === 'OWNER' ? 'owner' : 'pos')}
              className="w-full mt-2 font-black py-2.5 text-xs"
            >
              {activeRole === 'OWNER' ? 'Buka Laporan Finansial Owner' : 'Buka Kasir Timbangan'}
            </Button>
          </div>
          <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-emerald-600/10 rounded-full blur-2xl pointer-events-none"></div>
        </div>

        {/* Mini Kalender Interaktif */}
        <InteractiveCalendar
          isDark={isDark}
          value={selectedCalendarDate}
          onSelectDate={setSelectedCalendarDate}
        />

        {/* Jadwal Kirim Pabrik Peleburan */}
        <div className={`p-5 rounded-2xl border transition-colors ${
          isDark ? 'bg-[#0b1220] border-slate-800/80' : 'bg-white border-slate-200/80 shadow-xs'
        }`}>
          <div className="flex items-center justify-between mb-3.5">
            <h3 className={`font-black text-xs uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Jadwal Kirim Pabrik
            </h3>
            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Hari Ini
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <button
              type="button"
              onClick={() => onNavigateTab('sales')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left cursor-pointer transition-colors ${
                isDark ? 'bg-[#101c36] hover:bg-[#152342] border-blue-900/30' : 'bg-slate-50 hover:bg-slate-100 border-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <p className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    PT Krakatau Steel
                  </p>
                  <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Besi Super &bull; 15 Ton
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                Muat
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('sales')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left cursor-pointer transition-colors ${
                isDark ? 'bg-[#101c36] hover:bg-[#152342] border-blue-900/30' : 'bg-slate-50 hover:bg-slate-100 border-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isDark ? 'bg-sky-500/15 text-sky-400' : 'bg-emerald-500/10 text-emerald-500'
                }`}>
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <p className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Pabrik Peleburan Tegal
                  </p>
                  <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Kuningan &bull; 4 Ton
                  </p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isDark ? 'text-sky-300 bg-blue-500/20' : 'text-emerald-500 bg-emerald-500/10'
              }`}>
                Terkirim
              </span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
