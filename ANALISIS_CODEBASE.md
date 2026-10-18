# ANALISIS KESELURUHAN CODEBASE: ERP TIMBANGAN RONGSOK (PT DAVID)

**Tanggal Analisis**: 18 Oktober 2026  
**Status Repositori**: Sinkron (`main` up-to-date dengan `origin/main`)  
**Kategori Sistem**: Offline-First Enterprise Resource Planning (ERP) & POS Hardware Timbangan

---

## 1. Ringkasan Eksekutif & Domain Bisnis

Sistem ini dirancang khusus untuk operasional pengepulan dan pengolahan logam bekas (rongsok) multi-gudang (4 gudang) dengan skala 60+ karyawan.
Fokus operasional:
1. **Kecepatan Transaksi & Hardware Direct**: Timbangan digital RS-232/Serial (Alexa BFS) dan printer thermal ESC/POS via browser Web API.
2. **Offline-First Resilience**: Tetap beroperasi tanpa jeda saat sinyal internet gudang terputus (IndexedDB Dexie.js + sinkronisasi Supabase).
3. **Pencegahan Fraud Finansial Kasir**: Manajemen shift kasir ketat (modal awal, rekonsiliasi kas fisik vs hitungan sistem, selisih kas).
4. **Isolasi Hak Akses (RBAC Ketat)**: Pemisahan tegas antara `OWNER` (Laba/Rugi, Finansial, Audit) dan `ADMIN` (Kasir POS, Operasional, Absensi).

---

## 2. Peta Arsitektur & Teknologi

### 2.1 Stack Teknologi
- **Frontend Core**: Next.js 16.3.6 (App Router), React 19.2.8, TypeScript 5.
- **Styling**: Tailwind CSS v4, Lucide React (ikon).
- **Client Storage & Offline DB**: Dexie.js (IndexedDB wrapper) dengan schema multi-tabel dan antrean sinkronisasi (`sync_queue`).
- **Backend & Cloud Database**: Supabase PostgreSQL dengan Row-Level Security (RLS) dan Realtime.
- **Hardware Integration**:
  - Web Serial API (`navigator.serial`) untuk membaca timbangan Alexa BFS.
  - Web USB / ESC-POS Command Builder untuk printer thermal struk nota (58mm/80mm).
- **Exporting**: SheetJS (`xlsx`) untuk laporan Excel multi-sheet.

### 2.2 Struktur Direktori Utama
```
David-beckham/
├── docs/                     # Dokumentasi SDLC, PRD, SRS, ADR, ERD & API Spec
├── supabase/
│   └── migrations/           # Skrip SQL DDL & RLS Supabase
└── fe/                       # Aplikasi Web Next.js
    ├── app/                  # Entry App Router (page.tsx, layout.tsx, globals.css)
    ├── components/
    │   ├── attendance/       # Modul Absensi 60 Karyawan
    │   ├── auth/             # Login Panel & Session Guard
    │   ├── debt/             # Piutang Pabrik & Hutang Pengepul
    │   ├── employees/        # Master Karyawan & Kasbon
    │   ├── layout/           # Sidebar & Header Nav (RBAC-aware)
    │   ├── mutation/         # Mutasi Stok Antar Gudang
    │   ├── opex/             # Biaya Operasional Gudang
    │   ├── owner/            # Dashboard Laba/Rugi, Arus Kas & Audit
    │   ├── pos/              # Kasir Timbangan, Keranjang, Tare, Nota
    │   ├── profile/          # Profil Usaha & Pengaturan
    │   ├── sales/            # Penjualan Borongan Pabrik Peleburan
    │   ├── shifts/           # Buka/Tutup Kasir & Rekonsiliasi Kas
    │   └── ui/               # Toast & Modal Dialog reusable
    ├── lib/
    │   ├── auth/             # Manajemen Akun & Auth Service
    │   ├── db/               # Dexie DB schema & Sync Engine ke Supabase
    │   ├── export/           # Excel Multi-Sheet Generator
    │   ├── hardware/         # Web Serial Scale Hook & ESC/POS Builder
    │   ├── mock/             # Data awal / dummy fallback
    │   └── supabase/         # Supabase Client SDK
    ├── public/               # Asset statis, PWA manifest, service worker (sw.js)
    └── types/                # Kontrak Data TypeScript menyeluruh
```

---

## 3. Analisis Modul & Fungsionalitas Utama

### 3.1 Kasir POS Timbangan (`fe/components/pos/kasir-pos.tsx`)
- Mendukung koneksi hardware timbangan via `useScaleSerial` (`navigator.serial`).
- Kalkulasi otomatis: `Netto = (Berat Bruto - Potongan Kotoran Kg) * (1 - Potongan Kotoran %)`.
- Dukungan 2 tier harga: `Harga Biasa` vs `Harga Langganan`.
- Validasi shift: Transaksi diblokir jika kasir belum membuka shift.
- Cetak struk instan ESC/POS dan penyimpanan lokal Dexie sebelum push online.

### 3.2 Offline-First Sync Engine (`fe/lib/db/sync-service.ts` & `dexie-db.ts`)
- Pola: *Local-Write First, Background Cloud Sync*.
- Setiap aksi (`transactions`, `shifts`, `sales`, `debts`, dll.) disimpan ke Dexie lokal secara sinkron.
- Perubahan dicatat di tabel `sync_queue` dengan status `PENDING`, `SYNCED`, atau `FAILED`.
- Deteksi status browser (`navigator.onLine` / event `online`), otomatis mengeksekusi flush antrean ke Supabase ketika jaringan kembali pulih.

### 3.3 Manajemen Shift & Kasir (`fe/components/shifts/shift-management.tsx`)
- Alur buka shift: Modal awal kas tunai dicatat.
- Alur tutup shift: Kasir menghitung fisik uang tunai di laci; sistem membandingkan dengan total pembelian tunai, kasbon keluar, dan modal awal.
- Selisih kas (Kurang/Lebih) dihitung otomatis dan dicatat permanen untuk audit Owner.

### 3.4 Penjualan Borongan Pabrik (`fe/components/sales/warehouse-sales.tsx`)
- Pencatatan pengiriman logam ke pabrik peleburan.
- Mendukung pembayaran tunai, transfer, dan tempo/kredit.
- Integrasi otomatis ke piutang usaha (`debts`) jika transaksi bertipe tempo.

### 3.5 Dashboard Owner & Finansial (`fe/components/owner/owner-dashboard.tsx`)
- Hanya bisa diakses oleh akun role `OWNER`.
- Menyajikan ringkasan omzet, HPP (pembelian rongsok), OPEX, laba kotor, dan laba bersih 4 gudang.
- Fitur ekspor Excel rekap transaksi menyeluruh.

---

## 4. Evaluasi Kualitas, Keamanan, & Observasi

| Aspek | Status | Catatan Evaluasi |
|---|---|---|
| **Pemisahan Role (RBAC)** | Baik (UI level) | UI terproteksi ketat; tab Owner tersembunyi bagi Admin. Validasi RLS database Supabase aktif di file migrasi. |
| **Resiliensi Hardware** | Sangat Baik | Menggunakan Web Serial standar; memiliki fallback input manual jika kabel RS-232 dilepas. |
| **PWA & Offline** | Aktif | Terdapat `manifest.json`, `sw.js`, dan registrasi service worker di client. |
| **State & Mutasi Data** | Campuran | Komponen utama di `app/page.tsx` mengelola state terpusat dengan trigger refresh, sinkron ke Dexie lokal dan Supabase. |
| **Ketergantungan Eksternal** | Ramping | Hanya memakai paket yang esensial (`dexie`, `supabase-js`, `lucide-react`, `xlsx`, `tailwindcss`). Tidak ada bloatware. |

---

## 5. Rekomendasi Pengembangan Lanjutan

1. **Unit & Integration Test**: Menambahkan pengujian otomatis (khususnya untuk rekonsiliasi kas dan rumus netto timbangan).
2. **Conflict Resolution**: Menambahkan strategi resolusi konflik data yang lebih mutakhir jika mutasi stok dilakukan simultan dari dua gudang dalam keadaan offline berkepanjangan.
3. **Audit Log Perubahan**: Logging eksplisit untuk perubahan master harga komoditas oleh admin/owner.
