import React, { useState, useEffect, useCallback } from 'react';
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
import { Card, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ChoiceGroup } from '../ui/choice-group';
import { Select } from '../ui/select';
import { StatCard } from '../ui/stat-card';

interface KasirPosProps {
  products: Product[];
  warehouseId: number;
  warehouseName: string;
  onSaveTransaction: (tx: ScaleTransaction) => void;
  transactions?: ScaleTransaction[];
  salesList?: FactorySale[];
  activeShift?: CashShift | null;
  scaleController?: ReturnType<typeof useScaleSerial>;
}

export function KasirPos({
  products,
  warehouseId,
  warehouseName,
  onSaveTransaction,
  transactions = [],
  salesList = [],
  activeShift,
  scaleController: injectedScaleController,
}: KasirPosProps) {
  const { success, warning } = useToast();
  const [posTab, setPosTab] = useState<'pos' | 'history'>('pos');
  const [historyTab, setHistoryTab] = useState<'all' | 'pembelian' | 'penjualan'>('all');
  const [searchHistory, setSearchHistory] = useState<string>('');
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  const warehouseTransactions = (transactions || []).filter((t) => t.warehouseId === warehouseId);
  const warehouseSales = (salesList || []).filter((s) => s.warehouseId === warehouseId);
  
  const internalScaleController = useScaleSerial({ mockMode: true });
  const {
    currentWeight,
    isConnected,
    isMock,
    portInfo,
    connectHardware,
    disconnectHardware,
    setSimulatedWeight,
    resetTare,
  } = injectedScaleController || internalScaleController;

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
  const [recoveredDraftFound, setRecoveredDraftFound] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const saved = localStorage.getItem(`gc_kuningan_cart_draft_wh_${warehouseId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed.cartItems) && parsed.cartItems.length > 0;
      }
    } catch {
      return false;
    }
    return false;
  });
  const draftStorageKey = `gc_kuningan_cart_draft_wh_${warehouseId}`;

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

  const handleAddItemToCart = useCallback(() => {
    if (netWeight <= 0 || !activeProduct) return;

    const now = Date.now();
    const rand = Math.random().toString(36).slice(2, 6);
    const newItem: ScaleTransactionItem = {
      id: `item-${now}-${rand}`,
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
  }, [
    netWeight,
    activeProduct,
    currentProductName,
    grossWeight,
    refactionType,
    refactionValue,
    unitPrice,
    currentItemSubtotal,
    resetTare,
  ]);

  const handleRemoveItem = useCallback((id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleCompleteTransaction = useCallback(() => {
    if (cartItems.length === 0) return;

    const requiresApproval = totalBillToPay > 10000000;
    const finalSeller = isCustomSeller ? customSellerName.trim() || 'Penjual Umum' : sellerName;

    const now = Date.now();
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const newTx: ScaleTransaction = {
      id: `tx-${now}`,
      invoiceNumber: `NOTA/${new Date(now).toISOString().slice(0, 10).replace(/-/g, '')}/G${warehouseId}/${randNum}`,
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
        `Nota ${newTx.invoiceNumber} (Rp ${totalBillToPay.toLocaleString('id-ID')}) tersimpan & struk dicetak. Stok ${newTx.items.length} komoditas otomatis masuk ke inventaris siap jual.`,
        'Transaksi Berhasil Disimpan'
      );
    }

    setCartItems([]);
    setCashGiven(0);
  }, [
    cartItems,
    totalBillToPay,
    isCustomSeller,
    customSellerName,
    sellerName,
    warehouseId,
    activeShift,
    isPartner,
    onSaveTransaction,
    warehouseName,
    warning,
    success,
  ]);

  const handleReprintReceipt = (tx: ScaleTransaction) => {
    const receiptText = buildThermalReceiptESC(tx, warehouseName);
    printThermalReceipt(receiptText);
    success(`Struk thermal nota ${tx.invoiceNumber} sedang dicetak...`, 'Cetak Ulang Struk');
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Banner Pemulihan Mati Listrik / Crash Recovery */}
      {recoveredDraftFound && (
        <Card className="flex flex-col sm:flex-row items-center justify-between gap-3 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700/60 p-4 shadow-sm text-slate-900 dark:text-zinc-100 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-200 dark:bg-amber-900/60 p-2 text-amber-900 dark:text-amber-200">
              <History className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-black text-amber-950 dark:text-amber-200 uppercase tracking-tight">
                Draft Transaksi Ditemukan (Proteksi Mati Listrik)
              </div>
              <div className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                Ada nota timbangan yang belum diselesaikan sebelum browser tertutup atau mati lampu.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="primary"
              size="sm"
              onClick={handleRestoreDraft}
              className="flex-1 sm:flex-none font-black"
            >
              Pulihkan Nota
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDiscardDraft}
              className="flex-1 sm:flex-none"
            >
              Buang
            </Button>
          </div>
        </Card>
      )}

      {/* Tab Switcher Kasir: Input Timbangan vs Riwayat Transaksi */}
      <Card className="flex flex-wrap items-center justify-between gap-3 p-2.5 shadow-xs transition-colors">
        <ChoiceGroup
          value={posTab}
          onChange={(val) => setPosTab(val as 'pos' | 'history')}
          options={[
            {
              value: 'pos',
              label: 'Kasir Timbangan & Input Nota',
              icon: <Scale className="h-4 w-4" />,
            },
            {
              value: 'history',
              label: 'Riwayat Transaksi Kasir',
              icon: <History className="h-4 w-4" />,
              badge: String(warehouseTransactions.length + warehouseSales.length),
            },
          ]}
        />

        <div className="text-right text-xs font-bold text-slate-500 dark:text-zinc-400 px-2 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{warehouseName}</span>
        </div>
      </Card>

      {posTab === 'pos' ? (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Kolom Kiri: Layar Timbangan Digital & Input */}
        <div className="space-y-5 lg:col-span-7">
          {/* Timbangan Box */}
          <Card className="p-5">
            <CardHeader className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-emerald-800 dark:text-emerald-400" />
                <CardTitle className="text-sm font-black text-slate-900 dark:text-zinc-100 tracking-tight">TIMBANGAN DIGITAL (ALEXA BFS)</CardTitle>
                <Badge variant={isConnected && !isMock ? 'emerald' : 'amber'}>
                  {isConnected && !isMock ? 'Serial Port RS-232' : isMock ? 'Simulasi Virtual' : 'Input Manual (Kabel Belum Terhubung)'}
                </Badge>
              </div>

              <div>
                {isConnected && !isMock ? (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={disconnectHardware}
                  >
                    Putus Koneksi
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={connectHardware}
                  >
                    Hubungkan Port Kabel
                  </Button>
                )}
              </div>
            </CardHeader>

            {/* Big Digital Scale Display - Modern Charcoal / Emerald Minimalist */}
            <div className="my-4 flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-[#EDF2E8]/60 dark:bg-[#070b14] py-7 px-4 text-slate-900 dark:text-zinc-100 shadow-xs transition-colors">
              <div className="text-[10px] uppercase tracking-widest font-black text-emerald-800 dark:text-emerald-400 mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse"></span>
                <span>Layar Berat Digital</span>
              </div>
              <div className="flex items-baseline justify-center gap-2">
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
                  className="font-numeric text-6xl sm:text-7xl font-black tracking-tight text-slate-900 dark:text-white text-center bg-transparent border-b-2 border-dashed border-emerald-700/40 dark:border-emerald-500/40 focus:border-emerald-700 focus:outline-none w-72 max-w-full"
                  title="Ketik berat timbangan dinamis di sini"
                />
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400">KG</span>
              </div>
              <div className="mt-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Badge variant={isConnected && !isMock ? 'emerald' : 'amber'}>
                  {isConnected && !isMock ? 'Live Stream' : 'Manual'}
                </Badge>
                <span>{portInfo || 'Ketik berat langsung atau gunakan tombol tare / slider'}</span>
              </div>
            </div>

            {/* Kontrol Cepat Berat & Slider */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0b1220] p-4 space-y-3 transition-colors">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                <span>Preset &amp; Slider Penyesuaian Berat</span>
                <span className="font-numeric font-black text-emerald-800 dark:text-emerald-400">{currentWeight.toFixed(2)} Kg</span>
              </div>
              <input
                type="range"
                min="0"
                max="500"
                step="0.5"
                value={currentWeight}
                onChange={(e) => setSimulatedWeight(parseFloat(e.target.value))}
                className="w-full accent-emerald-800 dark:accent-emerald-500 cursor-pointer"
              />
              <div className="flex flex-wrap gap-1.5 items-center">
                {[5, 12.5, 25, 50, 100, 250].map((w) => (
                  <Button
                    key={w}
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setSimulatedWeight(w)}
                    className="font-numeric text-xs font-bold"
                  >
                    +{w}kg
                  </Button>
                ))}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={resetTare}
                  className="ml-auto font-bold text-amber-600 dark:text-amber-400"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Tare (0 Kg)
                </Button>
              </div>
            </div>

          {/* Form Input Detail Transaksi */}
          <div className="mt-5 space-y-4">
            {/* Penjual dengan Opsi Input Bebas */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">Nama Pengepul / Penjual</label>
                  <button
                    type="button"
                    onClick={() => setIsCustomSeller(!isCustomSeller)}
                    className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    {isCustomSeller ? 'Pilih dari List' : '+ Ketik Nama Baru'}
                  </button>
                </div>

                {isCustomSeller ? (
                  <Input
                    type="text"
                    value={customSellerName}
                    onChange={(e) => setCustomSellerName(e.target.value)}
                    placeholder="Ketik nama penjual bebas..."
                    autoFocus
                  />
                ) : (
                  <Select
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    options={defaultSellers.map((s) => ({ value: s, label: s }))}
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">Kategori Harga Mitra</label>
                <ChoiceGroup
                  fullWidth
                  value={isPartner ? 'langganan' : 'umum'}
                  onChange={(val) => setIsPartner(val === 'langganan')}
                  options={[
                    {
                      value: 'langganan',
                      label: 'Langganan (VIP)',
                      icon: <UserCheck className="h-3.5 w-3.5" />,
                    },
                    {
                      value: 'umum',
                      label: 'Umum / Eceran',
                      icon: <UserX className="h-3.5 w-3.5" />,
                    },
                  ]}
                />
              </div>
            </div>

            {/* Komoditas dengan Pilihan Grid Cepat (Dikelola Khusus Oleh Owner) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Pilih Komoditas</label>
                {activeProduct && (
                  <Badge variant="emerald">{activeProduct.name} Terpilih</Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {products.map((p) => {
                  const price = isPartner ? p.pricePartner : p.priceRegular;
                  const isSelected = p.id === selectedProductId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedProductId(p.id)}
                      className={`group rounded-2xl p-3 text-left border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-emerald-800 text-white border-emerald-900 shadow-md scale-[1.01]'
                          : 'bg-[#EDF2E8]/60 dark:bg-[#0b1220] border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-emerald-700/50'
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
                      <div className={`text-xs font-black truncate ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                        {p.name}
                      </div>
                      <div className="mt-2 text-right">
                        <span className={`font-numeric text-xs font-black ${
                          isSelected ? 'text-amber-300' : 'text-emerald-800 dark:text-emerald-400'
                        }`}>
                          Rp{price.toLocaleString('id-ID')}
                        </span>
                        <span className={`text-[10px] ml-0.5 ${isSelected ? 'text-emerald-200' : 'text-slate-400'}`}>/kg</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Potongan Kotoran (Refaksi) */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-[#EDF2E8]/60 dark:bg-[#0f172a]/40 p-4 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">Potongan Kotoran (Refaksi)</span>
                <ChoiceGroup
                  size="sm"
                  value={refactionType}
                  onChange={(val) => setRefactionType(val as 'kg' | 'pct')}
                  options={[
                    { value: 'kg', label: 'Potong Kg' },
                    { value: 'pct', label: 'Potong %' },
                  ]}
                />
              </div>

              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={refactionValue || ''}
                  onChange={(e) => setRefactionValue(parseFloat(e.target.value) || 0)}
                  placeholder={`Nilai potongan dalam ${refactionType.toUpperCase()}`}
                  className="flex-1"
                />
                <div className="text-right text-xs text-slate-600 dark:text-zinc-400">
                  <span>Netto: </span>
                  <span className="font-numeric font-black text-slate-900 dark:text-zinc-100 text-sm">{netWeight} Kg</span>
                </div>
              </div>
            </div>

            {/* Action Button: Masukkan ke Nota Multi-Item */}
            <Button
              variant="primary"
              size="lg"
              onClick={handleAddItemToCart}
              disabled={netWeight <= 0}
              className="w-full"
            >
              <Plus className="h-4 w-4" />
              Masukkan ke Nota (Subtotal: Rp{currentItemSubtotal.toLocaleString('id-ID')})
            </Button>
          </div>
          </Card>
        </div>

      {/* Kolom Kanan: Keranjang Nota & Estimasi Uang Kasir */}
      <div className="space-y-5 lg:col-span-5">
        <Card className="p-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-800 dark:text-emerald-400" />
              <CardTitle className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">KERANJANG TIMBANGAN (NOTA)</CardTitle>
            </div>
            <Badge variant="emerald">{cartItems.length} Item</Badge>
          </div>

          {/* List Barang di Nota */}
          <div className="my-3 max-h-56 space-y-2 overflow-y-auto pr-1">
            {cartItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500 font-medium">
                Belum ada barang di nota. Timbang dan klik &apos;Masukkan ke Nota&apos;.
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200/80 dark:border-slate-800 bg-[#EDF2E8]/40 dark:bg-[#0f172a]/40 p-3 text-xs transition-colors"
                >
                  <div className="flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-zinc-100">{item.productName}</span>
                      <Badge variant="emerald">+{item.netWeightKg} Kg Siap Jual</Badge>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-numeric mt-0.5">
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
                      className="mt-1 text-[11px] font-bold text-red-600 dark:text-rose-400 hover:text-red-700 dark:hover:text-rose-300 cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Total Tagihan Timbangan (Kas Keluar) */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400">
              <span className="font-semibold">Total Biaya Belanja (Uang Keluar):</span>
              <span className="font-numeric text-xl font-black text-amber-700 dark:text-amber-400">
                Rp{totalBillToPay.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Estimasi Kasir Uang Masuk / Pembayaran & Kembalian */}
          <div className="mt-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-[#EDF2E8]/50 dark:bg-[#0f172a]/50 p-4 space-y-3 transition-colors">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-zinc-100">
              <Banknote className="h-4 w-4 text-emerald-800 dark:text-emerald-400" />
              <span>Estimasi Uang Diserahkan & Kembalian</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 mb-1">
                Uang Tunai Diserahkan Kasir ke Penjual (Rp):
              </label>
              <Input
                type="number"
                min="0"
                step="1000"
                value={cashGiven || ''}
                onChange={(e) => setCashGiven(parseFloat(e.target.value) || 0)}
                placeholder={`Contoh: Rp${totalBillToPay}`}
                className="font-numeric font-black text-sm"
              />

              {/* Quick Cash Buttons */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[
                  totalBillToPay,
                  Math.ceil(totalBillToPay / 50000) * 50000,
                  Math.ceil(totalBillToPay / 100000) * 100000,
                ]
                  .filter((v, i, a) => v > 0 && a.indexOf(v) === i)
                  .map((val) => (
                    <Button
                      key={val}
                      variant="secondary"
                      size="sm"
                      onClick={() => setCashGiven(val)}
                      className="font-numeric text-[11px] py-0.5 px-2 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-100"
                    >
                      Rp{val.toLocaleString('id-ID')}
                    </Button>
                  ))}
              </div>
            </div>

            {/* Status Kembalian & Kurang Bayar */}
            <div className="space-y-1 border-t border-slate-200/80 dark:border-slate-800 pt-2 text-xs">
              <div className="flex items-center justify-between text-slate-700 dark:text-zinc-300">
                <span className="font-semibold">Kembalian dari Penjual:</span>
                <span className="font-numeric font-bold text-emerald-700 dark:text-emerald-400">
                  Rp{changeAmount.toLocaleString('id-ID')}
                </span>
              </div>

              {underpaidAmount > 0 && (
                <div className="flex items-center justify-between text-amber-800 dark:text-amber-400">
                  <span className="font-semibold">Sisa Kurang Bayar:</span>
                  <span className="font-numeric font-bold">Rp{underpaidAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Selesaikan & Cetak Struk */}
          <div className="mt-4 space-y-2">
            <Button
              variant="amber"
              size="lg"
              onClick={handleCompleteTransaction}
              disabled={cartItems.length === 0}
              className="w-full"
            >
              <Printer className="h-4 w-4" />
              Selesaikan Transaksi & Cetak Struk Thermal
            </Button>
          </div>

          {/* Widget 3 Nota Timbangan Terakhir Kasir */}
          {warehouseTransactions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
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
                    className="flex items-center justify-between rounded-xl border border-slate-200/80 dark:border-slate-800 bg-[#EDF2E8]/40 dark:bg-[#0f172a]/40 p-2.5 text-xs transition-colors"
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
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleReprintReceipt(tx)}
                        title="Cetak Ulang Struk Thermal"
                        className="px-2 py-1"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  ) : (
    /* TAMPILAN LENGKAP RIWAYAT TRANSAKSI KASIR (PEMBELIAN & PENJUALAN) */
    <div className="space-y-4">
      {/* Header Ringkasan Kas Kasir Hari Ini */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard
          title="Total Pembelian Timbangan"
          value={`Rp${warehouseTransactions.reduce((acc, t) => acc + t.totalAmount, 0).toLocaleString('id-ID')}`}
          subtitle="Kas keluar belanja rongsok dari pengepul"
          icon={ArrowDownLeft}
          variant="amber"
          trend={{ value: `${warehouseTransactions.length} Nota`, isPositive: false }}
        />

        <StatCard
          title="Total Penjualan Stok"
          value={`Rp${warehouseSales.reduce((acc, s) => acc + s.totalRevenue, 0).toLocaleString('id-ID')}`}
          subtitle="Kas masuk penjualan ke pabrik & pembeli eceran"
          icon={ArrowUpRight}
          variant="emerald"
          trend={{ value: `${warehouseSales.length} Nota`, isPositive: true }}
        />

        <StatCard
          title="Aktivitas Gudang"
          value={`${warehouseTransactions.length + warehouseSales.length} Transaksi`}
          subtitle={warehouseName}
          variant="slate"
        />
      </div>

      {/* Filter Tab & Pencarian */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0b1220] p-3.5 shadow-xs transition-colors">
        <ChoiceGroup
          size="sm"
          value={historyTab}
          onChange={(val) => setHistoryTab(val as 'all' | 'pembelian' | 'penjualan')}
          options={[
            {
              value: 'all',
              label: 'Semua',
              badge: String(warehouseTransactions.length + warehouseSales.length),
            },
            {
              value: 'pembelian',
              label: 'Pembelian Timbangan',
              badge: String(warehouseTransactions.length),
            },
            {
              value: 'penjualan',
              label: 'Penjualan Stok',
              badge: String(warehouseSales.length),
            },
          ]}
        />

        <div className="relative min-w-[220px]">
          <Input
            icon={<Search className="h-3.5 w-3.5" />}
            value={searchHistory}
            onChange={(e) => setSearchHistory(e.target.value)}
            placeholder="Cari nota / nama..."
          />
        </div>
      </div>

      {/* List Riwayat Transaksi */}
      <div className="space-y-3">
        {/* Riwayat Pembelian Timbangan */}
        {(historyTab === 'all' || historyTab === 'pembelian') && (
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                  Riwayat Pembelian Timbangan Masuk
                </CardTitle>
              </div>
              <Badge variant="amber">
                {warehouseTransactions.length} Nota
              </Badge>
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
                        className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-[#EDF2E8]/40 dark:bg-[#0f172a]/40 p-3.5 space-y-2 transition-colors"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-900 dark:text-zinc-100">
                              {tx.invoiceNumber}
                            </span>
                            <Badge variant={tx.isPartner ? 'emerald' : 'amber'}>
                              {tx.isPartner ? 'MITRA / VIP' : 'UMUM'}
                            </Badge>
                            {tx.requiresOwnerApproval && (
                              <Badge variant={tx.isApprovedByOwner ? 'emerald' : 'rose'}>
                                {tx.isApprovedByOwner ? 'JUMBO APPROVED' : 'JUMBO PENDING'}
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                              {new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}{' '}
                              {new Date(tx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                            </span>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleReprintReceipt(tx)}
                              title="Cetak Ulang Struk Thermal"
                            >
                              <Printer className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                              <span>Cetak</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
                              title={isExpanded ? 'Tutup Rincian' : 'Lihat Rincian Barang'}
                              className="p-1.5"
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
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
                          <div className="mt-2 pt-2 border-t border-slate-200/80 dark:border-slate-800 space-y-1.5 text-xs">
                            <div className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-tight">
                              Rincian Barang yang Ditimbang:
                            </div>
                            <div className="divide-y divide-slate-200/60 dark:divide-slate-800/80">
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
          </Card>
        )}

        {/* Riwayat Penjualan Stok Gudang */}
        {(historyTab === 'all' || historyTab === 'penjualan') && (
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                  Riwayat Penjualan Stok Gudang (Kas Masuk)
                </CardTitle>
              </div>
              <Badge variant="emerald">
                {warehouseSales.length} Nota
              </Badge>
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
                      className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-[#EDF2E8]/40 dark:bg-[#0f172a]/40 p-3.5 space-y-2 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-900 dark:text-zinc-100">
                            {sale.invoiceNumber}
                          </span>
                          <Badge variant={sale.paymentMethod === 'CASH_LACI' ? 'emerald' : 'blue'}>
                            {sale.paymentMethod === 'CASH_LACI' ? 'KAS TUNAI LACI' : 'TRANSFER BANK'}
                          </Badge>
                          <Badge variant="slate">
                            {sale.buyerType === 'PELEBURAN_BESAR' ? 'Peleburan Tonase' : 'Pembeli Biasa'}
                          </Badge>
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
          </Card>
        )}
      </div>
    </div>
  )}
</div>
);
}
