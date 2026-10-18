'use client';

import React, { useState } from 'react';
import { BadgeDollarSign, Plus, CheckCircle, Truck, UserCheck, Banknote, ArrowUpRight, Search, Landmark, Boxes, AlertTriangle } from 'lucide-react';
import { FactorySale, Product, BuyerType } from '../../types';
import { Card, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ChoiceGroup } from '../ui/choice-group';
import { Select } from '../ui/select';
import { StatCard } from '../ui/stat-card';
import { useToast } from '../ui/toast-notification';

interface WarehouseSalesProps {
  currentWarehouseId: number;
  warehouseName: string;
  products: Product[];
  salesList: FactorySale[];
  onAddSale: (sale: FactorySale) => void;
}

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
  const [paymentTerm, setPaymentTerm] = useState<'TUNAI' | 'TEMPO'>('TUNAI');

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
      isPaid: paymentTerm === 'TUNAI',
      createdAt: new Date().toISOString(),
    };

    onAddSale(newSale);
    success(
      `${paymentTerm === 'TUNAI' ? 'Kas Masuk' : 'Piutang Tempo'} Rp ${totalRevenue.toLocaleString('id-ID')} (${paymentTerm === 'TUNAI' ? (paymentMethod === 'CASH_LACI' ? 'Masuk Laci Kasir' : 'Transfer Bank') : 'Tempo/Piutang'}). Stok ${activeProduct.name} berkurang ${weightKg} Kg.`,
      'Penjualan Berhasil Dicatat'
    );
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Info Kas Masuk */}
      <Card className="p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BadgeDollarSign className="h-5 w-5 text-emerald-800 dark:text-emerald-400" />
              <CardTitle className="text-base font-extrabold text-slate-900 dark:text-zinc-100">PENJUALAN STOK GUDANG (KAS MASUK)</CardTitle>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 font-medium">
              Pencatatan pengeluaran barang & penerimaan uang dari pabrik peleburan atau pembeli biasa/eceran di {warehouseName}.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-[#EDF2E8]/60 dark:bg-[#0f172a] p-3 text-right">
            <div className="text-xs font-bold text-slate-600 dark:text-zinc-400">Total Kas Masuk Laci Tunai Hari Ini:</div>
            <div className="font-numeric text-xl font-black text-emerald-800 dark:text-emerald-400">
              Rp{totalCashInToday.toLocaleString('id-ID')}
            </div>
          </div>
        </div>
      </Card>

      {/* OVERVIEW INVENTARIS STOK SIAP JUAL (DARI PEMBELIAN TIMBANGAN) */}
      <Card className="p-5 space-y-4">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <Boxes className="h-5 w-5 text-emerald-800 dark:text-emerald-400" />
            <div>
              <CardTitle className="text-sm font-black text-slate-900 dark:text-zinc-100 tracking-tight">
                INVENTARIS STOK BARANG SIAP JUAL
              </CardTitle>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                Akumulasi timbangan masuk dari pengepul / mitra. Klik kartu barang di bawah untuk langsung input penjualan.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-numeric">
            <div className="rounded-xl bg-[#EDF2E8]/60 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-3 py-1.5 text-right">
              <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 font-sans">Total Tonase Gudang:</div>
              <div className="text-sm sm:text-base font-black text-slate-900 dark:text-zinc-100">
                {(totalStockKg / 1000).toFixed(2)} Ton <span className="text-xs text-slate-500 font-normal">({totalStockKg.toLocaleString('id-ID')} Kg)</span>
              </div>
            </div>
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-right">
              <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 font-sans">Estimasi Nilai Aset Stok:</div>
              <div className="text-sm sm:text-base font-black text-emerald-800 dark:text-emerald-300">
                Rp{totalStockValue.toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Grid Kartu Stok per Komoditas */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => {
            const isSelected = p.id === productId;
            return (
              <div
                key={p.id}
                onClick={() => {
                  setProductId(p.id);
                  setContractPricePerKg(p.marketPriceBenchmark || p.pricePartner + 500);
                }}
                className={`rounded-2xl p-3.5 border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-emerald-800 text-white border-emerald-900 shadow-md scale-[1.01]'
                    : 'bg-[#EDF2E8]/50 dark:bg-[#0b1220] border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-emerald-700/50'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                    isSelected
                      ? 'bg-emerald-950/40 text-emerald-200'
                      : 'bg-slate-200/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}>
                    {p.category.replace('_', ' ')}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  )}
                </div>
                <div className={`font-black text-xs truncate ${isSelected ? 'text-white' : 'text-slate-900 dark:text-zinc-100'}`}>
                  {p.name}
                </div>
                <div className="mt-2 flex items-baseline justify-between text-[11px] font-numeric">
                  <span className={`text-[10px] ${isSelected ? 'text-emerald-200' : 'text-slate-500 dark:text-zinc-400'}`}>Tersedia:</span>
                  <span className={`font-black text-sm ${isSelected ? 'text-white' : 'text-slate-900 dark:text-zinc-100'}`}>
                    {p.currentStockKg.toLocaleString('id-ID')} <span className={`text-[10px] font-normal ${isSelected ? 'text-emerald-200' : 'text-slate-400'}`}>Kg</span>
                  </span>
                </div>
                <div className={`mt-2 flex items-center justify-between border-t pt-1.5 text-[10px] ${
                  isSelected ? 'border-emerald-700/60' : 'border-slate-200/80 dark:border-slate-800'
                }`}>
                  <span className={isSelected ? 'text-emerald-200' : 'text-slate-500 dark:text-zinc-400'}>Harga Acuan:</span>
                  <span className={`font-numeric font-bold ${isSelected ? 'text-amber-300' : 'text-emerald-800 dark:text-emerald-400'}`}>
                    Rp{(p.marketPriceBenchmark || p.pricePartner).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Form Penjualan Stok Baru */}
        <div className="lg:col-span-5">
          <Card as="form" onSubmit={handleSubmit} className="p-5 space-y-4">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-zinc-200">
                Input Penjualan & Pengiriman Pabrik
              </CardTitle>
            </CardHeader>

            {/* Tipe Pembeli */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Tipe Pembeli</label>
              <ChoiceGroup
                fullWidth
                value={buyerType}
                onChange={(val) => {
                  const bt = val as BuyerType;
                  setBuyerType(bt);
                  if (bt === 'PEMBELI_BIASA') {
                    setBuyerName('Bengkel Bubut / Pembeli Biasa');
                    setPaymentMethod('CASH_LACI');
                    setPaymentTerm('TUNAI');
                  } else {
                    setBuyerName('Pabrik Peleburan');
                    setPaymentMethod('TRANSFER_BANK');
                  }
                }}
                options={[
                  { value: 'PEMBELI_BIASA', label: 'Pembeli Biasa / Eceran' },
                  { value: 'PELEBURAN_BESAR', label: 'Peleburan Tonase' },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Nama Pembeli / Pabrik</label>
              <Input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Contoh: Bengkel Las / Pabrik Peleburan 1"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Komoditas Logam yang Dijual</label>
              <Select
                value={productId}
                onChange={(e) => {
                  const newPid = e.target.value;
                  setProductId(newPid);
                  const p = products.find((prod) => prod.id === newPid);
                  if (p) {
                    setContractPricePerKg(p.marketPriceBenchmark || p.pricePartner + 500);
                  }
                }}
                options={products.map((p) => ({
                  value: p.id,
                  label: `${p.name} (Tersedia: ${p.currentStockKg.toLocaleString('id-ID')} kg)`,
                }))}
              />

              {/* Live Stock info badge */}
              <div className="mt-1.5 flex flex-wrap items-center justify-between text-[11px] rounded-xl bg-[#EDF2E8]/60 dark:bg-slate-900 px-3 py-1.5 text-slate-700 dark:text-zinc-300 font-numeric border border-slate-200/80 dark:border-slate-800">
                <span>Stok Gudang: <b>{activeProduct.currentStockKg.toLocaleString('id-ID')} Kg</b></span>
                {weightKg > activeProduct.currentStockKg ? (
                  <Badge variant="rose" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Melebihi stok gudang!
                  </Badge>
                ) : (
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                    Sisa: <b>{(activeProduct.currentStockKg - weightKg).toFixed(1)} Kg</b>
                  </span>
                )}
              </div>
            </div>

            {/* Tonage Form Section */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">Berat Jual (Kg)</label>
                  <span className="text-[10px] font-numeric text-slate-500 font-semibold">
                    {(weightKg / 1000).toFixed(2)} Ton
                  </span>
                </div>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                  className="font-numeric"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Harga Jual / Kg (Rp)</label>
                <Input
                  type="number"
                  min="100"
                  step="50"
                  value={contractPricePerKg}
                  onChange={(e) => setContractPricePerKg(parseFloat(e.target.value) || 0)}
                  className="font-numeric text-emerald-800 dark:text-emerald-400 font-bold"
                  required
                />
              </div>
            </div>

            {/* Quick Tonage Preset Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[500, 1000, 2000, 5000, 10000].map((kg) => (
                <Button
                  key={kg}
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setWeightKg(kg)}
                  className="font-numeric text-[11px] py-1 px-2 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-200"
                >
                  {kg >= 1000 ? `${kg / 1000} Ton` : `${kg} Kg`}
                </Button>
              ))}
            </div>

            {/* Toggle Status Pembayaran: TUNAI vs TEMPO */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Status Pembayaran</label>
              <ChoiceGroup
                fullWidth
                value={paymentTerm}
                onChange={(val) => setPaymentTerm(val as 'TUNAI' | 'TEMPO')}
                options={[
                  {
                    value: 'TUNAI',
                    label: 'TUNAI (Langsung Lunas)',
                    badge: 'LUNAS',
                  },
                  {
                    value: 'TEMPO',
                    label: 'TEMPO (Piutang Pabrik)',
                    badge: 'PIUTANG',
                  },
                ]}
              />
            </div>

            {/* Metode Pembayaran: Masuk Kasir Laci vs Rekening Bank */}
            {paymentTerm === 'TUNAI' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Tujuan Kas Masuk</label>
                <ChoiceGroup
                  fullWidth
                  value={paymentMethod}
                  onChange={(val) => setPaymentMethod(val as 'CASH_LACI' | 'TRANSFER_BANK')}
                  options={[
                    {
                      value: 'CASH_LACI',
                      label: 'Laci Kasir (Tunai)',
                      icon: <Banknote className="h-4 w-4" />,
                    },
                    {
                      value: 'TRANSFER_BANK',
                      label: 'Transfer Bank',
                      icon: <Landmark className="h-4 w-4" />,
                    },
                  ]}
                />
              </div>
            )}

            {/* Total Tagihan Penjualan */}
            <div className="p-3.5 rounded-2xl border border-emerald-500/20 bg-[#EDF2E8]/60 dark:bg-[#0f172a] flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-700 dark:text-zinc-300">Total Nilai Penjualan:</div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {paymentTerm === 'TUNAI' ? (paymentMethod === 'CASH_LACI' ? 'Kas Masuk Laci Kasir' : 'Transfer Rekening Bank') : 'Tercatat Piutang Tempo Pabrik'}
                </div>
              </div>
              <span className="font-numeric text-base font-black text-emerald-800 dark:text-emerald-400">
                Rp{totalRevenue.toLocaleString('id-ID')}
              </span>
            </div>

            <Button
              type="submit"
              variant={paymentTerm === 'TUNAI' ? 'primary' : 'amber'}
              size="lg"
              className="w-full"
            >
              {paymentTerm === 'TUNAI' ? 'Simpan Penjualan & Tambah Kas Masuk' : 'Simpan Pengiriman Pabrik (Tempo)'}
            </Button>
          </Card>
        </div>

        {/* Tabel Riwayat Penjualan */}
        <div className="lg:col-span-7">
          <Card className="p-5">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
              <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                Riwayat Penjualan Stok ({warehouseName})
              </CardTitle>
            </CardHeader>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {warehouseSales.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500 font-medium">
                  Belum ada transaksi penjualan stok di gudang ini.
                </div>
              ) : (
                warehouseSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-[#EDF2E8]/40 dark:bg-[#0f172a]/40 p-3.5 text-xs space-y-2 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">{sale.invoiceNumber}</span>
                      <div className="flex items-center gap-1.5">
                        <Badge variant={sale.isPaid ? 'emerald' : 'amber'}>
                          {sale.isPaid ? 'LUNAS' : 'TEMPO'}
                        </Badge>
                        <Badge variant={sale.paymentMethod === 'CASH_LACI' ? 'emerald' : 'blue'}>
                          {sale.paymentMethod === 'CASH_LACI' ? 'KAS TUNAI LACI' : 'TRANSFER BANK'}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-slate-700 dark:text-zinc-300">
                      <span className="font-bold text-slate-900 dark:text-zinc-100">{sale.factoryName}</span>
                      <Badge variant="slate">
                        {sale.buyerType === 'PELEBURAN_BESAR' ? 'Peleburan' : 'Pembeli Biasa'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-slate-800 pt-2 text-[11px] text-slate-600 dark:text-zinc-400">
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
          </Card>
        </div>
      </div>
    </div>
  );
}
