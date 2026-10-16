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
  CalendarCheck,
  Calendar,
  Award,
  TrendingUp,
  Sparkles,
  Coffee,
  ChevronDown,
  ChevronUp,
  Check,
  AlertCircle,
  XCircle,
  CalendarDays,
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
  const [activeTabMode, setActiveTabMode] = useState<'daily' | 'monthly_recap'>('daily');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
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

  const offCount = warehouseEmployees.filter((e) => {
    const a = attendances.find((att) => att.employeeId === e.id && (att.shift === selectedShift || (!att.shift && selectedShift === 'PAGI')));
    return a?.status === 'OFF';
  }).length;

  // State untuk Tab Rekapan Bulanan
  const [recapSearchTerm, setRecapSearchTerm] = useState('');
  const [recapFilterPredikat, setRecapFilterPredikat] = useState<string>('ALL');
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);

  // Perhitungan Rekapan Bulanan & Analisis Kerajinan
  const monthlyAttendances = attendances.filter(
    (a) => a.warehouseId === warehouseId && a.attendanceDate.startsWith(selectedMonth)
  );

  const monthlyRecapData = warehouseEmployees.map((emp) => {
    const empAtts = monthlyAttendances.filter((a) => a.employeeId === emp.id);

    const datesMap = new Map<string, { status: AttendanceStatus; shift?: WorkShift }>();
    empAtts.forEach((a) => {
      const prev = datesMap.get(a.attendanceDate);
      if (!prev || a.status === 'PRESENT') {
        datesMap.set(a.attendanceDate, { status: a.status, shift: a.shift });
      } else if (prev.status === 'ABSENT' && (a.status === 'PERMISSION' || a.status === 'OFF')) {
        datesMap.set(a.attendanceDate, { status: a.status, shift: a.shift });
      }
    });

    const daysHadir = Array.from(datesMap.values()).filter((item) => item.status === 'PRESENT').length;
    const daysIzin = Array.from(datesMap.values()).filter((item) => item.status === 'PERMISSION').length;
    const daysLibur = Array.from(datesMap.values()).filter((item) => item.status === 'OFF').length;
    const daysAlfa = Array.from(datesMap.values()).filter((item) => item.status === 'ABSENT').length;

    const activeWorkingDays = daysHadir + daysIzin + daysAlfa;
    // Libur ('OFF') tidak mengurangi skor kerajinan karyawan
    const diligencePct = activeWorkingDays > 0 ? Math.round((daysHadir / activeWorkingDays) * 100) : null;

    let predikat: 'SANGAT_RAJIN' | 'RAJIN' | 'CUKUP' | 'EVALUASI' | 'BELUM_ADA_DATA';
    let predikatLabel: string;
    let badgeColor: string;

    if (diligencePct === null) {
      predikat = 'BELUM_ADA_DATA';
      predikatLabel = 'Belum Ada Data';
      badgeColor = isDark ? 'bg-zinc-800 text-zinc-400 border-zinc-700' : 'bg-slate-100 text-slate-500 border-slate-200';
    } else if (diligencePct >= 90) {
      predikat = 'SANGAT_RAJIN';
      predikatLabel = 'Sangat Rajin';
      badgeColor = isDark ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80' : 'bg-emerald-50 text-emerald-800 border-emerald-200';
    } else if (diligencePct >= 75) {
      predikat = 'RAJIN';
      predikatLabel = 'Rajin (Baik)';
      badgeColor = isDark ? 'bg-sky-950/80 text-sky-300 border-sky-800/80' : 'bg-sky-50 text-sky-800 border-sky-200';
    } else if (diligencePct >= 60) {
      predikat = 'CUKUP';
      predikatLabel = 'Cukup';
      badgeColor = isDark ? 'bg-amber-950/80 text-amber-300 border-amber-800/80' : 'bg-amber-50 text-amber-800 border-amber-200';
    } else {
      predikat = 'EVALUASI';
      predikatLabel = 'Perlu Evaluasi';
      badgeColor = isDark ? 'bg-red-950/80 text-red-300 border-red-800/80' : 'bg-red-50 text-red-800 border-red-200';
    }

    return {
      emp,
      daysHadir,
      daysIzin,
      daysLibur,
      daysAlfa,
      totalRecorded: datesMap.size,
      activeWorkingDays,
      diligencePct,
      predikat,
      predikatLabel,
      badgeColor,
      details: Array.from(datesMap.entries()).map(([date, val]) => ({ date, status: val.status, shift: val.shift })),
    };
  });

  const teamDiligenceValues = monthlyRecapData
    .map((r) => r.diligencePct)
    .filter((v): v is number => v !== null);
  const avgTeamDiligence =
    teamDiligenceValues.length > 0
      ? Math.round(teamDiligenceValues.reduce((a, b) => a + b, 0) / teamDiligenceValues.length)
      : null;

  const totalHadirAll = monthlyRecapData.reduce((sum, r) => sum + r.daysHadir, 0);
  const totalIzinAll = monthlyRecapData.reduce((sum, r) => sum + r.daysIzin, 0);
  const totalLiburAll = monthlyRecapData.reduce((sum, r) => sum + r.daysLibur, 0);
  const totalAlfaAll = monthlyRecapData.reduce((sum, r) => sum + r.daysAlfa, 0);

  const starEmployee = [...monthlyRecapData]
    .filter((r) => r.diligencePct !== null)
    .sort((a, b) => (b.diligencePct || 0) - (a.diligencePct || 0) || b.daysHadir - a.daysHadir)[0];

  const filteredRecap = monthlyRecapData.filter((r) => {
    const matchName =
      r.emp.fullName.toLowerCase().includes(recapSearchTerm.toLowerCase()) ||
      r.emp.position.toLowerCase().includes(recapSearchTerm.toLowerCase());
    const matchPredikat = recapFilterPredikat === 'ALL' || r.predikat === recapFilterPredikat;
    return matchName && matchPredikat;
  });

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

          <div className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors ${
            isDark ? 'border-zinc-800 bg-black text-zinc-200' : 'border-slate-200 bg-slate-50 text-slate-700'
          }`}>
            Libur ({selectedShift}): <span className="font-numeric text-sky-700 dark:text-sky-400 font-black">{offCount}</span> / {warehouseEmployees.length}
          </div>

          <button
            onClick={() => onBulkUpdateAll('PRESENT', selectedShift)}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-800 px-3 py-1.5 text-xs font-extrabold text-white shadow-xs hover:bg-emerald-900 transition-all cursor-pointer"
          >
            <CheckCheck className="h-4 w-4" />
            Tandai Hadir Semua ({selectedShift})
          </button>

          <button
            onClick={() => onBulkUpdateAll('OFF', selectedShift)}
            className="flex items-center gap-1.5 rounded-xl bg-sky-700 px-3 py-1.5 text-xs font-extrabold text-white shadow-xs hover:bg-sky-800 transition-all cursor-pointer"
          >
            <Coffee className="h-4 w-4" />
            Tandai Libur Semua ({selectedShift})
          </button>
        </div>
      </div>

      {/* Mode Switcher: Input Absensi Harian vs Rekap Bulanan */}
      <div className={`flex items-center gap-2 border-b pb-3 transition-colors ${
        isDark ? 'border-zinc-800' : 'border-slate-200'
      }`}>
        <button
          type="button"
          onClick={() => setActiveTabMode('daily')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
            activeTabMode === 'daily'
              ? 'bg-emerald-800 text-white shadow-xs'
              : isDark
              ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CalendarCheck className="h-4 w-4" />
          <span>Input Absensi Harian (Checklist)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTabMode('monthly_recap')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
            activeTabMode === 'monthly_recap'
              ? 'bg-emerald-800 text-white shadow-xs'
              : isDark
              ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Award className="h-4 w-4" />
          <span>Rekapan Bulanan & Analisis Kerajinan</span>
        </button>
      </div>

      {activeTabMode === 'daily' && (
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
                        onClick={() => onUpdateAttendance(emp.id, 'OFF', selectedShift)}
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                          currentStatus === 'OFF'
                            ? 'bg-sky-600 text-white shadow-xs'
                            : isDark
                            ? 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Libur
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
      )}

      {/* Tab Rekapan Bulanan & Analisis Kerajinan */}
      {activeTabMode === 'monthly_recap' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top Control Bar: Pilih Bulan & Quick Insight */}
          <div className={`flex flex-col gap-4 rounded-2xl border p-5 shadow-sm md:flex-row md:items-center md:justify-between transition-colors ${
            isDark ? 'border-zinc-800 bg-black text-zinc-100' : 'border-slate-200 bg-white text-slate-900'
          }`}>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-emerald-800 dark:text-emerald-400" />
                <span className="text-xs font-extrabold uppercase tracking-wider">Periode Rekap:</span>
              </div>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className={`rounded-xl border px-3 py-1.5 text-xs font-bold font-numeric focus:outline-none focus:ring-2 focus:ring-emerald-700 cursor-pointer transition-colors ${
                  isDark ? 'border-zinc-800 bg-zinc-950 text-zinc-100' : 'border-slate-300 bg-slate-50 text-slate-900'
                }`}
              />
              <span className={`text-xs font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                ({new Date(`${selectedMonth}-01`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })})
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                isDark ? 'border-zinc-800 bg-zinc-950 text-zinc-300' : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}>
                Formula: <span className="font-bold text-emerald-800 dark:text-emerald-400">Hadir / (Hadir + Izin + Alfa)</span> (Hari Libur tidak memotong skor)
              </div>
            </div>
          </div>

          {/* 4 Kartu KPI Ringkasan Bulan Ini */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Rata-rata Kerajinan Tim */}
            <div className={`rounded-2xl border p-4 shadow-sm transition-colors ${
              isDark ? 'border-zinc-800 bg-black text-zinc-100' : 'border-slate-200 bg-white text-slate-900'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Rata-rata Kerajinan
                </span>
                <TrendingUp className="h-4 w-4 text-emerald-800 dark:text-emerald-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-numeric text-2xl font-black text-emerald-800 dark:text-emerald-400">
                  {avgTeamDiligence !== null ? `${avgTeamDiligence}%` : '-'}
                </span>
                <span className={`text-[11px] font-bold ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                  {avgTeamDiligence !== null && avgTeamDiligence >= 80 ? 'Kinerja Sangat Baik' : 'Seluruh Tim'}
                </span>
              </div>
            </div>

            {/* Card 2: Karyawan Terajin */}
            <div className={`rounded-2xl border p-4 shadow-sm transition-colors ${
              isDark ? 'border-zinc-800 bg-black text-zinc-100' : 'border-slate-200 bg-white text-slate-900'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Karyawan Terajin
                </span>
                <Award className="h-4 w-4 text-amber-500" />
              </div>
              <div className="mt-2">
                <div className="truncate text-sm font-black text-amber-600 dark:text-amber-400">
                  {starEmployee && starEmployee.diligencePct !== null ? starEmployee.emp.fullName : 'Belum Ada Data'}
                </div>
                <div className={`text-[11px] font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  {starEmployee && starEmployee.diligencePct !== null
                    ? `${starEmployee.diligencePct}% Hadir (${starEmployee.daysHadir} hari)`
                    : 'Mulai input absensi'}
                </div>
              </div>
            </div>

            {/* Card 3: Total Kehadiran Tim */}
            <div className={`rounded-2xl border p-4 shadow-sm transition-colors ${
              isDark ? 'border-zinc-800 bg-black text-zinc-100' : 'border-slate-200 bg-white text-slate-900'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Total Kehadiran Tim
                </span>
                <CheckCircle className="h-4 w-4 text-emerald-800 dark:text-emerald-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-numeric text-2xl font-black text-slate-900 dark:text-zinc-100">
                  {totalHadirAll}
                </span>
                <span className={`text-xs font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  orang-hari hadir
                </span>
              </div>
            </div>

            {/* Card 4: Izin, Alfa & Libur */}
            <div className={`rounded-2xl border p-4 shadow-sm transition-colors ${
              isDark ? 'border-zinc-800 bg-black text-zinc-100' : 'border-slate-200 bg-white text-slate-900'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Izin / Libur / Alfa
                </span>
                <Sparkles className="h-4 w-4 text-sky-500" />
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs font-numeric font-bold">
                <span className="rounded px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                  {totalIzinAll} Izin
                </span>
                <span className="rounded px-1.5 py-0.5 bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300">
                  {totalLiburAll} Libur
                </span>
                <span className="rounded px-1.5 py-0.5 bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300">
                  {totalAlfaAll} Alfa
                </span>
              </div>
            </div>
          </div>

          {/* Tabel Rekapitulasi Kerajinan per Karyawan */}
          <div className={`rounded-2xl border p-5 shadow-sm transition-colors ${
            isDark ? 'border-zinc-800 bg-black text-zinc-100' : 'border-slate-200 bg-white text-slate-900'
          }`}>
            {/* Filter & Search Bar */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className={`h-4 w-4 absolute left-3 top-2.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                <input
                  type="text"
                  placeholder="Cari karyawan pada tabel rekap..."
                  value={recapSearchTerm}
                  onChange={(e) => setRecapSearchTerm(e.target.value)}
                  className={`w-full rounded-xl border pl-9 pr-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700 transition-colors ${
                    isDark ? 'border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500' : 'border-slate-300 bg-slate-50 text-slate-800 placeholder:text-slate-400'
                  }`}
                />
              </div>

              {/* Filter Predikat */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'ALL', label: 'Semua Predikat' },
                  { id: 'SANGAT_RAJIN', label: 'Sangat Rajin (>=90%)' },
                  { id: 'RAJIN', label: 'Rajin (75-89%)' },
                  { id: 'CUKUP', label: 'Cukup (60-74%)' },
                  { id: 'EVALUASI', label: 'Perlu Evaluasi (<60%)' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setRecapFilterPredikat(f.id)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                      recapFilterPredikat === f.id
                        ? 'bg-emerald-900 text-white shadow-xs'
                        : isDark
                        ? 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 text-slate-900'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b font-extrabold uppercase tracking-wider text-[11px] ${
                    isDark ? 'border-zinc-800 text-zinc-400 bg-zinc-950/60' : 'border-slate-200 text-slate-500 bg-slate-50'
                  }`}>
                    <th className="py-3 px-3">Karyawan</th>
                    <th className="py-3 px-2 text-center">Hadir</th>
                    <th className="py-3 px-2 text-center">Izin</th>
                    <th className="py-3 px-2 text-center">Libur (OFF)</th>
                    <th className="py-3 px-2 text-center">Alfa (Bolos)</th>
                    <th className="py-3 px-2 text-center">Hari Kerja Wajib</th>
                    <th className="py-3 px-3 text-center">Skor Kerajinan</th>
                    <th className="py-3 px-3 text-center">Predikat Evaluasi</th>
                    <th className="py-3 px-2 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-zinc-800/80' : 'divide-slate-100'}`}>
                  {filteredRecap.length === 0 ? (
                    <tr>
                      <td colSpan={9} className={`py-8 text-center text-xs font-semibold ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                        Tidak ada data karyawan yang cocok dengan pencarian / filter bulan ini.
                      </td>
                    </tr>
                  ) : (
                    filteredRecap.map((item, idx) => {
                      const isExpanded = expandedEmployeeId === item.emp.id;
                      return (
                        <React.Fragment key={item.emp.id}>
                          <tr className={`transition-colors ${
                            isDark ? 'hover:bg-zinc-900/60' : 'hover:bg-slate-50/80'
                          }`}>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <span className={`font-mono text-[10px] w-5 text-center ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                                  {idx + 1}.
                                </span>
                                <div>
                                  <div className={`font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                                    {item.emp.fullName}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                                      {item.emp.position}
                                    </span>
                                    {item.emp.phone && (
                                      <a
                                        href={`https://wa.me/62${item.emp.phone.replace(/^0/, '').replace(/[^0-9]/g, '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={`inline-flex items-center gap-1 rounded px-1.5 py-0.2 text-[10px] font-bold border transition-colors ${
                                          isDark
                                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/60'
                                            : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                        }`}
                                      >
                                        <Phone className="h-2.5 w-2.5 text-emerald-700 dark:text-emerald-400" />
                                        <span>WA</span>
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-2 text-center font-numeric font-bold">
                              <span className="rounded-md px-2 py-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                                {item.daysHadir} hr
                              </span>
                            </td>

                            <td className="py-3 px-2 text-center font-numeric font-bold">
                              <span className="rounded-md px-2 py-1 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                                {item.daysIzin} hr
                              </span>
                            </td>

                            <td className="py-3 px-2 text-center font-numeric font-bold">
                              <span className="rounded-md px-2 py-1 bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300">
                                {item.daysLibur} hr
                              </span>
                            </td>

                            <td className="py-3 px-2 text-center font-numeric font-bold">
                              <span className={`rounded-md px-2 py-1 ${
                                item.daysAlfa > 0
                                  ? 'bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300'
                                  : isDark
                                  ? 'text-zinc-500'
                                  : 'text-slate-400'
                              }`}>
                                {item.daysAlfa} hr
                              </span>
                            </td>

                            <td className="py-3 px-2 text-center font-numeric font-semibold">
                              <span className={isDark ? 'text-zinc-300' : 'text-slate-700'}>
                                {item.activeWorkingDays} hr
                              </span>
                            </td>

                            <td className="py-3 px-3 text-center">
                              {item.diligencePct !== null ? (
                                <div className="inline-flex flex-col items-center">
                                  <span className={`font-numeric text-xs font-black ${
                                    item.diligencePct >= 90
                                      ? 'text-emerald-800 dark:text-emerald-400'
                                      : item.diligencePct >= 75
                                      ? 'text-sky-700 dark:text-sky-400'
                                      : item.diligencePct >= 60
                                      ? 'text-amber-700 dark:text-amber-400'
                                      : 'text-red-700 dark:text-red-400'
                                  }`}>
                                    {item.diligencePct}%
                                  </span>
                                  <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden mt-1">
                                    <div
                                      className={`h-full rounded-full ${
                                        item.diligencePct >= 90
                                          ? 'bg-emerald-600'
                                          : item.diligencePct >= 75
                                          ? 'bg-sky-600'
                                          : item.diligencePct >= 60
                                          ? 'bg-amber-500'
                                          : 'bg-red-600'
                                      }`}
                                      style={{ width: `${Math.min(100, item.diligencePct)}%` }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <span className={`text-[11px] font-medium ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>-</span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-center">
                              <span className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-bold ${item.badgeColor}`}>
                                {item.predikat === 'SANGAT_RAJIN' && <Award className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />}
                                {item.predikat === 'EVALUASI' && <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400" />}
                                <span>{item.predikatLabel}</span>
                              </span>
                            </td>

                            <td className="py-3 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => setExpandedEmployeeId(isExpanded ? null : item.emp.id)}
                                className={`rounded-lg px-2 py-1 text-[11px] font-bold border transition-colors cursor-pointer ${
                                  isExpanded
                                    ? 'bg-emerald-800 text-white border-emerald-800'
                                    : isDark
                                    ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                {isExpanded ? 'Tutup Detail' : 'Riwayat'}
                              </button>
                            </td>
                          </tr>

                          {/* Detail Breakdown Row */}
                          {isExpanded && (
                            <tr className={isDark ? 'bg-zinc-950/80' : 'bg-slate-50/60'}>
                              <td colSpan={9} className="py-3 px-4">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-xs font-bold">
                                    <span className={isDark ? 'text-zinc-300' : 'text-slate-700'}>
                                      Rincian Absensi Harian: {item.emp.fullName} ({new Date(`${selectedMonth}-01`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })})
                                    </span>
                                    <span className={`text-[11px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                                      Total {item.details.length} hari terdata
                                    </span>
                                  </div>
                                  {item.details.length === 0 ? (
                                    <p className={`text-xs italic ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                                      Belum ada rekaman kehadiran untuk karyawan ini di bulan {selectedMonth}.
                                    </p>
                                  ) : (
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                      {item.details
                                        .sort((a, b) => a.date.localeCompare(b.date))
                                        .map((d) => {
                                          let stBadge = '';
                                          let stLabel = '';
                                          if (d.status === 'PRESENT') {
                                            stBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800';
                                            stLabel = 'Hadir';
                                          } else if (d.status === 'PERMISSION') {
                                            stBadge = 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800';
                                            stLabel = 'Izin';
                                          } else if (d.status === 'OFF') {
                                            stBadge = 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/80 dark:text-sky-300 dark:border-sky-800';
                                            stLabel = 'Libur';
                                          } else {
                                            stBadge = 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/80 dark:text-red-300 dark:border-red-800';
                                            stLabel = 'Alfa';
                                          }
                                          return (
                                            <div
                                              key={d.date}
                                              className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-numeric ${stBadge}`}
                                            >
                                              <span className="font-bold">{d.date.slice(8, 10)}</span>
                                              <span className="font-extrabold uppercase text-[10px]">[{stLabel}]</span>
                                              {d.shift && (
                                                <span className="text-[9px] opacity-75">{d.shift}</span>
                                              )}
                                            </div>
                                          );
                                        })}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
