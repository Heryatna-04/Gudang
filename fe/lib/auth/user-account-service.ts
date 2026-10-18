import { supabase, isSupabaseConfigured } from '../supabase/client';
import { UserRole, AppAccount } from '../../types';

export interface LocalCredential {
  username: string;
  pin: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  warehouseId?: number;
  updatedAt: string;
}

const STORAGE_KEY = 'gc_custom_credentials';

const DEFAULT_ACCOUNTS: Record<string, { fullName: string; role: UserRole; pins: string[]; warehouseId: number }> = {
  owner: {
    fullName: 'Bpk. David (Owner)',
    role: 'OWNER',
    pins: ['8888', '123456'],
    warehouseId: 1,
  },
  kasir: {
    fullName: 'Siti Rahmawati (Kasir)',
    role: 'ADMIN',
    pins: ['1234', '123456'],
    warehouseId: 1,
  },
  admin: {
    fullName: 'Siti Rahmawati (Kasir)',
    role: 'ADMIN',
    pins: ['1234', '123456'],
    warehouseId: 1,
  },
  kasir1: {
    fullName: 'Siti Rahmawati (Kasir)',
    role: 'ADMIN',
    pins: ['1234', '123456'],
    warehouseId: 1,
  },
  kasir2: {
    fullName: 'Kasir Gudang 2 (Bekasi)',
    role: 'ADMIN',
    pins: ['1234'],
    warehouseId: 2,
  },
  kasir3: {
    fullName: 'Kasir Gudang 3 (Tangerang)',
    role: 'ADMIN',
    pins: ['1234'],
    warehouseId: 3,
  },
  kasir4: {
    fullName: 'Kasir Gudang 4 (Semarang)',
    role: 'ADMIN',
    pins: ['1234'],
    warehouseId: 4,
  },
};

export class UserAccountService {
  /**
   * Mengambil peta kredensial lokal dari localStorage
   */
  static getLocalCredentialsMap(): Record<string, LocalCredential> {
    if (typeof window === 'undefined') return {};
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.warn('Gagal membaca kredensial lokal:', e);
      return {};
    }
  }

  /**
   * Mengambil detail profil akun saat ini (gabungan Supabase, LocalStorage & Default)
   */
  static async getAccount(username: string): Promise<AppAccount | null> {
    const cleanUser = username.trim().toLowerCase();

    // 1. Coba ambil dari Supabase
    if (typeof navigator !== 'undefined' && navigator.onLine && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('app_accounts')
          .select('*')
          .eq('username', cleanUser)
          .maybeSingle();

        if (data && !error) {
          return {
            id: data.id,
            username: data.username,
            pin: data.pin,
            fullName: data.full_name,
            role: data.role as UserRole,
            warehouseId: data.warehouse_id,
            phone: data.phone || '',
            isActive: data.is_active ?? true,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
      } catch (err) {
        console.warn('Gagal membaca akun dari Supabase:', err);
      }
    }

    // 2. Cek LocalStorage
    const localMap = this.getLocalCredentialsMap();
    if (localMap[cleanUser]) {
      const item = localMap[cleanUser];
      return {
        username: item.username,
        pin: item.pin,
        fullName: item.fullName,
        role: item.role,
        phone: item.phone || '',
        warehouseId: item.warehouseId ?? 1,
        isActive: true,
        updatedAt: item.updatedAt,
      };
    }

    // 3. Fallback data default
    const def = DEFAULT_ACCOUNTS[cleanUser];
    if (def) {
      return {
        username: cleanUser,
        pin: def.pins[0],
        fullName: def.fullName,
        role: def.role,
        warehouseId: def.warehouseId,
        phone: '',
        isActive: true,
      };
    }

    return null;
  }

  /**
   * Verifikasi PIN / Password saat ini
   */
  static async verifyCurrentPin(username: string, currentPin: string): Promise<boolean> {
    const cleanUser = username.trim().toLowerCase();
    const cleanPin = currentPin.trim();

    // 1. Cek Supabase jika online
    if (typeof navigator !== 'undefined' && navigator.onLine && isSupabaseConfigured) {
      try {
        const { data: rpcRes, error: rpcErr } = await supabase
          .rpc('verify_app_account', { p_username: cleanUser, p_pin: cleanPin });
        const item = Array.isArray(rpcRes) ? rpcRes[0] : rpcRes;
        if (item && !rpcErr) return true;

        const { data, error } = await supabase
          .from('app_accounts')
          .select('id')
          .eq('username', cleanUser)
          .eq('pin', cleanPin)
          .maybeSingle();

        if (data && !error) return true;
      } catch (err) {
        console.warn('Gagal verifikasi PIN ke Supabase:', err);
      }
    }

    // 2. Cek LocalStorage (jika pernah diubah)
    const localMap = this.getLocalCredentialsMap();
    if (localMap[cleanUser]) {
      return localMap[cleanUser].pin === cleanPin;
    }

    // 3. Cek Default Fallback
    const def = DEFAULT_ACCOUNTS[cleanUser];
    if (def) {
      return def.pins.includes(cleanPin);
    }

    return false;
  }

  /**
   * Perbarui PIN / Password pengguna
   */
  static async updatePassword(
    username: string,
    currentPin: string,
    newPin: string,
    profileData?: { fullName?: string; phone?: string; warehouseId?: number }
  ): Promise<{ success: boolean; message: string }> {
    const cleanUser = username.trim().toLowerCase();
    const cleanCurrent = currentPin.trim();
    const cleanNew = newPin.trim();

    if (!cleanNew || cleanNew.length < 4) {
      return { success: false, message: 'Password / PIN baru minimal 4 karakter.' };
    }

    if (cleanCurrent === cleanNew) {
      return { success: false, message: 'Password baru tidak boleh sama dengan password saat ini.' };
    }

    // Verifikasi PIN saat ini
    const isValid = await this.verifyCurrentPin(cleanUser, cleanCurrent);
    if (!isValid) {
      return { success: false, message: 'Password / PIN saat ini tidak sesuai.' };
    }

    const currentAcc = await this.getAccount(cleanUser);
    const fullName = profileData?.fullName?.trim() || currentAcc?.fullName || cleanUser;
    const role: UserRole = currentAcc?.role || (cleanUser === 'owner' ? 'OWNER' : 'ADMIN');
    const phone = profileData?.phone?.trim() ?? currentAcc?.phone ?? '';
    const warehouseId = profileData?.warehouseId ?? currentAcc?.warehouseId ?? 1;
    const nowIso = new Date().toISOString();

    // 1. Simpan ke LocalStorage agar langsung aktif offline
    try {
      const localMap = this.getLocalCredentialsMap();
      localMap[cleanUser] = {
        username: cleanUser,
        pin: cleanNew,
        fullName,
        role,
        phone,
        warehouseId,
        updatedAt: nowIso,
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(localMap));

        // Update sesi aktif jika cocok
        const sessionUser = sessionStorage.getItem('gc_kuningan_auth_user');
        if (sessionUser) {
          const parsed = JSON.parse(sessionUser);
          if (parsed.username === cleanUser) {
            sessionStorage.setItem(
              'gc_kuningan_auth_user',
              JSON.stringify({ ...parsed, fullName })
            );
          }
        }
      }
    } catch (e) {
      console.warn('Gagal menyimpan kredensial ke localStorage:', e);
    }

    // 2. Simpan ke Supabase jika online & configured
    if (typeof navigator !== 'undefined' && navigator.onLine && isSupabaseConfigured) {
      try {
        const { data: rpcSuccess, error: rpcError } = await supabase.rpc('update_app_pin', {
          p_username: cleanUser,
          p_current_pin: cleanCurrent,
          p_new_pin: cleanNew,
        });

        if (!rpcSuccess || rpcError) {
          // Fallback direct upsert jika RPC belum di-execute
          const { error } = await supabase.from('app_accounts').upsert(
            {
              username: cleanUser,
              pin: cleanNew,
              full_name: fullName,
              role,
              phone,
              warehouse_id: warehouseId,
              is_active: true,
              updated_at: nowIso,
            },
            { onConflict: 'username' }
          );

          if (error) {
            console.warn('Gagal sinkronisasi update PIN ke Supabase:', error.message);
          }
        }
      } catch (err) {
        console.warn('Error update PIN ke Supabase:', err);
      }
    }

    return {
      success: true,
      message: 'Password / PIN keamanan akun berhasil diperbarui!',
    };
  }

  /**
   * Perbarui informasi profil (Nama, No HP)
   */
  static async updateProfile(
    username: string,
    fullName: string,
    phone: string
  ): Promise<{ success: boolean; message: string }> {
    const cleanUser = username.trim().toLowerCase();
    const cleanName = fullName.trim();
    const cleanPhone = phone.trim();

    if (!cleanName) {
      return { success: false, message: 'Nama lengkap tidak boleh kosong.' };
    }

    const currentAcc = await this.getAccount(cleanUser);
    const pin = currentAcc?.pin || '1234';
    const role: UserRole = currentAcc?.role || (cleanUser === 'owner' ? 'OWNER' : 'ADMIN');
    const warehouseId = currentAcc?.warehouseId ?? 1;
    const nowIso = new Date().toISOString();

    // 1. Update ke LocalStorage
    try {
      const localMap = this.getLocalCredentialsMap();
      localMap[cleanUser] = {
        username: cleanUser,
        pin,
        fullName: cleanName,
        role,
        phone: cleanPhone,
        warehouseId,
        updatedAt: nowIso,
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(localMap));

        // Update session
        const sessionUser = sessionStorage.getItem('gc_kuningan_auth_user');
        if (sessionUser) {
          const parsed = JSON.parse(sessionUser);
          if (parsed.username === cleanUser) {
            sessionStorage.setItem(
              'gc_kuningan_auth_user',
              JSON.stringify({ ...parsed, fullName: cleanName })
            );
          }
        }
      }
    } catch (e) {
      console.warn('Gagal menyimpan profil ke localStorage:', e);
    }

    // 2. Update ke Supabase
    if (typeof navigator !== 'undefined' && navigator.onLine && isSupabaseConfigured) {
      try {
        await supabase.from('app_accounts').upsert(
          {
            username: cleanUser,
            full_name: cleanName,
            phone: cleanPhone,
            role,
            warehouse_id: warehouseId,
            pin,
            is_active: true,
            updated_at: nowIso,
          },
          { onConflict: 'username' }
        );
      } catch (err) {
        console.warn('Gagal update profil ke Supabase:', err);
      }
    }

    return {
      success: true,
      message: 'Profil identitas berhasil disimpan.',
    };
  }
}
