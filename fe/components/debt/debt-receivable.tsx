'use client';

import React, { useState } from 'react';
import { Landmark, ArrowUpRight, ArrowDownLeft, Plus, CheckCircle } from 'lucide-react';
import { DebtRecord, DebtType } from '../../types';
import { Card, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ChoiceGroup } from '../ui/choice-group';

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
      <Card className="flex flex-col gap-2 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-emerald-800 dark:text-emerald-400" />
            <CardTitle className="text-base font-extrabold text-slate-900 dark:text-zinc-100">MANAJEMEN HUTANG & PIUTANG (AP / AR)</CardTitle>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 font-medium">
            Pemantauan tagihan tempo penjualan pabrik (Piutang) dan titip timbang pengepul (Hutang).
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-[#EDF2E8]/60 dark:bg-[#0f172a] p-3 text-right">
          <div className="text-xs font-bold text-slate-600 dark:text-zinc-400">
            Total Sisa Tagihan {activeTab === 'PIUTANG_PABRIK' ? 'Piutang Pabrik' : 'Hutang Pengepul'}:
          </div>
          <div className="font-numeric text-xl font-black text-amber-700 dark:text-amber-400">
            Rp{totalOutstanding.toLocaleString('id-ID')}
          </div>
        </div>
      </Card>

      {/* Tabs Switcher: Piutang vs Hutang */}
      <ChoiceGroup
        value={activeTab}
        onChange={(val) => setActiveTab(val as DebtType)}
        options={[
          {
            value: 'PIUTANG_PABRIK',
            label: 'Piutang Tagihan ke Pabrik (Tempo Kirim)',
            icon: <ArrowUpRight className="h-4 w-4" />,
          },
          {
            value: 'HUTANG_SUPPLIER',
            label: 'Hutang Supplier (Titip Timbang)',
            icon: <ArrowDownLeft className="h-4 w-4" />,
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Form Input Tagihan */}
        <div className="lg:col-span-5">
          <Card as="form" onSubmit={handleSubmit} className="p-5 space-y-4">
            <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-zinc-200 border-b border-slate-100 dark:border-slate-800 pb-2">
              Input {activeTab === 'PIUTANG_PABRIK' ? 'Piutang Pabrik' : 'Hutang Titip Timbang'}
            </CardTitle>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                {activeTab === 'PIUTANG_PABRIK' ? 'Nama Pabrik Peleburan' : 'Nama Pengepul / Supplier'}
              </label>
              <Input
                type="text"
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                placeholder="Nama pihak..."
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Nomor Referensi Nota / Faktur</label>
              <Input
                type="text"
                value={referenceInvoice}
                onChange={(e) => setReferenceInvoice(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Total Nilai Tagihan (Rp)</label>
              <Input
                type="number"
                min="100000"
                step="500000"
                value={totalAmount}
                onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
                className="font-numeric text-amber-700 dark:text-amber-400 font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Tanggal Jatuh Tempo</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Catatan</label>
              <Input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
            >
              Simpan Data Tagihan
            </Button>
          </Card>
        </div>

        {/* Tabel Tagihan */}
        <div className="lg:col-span-7">
          <Card className="p-5">
            <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-3">
              Daftar Tagihan {activeTab === 'PIUTANG_PABRIK' ? 'Piutang Pabrik' : 'Hutang Pengepul'}
            </CardTitle>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {filteredDebts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500 font-medium">
                  Tidak ada catatan tagihan aktif pada kategori ini.
                </div>
              ) : (
                filteredDebts.map((item) => {
                  const isOverdue = item.remainingAmount > 0 && new Date(item.dueDate) < new Date();
                  const badgeVariant = item.status === 'PAID' ? 'emerald' : isOverdue ? 'rose' : 'amber';
                  const badgeLabel = item.status === 'PAID' ? 'Lunas' : isOverdue ? 'Jatuh Tempo' : 'Belum Lunas';

                  return (
                    <Card
                      key={item.id}
                      className="p-3.5 text-xs space-y-2 bg-[#EDF2E8]/40 dark:bg-[#0f172a]/40"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-zinc-100">{item.entityName}</span>
                        <Badge variant={badgeVariant}>
                          {badgeLabel}
                        </Badge>
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                        Ref: <span className="font-mono text-slate-800 dark:text-zinc-200 font-bold">{item.referenceInvoice}</span> • Jatuh Tempo: {item.dueDate}
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[11px] border-t border-slate-200/60 dark:border-slate-800 pt-2 font-numeric">
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
                        <div className="mt-2 border-t border-slate-200/60 dark:border-slate-800 pt-2 flex items-center gap-2">
                          {payingId === item.id ? (
                            <div className="flex items-center gap-2 w-full">
                              <Input
                                type="number"
                                min="1000"
                                max={item.remainingAmount}
                                value={payAmount}
                                onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                                className="font-numeric font-bold"
                              />
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handlePayConfirm(item.id)}
                              >
                                Bayar
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setPayingId(null)}
                              >
                                Batal
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setPayingId(item.id);
                                setPayAmount(item.remainingAmount);
                              }}
                              className="text-emerald-800 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-emerald-300 font-bold"
                            >
                              + Input Pembayaran / Cicilan
                            </Button>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
