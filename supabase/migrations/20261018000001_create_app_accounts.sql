-- Migration: 20261018000001_create_app_accounts.sql
-- Tabel Akun Aplikasi & Kredensial Akses ERP Green Cycle Kuningan

CREATE TABLE IF NOT EXISTS public.app_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    pin VARCHAR(100) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'ADMIN',
    warehouse_id INT REFERENCES public.warehouses(id),
    phone VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexing untuk query cepat saat login & update
CREATE INDEX IF NOT EXISTS idx_app_accounts_username ON public.app_accounts(username);

-- RLS
ALTER TABLE public.app_accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Select akun untuk verifikasi autentikasi
CREATE POLICY "Allow select app accounts"
ON public.app_accounts FOR SELECT TO anon, authenticated
USING (true);

-- Policy: Update PIN atau profil sendiri
CREATE POLICY "Allow update app accounts"
ON public.app_accounts FOR UPDATE TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Policy: Insert akun baru
CREATE POLICY "Allow insert app accounts"
ON public.app_accounts FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Seed Initial Accounts jika belum ada
INSERT INTO public.app_accounts (username, pin, full_name, role, warehouse_id)
VALUES
    ('owner', '8888', 'Bpk. David (Owner)', 'OWNER', 1),
    ('kasir', '1234', 'Siti Rahmawati (Kasir)', 'ADMIN', 1),
    ('kasir2', '1234', 'Kasir Gudang 2 (Bekasi)', 'ADMIN', 2),
    ('kasir3', '1234', 'Kasir Gudang 3 (Tangerang)', 'ADMIN', 3),
    ('kasir4', '1234', 'Kasir Gudang 4 (Semarang)', 'ADMIN', 4)
ON CONFLICT (username) DO NOTHING;
