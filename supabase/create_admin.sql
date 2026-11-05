-- Veyra Admin Setup & Identity Resolver
-- Creates or updates admin@gmail.com (Password: Admin123!) and enables username-to-email login.
-- Safe and idempotent to run directly in Supabase SQL Editor.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 1. Create Identity Resolver Function (allows logging in with "admin" or "admin@gmail.com")
CREATE OR REPLACE FUNCTION public.resolve_login_identity(p_identity text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_temp
AS $$
DECLARE
  v_email text;
  v_user_exists boolean := false;
  v_is_suspended boolean := false;
  v_clean text;
BEGIN
  v_clean := lower(trim(p_identity));
  
  IF v_clean = '' OR v_clean IS NULL THEN
    RETURN json_build_object('exists', false, 'error', 'Identity cannot be empty');
  END IF;

  IF v_clean LIKE '%@%' THEN
    SELECT true, u.email, (coalesce(p.status, 'active') = 'suspended')
    INTO v_user_exists, v_email, v_is_suspended
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    WHERE lower(u.email) = v_clean
    LIMIT 1;
  ELSE
    SELECT true, u.email, (coalesce(p.status, 'active') = 'suspended')
    INTO v_user_exists, v_email, v_is_suspended
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE lower(p.username) = v_clean
    LIMIT 1;
  END IF;

  RETURN json_build_object(
    'exists', coalesce(v_user_exists, false),
    'email', v_email,
    'is_suspended', coalesce(v_is_suspended, false)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_login_identity(text) TO anon, authenticated;

-- 2. Create or Update admin@gmail.com with password Admin123!
DO $$
DECLARE
  v_uid uuid;
  v_new_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE lower(email) = 'admin@gmail.com' LIMIT 1;
  
  IF v_uid IS NULL THEN
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = v_new_id) THEN
      v_new_id := gen_random_uuid();
    END IF;
    v_uid := v_new_id;

    INSERT INTO auth.users (
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      v_uid,
      'authenticated',
      'authenticated',
      'admin@gmail.com',
      extensions.crypt('Admin123!', extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"username":"admin","display_name":"System Administrator"}',
      now(),
      now()
    );
  ELSE
    UPDATE auth.users
    SET encrypted_password = extensions.crypt('Admin123!', extensions.gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = v_uid;
  END IF;

  -- 3. Upsert Profile with admin role
  INSERT INTO public.profiles (id, username, display_name, role, status, bio)
  VALUES (
    v_uid,
    'admin',
    'System Administrator',
    'admin',
    'active',
    'Veyra Platform Administrator'
  )
  ON CONFLICT (id) DO UPDATE SET
    username = 'admin',
    role = 'admin',
    status = 'active';

  -- 4. Register in admin_users for Admin Console access
  INSERT INTO public.admin_users (user_id)
  VALUES (v_uid)
  ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE 'Admin user ready: email=admin@gmail.com, username=admin, password=Admin123!';
END $$;
