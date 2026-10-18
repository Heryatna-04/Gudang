'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Lock,
  FileSpreadsheet,
  AlertTriangle,
  Plus,
  Edit3,
  Check,
  X,
  Package,
  Users,
  Sun,
  Sunset,
  Moon,
  Calendar,
  CalendarDays,
  RotateCcw,
  Sparkles,
  ArrowDownRight,
  ArrowUpRight,
  Filter,
  KeyRound,
} from 'lucide-react';
import {
  UserRole,
  ScaleTransaction,
  FactorySale,
  OpexExpense,
  AttendanceRecord,
  EmployeeLoan,
  Product,
} from '../../types';
import { exportEnterpriseReportExcel } from '../../lib/export/excel-generator';
import { UserAccountService } from '../../lib/auth/user-account-service';
import { ChoiceGroup } from '../ui/choice-group';
import { StatCard } from '../ui/stat-card';
import { Card, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table';

interface OwnerDashboardProps {
  activeRole: UserRole;
  transactions: ScaleTransaction[];
  factorySales: FactorySale[];
  opexList: OpexExpense[];
  attendances: AttendanceRecord[];
  loans: EmployeeLoan[];
  products: Product[];
  onApproveJumboTransaction: (txId: string) => void;
  onUpdateMarketBenchmark: (prodId: string, newBenchmark: number) => void;
  onAddProduct: (prod: Product) => void;
  onUpdateProductPrices: (
    prodId: string,
    priceRegular: number,
    pricePartner: number,
    benchmark: number
  ) => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

type DateFilterMode = 'ALL' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';

export function OwnerDashboard({
  activeRole,
  transactions,
  factorySales,
  opexList,
  attendances,
  loans,
  products,
  onApproveJumboTransaction,
  onUpdateMarketBenchmark,
  onAddProduct,
  onUpdateProductPrices,
  isDark: isDarkProp,
  onToggleTheme,
}: OwnerDashboardProps) {
  // Mode Dark State & Sync dengan LocalStorage & Document Element
  const [internalDark, setInternalDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const savedTheme = localStorage.getItem('gc_theme');
      if (savedTheme === 'dark') return true;
      if (savedTheme === 'light') return false;
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    } catch {
      return false;
    }
  });
  const isDark = isDarkProp !== undefined ? isDarkProp : internalDark;

  useEffect(() => {
    if (isDarkProp !== undefined) return;
    try {
      if (internalDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.warn('Gagal sinkron tema ke DOM:', e);
    }
  }, [isDarkProp, internalDark]);

  const toggleDarkMode = () => {
    if (onToggleTheme) {
      onToggleTheme();
      return;
    }
    setInternalDark((prev) => {
      const next = !prev;
      try {
        if (next) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('gc_theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('gc_theme', 'light');
        }
      } catch (e) {
        console.warn('Gagal menyimpan preferensi tema:', e);
      }
      return next;
    });
  };

  // Helper konversi Tanggal ke YYYY-MM-DD
  const formatDateToYMD = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Helper tampilan tanggal Indonesia
  const formatIndonesianDate = (ymdStr: string): string => {
    if (!ymdStr) return '-';
    try {
      const [y, m, d] = ymdStr.split('-').map(Number);
      if (!y || !m || !d) return ymdStr;
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return ymdStr;
    }
  };

  // Deteksi tanggal terkini dari data transaksi & penjualan agar filter default presisi
  const latestDataDate = useMemo(() => {
    const all = [
      ...transactions.map((t) => (t.createdAt ? t.createdAt.slice(0, 10) : '')),
      ...factorySales.map((s) => (s.createdAt ? s.createdAt.slice(0, 10) : '')),
      ...opexList.map((o) => (o.createdAt ? o.createdAt.slice(0, 10) : '')),
    ].filter(Boolean).sort();
    return all.length > 0 ? all[all.length - 1] : formatDateToYMD(new Date());
  }, [transactions, factorySales, opexList]);

  // State Filter Kalender Fleksibel (Harian, Mingguan, Bulanan, Kustom)
  const [filterMode, setFilterMode] = useState<DateFilterMode>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedWeekDate, setSelectedWeekDate] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [auditTab, setAuditTab] = useState<'pembelian' | 'penjualan'>('pembelian');

  // State & Handlers Otorisasi PIN Approval Jumbo Transaksi
  const [jumboTxToApprove, setJumboTxToApprove] = useState<ScaleTransaction | null>(null);
  const [ownerPinInput, setOwnerPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [isVerifyingPin, setIsVerifyingPin] = useState<boolean>(false);

  const handleOpenApprovalModal = (tx: ScaleTransaction) => {
    setJumboTxToApprove(tx);
    setOwnerPinInput('');
    setPinError('');
  };

  const handleConfirmApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jumboTxToApprove) return;
    setIsVerifyingPin(true);
    setPinError('');

    try {
      const isValid = await UserAccountService.verifyCurrentPin('owner', ownerPinInput.trim());
      if (isValid) {
        onApproveJumboTransaction(jumboTxToApprove.id);
        setJumboTxToApprove(null);
        setOwnerPinInput('');
      } else {
        setPinError('PIN Keamanan Owner salah. Transaksi jumbo tidak dapat disetujui.');
      }
    } catch (err) {
      console.warn('Gagal verifikasi PIN approval jumbo:', err);
      setPinError('Terjadi kendala verifikasi keamanan PIN.');
    } finally {
      setIsVerifyingPin(false);
    }
  };

  // Perhitungan Range Tanggal Aktif berdasarkan Mode Kalender
  const { activeStartDate, activeEndDate, activePeriodLabel, periodDescription } = useMemo(() => {
    if (filterMode === 'ALL') {
      return {
        activeStartDate: null,
        activeEndDate: null,
        activePeriodLabel: 'Semua Waktu (Akumulasi Historis)',
        periodDescription: 'Menampilkan akumulasi seluruh data penjualan, belanja, dan biaya tanpa batasan tanggal.',
      };
    }

    if (filterMode === 'DAILY') {
      const dStr = selectedDate || latestDataDate;
      return {
        activeStartDate: dStr,
        activeEndDate: dStr,
        activePeriodLabel: `Harian: ${formatIndonesianDate(dStr)}`,
        periodDescription: `Filter data untuk 1 hari kerja (${formatIndonesianDate(dStr)}).`,
      };
    }

    if (filterMode === 'WEEKLY') {
      const baseStr = selectedWeekDate || latestDataDate;
      const [y, m, d] = baseStr.split('-').map(Number);
      const baseDate = new Date(y, m - 1, d);
      const day = baseDate.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      const monday = new Date(baseDate);
      monday.setDate(baseDate.getDate() + diffToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const startStr = formatDateToYMD(monday);
      const endStr = formatDateToYMD(sunday);
      return {
        activeStartDate: startStr,
        activeEndDate: endStr,
        activePeriodLabel: `Mingguan: ${formatIndonesianDate(startStr)} - ${formatIndonesianDate(endStr)}`,
        periodDescription: `Filter 1 minggu kalender penuh (Senin s/d Minggu).`,
      };
    }

    if (filterMode === 'MONTHLY') {
      const monthStr = selectedMonth || latestDataDate.slice(0, 7);
      const [y, m] = monthStr.split('-').map(Number);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0);
      const startStr = formatDateToYMD(start);
      const endStr = formatDateToYMD(end);
      const monthName = start.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      return {
        activeStartDate: startStr,
        activeEndDate: endStr,
        activePeriodLabel: `Bulanan: ${monthName}`,
        periodDescription: `Filter 1 bulan kalender penuh (${monthName}, tgl 1 - ${end.getDate()}).`,
      };
    }

    if (filterMode === 'CUSTOM') {
      const startStr = customStartDate || latestDataDate;
      const endStr = customEndDate || latestDataDate;
      return {
        activeStartDate: startStr,
        activeEndDate: endStr,
        activePeriodLabel: `Kustom: ${formatIndonesianDate(startStr)} s/d ${formatIndonesianDate(endStr)}`,
        periodDescription: `Filter rentang tanggal khusus dari ${formatIndonesianDate(startStr)} sampai ${formatIndonesianDate(endStr)}.`,
      };
    }

    return {
      activeStartDate: null,
      activeEndDate: null,
      activePeriodLabel: 'Semua Waktu',
      periodDescription: '',
    };
  }, [filterMode, selectedDate, selectedWeekDate, selectedMonth, customStartDate, customEndDate, latestDataDate]);

  // Dataset Terfilter berdasarkan Kalender
  const filteredTransactions = useMemo(() => {
    if (!activeStartDate || !activeEndDate) return transactions;
    return transactions.filter((t) => {
      const d = t.createdAt ? t.createdAt.slice(0, 10) : '';
      return d >= activeStartDate && d <= activeEndDate;
    });
  }, [transactions, activeStartDate, activeEndDate]);

  const filteredFactorySales = useMemo(() => {
    if (!activeStartDate || !activeEndDate) return factorySales;
    return factorySales.filter((s) => {
      const d = s.createdAt ? s.createdAt.slice(0, 10) : '';
      return d >= activeStartDate && d <= activeEndDate;
    });
  }, [factorySales, activeStartDate, activeEndDate]);

  const filteredOpex = useMemo(() => {
    if (!activeStartDate || !activeEndDate) return opexList;
    return opexList.filter((o) => {
      const d = o.createdAt ? o.createdAt.slice(0, 10) : '';
      return d >= activeStartDate && d <= activeEndDate;
    });
  }, [opexList, activeStartDate, activeEndDate]);

  // Perhitungan Keuangan Konsolidasi Terfilter (Omzet, Kas Keluar, Laba Kotor, Laba Bersih)
  const totalSalesRevenue = filteredFactorySales.reduce((acc, s) => acc + s.totalRevenue, 0);
  const totalPurchaseExpenses = filteredTransactions.reduce((acc, t) => acc + t.totalAmount, 0);
  const totalOpexExpenses = filteredOpex.reduce((acc, o) => acc + o.amount, 0);
  const totalCashOutflow = totalPurchaseExpenses + totalOpexExpenses;
  const estimatedGrossProfit = totalSalesRevenue - totalPurchaseExpenses;
  const estimatedNetProfit = estimatedGrossProfit - totalOpexExpenses;
  const grossMarginPct = totalSalesRevenue > 0 ? ((estimatedGrossProfit / totalSalesRevenue) * 100).toFixed(1) : '0';
  const netMarginPct = totalSalesRevenue > 0 ? ((estimatedNetProfit / totalSalesRevenue) * 100).toFixed(1) : '0';

  const pendingJumboTransactions = filteredTransactions.filter(
    (t) => t.requiresOwnerApproval && !t.isApprovedByOwner
  );

  // Perhitungan Absensi Terfilter
  const targetAttendanceDate = filterMode === 'DAILY' ? (selectedDate || latestDataDate) : formatDateToYMD(new Date());
  const targetAttendances = attendances.filter((a) => {
    if (filterMode === 'DAILY') {
      return a.attendanceDate === (selectedDate || latestDataDate);
    }
    if (activeStartDate && activeEndDate) {
      return a.attendanceDate >= activeStartDate && a.attendanceDate <= activeEndDate;
    }
    return a.attendanceDate === targetAttendanceDate || a.attendanceDate === latestDataDate;
  });

  const presentCountPagi = targetAttendances.filter((a) => a.status === 'PRESENT' && (a.shift === 'PAGI' || !a.shift)).length;
  const presentCountMalam = targetAttendances.filter((a) => a.status === 'PRESENT' && a.shift === 'MALAM').length;
  const totalPresentToday = presentCountPagi + presentCountMalam;
  const permissionCount = targetAttendances.filter((a) => a.status === 'PERMISSION').length;
  const absentCount = targetAttendances.filter((a) => a.status === 'ABSENT').length;

  // Master Komoditas & Penetapan Harga (Khusus Owner)
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newCategory, setNewCategory] = useState<'LOGAM_BESI' | 'LOGAM_NON_BESI' | 'KERTAS_PLASTIK'>('LOGAM_BESI');
  const [newPriceRegular, setNewPriceRegular] = useState<number | ''>(5000);
  const [newPricePartner, setNewPricePartner] = useState<number | ''>(5500);
  const [newBenchmark, setNewBenchmark] = useState<number | ''>(6000);

  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  const [editPriceRegular, setEditPriceRegular] = useState(0);
  const [editPricePartner, setEditPricePartner] = useState(0);
  const [editBenchmark, setEditBenchmark] = useState(0);

  const handleStartEdit = (p: Product) => {
    setEditingProdId(p.id);
    setEditPriceRegular(p.priceRegular);
    setEditPricePartner(p.pricePartner);
    setEditBenchmark(p.marketPriceBenchmark);
  };

  const handleSaveEdit = (pId: string) => {
    onUpdateProductPrices(pId, editPriceRegular, editPricePartner, editBenchmark);
    setEditingProdId(null);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newProductName.trim();
    if (!cleanName) return;

    const partner = typeof newPricePartner === 'number' ? newPricePartner : 0;
    const regular = typeof newPriceRegular === 'number' ? newPriceRegular : 0;
    const benchmark = typeof newBenchmark === 'number' ? newBenchmark : Math.max(regular, partner) + 500;

    const newProd: Product = {
      id: `prod-${Date.now()}`,
      name: cleanName,
      category: newCategory,
      priceRegular: regular,
      pricePartner: partner,
      marketPriceBenchmark: benchmark,
      currentStockKg: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    onAddProduct(newProd);
    setNewProductName('');
    setNewPriceRegular(5000);
    setNewPricePartner(5500);
    setNewBenchmark(6000);
    setShowAddProductModal(false);
  };

  const handleExportFullExcel = () => {
    exportEnterpriseReportExcel(
      {
        attendances: targetAttendances,
        loans,
        purchases: filteredTransactions,
        factorySales: filteredFactorySales,
        opex: filteredOpex,
        isOwner: true,
      },
      `REKAP_EKSEKUTIF_${activePeriodLabel.replace(/[^a-zA-Z0-9]/g, '_')}`
    );
  };

  if (activeRole !== 'OWNER') {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 p-12 text-center text-red-800 dark:text-red-300 font-sans">
        <Lock className="h-10 w-10 text-red-600 dark:text-red-400 mb-3" />
        <h3 className="text-base font-extrabold">AKSES TERKUNCI</h3>
        <p className="mt-1 max-w-md text-xs text-red-600 dark:text-red-400">
          Role ADMIN tidak memiliki izin untuk melihat Laporan Laba/Rugi, Total Kas Perusahaan, dan Ekspor Finansial.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 font-sans transition-colors duration-200 ${isDark ? 'dark text-slate-100' : 'text-slate-900'}`}>
      {/* Header Owner & Quick Action (Dark Mode Toggle & Ekspor Excel) */}
      <div className="flex flex-col gap-4 rounded-2xl border border-amber-600/40 bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950 p-6 shadow-md text-white md:flex-row md:items-center md:justify-between transition-colors duration-200">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-amber-400" />
            <h2 className="text-lg font-black tracking-tight text-white">
              DASHBOARD LABA / RUGI & KAS GLOBAL (<span className="text-amber-400">OWNER</span>)
            </h2>
          </div>
          <p className="mt-1 text-xs text-emerald-200/90 dark:text-emerald-300/80 font-medium">
            Green Cycle Kuningan: Monitoring omzet penjualan, belanja timbangan, kas keluar operasional, laba kotor & approval transaksi jumbo.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Tombol Ekspor Excel */}
          <button
            type="button"
            onClick={handleExportFullExcel}
            className="flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2.5 text-xs font-black text-white shadow-md transition-all cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-200" />
            Ekspor Excel 5-Sheet (.xlsx)
          </button>
        </div>
      </div>

      {/* FILTER KALENDER & RENTANG WAKTU FLEKSIBEL (DATE RANGE PICKER) */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl p-2 bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-500/20">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-extrabold">
                  FILTER KALENDER &amp; PERIODE FINANSIAL
                </CardTitle>
                <Badge variant="emerald">{filterMode}</Badge>
              </div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                {periodDescription}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="slate" className="px-3 py-1.5 text-xs font-bold gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
              <span>{activePeriodLabel}</span>
            </Badge>
            {filterMode !== 'ALL' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setFilterMode('ALL')}
                className="py-1 px-2.5"
                title="Reset ke Semua Waktu"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Tab Segmentasi Filter Mode Custom Choice Group */}
        <div className="flex flex-wrap items-center gap-2">
          <ChoiceGroup<DateFilterMode>
            options={[
              { value: 'ALL', label: 'Semua Waktu' },
              { value: 'DAILY', label: 'Harian' },
              { value: 'WEEKLY', label: 'Mingguan' },
              { value: 'MONTHLY', label: 'Bulanan' },
              { value: 'CUSTOM', label: 'Kustom' },
            ]}
            value={filterMode}
            onChange={(mode) => {
              setFilterMode(mode);
              if (mode === 'DAILY' && !selectedDate) setSelectedDate(latestDataDate);
              if (mode === 'WEEKLY' && !selectedWeekDate) setSelectedWeekDate(latestDataDate);
              if (mode === 'MONTHLY' && !selectedMonth) setSelectedMonth(latestDataDate.slice(0, 7));
              if (mode === 'CUSTOM') {
                if (!customStartDate) setCustomStartDate(latestDataDate);
                if (!customEndDate) setCustomEndDate(latestDataDate);
              }
            }}
            size="sm"
            isDark={isDark}
          />
        </div>

        {/* Input Kontrol Kalender Interaktif sesuai Mode */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-[#EDF2E8]/40 dark:bg-[#0f172a]/40 p-3.5 transition-colors duration-200">
          {filterMode === 'DAILY' && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Pilih Tanggal:</span>
              <Input
                type="date"
                value={selectedDate || latestDataDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto font-numeric cursor-pointer"
              />
              <div className="flex items-center gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedDate(formatDateToYMD(new Date()))}
                >
                  Hari Ini
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedDate(latestDataDate)}
                  className="text-emerald-800 dark:text-emerald-400 font-bold"
                >
                  Data Terkini ({formatIndonesianDate(latestDataDate)})
                </Button>
              </div>
            </div>
          )}

          {filterMode === 'WEEKLY' && (
            <div className="flex flex-wrap items-center gap-3">
              <span className={`text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Pilih Tanggal Acuan Minggu:</span>
              <input
                type="date"
                value={selectedWeekDate || latestDataDate}
                onChange={(e) => setSelectedWeekDate(e.target.value)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600 font-numeric cursor-pointer ${
                  isDark ? 'border-zinc-700 bg-zinc-900 text-zinc-100' : 'border-slate-300 bg-white text-slate-900'
                }`}
              />
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedWeekDate(formatDateToYMD(new Date()))}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
                    isDark ? 'bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Minggu Ini
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedWeekDate(latestDataDate)}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
                    isDark ? 'bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-emerald-400' : 'bg-white border-slate-300 hover:bg-slate-100 text-emerald-800'
                  }`}
                >
                  Minggu Data Terkini
                </button>
              </div>
              <span className={`text-[11px] font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                (Otomatis mencakup Senin s/d Minggu: {formatIndonesianDate(activeStartDate || '')} - {formatIndonesianDate(activeEndDate || '')})
              </span>
            </div>
          )}

          {filterMode === 'MONTHLY' && (
            <div className="flex flex-wrap items-center gap-3">
              <span className={`text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Pilih Bulan &amp; Tahun:</span>
              <input
                type="month"
                value={selectedMonth || latestDataDate.slice(0, 7)}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600 font-numeric cursor-pointer ${
                  isDark ? 'border-zinc-700 bg-zinc-900 text-zinc-100' : 'border-slate-300 bg-white text-slate-900'
                }`}
              />
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedMonth(formatDateToYMD(new Date()).slice(0, 7))}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
                    isDark ? 'bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Bulan Ini
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMonth('2026-09')}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
                    isDark ? 'bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-emerald-400' : 'bg-white border-slate-300 hover:bg-slate-100 text-emerald-800'
                  }`}
                >
                  September 2026 (Demo)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMonth('2026-08')}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
                    isDark ? 'bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Agustus 2026
                </button>
              </div>
            </div>
          )}

          {filterMode === 'CUSTOM' && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Dari:</span>
                <input
                  type="date"
                  value={customStartDate || latestDataDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600 font-numeric cursor-pointer ${
                    isDark ? 'border-zinc-700 bg-zinc-900 text-zinc-100' : 'border-slate-300 bg-white text-slate-900'
                  }`}
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Sampai:</span>
                <input
                  type="date"
                  value={customEndDate || latestDataDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600 font-numeric cursor-pointer ${
                    isDark ? 'border-zinc-700 bg-zinc-900 text-zinc-100' : 'border-slate-300 bg-white text-slate-900'
                  }`}
                />
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setCustomStartDate('2026-09-01');
                    setCustomEndDate('2026-09-30');
                  }}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
                    isDark ? 'bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-emerald-400' : 'bg-white border-slate-300 hover:bg-slate-100 text-emerald-800'
                  }`}
                >
                  1 - 30 Sep 2026
                </button>
              </div>
            </div>
          )}

          {filterMode === 'ALL' && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className={`font-medium ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                Akumulasi seluruh data historis: <span className={`font-bold font-numeric ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{filteredTransactions.length}</span> nota timbangan, <span className={`font-bold font-numeric ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{filteredFactorySales.length}</span> penjualan stok, dan <span className={`font-bold font-numeric ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{filteredOpex.length}</span> biaya operasional.
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setFilterMode('DAILY');
                    setSelectedDate(latestDataDate);
                  }}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
                    isDark ? 'bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Filter Harian
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterMode('MONTHLY');
                    setSelectedMonth(latestDataDate.slice(0, 7));
                  }}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
                    isDark ? 'bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Filter Bulanan
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* RINGKASAN KOMODITAS UTAMA & HARGA BENCHMARK */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
              Ringkasan Komoditas Utama &amp; Stok Gudang
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Monitoring harga pasar, stok terkumpul, dan marjin komoditas unggulan
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {products.slice(0, 3).map((prod) => {
            const marginPerKg = prod.marketPriceBenchmark - prod.priceRegular;
            return (
              <Card key={prod.id} className="p-4.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                    {prod.name}
                  </span>
                  <Badge variant={marginPerKg > 0 ? 'emerald' : 'amber'}>
                    Spread: +Rp{marginPerKg.toLocaleString('id-ID')}/kg
                  </Badge>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-[10px] block text-slate-400 dark:text-zinc-500 font-medium">Beli Kasir:</span>
                    <span className="text-base font-numeric font-black text-slate-800 dark:text-zinc-100">
                      Rp{prod.priceRegular.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] block text-slate-400 dark:text-zinc-500 font-medium">Benchmark Pabrik:</span>
                    <span className="text-base font-numeric font-black text-amber-500">
                      Rp{prod.marketPriceBenchmark.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-zinc-400 font-medium">Stok Siap Kirim:</span>
                  <span className="font-numeric font-black text-emerald-800 dark:text-emerald-400">
                    {Number(prod.currentStockKg || 0).toLocaleString('id-ID')} kg
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* FINANCIAL METRIC CARDS - OMZET, KAS KELUAR, LABA KOTOR & LABA BERSIH */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. OMZET (TOTAL PENJUALAN STOK) */}
        <StatCard
          title="Total Omzet (Penjualan)"
          value={`Rp${totalSalesRevenue.toLocaleString('id-ID')}`}
          subtitle={`${filteredFactorySales.length} Transaksi Peleburan & Eceran`}
          icon={TrendingUp}
          variant="emerald"
        />

        {/* 2. TOTAL KAS KELUAR (BELANJA + OPEX) */}
        <StatCard
          title="Total Kas Keluar"
          value={`Rp${totalCashOutflow.toLocaleString('id-ID')}`}
          subtitle={`Belanja Rp${(totalPurchaseExpenses / 1000000).toFixed(1)}Jt • OPEX Rp${(totalOpexExpenses / 1000).toFixed(0)}Rb`}
          icon={TrendingDown}
          variant="rose"
        />

        {/* 3. ESTIMASI LABA KOTOR (GROSS PROFIT) */}
        <StatCard
          title="Estimasi Laba Kotor"
          value={`Rp${estimatedGrossProfit.toLocaleString('id-ID')}`}
          subtitle={`Omzet - Belanja • Margin ~${grossMarginPct}%`}
          icon={BarChart3}
          variant="emerald"
        />

        {/* 4. ESTIMASI LABA BERSIH (NET PROFIT) */}
        <StatCard
          title="Estimasi Laba Bersih"
          value={`Rp${estimatedNetProfit.toLocaleString('id-ID')}`}
          subtitle={`Laba Kotor - OPEX • Margin ~${netMarginPct}%`}
          icon={Sparkles}
          variant="amber"
        />
      </div>

      {/* APPROVAL TRANSAKSI JUMBO */}
      <Card className="p-5 border-amber-300 dark:border-amber-800/40 bg-amber-50/40 dark:bg-amber-950/20">
        <div className="flex items-center justify-between border-b border-amber-200/80 dark:border-amber-900/40 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-700 dark:text-amber-400" />
            <CardTitle className="text-sm font-extrabold text-amber-950 dark:text-amber-200">
              APPROVAL TRANSAKSI JUMBO (&gt; Rp 10.000.000)
            </CardTitle>
          </div>
          <Badge variant="amber">
            {pendingJumboTransactions.length} Menunggu Persetujuan
          </Badge>
        </div>

        <div className="mt-3 space-y-2">
          {pendingJumboTransactions.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-500 dark:text-zinc-400 font-medium">
              Tidak ada nota timbangan jumbo yang pending pada periode ini. Semua transaksi di bawah limit aman.
            </div>
          ) : (
            pendingJumboTransactions.map((tx) => (
              <Card
                key={tx.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 text-xs bg-white dark:bg-[#0b1220]"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">{tx.invoiceNumber}</span>
                    <span className="text-slate-600 dark:text-zinc-400">• Gudang {tx.warehouseId} • {tx.sellerName}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400">
                    Total Nilai: <span className="font-numeric font-black text-sm text-amber-700 dark:text-amber-400">Rp{tx.totalAmount.toLocaleString('id-ID')}</span> • {tx.items.length} Komoditas
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenApprovalModal(tx)}
                  className="font-black"
                >
                  Approve Transaksi Jumbo (PIN Owner)
                </Button>
              </Card>
            ))
          )}
        </div>
      </Card>

      {/* MONITORING KEHADIRAN PEKERJA GUDANG 1 */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-800 dark:text-emerald-400" />
            <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">
              MONITORING KEHADIRAN PEKERJA ({activePeriodLabel})
            </CardTitle>
          </div>
          <Badge variant="slate">
            {targetAttendances.length} Status Absen Tercatat ({formatIndonesianDate(activeStartDate || targetAttendanceDate)})
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-emerald-500/20 bg-[#EDF2E8]/60 dark:bg-[#0f172a] p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 mb-1">
              <Sun className="h-3.5 w-3.5" />
              <span>Shift Pagi</span>
            </div>
            <div className="text-xl font-black font-numeric text-emerald-900 dark:text-emerald-200">{presentCountPagi} Org</div>
          </div>

          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 dark:bg-indigo-950/30 p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 mb-1">
              <Moon className="h-3.5 w-3.5" />
              <span>Shift Malam</span>
            </div>
            <div className="text-xl font-black font-numeric text-indigo-900 dark:text-indigo-200">{presentCountMalam} Org</div>
          </div>

          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 dark:bg-blue-950/30 p-3 text-center">
            <div className="text-[11px] font-bold text-blue-700 dark:text-blue-300 mb-1">Izin / Sakit</div>
            <div className="text-xl font-black font-numeric text-blue-900 dark:text-blue-200">{permissionCount} Org</div>
          </div>

          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 dark:bg-rose-950/30 p-3 text-center">
            <div className="text-[11px] font-bold text-rose-700 dark:text-rose-300 mb-1">Alpa / Tanpa Ket.</div>
            <div className="text-xl font-black font-numeric text-rose-900 dark:text-rose-200">{absentCount} Org</div>
          </div>
        </div>

        {targetAttendances.length === 0 ? (
          <div className="rounded-xl bg-slate-50 dark:bg-[#0f172a] p-3 text-center text-xs text-slate-500 dark:text-zinc-400 font-medium border border-slate-100 dark:border-slate-800">
            Belum ada absensi yang dicatat untuk tanggal ini. Pengisian dilakukan di menu &quot;Absensi Karyawan&quot;.
          </div>
        ) : (
          <div className="rounded-xl bg-[#EDF2E8]/40 dark:bg-[#0f172a] p-3 text-xs text-slate-700 dark:text-zinc-300 flex flex-wrap items-center justify-between gap-2 border border-slate-200/80 dark:border-slate-800">
            <span className="font-bold text-emerald-950 dark:text-emerald-400">
              Total Hadir Bekerja: <span className="text-emerald-800 dark:text-emerald-300 font-numeric text-sm">{totalPresentToday}</span> Orang
            </span>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400">
              Data tersinkronisasi otomatis dari absensi kasir Gudang 1.
            </span>
          </div>
        )}
      </Card>

      {/* MASTER KOMODITAS & PENETAPAN HARGA BELI (KHUSUS OWNER) */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-emerald-800 dark:text-emerald-400" />
              <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">
                Master Komoditas &amp; Penetapan Harga Beli (Khusus Owner)
              </CardTitle>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Input komoditas baru dan update harga beli timbangan (Langganan &amp; Eceran) serta patokan pasar. Kasir hanya dapat memilih dari daftar ini.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddProductModal(true)}
            className="w-fit font-black"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Komoditas Baru</span>
          </Button>
        </div>

        {/* Modal / Form Tambah Komoditas Baru */}
        {showAddProductModal && (
          <div className="rounded-xl border border-emerald-300 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-black p-4 space-y-3 animate-in fade-in transition-colors duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-950 dark:text-emerald-300 uppercase tracking-wider">
                Form Tambah Komoditas Baru (Owner)
              </span>
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">Nama Barang / Logam</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tembaga Super Kupas"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-700 dark:focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">Kategori</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as 'LOGAM_BESI' | 'LOGAM_NON_BESI' | 'KERTAS_PLASTIK')}
                  className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-xs font-bold text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-700 dark:focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="LOGAM_BESI">Logam Besi</option>
                  <option value="LOGAM_NON_BESI">Logam Non Besi</option>
                  <option value="KERTAS_PLASTIK">Kertas / Plastik</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">Beli Langganan (Rp)</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  placeholder="0"
                  value={newPricePartner}
                  onChange={(e) => setNewPricePartner(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                  className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 dark:focus:ring-emerald-500 font-numeric"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">Beli Eceran (Rp)</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  placeholder="0"
                  value={newPriceRegular}
                  onChange={(e) => setNewPriceRegular(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                  className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-700 dark:focus:ring-emerald-500 font-numeric"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">Patokan Pasar (Rp)</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  placeholder="0"
                  value={newBenchmark}
                  onChange={(e) => setNewBenchmark(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                  className="w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 dark:focus:ring-emerald-500 font-numeric"
                />
              </div>

              <div className="sm:col-span-2 md:col-span-6 flex justify-end gap-2 pt-2 border-t border-emerald-200 dark:border-emerald-900/40">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="rounded-lg bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs cursor-pointer"
                >
                  Simpan Komoditas
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Grid Kartu Komoditas & Edit Harga */}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const isEditing = editingProdId === p.id;
            const marginSpread = (isEditing ? editBenchmark : p.marketPriceBenchmark) - (isEditing ? editPriceRegular : p.priceRegular);
            const totalAssetValue = (p.currentStockKg || 0) * (isEditing ? editBenchmark : p.marketPriceBenchmark);

            return (
              <div
                key={p.id}
                className={`rounded-2xl border transition-all duration-200 p-4 flex flex-col justify-between ${
                  isEditing
                    ? 'border-emerald-500/80 ring-2 ring-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/20'
                    : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-xs hover:border-emerald-500/40'
                }`}
              >
                <div>
                  {/* Top Bar: Title, Category & Stock/Edit Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold text-sm text-slate-900 dark:text-zinc-100 truncate" title={p.name}>
                        {p.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="slate" className="text-[9px] font-bold tracking-wider uppercase">
                          {p.category.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant="emerald" className="font-numeric font-bold text-[10px]">
                        Stok: {(p.currentStockKg || 0).toLocaleString('id-ID')} Kg
                      </Badge>
                      {!isEditing ? (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(p)}
                          className="flex items-center gap-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-zinc-200 cursor-pointer transition-colors"
                        >
                          <Edit3 className="h-3 w-3" />
                          <span>Edit</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(p.id)}
                            className="rounded-xl bg-emerald-800 dark:bg-emerald-600 text-white p-1.5 hover:bg-emerald-900 dark:hover:bg-emerald-500 cursor-pointer shadow-xs transition-colors"
                            title="Simpan"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingProdId(null)}
                            className="rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-zinc-300 p-1.5 hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                            title="Batal"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Body Content: Edit Mode vs View Mode */}
                  {isEditing ? (
                    <div className="space-y-2 mt-3 pt-3 border-t border-emerald-200/60 dark:border-emerald-900/60">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600 dark:text-zinc-400">Beli Langganan:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">Rp</span>
                          <input
                            type="number"
                            value={editPricePartner}
                            onChange={(e) => setEditPricePartner(parseFloat(e.target.value) || 0)}
                            className="w-24 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-right font-black text-emerald-800 dark:text-emerald-400 text-xs font-numeric focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600 dark:text-zinc-400">Beli Eceran:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">Rp</span>
                          <input
                            type="number"
                            value={editPriceRegular}
                            onChange={(e) => setEditPriceRegular(parseFloat(e.target.value) || 0)}
                            className="w-24 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-right font-black text-slate-800 dark:text-zinc-100 text-xs font-numeric focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600 dark:text-zinc-400">Benchmark Pabrik:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">Rp</span>
                          <input
                            type="number"
                            value={editBenchmark}
                            onChange={(e) => setEditBenchmark(parseFloat(e.target.value) || 0)}
                            className="w-24 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-right font-black text-amber-600 dark:text-amber-400 text-xs font-numeric focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                      {/* Price Grid (Langganan vs Eceran) */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-[#EDF2E8]/40 dark:bg-slate-800/40 p-2 border border-slate-100 dark:border-slate-800/60">
                          <span className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 block">Beli Langganan</span>
                          <span className="font-numeric font-extrabold text-xs text-emerald-800 dark:text-emerald-400">
                            Rp{p.pricePartner.toLocaleString('id-ID')}
                            <span className="text-[10px] font-normal text-slate-400">/kg</span>
                          </span>
                        </div>
                        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/30 p-2 border border-slate-100 dark:border-slate-800/60">
                          <span className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 block">Beli Eceran</span>
                          <span className="font-numeric font-extrabold text-xs text-slate-800 dark:text-zinc-200">
                            Rp{p.priceRegular.toLocaleString('id-ID')}
                            <span className="text-[10px] font-normal text-slate-400">/kg</span>
                          </span>
                        </div>
                      </div>

                      {/* Benchmark & Margin Highlight */}
                      <div className="rounded-xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 px-2.5 py-1.5 flex items-center justify-between text-xs">
                        <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                          Benchmark Pabrik:
                        </span>
                        <span className="font-numeric font-black text-xs text-amber-600 dark:text-amber-400">
                          Rp{p.marketPriceBenchmark.toLocaleString('id-ID')}/kg
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer: Spread & Asset Evaluation */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-numeric">
                  <Badge variant={marginSpread > 0 ? 'emerald' : 'amber'} className="text-[10px] px-2 py-0.5">
                    Spread: +Rp{marginSpread.toLocaleString('id-ID')}/kg
                  </Badge>
                  <span className="font-semibold text-slate-500 dark:text-zinc-400">
                    Aset: <strong className="text-slate-800 dark:text-zinc-200">Rp{totalAssetValue.toLocaleString('id-ID')}</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* TABEL AUDIT & RIWAYAT TRANSAKSI REAL-TIME (PEMBELIAN & PENJUALAN) */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <ChoiceGroup
            value={auditTab}
            onChange={(val) => setAuditTab(val as 'pembelian' | 'penjualan')}
            options={[
              {
                value: 'pembelian',
                label: `Riwayat Pembelian Timbangan (${filteredTransactions.length})`,
                icon: <ArrowDownRight className="h-4 w-4 text-amber-400" />,
              },
              {
                value: 'penjualan',
                label: `Riwayat Penjualan Stok (${filteredFactorySales.length})`,
                icon: <ArrowUpRight className="h-4 w-4 text-emerald-400" />,
              },
            ]}
          />

          <Badge variant="slate" className="px-3 py-1.5 text-xs font-semibold">
            Periode: <strong className="ml-1 text-slate-800 dark:text-zinc-200">{activePeriodLabel}</strong>
          </Badge>
        </div>

        {/* Tabel Pembelian Timbangan */}
        {auditTab === 'pembelian' && (
          <Table>
            <TableHeader>
              <tr>
                <TableHead>No. Nota</TableHead>
                <TableHead>Gudang</TableHead>
                <TableHead>Penjual</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Total Nilai</TableHead>
                <TableHead>Status Approval</TableHead>
                <TableHead>Waktu</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-6 text-center text-xs text-slate-400 dark:text-zinc-500 font-sans">
                    Tidak ada transaksi timbangan pada periode kalender yang dipilih.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono font-bold text-slate-900 dark:text-zinc-100">{tx.invoiceNumber}</TableCell>
                    <TableCell className="font-sans font-medium text-slate-600 dark:text-zinc-400">Gudang {tx.warehouseId}</TableCell>
                    <TableCell className="font-sans font-semibold text-slate-900 dark:text-zinc-200">{tx.sellerName}</TableCell>
                    <TableCell className="text-slate-500 dark:text-zinc-400 font-sans">{tx.items.length} Barang</TableCell>
                    <TableCell className="font-numeric font-black text-amber-700 dark:text-amber-400">
                      Rp{tx.totalAmount.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="font-sans">
                      {tx.requiresOwnerApproval ? (
                        tx.isApprovedByOwner ? (
                          <Badge variant="emerald">APPROVED</Badge>
                        ) : (
                          <Button
                            variant="amber"
                            size="sm"
                            onClick={() => handleOpenApprovalModal(tx)}
                            className="text-[10px] py-0.5 px-2 font-black"
                          >
                            SETUJUI SEKARANG
                          </Button>
                        )
                      ) : (
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">NORMAL</span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-400 dark:text-zinc-500 font-sans text-xs">
                      {new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} {new Date(tx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

        {/* Tabel Penjualan Stok Gudang ke Pabrik / Eceran */}
        {auditTab === 'penjualan' && (
          <Table>
            <TableHeader>
              <tr>
                <TableHead>No. Invoice</TableHead>
                <TableHead>Gudang</TableHead>
                <TableHead>Pembeli / Pabrik</TableHead>
                <TableHead>Komoditas</TableHead>
                <TableHead>Tonase (Kg)</TableHead>
                <TableHead>Harga / Kg</TableHead>
                <TableHead>Total Kas Masuk</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead>Waktu</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {filteredFactorySales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-6 text-center text-xs text-slate-400 dark:text-zinc-500 font-sans">
                    Tidak ada transaksi penjualan stok pada periode kalender yang dipilih.
                  </TableCell>
                </TableRow>
              ) : (
                filteredFactorySales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-mono font-bold text-slate-900 dark:text-zinc-100">{sale.invoiceNumber}</TableCell>
                    <TableCell className="font-sans font-medium text-slate-600 dark:text-zinc-400">Gudang {sale.warehouseId}</TableCell>
                    <TableCell>
                      <div className="font-bold text-slate-900 dark:text-zinc-100">{sale.factoryName}</div>
                      <Badge variant="slate" className="text-[9px] mt-0.5">
                        {sale.buyerType === 'PELEBURAN_BESAR' ? 'Peleburan Tonase' : 'Pembeli Biasa'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-sans font-medium text-slate-800 dark:text-zinc-200">{sale.productName || 'Komoditas'}</TableCell>
                    <TableCell className="font-numeric font-bold">{sale.weightKg.toLocaleString('id-ID')} Kg</TableCell>
                    <TableCell className="font-numeric">Rp{sale.contractPricePerKg.toLocaleString('id-ID')}</TableCell>
                    <TableCell className="font-numeric font-black text-emerald-800 dark:text-emerald-400">
                      Rp{sale.totalRevenue.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={sale.paymentMethod === 'CASH_LACI' ? 'emerald' : 'blue'}>
                        {sale.paymentMethod === 'CASH_LACI' ? 'KAS TUNAI LACI' : 'TRANSFER BANK'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-400 dark:text-zinc-500 font-sans text-xs">
                      {new Date(sale.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} {new Date(sale.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Modal Otorisasi PIN Owner untuk Transaksi Jumbo */}
      {jumboTxToApprove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                    Otorisasi PIN Transaksi Jumbo
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Diperlukan persetujuan Owner untuk nilai di atas Rp 10.000.000
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setJumboTxToApprove(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Info Transaksi */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">No. Nota:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">{jumboTxToApprove.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">Penjual / Pengepul:</span>
                <span className="font-semibold text-slate-800 dark:text-zinc-200">{jumboTxToApprove.sellerName}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200/60 dark:border-zinc-800">
                <span className="text-slate-700 dark:text-zinc-300 font-bold">Total Pembayaran:</span>
                <span className="font-numeric font-black text-amber-700 dark:text-amber-400 text-sm">
                  Rp{jumboTxToApprove.totalAmount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {pinError && (
              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 font-medium">
                {pinError}
              </div>
            )}

            <form onSubmit={handleConfirmApproval} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Masukkan PIN Keamanan Owner
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={ownerPinInput}
                    onChange={(e) => setOwnerPinInput(e.target.value)}
                    placeholder="Masukkan PIN Owner"
                    className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-black pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-mono font-bold"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setJumboTxToApprove(null)}
                  className="flex-1 rounded-xl border border-slate-300 dark:border-zinc-700 py-2.5 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-900 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingPin || !ownerPinInput}
                  className="flex-1 rounded-xl bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isVerifyingPin ? 'Memverifikasi...' : 'Verifikasi & Setujui'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
