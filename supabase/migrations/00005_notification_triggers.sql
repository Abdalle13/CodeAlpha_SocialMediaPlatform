-- Migration 00005: Notification Automation Triggers
-- Automatically generates notification rows on likes, comments, follows, and direct messages.

-- 1. Like Notification Trigger Function
CREATE OR REPLACE FUNCTION public.handle_like_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_recipient_id uuid;
BEGIN
  SELECT author_id INTO v_recipient_id FROM public.posts WHERE id = NEW.post_id;
  IF v_recipient_id IS NOT NULL AND v_recipient_id <> NEW.user_id THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type, target_type, target_id)
    VALUES (v_recipient_id, NEW.user_id, 'like', 'post', NEW.post_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_like_created ON public.likes;
CREATE TRIGGER on_like_created
AFTER INSERT ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.handle_like_notification();

-- 2. Comment Notification Trigger Function
CREATE OR REPLACE FUNCTION public.handle_comment_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_recipient_id uuid;
BEGIN
  SELECT author_id INTO v_recipient_id FROM public.posts WHERE id = NEW.post_id;
  IF v_recipient_id IS NOT NULL AND v_recipient_id <> NEW.author_id THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type, target_type, target_id)
    VALUES (v_recipient_id, NEW.author_id, 'comment', 'post', NEW.post_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_comment_created ON public.comments;
CREATE TRIGGER on_comment_created
AFTER INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.handle_comment_notification();

-- 3. Follow Notification Trigger Function
CREATE OR REPLACE FUNCTION public.handle_follow_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.following_id <> NEW.follower_id THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type, target_type, target_id)
    VALUES (NEW.following_id, NEW.follower_id, 'follow', 'profile', NEW.follower_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_follow_created ON public.follows;
CREATE TRIGGER on_follow_created
AFTER INSERT ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.handle_follow_notification();

