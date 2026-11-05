-- Veyra Admin Setup & Repair Script
-- Deletes any corrupt auth rows and properly provisions admin@gmail.com with GoTrue auth identities.
-- Run this entire script in Supabase SQL Editor.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
DECLARE
  v_uid uuid := gen_random_uuid();
  v_inst uuid;
BEGIN
  -- 1. Remove previous/corrupt admin rows completely
  DELETE FROM public.admin_users WHERE user_id IN (SELECT id FROM auth.users WHERE lower(email) = 'admin@gmail.com');
  DELETE FROM public.profiles WHERE username = 'admin' OR id IN (SELECT id FROM auth.users WHERE lower(email) = 'admin@gmail.com');
  DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE lower(email) = 'admin@gmail.com');
  DELETE FROM auth.users WHERE lower(email) = 'admin@gmail.com';

  -- Also clean up orphaned dummy id
  DELETE FROM public.profiles WHERE id = '00000000-0000-0000-0000-000000000001';

  -- 2. Detect the instance_id from other active users in your Supabase project
  SELECT instance_id INTO v_inst FROM auth.users LIMIT 1;
  IF v_inst IS NULL THEN
    v_inst := '00000000-0000-0000-0000-000000000000';
  END IF;

  -- 3. Insert complete valid user row in auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at
  ) VALUES (
    v_inst,
    v_uid,
    'authenticated',
    'authenticated',
    'admin@gmail.com',
    extensions.crypt('Admin123!', extensions.gen_salt('bf', 10)),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"username":"admin","display_name":"System Administrator"}'::jsonb,
    false,
    now(),
    now()
  );

  -- 4. Insert required identity row in auth.identities (Required by Supabase GoTrue Auth)
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_uid::text,
    v_uid,
    json_build_object('sub', v_uid::text, 'email', 'admin@gmail.com'),
    'email',
    'admin@gmail.com',
    now(),
    now(),
    now()
  );

  -- 5. Insert profile with admin role
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

  -- 6. Insert into admin_users table for full dashboard access
  INSERT INTO public.admin_users (user_id)
  VALUES (v_uid)
  ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE 'SUCCESS: admin@gmail.com (username: admin, password: Admin123!) has been cleanly created and verified.';
END $$;
