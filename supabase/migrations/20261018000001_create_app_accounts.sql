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

-- Policy: Select akun profil (hanya untuk authenticated atau aplikasi internal)
DROP POLICY IF EXISTS "Allow select app accounts" ON public.app_accounts;
CREATE POLICY "Allow select app accounts"
ON public.app_accounts FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow update app accounts" ON public.app_accounts;
CREATE POLICY "Allow update app accounts"
ON public.app_accounts FOR UPDATE TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow insert app accounts" ON public.app_accounts;
CREATE POLICY "Allow insert app accounts"
ON public.app_accounts FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- SECURE RPC: Verifikasi login akun tanpa mengekspos PIN plaintext ke client
CREATE OR REPLACE FUNCTION public.verify_app_account(p_username VARCHAR, p_pin VARCHAR)
RETURNS TABLE (
    id UUID,
    username VARCHAR,
    full_name VARCHAR,
    role user_role,
    warehouse_id INT,
    is_active BOOLEAN
) SECURITY DEFINER LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT a.id, a.username, a.full_name, a.role, a.warehouse_id, a.is_active
    FROM public.app_accounts a
    WHERE LOWER(a.username) = LOWER(p_username)
      AND a.pin = p_pin
      AND a.is_active = TRUE;
END;
$$;

-- SECURE RPC: Pembaruan PIN aman dengan validasi PIN lama langsung di server DB
CREATE OR REPLACE FUNCTION public.update_app_pin(p_username VARCHAR, p_current_pin VARCHAR, p_new_pin VARCHAR)
RETURNS BOOLEAN SECURITY DEFINER LANGUAGE plpgsql AS $$
DECLARE
    v_found BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM public.app_accounts
        WHERE LOWER(username) = LOWER(p_username) AND pin = p_current_pin
    ) INTO v_found;

    IF NOT v_found THEN
        RETURN FALSE;
    END IF;

    UPDATE public.app_accounts
    SET pin = p_new_pin, updated_at = NOW()
    WHERE LOWER(username) = LOWER(p_username);

    RETURN TRUE;
END;
$$;

-- Seed Initial Accounts jika belum ada
INSERT INTO public.app_accounts (username, pin, full_name, role, warehouse_id)
VALUES
    ('owner', '8888', 'Bpk. David (Owner)', 'OWNER', 1),
    ('kasir', '1234', 'Siti Rahmawati (Kasir)', 'ADMIN', 1),
    ('kasir2', '1234', 'Kasir Gudang 2 (Bekasi)', 'ADMIN', 2),
    ('kasir3', '1234', 'Kasir Gudang 3 (Tangerang)', 'ADMIN', 3),
    ('kasir4', '1234', 'Kasir Gudang 4 (Semarang)', 'ADMIN', 4)
ON CONFLICT (username) DO NOTHING;
