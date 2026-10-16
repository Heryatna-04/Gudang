import React, { useState, useEffect } from 'react';
import {
  Scale,
  Printer,
  Plus,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  UserX,
  Banknote,
  DollarSign,
  Camera,
  History,
  Trash2,
  FileText,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Product, ScaleTransaction, ScaleTransactionItem, FactorySale, CashShift } from '../../types';
import { useScaleSerial } from '../../lib/hardware/use-scale-serial';
import { buildThermalReceiptESC, printThermalReceipt } from '../../lib/hardware/escpos-builder';
import { useToast } from '../ui/toast-notification';

interface KasirPosProps {
  products: Product[];
  warehouseId: number;
  warehouseName: string;
  onSaveTransaction: (tx: ScaleTransaction) => void;
  transactions?: ScaleTransaction[];
  salesList?: FactorySale[];
  activeShift?: CashShift | null;
}

export function KasirPos({
  products,
  warehouseId,
  warehouseName,
  onSaveTransaction,
  transactions = [],
  salesList = [],
  activeShift,
}: KasirPosProps) {
  const { success, warning } = useToast();
  const [posTab, setPosTab] = useState<'pos' | 'history'>('pos');
  const [historyTab, setHistoryTab] = useState<'all' | 'pembelian' | 'penjualan'>('all');
  const [searchHistory, setSearchHistory] = useState<string>('');
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  const warehouseTransactions = (transactions || []).filter((t) => t.warehouseId === warehouseId);
  const warehouseSales = (salesList || []).filter((s) => s.warehouseId === warehouseId);
  const {
    currentWeight,
    isConnected,
    isMock,
    portInfo,
    connectHardware,
    disconnectHardware,
    setSimulatedWeight,
    resetTare,
  } = useScaleSerial({ mockMode: true });

  // Pilihan nama penjual umum/keliling + Opsi input bebas
  const defaultSellers = [
    'Pak Madun (Pengepul Langganan)',
    'H. Hasanudin (Mitra Borongan)',
    'Wawan (Pengepul Keliling)',
    'Suryadi (Pengepul Rongsok)',
    'Penjual Umum / Eceran',
  ];

  const [sellerName, setSellerName] = useState<string>(defaultSellers[0]);
  const [isCustomSeller, setIsCustomSeller] = useState<boolean>(false);
  const [customSellerName, setCustomSellerName] = useState<string>('');
  const [isPartner, setIsPartner] = useState<boolean>(true);

  // Komoditas Master (Dikelola khusus oleh Owner)
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');

  // Potongan kotoran (Refaksi)
  const [refactionType, setRefactionType] = useState<'kg' | 'pct'>('kg');
  const [refactionValue, setRefactionValue] = useState<number>(0);
  const [cartItems, setCartItems] = useState<ScaleTransactionItem[]>([]);

  // Pembayaran & Estimasi Uang Kasir
  const [cashGiven, setCashGiven] = useState<number>(0);

  // State Deteksi Pulih Mati Lampu (Power Outage Recovery Banner)
  const [recoveredDraftFound, setRecoveredDraftFound] = useState<boolean>(false);
  const draftStorageKey = `gc_kuningan_cart_draft_wh_${warehouseId}`;

  // 1. Cek draft tersimpan saat inisialisasi
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.cartItems) && parsed.cartItems.length > 0) {
          setRecoveredDraftFound(true);
        }
      }
    } catch (e) {
      console.warn('Gagal membaca draft lokal:', e);
    }
  }, [draftStorageKey]);

  // 2. Auto-save keranjang setiap kali cartItems atau sellerName berubah
  useEffect(() => {
    try {
      if (cartItems.length > 0) {
        localStorage.setItem(
          draftStorageKey,
          JSON.stringify({
            cartItems,
            sellerName,
            isCustomSeller,
            customSellerName,
            isPartner,
            timestamp: new Date().toISOString(),
          })
        );
      } else {
        localStorage.removeItem(draftStorageKey);
      }
    } catch (e) {
      console.warn('Gagal menyimpan auto-draft:', e);
    }
  }, [cartItems, sellerName, isCustomSeller, customSellerName, isPartner, draftStorageKey]);

  const handleRestoreDraft = () => {
    try {
      const saved = localStorage.getItem(draftStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.cartItems) setCartItems(parsed.cartItems);
        if (parsed.sellerName) setSellerName(parsed.sellerName);
        if (parsed.isCustomSeller !== undefined) setIsCustomSeller(parsed.isCustomSeller);
        if (parsed.customSellerName) setCustomSellerName(parsed.customSellerName);
        if (parsed.isPartner !== undefined) setIsPartner(parsed.isPartner);
      }
    } catch (e) {
      console.warn('Gagal memulihkan draft:', e);
    }
    setRecoveredDraftFound(false);
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(draftStorageKey);
    setRecoveredDraftFound(false);
  };

  // Detail produk aktif (terkunci sesuai penetapan Owner)
  const activeProduct = products.find((p) => p.id === selectedProductId) || products[0];
  const unitPrice = activeProduct
    ? isPartner
      ? activeProduct.pricePartner
      : activeProduct.priceRegular
    : 0;

  const currentProductName = activeProduct?.name || 'Komoditas';

  // Perhitungan berat & subtotal
  const grossWeight = currentWeight;
  const refactionKg = refactionType === 'kg' ? refactionValue : (grossWeight * refactionValue) / 100;
  const netWeight = Math.max(0, Number((grossWeight - refactionKg).toFixed(2)));
  const currentItemSubtotal = Math.round(netWeight * unitPrice);

  const totalBillToPay = cartItems.reduce((acc, item) => acc + item.subtotal, 0);

  // Estimasi kembalian / kurang bayar
  const changeAmount = cashGiven > totalBillToPay ? cashGiven - totalBillToPay : 0;
  const underpaidAmount = cashGiven > 0 && cashGiven < totalBillToPay ? totalBillToPay - cashGiven : 0;

  const handleAddItemToCart = () => {
    if (netWeight <= 0 || !activeProduct) return;

    const newItem: ScaleTransactionItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      transactionId: '',
      productId: activeProduct.id,
      productName: currentProductName,
      grossWeightKg: grossWeight,
      refactionKg: refactionType === 'kg' ? refactionValue : 0,
      refactionPct: refactionType === 'pct' ? refactionValue : 0,
      netWeightKg: netWeight,
      pricePerKg: unitPrice,
      subtotal: currentItemSubtotal,
    };

    setCartItems((prev) => [...prev, newItem]);
    resetTare();
    setRefactionValue(0);
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCompleteTransaction = () => {
    if (cartItems.length === 0) return;

    const requiresApproval = totalBillToPay > 10000000;
    const finalSeller = isCustomSeller ? customSellerName.trim() || 'Penjual Umum' : sellerName;

    const newTx: ScaleTransaction = {
      id: `tx-${Date.now()}`,
      invoiceNumber: `NOTA/${new Date().toISOString().slice(0, 10).replace(/-/g, '')}/G${warehouseId}/${Math.floor(
        1000 + Math.random() * 9000
      )}`,
      warehouseId,
      cashierId: activeShift?.cashierId || 'Kasir Gudang',
      shiftId: activeShift?.id || 'shift-active-01',
      sellerName: finalSeller,
      isPartner,
      totalAmount: totalBillToPay,
      syncStatus: true,
      requiresOwnerApproval: requiresApproval,
      isApprovedByOwner: !requiresApproval,
      items: cartItems,
      createdAt: new Date().toISOString(),
    };

    onSaveTransaction(newTx);

    // Cetak struk ESC/POS
    const receiptText = buildThermalReceiptESC(newTx, warehouseName);
    printThermalReceipt(receiptText);

    if (requiresApproval) {
      warning(
        `Transaksi Jumbo > Rp 10.000.000 (Total: Rp ${totalBillToPay.toLocaleString('id-ID')}). Membutuhkan approval Owner.`,
        'Approval Owner Diperlukan'
      );
    } else {
      success(
        `Nota ${newTx.invoiceNumber} (Rp ${totalBillToPay.toLocaleString('id-ID')}) tersimpan & struk dicetak.`,
        'Transaksi Berhasil Disimpan'
      );
    }

    setCartItems([]);
    setCashGiven(0);
  };

  const handleReprintReceipt = (tx: ScaleTransaction) => {
    const receiptText = buildThermalReceiptESC(tx, warehouseName);
    printThermalReceipt(receiptText);
    success(`Struk thermal nota ${tx.invoiceNumber} sedang dicetak...`, 'Cetak Ulang Struk');
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Banner Pemulihan Mati Listrik / Crash Recovery */}
      {recoveredDraftFound && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-sm text-slate-900 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-200 p-2 text-amber-900">
              <History className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-black text-amber-950 uppercase tracking-tight">
                Draft Transaksi Ditemukan (Proteksi Mati Listrik)
              </div>
              <div className="text-[11px] text-amber-800 font-medium">
                Ada nota timbangan yang belum diselesaikan sebelum browser tertutup atau mati lampu.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleRestoreDraft}
              className="flex-1 sm:flex-none rounded-xl bg-emerald-800 hover:bg-emerald-900 px-3.5 py-1.5 text-xs font-black text-white shadow-xs transition-all"
            >
              Pulihkan Nota
            </button>
            <button
              onClick={handleDiscardDraft}
              className="flex-1 sm:flex-none rounded-xl bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 transition-all"
            >
              Buang
            </button>
          </div>
        </div>
      )}

      {/* Tab Switcher Kasir: Input Timbangan vs Riwayat Transaksi */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black p-2.5 shadow-xs transition-colors">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPosTab('pos')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              posTab === 'pos'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900'
            }`}
          >
            <Scale className="h-4 w-4" />
            <span>Kasir Timbangan & Input Nota</span>
          </button>

          <button
            type="button"
            onClick={() => setPosTab('history')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              posTab === 'history'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900'
            }`}
          >
            <History className="h-4 w-4" />
            <span>Riwayat Transaksi Kasir</span>
            <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 text-[10px] font-black text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              {warehouseTransactions.length + warehouseSales.length}
            </span>
          </button>
        </div>

        <div className="text-right text-xs font-bold text-slate-500 dark:text-zinc-400 px-2 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{warehouseName}</span>
        </div>
      </div>

      {posTab === 'pos' ? (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Kolom Kiri: Layar Timbangan Digital & Input */}
        <div className="space-y-5 lg:col-span-7">
          {/* Timbangan Box */}
          <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black p-5 shadow-xs transition-colors">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-emerald-800 dark:text-emerald-400" />
              <span className="text-sm font-black text-slate-900 dark:text-zinc-100 tracking-tight">TIMBANGAN DIGITAL (ALEXA BFS)</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  isMock
                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60'
                    : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60'
                }`}
              >
                {isMock ? 'Simulasi Virtual' : 'Serial Port RS-232'}
              </span>
            </div>

            <div>
              {isMock ? (
                <button
                  onClick={connectHardware}
                  className="rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800"
                >
                  Hubungkan Port Kabel
                </button>
              ) : (
                <button
                  onClick={disconnectHardware}
                  className="rounded-lg bg-red-100 dark:bg-rose-950/80 border border-red-300 dark:border-rose-900/60 px-2.5 py-1 text-xs font-semibold text-red-700 dark:text-rose-300 hover:bg-red-200 dark:hover:bg-rose-900"
                >
                  Putus Koneksi
                </button>
              )}
            </div>
          </div>

          {/* Big Digital Scale Display - Input Dinamis & Real-time Stream */}
          <div className="my-5 flex flex-col items-center justify-center rounded-xl border border-slate-300 dark:border-zinc-800 bg-gradient-to-b from-slate-50 to-emerald-50/40 dark:from-black dark:to-black dark:bg-black py-5 text-slate-900 dark:text-zinc-100 shadow-inner transition-colors">
            <div className="text-[11px] uppercase tracking-widest font-black text-slate-500 dark:text-zinc-400 mb-1">
              Berat Timbangan (Ketik Dinamis / Auto-Stream)
            </div>
            <div className="flex items-center justify-center gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                value={currentWeight === 0 ? '' : currentWeight}
                placeholder="0.00"
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setSimulatedWeight(isNaN(val) ? 0 : Math.max(0, val));
                }}
                className="font-numeric text-6xl font-black tracking-tight text-emerald-900 dark:text-emerald-400 text-center bg-transparent border-b-2 border-dashed border-emerald-400 dark:border-emerald-600 focus:border-emerald-700 focus:outline-none w-64 max-w-full"
                title="Ketik berat timbangan dinamis di sini"
              />
              <span className="text-2xl font-black text-amber-700 dark:text-amber-400">KG</span>
            </div>
            <div className="mt-2 text-[11px] font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-2">
              <span className="rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-bold border border-emerald-300 dark:border-emerald-800/60">Ketik Dinamis</span>
              <span>{portInfo || 'Ketik langsung angka berat atau gunakan tombol cepat / slider'}</span>
            </div>
          </div>

          {/* Kontrol Cepat Berat & Slider */}
          <div className="rounded-xl border border-amber-200 dark:border-zinc-800 bg-amber-50/60 dark:bg-black p-3.5 space-y-2 transition-colors">
            <div className="flex items-center justify-between text-xs font-bold text-amber-950 dark:text-amber-400">
              <span>Pengaturan Cepat Berat Timbangan</span>
              <span className="font-numeric">{currentWeight.toFixed(2)} Kg</span>
            </div>
            <input
              type="range"
              min="0"
              max="500"
              step="0.5"
              value={currentWeight}
              onChange={(e) => setSimulatedWeight(parseFloat(e.target.value))}
              className="w-full accent-emerald-800 cursor-pointer"
            />
            <div className="flex flex-wrap gap-1.5 items-center">
              {[5, 12.5, 25, 50, 100, 250].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setSimulatedWeight(w)}
                  className="rounded bg-white border border-amber-300 px-2.5 py-1 text-xs font-bold text-slate-800 hover:bg-amber-100"
                >
                  +{w}kg
                </button>
              ))}
              <button
                type="button"
                onClick={resetTare}
                className="flex items-center gap-1 rounded bg-slate-900 px-3 py-1 text-xs text-amber-300 hover:bg-slate-800 font-bold ml-auto shadow-xs"
              >
                <RotateCcw className="h-3 w-3" />
                Nol-kan / Tare (0 Kg)
              </button>
            </div>
          </div>

          {/* Form Input Detail Transaksi */}
          <div className="mt-5 space-y-4">
            {/* Penjual dengan Opsi Input Bebas */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Nama Pengepul / Penjual</label>
                  <button
                    type="button"
                    onClick={() => setIsCustomSeller(!isCustomSeller)}
                    className="text-[11px] font-bold text-emerald-800 hover:underline"
                  >
                    {isCustomSeller ? 'Pilih dari List' : '+ Ketik Nama Baru'}
                  </button>
                </div>

                {isCustomSeller ? (
                  <input
                    type="text"
                    value={customSellerName}
                    onChange={(e) => setCustomSellerName(e.target.value)}
                    placeholder="Ketik nama penjual bebas..."
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    autoFocus
                  />
                ) : (
                  <select
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    {defaultSellers.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Harga Mitra</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPartner(true)}
                    className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs font-bold border transition-all ${
                      isPartner
                        ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    Langganan (VIP)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPartner(false)}
                    className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs font-bold border transition-all ${
                      !isPartner
                        ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <UserX className="h-3.5 w-3.5" />
                    Umum / Eceran
                  </button>
                </div>
              </div>
            </div>

            {/* Komoditas dengan Pilihan Grid Cepat (Dikelola Khusus Oleh Owner) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">Komoditas Logam / Rongsok</label>
                <span className="text-[11px] font-semibold text-slate-500 italic">
                  Harga & master komoditas diatur oleh Owner
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 max-h-48 overflow-y-auto pr-1">
                {products.map((p) => {
                  const price = isPartner ? p.pricePartner : p.priceRegular;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedProductId(p.id)}
                      className={`rounded-xl p-2.5 text-left border transition-all ${
                        p.id === selectedProductId
                          ? 'bg-emerald-50 border-emerald-700 shadow-xs ring-1 ring-emerald-600'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs font-extrabold text-slate-900 truncate">{p.name}</div>
                      <div className="mt-1 flex items-baseline justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">{p.category.replace('_', ' ')}</span>
                        <span className="font-numeric font-black text-emerald-800">
                          Rp{price.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Potongan Kotoran (Refaksi) */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">Potongan Kotoran (Refaksi)</span>
                <div className="flex gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setRefactionType('kg')}
                    className={`rounded px-2.5 py-0.5 text-xs font-bold ${
                      refactionType === 'kg' ? 'bg-emerald-800 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Potong Kg
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefactionType('pct')}
                    className={`rounded px-2.5 py-0.5 text-xs font-bold ${
                      refactionType === 'pct' ? 'bg-emerald-800 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Potong %
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={refactionValue || ''}
                  onChange={(e) => setRefactionValue(parseFloat(e.target.value) || 0)}
                  placeholder={`Nilai potongan dalam ${refactionType.toUpperCase()}`}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
                <div className="text-right text-xs text-slate-600">
                  <span>Netto: </span>
                  <span className="font-numeric font-black text-slate-900 text-sm">{netWeight} Kg</span>
                </div>
              </div>
            </div>

            {/* Action Button: Masukkan ke Nota Multi-Item */}
            <button
              type="button"
              onClick={handleAddItemToCart}
              disabled={netWeight <= 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 py-3.5 text-sm font-extrabold text-white shadow-md shadow-emerald-950/20 hover:bg-emerald-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Plus className="h-4 w-4" />
              Masukkan ke Nota (Subtotal: Rp{currentItemSubtotal.toLocaleString('id-ID')})
            </button>
          </div>
        </div>
      </div>

      {/* Kolom Kanan: Keranjang Nota & Estimasi Uang Kasir */}
      <div className="space-y-5 lg:col-span-5">
        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black p-5 shadow-sm transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-800 dark:text-emerald-400" />
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">KERANJANG TIMBANGAN (NOTA)</h2>
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">{cartItems.length} Item</span>
          </div>

          {/* List Barang di Nota */}
          <div className="my-3 max-h-56 space-y-2 overflow-y-auto pr-1">
            {cartItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500 font-medium">
                Belum ada barang di nota. Timbang dan klik 'Masukkan ke Nota'.
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-black p-3 text-xs transition-colors"
                >
                  <div className="flex-1 pr-2">
                    <div className="font-bold text-slate-900 dark:text-zinc-100">{item.productName}</div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-numeric">
                      {item.netWeightKg} Kg × Rp{item.pricePerKg.toLocaleString('id-ID')}
                      {item.refactionKg > 0 && ` (Potong ${item.refactionKg}kg)`}
                      {item.refactionPct > 0 && ` (Potong ${item.refactionPct}%)`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-numeric font-black text-emerald-800 dark:text-emerald-400">
                      Rp{item.subtotal.toLocaleString('id-ID')}
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="mt-1 text-[11px] font-bold text-red-600 dark:text-rose-400 hover:text-red-700 dark:hover:text-rose-300"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Total Tagihan Timbangan (Kas Keluar) */}
          <div className="border-t border-slate-100 dark:border-zinc-800 pt-3">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400">
              <span className="font-semibold">Total Biaya Belanja (Uang Keluar):</span>
              <span className="font-numeric text-xl font-black text-amber-700 dark:text-amber-400">
                Rp{totalBillToPay.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Estimasi Kasir Uang Masuk / Pembayaran & Kembalian */}
          <div className="mt-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-black p-4 space-y-3 transition-colors">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-zinc-100">
              <Banknote className="h-4 w-4 text-emerald-800 dark:text-emerald-400" />
              <span>Estimasi Uang Diserahkan & Kembalian</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Uang Tunai Diserahkan Kasir ke Penjual (Rp):
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={cashGiven || ''}
                onChange={(e) => setCashGiven(parseFloat(e.target.value) || 0)}
                placeholder={`Contoh: Rp${totalBillToPay}`}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-numeric font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />

              {/* Quick Cash Buttons */}
              <div className="mt-2 flex flex-wrap gap-1">
                {[
                  totalBillToPay,
                  Math.ceil(totalBillToPay / 50000) * 50000,
                  Math.ceil(totalBillToPay / 100000) * 100000,
                ]
                  .filter((v, i, a) => v > 0 && a.indexOf(v) === i)
                  .map((val) => (
                    <button
                      key={val}
                      onClick={() => setCashGiven(val)}
                      className="rounded bg-white border border-slate-300 px-2 py-0.5 text-[11px] font-bold text-slate-700 hover:bg-slate-100 font-numeric"
                    >
                      Rp{val.toLocaleString('id-ID')}
                    </button>
                  ))}
              </div>
            </div>

            {/* Status Kembalian & Kurang Bayar */}
            <div className="space-y-1 border-t border-slate-200 pt-2 text-xs">
              <div className="flex items-center justify-between text-slate-700">
                <span className="font-semibold">Kembalian dari Penjual:</span>
                <span className="font-numeric font-bold text-emerald-700">
                  Rp{changeAmount.toLocaleString('id-ID')}
                </span>
              </div>

              {underpaidAmount > 0 && (
                <div className="flex items-center justify-between text-amber-800">
                  <span className="font-semibold">Sisa Kurang Bayar:</span>
                  <span className="font-numeric font-bold">Rp{underpaidAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Selesaikan & Cetak Struk */}
          <div className="mt-4 space-y-2">
            <button
              onClick={handleCompleteTransaction}
              disabled={cartItems.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-extrabold text-amber-300 shadow-md shadow-slate-900/30 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Printer className="h-4 w-4" />
              Selesaikan Transaksi & Cetak Struk Thermal
            </button>
          </div>

          {/* Widget 3 Nota Timbangan Terakhir Kasir */}
          {warehouseTransactions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-zinc-300">
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                  <span>Nota Terakhir Kasir Ini</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPosTab('history')}
                  className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Lihat Semua ({warehouseTransactions.length}) →
                </button>
              </div>

              <div className="space-y-1.5">
                {warehouseTransactions.slice(0, 3).map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-black p-2.5 text-xs transition-colors"
                  >
                    <div className="truncate pr-2">
                      <div className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-[11px] truncate">
                        {tx.invoiceNumber}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">
                        {tx.sellerName} • {new Date(tx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-numeric font-black text-amber-700 dark:text-amber-400 text-xs">
                        Rp{tx.totalAmount.toLocaleString('id-ID')}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleReprintReceipt(tx)}
                        title="Cetak Ulang Struk Thermal"
                        className="rounded-lg bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 p-1.5 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  ) : (
    /* TAMPILAN LENGKAP RIWAYAT TRANSAKSI KASIR (PEMBELIAN & PENJUALAN) */
    <div className="space-y-4">
      {/* Header Ringkasan Kas Kasir Hari Ini */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-black p-4 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-400">
            <span className="flex items-center gap-1.5">
              <ArrowDownLeft className="h-4 w-4 text-amber-700" />
              Total Pembelian Timbangan
            </span>
            <span className="font-numeric font-black">{warehouseTransactions.length} Nota</span>
          </div>
          <div className="font-numeric text-xl font-black text-amber-900 dark:text-amber-300">
            Rp{warehouseTransactions.reduce((acc, t) => acc + t.totalAmount, 0).toLocaleString('id-ID')}
          </div>
          <p className="text-[10px] text-amber-800/80 dark:text-zinc-500 font-medium">
            Kas keluar belanja rongsok dari pengepul & mitra
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-black p-4 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-400">
            <span className="flex items-center gap-1.5">
              <ArrowUpRight className="h-4 w-4 text-emerald-700" />
              Total Penjualan Stok
            </span>
            <span className="font-numeric font-black">{warehouseSales.length} Nota</span>
          </div>
          <div className="font-numeric text-xl font-black text-emerald-900 dark:text-emerald-300">
            Rp{warehouseSales.reduce((acc, s) => acc + s.totalRevenue, 0).toLocaleString('id-ID')}
          </div>
          <p className="text-[10px] text-emerald-800/80 dark:text-zinc-500 font-medium">
            Kas masuk penjualan ke pabrik & pembeli eceran
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black p-4 space-y-1 sm:col-span-2 lg:col-span-1">
          <div className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
            <span>Aktivitas Gudang</span>
            <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-400">
              {warehouseName}
            </span>
          </div>
          <div className="font-numeric text-xl font-black text-slate-900 dark:text-zinc-100">
            {warehouseTransactions.length + warehouseSales.length} Transaksi
          </div>
          <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
            Tersimpan aman & tersinkronisasi Supabase Cloud
          </p>
        </div>
      </div>

      {/* Filter Tab & Pencarian */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black p-3.5 shadow-xs transition-colors">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setHistoryTab('all')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              historyTab === 'all'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900'
            }`}
          >
            Semua ({warehouseTransactions.length + warehouseSales.length})
          </button>
          <button
            type="button"
            onClick={() => setHistoryTab('pembelian')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              historyTab === 'pembelian'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900'
            }`}
          >
            Pembelian Timbangan ({warehouseTransactions.length})
          </button>
          <button
            type="button"
            onClick={() => setHistoryTab('penjualan')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              historyTab === 'penjualan'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900'
            }`}
          >
            Penjualan Stok ({warehouseSales.length})
          </button>
        </div>

        <div className="relative min-w-[220px]">
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchHistory}
            onChange={(e) => setSearchHistory(e.target.value)}
            placeholder="Cari nota / nama..."
            className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-black pl-8 pr-3 py-1.5 text-xs font-medium text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
        </div>
      </div>

      {/* List Riwayat Transaksi */}
      <div className="space-y-3">
        {/* Riwayat Pembelian Timbangan */}
        {(historyTab === 'all' || historyTab === 'pembelian') && (
          <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black p-4 space-y-3 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                  Riwayat Pembelian Timbangan Masuk
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 font-numeric">
                {warehouseTransactions.length} Nota
              </span>
            </div>

            {warehouseTransactions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500 font-medium">
                Belum ada riwayat pembelian timbangan di {warehouseName}.
              </div>
            ) : (
              <div className="space-y-2">
                {warehouseTransactions
                  .filter((t) => {
                    if (!searchHistory.trim()) return true;
                    const q = searchHistory.toLowerCase();
                    return (
                      t.invoiceNumber.toLowerCase().includes(q) ||
                      t.sellerName.toLowerCase().includes(q) ||
                      t.items.some((i) => (i.productName || '').toLowerCase().includes(q))
                    );
                  })
                  .map((tx) => {
                    const isExpanded = expandedTxId === tx.id;
                    return (
                      <div
                        key={tx.id}
                        className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-black p-3.5 space-y-2 transition-colors"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-900 dark:text-zinc-100">
                              {tx.invoiceNumber}
                            </span>
                            <span
                              className={`rounded px-2 py-0.5 text-[10px] font-bold border ${
                                tx.isPartner
                                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                  : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                              }`}
                            >
                              {tx.isPartner ? 'MITRA / VIP' : 'UMUM'}
                            </span>
                            {tx.requiresOwnerApproval && (
                              <span
                                className={`rounded px-2 py-0.5 text-[10px] font-bold border ${
                                  tx.isApprovedByOwner
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : 'bg-rose-100 text-rose-800 border-rose-300'
                                }`}
                              >
                                {tx.isApprovedByOwner ? 'JUMBO APPROVED' : 'JUMBO PENDING'}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                              {new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}{' '}
                              {new Date(tx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                            </span>
                            <button
                              type="button"
                              onClick={() => handleReprintReceipt(tx)}
                              className="flex items-center gap-1 rounded-lg bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer shadow-xs"
                              title="Cetak Ulang Struk Thermal"
                            >
                              <Printer className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                              <span>Cetak Ulang</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
                              className="rounded-lg bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 p-1 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                              title={isExpanded ? 'Tutup Rincian' : 'Lihat Rincian Barang'}
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-baseline justify-between text-xs">
                          <div className="font-semibold text-slate-700 dark:text-zinc-300">
                            Penjual: <span className="font-bold text-slate-900 dark:text-zinc-100">{tx.sellerName}</span>
                            <span className="mx-2 text-slate-400">•</span>
                            <span>{tx.items.length} Komoditas</span>
                          </div>
                          <div className="font-numeric text-base font-black text-amber-800 dark:text-amber-400">
                            Rp{tx.totalAmount.toLocaleString('id-ID')}
                          </div>
                        </div>

                        {/* Rincian Komoditas (Expandable) */}
                        {isExpanded && (
                          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-zinc-800 space-y-1.5 text-xs">
                            <div className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-tight">
                              Rincian Barang yang Ditimbang:
                            </div>
                            <div className="divide-y divide-slate-200/60 dark:divide-zinc-800/80">
                              {tx.items.map((item, idx) => (
                                <div key={item.id || idx} className="py-1.5 flex items-center justify-between text-[11px]">
                                  <div>
                                    <span className="font-bold text-slate-800 dark:text-zinc-200">{item.productName || 'Komoditas'}</span>
                                    <span className="text-slate-500 dark:text-zinc-400 ml-2 font-numeric">
                                      Netto {item.netWeightKg} Kg × Rp{item.pricePerKg.toLocaleString('id-ID')}
                                      {item.refactionKg > 0 && ` (Potong ${item.refactionKg}kg)`}
                                      {item.refactionPct > 0 && ` (Potong ${item.refactionPct}%)`}
                                    </span>
                                  </div>
                                  <div className="font-numeric font-bold text-emerald-800 dark:text-emerald-400">
                                    Rp{item.subtotal.toLocaleString('id-ID')}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Riwayat Penjualan Stok Gudang */}
        {(historyTab === 'all' || historyTab === 'penjualan') && (
          <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black p-4 space-y-3 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                  Riwayat Penjualan Stok Gudang (Kas Masuk)
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 font-numeric">
                {warehouseSales.length} Nota
              </span>
            </div>

            {warehouseSales.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500 font-medium">
                Belum ada transaksi penjualan stok di {warehouseName}.
              </div>
            ) : (
              <div className="space-y-2">
                {warehouseSales
                  .filter((s) => {
                    if (!searchHistory.trim()) return true;
                    const q = searchHistory.toLowerCase();
                    return (
                      s.invoiceNumber.toLowerCase().includes(q) ||
                      s.factoryName.toLowerCase().includes(q) ||
                      (s.productName || '').toLowerCase().includes(q)
                    );
                  })
                  .map((sale) => (
                    <div
                      key={sale.id}
                      className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-black p-3.5 space-y-2 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-900 dark:text-zinc-100">
                            {sale.invoiceNumber}
                          </span>
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold border ${
                              sale.paymentMethod === 'CASH_LACI'
                                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                : 'bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-zinc-300 border-slate-300 dark:border-zinc-700'
                            }`}
                          >
                            {sale.paymentMethod === 'CASH_LACI' ? 'KAS TUNAI LACI' : 'TRANSFER BANK'}
                          </span>
                          <span className="rounded px-2 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800">
                            {sale.buyerType === 'PELEBURAN_BESAR' ? 'Peleburan Tonase' : 'Pembeli Biasa'}
                          </span>
                        </div>

                        <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                          {new Date(sale.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}{' '}
                          {new Date(sale.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between text-xs">
                        <div className="text-slate-700 dark:text-zinc-300">
                          Pembeli: <span className="font-bold text-slate-900 dark:text-zinc-100">{sale.factoryName}</span>
                          <span className="mx-2 text-slate-400">•</span>
                          <span>{sale.productName || 'Komoditas'}</span>
                          <span className="mx-1 font-numeric font-bold">({sale.weightKg} Kg @ Rp{sale.contractPricePerKg.toLocaleString('id-ID')})</span>
                        </div>
                        <div className="font-numeric text-base font-black text-emerald-800 dark:text-emerald-400">
                          Rp{sale.totalRevenue.toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )}
</div>
);
}
