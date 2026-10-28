-- Migration 00002: Row Level Security, Grants, Triggers & Core Functions for Veyra
-- Engine: PostgreSQL 15+ (Supabase)

-- 1. Enable RLS on every public table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

-- 2. Revoke default function execution from PUBLIC
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- 3. Hardened Security Helper Functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.admin_users 
    WHERE user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
      AND status = 'active'
  );
$$;

REVOKE ALL ON FUNCTION public.is_active_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_user() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_conversation_participant(p_convo_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.conversation_participants 
    WHERE conversation_id = p_convo_id 
      AND user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_conversation_participant(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid) TO authenticated, service_role;

-- 4. Column-Level Grants & Defense Guard on Profiles
REVOKE UPDATE ON public.profiles FROM authenticated, anon, PUBLIC;
GRANT UPDATE (
  display_name,
  bio,
  website,
  avatar_url,
  avatar_file_id,
  cover_url,
  cover_file_id,
  notification_preferences,
  updated_at
) ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_profile_privileged_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF (NEW.role IS DISTINCT FROM OLD.role OR NEW.status IS DISTINCT FROM OLD.status) THEN
    IF auth.role() <> 'service_role' THEN
      RAISE EXCEPTION 'Access denied: Cannot modify privileged fields (role, status).' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_profile_privileged_fields ON public.profiles;
CREATE TRIGGER trg_guard_profile_privileged_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileged_fields();

-- 5. Safe Messaging Provisioning & Read Receipts
REVOKE INSERT ON public.conversations, public.conversation_participants FROM authenticated, anon, PUBLIC;
REVOKE UPDATE, DELETE ON public.conversation_participants FROM authenticated, anon, PUBLIC;
REVOKE UPDATE, DELETE ON public.messages FROM authenticated, anon, PUBLIC;

CREATE OR REPLACE FUNCTION public.start_or_get_direct_conversation(p_recipient_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id uuid := auth.uid();
  v_pair_key text;
  v_convo_id uuid;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
  END IF;

  IF p_recipient_id = v_caller_id THEN
    RAISE EXCEPTION 'Cannot start a conversation with yourself.' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_caller_id AND status = 'active') THEN
    RAISE EXCEPTION 'Your account is suspended.' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_recipient_id AND status = 'active') THEN
    RAISE EXCEPTION 'Recipient account is not active.' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.blocks 
    WHERE (blocker_id = v_caller_id AND blocked_id = p_recipient_id)
       OR (blocker_id = p_recipient_id AND blocked_id = v_caller_id)
  ) THEN
    RAISE EXCEPTION 'Cannot initiate conversation due to block restrictions.' USING ERRCODE = '42501';
  END IF;

  v_pair_key := LEAST(v_caller_id::text, p_recipient_id::text) || ':' || GREATEST(v_caller_id::text, p_recipient_id::text);

  -- Acquire transactional advisory lock based on the pair hash
  PERFORM pg_advisory_xact_lock(hashtext(v_pair_key));

  SELECT id INTO v_convo_id
  FROM public.conversations
  WHERE direct_pair_key = v_pair_key;

  IF v_convo_id IS NOT NULL THEN
    RETURN v_convo_id;
  END IF;

  INSERT INTO public.conversations (direct_pair_key)
  VALUES (v_pair_key)
  RETURNING id INTO v_convo_id;

  INSERT INTO public.conversation_participants (conversation_id, user_id, joined_at, last_read_at)
  VALUES 
    (v_convo_id, v_caller_id, now(), now()),
    (v_convo_id, p_recipient_id, now(), NULL);

  RETURN v_convo_id;
END;
$$;

REVOKE ALL ON FUNCTION public.start_or_get_direct_conversation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_or_get_direct_conversation(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.mark_conversation_read(p_convo_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_conversation_participant(p_convo_id) THEN
    RAISE EXCEPTION 'Not a participant in this conversation.' USING ERRCODE = '42501';
  END IF;

  UPDATE public.conversation_participants
  SET last_read_at = now()
  WHERE conversation_id = p_convo_id
    AND user_id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.mark_conversation_read(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read(uuid) TO authenticated;

-- 6. Server-Side Privileged Moderation Execution
CREATE OR REPLACE FUNCTION public.execute_admin_moderation(
  p_actor_admin_id uuid,
  p_action text,
  p_target_type text,
  p_target_id uuid,
  p_reason text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Access denied: Function callable only by service role.' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = p_actor_admin_id) THEN
    RAISE EXCEPTION 'Access denied: Verified user is not an administrator.' USING ERRCODE = '42501';
  END IF;

  IF p_action = 'suspend_user' THEN
    UPDATE public.profiles SET status = 'suspended', updated_at = now() WHERE id = p_target_id;
  ELSIF p_action = 'reactivate_user' THEN
    UPDATE public.profiles SET status = 'active', updated_at = now() WHERE id = p_target_id;
  ELSIF p_action = 'hide_post' THEN
    UPDATE public.posts SET status = 'hidden', updated_at = now() WHERE id = p_target_id;
  ELSIF p_action = 'restore_post' THEN
    UPDATE public.posts SET status = 'active', updated_at = now() WHERE id = p_target_id;
  ELSE
    RAISE EXCEPTION 'Invalid moderation action: %', p_action USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.moderation_actions (
    actor_admin_id, action, target_type, target_id, reason, metadata
  ) VALUES (
    p_actor_admin_id, p_action, p_target_type, p_target_id, p_reason, p_metadata
  );
END;
$$;

REVOKE ALL ON FUNCTION public.execute_admin_moderation(uuid, text, text, uuid, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.execute_admin_moderation(uuid, text, text, uuid, text, jsonb) TO service_role;

-- 7. Explicit Row Level Security Policies

-- Profiles Policies
CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles FOR SELECT TO authenticated
USING (status = 'active' OR id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update own editable profile fields"
ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid() AND public.is_active_user())
WITH CHECK (id = auth.uid());

-- Posts Policies
CREATE POLICY "Public active posts are viewable by authenticated users"
ON public.posts FOR SELECT TO authenticated
USING (
  (status = 'active' AND visibility = 'public' AND NOT EXISTS (
    SELECT 1 FROM public.blocks 
    WHERE (blocker_id = auth.uid() AND blocked_id = posts.author_id)
       OR (blocker_id = posts.author_id AND blocked_id = auth.uid())
  ))
  OR author_id = auth.uid()
  OR public.is_admin()
);

CREATE POLICY "Users can create posts"
ON public.posts FOR INSERT TO authenticated
WITH CHECK (author_id = auth.uid() AND public.is_active_user());

CREATE POLICY "Users can update own posts"
ON public.posts FOR UPDATE TO authenticated
USING (author_id = auth.uid() AND public.is_active_user())
WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can delete own posts"
ON public.posts FOR DELETE TO authenticated
USING (author_id = auth.uid() AND public.is_active_user());

-- Comments Policies
CREATE POLICY "Comments viewable on accessible posts"
ON public.comments FOR SELECT TO authenticated
USING (
  status = 'active' AND EXISTS (
    SELECT 1 FROM public.posts WHERE id = comments.post_id
  )
);

CREATE POLICY "Users can create comments"
ON public.comments FOR INSERT TO authenticated
WITH CHECK (author_id = auth.uid() AND public.is_active_user());

CREATE POLICY "Users can update own comments"
ON public.comments FOR UPDATE TO authenticated
USING (author_id = auth.uid() AND public.is_active_user())
WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can delete own comments"
ON public.comments FOR DELETE TO authenticated
USING (author_id = auth.uid() AND public.is_active_user());

-- Likes & Saved Posts Policies
CREATE POLICY "Likes viewable by authenticated"
ON public.likes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can like posts"
ON public.likes FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND public.is_active_user());

CREATE POLICY "Users can unlike posts"
ON public.likes FOR DELETE TO authenticated
USING (user_id = auth.uid() AND public.is_active_user());

CREATE POLICY "Users can view own saved posts"
ON public.saved_posts FOR SELECT TO authenticated
USING (user_id = auth.uid() AND public.is_active_user());

CREATE POLICY "Users can save posts"
ON public.saved_posts FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND public.is_active_user());

CREATE POLICY "Users can unsave posts"
ON public.saved_posts FOR DELETE TO authenticated
USING (user_id = auth.uid() AND public.is_active_user());

-- Follows & Blocks Policies
CREATE POLICY "Follows viewable by authenticated"
ON public.follows FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can follow other users"
ON public.follows FOR INSERT TO authenticated
WITH CHECK (follower_id = auth.uid() AND follower_id <> following_id AND public.is_active_user());

CREATE POLICY "Users can unfollow"
ON public.follows FOR DELETE TO authenticated
USING (follower_id = auth.uid() AND public.is_active_user());

CREATE POLICY "Users can view own blocks"
ON public.blocks FOR SELECT TO authenticated
USING (blocker_id = auth.uid());

CREATE POLICY "Users can block other users"
ON public.blocks FOR INSERT TO authenticated
WITH CHECK (blocker_id = auth.uid() AND blocker_id <> blocked_id AND public.is_active_user());

CREATE POLICY "Users can unblock"
ON public.blocks FOR DELETE TO authenticated
USING (blocker_id = auth.uid() AND public.is_active_user());

-- Messaging Policies
CREATE POLICY "Conversations viewable by participants"
ON public.conversations FOR SELECT TO authenticated
USING (public.is_active_user() AND public.is_conversation_participant(id));

CREATE POLICY "Participants viewable by conversation members"
ON public.conversation_participants FOR SELECT TO authenticated
USING (public.is_active_user() AND public.is_conversation_participant(conversation_id));

CREATE POLICY "Messages viewable by conversation participants"
ON public.messages FOR SELECT TO authenticated
USING (public.is_active_user() AND public.is_conversation_participant(conversation_id));

CREATE POLICY "Messages insertable by conversation participants"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND public.is_active_user()
  AND public.is_conversation_participant(conversation_id)
);

-- Notifications Policies
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT TO authenticated
USING (recipient_id = auth.uid() AND public.is_active_user());

CREATE POLICY "Users can update own notification read status"
ON public.notifications FOR UPDATE TO authenticated
USING (recipient_id = auth.uid() AND public.is_active_user())
WITH CHECK (recipient_id = auth.uid());

-- Reports Policies
CREATE POLICY "Users can create reports"
ON public.reports FOR INSERT TO authenticated
WITH CHECK (reporter_id = auth.uid() AND public.is_active_user());

CREATE POLICY "Admins can view reports"
ON public.reports FOR SELECT TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can view moderation actions"
ON public.moderation_actions FOR SELECT TO authenticated
USING (public.is_admin());
