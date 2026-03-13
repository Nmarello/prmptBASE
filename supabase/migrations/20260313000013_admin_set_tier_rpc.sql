-- Admin-only RPC to set a user's tier, bypassing RLS
-- security definer = runs as the function owner (postgres), can update any row
-- Caller must have is_admin=true in profiles

CREATE OR REPLACE FUNCTION public.admin_set_tier(
  target_user_id uuid,
  new_tier text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_admin boolean;
BEGIN
  -- Check caller is admin
  SELECT is_admin INTO caller_is_admin
  FROM profiles
  WHERE id = auth.uid();

  IF NOT FOUND OR NOT caller_is_admin THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  -- Validate tier
  IF new_tier NOT IN ('newbie', 'creator', 'studio', 'pro') THEN
    RAISE EXCEPTION 'Invalid tier: %', new_tier;
  END IF;

  -- Update profile
  UPDATE profiles
  SET tier = new_tier
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$;

-- Grant execute to authenticated users (RLS check inside the function handles authorization)
GRANT EXECUTE ON FUNCTION public.admin_set_tier(uuid, text) TO authenticated;
