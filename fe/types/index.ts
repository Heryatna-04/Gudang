// TypeScript strictly-typed interfaces for ERP Timbangan PT DAVID

export type UserRole = 'OWNER' | 'ADMIN';

export type AttendanceStatus = 'PRESENT' | 'PERMISSION' | 'ABSENT' | 'OFF';

export type WorkShift = 'PAGI' | 'MALAM';

export type OpexCategory = 'BENSIN_TRUK' | 'KARUNG_PLASTIK' | 'KAWAT_IKAT' | 'SERVIS_TIMBANGAN' | 'KONSUMSI_KULI' | 'LAINNYA';

export type MutationStatus = 'DRAFT' | 'ON_DELIVERY' | 'RECEIVED' | 'CANCELLED';

export type DebtType = 'PIUTANG_PABRIK' | 'HUTANG_SUPPLIER';

export type DebtStatus = 'UNPAID' | 'PARTIAL' | 'PAID';

export type BuyerType = 'PELEBURAN_BESAR' | 'PEMBELI_BIASA';

export interface Warehouse {
  id: number;
  name: string;
  address: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  role: UserRole;
  warehouseId: number | null;
  createdAt: string;
}

export interface AppAccount {
  id?: string;
  username: string;
  pin: string;
  fullName: string;
  role: UserRole;
  warehouseId?: number | null;
  phone?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CashShift {
  id: string;
  warehouseId: number;
  cashierId: string;
  openedAt: string;
  closedAt: string | null;
  initialCash: number;
  expectedClosingCash: number | null;
  actualClosingCash: number | null;
  cashDifference: number | null;
  notes: string | null;
}

export interface Product {
  id: string;
  name: string;
  category: 'LOGAM_BESI' | 'LOGAM_NON_BESI' | 'KERTAS_PLASTIK';
  priceRegular: number;
  pricePartner: number;
  marketPriceBenchmark: number; // Harga patokan pasar harian
  currentStockKg: number;
  isActive: boolean;
  createdAt: string;
}

export interface ScaleTransactionItem {
  id: string;
  transactionId: string;
  productId: string;
  productName?: string;
  grossWeightKg: number;
  refactionKg: number;
  refactionPct: number;
  netWeightKg: number;
  pricePerKg: number;
  subtotal: number;
}

export interface ScaleTransaction {
  id: string;
  invoiceNumber: string;
  warehouseId: number;
  cashierId: string;
  shiftId: string | null;
  sellerName: string;
  isPartner: boolean;
  totalAmount: number;
  syncStatus: boolean;
  photoUrl?: string;
  requiresOwnerApproval: boolean; // True jika total > Rp 10.000.000
  isApprovedByOwner: boolean;
  approvalPin?: string;
  items: ScaleTransactionItem[];
  createdAt: string;
}

export interface FactorySale {
  id: string;
  invoiceNumber: string;
  warehouseId: number;
  buyerType: BuyerType; // 'PELEBURAN_BESAR' | 'PEMBELI_BIASA'
  factoryName: string; // Nama Pabrik atau Nama Pembeli
  productId: string;
  productName?: string;
  weightKg: number;
  contractPricePerKg: number;
  totalRevenue: number;
  paymentMethod: 'CASH_LACI' | 'TRANSFER_BANK'; // Kas masuk tunai ke laci vs transfer rekening
  isPaid: boolean;
  createdAt: string;
}

export interface Employee {
  id: string;
  fullName: string;
  warehouseId: number;
  position: string;
  phone?: string; // No WhatsApp Pekerja
  isActive: boolean;
  createdAt: string;
}

export interface EmployeeLoan {
  id: string;
  employeeId: string;
  employeeName?: string;
  warehouseId: number;
  loanDate: string;
  amount: number;
  remainingAmount?: number; // Sisa kasbon yang belum dipotong gaji
  isDeducted: boolean;
  notes: string | null;
  createdAt: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  warehouseId: number;
  paymentDate: string;
  baseSalary: number; // Gaji kotor
  loanDeduction: number; // Potongan kasbon dinamis (bisa sebagian)
  netSalary: number; // Gaji bersih dibayar
  remainingLoan: number; // Sisa hutang kasbon berjalan
  notes: string | null;
  recordedBy: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName?: string;
  warehouseId: number;
  attendanceDate: string;
  shift?: WorkShift;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
  recordedBy: string;
  createdAt: string;
}

export interface OpexExpense {
  id: string;
  warehouseId: number;
  category: OpexCategory;
  customCategory?: string; // Input bebas bila tidak ada di dropdown
  amount: number;
  description: string;
  recordedBy: string;
  createdAt: string;
}

export interface StockMutation {
  id: string;
  mutationNumber: string;
  fromWarehouseId: number;
  toWarehouseId: number;
  productId: string;
  productName?: string;
  weightKg: number;
  driverName: string;
  truckLicensePlate: string;
  status: MutationStatus;
  notes: string | null;
  createdAt: string;
}

export interface DebtRecord {
  id: string;
  type: DebtType;
  entityName: string;
  referenceInvoice: string;
  warehouseId: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: DebtStatus;
  notes: string | null;
  createdAt: string;
}
