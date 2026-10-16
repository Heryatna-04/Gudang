import Dexie, { Table } from 'dexie';
import {
  ScaleTransaction,
  CashShift,
  Product,
  Employee,
  EmployeeLoan,
  AttendanceRecord,
  OpexExpense,
  StockMutation,
  DebtRecord,
  FactorySale,
} from '../../types';

export class DavidERPDatabase extends Dexie {
  scaleTransactions!: Table<ScaleTransaction, string>;
  cashShifts!: Table<CashShift, string>;
  products!: Table<Product, string>;
  employees!: Table<Employee, string>;
  employeeLoans!: Table<EmployeeLoan, string>;
  attendances!: Table<AttendanceRecord, string>;
  opexExpenses!: Table<OpexExpense, string>;
  stockMutations!: Table<StockMutation, string>;
  debts!: Table<DebtRecord, string>;
  factorySales!: Table<FactorySale, string>;

  constructor() {
    super('DavidERPLocalDB');
    this.version(1).stores({
      scaleTransactions: 'id, invoiceNumber, warehouseId, cashierId, shiftId, syncStatus, createdAt',
      cashShifts: 'id, warehouseId, cashierId, openedAt',
      products: 'id, name, category, isActive',
      employees: 'id, warehouseId, fullName, isActive',
      employeeLoans: 'id, employeeId, warehouseId, isDeducted',
      attendances: 'id, [employeeId+attendanceDate], warehouseId',
      opexExpenses: 'id, warehouseId, category, createdAt',
      stockMutations: 'id, mutationNumber, fromWarehouseId, toWarehouseId, status, createdAt',
      debts: 'id, type, entityName, status, dueDate',
    });

    this.version(2).stores({
      attendances: 'id, employeeId, attendanceDate, warehouseId, shift',
    });

    this.version(3).stores({
      factorySales: 'id, invoiceNumber, warehouseId, buyerType, productId, paymentMethod, createdAt',
    });
  }
}

export const localDB = new DavidERPDatabase();
