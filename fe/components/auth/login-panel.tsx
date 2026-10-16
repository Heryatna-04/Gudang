'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Lock, User, ShieldAlert, ArrowRight } from 'lucide-react';
import { UserRole } from '../../types';

import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';

interface LoginPanelProps {
  onLoginSuccess: (user: { fullName: string; role: UserRole; username: string }) => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export function LoginPanel({ onLoginSuccess, isDark = false, onToggleTheme }: LoginPanelProps) {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    const cleanUser = username.trim().toLowerCase();
    const cleanPin = pin.trim();

    try {
      // 1. Coba Autentikasi Dinamis Langsung ke Supabase
      if (typeof navigator !== 'undefined' && navigator.onLine && isSupabaseConfigured) {
        const { data: dbAccount, error } = await supabase
          .from('app_accounts')
          .select('*')
          .eq('username', cleanUser)
          .eq('pin', cleanPin)
          .eq('is_active', true)
          .maybeSingle();

        if (dbAccount && !error) {
          setIsLoading(false);
          onLoginSuccess({
            fullName: dbAccount.full_name,
            role: dbAccount.role as UserRole,
            username: dbAccount.username,
          });
          return;
        }
      }

      // 2. Fallback Kredensial Internal Aman (Bekerja saat Offline / Tanpa Koneksi)
      if (cleanUser === 'owner' && (cleanPin === '8888' || cleanPin === '123456')) {
        setIsLoading(false);
        onLoginSuccess({
          fullName: 'Bpk. David (Owner)',
          role: 'OWNER',
          username: 'owner',
        });
        return;
      } else if (
        (cleanUser === 'kasir' || cleanUser === 'admin' || cleanUser === 'kasir1') &&
        (cleanPin === '1234' || cleanPin === '123456')
      ) {
        setIsLoading(false);
        onLoginSuccess({
          fullName: 'Siti Rahmawati (Kasir)',
          role: 'ADMIN',
          username: 'kasir',
        });
        return;
      } else if (cleanUser === 'kasir2' && cleanPin === '1234') {
        setIsLoading(false);
        onLoginSuccess({
          fullName: 'Kasir Gudang 2 (Bekasi)',
          role: 'ADMIN',
          username: 'kasir2',
        });
        return;
      } else if (cleanUser === 'kasir3' && cleanPin === '1234') {
        setIsLoading(false);
        onLoginSuccess({
          fullName: 'Kasir Gudang 3 (Tangerang)',
          role: 'ADMIN',
          username: 'kasir3',
        });
        return;
      } else if (cleanUser === 'kasir4' && cleanPin === '1234') {
        setIsLoading(false);
        onLoginSuccess({
          fullName: 'Kasir Gudang 4 (Semarang)',
          role: 'ADMIN',
          username: 'kasir4',
        });
        return;
      }

      setErrorMsg('ID Pengguna atau PIN keamanan tidak terdaftar. Periksa kembali input Anda.');
    } catch (err) {
      console.warn('Gagal memverifikasi login:', err);
      setErrorMsg('Terjadi kendala verifikasi keamanan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen w-full flex items-center justify-center p-4 font-sans transition-colors duration-200 ${
      isDark ? 'bg-black text-zinc-100' : 'bg-gradient-to-br from-slate-100 via-slate-50 to-emerald-50/30 text-slate-900'
    }`}>
      <div className={`w-full max-w-sm rounded-3xl p-7 shadow-2xl border transition-colors duration-200 relative ${
        isDark ? 'bg-black border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.8)]' : 'bg-white border-slate-200/80 shadow-slate-200/50'
      }`}>
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex relative w-14 h-14 rounded-2xl overflow-hidden shadow-xs border border-amber-600/30 p-1 bg-white mb-1">
            <Image
              src="/logo.png"
              alt="Green Cycle Kuningan"
              fill
              className="object-contain p-1"
              priority
            />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
              Green Cycle Kuningan
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
              Sistem ERP Kasir Timbangan Digital Terintegrasi
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 animate-in fade-in">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 text-red-600 dark:text-red-400" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="mt-5 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
              ID Pengguna / Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan ID Pengguna (misal: kasir / owner)"
                className="w-full rounded-xl border border-slate-300 dark:border-zinc-800 bg-slate-50/50 dark:bg-black pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white dark:focus:bg-black transition-all font-medium"
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
              PIN Keamanan Akses
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Masukkan PIN (misal: 1234 / 8888)"
                className="w-full rounded-xl border border-slate-300 dark:border-zinc-800 bg-slate-50/50 dark:bg-black pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white dark:focus:bg-black transition-all font-medium font-mono"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 py-3 text-xs font-bold text-white shadow-md shadow-emerald-950/20 transition-all disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? 'Memverifikasi Akses...' : 'Masuk ke Sistem'}
            {!isLoading && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </form>

        {/* Akses Cepat / Demo Credentials */}
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-zinc-800">
          <div className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 mb-2.5 text-center">
            Pilihan Akses Cepat Masuk:
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setUsername('kasir');
                setPin('1234');
              }}
              className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-2 text-center text-xs hover:border-emerald-700 dark:hover:border-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-zinc-900 transition-all cursor-pointer"
            >
              <div className="font-bold text-slate-900 dark:text-zinc-100">Kasir Timbangan</div>
              <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono mt-0.5">kasir / 1234</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setUsername('owner');
                setPin('8888');
              }}
              className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-2 text-center text-xs hover:border-amber-600 dark:hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-zinc-900 transition-all cursor-pointer"
            >
              <div className="font-bold text-amber-700 dark:text-amber-400">Executive Owner</div>
              <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono mt-0.5">owner / 8888</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
