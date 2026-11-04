-- Migration 00004: Admin Moderation Policies and Report Resolution
-- Engine: PostgreSQL 15+ (Supabase)

-- 1. Enable authenticated users to check their own admin status in admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can check own admin status" ON public.admin_users;
CREATE POLICY "Users can check own admin status"
ON public.admin_users FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- 2. Allow administrators to update reports (e.g. resolve or dismiss)
DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;
CREATE POLICY "Admins can update reports"
ON public.reports FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 3. Allow administrators to update posts status (e.g. hide or restore) directly
DROP POLICY IF EXISTS "Admins can update post status" ON public.posts;
CREATE POLICY "Admins can update post status"
ON public.posts FOR UPDATE TO authenticated
USING (public.is_admin() OR author_id = auth.uid())
WITH CHECK (public.is_admin() OR author_id = auth.uid());

-- 4. Allow administrators to update profiles status (e.g. suspend or reactivate) directly
DROP POLICY IF EXISTS "Admins can update profile status" ON public.profiles;
CREATE POLICY "Admins can update profile status"
ON public.profiles FOR UPDATE TO authenticated
USING (public.is_admin() OR id = auth.uid())
WITH CHECK (public.is_admin() OR id = auth.uid());
