-- Script to create or upgrade the official Admin user: admin@gmail.com
-- Password: Admin123!
-- Safe and idempotent to run in Supabase SQL Editor.

DO $$
DECLARE
  v_uid uuid;
  v_new_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- 1. Check if an account with admin@gmail.com already exists in auth.users
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
      crypt('Admin123!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"username":"admin","display_name":"System Administrator"}',
      now(),
      now()
    );
  ELSE
    UPDATE auth.users
    SET encrypted_password = crypt('Admin123!', gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = v_uid;
  END IF;

  -- 2. Create or update profile with admin role
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
    role = 'admin',
    status = 'active';

  -- 3. Insert into admin_users to unlock the Admin Console (/admin)
  INSERT INTO public.admin_users (user_id)
  VALUES (v_uid)
  ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE 'Admin user ready: email=admin@gmail.com, password=Admin123!';
END $$;

