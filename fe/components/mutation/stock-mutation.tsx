'use client';

import React, { useState } from 'react';
import { Truck, Plus, ArrowRight, ShieldAlert } from 'lucide-react';
import { StockMutation, Product, Warehouse, MutationStatus, UserRole } from '../../types';
import { Card, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';

interface StockMutationProps {
  currentWarehouseId: number;
  warehouses: Warehouse[];
  products: Product[];
  mutations: StockMutation[];
  activeRole?: UserRole;
  onAddMutation: (mut: StockMutation) => void;
  onUpdateStatus: (id: string, status: MutationStatus) => void;
}

export function StockMutationManagement({
  currentWarehouseId,
  warehouses,
  products,
  mutations,
  activeRole = 'ADMIN',
  onAddMutation,
  onUpdateStatus,
}: StockMutationProps) {
  const isAdmin = activeRole === 'ADMIN';
  const otherWarehouses = warehouses.filter((w) => w.id !== currentWarehouseId);
  const [toWarehouseId, setToWarehouseId] = useState<number>(otherWarehouses[0]?.id || 2);
  const [productId, setProductId] = useState<string>(products[0]?.id || '');
  const [weightKg, setWeightKg] = useState<number | ''>(1000);
  const [driverName, setDriverName] = useState<string>('Suhendra');
  const [truckLicensePlate, setTruckLicensePlate] = useState<string>('B 9142 TDA');
  const [notes, setNotes] = useState<string>('Pemindahan scrap konsolidasi');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const actualWeight = typeof weightKg === 'number' ? weightKg : 0;
    if (actualWeight <= 0 || !productId) return;

    const prod = products.find((p) => p.id === productId);

    const newMutation: StockMutation = {
      id: `mut-${Date.now()}`,
      mutationNumber: `SJ/MUT/${new Date().toISOString().slice(0, 10).replace(/-/g, '')}/${Math.floor(
        100 + Math.random() * 900
      )}`,
      fromWarehouseId: currentWarehouseId,
      toWarehouseId,
      productId,
      productName: prod?.name || 'Komoditas Rongsok',
      weightKg: actualWeight,
      driverName,
      truckLicensePlate,
      status: 'ON_DELIVERY',
      notes,
      createdAt: new Date().toISOString(),
    };

    onAddMutation(newMutation);
  };

  return (
    <div className="space-y-6 font-sans">
      <Card className="flex flex-col gap-2 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-emerald-800 dark:text-emerald-400" />
            <CardTitle className="text-base font-extrabold text-slate-900 dark:text-zinc-100">MUTASI STOK ANTAR GUDANG</CardTitle>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 font-medium">
            {isAdmin
              ? 'Laporan dan riwayat mutasi stok rongsok masuk/keluar antar cabang gudang (Mode Admin: Pantau Laporan & Konfirmasi Terima).'
              : 'Surat jalan pengiriman tonase rongsok antar cabang gudang (mengurangi stok asal, menambah stok tujuan).'}
          </p>
        </div>
        {isAdmin && (
          <Badge variant="amber" className="px-3 py-1 text-xs">
            <ShieldAlert className="h-4 w-4 mr-1" />
            <span>Kirim Stok Khusus Hak Akses Owner</span>
          </Badge>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Form Surat Jalan - Khusus Owner jika ada lebih dari 1 gudang */}
        {!isAdmin && otherWarehouses.length > 0 && (
          <div className="lg:col-span-5">
            <Card as="form" onSubmit={handleSubmit} className="p-5 space-y-4">
              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-zinc-200 border-b border-slate-100 dark:border-slate-800 pb-2">
                Terbitkan Surat Jalan Mutasi Baru
              </CardTitle>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Gudang Tujuan Pengiriman</label>
                <Select
                  value={toWarehouseId}
                  onChange={(e) => setToWarehouseId(Number(e.target.value))}
                  options={otherWarehouses.map((w) => ({ value: w.id, label: w.name }))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Komoditas yang Dikirim</label>
                <Select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  options={products.map((p) => ({ value: p.id, label: `${p.name} (Stok: ${p.currentStockKg} kg)` }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Berat Kirim (Kg)</label>
                  <Input
                    type="number"
                    min="1"
                    step="50"
                    placeholder="0"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                    className="font-numeric"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">No. Plat Truk</label>
                  <Input
                    type="text"
                    value={truckLicensePlate}
                    onChange={(e) => setTruckLicensePlate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Nama Sopir Pengangkut</label>
                <Input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
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
                Terbitkan Surat Jalan Mutasi
              </Button>
            </Card>
          </div>
        )}

        {/* Notice jika hanya 1 gudang */}
        {!isAdmin && otherWarehouses.length === 0 && (
          <div className="lg:col-span-12 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-[#EDF2E8]/40 dark:bg-[#0f172a]/40 p-4 text-xs text-slate-600 dark:text-zinc-400">
            <span className="font-bold text-slate-800 dark:text-zinc-200">Operasional Gudang 1 (Pusat):</span> Belum ada cabang gudang lain yang aktif. Fitur penerbitan surat jalan mutasi tonase akan aktif otomatis saat cabang baru ditambahkan.
          </div>
        )}

        {/* Tabel Mutasi */}
        <div className={isAdmin || otherWarehouses.length === 0 ? 'lg:col-span-12' : 'lg:col-span-7'}>
          <Card className="p-5">
            <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-3">
              Daftar Surat Jalan & Mutasi Masuk/Keluar
            </CardTitle>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {mutations.map((mut) => (
                <div
                  key={mut.id}
                  className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-[#EDF2E8]/40 dark:bg-[#0f172a]/40 p-3.5 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">{mut.mutationNumber}</span>
                    <Badge variant={mut.status === 'RECEIVED' ? 'emerald' : mut.status === 'DRAFT' ? 'slate' : 'amber'}>
                      {mut.status === 'RECEIVED' ? 'Diterima' : mut.status === 'DRAFT' ? 'Pending' : 'Terkirim'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300 font-bold">
                    <span>Gudang {mut.fromWarehouseId}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
                    <span className="text-emerald-800 dark:text-emerald-400">Gudang {mut.toWarehouseId}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-zinc-400 border-t border-slate-200/60 dark:border-slate-800 pt-2">
                    <div>
                      Barang: <span className="font-bold text-slate-900 dark:text-zinc-100">{mut.productName}</span>
                    </div>
                    <div>
                      Berat: <span className="font-numeric font-bold text-slate-900 dark:text-zinc-100">{mut.weightKg} Kg</span>
                    </div>
                    <div>
                      Sopir: <span className="text-slate-800 dark:text-zinc-300 font-medium">{mut.driverName}</span>
                    </div>
                    <div>
                      Plat: <span className="font-mono text-slate-800 dark:text-zinc-300 font-bold">{mut.truckLicensePlate}</span>
                    </div>
                  </div>

                  {mut.status === 'ON_DELIVERY' && mut.toWarehouseId === currentWarehouseId && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onUpdateStatus(mut.id, 'RECEIVED')}
                      className="w-full mt-2"
                    >
                      Konfirmasi Barang Tiba & Masuk Stok Gudang Ini
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
