'use client';

import React, { useMemo } from 'react';
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

interface ExecutiveDashboardOverviewProps {
  activeRole: UserRole;
  currentUser: { fullName: string; role: UserRole; username: string };
  products: Product[];
  transactions: ScaleTransaction[];
  factorySales: FactorySale[];
  isDark?: boolean;
  onNavigateTab: (tab: string) => void;
}

export function ExecutiveDashboardOverview({
  activeRole,
  currentUser,
  products,
  transactions,
  factorySales,
  isDark = false,
  onNavigateTab,
}: ExecutiveDashboardOverviewProps) {
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
          
          {/* Chart Tonase Mingguan (Tailwind Bar Chart Sesuai Slice) */}
          <div className={`p-5 rounded-2xl border transition-colors ${
            isDark ? 'bg-[#0b1220] border-slate-800/80' : 'bg-white border-slate-200/80 shadow-xs'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className={`font-black text-xs uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Volume Timbangan (Ton)
                </h3>
                <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-1 mt-0.5">
                  <TrendingUp className="w-3.5 h-3.5" /> +12% minggu ini
                </span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${
                isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}>
                Mingguan
              </span>
            </div>

            <div className="h-40 flex items-end justify-between pt-6 px-3 relative">
              <div className={`absolute top-1 left-[58%] -translate-x-1/2 text-white text-[10px] px-2.5 py-1 rounded-lg font-bold shadow-xs ${
                isDark ? 'bg-[#0f172a] border border-slate-700' : 'bg-emerald-950'
              }`}>
                14.2 Ton &bull; Kamis
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className={`w-3.5 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} style={{ height: '55px' }}></div>
                <span className="text-[10px] text-slate-400 font-bold">Sen</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className={`w-3.5 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} style={{ height: '80px' }}></div>
                <span className="text-[10px] text-slate-400 font-bold">Sel</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className={`w-3.5 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} style={{ height: '45px' }}></div>
                <span className="text-[10px] text-slate-400 font-bold">Rab</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-3.5 bg-emerald-600 rounded-full ring-4 ring-emerald-500/20" style={{ height: '115px' }}></div>
                <span className={`text-[10px] font-black ${isDark ? 'text-emerald-400' : 'text-emerald-900'}`}>Kam</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className={`w-3.5 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} style={{ height: '90px' }}></div>
                <span className="text-[10px] text-slate-400 font-bold">Jum</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className={`w-3.5 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} style={{ height: '65px' }}></div>
                <span className="text-[10px] text-slate-400 font-bold">Sab</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className={`w-3.5 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} style={{ height: '30px' }}></div>
                <span className="text-[10px] text-slate-400 font-bold">Min</span>
              </div>
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
              <div className={`flex items-center justify-between p-2.5 rounded-xl border ${
                isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-slate-50 border-slate-100'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 font-black text-xs flex items-center justify-center">
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
              </div>

              <div className={`flex items-center justify-between p-2.5 rounded-xl border ${
                isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-slate-50 border-slate-100'
              }`}>
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
              </div>

              <div className={`flex items-center justify-between p-2.5 rounded-xl border ${
                isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-slate-50 border-slate-100'
              }`}>
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
              </div>
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
            {recentTransactions.length === 0 ? (
              <div className={`p-6 text-center rounded-xl border border-dashed ${
                isDark ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'
              }`}>
                Belum ada transaksi timbangan hari ini. Klik &quot;Nota Baru&quot; untuk mulai menimbang.
              </div>
            ) : (
              recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition ${
                    isDark ? 'bg-[#0f172a] border-slate-800/80' : 'bg-slate-50/70 border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs shrink-0">
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
                    <p className={`font-numeric font-black ${isDark ? 'text-emerald-400' : 'text-emerald-800'}`}>
                      Rp{tx.totalAmount.toLocaleString('id-ID')}
                    </p>
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block mt-0.5">
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
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Cloud Realtime Sync
              </span>
              <span className="text-[9px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-600/30">
                Online
              </span>
            </div>
            <h3 className="text-base font-black leading-snug">
              Data 4 Gudang Terintegrasi
            </h3>
            <p className="text-xs text-emerald-200/80 leading-relaxed font-normal">
              Sistem offline-first Dexie aktif. Seluruh nota aman tersimpan di IndexedDB browser.
            </p>
            <button
              type="button"
              onClick={() => onNavigateTab('owner')}
              className="w-full mt-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-2.5 rounded-xl shadow-xs transition cursor-pointer"
            >
              Buka Laporan Finansial Owner
            </button>
          </div>
          <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-emerald-600/10 rounded-full blur-2xl pointer-events-none"></div>
        </div>

        {/* Mini Kalender Interaktif */}
        <InteractiveCalendar isDark={isDark} />

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
            <div className={`flex items-center justify-between p-2.5 rounded-xl border ${
              isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-slate-50 border-slate-100'
            }`}>
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
            </div>

            <div className={`flex items-center justify-between p-2.5 rounded-xl border ${
              isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-slate-50 border-slate-100'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
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
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                Terkirim
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
