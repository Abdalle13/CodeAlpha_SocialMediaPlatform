-- Step 2: After creating admin@gmail.com in Supabase Dashboard > Auth > Users,
-- run THIS script to give them the admin profile and admin_users entry.
-- The user must exist in auth.users first (created via Dashboard, NOT raw SQL).

DO $$
DECLARE
  v_uid uuid;
BEGIN
  -- Look up the user that Dashboard just created
  SELECT id INTO v_uid FROM auth.users WHERE lower(email) = 'admin@gmail.com' LIMIT 1;

  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'admin@gmail.com not found in auth.users. Create the user in Supabase Dashboard > Authentication > Users first.';
  END IF;

  -- Delete any leftover orphan profile that might conflict
  DELETE FROM public.profiles WHERE username = 'admin' AND id != v_uid;

  -- Upsert the profile row
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
    username = EXCLUDED.username,
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    bio = EXCLUDED.bio;

  -- Grant full admin access
  INSERT INTO public.admin_users (user_id)
  VALUES (v_uid)
  ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE 'SUCCESS: admin@gmail.com (id=%) now has admin role and admin_users entry.', v_uid;
END $$;
