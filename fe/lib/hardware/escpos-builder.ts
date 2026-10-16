// Thermal Receipt ESC/POS Builder for 58mm / 80mm printers
import { ScaleTransaction } from '../../types';

export function buildThermalReceiptESC(transaction: ScaleTransaction, warehouseName: string): string {
  const lineDivider = '--------------------------------\n';
  const doubleDivider = '================================\n';

  let receipt = '';
  // Header
  receipt += '          PT DAVID\n';
  receipt += `       ${warehouseName}\n`;
  receipt += '   SISTEM ERP TIMBANGAN RONGSOK\n';
  receipt += doubleDivider;

  // Metadata
  receipt += `No. Nota : ${transaction.invoiceNumber}\n`;
  receipt += `Tanggal  : ${new Date(transaction.createdAt).toLocaleString('id-ID')}\n`;
  receipt += `Penjual  : ${transaction.sellerName} ${transaction.isPartner ? '(LANGGANAN)' : ''}\n`;
  receipt += lineDivider;

  // Items
  receipt += 'Barang            Berat    Subtotal\n';
  receipt += lineDivider;

  for (const item of transaction.items) {
    const name = (item.productName || 'Komoditas').padEnd(16, ' ').slice(0, 16);
    const weight = `${item.netWeightKg}kg`.padEnd(8, ' ');
    const subtotal = `Rp${item.subtotal.toLocaleString('id-ID')}`;
    receipt += `${name} ${weight} ${subtotal}\n`;

    if (item.refactionKg > 0 || item.refactionPct > 0) {
      const pot = item.refactionKg > 0 ? `${item.refactionKg}kg` : `${item.refactionPct}%`;
      receipt += `  *Gross: ${item.grossWeightKg}kg | Potongan: ${pot}\n`;
    }
  }

  receipt += doubleDivider;
  receipt += `TOTAL BAYAR: Rp${transaction.totalAmount.toLocaleString('id-ID')}\n`;
  receipt += doubleDivider;
  receipt += '      TERIMA KASIH ATAS KERJASAMANYA\n';
  receipt += '   Barang yang sudah ditimbang & dibayar\n';
  receipt += '       tidak dapat dibatalkan.\n\n\n';

  return receipt;
}

export function printThermalReceipt(receiptText: string): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const printWindow = window.open('', '_blank', 'width=350,height=600');
    if (!printWindow) {
      console.warn('Pop-up cetak struk diblokir oleh browser.');
      return false;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Struk Nota</title>
          <style>
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 12px;
              line-height: 1.3;
              margin: 10px;
              white-space: pre-wrap;
              color: #000;
            }
            @media print {
              @page { margin: 0; }
              body { margin: 5mm; }
            }
          </style>
        </head>
        <body>${receiptText}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      try {
        printWindow.print();
        printWindow.close();
      } catch (e) {
        console.warn('Gagal memicu perintah print:', e);
      }
    }, 250);
    return true;
  } catch (err) {
    console.warn('Gagal membuka jendela cetak struk:', err);
    return false;
  }
}
