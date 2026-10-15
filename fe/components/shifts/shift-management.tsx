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
      <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-800" />
            <h2 className="text-base font-extrabold text-slate-900">KONTROL SHIFT KASIR & REKONSILIASI LACI</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            Perhitungan modal awal, kas keluar belanja timbangan, dan kas masuk penjualan tunai di {warehouseName}.
          </p>
        </div>

        <div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ${
              activeShift
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-slate-100 text-slate-600 border border-slate-300'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                activeShift ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            {activeShift ? 'SHIFT AKTIF BERJALAN' : 'SHIFT TERTUTUP'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Kolom Kiri: Form Buka/Tutup */}
        <div className="space-y-6 lg:col-span-7">
          {!activeShift ? (
            /* Buka Shift */
            <form onSubmit={handleOpen} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <ArrowDownRight className="h-5 w-5 text-emerald-800" />
                <h3 className="text-sm font-extrabold text-slate-900">Buka Shift Kasir Pagi</h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Modal Awal Kas Fisik di Laci (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50000"
                  value={initialCashInput}
                  placeholder="0"
                  onChange={(e) => {
                    const val = e.target.value;
                    setInitialCashInput(val === '' ? '' : parseFloat(val) || 0);
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base font-numeric font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                />
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {[10000000, 20000000, 30000000, 50000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setInitialCashInput(amt)}
                      className="rounded bg-slate-100 border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200 font-numeric cursor-pointer"
                    >
                      Rp{amt.toLocaleString('id-ID')}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-[11px] text-slate-500 font-medium">
                  Uang tunai fisik yang diserahkan dari brankas ke laci meja timbangan pagi ini.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Shift</label>
                <input
                  type="text"
                  value={openNotes}
                  onChange={(e) => setOpenNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-800 py-3 text-xs font-extrabold text-white shadow-md shadow-emerald-950/20 hover:bg-emerald-900 transition-all cursor-pointer"
              >
                Konfirmasi Buka Shift Kasir
              </button>
            </form>
          ) : (
            /* Tutup Shift */
            <form onSubmit={handleClose} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="h-5 w-5 text-amber-600" />
                  <h3 className="text-sm font-extrabold text-slate-900">Tutup Shift Kasir Sore / Malam & Hitung Laci</h3>
                </div>
                {onUpdateInitialCash && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditCashInput(activeShift.initialCash);
                      setIsEditingCash(!isEditingCash);
                    }}
                    className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:underline cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    {isEditingCash ? 'Batal Edit Kas' : 'Ubah Kas Pagi (Dinamis)'}
                  </button>
                )}
              </div>

              {/* Form Ubah Kas Awal Pagi Dinamis */}
              {isEditingCash && (
                <div className="rounded-xl border border-emerald-300 bg-emerald-50/70 p-3.5 space-y-2 animate-in fade-in">
                  <label className="block text-xs font-bold text-slate-800">
                    Sesuaikan Kas Awal / Tambah Suntikan Modal Hari Ini (Rp):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="50000"
                      value={editCashInput}
                      placeholder="0"
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditCashInput(val === '' ? '' : parseFloat(val) || 0);
                      }}
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-numeric font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                    <button
                      type="button"
                      onClick={handleSaveEditCash}
                      className="rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-900 cursor-pointer"
                    >
                      Simpan Kas
                    </button>
                  </div>
                </div>
              )}

              {/* Rincian Arus Kas Laci */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span className="font-semibold">Modal Awal Kas Pagi:</span>
                  <span className="font-numeric font-bold text-slate-900">
                    Rp{activeShift.initialCash.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="font-semibold">Kas Masuk (Penjualan Tunai Laci):</span>
                  <span className="font-numeric font-bold text-emerald-700">
                    + Rp{totalCashInSalesToday.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="font-semibold">Kas Keluar (Belanja Timbangan):</span>
                  <span className="font-numeric font-bold text-red-600">
                    - Rp{totalExpenseToday.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
                  <span>Estimasi Uang Fisik di Laci Seharusnya:</span>
                  <span className="font-numeric text-base text-amber-700 font-black">
                    Rp{expectedClosingCash.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Uang Fisik Aktual Hasil Hitungan di Laci (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={actualCashInput}
                  placeholder="0"
                  onChange={(e) => {
                    const val = e.target.value;
                    setActualCashInput(val === '' ? '' : parseFloat(val) || 0);
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base font-numeric font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                />
              </div>

              {actualCashInput !== '' && (
                <div
                  className={`rounded-xl p-3 text-xs font-bold border ${
                    cashDifference === 0
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : cashDifference < 0
                      ? 'bg-red-50 text-red-800 border-red-300'
                      : 'bg-blue-50 text-blue-800 border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold">
                      {cashDifference === 0 ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                          <span>Kas Cocok Sempurna (Tidak Ada Selisih)</span>
                        </>
                      ) : cashDifference < 0 ? (
                        <>
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <span>SELISIH MINUS (KAS TEKOR)</span>
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="h-4 w-4 text-blue-600" />
                          <span>SELISIH LEBIH (SURPLUS)</span>
                        </>
                      )}
                    </span>
                    <span className="font-numeric font-black">
                      Rp{Math.abs(cashDifference).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Tutup Shift</label>
                <input
                  type="text"
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-slate-900 py-3 text-xs font-extrabold text-amber-300 shadow-md shadow-slate-900/30 hover:bg-slate-800 transition-all cursor-pointer"
              >
                Kunci & Tutup Shift Kasir
              </button>
            </form>
          )}
        </div>

        {/* Kolom Kanan: Laporan Keuntungan Sore/Malam & Rincian Shift */}
        <div className="space-y-4 lg:col-span-5">
          {/* Card Laporan Keuntungan Hari Ini (Pagi vs Sore/Malam) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-800" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Laporan Keuntungan Hari Ini (Sore / Malam)
                </h3>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  dailyProfit >= 0
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}
              >
                {dailyProfit >= 0 ? 'UNTUNG / SURPLUS' : 'DEFISIT BERJALAN'}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Penjualan Stok (Omzet):</span>
                <span className="font-numeric font-bold text-emerald-700">
                  +Rp{totalCashInSalesToday.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Belanja Timbangan (Modal Keluar):</span>
                <span className="font-numeric font-bold text-red-600">
                  -Rp{totalExpenseToday.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Biaya Operasional (Kas Kecil / OPEX):</span>
                <span className="font-numeric font-bold text-amber-700">
                  -Rp{totalOpexToday.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 pt-2 mt-2">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Estimasi Laba Bersih Hari Ini:
                </div>
                <div
                  className={`font-numeric text-2xl font-black mt-0.5 ${
                    dailyProfit >= 0 ? 'text-emerald-800' : 'text-red-600'
                  }`}
                >
                  {dailyProfit >= 0 ? '+' : ''}Rp{dailyProfit.toLocaleString('id-ID')}
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">
                  *Perhitungan harian riil (Penjualan masuk dikurangi belanja timbangan & biaya operasional).
                </p>
              </div>
            </div>
          </div>

          {/* Informasi Shift Kasir */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-3">
              Status Kas Meja Kasir
            </h3>
            {activeShift ? (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-semibold">Kasir Bertugas:</span>
                  <span className="text-slate-900 font-bold">{activeShift.cashierId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-semibold">Jam Buka:</span>
                  <span className="text-slate-900 font-numeric font-bold">
                    {new Date(activeShift.openedAt).toLocaleTimeString('id-ID')} WIB
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-semibold">Modal Kas Pagi:</span>
                  <span className="font-numeric font-bold text-slate-900">
                    Rp{activeShift.initialCash.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between pt-1 font-bold">
                  <span className="text-slate-700">Sisa Kas Fisik di Meja Kasir:</span>
                  <span className="font-numeric font-black text-amber-700">
                    Rp{expectedClosingCash.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 font-medium">
                Shift belum dibuka. Masukkan modal awal kasir untuk memulai penimbangan hari ini.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
