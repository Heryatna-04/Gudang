'use client';

import React, { useState } from 'react';
import {
  Users,
  DollarSign,
  Plus,
  CheckCircle,
  Search,
  Filter,
  CheckCheck,
  Phone,
  Wallet,
  ReceiptText,
} from 'lucide-react';
import {
  Employee,
  EmployeeLoan,
  AttendanceRecord,
  AttendanceStatus,
  WorkShift,
  PayrollRecord,
  UserRole,
} from '../../types';

interface AttendanceManagementProps {
  employees: Employee[];
  loans: EmployeeLoan[];
  attendances: AttendanceRecord[];
  warehouseId: number;
  warehouseName: string;
  onUpdateAttendance: (empId: string, status: AttendanceStatus, shift: WorkShift) => void;
  onBulkUpdateAll: (status: AttendanceStatus, shift: WorkShift) => void;
  onAddLoan: (empId: string, amount: number, notes: string) => void;
  onPaySalary?: (
    empId: string,
    baseSalary: number,
    loanDeduction: number,
    notes: string
  ) => void;
  payrolls?: PayrollRecord[];
  activeRole?: UserRole;
  isDark?: boolean;
}

export function AttendanceManagement({
  employees,
  loans,
  attendances,
  warehouseId,
  warehouseName,
  onUpdateAttendance,
  onBulkUpdateAll,
  onAddLoan,
  onPaySalary,
  payrolls = [],
  activeRole = 'ADMIN',
  isDark = false,
}: AttendanceManagementProps) {
  const isOwner = activeRole === 'OWNER';
  const [selectedShift, setSelectedShift] = useState<WorkShift>('PAGI');
  const [searchTerm, setSearchTerm] = useState('');

  // Tab kanan: 'loan' (Catat Kasbon), 'payroll' (Penggajian Dinamis), 'history' (Riwayat)
  const [rightTab, setRightTab] = useState<'loan' | 'payroll' | 'history'>('loan');

  // State Kasbon
  const [selectedEmpForLoan, setSelectedEmpForLoan] = useState<string>(employees[0]?.id || '');
  const [loanAmount, setLoanAmount] = useState<number | ''>(100000);
  const [loanNotes, setLoanNotes] = useState<string>('Kasbon mingguan');

  // State Penggajian Dinamis
  const [selectedEmpForSalary, setSelectedEmpForSalary] = useState<string>(employees[0]?.id || '');
  const [baseSalaryInput, setBaseSalaryInput] = useState<number | ''>(700000);
  const [loanDeductionInput, setLoanDeductionInput] = useState<number | ''>(0);
  const [salaryNotes, setSalaryNotes] = useState<string>('Gaji mingguan');

  // Helper Total Kasbon Berjalan per Karyawan
  const getEmployeeActiveLoan = (empId: string) => {
    return loans
      .filter((l) => l.employeeId === empId && !l.isDeducted)
      .reduce((sum, l) => sum + (l.remainingAmount !== undefined ? l.remainingAmount : l.amount), 0);
  };

  // Filter karyawan di gudang ini
  const warehouseEmployees = employees.filter((e) => e.warehouseId === warehouseId);
  const filteredEmployees = warehouseEmployees.filter((e) =>
    e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const presentCount = warehouseEmployees.filter((e) => {
    const a = attendances.find((att) => att.employeeId === e.id && (att.shift === selectedShift || (!att.shift && selectedShift === 'PAGI')));
    return a?.status === 'PRESENT';
  }).length;

  const handleLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmt = loanAmount === '' ? 0 : loanAmount;
    if (!selectedEmpForLoan || finalAmt <= 0) return;
    onAddLoan(selectedEmpForLoan, finalAmt, loanNotes);
    setLoanAmount('');
    setLoanNotes('');
  };

  const handleSalarySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSalary = baseSalaryInput === '' ? 0 : baseSalaryInput;
    const finalDeduction = loanDeductionInput === '' ? 0 : loanDeductionInput;
    if (!selectedEmpForSalary || finalSalary <= 0 || !onPaySalary) return;
    onPaySalary(selectedEmpForSalary, finalSalary, finalDeduction, salaryNotes);
    setLoanDeductionInput(0);
    setSalaryNotes('Gaji mingguan');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header UX Friendly */}
      <div className={`flex flex-col gap-3 rounded-2xl border p-5 shadow-sm md:flex-row md:items-center md:justify-between transition-colors ${
        isDark ? 'border-zinc-800 bg-black text-zinc-100' : 'border-slate-200 bg-white text-slate-900'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-800 dark:text-emerald-400" />
            <h2 className={`text-base font-extrabold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
              {isOwner ? 'ABSENSI & KASBON KARYAWAN' : 'ABSENSI CEPAT KARYAWAN'} ({warehouseName})
            </h2>
          </div>
          <p className={`mt-1 text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            {isOwner
              ? 'Monitoring absensi pekerja shift pagi & malam, kasbon harian, dan penggajian dinamis.'
              : 'Pencatatan absensi cepat pekerja gudang (Shift Pagi & Shift Malam).'}
          </p>
        </div>

        {/* Quick Stats & Shift Selector & 1-Click Hadir Semua */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Shift Selector (Hanya Pagi & Malam) */}
          <div className={`flex items-center rounded-xl border p-1 transition-colors ${
            isDark ? 'border-zinc-800 bg-black' : 'border-slate-200 bg-slate-50'
          }`}>
            {(
              [
                { id: 'PAGI', label: 'Shift Pagi' },
                { id: 'MALAM', label: 'Shift Malam' },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedShift(s.id)}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                  selectedShift === s.id
                    ? 'bg-emerald-900 text-white shadow-xs'
                    : isDark
                    ? 'text-zinc-400 hover:text-zinc-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors ${
            isDark ? 'border-zinc-800 bg-black text-zinc-200' : 'border-slate-200 bg-slate-50 text-slate-700'
          }`}>
            Hadir ({selectedShift}): <span className="font-numeric text-emerald-800 dark:text-emerald-400 font-black">{presentCount}</span> / {warehouseEmployees.length}
          </div>

          <button
            onClick={() => onBulkUpdateAll('PRESENT', selectedShift)}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-800 px-3 py-1.5 text-xs font-extrabold text-white shadow-xs hover:bg-emerald-900 transition-all cursor-pointer"
          >
            <CheckCheck className="h-4 w-4" />
            Tandai Hadir Semua ({selectedShift})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Kolom Kiri: Tabel Checklist Absensi Massal (Full Width jika Admin/Kasir) */}
        <div className={`space-y-4 ${isOwner ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          <div className={`rounded-2xl border p-5 shadow-sm transition-colors ${
            isDark ? 'border-zinc-800 bg-black text-zinc-100' : 'border-slate-200 bg-white text-slate-900'
          }`}>
            {/* Search Box Karyawan */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="relative flex-1">
                <Search className={`h-4 w-4 absolute left-3 top-2.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                <input
                  type="text"
                  placeholder="Cari nama karyawan / posisi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full rounded-xl border pl-9 pr-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700 transition-colors ${
                    isDark ? 'border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500' : 'border-slate-300 bg-slate-50 text-slate-800 placeholder:text-slate-400'
                  }`}
                />
              </div>
              <span className={`text-[11px] font-bold ${isDark ? 'text-zinc-400' : 'text-slate-400'}`}>
                {filteredEmployees.length} Karyawan
              </span>
            </div>

            {/* List Absensi Cepat */}
            <div className={`divide-y max-h-[500px] overflow-y-auto pr-1 ${isDark ? 'divide-zinc-800/80' : 'divide-slate-100'}`}>
              {filteredEmployees.map((emp) => {
                const att = attendances.find((a) => a.employeeId === emp.id && (a.shift === selectedShift || (!a.shift && selectedShift === 'PAGI')));
                const currentStatus = att?.status || 'ABSENT';
                const activeLoanAmount = getEmployeeActiveLoan(emp.id);

                return (
                  <div key={emp.id} className={`flex items-center justify-between py-3 px-2 rounded-lg transition-all ${
                    isDark ? 'hover:bg-zinc-900/60' : 'hover:bg-slate-50'
                  }`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{emp.fullName}</span>
                        {emp.phone && (
                          <a
                            href={`https://wa.me/62${emp.phone.replace(/^0/, '').replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold border transition-colors ${
                              isDark
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/60'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            }`}
                            title="Hubungi WhatsApp"
                          >
                            <Phone className="h-2.5 w-2.5 text-emerald-700 dark:text-emerald-400" />
                            <span>{emp.phone}</span>
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[11px] font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{emp.position}</span>
                        {isOwner && activeLoanAmount > 0 && (
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-numeric font-bold border ${
                            isDark ? 'bg-amber-950/80 text-amber-300 border-amber-800/60' : 'bg-amber-100 text-amber-900 border-amber-300'
                          }`}>
                            Kasbon: Rp{activeLoanAmount.toLocaleString('id-ID')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onUpdateAttendance(emp.id, 'PRESENT', selectedShift)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                          currentStatus === 'PRESENT'
                            ? 'bg-emerald-800 text-white shadow-xs'
                            : isDark
                            ? 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Hadir
                      </button>
                      <button
                        onClick={() => onUpdateAttendance(emp.id, 'PERMISSION', selectedShift)}
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                          currentStatus === 'PERMISSION'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : isDark
                            ? 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Izin
                      </button>
                      <button
                        onClick={() => onUpdateAttendance(emp.id, 'ABSENT', selectedShift)}
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                          currentStatus === 'ABSENT'
                            ? 'bg-red-700 text-white shadow-xs'
                            : isDark
                            ? 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Alfa
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Kasbon & Penggajian Dinamis (Hanya Hak Milik Owner) */}
        {isOwner && (
          <div className="space-y-4 lg:col-span-5">
            {/* Navigation Tab Kolom Kanan */}
            <div className={`flex rounded-xl border p-1 shadow-2xs transition-colors ${
              isDark ? 'border-zinc-800 bg-black' : 'border-slate-200 bg-white'
            }`}>
              <button
                type="button"
                onClick={() => setRightTab('loan')}
                className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  rightTab === 'loan'
                    ? 'bg-emerald-900 text-white shadow-xs'
                    : isDark
                    ? 'text-zinc-400 hover:text-zinc-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Catat Kasbon
              </button>
              <button
                type="button"
                onClick={() => setRightTab('payroll')}
                className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  rightTab === 'payroll'
                    ? 'bg-emerald-900 text-white shadow-xs'
                    : isDark
                    ? 'text-zinc-400 hover:text-zinc-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Penggajian Dinamis
              </button>
              <button
                type="button"
                onClick={() => setRightTab('history')}
                className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  rightTab === 'history'
                    ? 'bg-emerald-900 text-white shadow-xs'
                    : isDark
                    ? 'text-zinc-400 hover:text-zinc-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Riwayat
              </button>
            </div>

            {/* Tab 1: Form Kasbon */}
            {rightTab === 'loan' && (
              <form onSubmit={handleLoanSubmit} className={`rounded-2xl border p-5 space-y-3 shadow-sm animate-in fade-in transition-colors ${
                isDark ? 'border-zinc-800 bg-black text-zinc-100' : 'border-slate-200 bg-white text-slate-900'
              }`}>
                <div className={`flex items-center gap-2 border-b pb-2 ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                  <DollarSign className="h-4 w-4 text-emerald-800 dark:text-emerald-400" />
                  <h3 className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                    Pencatatan Kasbon Baru
                  </h3>
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Pilih Karyawan</label>
                  <select
                    value={selectedEmpForLoan}
                    onChange={(e) => setSelectedEmpForLoan(e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700 cursor-pointer transition-colors ${
                      isDark ? 'border-zinc-800 bg-zinc-950 text-zinc-100' : 'border-slate-300 bg-white text-slate-900'
                    }`}
                  >
                    {warehouseEmployees.map((e) => {
                      const activeLoan = getEmployeeActiveLoan(e.id);
                      return (
                        <option key={e.id} value={e.id} className={isDark ? 'bg-zinc-950 text-zinc-100' : ''}>
                          {e.fullName} ({e.position}){activeLoan > 0 ? ` - Sisa Kasbon: Rp${activeLoan.toLocaleString('id-ID')}` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Nominal Pinjaman (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={loanAmount}
                    placeholder="0"
                    onChange={(e) => {
                      const val = e.target.value;
                      setLoanAmount(val === '' ? '' : parseFloat(val) || 0);
                    }}
                    className={`w-full rounded-lg border px-3 py-2 text-sm font-numeric font-black focus:outline-none focus:ring-2 focus:ring-emerald-700 transition-colors ${
                      isDark ? 'border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500' : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {[50000, 100000, 200000, 500000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setLoanAmount(amt)}
                        className={`rounded border px-2 py-0.5 text-[10px] font-bold font-numeric cursor-pointer transition-colors ${
                          isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        +Rp{amt.toLocaleString('id-ID')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Keperluan / Keterangan</label>
                  <input
                    type="text"
                    value={loanNotes}
                    onChange={(e) => setLoanNotes(e.target.value)}
                    placeholder="Contoh: Beli beras / servis motor"
                    className={`w-full rounded-lg border px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700 transition-colors ${
                      isDark ? 'border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500' : 'border-slate-300 bg-white text-slate-800 placeholder:text-slate-400'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-emerald-800 py-3 text-xs font-extrabold text-white shadow-md shadow-emerald-950/20 hover:bg-emerald-900 transition-all cursor-pointer"
                >
                  Simpan Pinjaman Kasbon
                </button>
              </form>
            )}

            {/* Tab 2: Form Penggajian Dinamis & Potongan Kasbon Parsial */}
            {rightTab === 'payroll' && (
              <form onSubmit={handleSalarySubmit} className={`rounded-2xl border p-5 space-y-3 shadow-sm animate-in fade-in transition-colors ${
                isDark ? 'border-zinc-800 bg-black text-zinc-100' : 'border-slate-200 bg-white text-slate-900'
              }`}>
                <div className={`flex items-center gap-2 border-b pb-2 ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                  <Wallet className="h-4 w-4 text-emerald-800 dark:text-emerald-400" />
                  <h3 className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                    Penggajian Dinamis & Potong Kasbon
                  </h3>
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Pilih Karyawan yang Digaji</label>
                  <select
                    value={selectedEmpForSalary}
                    onChange={(e) => {
                      const empId = e.target.value;
                      setSelectedEmpForSalary(empId);
                      const empLoan = getEmployeeActiveLoan(empId);
                      // Default potongan: setengah kasbon atau maksimal gaji
                      setLoanDeductionInput(Math.min(empLoan, 100000));
                    }}
                    className={`w-full rounded-lg border px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700 cursor-pointer transition-colors ${
                      isDark ? 'border-zinc-800 bg-zinc-950 text-zinc-100' : 'border-slate-300 bg-white text-slate-900'
                    }`}
                  >
                    {warehouseEmployees.map((e) => {
                      const empLoan = getEmployeeActiveLoan(e.id);
                      return (
                        <option key={e.id} value={e.id} className={isDark ? 'bg-zinc-950 text-zinc-100' : ''}>
                          {e.fullName} ({e.position}) - Total Kasbon: Rp{empLoan.toLocaleString('id-ID')}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Status Kasbon Karyawan Terpilih */}
                {(() => {
                  const currentEmpLoan = getEmployeeActiveLoan(selectedEmpForSalary);
                  const baseSal = typeof baseSalaryInput === 'number' ? baseSalaryInput : 0;
                  const dedAmt = typeof loanDeductionInput === 'number' ? loanDeductionInput : 0;
                  const netPay = Math.max(0, baseSal - dedAmt);
                  const remainingDebt = Math.max(0, currentEmpLoan - dedAmt);

                  return (
                    <>
                      <div className={`rounded-xl border p-3 text-xs space-y-1 transition-colors ${
                        isDark ? 'border-amber-900/60 bg-amber-950/40 text-amber-300' : 'border-amber-200 bg-amber-50 text-slate-700'
                      }`}>
                        <div className="flex justify-between">
                          <span>Total Kasbon Berjalan Saat Ini:</span>
                          <span className={`font-numeric font-black ${isDark ? 'text-amber-400' : 'text-amber-900'}`}>
                            Rp{currentEmpLoan.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className={`text-[10px] font-medium ${isDark ? 'text-amber-400/80' : 'text-amber-800'}`}>
                          *Saat penggajian, kasbon bisa dipotong sebagian atau penuh. Sisa kasbon tetap menjadi hutang berjalan.
                        </div>
                      </div>

                      <div>
                        <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Gaji Pokok Kotor (Rp)</label>
                        <input
                          type="number"
                          min="0"
                          step="50000"
                          value={baseSalaryInput}
                          placeholder="0"
                          onChange={(e) => {
                            const val = e.target.value;
                            setBaseSalaryInput(val === '' ? '' : parseFloat(val) || 0);
                          }}
                          className={`w-full rounded-lg border px-3 py-2 text-sm font-numeric font-black focus:outline-none focus:ring-2 focus:ring-emerald-700 transition-colors ${
                            isDark ? 'border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500' : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400'
                          }`}
                          required
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className={`text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Potongan Kasbon (Dinamis / Parsial)</label>
                          <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400">
                            Maks: Rp{currentEmpLoan.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          max={currentEmpLoan}
                          step="10000"
                          value={loanDeductionInput}
                          placeholder="0"
                          onChange={(e) => {
                            const val = e.target.value;
                            setLoanDeductionInput(val === '' ? '' : parseFloat(val) || 0);
                          }}
                          className={`w-full rounded-lg border px-3 py-2 text-sm font-numeric font-black text-red-600 focus:outline-none focus:ring-2 focus:ring-emerald-700 transition-colors ${
                            isDark ? 'border-zinc-800 bg-zinc-950 placeholder:text-zinc-500' : 'border-slate-300 bg-white placeholder:text-slate-400'
                          }`}
                        />
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => setLoanDeductionInput(0)}
                            className={`rounded border px-2 py-0.5 text-[10px] font-bold cursor-pointer transition-colors ${
                              isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            Potong Rp 0 (Tidak Potong)
                          </button>
                          {currentEmpLoan > 0 && (
                            <>
                              <button
                                type="button"
                                onClick={() => setLoanDeductionInput(Math.round(currentEmpLoan / 2))}
                                className={`rounded border px-2 py-0.5 text-[10px] font-bold cursor-pointer transition-colors ${
                                  isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                                }`}
                              >
                                Potong 50% (Rp{Math.round(currentEmpLoan / 2).toLocaleString('id-ID')})
                              </button>
                              <button
                                type="button"
                                onClick={() => setLoanDeductionInput(currentEmpLoan)}
                                className={`rounded border px-2 py-0.5 text-[10px] font-bold cursor-pointer transition-colors ${
                                  isDark ? 'bg-amber-950/80 border-amber-800/80 text-amber-300 hover:bg-amber-900/80' : 'bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200'
                                }`}
                              >
                                Potong Lunas Semua
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>Catatan Penggajian</label>
                        <input
                          type="text"
                          value={salaryNotes}
                          onChange={(e) => setSalaryNotes(e.target.value)}
                          placeholder="Contoh: Gaji periode minggu ke-4"
                          className={`w-full rounded-lg border px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700 transition-colors ${
                            isDark ? 'border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500' : 'border-slate-300 bg-white text-slate-800 placeholder:text-slate-400'
                          }`}
                        />
                      </div>

                      {/* Rincian Real-Time Gaji Bersih & Sisa Kasbon */}
                      <div className={`rounded-xl border p-3 text-xs space-y-1.5 transition-colors ${
                        isDark ? 'border-zinc-800 bg-zinc-950 text-zinc-300' : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}>
                        <div className="flex justify-between">
                          <span>Gaji Kotor:</span>
                          <span className="font-numeric font-bold">Rp{baseSal.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span>Potongan Kasbon:</span>
                          <span className="font-numeric font-bold">-Rp{dedAmt.toLocaleString('id-ID')}</span>
                        </div>
                        <div className={`flex justify-between border-t pt-1 font-bold text-sm ${
                          isDark ? 'border-zinc-800 text-zinc-100' : 'border-slate-200 text-slate-900'
                        }`}>
                          <span>Gaji Bersih Diterima:</span>
                          <span className="font-numeric font-black text-emerald-800 dark:text-emerald-400">
                            Rp{netPay.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className={`flex justify-between border-t border-dashed pt-1 text-[11px] ${
                          isDark ? 'border-zinc-800 text-amber-400' : 'border-slate-200 text-amber-900'
                        }`}>
                          <span className="font-semibold">Sisa Kasbon Karyawan (Tetap Hutang):</span>
                          <span className="font-numeric font-black">
                            Rp{remainingDebt.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={baseSal <= 0}
                        className="w-full rounded-xl bg-emerald-800 py-3 text-xs font-extrabold text-white shadow-md shadow-emerald-950/20 hover:bg-emerald-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        Konfirmasi Bayar Gaji & Potong Kasbon
                      </button>
                    </>
                  );
                })()}
              </form>
            )}

            {/* Tab 3: List Kasbon Berjalan & Riwayat Penggajian */}
            {rightTab === 'history' && (
              <div className="space-y-4 animate-in fade-in">
                <div className={`rounded-2xl border p-5 shadow-sm transition-colors ${
                  isDark ? 'border-zinc-800 bg-black text-zinc-100' : 'border-slate-200 bg-white text-slate-900'
                }`}>
                  <h4 className={`text-xs font-extrabold uppercase tracking-wider mb-2 ${
                    isDark ? 'text-zinc-300' : 'text-slate-700'
                  }`}>
                    Daftar Kasbon Berjalan (Sisa Hutang)
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {loans
                      .filter((l) => l.warehouseId === warehouseId && !l.isDeducted)
                      .map((loan) => {
                        const rem = loan.remainingAmount !== undefined ? loan.remainingAmount : loan.amount;
                        return (
                          <div
                            key={loan.id}
                            className={`flex items-center justify-between rounded-xl border p-2.5 text-xs transition-colors ${
                              isDark ? 'border-zinc-800 bg-zinc-950 text-zinc-200' : 'border-slate-200 bg-slate-50 text-slate-900'
                            }`}
                          >
                            <div>
                              <div className={`font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{loan.employeeName}</div>
                              <div className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                                {loan.loanDate} • {loan.notes || 'Kasbon'}
                                {rem < loan.amount && ` (Awal: Rp${loan.amount.toLocaleString('id-ID')})`}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`font-numeric font-black ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                                Rp{rem.toLocaleString('id-ID')}
                              </div>
                              <span className={`text-[10px] font-semibold ${isDark ? 'text-amber-500' : 'text-amber-800'}`}>Sisa Hutang</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {payrolls.length > 0 && (
                  <div className={`rounded-2xl border p-5 shadow-sm transition-colors ${
                    isDark ? 'border-zinc-800 bg-black text-zinc-100' : 'border-slate-200 bg-white text-slate-900'
                  }`}>
                    <h4 className={`text-xs font-extrabold uppercase tracking-wider mb-2 ${
                      isDark ? 'text-zinc-300' : 'text-slate-700'
                    }`}>
                      Riwayat Pembayaran Gaji Terakhir
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {payrolls
                        .filter((p) => p.warehouseId === warehouseId)
                        .map((pay) => (
                          <div
                            key={pay.id}
                            className={`flex items-center justify-between rounded-xl border p-2.5 text-xs transition-colors ${
                              isDark ? 'border-emerald-950/60 bg-emerald-950/20 text-zinc-200' : 'border-slate-200 bg-emerald-50/50 text-slate-900'
                            }`}
                          >
                            <div>
                              <div className={`font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{pay.employeeName}</div>
                              <div className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                                {pay.paymentDate} • Bersih: Rp{pay.netSalary.toLocaleString('id-ID')}
                              </div>
                            </div>
                            <div className="text-right font-numeric">
                              <div className="font-black text-red-600 dark:text-red-400">
                                Potong: Rp{pay.loanDeduction.toLocaleString('id-ID')}
                              </div>
                              <div className={`text-[10px] font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                                Sisa Kasbon: Rp{pay.remainingLoan.toLocaleString('id-ID')}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
