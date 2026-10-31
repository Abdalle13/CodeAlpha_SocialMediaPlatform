-- Migration 00003: Core Social Features, Post Media RLS, Reply Threading, and Block Enforcement
-- Engine: PostgreSQL 15+ (Supabase)

-- 1. Helper function for bidirectional block checks with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.are_users_blocked(p_user_a uuid, p_user_b uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocks
    WHERE (blocker_id = p_user_a AND blocked_id = p_user_b)
       OR (blocker_id = p_user_b AND blocked_id = p_user_a)
  );
$$;

REVOKE ALL ON FUNCTION public.are_users_blocked(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.are_users_blocked(uuid, uuid) TO authenticated;

-- Helper function to validate reply parent comments without RLS recursion
CREATE OR REPLACE FUNCTION public.is_valid_comment_parent(p_parent_id uuid, p_post_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.comments
    WHERE id = p_parent_id
      AND post_id = p_post_id
      AND status = 'active'
  );
$$;

REVOKE ALL ON FUNCTION public.is_valid_comment_parent(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_valid_comment_parent(uuid, uuid) TO authenticated;

-- Allow users to see block records where they are either blocker or blocked
DROP POLICY IF EXISTS "Users can view own blocks" ON public.blocks;
DROP POLICY IF EXISTS "Users can view blocks involving them" ON public.blocks;
CREATE POLICY "Users can view blocks involving them"
ON public.blocks FOR SELECT TO authenticated
USING (blocker_id = auth.uid() OR blocked_id = auth.uid());

-- 2. Add reply hierarchy to comments
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);

-- Enforce that a comment cannot be its own parent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'comments_no_self_parent'
  ) THEN
    ALTER TABLE public.comments ADD CONSTRAINT comments_no_self_parent CHECK (parent_id IS NULL OR parent_id <> id);
  END IF;
END $$;

-- 3. Update Posts SELECT policy to support followers-only posts and block enforcement
DROP POLICY IF EXISTS "Public active posts are viewable by authenticated users" ON public.posts;
DROP POLICY IF EXISTS "Posts viewable by authorized users" ON public.posts;

CREATE POLICY "Posts viewable by authorized users"
ON public.posts FOR SELECT TO authenticated
USING (
  author_id = auth.uid()
  OR public.is_admin()
  OR (
    status = 'active'
    AND NOT public.are_users_blocked(auth.uid(), posts.author_id)
    AND (
      visibility = 'public'
      OR (
        visibility = 'followers'
        AND EXISTS (
          SELECT 1 FROM public.follows 
          WHERE follower_id = auth.uid() AND following_id = posts.author_id
        )
      )
    )
  )
);

-- 4. Post Media RLS Policies
DROP POLICY IF EXISTS "Post media viewable on accessible posts" ON public.post_media;
DROP POLICY IF EXISTS "Authors can insert media on own posts" ON public.post_media;
DROP POLICY IF EXISTS "Authors can delete media from own posts" ON public.post_media;

CREATE POLICY "Post media viewable on accessible posts"
ON public.post_media FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = post_media.post_id
      AND (
        posts.author_id = auth.uid()
        OR public.is_admin()
        OR (
          posts.status = 'active'
          AND NOT public.are_users_blocked(auth.uid(), posts.author_id)
          AND (
            posts.visibility = 'public'
            OR (
              posts.visibility = 'followers'
              AND EXISTS (
                SELECT 1 FROM public.follows
                WHERE follower_id = auth.uid() AND following_id = posts.author_id
              )
            )
          )
        )
      )
  )
);

CREATE POLICY "Authors can insert media on own posts"
ON public.post_media FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = post_media.post_id
      AND posts.author_id = auth.uid()
      AND public.is_active_user()
  )
);

CREATE POLICY "Authors can delete media from own posts"
ON public.post_media FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = post_media.post_id
      AND posts.author_id = auth.uid()
      AND public.is_active_user()
  )
  OR public.is_admin()
);

-- 5. Comments RLS Policies for Threaded Replies and Author Moderation
DROP POLICY IF EXISTS "Comments viewable on accessible posts" ON public.comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments or comments on own posts" ON public.comments;

CREATE POLICY "Comments viewable on accessible posts"
ON public.comments FOR SELECT TO authenticated
USING (
  status = 'active'
  AND EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = comments.post_id
      AND (
        posts.author_id = auth.uid()
        OR public.is_admin()
        OR (
          posts.status = 'active'
          AND NOT public.are_users_blocked(auth.uid(), posts.author_id)
          AND (
            posts.visibility = 'public'
            OR (
              posts.visibility = 'followers'
              AND EXISTS (
                SELECT 1 FROM public.follows
                WHERE follower_id = auth.uid() AND following_id = posts.author_id
              )
            )
          )
        )
      )
  )
);

CREATE POLICY "Users can create comments"
ON public.comments FOR INSERT TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND public.is_active_user()
  AND EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = comments.post_id
      AND (
        posts.author_id = auth.uid()
        OR public.is_admin()
        OR (
          posts.status = 'active'
          AND NOT public.are_users_blocked(auth.uid(), posts.author_id)
          AND (
            posts.visibility = 'public'
            OR (
              posts.visibility = 'followers'
              AND EXISTS (
                SELECT 1 FROM public.follows
                WHERE follower_id = auth.uid() AND following_id = posts.author_id
              )
            )
          )
        )
      )
  )
  AND (
    comments.parent_id IS NULL
    OR public.is_valid_comment_parent(comments.parent_id, comments.post_id)
  )
);

CREATE POLICY "Users can delete own comments or comments on own posts"
ON public.comments FOR DELETE TO authenticated
USING (
  (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = comments.post_id
        AND posts.author_id = auth.uid()
    )
    OR public.is_admin()
  )
  AND public.is_active_user()
);
