'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  ShieldCheck,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertCircle,
  Store,
  Phone,
  Shield,
  Clock,
  LogOut,
  Sparkles,
  BadgeCheck,
  Building2,
  Calendar,
  Layers,
} from 'lucide-react';
import { UserRole } from '../../types';
import { UserAccountService } from '../../lib/auth/user-account-service';
import { useToast } from '../ui/toast-notification';

interface ProfileIdentityProps {
  currentUser: { fullName: string; role: UserRole; username: string };
  activeWarehouseName: string;
  onUpdateCurrentUser: (updated: { fullName: string; role: UserRole; username: string }) => void;
  isDark?: boolean;
  onLogout: () => void;
}

export function ProfileIdentity({
  currentUser,
  activeWarehouseName,
  onUpdateCurrentUser,
  isDark = false,
  onLogout,
}: ProfileIdentityProps) {
  const { success, error, warning } = useToast();

  // State Profile Form
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [phone, setPhone] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // State Change Password Form
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);

  // Inisialisasi data akun
  useEffect(() => {
    async function loadAccountData() {
      const acc = await UserAccountService.getAccount(currentUser.username);
      if (acc) {
        setFullName(acc.fullName);
        setPhone(acc.phone || '');
        if (acc.updatedAt) {
          setUpdatedAt(acc.updatedAt);
        }
      }
    }
    loadAccountData();
  }, [currentUser.username]);

  // Handler Simpan Profil
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      error('Nama lengkap tidak boleh kosong.', 'Validasi Profil');
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await UserAccountService.updateProfile(currentUser.username, fullName, phone);
      if (res.success) {
        onUpdateCurrentUser({
          ...currentUser,
          fullName: fullName.trim(),
        });
        setUpdatedAt(new Date().toISOString());
        success('Informasi profil identitas berhasil diperbarui!', 'Profil Tersimpan');
      } else {
        error(res.message, 'Gagal Menyimpan');
      }
    } catch (err) {
      console.warn('Gagal update profil:', err);
      error('Terjadi kesalahan saat menyimpan profil identitas.', 'Kesalahan Sistem');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handler Ubah Password / PIN
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPin.trim()) {
      warning('Masukkan PIN / Password saat ini untuk verifikasi keamanan.', 'Verifikasi Diperlukan');
      return;
    }

    if (!newPin.trim() || newPin.trim().length < 4) {
      warning('Password / PIN baru minimal 4 karakter.', 'Validasi Password');
      return;
    }

    if (newPin.trim() !== confirmPin.trim()) {
      error('Konfirmasi PIN baru tidak sesuai dengan PIN baru.', 'Password Tidak Cocok');
      return;
    }

    if (currentPin.trim() === newPin.trim()) {
      warning('Password baru tidak boleh sama dengan password saat ini.', 'Password Sama');
      return;
    }

    setIsUpdatingPin(true);
    try {
      const res = await UserAccountService.updatePassword(
        currentUser.username,
        currentPin,
        newPin,
        {
          fullName,
          phone,
        }
      );

      if (res.success) {
        success(res.message, 'Keamanan Diperbarui');
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
        setUpdatedAt(new Date().toISOString());
      } else {
        error(res.message, 'Verifikasi Gagal');
      }
    } catch (err) {
      console.warn('Gagal update password:', err);
      error('Terjadi kesalahan saat memproses pembaruan password.', 'Kesalahan Sistem');
    } finally {
      setIsUpdatingPin(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('');
  };

  const isOwner = currentUser.role === 'OWNER';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Identity Overview Banner */}
      <div
        className={`p-6 rounded-3xl border shadow-xs transition-colors duration-200 ${
          isDark
            ? 'bg-zinc-950/80 border-zinc-800 text-zinc-100 shadow-[0_0_30px_rgba(0,0,0,0.5)]'
            : 'bg-white border-slate-200 shadow-slate-200/50 text-slate-800'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* User Avatar & Name */}
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl tracking-wider shadow-md flex-shrink-0 border ${
                isOwner
                  ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white border-amber-400/40 shadow-amber-900/30'
                  : 'bg-gradient-to-br from-emerald-600 to-emerald-800 text-white border-emerald-400/40 shadow-emerald-950/30'
              }`}
            >
              {getInitials(fullName || currentUser.fullName)}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg md:text-xl font-bold tracking-tight">
                  {fullName || currentUser.fullName}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                    isOwner
                      ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700/60'
                      : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3" />
                  {isOwner ? 'Executive Owner' : 'Kasir Timbangan (Admin)'}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Akun Aktif
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-zinc-400">
                <span className="font-mono text-slate-700 dark:text-zinc-300 font-semibold flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  ID: @{currentUser.username}
                </span>
                <span className="flex items-center gap-1">
                  <Store className="w-3.5 h-3.5 text-slate-400" />
                  Penugasan: <strong className="text-slate-700 dark:text-zinc-200">{activeWarehouseName}</strong>
                </span>
                {updatedAt && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    PIN Diperbarui: {new Date(updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions / Role Badge Highlight */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onLogout}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                isDark
                  ? 'border-red-900/60 bg-red-950/30 text-red-400 hover:bg-red-950/50 hover:border-red-800'
                  : 'border-red-200 bg-red-50/70 text-red-700 hover:bg-red-100 hover:border-red-300'
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar Sesi
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Form Identitas & Form Ganti Password */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Data Profil & Wewenang Akun (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card Data Identitas */}
          <div
            className={`p-6 rounded-3xl border shadow-xs transition-colors duration-200 ${
              isDark ? 'bg-zinc-950/80 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-100 dark:border-zinc-800/80">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">Informasi Identitas Diri</h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Perbarui nama dan kontak yang tertera pada nota dan log sistem.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  ID Pengguna (Username)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={currentUser.username}
                    disabled
                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900/60 px-3.5 py-2.5 text-xs text-slate-500 dark:text-zinc-500 font-mono font-medium cursor-not-allowed select-none"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-600 absolute right-3.5 top-3" />
                </div>
                <p className="mt-1 text-[10px] text-slate-400 dark:text-zinc-500">
                  ID Pengguna terdaftar secara permanen dan tidak dapat diubah sembarangan.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Nama Lengkap / Identitas Kasir <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Masukkan nama lengkap Anda"
                  className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-black px-3.5 py-2.5 text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Nomor WhatsApp / Kontak Operasional
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 0812-3456-7890"
                    className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-black pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Lokasi Gudang Penugasan
                </label>
                <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/40 text-xs">
                  <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">{activeWarehouseName}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingProfile}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 py-2.5 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer disabled:opacity-60"
              >
                <Save className="w-3.5 h-3.5" />
                {isSavingProfile ? 'Menyimpan...' : 'Simpan Perubahan Identitas'}
              </button>
            </form>
          </div>

          {/* Card Otoritas & Hak Akses Sesuai Role */}
          <div
            className={`p-6 rounded-3xl border shadow-xs transition-colors duration-200 ${
              isDark ? 'bg-zinc-950/80 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2.5 pb-4 mb-3 border-b border-slate-100 dark:border-zinc-800/80">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">Hak Akses & Otoritas Sistem</h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Cakupan wewenang akun Anda dalam operasional ERP.
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              {isOwner ? (
                <>
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 text-slate-700 dark:text-zinc-300">
                    <BadgeCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span>Akses penuh finansial, laba/rugi global & arus kas 4 gudang.</span>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 text-slate-700 dark:text-zinc-300">
                    <BadgeCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span>Otorisasi & persetujuan nota transaksi jumbo (&gt; Rp 10.000.000).</span>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 text-slate-700 dark:text-zinc-300">
                    <BadgeCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span>Kelola master pegawai, kasbon dinamis, dan harga patokan komoditas.</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 text-slate-700 dark:text-zinc-300">
                    <BadgeCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Akses Kasir POS Timbangan digital & pencetakan struk nota masuk.</span>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 text-slate-700 dark:text-zinc-300">
                    <BadgeCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Pencatatan kas laci buka/tutup per shift & biaya operasional kecil.</span>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 text-slate-700 dark:text-zinc-300">
                    <BadgeCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Pencatatan absensi shift kerja kuli timbang & helper gudang.</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Form Ubah Password / PIN (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div
            className={`p-6 md:p-8 rounded-3xl border shadow-xs transition-colors duration-200 ${
              isDark ? 'bg-zinc-950/80 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center gap-3 pb-5 mb-5 border-b border-slate-100 dark:border-zinc-800/80">
              <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 shadow-2xs">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold tracking-tight">Ubah Password / PIN Keamanan Akun</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Ganti password atau PIN akses Anda secara mandiri untuk menjaga keamanan akun.
                </p>
              </div>
            </div>

            {/* Info Notice */}
            <div className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/50 border border-slate-200/80 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-300 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800 dark:text-zinc-100">
                  Keamanan Akses Multi-Fungsi:
                </span>{' '}
                {isOwner ? (
                  <span>
                    PIN keamanan Owner digunakan untuk login akun serta menjadi <strong>PIN otorisasi transaksi jumbo</strong> bila timbangan melampaui Rp 10.000.000.
                  </span>
                ) : (
                  <span>
                    PIN keamanan Kasir digunakan untuk membuka kas laci, konfirmasi shift kerja, dan login ke sistem timbangan gudang.
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              {/* PIN Saat Ini */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  PIN / Password Saat Ini <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type={showCurrentPin ? 'text' : 'password'}
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value)}
                    placeholder="Masukkan PIN / Password lama Anda"
                    className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-black pl-10 pr-10 py-2.5 text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-mono font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPin(!showCurrentPin)}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 cursor-pointer"
                    title={showCurrentPin ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {showCurrentPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* PIN Baru */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  PIN / Password Baru <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type={showNewPin ? 'text' : 'password'}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="Minimal 4 digit angka atau karakter"
                    className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-black pl-10 pr-10 py-2.5 text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-mono font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPin(!showNewPin)}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 cursor-pointer"
                    title={showNewPin ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-slate-400 dark:text-zinc-500">
                  Dapat menggunakan kombinasi angka (misal PIN 6 digit) atau kombinasi teks alfanumerik.
                </p>
              </div>

              {/* Konfirmasi PIN Baru */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Konfirmasi PIN / Password Baru <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type={showConfirmPin ? 'text' : 'password'}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    placeholder="Ketik ulang PIN / Password baru"
                    className={`w-full rounded-xl border pl-10 pr-10 py-2.5 text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none font-mono font-medium ${
                      confirmPin && newPin !== confirmPin
                        ? 'border-red-400 bg-red-50/20 dark:border-red-800'
                        : 'border-slate-300 dark:border-zinc-700 bg-white dark:bg-black focus:ring-2 focus:ring-emerald-700'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 cursor-pointer"
                    title={showConfirmPin ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPin && newPin !== confirmPin && (
                  <p className="mt-1 text-[11px] text-red-600 dark:text-red-400 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    Konfirmasi PIN belum cocok dengan PIN baru.
                  </p>
                )}
                {confirmPin && newPin === confirmPin && (
                  <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                    Konfirmasi PIN cocok dan siap disimpan.
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingPin || (Boolean(confirmPin) && newPin !== confirmPin)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 py-3 text-xs font-bold text-white shadow-md shadow-emerald-950/20 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <KeyRound className="w-4 h-4" />
                  {isUpdatingPin ? 'Memverifikasi & Menyimpan...' : 'Perbarui Password & PIN Keamanan'}
                </button>
              </div>
            </form>

            {/* Rekomendasi Keamanan */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-zinc-800/80">
              <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Pedoman Keamanan Green Cycle Kuningan:
              </h4>
              <ul className="text-[11px] text-slate-500 dark:text-zinc-400 space-y-1 list-disc list-inside">
                <li>Gunakan PIN yang mudah Anda ingat namun sulit ditebak orang lain.</li>
                <li>Dilarang memberitahukan PIN kasir atau Owner kepada pihak luar atau supir timbangan.</li>
                <li>Password baru langsung aktif secara otomatis baik saat online maupun saat koneksi offline.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
