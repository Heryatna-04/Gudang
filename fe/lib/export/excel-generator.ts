import * as XLSX from 'xlsx';
import {
  ScaleTransaction,
  FactorySale,
  AttendanceRecord,
  EmployeeLoan,
  OpexExpense,
} from '../../types';

export interface MultiSheetExportData {
  attendances: AttendanceRecord[];
  loans: EmployeeLoan[];
  purchases: ScaleTransaction[];
  factorySales: FactorySale[];
  opex: OpexExpense[];
  isOwner: boolean;
}

export function exportEnterpriseReportExcel(data: MultiSheetExportData, fileNamePrefix = 'PT_DAVID_ERP_REKAP') {
  const wb = XLSX.utils.book_new();

  // 1. Sheet Absensi & Kasbon
  const attendanceRows = data.attendances.map((a) => {
    const loan = data.loans.find((l) => l.employeeId === a.employeeId);
    return {
      Tanggal: a.attendanceDate,
      Shift: a.shift || 'PAGI',
      Gudang: `Gudang ${a.warehouseId}`,
      Nama_Karyawan: a.employeeName || a.employeeId,
      Status_Kehadiran: a.status,
      Jam_Masuk: a.checkIn ? new Date(a.checkIn).toLocaleTimeString('id-ID') : '-',
      Total_Kasbon_Aktif: loan ? loan.amount : 0,
    };
  });
  const wsAttendance = XLSX.utils.json_to_sheet(attendanceRows);
  XLSX.utils.book_append_sheet(wb, wsAttendance, '1. Absensi & Kasbon');

  // 2. Sheet Pembelian Timbangan
  const purchaseRows = data.purchases.flatMap((p) =>
    p.items.map((item) => ({
      No_Nota: p.invoiceNumber,
      Tanggal: new Date(p.createdAt).toLocaleDateString('id-ID'),
      Gudang: `Gudang ${p.warehouseId}`,
      Penjual: p.sellerName,
      Tipe_Mitra: p.isPartner ? 'Langganan' : 'Umum',
      Komoditas: item.productName || item.productId,
      Berat_Kotor_Kg: item.grossWeightKg,
      Potongan_Kg: item.refactionKg,
      Potongan_Persen: item.refactionPct,
      Berat_Netto_Kg: item.netWeightKg,
      Harga_Per_Kg: item.pricePerKg,
      Subtotal: item.subtotal,
      Approval_Jumbo: p.requiresOwnerApproval ? (p.isApprovedByOwner ? 'APPROVED' : 'PENDING') : 'NORMAL',
    }))
  );
  const wsPurchases = XLSX.utils.json_to_sheet(purchaseRows);
  XLSX.utils.book_append_sheet(wb, wsPurchases, '2. Pembelian Timbangan');

  // 3. Sheet Biaya Operasional (OPEX)
  const opexRows = data.opex.map((o) => ({
    Tanggal: new Date(o.createdAt).toLocaleDateString('id-ID'),
    Gudang: `Gudang ${o.warehouseId}`,
    Kategori: o.category,
    Keterangan: o.description,
    Nominal: o.amount,
    Petugas: o.recordedBy,
  }));
  const wsOpex = XLSX.utils.json_to_sheet(opexRows);
  XLSX.utils.book_append_sheet(wb, wsOpex, '3. Biaya Operasional OPEX');

  // 4. Sheet Penjualan Pabrik (Hanya jika ada data)
  const salesRows = data.factorySales.map((s) => ({
    No_Faktur: s.invoiceNumber,
    Tanggal: new Date(s.createdAt).toLocaleDateString('id-ID'),
    Gudang_Asal: `Gudang ${s.warehouseId}`,
    Nama_Pabrik: s.factoryName,
    Komoditas: s.productName || s.productId,
    Tonase_Kg: s.weightKg,
    Harga_Kontrak_Per_Kg: s.contractPricePerKg,
    Total_Omzet: s.totalRevenue,
    Status_Bayar: s.isPaid ? 'LUNAS' : 'TEMPO (PIUTANG)',
  }));
  const wsSales = XLSX.utils.json_to_sheet(salesRows);
  XLSX.utils.book_append_sheet(wb, wsSales, '4. Penjualan Pabrik');

  // 5. Sheet Laba Rugi Eksekutif (KHUSUS OWNER)
  if (data.isOwner) {
    const totalPurchases = data.purchases.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const totalSales = data.factorySales.reduce((acc, curr) => acc + curr.totalRevenue, 0);
    const totalOpex = data.opex.reduce((acc, curr) => acc + curr.amount, 0);
    const grossProfit = totalSales - totalPurchases;
    const netProfit = grossProfit - totalOpex;

    const pnlRows = [
      { Metrik_Finansial: 'Total Omzet Penjualan ke Pabrik', Nilai_Rupiah: totalSales },
      { Metrik_Finansial: 'Total Modal Pembelian Rongsok (4 Gudang)', Nilai_Rupiah: totalPurchases },
      { Metrik_Finansial: 'Laba Kotor Transaksi Timbangan', Nilai_Rupiah: grossProfit },
      { Metrik_Finansial: 'Total Beban Operasional Gudang (OPEX)', Nilai_Rupiah: totalOpex },
      { Metrik_Finansial: 'ESTIMASI LABA BERSIH RIIL (NET PROFIT)', Nilai_Rupiah: netProfit },
    ];
    const wsPnL = XLSX.utils.json_to_sheet(pnlRows);
    XLSX.utils.book_append_sheet(wb, wsPnL, '5. Laba Rugi Eksekutif');
  }

  // Trigger browser download
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${fileNamePrefix}_${dateStr}.xlsx`);
}
