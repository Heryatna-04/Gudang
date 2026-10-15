'use client';

import React, { useState } from 'react';
import { Truck, Plus, ArrowRight, ShieldAlert } from 'lucide-react';
import { StockMutation, Product, Warehouse, MutationStatus, UserRole } from '../../types';

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
      <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-emerald-800" />
            <h2 className="text-base font-extrabold text-slate-900">MUTASI STOK ANTAR GUDANG</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            {isAdmin
              ? 'Laporan dan riwayat mutasi stok rongsok masuk/keluar antar cabang gudang (Mode Admin: Pantau Laporan & Konfirmasi Terima).'
              : 'Surat jalan pengiriman tonase rongsok antar cabang gudang (mengurangi stok asal, menambah stok tujuan).'}
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-1.5 self-start rounded-lg bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-800 border border-amber-200">
            <ShieldAlert className="h-4 w-4" />
            <span>Kirim Stok Khusus Hak Akses Owner</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Form Surat Jalan - Khusus Owner jika ada lebih dari 1 gudang */}
        {!isAdmin && otherWarehouses.length > 0 && (
          <div className="lg:col-span-5">
            <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">
                Terbitkan Surat Jalan Mutasi Baru
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Gudang Tujuan Pengiriman</label>
                <select
                  value={toWarehouseId}
                  onChange={(e) => setToWarehouseId(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 cursor-pointer"
                >
                  {otherWarehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Komoditas yang Dikirim</label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 cursor-pointer"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stok: {p.currentStockKg} kg)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Berat Kirim (Kg)</label>
                  <input
                    type="number"
                    min="1"
                    step="50"
                    placeholder="0"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 font-numeric focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. Plat Truk</label>
                  <input
                    type="text"
                    value={truckLicensePlate}
                    onChange={(e) => setTruckLicensePlate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Sopir Pengangkut</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-800 py-3 text-xs font-extrabold text-white shadow-md shadow-emerald-950/20 hover:bg-emerald-900 transition-all"
              >
                Terbitkan Surat Jalan Mutasi
              </button>
            </form>
          </div>
        )}

        {/* Notice jika hanya 1 gudang */}
        {!isAdmin && otherWarehouses.length === 0 && (
          <div className="lg:col-span-12 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
            <span className="font-bold text-slate-800">Operasional Gudang 1 (Pusat):</span> Belum ada cabang gudang lain yang aktif. Fitur penerbitan surat jalan mutasi tonase akan aktif otomatis saat cabang baru ditambahkan.
          </div>
        )}

        {/* Tabel Mutasi */}
        <div className={isAdmin || otherWarehouses.length === 0 ? 'lg:col-span-12' : 'lg:col-span-7'}>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-3">
              Daftar Surat Jalan & Mutasi Masuk/Keluar
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {mutations.map((mut) => (
                <div
                  key={mut.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">{mut.mutationNumber}</span>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        mut.status === 'RECEIVED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {mut.status === 'RECEIVED' ? 'DITERIMA DI GUDANG TUJUAN' : 'DALAM PERJALANAN'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700 font-bold">
                    <span>Gudang {mut.fromWarehouseId}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-emerald-800">Gudang {mut.toWarehouseId}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 border-t border-slate-200 pt-2">
                    <div>
                      Barang: <span className="font-bold text-slate-900">{mut.productName}</span>
                    </div>
                    <div>
                      Berat: <span className="font-numeric font-bold text-slate-900">{mut.weightKg} Kg</span>
                    </div>
                    <div>
                      Sopir: <span className="text-slate-800 font-medium">{mut.driverName}</span>
                    </div>
                    <div>
                      Plat: <span className="font-mono text-slate-800 font-bold">{mut.truckLicensePlate}</span>
                    </div>
                  </div>

                  {mut.status === 'ON_DELIVERY' && mut.toWarehouseId === currentWarehouseId && (
                    <button
                      onClick={() => onUpdateStatus(mut.id, 'RECEIVED')}
                      className="w-full mt-2 rounded-lg bg-emerald-800 py-2 text-xs font-bold text-white hover:bg-emerald-900 shadow-xs"
                    >
                      Konfirmasi Barang Tiba & Masuk Stok Gudang Ini
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
