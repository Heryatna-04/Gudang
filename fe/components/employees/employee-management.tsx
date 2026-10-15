'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Trash2,
  Phone,
  Search,
  Filter,
  DollarSign,
  AlertTriangle,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  X,
  CreditCard,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { Employee, EmployeeLoan, Warehouse } from '../../types';

interface EmployeeManagementProps {
  employees: Employee[];
  loans: EmployeeLoan[];
  warehouses: Warehouse[];
  currentWarehouseId: number;
  onAddEmployee: (emp: Employee) => void;
  onDeleteEmployee: (empId: string) => void;
  isDark?: boolean;
}

export function EmployeeManagement({
  employees,
  loans,
  warehouses,
  currentWarehouseId,
  onAddEmployee,
  onDeleteEmployee,
  isDark = false,
}: EmployeeManagementProps) {
  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState<number | 'ALL'>('ALL');
  const [loanFilter, setLoanFilter] = useState<'ALL' | 'HAS_LOAN' | 'NO_LOAN'>('ALL');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [selectedEmployeeForLoanDetail, setSelectedEmployeeForLoanDetail] = useState<Employee | null>(null);

  // Form tambah pegawai state
  const [formFullName, setFormFullName] = useState('');
  const [formPosition, setFormPosition] = useState('Tukang Timbang & Sortir');
  const [formCustomPosition, setFormCustomPosition] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formWarehouseId, setFormWarehouseId] = useState<number>(currentWarehouseId || 1);

  const presetPositions = [
    'Tukang Timbang & Sortir',
    'Tenaga Bongkar Muat',
    'Operator Alat Berat',
    'Driver Truk & Logistik',
    'Kasir & Administrasi',
    'Mandor Lapangan',
    'Helper Umum Gudang',
    'Lainnya (Ketik Bebas)',
  ];

  // Helper untuk hitung total kasbon berjalan per karyawan
  const getEmployeeLoans = (empId: string) => {
    return loans.filter((l) => l.employeeId === empId);
  };

  const getEmployeeActiveLoanTotal = (empId: string) => {
    return loans
      .filter((l) => l.employeeId === empId && !l.isDeducted)
      .reduce((sum, l) => sum + (l.remainingAmount !== undefined ? l.remainingAmount : l.amount), 0);
  };

  // Helper info tanggal kasbon terakhir
  const getEmployeeLatestLoan = (empId: string) => {
    const activeLoans = loans.filter((l) => l.employeeId === empId && !l.isDeducted);
    if (activeLoans.length === 0) return null;
    return activeLoans[activeLoans.length - 1];
  };

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // 1. Warehouse filter
      if (selectedWarehouseFilter !== 'ALL' && emp.warehouseId !== selectedWarehouseFilter) {
        return false;
      }

      // 2. Loan filter
      const activeLoanAmt = getEmployeeActiveLoanTotal(emp.id);
      if (loanFilter === 'HAS_LOAN' && activeLoanAmt <= 0) return false;
      if (loanFilter === 'NO_LOAN' && activeLoanAmt > 0) return false;

      // 3. Search query
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      const nameMatch = emp.fullName.toLowerCase().includes(q);
      const posMatch = emp.position.toLowerCase().includes(q);
      const phoneMatch = emp.phone ? emp.phone.includes(q) : false;
      return nameMatch || posMatch || phoneMatch;
    });
  }, [employees, loans, selectedWarehouseFilter, loanFilter, searchTerm]);

  // Financial Stats
  const totalEmployeesCount = employees.length;
  const employeesWithLoanCount = employees.filter((e) => getEmployeeActiveLoanTotal(e.id) > 0).length;
  const totalOutstandingLoanAmount = loans
    .filter((l) => !l.isDeducted)
    .reduce((sum, l) => sum + (l.remainingAmount !== undefined ? l.remainingAmount : l.amount), 0);

  // Submit Tambah Pegawai
  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFullName.trim()) return;

    const finalPosition =
      formPosition === 'Lainnya (Ketik Bebas)'
        ? formCustomPosition.trim() || 'Pekerja Gudang'
        : formPosition;

    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      fullName: formFullName.trim(),
      position: finalPosition,
      warehouseId: Number(formWarehouseId),
      phone: formPhone.trim() || undefined,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    onAddEmployee(newEmp);

    // Reset form
    setFormFullName('');
    setFormPosition('Tukang Timbang & Sortir');
    setFormCustomPosition('');
    setFormPhone('');
    setIsAddModalOpen(false);
  };

  // Submit Hapus Pegawai
  const handleConfirmDelete = () => {
    if (!employeeToDelete) return;
    onDeleteEmployee(employeeToDelete.id);
    setEmployeeToDelete(null);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className={`flex flex-col gap-4 rounded-2xl border p-5 shadow-sm md:flex-row md:items-center md:justify-between transition-colors ${
        isDark ? 'border-zinc-800 bg-black text-zinc-100' : 'border-slate-200 bg-white text-slate-900'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-800 dark:text-emerald-400" />
            <h2 className="text-base font-extrabold uppercase tracking-tight">
              MASTER DATA PEGAWAI &amp; IDENTITAS KASBON
            </h2>
            <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400 border border-amber-500/20">
              Khusus Owner
            </span>
          </div>
          <p className={`mt-1 text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Kelola data registrasi seluruh pegawai gudang, hapus karyawan tidak aktif, dan monitor rincian tanggal serta nominal kasbon berjalan secara transparan.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-900 transition-all cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          <span>Tambah Pegawai Baru</span>
        </button>
      </div>

      {/* Metric Cards Finansial & Personalia */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Pegawai */}
        <div className={`rounded-2xl border p-5 shadow-sm transition-colors ${
          isDark ? 'border-zinc-800 bg-black' : 'border-slate-200 bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Total Pegawai Terdaftar
            </span>
            <div className={`rounded-lg p-1.5 border ${
              isDark ? 'bg-zinc-900 text-emerald-400 border-zinc-700' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 font-numeric text-2xl font-black text-emerald-800 dark:text-emerald-400">
            {totalEmployeesCount} <span className="text-sm font-semibold text-zinc-400">Orang</span>
          </div>
          <div className={`mt-1 text-[11px] font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Tercatat di 4 unit gudang Green Cycle
          </div>
        </div>

        {/* Pegawai Punya Kasbon */}
        <div className={`rounded-2xl border p-5 shadow-sm transition-colors ${
          isDark ? 'border-zinc-800 bg-black' : 'border-slate-200 bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Pegawai Berkasbon Aktif
            </span>
            <div className={`rounded-lg p-1.5 border ${
              isDark ? 'bg-amber-950/80 text-amber-400 border-amber-800/60' : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 font-numeric text-2xl font-black text-amber-700 dark:text-amber-400">
            {employeesWithLoanCount} <span className="text-sm font-semibold text-zinc-400">Orang</span>
          </div>
          <div className={`mt-1 text-[11px] font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Sedang memiliki cicilan pinjaman berjalan
          </div>
        </div>

        {/* Total Kasbon Berjalan */}
        <div className={`rounded-2xl border p-5 shadow-sm transition-colors ${
          isDark ? 'border-zinc-800 bg-black' : 'border-slate-200 bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Total Sisa Kasbon Berjalan
            </span>
            <div className={`rounded-lg p-1.5 border ${
              isDark ? 'bg-rose-950/80 text-rose-400 border-rose-900/60' : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 font-numeric text-2xl font-black text-rose-600 dark:text-rose-400">
            Rp{totalOutstandingLoanAmount.toLocaleString('id-ID')}
          </div>
          <div className={`mt-1 text-[11px] font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Akumulasi hutang belum dipotong gaji
          </div>
        </div>

        {/* Pegawai Bebas Kasbon */}
        <div className={`rounded-2xl border p-5 shadow-sm transition-colors ${
          isDark ? 'border-zinc-800 bg-black' : 'border-slate-200 bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Pegawai Bebas Hutang
            </span>
            <div className={`rounded-lg p-1.5 border ${
              isDark ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              <BadgeCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 font-numeric text-2xl font-black text-emerald-700 dark:text-emerald-400">
            {totalEmployeesCount - employeesWithLoanCount} <span className="text-sm font-semibold text-zinc-400">Orang</span>
          </div>
          <div className={`mt-1 text-[11px] font-medium ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            Saldo kasbon Rp 0 (Bersih)
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className={`rounded-2xl border p-4 shadow-sm space-y-3 transition-colors ${
        isDark ? 'border-zinc-800 bg-black text-zinc-100' : 'border-slate-200 bg-white text-slate-900'
      }`}>
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className={`h-4 w-4 absolute left-3 top-3 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama pegawai, jabatan, atau nomor telepon..."
              className={`w-full rounded-xl border pl-9 pr-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700 transition-colors ${
                isDark ? 'border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500' : 'border-slate-300 bg-slate-50 text-slate-800 placeholder:text-slate-400'
              }`}
            />
          </div>

          {/* Filter options */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Penempatan Gudang */}
            <div className="flex items-center gap-1.5">
              <Building2 className={`h-3.5 w-3.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
              <select
                value={selectedWarehouseFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedWarehouseFilter(val === 'ALL' ? 'ALL' : Number(val));
                }}
                className={`rounded-xl border px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700 cursor-pointer transition-colors ${
                  isDark ? 'border-zinc-800 bg-zinc-950 text-zinc-100' : 'border-slate-300 bg-slate-50 text-slate-800'
                }`}
              >
                <option value="ALL">Semua Gudang</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Kasbon */}
            <div className="flex items-center gap-1.5">
              <Filter className={`h-3.5 w-3.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
              <select
                value={loanFilter}
                onChange={(e) => setLoanFilter(e.target.value as any)}
                className={`rounded-xl border px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700 cursor-pointer transition-colors ${
                  isDark ? 'border-zinc-800 bg-zinc-950 text-zinc-100' : 'border-slate-300 bg-slate-50 text-slate-800'
                }`}
              >
                <option value="ALL">Semua Status Kasbon</option>
                <option value="HAS_LOAN">Ada Kasbon Berjalan</option>
                <option value="NO_LOAN">Bebas Kasbon (Rp 0)</option>
              </select>
            </div>
          </div>
        </div>

        <div className={`text-[11px] font-semibold flex items-center justify-between border-t pt-2 ${
          isDark ? 'border-zinc-800/80 text-zinc-400' : 'border-slate-100 text-slate-500'
        }`}>
          <span>Menampilkan {filteredEmployees.length} dari {totalEmployeesCount} pegawai terdaftar</span>
          {(searchTerm || selectedWarehouseFilter !== 'ALL' || loanFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedWarehouseFilter('ALL');
                setLoanFilter('ALL');
              }}
              className="text-emerald-800 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Tabel Master Karyawan & Rincian Kasbon */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden transition-colors ${
        isDark ? 'border-zinc-800 bg-black text-zinc-100' : 'border-slate-200 bg-white text-slate-900'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`border-b font-extrabold uppercase tracking-wider ${
                isDark ? 'border-zinc-800 bg-zinc-950/80 text-zinc-300' : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}>
                <th className="py-3.5 px-4">Identitas Pegawai</th>
                <th className="py-3.5 px-4">Jabatan &amp; Unit</th>
                <th className="py-3.5 px-4">Kontak (WhatsApp)</th>
                <th className="py-3.5 px-4">Identitas Kasbon (Tanggal &amp; Sisa)</th>
                <th className="py-3.5 px-4 text-center">Rincian</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-zinc-800/80' : 'divide-slate-100'}`}>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-zinc-500 font-medium">
                    Tidak ada pegawai yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const empWarehouse = warehouses.find((w) => w.id === emp.warehouseId);
                  const activeLoanAmt = getEmployeeActiveLoanTotal(emp.id);
                  const latestLoan = getEmployeeLatestLoan(emp.id);
                  const allEmpLoans = getEmployeeLoans(emp.id);

                  return (
                    <tr
                      key={emp.id}
                      className={`transition-colors ${isDark ? 'hover:bg-zinc-900/50' : 'hover:bg-slate-50/80'}`}
                    >
                      {/* Identitas Pegawai */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-sm">{emp.fullName}</div>
                        <div className={`mt-0.5 flex items-center gap-2 text-[10px] font-mono ${
                          isDark ? 'text-zinc-500' : 'text-slate-400'
                        }`}>
                          <span>ID: {emp.id}</span>
                          <span>•</span>
                          <span>Terdaftar: {emp.createdAt ? new Date(emp.createdAt).toLocaleDateString('id-ID') : '-'}</span>
                        </div>
                      </td>

                      {/* Jabatan & Unit */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 dark:text-zinc-200">{emp.position}</div>
                        <span className={`inline-block mt-1 rounded px-2 py-0.5 text-[10px] font-semibold border ${
                          isDark
                            ? 'bg-zinc-900 text-zinc-300 border-zinc-700'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {empWarehouse?.name || `Gudang #${emp.warehouseId}`}
                        </span>
                      </td>

                      {/* Kontak WhatsApp */}
                      <td className="py-3.5 px-4">
                        {emp.phone ? (
                          <a
                            href={`https://wa.me/62${emp.phone.replace(/^0/, '').replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold border transition-colors ${
                              isDark
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/60'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            }`}
                            title="Chat via WhatsApp"
                          >
                            <Phone className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                            <span>{emp.phone}</span>
                          </a>
                        ) : (
                          <span className="text-[11px] text-zinc-500 italic">Belum ada no. HP</span>
                        )}
                      </td>

                      {/* Identitas Kasbon (Tanggal & Jumlah) */}
                      <td className="py-3.5 px-4">
                        {activeLoanAmt > 0 && latestLoan ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-numeric font-black text-sm text-amber-700 dark:text-amber-400">
                                Rp{activeLoanAmt.toLocaleString('id-ID')}
                              </span>
                              <span className="rounded bg-amber-500/10 px-1.5 py-0.2 text-[9px] font-extrabold uppercase text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                Kasbon Aktif
                              </span>
                            </div>
                            <div className={`text-[10px] font-medium flex items-center gap-1 ${
                              isDark ? 'text-zinc-400' : 'text-slate-500'
                            }`}>
                              <Calendar className="h-3 w-3 text-amber-600" />
                              <span>Tgl Pinjam: <strong className="text-zinc-200 dark:text-zinc-300">{latestLoan.loanDate}</strong></span>
                              {latestLoan.notes && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-[120px]" title={latestLoan.notes}>{latestLoan.notes}</span>
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="font-bold text-emerald-800 dark:text-emerald-400 text-xs">
                              Bebas Kasbon (Rp 0)
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Tombol Rincian Kasbon */}
                      <td className="py-3.5 px-4 text-center">
                        {allEmpLoans.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => setSelectedEmployeeForLoanDetail(emp)}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-extrabold border transition-colors cursor-pointer ${
                              isDark
                                ? 'bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800'
                                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                            }`}
                            title="Buka seluruh catatan kasbon pegawai ini"
                          >
                            {allEmpLoans.length} Riwayat
                          </button>
                        ) : (
                          <span className="text-[11px] text-zinc-500 font-medium">-</span>
                        )}
                      </td>

                      {/* Aksi Hapus Pegawai */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setEmployeeToDelete(emp)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-extrabold text-rose-600 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
                          title="Hapus data pegawai"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Hapus</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Tambah Pegawai Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl space-y-4 transition-colors ${
            isDark ? 'border-zinc-800 bg-black text-zinc-100' : 'border-slate-200 bg-white text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-emerald-800 dark:text-emerald-400" />
                <h3 className="text-sm font-extrabold uppercase tracking-wide">
                  Tambah Registrasi Pegawai Baru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdd} className="space-y-4">
              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-bold mb-1">
                  Nama Lengkap Pegawai <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className={`w-full rounded-xl border px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700 transition-colors ${
                    isDark ? 'border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500' : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400'
                  }`}
                />
              </div>

              {/* Posisi / Jabatan */}
              <div>
                <label className="block text-xs font-bold mb-1">
                  Posisi / Jabatan Pekerjaan
                </label>
                <select
                  value={formPosition}
                  onChange={(e) => setFormPosition(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700 cursor-pointer transition-colors ${
                    isDark ? 'border-zinc-800 bg-zinc-950 text-zinc-100' : 'border-slate-300 bg-white text-slate-900'
                  }`}
                >
                  {presetPositions.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>

                {formPosition === 'Lainnya (Ketik Bebas)' && (
                  <input
                    type="text"
                    required
                    value={formCustomPosition}
                    onChange={(e) => setFormCustomPosition(e.target.value)}
                    placeholder="Ketik nama jabatan khusus..."
                    className={`mt-2 w-full rounded-xl border px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700 transition-colors ${
                      isDark ? 'border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500' : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                )}
              </div>

              {/* Nomor Telepon / WhatsApp */}
              <div>
                <label className="block text-xs font-bold mb-1">
                  Nomor WhatsApp / HP
                </label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="Contoh: 0812-3456-7890"
                  className={`w-full rounded-xl border px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700 transition-colors ${
                    isDark ? 'border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500' : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400'
                  }`}
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Digunakan untuk kontak langsung &amp; slip gaji digital.
                </span>
              </div>

              {/* Penempatan Unit Gudang */}
              <div>
                <label className="block text-xs font-bold mb-1">
                  Penempatan Unit Gudang
                </label>
                <select
                  value={formWarehouseId}
                  onChange={(e) => setFormWarehouseId(Number(e.target.value))}
                  className={`w-full rounded-xl border px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700 cursor-pointer transition-colors ${
                    isDark ? 'border-zinc-800 bg-zinc-950 text-zinc-100' : 'border-slate-300 bg-white text-slate-900'
                  }`}
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.address})
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold border transition-colors cursor-pointer ${
                    isDark ? 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-800 px-5 py-2 text-xs font-extrabold text-white shadow-xs hover:bg-emerald-900 transition-all cursor-pointer"
                >
                  Simpan Pegawai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Rincian Kasbon Lengkap Per Karyawan */}
      {selectedEmployeeForLoanDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl space-y-4 transition-colors ${
            isDark ? 'border-zinc-800 bg-black text-zinc-100' : 'border-slate-200 bg-white text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-zinc-200 dark:border-zinc-800">
              <div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-amber-500" />
                  <h3 className="text-sm font-extrabold uppercase">
                    Rincian Kasbon: {selectedEmployeeForLoanDetail.fullName}
                  </h3>
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5">
                  {selectedEmployeeForLoanDetail.position} • {warehouses.find(w => w.id === selectedEmployeeForLoanDetail.warehouseId)?.name}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmployeeForLoanDetail(null)}
                className="rounded-lg p-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Total summary */}
            <div className={`rounded-xl border p-3 flex items-center justify-between ${
              isDark ? 'border-zinc-800 bg-zinc-950 text-zinc-200' : 'border-amber-200 bg-amber-50/70 text-slate-900'
            }`}>
              <span className="text-xs font-bold">Total Sisa Kasbon Berjalan:</span>
              <span className="font-numeric text-base font-black text-amber-600 dark:text-amber-400">
                Rp{getEmployeeActiveLoanTotal(selectedEmployeeForLoanDetail.id).toLocaleString('id-ID')}
              </span>
            </div>

            {/* List history kasbon */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {getEmployeeLoans(selectedEmployeeForLoanDetail.id).map((loan) => {
                const rem = loan.remainingAmount !== undefined ? loan.remainingAmount : loan.amount;
                return (
                  <div
                    key={loan.id}
                    className={`rounded-xl border p-3 text-xs space-y-1 transition-colors ${
                      isDark ? 'border-zinc-800 bg-zinc-950' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Calendar className="h-3.5 w-3.5 text-amber-500" />
                        <span>Tgl Pinjaman: {loan.loanDate}</span>
                      </div>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold border ${
                        loan.isDeducted || rem <= 0
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {loan.isDeducted || rem <= 0 ? 'Lunas' : 'Belum Lunas'}
                      </span>
                    </div>

                    <div className="flex justify-between text-[11px] pt-1">
                      <span className="text-zinc-400">Jumlah Awal:</span>
                      <span className="font-numeric font-bold">Rp{loan.amount.toLocaleString('id-ID')}</span>
                    </div>

                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">Sisa Hutang:</span>
                      <span className="font-numeric font-black text-amber-600 dark:text-amber-400">
                        Rp{rem.toLocaleString('id-ID')}
                      </span>
                    </div>

                    {loan.notes && (
                      <div className="text-[10px] text-zinc-500 pt-1 border-t border-zinc-800">
                        Keperluan: {loan.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="text-right pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setSelectedEmployeeForLoanDetail(null)}
                className="rounded-xl bg-zinc-800 px-4 py-2 text-xs font-bold text-zinc-100 hover:bg-zinc-700 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Konfirmasi Hapus Pegawai */}
      {employeeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl space-y-4 transition-colors ${
            isDark ? 'border-zinc-800 bg-black text-zinc-100' : 'border-slate-200 bg-white text-slate-900'
          }`}>
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="rounded-full bg-rose-500/10 p-2 border border-rose-500/20">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold uppercase">
                  Konfirmasi Hapus Pegawai
                </h3>
                <p className="text-xs text-zinc-400">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <div className={`rounded-xl border p-3 text-xs space-y-1.5 ${
              isDark ? 'border-zinc-800 bg-zinc-950' : 'border-slate-200 bg-slate-50'
            }`}>
              <div className="flex justify-between">
                <span className="text-zinc-400">Nama:</span>
                <span className="font-bold">{employeeToDelete.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Posisi:</span>
                <span className="font-bold">{employeeToDelete.position}</span>
              </div>

              {(() => {
                const activeLoan = getEmployeeActiveLoanTotal(employeeToDelete.id);
                if (activeLoan > 0) {
                  return (
                    <div className="mt-2 rounded-lg bg-amber-500/10 border border-amber-500/30 p-2 text-amber-700 dark:text-amber-400 text-[11px] font-bold">
                      ⚠️ PERINGATAN: Karyawan ini masih memiliki kasbon berjalan sebesar Rp{activeLoan.toLocaleString('id-ID')}. Pastikan hutang sudah diselesaikan sebelum dihapus.
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEmployeeToDelete(null)}
                className={`rounded-xl px-4 py-2 text-xs font-bold border transition-colors cursor-pointer ${
                  isDark ? 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-extrabold text-white shadow-xs transition-colors cursor-pointer"
              >
                Ya, Hapus Pegawai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
