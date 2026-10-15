import { localDB } from './dexie-db';
import { supabase, isSupabaseConfigured } from '../supabase/client';
import {
  ScaleTransaction,
  CashShift,
  FactorySale,
  OpexExpense,
  AttendanceRecord,
  Product,
  EmployeeLoan,
  PayrollRecord,
  DebtRecord,
} from '../../types';

export class OfflineSyncService {
  /**
   * Simpan transaksi timbangan (ScaleTransaction + Items + Update Stok Komoditas)
   */
  static async saveScaleTransaction(tx: ScaleTransaction): Promise<{ synced: boolean }> {
    // 1. Simpan selalu ke IndexedDB lokal terlebih dahulu
    try {
      await localDB.scaleTransactions.put({
        ...tx,
        syncStatus: false,
      });
    } catch (e) {
      console.warn('[Sync] Gagal simpan ke IndexedDB lokal:', e);
    }

    // 2. Sync langsung ke Supabase Cloud
    if (typeof navigator !== 'undefined' && navigator.onLine && isSupabaseConfigured) {
      try {
        // A. Insert ke scale_transactions
        const { error: txErr } = await supabase.from('scale_transactions').upsert({
          id: tx.id,
          invoice_number: tx.invoiceNumber,
          warehouse_id: tx.warehouseId,
          cashier_id: tx.cashierId,
          shift_id: tx.shiftId,
          seller_name: tx.sellerName,
          is_partner: tx.isPartner,
          total_amount: tx.totalAmount,
          requires_owner_approval: tx.requiresOwnerApproval || false,
          is_approved_by_owner: tx.isApprovedByOwner || false,
          sync_status: true,
          created_at: tx.createdAt,
        });

        if (txErr) {
          console.warn('[Sync] Supabase saveScaleTransaction error:', txErr.message);
          return { synced: false };
        }

        // B. Insert items ke scale_transaction_items
        if (tx.items && tx.items.length > 0) {
          const itemsPayload = tx.items.map((item) => ({
            id: item.id,
            transaction_id: tx.id,
            product_id: item.productId,
            product_name: item.productName,
            gross_weight_kg: item.grossWeightKg,
            refaction_kg: item.refactionKg,
            refaction_pct: item.refactionPct,
            net_weight_kg: item.netWeightKg,
            price_per_kg: item.pricePerKg,
            subtotal: item.subtotal,
          }));

          await supabase.from('scale_transaction_items').upsert(itemsPayload);

          // C. Tambah stok rongsok masuk pada komoditas terkait
          for (const item of tx.items) {
            const { data: p } = await supabase
              .from('products')
              .select('current_stock_kg')
              .eq('id', item.productId)
              .maybeSingle();

            if (p) {
              const newStock = Number(p.current_stock_kg || 0) + Number(item.netWeightKg);
              await supabase
                .from('products')
                .update({ current_stock_kg: newStock })
                .eq('id', item.productId);
            }
          }
        }

        await localDB.scaleTransactions.update(tx.id, { syncStatus: true });
        return { synced: true };
      } catch (err) {
        console.warn('[Sync] Gagal sync transaksi timbangan ke Supabase:', err);
      }
    }

    return { synced: false };
  }

  /**
   * Setujui Transaksi Jumbo oleh Owner
   */
  static async approveJumboTransaction(txId: string): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.onLine && isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('scale_transactions')
          .update({ is_approved_by_owner: true })
          .eq('id', txId);
        return !error;
      } catch (err) {
        console.warn('[Sync] Gagal approve transaksi jumbo:', err);
      }
    }
    return false;
  }

  /**
   * Simpan absensi (Offline-first write + Supabase cloud sync)
   */
  static async saveAttendance(records: AttendanceRecord[] | AttendanceRecord): Promise<{ synced: boolean }> {
    const list = Array.isArray(records) ? records : [records];
    if (list.length === 0) return { synced: false };

    try {
      await localDB.attendances.bulkPut(list);
    } catch (e) {
      console.warn('[Sync] Gagal simpan absensi ke Dexie:', e);
    }

    if (typeof navigator !== 'undefined' && navigator.onLine && isSupabaseConfigured) {
      try {
        const rows = list.map((r) => ({
          id: r.id,
          employee_id: r.employeeId,
          warehouse_id: r.warehouseId,
          attendance_date: r.attendanceDate,
          shift: r.shift || 'PAGI',
          status: r.status,
          check_in: r.checkIn,
          check_out: r.checkOut,
          created_at: r.createdAt,
        }));

        const { error } = await supabase.from('attendances').upsert(rows, { onConflict: 'id' });
        if (!error) return { synced: true };
      } catch (err) {
        console.warn('[Sync] Gagal upload absensi ke Supabase:', err);
      }
    }

    return { synced: false };
  }

  /**
   * Simpan Master Komoditas (Offline-first write + Supabase cloud sync)
   */
  static async saveProduct(product: Product): Promise<{ synced: boolean }> {
    try {
      await localDB.products.put(product);
    } catch (e) {
      console.warn('[Sync] Gagal simpan produk ke IndexedDB:', e);
    }

    if (typeof navigator !== 'undefined' && navigator.onLine && isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('products').upsert({
          id: product.id,
          name: product.name,
          category: product.category,
          price_regular: product.priceRegular,
          price_partner: product.pricePartner,
          market_price_benchmark: product.marketPriceBenchmark || product.pricePartner + 500,
          current_stock_kg: product.currentStockKg,
          is_active: product.isActive,
          created_at: product.createdAt,
        });

        if (!error) return { synced: true };
      } catch (err) {
        console.warn('[Sync] Gagal upload komoditas ke Supabase:', err);
      }
    }

    return { synced: false };
  }

  /**
   * Update harga komoditas (Offline-first + Supabase sync)
   */
  static async updateProductPrices(
    prodId: string,
    priceRegular: number,
    pricePartner: number,
    benchmark: number
  ): Promise<{ synced: boolean }> {
    try {
      await localDB.products.update(prodId, {
        priceRegular,
        pricePartner,
        marketPriceBenchmark: benchmark,
      });
    } catch (e) {
      console.warn('[Sync] Gagal update harga di IndexedDB:', e);
    }

    if (typeof navigator !== 'undefined' && navigator.onLine && isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('products')
          .update({
            price_regular: priceRegular,
            price_partner: pricePartner,
            market_price_benchmark: benchmark,
          })
          .eq('id', prodId);

        if (!error) return { synced: true };
      } catch (err) {
        console.warn('[Sync] Gagal update harga ke Supabase:', err);
      }
    }

    return { synced: false };
  }

  /**
   * Simpan Shift Kasir (Buka Shift)
   */
  static async saveShift(shift: CashShift): Promise<boolean> {
    try {
      await localDB.cashShifts.put(shift);
    } catch (e) {
      console.warn('[Sync] Gagal simpan shift ke Dexie:', e);
    }

    if (typeof navigator !== 'undefined' && navigator.onLine && isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('cash_shifts').upsert({
          id: shift.id,
          warehouse_id: shift.warehouseId,
          cashier_id: shift.cashierId,
          opened_at: shift.openedAt,
          closed_at: shift.closedAt,
          initial_cash: shift.initialCash,
          expected_closing_cash: shift.expectedClosingCash,
          actual_closing_cash: shift.actualClosingCash,
          cash_difference: shift.cashDifference,
          notes: shift.notes,
        });
        return !error;
      } catch (err) {
        console.warn('[Sync] Gagal simpan shift ke Supabase:', err);
      }
    }
    return false;
  }

  /**
   * Tutup Shift Kasir
   */
  static async closeShift(
    shiftId: string,
    actualClosingCash: number,
    expectedClosingCash: number,
    cashDifference: number,
    notes: string
  ): Promise<boolean> {
    const closedAt = new Date().toISOString();

    try {
      await localDB.cashShifts.update(shiftId, {
        closedAt,
        actualClosingCash,
        expectedClosingCash,
        cashDifference,
        notes,
      });
    } catch (e) {
      console.warn('[Sync] Gagal tutup shift di Dexie:', e);
    }

    if (typeof navigator !== 'undefined' && navigator.onLine && isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('cash_shifts')
          .update({
            closed_at: closedAt,
            actual_closing_cash: actualClosingCash,
            expected_closing_cash: expectedClosingCash,
            cash_difference: cashDifference,
            notes,
          })
          .eq('id', shiftId);
        return !error;
      } catch (err) {
        console.warn('[Sync] Gagal update tutup shift ke Supabase:', err);
      }
    }
    return false;
  }

  /**
   * Simpan Penjualan Stok Gudang / Pabrik (FactorySale + Kurangi Stok)
   */
  static async saveFactorySale(sale: FactorySale): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.onLine && isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('factory_sales').upsert({
          id: sale.id,
          invoice_number: sale.invoiceNumber,
          warehouse_id: sale.warehouseId,
          factory_name: sale.factoryName,
          product_id: sale.productId,
          product_name: sale.productName,
          weight_kg: sale.weightKg,
          contract_price_per_kg: sale.contractPricePerKg,
          total_revenue: sale.totalRevenue,
          is_paid: sale.isPaid,
          payment_method: sale.paymentMethod || 'CASH_LACI',
          created_at: sale.createdAt,
        });

        if (!error) {
          // Kurangi stok komoditas di Supabase
          const { data: p } = await supabase
            .from('products')
            .select('current_stock_kg')
            .eq('id', sale.productId)
            .maybeSingle();

          if (p) {
            const newStock = Math.max(0, Number(p.current_stock_kg || 0) - Number(sale.weightKg));
            await supabase
              .from('products')
              .update({ current_stock_kg: newStock })
              .eq('id', sale.productId);
          }
          return true;
        }
      } catch (err) {
        console.warn('[Sync] Gagal simpan penjualan pabrik ke Supabase:', err);
      }
    }
    return false;
  }

  /**
   * Simpan Biaya Operasional (OPEX)
   */
  static async saveOpex(expense: OpexExpense): Promise<boolean> {
    try {
      await localDB.opexExpenses.put(expense);
    } catch (e) {
      console.warn('[Sync] Gagal simpan opex di Dexie:', e);
    }

    if (typeof navigator !== 'undefined' && navigator.onLine && isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('opex_expenses').upsert({
          id: expense.id,
          warehouse_id: expense.warehouseId,
          category: expense.category,
          amount: expense.amount,
          description: expense.description,
          receipt_image: null,
          recorded_by: expense.recordedBy,
          created_at: expense.createdAt,
        });
        return !error;
      } catch (err) {
        console.warn('[Sync] Gagal simpan OPEX ke Supabase:', err);
      }
    }
    return false;
  }

  /**
   * Simpan Kasbon Karyawan
   */
  static async saveLoan(loan: EmployeeLoan): Promise<boolean> {
    try {
      await localDB.employeeLoans.put(loan);
    } catch (e) {
      console.warn('[Sync] Gagal simpan loan ke Dexie:', e);
    }

    if (typeof navigator !== 'undefined' && navigator.onLine && isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('employee_loans').upsert({
          id: loan.id,
          employee_id: loan.employeeId,
          warehouse_id: loan.warehouseId,
          loan_date: loan.loanDate,
          amount: loan.amount,
          remaining_amount: loan.remainingAmount !== undefined ? loan.remainingAmount : loan.amount,
          is_deducted: loan.isDeducted,
          notes: loan.notes,
          created_at: loan.createdAt,
        });
        return !error;
      } catch (err) {
        console.warn('[Sync] Gagal simpan loan ke Supabase:', err);
      }
    }
    return false;
  }

  /**
   * Update Sisa Kasbon Karyawan (setelah dipotong saat gajian)
   */
  static async updateLoan(loanId: string, remainingAmount: number, isDeducted: boolean): Promise<boolean> {
    try {
      await localDB.employeeLoans.update(loanId, { remainingAmount, isDeducted });
    } catch (e) {
      console.warn('[Sync] Gagal update loan di Dexie:', e);
    }

    if (typeof navigator !== 'undefined' && navigator.onLine && isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('employee_loans')
          .update({
            remaining_amount: remainingAmount,
            is_deducted: isDeducted,
          })
          .eq('id', loanId);
        return !error;
      } catch (err) {
        console.warn('[Sync] Gagal update loan ke Supabase:', err);
      }
    }
    return false;
  }

  /**
   * Simpan Slip Penggajian (Payroll)
   */
  static async savePayroll(payroll: PayrollRecord): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.onLine && isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('payrolls').upsert({
          id: payroll.id,
          employee_id: payroll.employeeId,
          warehouse_id: payroll.warehouseId,
          employee_name: payroll.employeeName,
          payment_date: payroll.paymentDate,
          base_salary: payroll.baseSalary,
          loan_deduction: payroll.loanDeduction,
          deducted_loan: payroll.loanDeduction,
          net_salary: payroll.netSalary,
          net_pay: payroll.netSalary,
          remaining_loan: payroll.remainingLoan,
          notes: payroll.notes,
          recorded_by: payroll.recordedBy,
          created_at: payroll.createdAt,
        });
        return !error;
      } catch (err) {
        console.warn('[Sync] Gagal simpan payroll ke Supabase:', err);
      }
    }
    return false;
  }

  /**
   * Simpan Data Hutang / Piutang
   */
  static async saveDebt(debt: DebtRecord): Promise<boolean> {
    try {
      await localDB.debts.put(debt);
    } catch (e) {
      console.warn('[Sync] Gagal simpan debt di Dexie:', e);
    }

    if (typeof navigator !== 'undefined' && navigator.onLine && isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('debts').upsert({
          id: debt.id,
          type: debt.type,
          entity_name: debt.entityName,
          reference_invoice: debt.referenceInvoice,
          warehouse_id: debt.warehouseId,
          total_amount: debt.totalAmount,
          paid_amount: debt.paidAmount,
          remaining_amount: debt.remainingAmount,
          due_date: debt.dueDate,
          status: debt.status,
          notes: debt.notes,
          created_at: debt.createdAt,
        });
        return !error;
      } catch (err) {
        console.warn('[Sync] Gagal simpan debt ke Supabase:', err);
      }
    }
    return false;
  }

  /**
   * Pembayaran Hutang / Piutang (Cicil / Lunas)
   */
  static async payDebt(
    debtId: string,
    paidAmount: number,
    remainingAmount: number,
    status: string
  ): Promise<boolean> {
    try {
      await localDB.debts.update(debtId, { paidAmount, remainingAmount, status: status as DebtRecord['status'] });
    } catch (e) {
      console.warn('[Sync] Gagal update debt di Dexie:', e);
    }

    if (typeof navigator !== 'undefined' && navigator.onLine && isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('debts')
          .update({
            paid_amount: paidAmount,
            remaining_amount: remainingAmount,
            status,
          })
          .eq('id', debtId);
        return !error;
      } catch (err) {
        console.warn('[Sync] Gagal update debt ke Supabase:', err);
      }
    }
    return false;
  }

  /**
   * Sync semua antrean transaksi lokal yang tertunda ke Supabase
   */
  static async syncPendingTransactions(): Promise<number> {
    if (typeof navigator === 'undefined' || !navigator.onLine || !isSupabaseConfigured) return 0;

    const pending = await localDB.scaleTransactions.where('syncStatus').equals(0).toArray();
    let syncedCount = 0;

    for (const tx of pending) {
      const res = await this.saveScaleTransaction(tx);
      if (res.synced) syncedCount++;
    }

    return syncedCount;
  }
}
