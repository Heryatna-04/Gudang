'use client';

import React, { useState } from 'react';
import { BadgeDollarSign, Plus, CheckCircle, Truck, UserCheck, Banknote, ArrowUpRight, Search, Landmark, Boxes, AlertTriangle } from 'lucide-react';
import { FactorySale, Product, BuyerType } from '../../types';

interface WarehouseSalesProps {
  currentWarehouseId: number;
  warehouseName: string;
  products: Product[];
  salesList: FactorySale[];
  onAddSale: (sale: FactorySale) => void;
}

import { useToast } from '../ui/toast-notification';

export function WarehouseSalesManagement({
  currentWarehouseId,
  warehouseName,
  products,
  salesList,
  onAddSale,
}: WarehouseSalesProps) {
  const { success } = useToast();
  const [buyerType, setBuyerType] = useState<BuyerType>('PEMBELI_BIASA');
  const [buyerName, setBuyerName] = useState<string>('Bengkel Las Mandiri');
  const [productId, setProductId] = useState<string>(products[0]?.id || '');
  const [weightKg, setWeightKg] = useState<number>(150);
  const [contractPricePerKg, setContractPricePerKg] = useState<number>(6000);
  const [paymentMethod, setPaymentMethod] = useState<'CASH_LACI' | 'TRANSFER_BANK'>('CASH_LACI');

  const activeProduct = products.find((p) => p.id === productId) || products[0];
  const totalRevenue = weightKg * contractPricePerKg;

  // Akumulasi total stok siap jual & estimasi nilai aset
  const totalStockKg = products.reduce((acc, p) => acc + (p.currentStockKg || 0), 0);
  const totalStockValue = products.reduce((acc, p) => acc + (p.currentStockKg || 0) * (p.marketPriceBenchmark || p.priceRegular), 0);

  // Filter penjualan gudang ini
  const warehouseSales = salesList.filter((s) => s.warehouseId === currentWarehouseId);
  const totalCashInToday = warehouseSales
    .filter((s) => s.paymentMethod === 'CASH_LACI' && s.isPaid)
    .reduce((acc, curr) => acc + curr.totalRevenue, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (weightKg <= 0 || contractPricePerKg <= 0) return;

    const newSale: FactorySale = {
      id: `sale-${Date.now()}`,
      invoiceNumber: `JL/${buyerType === 'PELEBURAN_BESAR' ? 'PBRK' : 'RETAIL'}/${new Date().toISOString().slice(0, 10).replace(/-/g, '')}/${Math.floor(100 + Math.random() * 900)}`,
      warehouseId: currentWarehouseId,
      buyerType,
      factoryName: buyerName.trim() || (buyerType === 'PELEBURAN_BESAR' ? 'Pabrik Peleburan' : 'Pembeli Biasa'),
      productId: activeProduct.id,
      productName: activeProduct.name,
      weightKg,
      contractPricePerKg,
      totalRevenue,
      paymentMethod,
      isPaid: true,
      createdAt: new Date().toISOString(),
    };

    onAddSale(newSale);
    success(
      `Kas Masuk Rp ${totalRevenue.toLocaleString('id-ID')} (${paymentMethod === 'CASH_LACI' ? 'Masuk Laci Kasir' : 'Transfer Bank'}). Stok ${activeProduct.name} berkurang ${weightKg} Kg.`,
      'Penjualan Berhasil Dicatat'
    );
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Info Kas Masuk */}
      <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black p-5 shadow-sm transition-colors md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BadgeDollarSign className="h-5 w-5 text-emerald-800 dark:text-emerald-400" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-zinc-100">PENJUALAN STOK GUDANG (KAS MASUK)</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 font-medium">
            Pencatatan pengeluaran barang & penerimaan uang dari pabrik peleburan atau pembeli biasa/eceran di {warehouseName}.
          </p>
        </div>

        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/60 p-3 text-right">
          <div className="text-xs font-bold text-slate-600 dark:text-zinc-400">Total Kas Masuk Laci Tunai Hari Ini:</div>
          <div className="font-numeric text-xl font-black text-emerald-800 dark:text-emerald-400">
            Rp{totalCashInToday.toLocaleString('id-ID')}
          </div>
        </div>
      </div>

      {/* OVERVIEW INVENTARIS STOK SIAP JUAL (DARI PEMBELIAN TIMBANGAN) */}
      <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black p-5 shadow-xs transition-colors space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Boxes className="h-5 w-5 text-emerald-800 dark:text-emerald-400" />
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100 tracking-tight">
                INVENTARIS STOK BARANG SIAP JUAL
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                Akumulasi timbangan masuk dari pengepul / mitra. Klik kartu barang di bawah untuk langsung input penjualan.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-numeric">
            <div className="rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 text-right">
              <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 font-sans">Total Tonase Gudang:</div>
              <div className="text-sm sm:text-base font-black text-slate-900 dark:text-zinc-100">
                {(totalStockKg / 1000).toFixed(2)} Ton <span className="text-xs text-slate-500 font-normal">({totalStockKg.toLocaleString('id-ID')} Kg)</span>
              </div>
            </div>
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 text-right">
              <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 font-sans">Estimasi Nilai Aset Stok:</div>
              <div className="text-sm sm:text-base font-black text-emerald-800 dark:text-emerald-300">
                Rp{totalStockValue.toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        </div>

        {/* Grid Kartu Stok per Komoditas */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 max-h-56 overflow-y-auto pr-1">
          {products.map((p) => {
            const isSelected = p.id === productId;
            return (
              <div
                key={p.id}
                onClick={() => {
                  setProductId(p.id);
                  setContractPricePerKg(p.marketPriceBenchmark || p.pricePartner + 500);
                }}
                className={`rounded-xl p-3 border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-700 ring-1 ring-emerald-600 shadow-xs'
                    : 'bg-slate-50/70 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900'
                }`}
              >
                <div className="font-extrabold text-xs text-slate-900 dark:text-zinc-100 truncate">{p.name}</div>
                <div className="mt-1 flex items-baseline justify-between text-[11px] font-numeric">
                  <span className="text-slate-500 dark:text-zinc-400 text-[10px]">{p.category.replace('_', ' ')}</span>
                  <span className="font-black text-slate-900 dark:text-zinc-100 text-sm">
                    {p.currentStockKg.toLocaleString('id-ID')} <span className="text-[10px] font-normal text-slate-500">Kg</span>
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between border-t border-slate-200/80 dark:border-zinc-800 pt-1 text-[10px]">
                  <span className="text-slate-500 dark:text-zinc-400">Harga Acuan:</span>
                  <span className="font-numeric font-bold text-emerald-800 dark:text-emerald-400">
                    Rp{(p.marketPriceBenchmark || p.pricePartner).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Form Penjualan Stok Baru */}
        <div className="lg:col-span-5">
          <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black p-5 space-y-4 shadow-sm transition-colors">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-zinc-200 border-b border-slate-100 dark:border-zinc-800 pb-2">
              Input Penjualan & Kas Masuk
            </h3>

            {/* Tipe Pembeli */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Tipe Pembeli</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBuyerType('PEMBELI_BIASA');
                    setBuyerName('Bengkel Bubut / Pembeli Biasa');
                    setPaymentMethod('CASH_LACI');
                  }}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    buyerType === 'PEMBELI_BIASA'
                      ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                      : 'bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:bg-emerald-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  Pembeli Biasa / Eceran
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBuyerType('PELEBURAN_BESAR');
                    setBuyerName('Pabrik Peleburan');
                    setPaymentMethod('TRANSFER_BANK');
                  }}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    buyerType === 'PELEBURAN_BESAR'
                      ? 'bg-slate-900 dark:bg-zinc-800 text-amber-300 border-slate-950 dark:border-zinc-700 shadow-xs'
                      : 'bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  Peleburan Tonase Besar
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Nama Pembeli / Pabrik</label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Contoh: Bengkel Las / Pabrik Peleburan 1"
                className="w-full rounded-lg border border-slate-300 dark:border-zinc-800 bg-white dark:bg-black px-3 py-2 text-xs font-bold text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Komoditas Logam yang Dijual</label>
              <select
                value={productId}
                onChange={(e) => {
                  const newPid = e.target.value;
                  setProductId(newPid);
                  const p = products.find((prod) => prod.id === newPid);
                  if (p) {
                    setContractPricePerKg(p.marketPriceBenchmark || p.pricePartner + 500);
                  }
                }}
                className="w-full rounded-lg border border-slate-300 dark:border-zinc-800 bg-white dark:bg-black px-3 py-2 text-xs font-bold text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-700 cursor-pointer"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id} className="dark:bg-black">
                    {p.name} (Tersedia: {p.currentStockKg.toLocaleString('id-ID')} kg)
                  </option>
                ))}
              </select>

              {/* Live Stock info badge */}
              <div className="mt-1.5 flex flex-wrap items-center justify-between text-[11px] rounded-lg bg-slate-100 dark:bg-zinc-900 px-2.5 py-1 text-slate-700 dark:text-zinc-300 font-numeric border border-slate-200 dark:border-zinc-800">
                <span>Stok Gudang: <b>{activeProduct.currentStockKg.toLocaleString('id-ID')} Kg</b></span>
                {weightKg > activeProduct.currentStockKg ? (
                  <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Melebihi stok gudang!
                  </span>
                ) : (
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                    Sisa setelah terjual: <b>{(activeProduct.currentStockKg - weightKg).toFixed(1)} Kg</b>
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Berat Jual (Kg)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-300 dark:border-zinc-800 bg-white dark:bg-black px-3 py-2 text-xs font-bold text-slate-900 dark:text-zinc-100 font-numeric focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Harga Jual / Kg (Rp)</label>
                <input
                  type="number"
                  min="100"
                  step="50"
                  value={contractPricePerKg}
                  onChange={(e) => setContractPricePerKg(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-slate-300 dark:border-zinc-800 bg-white dark:bg-black px-3 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-400 font-numeric focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                />
              </div>
            </div>

            {/* Metode Pembayaran: Masuk Kasir Laci vs Rekening */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Tujuan Kas Masuk</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH_LACI')}
                  className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    paymentMethod === 'CASH_LACI'
                      ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                      : 'bg-white dark:bg-black text-slate-600 dark:text-zinc-400 border-slate-300 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  <Banknote className="h-4 w-4" />
                  <span>Masuk Laci Kasir (Tunai)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('TRANSFER_BANK')}
                  className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    paymentMethod === 'TRANSFER_BANK'
                      ? 'bg-slate-900 dark:bg-zinc-800 text-amber-300 border-slate-950 dark:border-zinc-700 shadow-xs'
                      : 'bg-white dark:bg-black text-slate-600 dark:text-zinc-400 border-slate-300 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  <Landmark className="h-4 w-4" />
                  <span>Transfer Bank</span>
                </button>
              </div>
            </div>

            {/* Total Tagihan Penjualan */}
            <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/40 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">Total Nilai Penjualan:</span>
              <span className="font-numeric text-base font-black text-emerald-800 dark:text-emerald-400">
                Rp{totalRevenue.toLocaleString('id-ID')}
              </span>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-800 hover:bg-emerald-900 py-3 text-xs font-extrabold text-white shadow-md shadow-emerald-950/20 transition-all cursor-pointer"
            >
              Simpan Penjualan & Tambah Kas Masuk
            </button>
          </form>
        </div>

        {/* Tabel Riwayat Penjualan */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black p-5 shadow-sm transition-colors">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-3">
              Riwayat Penjualan Stok ({warehouseName})
            </h3>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {warehouseSales.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500 font-medium">
                  Belum ada transaksi penjualan stok di gudang ini.
                </div>
              ) : (
                warehouseSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-black p-3.5 text-xs space-y-2 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">{sale.invoiceNumber}</span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold border ${
                          sale.paymentMethod === 'CASH_LACI'
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-zinc-300 border-slate-300 dark:border-zinc-700'
                        }`}
                      >
                        {sale.paymentMethod === 'CASH_LACI' ? 'KAS TUNAI LACI' : 'TRANSFER BANK'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-700 dark:text-zinc-300">
                      <span className="font-bold text-slate-900 dark:text-zinc-100">{sale.factoryName}</span>
                      <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                        {sale.buyerType === 'PELEBURAN_BESAR' ? 'Peleburan' : 'Pembeli Biasa'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200 dark:border-zinc-800 pt-2 text-[11px] text-slate-600 dark:text-zinc-400">
                      <div>
                        {sale.productName} • <span className="font-numeric font-bold">{sale.weightKg} Kg</span> @ Rp{sale.contractPricePerKg.toLocaleString('id-ID')}
                      </div>
                      <div className="font-numeric font-black text-emerald-800 dark:text-emerald-400 text-sm">
                        Rp{sale.totalRevenue.toLocaleString('id-ID')}
                      </div>
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
