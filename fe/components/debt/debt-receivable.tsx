'use client';

import React, { useState } from 'react';
import { Landmark, ArrowUpRight, ArrowDownLeft, Plus, CheckCircle } from 'lucide-react';
import { DebtRecord, DebtType } from '../../types';

interface DebtReceivableProps {
  debts: DebtRecord[];
  onAddDebt: (debt: DebtRecord) => void;
  onPayDebt: (id: string, payAmount: number) => void;
}

export function DebtReceivableManagement({ debts, onAddDebt, onPayDebt }: DebtReceivableProps) {
  const [activeTab, setActiveTab] = useState<DebtType>('PIUTANG_PABRIK');

  const [entityName, setEntityName] = useState<string>('Pabrik Peleburan 1');
  const [referenceInvoice, setReferenceInvoice] = useState<string>('INV-PABRIK-002');
  const [totalAmount, setTotalAmount] = useState<number>(50000000);
  const [dueDate, setDueDate] = useState<string>('2026-10-15');
  const [notes, setNotes] = useState<string>('Tempo pembayaran pabrik 14 hari');

  const [payingId, setPayingId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState<number>(10000000);

  const filteredDebts = debts.filter((d) => d.type === activeTab);
  const totalOutstanding = filteredDebts.reduce((acc, curr) => acc + curr.remainingAmount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalAmount <= 0) return;

    const newRecord: DebtRecord = {
      id: `debt-${Date.now()}`,
      type: activeTab,
      entityName,
      referenceInvoice,
      warehouseId: 1,
      totalAmount,
      paidAmount: 0,
      remainingAmount: totalAmount,
      dueDate,
      status: 'UNPAID',
      notes,
      createdAt: new Date().toISOString(),
    };

    onAddDebt(newRecord);
    setReferenceInvoice('');
  };

  const handlePayConfirm = (id: string) => {
    if (payAmount <= 0) return;
    onPayDebt(id, payAmount);
    setPayingId(null);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-emerald-800 dark:text-emerald-400" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-zinc-100">MANAJEMEN HUTANG & PIUTANG (AP / AR)</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 font-medium">
            Pemantauan tagihan tempo penjualan pabrik (Piutang) dan titip timbang pengepul (Hutang).
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-3 text-right">
          <div className="text-xs font-bold text-slate-600 dark:text-zinc-400">
            Total Sisa Tagihan {activeTab === 'PIUTANG_PABRIK' ? 'Piutang Pabrik' : 'Hutang Pengepul'}:
          </div>
          <div className="font-numeric text-xl font-black text-amber-700 dark:text-amber-400">
            Rp{totalOutstanding.toLocaleString('id-ID')}
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Piutang vs Hutang */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('PIUTANG_PABRIK')}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'PIUTANG_PABRIK'
              ? 'bg-emerald-800 dark:bg-emerald-700 text-white shadow-xs'
              : 'bg-white dark:bg-black text-slate-600 dark:text-zinc-400 border border-slate-300 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900'
          }`}
        >
          <ArrowUpRight className="h-4 w-4" />
          Piutang Tagihan ke Pabrik (Tempo Kirim)
        </button>
        <button
          onClick={() => setActiveTab('HUTANG_SUPPLIER')}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'HUTANG_SUPPLIER'
              ? 'bg-slate-900 dark:bg-zinc-800 text-amber-300 dark:text-amber-400 shadow-xs'
              : 'bg-white dark:bg-black text-slate-600 dark:text-zinc-400 border border-slate-300 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900'
          }`}
        >
          <ArrowDownLeft className="h-4 w-4" />
          Hutang Supplier (Titip Timbang Belum Ambil Uang)
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Form Input Tagihan */}
        <div className="lg:col-span-5">
          <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-zinc-200 border-b border-slate-100 dark:border-zinc-900 pb-2">
              Input {activeTab === 'PIUTANG_PABRIK' ? 'Piutang Pabrik' : 'Hutang Titip Timbang'}
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                {activeTab === 'PIUTANG_PABRIK' ? 'Nama Pabrik Peleburan' : 'Nama Pengepul / Supplier'}
              </label>
              <input
                type="text"
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                placeholder="Nama pihak..."
                className="w-full rounded-lg border border-slate-300 dark:border-zinc-800 bg-white dark:bg-black px-3 py-2 text-xs font-bold text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Nomor Referensi Nota / Faktur</label>
              <input
                type="text"
                value={referenceInvoice}
                onChange={(e) => setReferenceInvoice(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-zinc-800 bg-white dark:bg-black px-3 py-2 text-xs font-bold text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Total Nilai Tagihan (Rp)</label>
              <input
                type="number"
                min="100000"
                step="500000"
                value={totalAmount}
                onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-300 dark:border-zinc-800 bg-white dark:bg-black px-3 py-2 text-sm font-numeric font-black text-amber-700 dark:text-amber-400 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Tanggal Jatuh Tempo</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-zinc-800 bg-white dark:bg-black px-3 py-2 text-xs font-bold text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Catatan</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-zinc-800 bg-white dark:bg-black px-3 py-2 text-xs font-bold text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-800 dark:bg-emerald-700 py-3 text-xs font-extrabold text-white shadow-md shadow-emerald-950/20 hover:bg-emerald-900 dark:hover:bg-emerald-600 transition-all cursor-pointer"
            >
              Simpan Data Tagihan
            </button>
          </form>
        </div>

        {/* Tabel Tagihan */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black p-5 shadow-sm">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-3">
              Daftar Tagihan {activeTab === 'PIUTANG_PABRIK' ? 'Piutang Pabrik' : 'Hutang Pengepul'}
            </h3>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {filteredDebts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500 font-medium">
                  Tidak ada catatan tagihan aktif pada kategori ini.
                </div>
              ) : (
                filteredDebts.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-950 p-3.5 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-zinc-100">{item.entityName}</span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          item.status === 'PAID'
                            ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Ref: <span className="font-mono text-slate-800 dark:text-zinc-200 font-bold">{item.referenceInvoice}</span> • Jatuh Tempo: {item.dueDate}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[11px] border-t border-slate-200 dark:border-zinc-800 pt-2 font-numeric">
                      <div>
                        Total Tagihan: <br />
                        <span className="font-bold text-slate-900 dark:text-zinc-100">
                          Rp{item.totalAmount.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div>
                        Sudah Dibayar: <br />
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                          Rp{item.paidAmount.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div>
                        Sisa Tagihan: <br />
                        <span className="font-black text-red-600 dark:text-red-400">
                          Rp{item.remainingAmount.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    {item.remainingAmount > 0 && (
                      <div className="mt-2 border-t border-slate-200 dark:border-zinc-800 pt-2 flex items-center gap-2">
                        {payingId === item.id ? (
                          <div className="flex items-center gap-2 w-full">
                            <input
                              type="number"
                              min="1000"
                              max={item.remainingAmount}
                              value={payAmount}
                              onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                              className="rounded-lg bg-white dark:bg-black px-2 py-1 text-xs text-amber-700 dark:text-amber-400 border border-slate-300 dark:border-zinc-800 flex-1 font-numeric font-bold"
                            />
                            <button
                              onClick={() => handlePayConfirm(item.id)}
                              className="rounded-lg bg-emerald-800 dark:bg-emerald-700 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-900 dark:hover:bg-emerald-600 cursor-pointer"
                            >
                              Bayar
                            </button>
                            <button
                              onClick={() => setPayingId(null)}
                              className="rounded-lg bg-slate-200 dark:bg-zinc-800 px-2 py-1 text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-300 dark:hover:bg-zinc-700 cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setPayingId(item.id);
                              setPayAmount(item.remainingAmount);
                            }}
                            className="text-xs text-emerald-800 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-emerald-300 font-bold cursor-pointer"
                          >
                            + Input Pembayaran / Cicilan
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
