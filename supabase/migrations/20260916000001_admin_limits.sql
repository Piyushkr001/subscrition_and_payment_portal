-- ==============================================================================
-- SCOREKIND ADMIN LIMITS & EMAIL KEYWORD ENFORCEMENT
-- ==============================================================================

-- Trigger function to enforce:
-- 1. Admin emails must contain the keyword 'admin' (case-insensitive, e.g. abc_admin@ScoreKind.in)
-- 2. No more than three (3) administrators can exist in the system at any time.
CREATE OR REPLACE FUNCTION public.check_admin_limits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_admin_count INTEGER;
BEGIN
  -- Only validate when the role is 'admin'
  IF NEW.role = 'admin' THEN
    -- 1. Enforce email contains the keyword 'admin'
    IF NEW.email IS NULL OR NEW.email NOT ILIKE '%admin%' THEN
      RAISE EXCEPTION 'Admin registration rejected: email address must contain the keyword "admin" (e.g. abc_admin@ScoreKind.in)';
    END IF;

    -- 2. Count existing admins excluding the current record (to allow profile updates)
    SELECT COUNT(*) INTO current_admin_count
    FROM public.profiles
    WHERE role = 'admin' AND id != NEW.id;

    IF current_admin_count >= 3 THEN
      RAISE EXCEPTION 'Admin registration rejected: maximum limit of 3 administrators has been reached';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_profiles_admin_limits ON public.profiles;
CREATE TRIGGER tr_profiles_admin_limits
  BEFORE INSERT OR UPDATE OF role, email ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_admin_limits();
