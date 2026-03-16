-- Fix: prevent users from self-updating their tier on the profiles table.
-- The broad "profiles_update_own" policy allowed any authenticated user to
-- PATCH /rest/v1/profiles and set tier='pro', bypassing rate limits entirely.
--
-- Solution: replace the policy with one that locks tier to its current value
-- using a SECURITY DEFINER function (bypasses RLS to read the real stored tier).

-- Step 1: helper function — returns the stored tier for the calling user
-- SECURITY DEFINER runs as postgres, so it can read past RLS safely
CREATE OR REPLACE FUNCTION public.get_own_tier()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT tier FROM public.profiles WHERE id = auth.uid()
$$;

-- Only authenticated users need to call this
GRANT EXECUTE ON FUNCTION public.get_own_tier() TO authenticated;

-- Step 2: drop the vulnerable policy
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- Step 3: replace with a restricted policy
-- USING  = which rows the user can target (own row only)
-- WITH CHECK = what the NEW row must look like after the update
--   - tier must stay equal to what's currently stored (tier can only be changed by service role / admin_set_tier RPC)
--   - email must not be touched (canonical source is auth.users)
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND tier = public.get_own_tier()
  );
