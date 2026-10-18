'use client';

import React, { useState } from 'react';
import { Sidebar } from '../components/layout/sidebar';
import { KasirPos } from '../components/pos/kasir-pos';
import { WarehouseSalesManagement } from '../components/sales/warehouse-sales';
import { ShiftManagement } from '../components/shifts/shift-management';
import { AttendanceManagement } from '../components/attendance/attendance-management';
import { OwnerDashboard } from '../components/owner/owner-dashboard';
import { OpexManagement } from '../components/opex/opex-management';
import { StockMutationManagement } from '../components/mutation/stock-mutation';
import { DebtReceivableManagement } from '../components/debt/debt-receivable';
import { EmployeeManagement } from '../components/employees/employee-management';
import { ProfileIdentity } from '../components/profile/profile-identity';
import { ExecutiveDashboardOverview } from '../components/owner/executive-overview';
import {
  MOCK_WAREHOUSES,
  MOCK_PRODUCTS,
  MOCK_ACTIVE_SHIFT,
  MOCK_RECENT_TRANSACTIONS,
  MOCK_EMPLOYEES,
  MOCK_EMPLOYEE_LOANS,
  MOCK_ATTENDANCES,
  MOCK_OPEX,
  MOCK_MUTATIONS,
  MOCK_DEBTS,
  MOCK_FACTORY_SALES,
} from '../lib/mock/data';
import {
  UserRole,
  ScaleTransaction,
  CashShift,
  AttendanceStatus,
  WorkShift,
  EmployeeLoan,
  AttendanceRecord,
  OpexExpense,
  StockMutation,
  DebtRecord,
  MutationStatus,
  FactorySale,
  Product,
  PayrollRecord,
  Employee,
} from '../types';
import { Sparkles, Sun, Moon, LogOut, ShieldCheck, User } from 'lucide-react';
import { OfflineSyncService } from '../lib/db/sync-service';
import { localDB } from '../lib/db/dexie-db';
import { LoginPanel } from '../components/auth/login-panel';
import { useToast } from '../components/ui/toast-notification';
import { useScaleSerial } from '../lib/hardware/use-scale-serial';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client';

export default function Home() {
  const { success, info } = useToast();
  
  // Theme State: Default selalu Light Mode setiap kali masuk website
  const [isDark, setIsDark] = useState<boolean>(false);

  React.useEffect(() => {
    try {
      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('dark');
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('gc_theme');
      }
    } catch (e) {
      console.warn('Gagal mengatur tema default light:', e);
    }
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        if (next) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) {
        console.warn('Gagal mengubah preferensi tema:', e);
      }
      return next;
    });
  };
  
  // Auth State: inisialisasi langsung dari sessionStorage agar tidak re-render cascading
  const [currentUser, setCurrentUser] = useState<{ fullName: string; role: UserRole; username: string } | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const sessionUser = sessionStorage.getItem('gc_kuningan_auth_user');
      return sessionUser ? JSON.parse(sessionUser) : null;
    } catch {
      return null;
    }
  });
  const [isAuthChecked, setIsAuthChecked] = useState<boolean>(() => typeof window !== 'undefined');
  const [activeRole, setActiveRole] = useState<UserRole>(() => {
    if (typeof window === 'undefined') return 'ADMIN';
    try {
      const sessionUser = sessionStorage.getItem('gc_kuningan_auth_user');
      return sessionUser ? (JSON.parse(sessionUser).role as UserRole) : 'ADMIN';
    } catch {
      return 'ADMIN';
    }
  });
  const [activeWarehouseId, setActiveWarehouseId] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Application state (Di-reset bersih untuk simulasi manual langsung dari 0)
  const [products, setProducts] = useState<Product[]>(() =>
    MOCK_PRODUCTS.map((p) => ({ ...p, currentStockKg: 0 }))
  );
  const [transactions, setTransactions] = useState<ScaleTransaction[]>([]);
  const [salesList, setSalesList] = useState<FactorySale[]>([]);
  const [activeShift, setActiveShift] = useState<CashShift | null>(null);
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [loans, setLoans] = useState<EmployeeLoan[]>([]);
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [opexList, setOpexList] = useState<OpexExpense[]>([]);
  const [mutations, setMutations] = useState<StockMutation[]>([]);
  const [debts, setDebts] = useState<DebtRecord[]>([]);
  const [syncTick, setSyncTick] = useState<number>(0);
  const triggerRefresh = () => setSyncTick((prev) => prev + 1);

  // Status koneksi hardware timbangan global untuk sinkronisasi sidebar
  const scaleController = useScaleSerial({ mockMode: false });

  // Status koneksi internet nyata (bukan hardcode)
  const [isOnline, setIsOnline] = useState<boolean>(true);
  React.useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  const activeWarehouse = MOCK_WAREHOUSES.find((w) => w.id === activeWarehouseId) || MOCK_WAREHOUSES[0];

  // Inisialisasi: baca lokal Dexie & sinkronisasi Supabase Real-Time
  React.useEffect(() => {
    // Bersihkan legacy storage
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('gc_kuningan_auth_user');
      }
    } catch {
      // ignore
    }

    // 1. Muat data cepat dari IndexedDB lokal
    async function loadLocalDB() {
      try {
        const localTxs = await localDB.scaleTransactions.toArray();
        if (localTxs.length > 0) {
          setTransactions((prev) => {
            const ids = new Set(localTxs.map((t) => t.id));
            const merged = [...localTxs, ...prev.filter((t) => !ids.has(t.id))];
            return merged;
          });
        }

        const localSales = await localDB.factorySales.toArray();
        if (localSales.length > 0) {
          setSalesList((prev) => {
            const ids = new Set(localSales.map((s) => s.id));
            return [...localSales, ...prev.filter((s) => !ids.has(s.id))];
          });
        }

        const localAtts = await localDB.attendances.toArray();
        if (localAtts.length > 0) {
          setAttendances((prev) => {
            const ids = new Set(localAtts.map((a) => a.id));
            return [...localAtts, ...prev.filter((a) => !ids.has(a.id))];
          });
        }

        const localProds = await localDB.products.toArray();
        if (localProds.length > 0) {
          setProducts((prev) => {
            const ids = new Set(localProds.map((p) => p.id));
            return [...localProds, ...prev.filter((p) => !ids.has(p.id))];
          });
        }

        const localShifts = await localDB.cashShifts.toArray();
        if (localShifts.length > 0) {
          const unclosed = localShifts.find((s) => s.closedAt === null);
          if (unclosed) setActiveShift(unclosed);
        }

        const localLoans = await localDB.employeeLoans.toArray();
        if (localLoans.length > 0) setLoans(localLoans);

        const localEmps = await localDB.employees.toArray();
        if (localEmps.length > 0) {
          setEmployees((prev) => {
            const ids = new Set(localEmps.map((e) => e.id));
            return [...localEmps, ...prev.filter((e) => !ids.has(e.id))];
          });
        }

        const localPayrolls = await localDB.payrolls.toArray();
        if (localPayrolls.length > 0) setPayrolls(localPayrolls);

        const localOpex = await localDB.opexExpenses.toArray();
        if (localOpex.length > 0) setOpexList(localOpex);

        const localDebts = await localDB.debts.toArray();
        if (localDebts.length > 0) setDebts(localDebts);
      } catch (e) {
        console.warn('Gagal membaca IndexedDB lokal:', e);
      }
    }

    // 2. Muat data dinamis langsung dari Supabase Cloud
    async function loadSupabaseData() {
      if (!isSupabaseConfigured) return;
      try {
        // Ambil Produk dari Supabase
        const { data: dbProds, error: pErr } = await supabase
          .from('products')
          .select('*')
          .order('name');
        if (dbProds && dbProds.length > 0 && !pErr) {
          const mappedProds: Product[] = dbProds.map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            priceRegular: Number(p.price_regular),
            pricePartner: Number(p.price_partner),
            marketPriceBenchmark: Number(p.market_price_benchmark || p.price_partner + 500),
            currentStockKg: Number(p.current_stock_kg || 0),
            isActive: Boolean(p.is_active),
            createdAt: p.created_at,
          }));
          setProducts(mappedProds);
          await localDB.products.bulkPut(mappedProds);
        }

        // Ambil Karyawan dari Supabase
        const { data: dbEmps, error: eErr } = await supabase
          .from('employees')
          .select('*')
          .order('full_name');
        if (dbEmps && dbEmps.length > 0 && !eErr) {
          const mappedEmps: Employee[] = dbEmps.map((e) => ({
            id: e.id,
            fullName: e.full_name,
            warehouseId: Number(e.warehouse_id),
            position: e.position,
            isActive: Boolean(e.is_active),
            phone: e.phone,
            createdAt: e.created_at || new Date().toISOString(),
          }));
          setEmployees(mappedEmps);
        }

        // Ambil Absensi dari Supabase
        const { data: dbAtts, error: aErr } = await supabase
          .from('attendances')
          .select('*')
          .order('created_at', { ascending: false });
        if (dbAtts && dbAtts.length > 0 && !aErr) {
          const mappedAtts: AttendanceRecord[] = dbAtts.map((a) => ({
            id: a.id,
            employeeId: a.employee_id,
            employeeName: a.employee_name || 'Karyawan',
            warehouseId: Number(a.warehouse_id),
            attendanceDate: a.attendance_date,
            shift: (a.shift as WorkShift) || 'PAGI',
            checkIn: a.check_in,
            checkOut: a.check_out,
            status: a.recorded_by === 'STATUS_OFF' || a.status === 'OFF' ? 'OFF' : (a.status as AttendanceStatus),
            recordedBy: a.recorded_by === 'STATUS_OFF' ? 'Admin Gudang' : (a.recorded_by || 'Admin Gudang'),
            createdAt: a.created_at,
          }));
          setAttendances(mappedAtts);
          await localDB.attendances.bulkPut(mappedAtts);
        } else if (dbAtts && dbAtts.length === 0) {
          setAttendances([]);
          await localDB.attendances.clear();
        }

        // Ambil Transaksi Timbangan & Detail Item dari Supabase
        const { data: dbTxs, error: tErr } = await supabase
          .from('scale_transactions')
          .select('*, scale_transaction_items(*)')
          .order('created_at', { ascending: false });

        if (dbTxs && dbTxs.length > 0 && !tErr) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mappedTxs: ScaleTransaction[] = dbTxs.map((t: any) => ({
            id: t.id,
            invoiceNumber: t.invoice_number,
            warehouseId: Number(t.warehouse_id),
            cashierId: t.cashier_id,
            shiftId: t.shift_id,
            sellerName: t.seller_name,
            isPartner: Boolean(t.is_partner),
            totalAmount: Number(t.total_amount),
            requiresOwnerApproval: Boolean(t.requires_owner_approval),
            isApprovedByOwner: Boolean(t.is_approved_by_owner),
            syncStatus: Boolean(t.sync_status),
            createdAt: t.created_at,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            items: (t.scale_transaction_items || []).map((i: any) => ({
              id: i.id,
              transactionId: i.transaction_id,
              productId: i.product_id,
              productName: i.product_name,
              grossWeightKg: Number(i.gross_weight_kg),
              refactionKg: Number(i.refaction_kg || 0),
              refactionPct: Number(i.refaction_pct || 0),
              netWeightKg: Number(i.net_weight_kg),
              pricePerKg: Number(i.price_per_kg),
              subtotal: Number(i.subtotal),
            })),
          }));
          setTransactions(mappedTxs);
          await localDB.scaleTransactions.bulkPut(mappedTxs);
        } else if (dbTxs && dbTxs.length === 0) {
          setTransactions([]);
          await localDB.scaleTransactions.clear();
        }

        // Ambil Shift Kasir dari Supabase
        const { data: dbShifts, error: sErr } = await supabase
          .from('cash_shifts')
          .select('*')
          .order('opened_at', { ascending: false })
          .limit(20);

        if (dbShifts && dbShifts.length > 0 && !sErr) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const unclosed = dbShifts.find((s: any) => s.closed_at === null);
          if (unclosed) {
            setActiveShift({
              id: unclosed.id,
              warehouseId: Number(unclosed.warehouse_id),
              cashierId: unclosed.cashier_id,
              openedAt: unclosed.opened_at,
              closedAt: unclosed.closed_at,
              initialCash: Number(unclosed.initial_cash || 0),
              expectedClosingCash: unclosed.expected_closing_cash !== null ? Number(unclosed.expected_closing_cash) : null,
              actualClosingCash: unclosed.actual_closing_cash !== null ? Number(unclosed.actual_closing_cash) : null,
              cashDifference: unclosed.cash_difference !== null ? Number(unclosed.cash_difference) : null,
              notes: unclosed.notes || '',
            });
          } else {
            setActiveShift(null);
          }
        } else if (dbShifts && dbShifts.length === 0) {
          setActiveShift(null);
          await localDB.cashShifts.clear();
        }

        // Ambil Penjualan Pabrik dari Supabase
        const { data: dbSales, error: salErr } = await supabase
          .from('factory_sales')
          .select('*')
          .order('created_at', { ascending: false });

        if (dbSales && dbSales.length > 0 && !salErr) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mappedSales: FactorySale[] = dbSales.map((s: any) => ({
            id: s.id,
            invoiceNumber: s.invoice_number,
            warehouseId: Number(s.warehouse_id),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            buyerType: (s.buyer_type as any) || 'PELEBURAN_BESAR',
            factoryName: s.factory_name,
            productId: s.product_id,
            productName: s.product_name,
            weightKg: Number(s.weight_kg),
            contractPricePerKg: Number(s.contract_price_per_kg),
            totalRevenue: Number(s.total_revenue),
            isPaid: Boolean(s.is_paid),
            paymentMethod: s.payment_method || 'CASH_LACI',
            createdAt: s.created_at,
          }));
          setSalesList(mappedSales);
          await localDB.factorySales.bulkPut(mappedSales);
        } else if (dbSales && dbSales.length === 0) {
          setSalesList([]);
          await localDB.factorySales.clear();
        }

        // Ambil Biaya Operasional (OPEX) dari Supabase
        const { data: dbOpex, error: oErr } = await supabase
          .from('opex_expenses')
          .select('*')
          .order('created_at', { ascending: false });

        if (dbOpex && dbOpex.length > 0 && !oErr) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mappedOpex: OpexExpense[] = dbOpex.map((o: any) => ({
            id: o.id,
            warehouseId: Number(o.warehouse_id),
            category: o.category,
            amount: Number(o.amount),
            description: o.description,
            receiptImage: o.receipt_image,
            recordedBy: o.recorded_by,
            createdAt: o.created_at,
          }));
          setOpexList(mappedOpex);
          await localDB.opexExpenses.bulkPut(mappedOpex);
        } else if (dbOpex && dbOpex.length === 0) {
          setOpexList([]);
          await localDB.opexExpenses.clear();
        }

        // Ambil Kasbon Karyawan dari Supabase
        const { data: dbLoans, error: lErr } = await supabase
          .from('employee_loans')
          .select('*')
          .order('created_at', { ascending: false });

        if (dbLoans && dbLoans.length > 0 && !lErr) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mappedLoans: EmployeeLoan[] = dbLoans.map((l: any) => ({
            id: l.id,
            employeeId: l.employee_id,
            employeeName: l.employee_name || 'Karyawan',
            warehouseId: Number(l.warehouse_id),
            loanDate: l.loan_date,
            amount: Number(l.amount),
            remainingAmount: Number(l.remaining_amount !== undefined && l.remaining_amount !== null ? l.remaining_amount : l.amount),
            isDeducted: Boolean(l.is_deducted),
            notes: l.notes,
            createdAt: l.created_at,
          }));
          setLoans(mappedLoans);
          await localDB.employeeLoans.bulkPut(mappedLoans);
        } else if (dbLoans && dbLoans.length === 0) {
          setLoans([]);
          await localDB.employeeLoans.clear();
        }

        // Ambil Riwayat Penggajian dari Supabase
        const { data: dbPayrolls, error: payErr } = await supabase
          .from('payrolls')
          .select('*')
          .order('created_at', { ascending: false });

        if (dbPayrolls && dbPayrolls.length > 0 && !payErr) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mappedPayrolls: PayrollRecord[] = dbPayrolls.map((p: any) => ({
            id: p.id,
            employeeId: p.employee_id,
            employeeName: p.employee_name,
            warehouseId: Number(p.warehouse_id),
            paymentDate: p.payment_date || p.period_end || (p.created_at ? p.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10)),
            baseSalary: Number(p.base_salary || 0),
            loanDeduction: Number(p.loan_deduction || p.deducted_loan || 0),
            netSalary: Number(p.net_salary || p.net_pay || 0),
            remainingLoan: Number(p.remaining_loan || 0),
            notes: p.notes,
            recordedBy: p.recorded_by || 'Admin Gudang',
            createdAt: p.created_at,
          }));
          setPayrolls(mappedPayrolls);
        } else if (dbPayrolls && dbPayrolls.length === 0) {
          setPayrolls([]);
        }

        // Ambil Hutang & Piutang dari Supabase
        const { data: dbDebts, error: dErr } = await supabase
          .from('debts')
          .select('*')
          .order('created_at', { ascending: false });

        if (dbDebts && dbDebts.length > 0 && !dErr) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mappedDebts: DebtRecord[] = dbDebts.map((d: any) => ({
            id: d.id,
            type: d.type,
            entityName: d.entity_name,
            referenceInvoice: d.reference_invoice || '-',
            warehouseId: Number(d.warehouse_id || 1),
            totalAmount: Number(d.total_amount),
            paidAmount: Number(d.paid_amount),
            remainingAmount: Number(d.remaining_amount),
            dueDate: d.due_date,
            status: d.status,
            notes: d.notes,
            createdAt: d.created_at,
          }));
          setDebts(mappedDebts);
          await localDB.debts.bulkPut(mappedDebts);
        } else if (dbDebts && dbDebts.length === 0) {
          setDebts([]);
          await localDB.debts.clear();
        }
      } catch (err) {
        console.warn('Gagal sinkronisasi data dari Supabase:', err);
      }
    }

    loadLocalDB();
    loadSupabaseData();

    // 3. Realtime Subscription Channel Supabase
    let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
    if (isSupabaseConfigured) {
      realtimeChannel = supabase
        .channel('public:realtime_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'scale_transactions' },
          () => {
            loadSupabaseData();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'scale_transaction_items' },
          () => {
            loadSupabaseData();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'factory_sales' },
          () => {
            loadSupabaseData();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'products' },
          () => {
            loadSupabaseData();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'cash_shifts' },
          () => {
            loadSupabaseData();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'attendances' },
          () => {
            loadSupabaseData();
          }
        )
        .subscribe();
    }

    // Auto-polling dinamis tiap 10 detik agar data selalu up-to-date antar perangkat / kasir & owner
    const pollTimer = setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine && isSupabaseConfigured) {
        loadSupabaseData();
      }
    }, 10000);

    const handleFocus = () => {
      if (typeof navigator !== 'undefined' && navigator.onLine && isSupabaseConfigured) {
        loadSupabaseData();
      }
    };

    // Auto-sync antrean tertunda jika terhubung internet
    const handleOnline = () => {
      OfflineSyncService.syncPendingTransactions().then((count) => {
        if (count > 0) info(`Berhasil sinkronisasi ${count} transaksi tertunda ke Supabase`);
      });
      loadSupabaseData();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('focus', handleFocus);
      clearInterval(pollTimer);
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [info, syncTick]);

  const handleLoginSuccess = (user: { fullName: string; role: UserRole; username: string }) => {
    setCurrentUser(user);
    setActiveRole(user.role);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('gc_kuningan_auth_user', JSON.stringify(user));
      localStorage.removeItem('gc_kuningan_auth_user');
    }
    if (user.role === 'ADMIN') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('dashboard');
    }
    success(`Selamat datang, ${user.fullName}`, 'Login Berhasil');
  };

  const handleUpdateUserProfile = (updated: { fullName: string; role: UserRole; username: string }) => {
    setCurrentUser(updated);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('gc_kuningan_auth_user', JSON.stringify(updated));
    }
  };

  const handleLogout = () => {
    if (confirm('Keluar dari sistem Green Cycle Kuningan?')) {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('gc_kuningan_auth_user');
        localStorage.removeItem('gc_kuningan_auth_user');
      }
      setCurrentUser(null);
      setActiveRole('ADMIN');
      setActiveTab('pos');
      info('Anda telah keluar dari sistem.', 'Logout Berhasil');
    }
  };

  // Guard role: Jika role kasir (ADMIN), tab khusus Owner diarahkan ke kasir
  const isOwnerOnlyTab = activeTab === 'owner' || activeTab === 'employees' || activeTab === 'debts';
  const effectiveTab = activeRole === 'ADMIN' && isOwnerOnlyTab ? 'pos' : activeTab;

  // Kas keluar belanja timbangan pada shift aktif gudang ini
  const totalExpenseToday = transactions
    .filter((t) => t.warehouseId === activeWarehouseId)
    .reduce((acc, t) => acc + t.totalAmount, 0);

  // Biaya operasional (OPEX) gudang ini hari ini
  const totalOpexToday = opexList
    .filter((o) => o.warehouseId === activeWarehouseId)
    .reduce((acc, o) => acc + o.amount, 0);

  // Kas masuk penjualan tunai ke laci pada hari ini
  const totalCashInSalesToday = salesList
    .filter((s) => s.warehouseId === activeWarehouseId && s.paymentMethod === 'CASH_LACI' && s.isPaid)
    .reduce((acc, s) => acc + s.totalRevenue, 0);

  // Handlers
  const handleSaveTransaction = async (newTx: ScaleTransaction) => {
    // 1. Simpan ke local state UI
    setTransactions((prev) => [newTx, ...prev]);

    // Tambah stok komoditas di local state UI (Akumulasi barang siap jual)
    if (newTx.items && newTx.items.length > 0) {
      setProducts((prev) =>
        prev.map((p) => {
          const addedKg = newTx.items
            .filter((i) => i.productId === p.id)
            .reduce((sum, i) => sum + Number(i.netWeightKg || 0), 0);
          if (addedKg > 0) {
            return {
              ...p,
              currentStockKg: Number(((p.currentStockKg || 0) + addedKg).toFixed(2)),
            };
          }
          return p;
        })
      );
    }

    // 2. Simpan aman ke IndexedDB + Sync Supabase
    await OfflineSyncService.saveScaleTransaction(newTx);
    triggerRefresh();
  };

  const handleAddSale = async (newSale: FactorySale) => {
    setSalesList((prev) => [newSale, ...prev.filter((s) => s.id !== newSale.id)]);
    // Kurangi stok komoditas di local state UI
    setProducts((prev) =>
      prev.map((p) =>
        p.id === newSale.productId
          ? { ...p, currentStockKg: Math.max(0, Number(((p.currentStockKg || 0) - Number(newSale.weightKg || 0)).toFixed(2))) }
          : p
      )
    );
    await OfflineSyncService.saveFactorySale(newSale);
    triggerRefresh();
  };

  const handleOpenShift = async (initialCash: number, notes: string) => {
    const newShift: CashShift = {
      id: `shift-${Date.now()}`,
      warehouseId: activeWarehouseId,
      cashierId: currentUser ? currentUser.fullName : 'Kasir Gudang',
      openedAt: new Date().toISOString(),
      closedAt: null,
      initialCash,
      expectedClosingCash: null,
      actualClosingCash: null,
      cashDifference: null,
      notes,
    };
    setActiveShift(newShift);
    await OfflineSyncService.saveShift(newShift);
    success(`Shift kasir dibuka dengan modal Rp${initialCash.toLocaleString('id-ID')}`, 'Shift Dibuka');
  };

  const handleUpdateInitialCash = async (newAmount: number) => {
    if (!activeShift) return;
    const updated = { ...activeShift, initialCash: newAmount };
    setActiveShift(updated);
    await OfflineSyncService.saveShift(updated);
    success(`Modal kas berhasil diperbarui menjadi Rp${newAmount.toLocaleString('id-ID')}`, 'Update Modal Kas');
  };

  const handleCloseShift = async (actualClosingCash: number, notes: string) => {
    if (!activeShift) return;
    const expected = Math.max(0, activeShift.initialCash + totalCashInSalesToday - totalExpenseToday);
    const diff = actualClosingCash - expected;

    await OfflineSyncService.closeShift(activeShift.id, actualClosingCash, expected, diff, notes);
    setActiveShift(null);
    info(
      `Fisik Kas: Rp${actualClosingCash.toLocaleString('id-ID')} | Selisih: Rp${diff.toLocaleString('id-ID')}`,
      'Shift Kasir Ditutup'
    );
  };

  const handleUpdateAttendance = (empId: string, status: AttendanceStatus, shift: WorkShift = 'PAGI') => {
    const today = new Date().toISOString().slice(0, 10);
    const emp = employees.find((e) => e.id === empId);

    setAttendances((prev) => {
      const exists = prev.find(
        (a) => a.employeeId === empId && a.attendanceDate === today && (a.shift === shift || (!a.shift && shift === 'PAGI'))
      );
      let updated: AttendanceRecord[];
      let targetRecord: AttendanceRecord;

      if (exists) {
        targetRecord = { ...exists, status, shift };
        updated = prev.map((a) => (a.id === exists.id ? targetRecord : a));
      } else {
        targetRecord = {
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          employeeId: empId,
          employeeName: emp?.fullName,
          warehouseId: activeWarehouseId,
          attendanceDate: today,
          shift,
          checkIn: new Date().toISOString(),
          checkOut: null,
          status,
          recordedBy: currentUser ? currentUser.fullName : 'Admin Gudang',
          createdAt: new Date().toISOString(),
        };
        updated = [...prev, targetRecord];
      }

      OfflineSyncService.saveAttendance(targetRecord);
      return updated;
    });
  };

  const handleBulkUpdateAllAttendance = (status: AttendanceStatus, shift: WorkShift = 'PAGI') => {
    const today = new Date().toISOString().slice(0, 10);
    const warehouseEmps = employees.filter((e) => e.warehouseId === activeWarehouseId);
    const toSave: AttendanceRecord[] = [];

    setAttendances((prev) => {
      const updated = [...prev];
      warehouseEmps.forEach((emp) => {
        const existingIndex = updated.findIndex(
          (a) => a.employeeId === emp.id && a.attendanceDate === today && (a.shift === shift || (!a.shift && shift === 'PAGI'))
        );
        if (existingIndex >= 0) {
          const rec = { ...updated[existingIndex], status, shift };
          updated[existingIndex] = rec;
          toSave.push(rec);
        } else {
          const rec: AttendanceRecord = {
            id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            employeeId: emp.id,
            employeeName: emp.fullName,
            warehouseId: activeWarehouseId,
            attendanceDate: today,
            shift,
            checkIn: new Date().toISOString(),
            checkOut: null,
            status,
            recordedBy: currentUser ? currentUser.fullName : 'Admin Gudang',
            createdAt: new Date().toISOString(),
          };
          updated.push(rec);
          toSave.push(rec);
        }
      });

      if (toSave.length > 0) {
        OfflineSyncService.saveAttendance(toSave);
      }
      return updated;
    });

    success(
      `${warehouseEmps.length} karyawan Gudang ${activeWarehouseId} hadir shift ${shift} tersimpan aman`,
      'Absensi Tersimpan'
    );
  };

  const handleAddLoan = async (empId: string, amount: number, notes: string) => {
    const emp = employees.find((e) => e.id === empId);
    const newLoan: EmployeeLoan = {
      id: `loan-${Date.now()}`,
      employeeId: empId,
      employeeName: emp?.fullName || 'Karyawan',
      warehouseId: activeWarehouseId,
      loanDate: new Date().toISOString().slice(0, 10),
      amount,
      remainingAmount: amount,
      isDeducted: false,
      notes,
      createdAt: new Date().toISOString(),
    };
    setLoans((prev) => [newLoan, ...prev]);
    await OfflineSyncService.saveLoan(newLoan);
    success(`Kasbon untuk ${newLoan.employeeName} sebesar Rp${amount.toLocaleString('id-ID')} dicatat`, 'Kasbon Dicatat');
  };

  const handlePaySalary = async (
    recordOrEmpId: string | PayrollRecord,
    baseSalaryArg?: number,
    loanDeductionArg?: number,
    notesArg?: string
  ) => {
    let record: PayrollRecord;
    let loanDeduction = 0;
    let empId = '';

    if (typeof recordOrEmpId === 'string') {
      empId = recordOrEmpId;
      const emp = employees.find((e) => e.id === empId);
      const baseSalary = baseSalaryArg || 0;
      loanDeduction = loanDeductionArg || 0;
      const netSalary = Math.max(0, baseSalary - loanDeduction);
      const currentEmpLoan = loans
        .filter((l) => l.employeeId === empId && !l.isDeducted)
        .reduce((acc, l) => acc + (l.remainingAmount !== undefined ? l.remainingAmount : l.amount), 0);
      const remainingLoan = Math.max(0, currentEmpLoan - loanDeduction);

      record = {
        id: `pay-${Date.now()}`,
        employeeId: empId,
        employeeName: emp?.fullName || 'Karyawan',
        warehouseId: activeWarehouseId,
        paymentDate: new Date().toISOString().slice(0, 10),
        baseSalary,
        loanDeduction,
        netSalary,
        remainingLoan,
        notes: notesArg || '',
        recordedBy: currentUser ? currentUser.fullName : 'Admin Gudang',
        createdAt: new Date().toISOString(),
      };
    } else {
      record = recordOrEmpId;
      empId = record.employeeId;
      loanDeduction = record.loanDeduction;
    }

    setPayrolls((prev) => [record, ...prev]);
    await OfflineSyncService.savePayroll(record);

    // Update sisa kasbon di local state & Supabase jika ada potongan
    if (loanDeduction > 0) {
      setLoans((prev) => {
        let toDeduct = loanDeduction;
        return prev.map((loan) => {
          if (loan.employeeId === empId && !loan.isDeducted && toDeduct > 0) {
            const currentRemaining = loan.remainingAmount !== undefined ? loan.remainingAmount : loan.amount;
            if (currentRemaining <= toDeduct) {
              toDeduct -= currentRemaining;
              OfflineSyncService.updateLoan(loan.id, 0, true);
              return {
                ...loan,
                remainingAmount: 0,
                isDeducted: true,
              };
            } else {
              const newRemaining = currentRemaining - toDeduct;
              toDeduct = 0;
              OfflineSyncService.updateLoan(loan.id, newRemaining, false);
              return {
                ...loan,
                remainingAmount: newRemaining,
                isDeducted: false,
              };
            }
          }
          return loan;
        });
      });
    }

    success(
      `Gaji ${record.employeeName} dibayarkan Rp${record.netSalary.toLocaleString('id-ID')} (Potong Kasbon: Rp${record.loanDeduction.toLocaleString('id-ID')}, Sisa Hutang: Rp${record.remainingLoan.toLocaleString('id-ID')})`,
      'Penggajian Berhasil'
    );
  };

  const handleAddOpex = async (expense: OpexExpense) => {
    setOpexList((prev) => [expense, ...prev]);
    await OfflineSyncService.saveOpex(expense);
  };

  const handleAddMutation = (mut: StockMutation) => {
    setMutations((prev) => [mut, ...prev]);
  };

  const handleUpdateMutationStatus = (id: string, status: MutationStatus) => {
    setMutations((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status } : m))
    );
  };

  const handleAddDebt = async (debt: DebtRecord) => {
    setDebts((prev) => [debt, ...prev]);
    await OfflineSyncService.saveDebt(debt);
  };

  const handlePayDebt = async (id: string, payAmount: number) => {
    setDebts((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const newPaid = d.paidAmount + payAmount;
          const remaining = Math.max(0, d.totalAmount - newPaid);
          const newStatus = remaining === 0 ? 'PAID' : 'PARTIAL';
          OfflineSyncService.payDebt(id, newPaid, remaining, newStatus);
          return {
            ...d,
            paidAmount: newPaid,
            remainingAmount: remaining,
            status: newStatus,
          };
        }
        return d;
      })
    );
  };

  const handleApproveJumbo = async (txId: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === txId ? { ...t, isApprovedByOwner: true } : t))
    );
    await OfflineSyncService.approveJumboTransaction(txId);
    success('Transaksi Jumbo disetujui Owner dengan otorisasi PIN.', 'Approval Berhasil');
  };

  const handleUpdateMarketBenchmark = (prodId: string, newBenchmark: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === prodId) {
          const updated = { ...p, marketPriceBenchmark: newBenchmark };
          OfflineSyncService.updateProductPrices(prodId, p.priceRegular, p.pricePartner, newBenchmark);
          return updated;
        }
        return p;
      })
    );
  };

  const handleAddProduct = (newProd: Product) => {
    setProducts((prev) => [newProd, ...prev]);
    OfflineSyncService.saveProduct(newProd);
    success(`Komoditas ${newProd.name} berhasil ditambahkan oleh Owner`, 'Master Barang');
  };

  const handleUpdateProductPrices = (
    prodId: string,
    priceRegular: number,
    pricePartner: number,
    marketPriceBenchmark: number
  ) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === prodId
          ? { ...p, priceRegular, pricePartner, marketPriceBenchmark }
          : p
      )
    );
    OfflineSyncService.updateProductPrices(prodId, priceRegular, pricePartner, marketPriceBenchmark);
    success('Harga komoditas berhasil diperbarui oleh Owner', 'Update Harga');
  };

  const handleAddEmployee = async (newEmp: Employee) => {
    setEmployees((prev) => [newEmp, ...prev]);
    await OfflineSyncService.saveEmployee(newEmp);
    success(`Pegawai ${newEmp.fullName} (${newEmp.position}) berhasil didaftarkan`, 'Pegawai Baru');
  };

  const handleDeleteEmployee = async (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    setEmployees((prev) => prev.filter((e) => e.id !== empId));
    await OfflineSyncService.deleteEmployee(empId);
    success(`Data pegawai ${emp?.fullName || ''} berhasil dihapus dari sistem`, 'Pegawai Dihapus');
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Ringkasan Eksekutif & Operasional';
      case 'pos':
        return 'Kasir Timbangan Digital & Struk';
      case 'sales':
        return 'Inventaris & Penjualan Stok Gudang';
      case 'shifts':
        return 'Manajemen Shift & Rekonsiliasi Kasir';
      case 'opex':
        return 'Biaya Operasional Gudang (Kas Kecil)';
      case 'mutations':
        return 'Mutasi Stok Antar Gudang (Surat Jalan)';
      case 'attendance':
        return activeRole === 'OWNER'
          ? 'Absensi, Kasbon & Penggajian Karyawan'
          : 'Absensi Karyawan Harian (Shift Pagi & Malam)';
      case 'employees':
        return 'Master Kelola Pegawai & Identitas Kasbon (Khusus Owner)';
      case 'debts':
        return 'Manajemen Hutang & Piutang (AP / AR)';
      case 'owner':
        return 'Executive Overview: Laba / Rugi Konsolidasi';
      case 'profile':
        return 'Profil Pengguna & Keamanan Akun';
      default:
        return 'Dashboard';
    }
  };

  // Jika belum login, tampilkan Panel Login
  if (!isAuthChecked || !currentUser) {
    return <LoginPanel onLoginSuccess={handleLoginSuccess} isDark={isDark} onToggleTheme={toggleTheme} />;
  }

  return (
    <div className={`min-h-screen w-full flex flex-col lg:flex-row p-4 md:p-6 lg:pl-80 gap-6 font-sans antialiased transition-colors duration-200 ${
      isDark ? 'dark bg-[#09090b] text-zinc-100' : 'bg-[#f1f5f3] text-slate-900'
    }`}>
      {/* Sidebar Eduplex Curved Frame */}
      <Sidebar
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        activeWarehouseId={activeWarehouseId}
        setActiveWarehouseId={setActiveWarehouseId}
        activeTab={effectiveTab}
        setActiveTab={setActiveTab}
        warehouses={MOCK_WAREHOUSES}
        isOnline={isOnline}
        isDark={isDark}
        scaleStatus={{
          isConnected: scaleController.isConnected,
          isMock: scaleController.isMock,
          portInfo: scaleController.portInfo,
        }}
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-colors duration-200`}>
        {/* Top Navbar Header */}
        <header className={`h-16 px-6 rounded-2xl border mb-6 flex items-center justify-between flex-shrink-0 shadow-xs transition-colors duration-200 ${
          isDark ? 'bg-[#0b1220] border-slate-800 text-zinc-100' : 'bg-white border-slate-200/80 text-slate-800'
        }`}>
          <div className="flex items-center space-x-2">
            <span className={`text-xs font-bold ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Green Cycle Kuningan</span>
            <span className={`text-xs ${isDark ? 'text-zinc-700' : 'text-slate-300'}`}>/</span>
            <span className={`text-sm font-black tracking-tight ${isDark ? 'text-zinc-100' : 'text-slate-800'}`}>{getTabTitle()}</span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Modern Sliding Theme Switch (Sun & Moon) */}
            <button
              type="button"
              role="switch"
              aria-checked={isDark}
              onClick={toggleTheme}
              className={`relative inline-flex h-8 w-16 flex-shrink-0 cursor-pointer items-center rounded-full p-1 transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                isDark
                  ? 'bg-zinc-900 border border-zinc-700 shadow-inner'
                  : 'bg-amber-100/80 border border-amber-300/70 shadow-2xs'
              }`}
              title={isDark ? 'Beralih ke Mode Terang (Light)' : 'Beralih ke Mode Gelap (Dark)'}
            >
              {/* Background Sun icon (Left) */}
              <div className="absolute left-2 flex items-center justify-center">
                <Sun className={`h-3.5 w-3.5 transition-all duration-200 ${
                  isDark ? 'text-zinc-600 opacity-60' : 'text-amber-500 opacity-0'
                }`} />
              </div>

              {/* Background Moon icon (Right) */}
              <div className="absolute right-2 flex items-center justify-center">
                <Moon className={`h-3.5 w-3.5 transition-all duration-200 ${
                  isDark ? 'text-zinc-400 opacity-0' : 'text-amber-800/40 opacity-70'
                }`} />
              </div>

              {/* Sliding Knob Thumb */}
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full shadow-md transform transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                  isDark
                    ? 'translate-x-8 bg-black text-amber-300 border border-zinc-700 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                    : 'translate-x-0 bg-white text-amber-500 border border-amber-200/60 shadow-xs'
                }`}
              >
                {isDark ? (
                  <Moon className="h-3.5 w-3.5 text-amber-300 animate-in spin-in-180 duration-300" />
                ) : (
                  <Sun className="h-3.5 w-3.5 text-amber-500 animate-in spin-in-180 duration-300" />
                )}
              </div>
            </button>

            {/* Tombol Profil Pengguna & Keamanan di Header */}
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              title="Buka Identitas & Keamanan Akun"
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold border transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'ring-2 ring-emerald-500 shadow-xs'
                  : ''
              } ${
                activeRole === 'OWNER'
                  ? 'bg-emerald-900 text-amber-300 border-amber-600/40 shadow-xs hover:bg-emerald-800'
                  : isDark
                  ? 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                  : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
              }`}
            >
              {activeRole === 'OWNER' ? (
                <Sparkles className="h-3 w-3 text-amber-400" />
              ) : (
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
              )}
              <span className="max-w-[140px] truncate">{currentUser.fullName}</span>
            </button>

            {/* Tombol Logout Cepat di Header */}
            <button
              type="button"
              onClick={handleLogout}
              title="Keluar dari Akun (Logout)"
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-900'
                  : 'bg-slate-100 border-slate-300 text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200'
              }`}
            >
              <LogOut className="h-3 w-3" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </header>

        {/* Scrollable Page Viewport */}
        <main className="flex-1 overflow-y-auto w-full">
          {effectiveTab === 'dashboard' && (
            <ExecutiveDashboardOverview
              activeRole={activeRole}
              currentUser={currentUser}
              products={products}
              transactions={transactions}
              factorySales={salesList}
              isDark={isDark}
              isOnline={isOnline}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {effectiveTab === 'pos' && (
            <KasirPos
              products={products}
              warehouseId={activeWarehouseId}
              warehouseName={activeWarehouse.name}
              onSaveTransaction={handleSaveTransaction}
              transactions={transactions}
              salesList={salesList}
              activeShift={activeShift}
              scaleController={scaleController}
            />
          )}

          {effectiveTab === 'sales' && (
            <WarehouseSalesManagement
              currentWarehouseId={activeWarehouseId}
              warehouseName={activeWarehouse.name}
              products={products}
              salesList={salesList}
              onAddSale={handleAddSale}
            />
          )}

          {effectiveTab === 'shifts' && (
            <ShiftManagement
              activeRole={activeRole}
              warehouseId={activeWarehouseId}
              warehouseName={activeWarehouse.name}
              activeShift={activeShift}
              onOpenShift={handleOpenShift}
              onCloseShift={handleCloseShift}
              onUpdateInitialCash={handleUpdateInitialCash}
              totalExpenseToday={totalExpenseToday}
              totalCashInSalesToday={totalCashInSalesToday}
              totalOpexToday={totalOpexToday}
            />
          )}

          {effectiveTab === 'opex' && (
            <OpexManagement
              warehouseId={activeWarehouseId}
              warehouseName={activeWarehouse.name}
              opexList={opexList}
              onAddOpex={handleAddOpex}
            />
          )}

          {effectiveTab === 'mutations' && (
            <StockMutationManagement
              currentWarehouseId={activeWarehouseId}
              warehouses={MOCK_WAREHOUSES}
              products={products}
              mutations={mutations}
              activeRole={activeRole}
              onAddMutation={handleAddMutation}
              onUpdateStatus={handleUpdateMutationStatus}
            />
          )}

          {effectiveTab === 'attendance' && (
            <AttendanceManagement
              employees={employees}
              loans={loans}
              payrolls={payrolls}
              attendances={attendances}
              warehouseId={activeWarehouseId}
              warehouseName={activeWarehouse.name}
              onUpdateAttendance={handleUpdateAttendance}
              onBulkUpdateAll={handleBulkUpdateAllAttendance}
              onAddLoan={handleAddLoan}
              onPaySalary={handlePaySalary}
              activeRole={activeRole}
              isDark={isDark}
            />
          )}

          {effectiveTab === 'employees' && (
            activeRole === 'OWNER' ? (
              <EmployeeManagement
                employees={employees}
                loans={loans}
                warehouses={MOCK_WAREHOUSES}
                currentWarehouseId={activeWarehouseId}
                onAddEmployee={handleAddEmployee}
                onDeleteEmployee={handleDeleteEmployee}
                isDark={isDark}
              />
            ) : (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-12 text-center text-red-800 font-sans">
                <h3 className="text-base font-extrabold">AKSES TERKUNCI</h3>
                <p className="mt-1 text-xs text-red-600">
                  Fitur Master Kelola Pegawai hanya dapat diakses oleh akun Owner.
                </p>
              </div>
            )
          )}

          {effectiveTab === 'debts' && (
            activeRole === 'OWNER' ? (
              <DebtReceivableManagement
                debts={debts}
                onAddDebt={handleAddDebt}
                onPayDebt={handlePayDebt}
              />
            ) : (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-12 text-center text-red-800 font-sans">
                <h3 className="text-base font-extrabold">AKSES TERKUNCI</h3>
                <p className="mt-1 text-xs text-red-600">
                  Fitur Hutang & Piutang hanya dapat diakses oleh akun Owner.
                </p>
              </div>
            )
          )}

          {effectiveTab === 'owner' && (
            <OwnerDashboard
              activeRole={activeRole}
              transactions={transactions}
              factorySales={salesList}
              opexList={opexList}
              attendances={attendances}
              loans={loans}
              products={products}
              onApproveJumboTransaction={handleApproveJumbo}
              onUpdateMarketBenchmark={handleUpdateMarketBenchmark}
              onAddProduct={handleAddProduct}
              onUpdateProductPrices={handleUpdateProductPrices}
              isDark={isDark}
              onToggleTheme={toggleTheme}
            />
          )}

          {effectiveTab === 'profile' && (
            <ProfileIdentity
              currentUser={currentUser}
              activeWarehouseName={activeWarehouse.name}
              onUpdateCurrentUser={handleUpdateUserProfile}
              isDark={isDark}
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>
    </div>
  );
}
