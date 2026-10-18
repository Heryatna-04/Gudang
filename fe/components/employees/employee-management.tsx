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
import { Card, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { StatCard } from '../ui/stat-card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table';
import { Pagination } from '../ui/pagination';

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
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

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

  // Pagination calculation
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEmployees.slice(start, start + itemsPerPage);
  }, [filteredEmployees, currentPage, itemsPerPage]);

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
      <Card className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-800 dark:text-emerald-400" />
            <CardTitle className="text-base font-extrabold uppercase tracking-tight text-slate-900 dark:text-zinc-100">
              MASTER DATA PEGAWAI &amp; IDENTITAS KASBON
            </CardTitle>
            <Badge variant="amber">
              Khusus Owner
            </Badge>
          </div>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-zinc-400">
            Kelola data registrasi seluruh pegawai gudang, hapus karyawan tidak aktif, dan monitor rincian tanggal serta nominal kasbon berjalan secara transparan.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          onClick={() => setIsAddModalOpen(true)}
        >
          <UserPlus className="h-4 w-4" />
          <span>Tambah Pegawai Baru</span>
        </Button>
      </Card>

      {/* Metric Cards Finansial & Personalia */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Pegawai Terdaftar"
          value={`${totalEmployeesCount} Orang`}
          subtitle="Tercatat di 4 unit gudang Green Cycle"
          icon={Users}
          variant="emerald"
        />

        <StatCard
          title="Pegawai Berkasbon Aktif"
          value={`${employeesWithLoanCount} Orang`}
          subtitle="Sedang memiliki cicilan pinjaman berjalan"
          icon={Clock}
          variant="amber"
        />

        <StatCard
          title="Total Sisa Kasbon Berjalan"
          value={`Rp${totalOutstandingLoanAmount.toLocaleString('id-ID')}`}
          subtitle="Akumulasi hutang belum dipotong gaji"
          icon={DollarSign}
          variant="rose"
        />

        <StatCard
          title="Pegawai Bebas Hutang"
          value={`${totalEmployeesCount - employeesWithLoanCount} Orang`}
          subtitle="Saldo kasbon Rp 0 (Bersih)"
          icon={BadgeCheck}
          variant="emerald"
        />
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Input
              icon={<Search className="h-4 w-4" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama pegawai, jabatan, atau nomor telepon..."
            />
          </div>

          {/* Filter options */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Penempatan Gudang */}
            <div className="flex items-center gap-1.5 min-w-[160px]">
              <Select
                icon={<Building2 className="h-3.5 w-3.5" />}
                value={selectedWarehouseFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedWarehouseFilter(val === 'ALL' ? 'ALL' : Number(val));
                }}
                options={[
                  { value: 'ALL', label: 'Semua Gudang' },
                  ...warehouses.map((w) => ({ value: w.id, label: w.name })),
                ]}
              />
            </div>

            {/* Filter Kasbon */}
            <div className="flex items-center gap-1.5 min-w-[180px]">
              <Select
                icon={<Filter className="h-3.5 w-3.5" />}
                value={loanFilter}
                onChange={(e) => setLoanFilter(e.target.value as 'ALL' | 'HAS_LOAN' | 'NO_LOAN')}
                options={[
                  { value: 'ALL', label: 'Semua Status Kasbon' },
                  { value: 'HAS_LOAN', label: 'Ada Kasbon Berjalan' },
                  { value: 'NO_LOAN', label: 'Bebas Kasbon (Rp 0)' },
                ]}
              />
            </div>
          </div>
        </div>

        <div className="text-[11px] font-semibold flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2 text-slate-500 dark:text-zinc-400">
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
      </Card>

      {/* Tabel Master Karyawan & Rincian Kasbon */}
      <Table>
        <TableHeader>
          <tr>
            <TableHead>Identitas Pegawai</TableHead>
            <TableHead>Jabatan & Unit</TableHead>
            <TableHead>Kontak (WhatsApp)</TableHead>
            <TableHead>Identitas Kasbon (Tanggal & Sisa)</TableHead>
            <TableHead className="text-center">Rincian</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {paginatedEmployees.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-12 text-center text-xs text-zinc-500 font-medium">
                Tidak ada pegawai yang sesuai dengan filter pencarian.
              </TableCell>
            </TableRow>
          ) : (
            paginatedEmployees.map((emp) => {
              const empWarehouse = warehouses.find((w) => w.id === emp.warehouseId);
              const activeLoanAmt = getEmployeeActiveLoanTotal(emp.id);
              const latestLoan = getEmployeeLatestLoan(emp.id);
              const allEmpLoans = getEmployeeLoans(emp.id);

              return (
                <TableRow key={emp.id}>
                  {/* Identitas Pegawai */}
                  <TableCell>
                    <div className="font-extrabold text-sm">{emp.fullName}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] font-mono text-slate-400 dark:text-zinc-500">
                      <span>ID: {emp.id}</span>
                      <span>•</span>
                      <span>Terdaftar: {emp.createdAt ? new Date(emp.createdAt).toLocaleDateString('id-ID') : '-'}</span>
                    </div>
                  </TableCell>

                  {/* Jabatan & Unit */}
                  <TableCell>
                    <div className="font-bold text-slate-800 dark:text-zinc-200">{emp.position}</div>
                    <Badge variant="slate" className="mt-1">
                      {empWarehouse?.name || `Gudang #${emp.warehouseId}`}
                    </Badge>
                  </TableCell>

                  {/* Kontak WhatsApp */}
                  <TableCell>
                    {emp.phone ? (
                      <a
                        href={`https://wa.me/62${emp.phone.replace(/^0/, '').replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold border transition-colors bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                        title="Chat via WhatsApp"
                      >
                        <Phone className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        <span>{emp.phone}</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-zinc-500 italic">Belum ada no. HP</span>
                    )}
                  </TableCell>

                  {/* Identitas Kasbon (Tanggal & Jumlah) */}
                  <TableCell>
                    {activeLoanAmt > 0 && latestLoan ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-numeric font-black text-sm text-amber-700 dark:text-amber-400">
                            Rp{activeLoanAmt.toLocaleString('id-ID')}
                          </span>
                          <Badge variant="amber">
                            Kasbon Aktif
                          </Badge>
                        </div>
                        <div className="text-[10px] font-medium flex items-center gap-1 text-slate-500 dark:text-zinc-400">
                          <Calendar className="h-3 w-3 text-amber-600" />
                          <span>Tgl: <strong className="text-zinc-700 dark:text-zinc-300">{latestLoan.loanDate}</strong></span>
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
                  </TableCell>

                  {/* Tombol Rincian Kasbon */}
                  <TableCell className="text-center">
                    {allEmpLoans.length > 0 ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedEmployeeForLoanDetail(emp)}
                        title="Buka seluruh catatan kasbon pegawai ini"
                      >
                        {allEmpLoans.length} Riwayat
                      </Button>
                    ) : (
                      <span className="text-[11px] text-zinc-500 font-medium">-</span>
                    )}
                  </TableCell>

                  {/* Aksi Hapus Pegawai */}
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEmployeeToDelete(emp)}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-500/10"
                      title="Hapus data pegawai"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Hapus</span>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* Pagination Kontrol */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
        totalItems={filteredEmployees.length}
        itemsPerPage={itemsPerPage}
      />

      {/* MODAL 1: Tambah Pegawai Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <Card className="w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-emerald-800 dark:text-emerald-400" />
                <CardTitle className="text-sm font-extrabold uppercase tracking-wide">
                  Tambah Registrasi Pegawai Baru
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 h-auto"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmitAdd} className="space-y-4">
              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-bold mb-1">
                  Nama Lengkap Pegawai <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  required
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                />
              </div>

              {/* Posisi / Jabatan */}
              <div>
                <label className="block text-xs font-bold mb-1">
                  Posisi / Jabatan Pekerjaan
                </label>
                <Select
                  value={formPosition}
                  onChange={(e) => setFormPosition(e.target.value)}
                  options={presetPositions.map((pos) => ({ value: pos, label: pos }))}
                />

                {formPosition === 'Lainnya (Ketik Bebas)' && (
                  <Input
                    type="text"
                    required
                    value={formCustomPosition}
                    onChange={(e) => setFormCustomPosition(e.target.value)}
                    placeholder="Ketik nama jabatan khusus..."
                    className="mt-2"
                  />
                )}
              </div>

              {/* Nomor Telepon / WhatsApp */}
              <div>
                <label className="block text-xs font-bold mb-1">
                  Nomor WhatsApp / HP
                </label>
                <Input
                  type="tel"
                  icon={<Phone className="h-3.5 w-3.5" />}
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="Contoh: 0812-3456-7890"
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
                <Select
                  value={formWarehouseId}
                  onChange={(e) => setFormWarehouseId(Number(e.target.value))}
                  options={warehouses.map((w) => ({
                    value: w.id,
                    label: `${w.name} (${w.address})`,
                  }))}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                >
                  Simpan Pegawai
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 2: Rincian Kasbon Lengkap Per Karyawan */}
      {selectedEmployeeForLoanDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <Card className="w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-zinc-200 dark:border-zinc-800">
              <div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-amber-500" />
                  <CardTitle className="text-sm font-extrabold uppercase">
                    Rincian Kasbon: {selectedEmployeeForLoanDetail.fullName}
                  </CardTitle>
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5">
                  {selectedEmployeeForLoanDetail.position} • {warehouses.find(w => w.id === selectedEmployeeForLoanDetail.warehouseId)?.name}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedEmployeeForLoanDetail(null)}
                className="p-1 h-auto"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Total summary */}
            <Card className="p-3 flex items-center justify-between bg-amber-50/70 border-amber-200 dark:bg-zinc-950 dark:border-zinc-800">
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">Total Sisa Kasbon Berjalan:</span>
              <span className="font-numeric text-base font-black text-amber-600 dark:text-amber-400">
                Rp{getEmployeeActiveLoanTotal(selectedEmployeeForLoanDetail.id).toLocaleString('id-ID')}
              </span>
            </Card>

            {/* List history kasbon */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {getEmployeeLoans(selectedEmployeeForLoanDetail.id).map((loan) => {
                const rem = loan.remainingAmount !== undefined ? loan.remainingAmount : loan.amount;
                return (
                  <Card
                    key={loan.id}
                    className="p-3 text-xs space-y-1 bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Calendar className="h-3.5 w-3.5 text-amber-500" />
                        <span>Tgl Pinjaman: {loan.loanDate}</span>
                      </div>
                      <Badge variant={loan.isDeducted || rem <= 0 ? 'emerald' : 'amber'}>
                        {loan.isDeducted || rem <= 0 ? 'Lunas' : 'Belum Lunas'}
                      </Badge>
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
                      <div className="text-[10px] text-zinc-500 pt-1 border-t border-zinc-200 dark:border-zinc-800">
                        Keperluan: {loan.notes}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>

            <div className="text-right pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedEmployeeForLoanDetail(null)}
              >
                Tutup
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL 3: Konfirmasi Hapus Pegawai */}
      {employeeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <Card className="w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="rounded-full bg-rose-500/10 p-2 border border-rose-500/20">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-sm font-extrabold uppercase text-rose-600 dark:text-rose-400">
                  Konfirmasi Hapus Pegawai
                </CardTitle>
                <p className="text-xs text-zinc-400">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <Card className="p-3 text-xs space-y-1.5 bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800">
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
            </Card>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEmployeeToDelete(null)}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmDelete}
              >
                Ya, Hapus Pegawai
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
