'use client';

import React, { useState } from 'react';
import { Fuel, Plus, Trash2, Tag, Calendar } from 'lucide-react';
import { OpexCategory, OpexExpense } from '../../types';

interface OpexManagementProps {
  warehouseId: number;
  warehouseName: string;
  opexList: OpexExpense[];
  onAddOpex: (expense: OpexExpense) => void;
}

export function OpexManagement({ warehouseId, warehouseName, opexList, onAddOpex }: OpexManagementProps) {
  const [category, setCategory] = useState<OpexCategory>('BENSIN_TRUK');
  const [isCustomCategory, setIsCustomCategory] = useState<boolean>(false);
  const [customCategoryName, setCustomCategoryName] = useState<string>('');
  const [amount, setAmount] = useState<number | ''>(150000);
  const [description, setDescription] = useState<string>('Solar truk operasional');

  const filteredOpex = opexList.filter((o) => o.warehouseId === warehouseId);
  const totalOpexWarehouse = filteredOpex.reduce((acc, curr) => acc + curr.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = amount === '' ? 0 : amount;
    if (finalAmount <= 0) return;

    const newExpense: OpexExpense = {
      id: `opex-${Date.now()}`,
      warehouseId,
      category,
      customCategory: isCustomCategory ? customCategoryName : undefined,
      amount: finalAmount,
      description,
      recordedBy: 'Admin Gudang',
      createdAt: new Date().toISOString(),
    };

    onAddOpex(newExpense);
    setDescription('');
    if (isCustomCategory) {
      setIsCustomCategory(false);
      setCustomCategoryName('');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Fuel className="h-5 w-5 text-emerald-800" />
            <h2 className="text-base font-extrabold text-slate-900">BIAYA OPERASIONAL GUDANG (OPEX)</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            Pencatatan kas kecil (petty cash) harian terpisah dari laci meja kasir timbangan di {warehouseName}.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-right">
          <div className="text-xs font-bold text-slate-600">Total OPEX {warehouseName}:</div>
          <div className="font-numeric text-xl font-black text-amber-700">
            Rp{totalOpexWarehouse.toLocaleString('id-ID')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Form Input OPEX */}
        <div className="lg:col-span-5">
          <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">
              Input Pengeluaran Kas Kecil
            </h3>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Kategori Pengeluaran</label>
                <button
                  type="button"
                  onClick={() => setIsCustomCategory(!isCustomCategory)}
                  className="text-[11px] font-bold text-emerald-800 hover:underline"
                >
                  {isCustomCategory ? 'Pilih Dropdown' : '+ Ketik Kategori Bebas'}
                </button>
              </div>

              {isCustomCategory ? (
                <input
                  type="text"
                  value={customCategoryName}
                  onChange={(e) => setCustomCategoryName(e.target.value)}
                  placeholder="Ketik kategori bebas (misal: Tambal Ban Fuso)..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  autoFocus
                />
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as OpexCategory)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 cursor-pointer"
                >
                  <option value="BENSIN_TRUK">Bensin / Solar Truk</option>
                  <option value="KARUNG_PLASTIK">Beli Karung & Plastik</option>
                  <option value="KAWAT_IKAT">Kawat Ikat & Tali</option>
                  <option value="SERVIS_TIMBANGAN">Servis / Kalibrasi Timbangan</option>
                  <option value="KONSUMSI_KULI">Konsumsi Kuli & Lembur</option>
                  <option value="LAINNYA">Lainnya</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nominal (Rp)</label>
              <input
                type="number"
                min="0"
                step="5000"
                value={amount}
                placeholder="0"
                onChange={(e) => {
                  const val = e.target.value;
                  setAmount(val === '' ? '' : parseFloat(val) || 0);
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-numeric font-black text-amber-700 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                required
              />
              <div className="mt-1.5 flex flex-wrap gap-1">
                {[50000, 100000, 200000, 500000].map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => setAmount(quick)}
                    className="rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700 hover:bg-slate-200 font-numeric cursor-pointer"
                  >
                    +Rp{quick.toLocaleString('id-ID')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan / Rincian</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contoh: 15 liter solar truk colt diesel"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-800 py-3 text-xs font-extrabold text-white shadow-md shadow-emerald-950/20 hover:bg-emerald-900 transition-all"
            >
              Simpan Biaya Kas Kecil (OPEX)
            </button>
          </form>
        </div>

        {/* Tabel Riwayat OPEX */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-3">
              Riwayat Pengeluaran Kas Kecil Hari Ini
            </h3>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {filteredOpex.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-medium">
                  Belum ada pengeluaran kas kecil di gudang ini.
                </div>
              ) : (
                filteredOpex.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-800 border border-slate-300">
                          {item.customCategory || item.category.replace('_', ' ')}
                        </span>
                        <span className="font-bold text-slate-900">{item.description}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500">
                        {new Date(item.createdAt).toLocaleTimeString('id-ID')} WIB • {item.recordedBy}
                      </div>
                    </div>
                    <div className="font-numeric font-black text-amber-700 text-sm">
                      Rp{item.amount.toLocaleString('id-ID')}
                    </div>
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
