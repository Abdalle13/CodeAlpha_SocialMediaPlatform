-- Migration 00006: Secure Login Identity Resolver
-- Resolves either username or email and validates existence with specific error states.

CREATE OR REPLACE FUNCTION public.resolve_login_identity(p_identity text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
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
    SELECT true, u.email, (p.status = 'suspended')
    INTO v_user_exists, v_email, v_is_suspended
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    WHERE lower(u.email) = v_clean
    LIMIT 1;
  ELSE
    SELECT true, u.email, (p.status = 'suspended')
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

