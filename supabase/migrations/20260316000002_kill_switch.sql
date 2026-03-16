-- Kill switch: add is_banned flag to profiles
-- Checked in rate-limit.ts before every generation — banned users get blocked instantly
-- without needing a code deploy or Stripe action.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false;

-- Admins can set this via admin_set_tier pattern (service role / admin UI)
-- Users must NOT be able to set their own is_banned to false
-- The existing profiles_update_own WITH CHECK already locks tier;
-- extend it to also lock is_banned:

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND tier = public.get_own_tier()
    AND is_banned = false  -- users can never unban themselves; false is the only value they can write
  );

-- Note: a banned user (is_banned=true) cannot even pass WITH CHECK to write is_banned=false,
-- because their row already has is_banned=true and the check requires is_banned=false.
-- Unbanning must go through service role (admin edge fn or admin UI).
