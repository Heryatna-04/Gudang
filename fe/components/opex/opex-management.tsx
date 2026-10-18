'use client';

import React, { useState } from 'react';
import { Fuel, Plus, Trash2, Tag, Calendar } from 'lucide-react';
import { OpexCategory, OpexExpense } from '../../types';
import { Card, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { ChoiceGroup } from '../ui/choice-group';

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
      <Card className="flex flex-col gap-2 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Fuel className="h-5 w-5 text-emerald-800 dark:text-emerald-400" />
            <CardTitle className="text-base font-extrabold text-slate-900 dark:text-zinc-100">BIAYA OPERASIONAL GUDANG (OPEX)</CardTitle>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 font-medium">
            Pencatatan kas kecil (petty cash) harian terpisah dari laci meja kasir timbangan di {warehouseName}.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-[#EDF2E8]/60 dark:bg-[#0f172a] p-3 text-right">
          <div className="text-xs font-bold text-slate-600 dark:text-zinc-400">Total OPEX {warehouseName}:</div>
          <div className="font-numeric text-xl font-black text-amber-700 dark:text-amber-400">
            Rp{totalOpexWarehouse.toLocaleString('id-ID')}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Form Input OPEX */}
        <div className="lg:col-span-5">
          <Card as="form" onSubmit={handleSubmit} className="p-5 space-y-4">
            <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-zinc-200 border-b border-slate-100 dark:border-slate-800 pb-2">
              Input Pengeluaran Kas Kecil
            </CardTitle>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Kategori Pengeluaran</label>
                <button
                  type="button"
                  onClick={() => setIsCustomCategory(!isCustomCategory)}
                  className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  {isCustomCategory ? 'Pilih Kategori Cepat' : '+ Ketik Kategori Bebas'}
                </button>
              </div>

              {isCustomCategory ? (
                <Input
                  type="text"
                  value={customCategoryName}
                  onChange={(e) => setCustomCategoryName(e.target.value)}
                  placeholder="Ketik kategori bebas (misal: Tambal Ban Fuso)..."
                  autoFocus
                />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { value: 'BENSIN_TRUK', label: 'Bensin/Solar', icon: '⛽' },
                    { value: 'KARUNG_PLASTIK', label: 'Karung/Plastik', icon: '📦' },
                    { value: 'KAWAT_IKAT', label: 'Kawat/Tali', icon: '🪢' },
                    { value: 'SERVIS_TIMBANGAN', label: 'Servis Timbangan', icon: '⚖️' },
                    { value: 'KONSUMSI_KULI', label: 'Konsumsi Kuli', icon: '🍚' },
                    { value: 'LAINNYA', label: 'Lainnya', icon: '📝' },
                  ].map((cat) => {
                    const isSelected = category === cat.value;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value as OpexCategory)}
                        className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-800 text-white border-emerald-900 shadow-sm'
                            : 'bg-[#EDF2E8]/60 dark:bg-[#0f172a] border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-700/40'
                        }`}
                      >
                        <div className="text-base mb-1">{cat.icon}</div>
                        <div className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                          {cat.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Nominal (Rp)</label>
              <Input
                type="number"
                min="0"
                step="5000"
                value={amount}
                placeholder="0"
                onChange={(e) => {
                  const val = e.target.value;
                  setAmount(val === '' ? '' : parseFloat(val) || 0);
                }}
                className="font-numeric text-amber-700 dark:text-amber-400 font-bold"
                required
              />
              <div className="mt-1.5 flex flex-wrap gap-1">
                {[50000, 100000, 200000, 500000].map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => setAmount(quick)}
                    className="rounded-xl bg-[#EDF2E8]/60 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-zinc-300 hover:bg-[#EDF2E8] dark:hover:bg-slate-700 font-numeric cursor-pointer transition-colors"
                  >
                    +Rp{quick.toLocaleString('id-ID')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Keterangan / Rincian</label>
              <Input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contoh: 15 liter solar truk colt diesel"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
            >
              Simpan Biaya Kas Kecil (OPEX)
            </Button>
          </Card>
        </div>

        {/* Tabel Riwayat OPEX */}
        <div className="lg:col-span-7">
          <Card className="p-5">
            <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-3">
              Riwayat Pengeluaran Kas Kecil Hari Ini
            </CardTitle>
            <div className="space-y-2">
              {filteredOpex.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500 font-medium">
                  Belum ada pengeluaran kas kecil di gudang ini.
                </div>
              ) : (
                filteredOpex.map((item) => (
                  <Card
                    key={item.id}
                    className="flex items-center justify-between p-3.5 text-xs bg-[#EDF2E8]/40 dark:bg-[#0f172a]/40"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="slate">
                          {item.customCategory || item.category.replace('_', ' ')}
                        </Badge>
                        <span className="font-bold text-slate-900 dark:text-zinc-100">{item.description}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400">
                        {new Date(item.createdAt).toLocaleTimeString('id-ID')} WIB • {item.recordedBy}
                      </div>
                    </div>
                    <div className="font-numeric font-black text-amber-700 dark:text-amber-400 text-sm">
                      Rp{item.amount.toLocaleString('id-ID')}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
