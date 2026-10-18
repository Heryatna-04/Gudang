'use client';

import React, { useState } from 'react';
import {
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle,
  AlertTriangle,
  BadgeDollarSign,
  Banknote,
  Scale,
  TrendingUp,
  TrendingDown,
  Edit3,
  Check,
} from 'lucide-react';
import { CashShift, UserRole } from '../../types';
import { Card, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface ShiftManagementProps {
  activeRole: UserRole;
  warehouseId: number;
  warehouseName: string;
  activeShift: CashShift | null;
  onOpenShift: (initialCash: number, notes: string) => void;
  onCloseShift: (actualClosingCash: number, notes: string) => void;
  onUpdateInitialCash?: (newInitialCash: number) => void;
  totalExpenseToday: number; // Kas keluar belanja timbangan
  totalCashInSalesToday: number; // Kas masuk dari penjualan tunai di laci
  totalOpexToday?: number; // Biaya operasional kas kecil hari ini
}

export function ShiftManagement({
  activeRole,
  warehouseId,
  warehouseName,
  activeShift,
  onOpenShift,
  onCloseShift,
  onUpdateInitialCash,
  totalExpenseToday,
  totalCashInSalesToday = 0,
  totalOpexToday = 0,
}: ShiftManagementProps) {
  const [initialCashInput, setInitialCashInput] = useState<number | ''>(20000000);
  const [openNotes, setOpenNotes] = useState<string>('Modal kas pagi operasional timbangan');
  const [actualCashInput, setActualCashInput] = useState<number | ''>('');
  const [closeNotes, setCloseNotes] = useState<string>('Hitung fisik kas sore');
  const [isEditingCash, setIsEditingCash] = useState<boolean>(false);
  const [editCashInput, setEditCashInput] = useState<number | ''>(activeShift?.initialCash || 0);

  // FORMULA LACI KASIR LENGKAP:
  const initialCash = activeShift?.initialCash || 0;
  const expectedClosingCash = Math.max(0, initialCash + totalCashInSalesToday - totalExpenseToday);
  const numActualCash = typeof actualCashInput === 'number' ? actualCashInput : 0;
  const cashDifference = actualCashInput !== '' ? numActualCash - expectedClosingCash : 0;

  // FORMULA KEUNTUNGAN HARI INI:
  const dailyProfit = totalCashInSalesToday - totalExpenseToday - totalOpexToday;

  const handleOpen = (e: React.FormEvent) => {
    e.preventDefault();
    const val = initialCashInput === '' ? 0 : initialCashInput;
    if (val <= 0) return;
    onOpenShift(val, openNotes);
  };

  const handleClose = (e: React.FormEvent) => {
    e.preventDefault();
    const val = actualCashInput === '' ? 0 : actualCashInput;
    onCloseShift(val, closeNotes);
  };

  const handleSaveEditCash = (e: React.FormEvent) => {
    e.preventDefault();
    const val = editCashInput === '' ? 0 : editCashInput;
    if (val >= 0 && onUpdateInitialCash) {
      onUpdateInitialCash(val);
      setIsEditingCash(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Shift Status */}
      <Card className="p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-800 dark:text-emerald-400" />
              <CardTitle className="text-base font-extrabold text-slate-900 dark:text-zinc-100">KONTROL SHIFT KASIR & REKONSILIASI LACI</CardTitle>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 font-medium">
              Perhitungan modal awal, kas keluar belanja timbangan, dan kas masuk penjualan tunai di {warehouseName}.
            </p>
          </div>

          <div>
            <Badge variant={activeShift ? 'emerald' : 'slate'} className="px-3 py-1 text-xs font-black">
              <span
                className={`h-2 w-2 rounded-full mr-1.5 ${
                  activeShift ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              {activeShift ? 'SHIFT AKTIF BERJALAN' : 'SHIFT TERTUTUP'}
            </Badge>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Kolom Kiri: Form Buka/Tutup */}
        <div className="space-y-6 lg:col-span-7">
          {!activeShift ? (
            /* Buka Shift */
            <Card as="form" onSubmit={handleOpen} className="p-5 space-y-4">
              <CardHeader className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 flex items-center justify-center">
                  <ArrowDownRight className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">Buka Shift Kasir Pagi</CardTitle>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Siapkan modal kas fisik laci untuk penimbangan hari ini</p>
                </div>
              </CardHeader>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Modal Awal Kas Fisik di Laci (Rp)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="50000"
                  value={initialCashInput}
                  placeholder="0"
                  onChange={(e) => {
                    const val = e.target.value;
                    setInitialCashInput(val === '' ? '' : parseFloat(val) || 0);
                  }}
                  className="text-lg font-numeric font-black text-emerald-800 dark:text-emerald-400"
                  required
                />
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {[10000000, 20000000, 30000000, 50000000].map((amt) => (
                    <Button
                      key={amt}
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setInitialCashInput(amt)}
                      className="font-numeric text-xs font-bold"
                    >
                      Rp{(amt / 1000000)} Jt
                    </Button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                  Uang tunai fisik yang diserahkan dari brankas ke laci meja timbangan pagi ini.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Catatan Shift</label>
                <Input
                  type="text"
                  value={openNotes}
                  onChange={(e) => setOpenNotes(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
              >
                Konfirmasi Buka Shift Kasir
              </Button>
            </Card>
          ) : (
            /* Tutup Shift */
            <Card as="form" onSubmit={handleClose} className="p-5 space-y-4">
              <CardHeader className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">Tutup Shift Kasir Sore / Malam & Hitung Laci</CardTitle>
                </div>
                {onUpdateInitialCash && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditCashInput(activeShift.initialCash);
                      setIsEditingCash(!isEditingCash);
                    }}
                    className="font-bold text-emerald-800 dark:text-emerald-400"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    {isEditingCash ? 'Batal Edit Kas' : 'Ubah Kas Pagi (Dinamis)'}
                  </Button>
                )}
              </CardHeader>

              {/* Form Ubah Kas Awal Pagi Dinamis */}
              {isEditingCash && (
                <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 p-3.5 space-y-2 animate-in fade-in">
                  <label className="block text-xs font-bold text-slate-800 dark:text-zinc-200">
                    Sesuaikan Kas Awal / Tambah Suntikan Modal Hari Ini (Rp):
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="0"
                      step="50000"
                      value={editCashInput}
                      placeholder="0"
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditCashInput(val === '' ? '' : parseFloat(val) || 0);
                      }}
                      className="flex-1 text-xs font-numeric font-black"
                    />
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleSaveEditCash}
                    >
                      Simpan Kas
                    </Button>
                  </div>
                </div>
              )}

              {/* Rincian Arus Kas Laci */}
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-[#EDF2E8]/40 dark:bg-[#0f172a]/40 p-3.5 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                  <span className="font-semibold">Modal Awal Kas Pagi:</span>
                  <span className="font-numeric font-bold text-slate-900 dark:text-zinc-100">
                    Rp{activeShift.initialCash.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                  <span className="font-semibold">Kas Masuk (Penjualan Tunai Laci):</span>
                  <span className="font-numeric font-bold text-emerald-700 dark:text-emerald-400">
                    + Rp{totalCashInSalesToday.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                  <span className="font-semibold">Kas Keluar (Belanja Timbangan):</span>
                  <span className="font-numeric font-bold text-red-600 dark:text-rose-400">
                    - Rp{totalExpenseToday.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200/80 dark:border-slate-800 pt-2 font-bold text-slate-900 dark:text-zinc-100">
                  <span>Estimasi Uang Fisik di Laci Seharusnya:</span>
                  <span className="font-numeric text-base text-amber-700 dark:text-amber-400 font-black">
                    Rp{expectedClosingCash.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Uang Fisik Aktual Hasil Hitungan di Laci (Rp)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="1000"
                  value={actualCashInput}
                  placeholder="0"
                  onChange={(e) => {
                    const val = e.target.value;
                    setActualCashInput(val === '' ? '' : parseFloat(val) || 0);
                  }}
                  className="text-base font-numeric font-black"
                  required
                />
              </div>

              {actualCashInput !== '' && (
                <div
                  className={`rounded-xl p-3 text-xs font-bold border ${
                    cashDifference === 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-850'
                      : cashDifference < 0
                      ? 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-300 dark:border-red-850'
                      : 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-850'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold">
                      {cashDifference === 0 ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Kas Cocok Sempurna (Tidak Ada Selisih)</span>
                        </>
                      ) : cashDifference < 0 ? (
                        <>
                          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                          <span>SELISIH MINUS (KAS TEKOR)</span>
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span>SELISIH LEBIH (SURPLUS)</span>
                        </>
                      )}
                    </span>
                    <Badge variant={cashDifference === 0 ? 'emerald' : cashDifference < 0 ? 'rose' : 'blue'} className="font-numeric font-black text-xs px-2.5 py-1">
                      Rp{Math.abs(cashDifference).toLocaleString('id-ID')}
                    </Badge>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Catatan Tutup Shift</label>
                <Input
                  type="text"
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                variant="amber"
                size="lg"
                className="w-full"
              >
                Kunci & Tutup Shift Kasir
              </Button>
            </Card>
          )}
        </div>

        {/* Kolom Kanan: Laporan Keuntungan Sore/Malam & Rincian Shift */}
        <div className="space-y-4 lg:col-span-5">
          {/* Card Laporan Keuntungan Hari Ini (Pagi vs Sore/Malam) */}
          <Card className="p-5 space-y-3">
            <CardHeader className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-800 dark:text-emerald-400" />
                <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                  Laporan Keuntungan Hari Ini (Sore / Malam)
                </CardTitle>
              </div>
              <Badge variant={dailyProfit >= 0 ? 'emerald' : 'rose'}>
                {dailyProfit >= 0 ? 'UNTUNG / SURPLUS' : 'DEFISIT BERJALAN'}
              </Badge>
            </CardHeader>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                <span>Total Penjualan Stok (Omzet):</span>
                <span className="font-numeric font-bold text-emerald-700 dark:text-emerald-400">
                  +Rp{totalCashInSalesToday.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                <span>Total Belanja Timbangan (Modal Keluar):</span>
                <span className="font-numeric font-bold text-red-600 dark:text-red-400">
                  -Rp{totalExpenseToday.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                <span>Biaya Operasional (Kas Kecil / OPEX):</span>
                <span className="font-numeric font-bold text-amber-700 dark:text-amber-400">
                  -Rp{totalOpexToday.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-[#EDF2E8]/40 dark:bg-[#0f172a]/40 p-3 pt-2 mt-2">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                  Estimasi Laba Bersih Hari Ini:
                </div>
                <div
                  className={`font-numeric text-2xl font-black mt-0.5 ${
                    dailyProfit >= 0 ? 'text-emerald-800 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {dailyProfit >= 0 ? '+' : ''}Rp{dailyProfit.toLocaleString('id-ID')}
                </div>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 font-medium">
                  *Perhitungan harian riil (Penjualan masuk dikurangi belanja timbangan & biaya operasional).
                </p>
              </div>
            </div>
          </Card>

          {/* Informasi Shift Kasir */}
          <Card className="p-5">
            <CardHeader className="mb-3">
              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                Status Kas Meja Kasir
              </CardTitle>
            </CardHeader>
            {activeShift ? (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-slate-500 dark:text-zinc-400 font-semibold">Kasir Bertugas:</span>
                  <Badge variant="slate" className="font-bold text-slate-900 dark:text-zinc-100">{activeShift.cashierId}</Badge>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-slate-500 dark:text-zinc-400 font-semibold">Jam Buka:</span>
                  <span className="text-slate-900 dark:text-zinc-100 font-numeric font-bold">
                    {new Date(activeShift.openedAt).toLocaleTimeString('id-ID')} WIB
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-slate-500 dark:text-zinc-400 font-semibold">Modal Kas Pagi:</span>
                  <span className="font-numeric font-bold text-slate-900 dark:text-zinc-100">
                    Rp{activeShift.initialCash.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between pt-1 font-bold">
                  <span className="text-slate-700 dark:text-zinc-300">Sisa Kas Fisik di Meja Kasir:</span>
                  <span className="font-numeric font-black text-amber-700 dark:text-amber-400 text-sm">
                    Rp{expectedClosingCash.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 dark:text-zinc-500 font-medium">
                Shift belum dibuka. Masukkan modal awal kasir untuk memulai penimbangan hari ini.
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
