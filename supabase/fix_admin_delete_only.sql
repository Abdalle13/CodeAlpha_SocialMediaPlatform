-- Step 1: Delete ALL broken admin rows so you can re-create cleanly via Dashboard
-- Run this in Supabase SQL Editor first.

DELETE FROM public.admin_users
WHERE user_id IN (SELECT id FROM auth.users WHERE lower(email) = 'admin@gmail.com');

DELETE FROM public.profiles
WHERE username = 'admin'
   OR id IN (SELECT id FROM auth.users WHERE lower(email) = 'admin@gmail.com');

DELETE FROM auth.identities
WHERE user_id IN (SELECT id FROM auth.users WHERE lower(email) = 'admin@gmail.com');

DELETE FROM auth.sessions
WHERE user_id IN (SELECT id FROM auth.users WHERE lower(email) = 'admin@gmail.com');

DELETE FROM auth.users WHERE lower(email) = 'admin@gmail.com';

-- Also delete orphaned dummy admin profile
DELETE FROM public.profiles WHERE id = '00000000-0000-0000-0000-000000000001';

SELECT 'Cleanup done. Now go to Supabase Dashboard > Authentication > Users > Add User.' AS status;

