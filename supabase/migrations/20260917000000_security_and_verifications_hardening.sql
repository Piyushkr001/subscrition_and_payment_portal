-- ==============================================================================
-- SCOREKIND SECURITY CLEANUP & VERIFICATIONS HARDENING MIGRATION
-- ==============================================================================

-- 1. PROFILE ROLE & EMAIL IMMUTABILITY TRIGGER
-- Prevents subscribers from self-promoting to admin or arbitrarily editing profiles.email.
-- Email updates must originate from auth.users or trusted service-role operations.
CREATE OR REPLACE FUNCTION public.check_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- A. Check role tampering
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF (auth.jwt() ->> 'role') = 'service_role'
       OR current_user IN ('postgres', 'service_role', 'supabase_admin')
       OR auth.uid() IS NULL
       OR public.is_admin() THEN
      -- Authorized role change
    ELSE
      RAISE EXCEPTION 'Unauthorized: only administrators or trusted service operations can change user roles';
    END IF;
  END IF;

  -- B. Check email tampering (prevent auth.users.email != profiles.email desync)
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    IF (auth.jwt() ->> 'role') = 'service_role'
       OR current_user IN ('postgres', 'service_role', 'supabase_admin')
       OR auth.uid() IS NULL
       OR NEW.email = (SELECT email FROM auth.users WHERE id = NEW.id) THEN
      -- Authorized email sync from auth.users or service role
    ELSE
      RAISE EXCEPTION 'Unauthorized: profiles.email cannot be directly modified; email identity must originate from auth.users';
    END IF;
  END IF;

  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_profiles_role_check ON public.profiles;
DROP TRIGGER IF EXISTS tr_profiles_security_check ON public.profiles;

CREATE TRIGGER tr_profiles_security_check
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_profile_update();

-- 2. AUTO-SYNC EMAIL UPDATES FROM auth.users TO public.profiles
CREATE OR REPLACE FUNCTION public.handle_user_email_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE public.profiles
    SET email = NEW.email, updated_at = now()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_email_updated();

-- 3. WINNER VERIFICATIONS: DROP UNIQUE CONSTRAINT FOR MULTIPLE AUDIT ATTEMPTS
-- Allows a winner to submit updated proof if previous attempt was rejected,
-- while retaining complete chronological verification audit history.
ALTER TABLE public.winner_verifications
  DROP CONSTRAINT IF EXISTS winner_verifications_winner_id_key;

CREATE INDEX IF NOT EXISTS idx_winner_verifications_winner ON public.winner_verifications(winner_id);

-- 4. HARDEN WINNERS SELECT POLICY
-- Avoid exposing internal user_id or sensitive data of winners to anonymous callers.
-- Regular authenticated subscribers can only see their own win records; admins can inspect all.
DROP POLICY IF EXISTS "Users and public can view winners" ON public.winners;
DROP POLICY IF EXISTS "Users can view own winnings or admin all" ON public.winners;

CREATE POLICY "Users can view own winnings or admin all"
  ON public.winners FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());
