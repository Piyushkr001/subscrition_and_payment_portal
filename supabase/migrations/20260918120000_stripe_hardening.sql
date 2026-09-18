-- ==============================================================================
-- SCOREKIND STRIPE HARDENING & DATABASE-LEVEL SUBSCRIPTION ENFORCEMENT
-- ==============================================================================

-- 1. CANONICALIZE SUBSCRIPTIONS STATUS & ADD EVENT TIMESTAMP
-- Convert any historical 'canceled' (single 'l') to canonical 'cancelled'
UPDATE public.subscriptions
SET status = 'cancelled'
WHERE status = 'canceled';

-- Drop existing status check constraint
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_status_check;

-- Add updated canonical status constraint (only 'cancelled', strictly no 'canceled')
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN (
    'active',
    'trialing',
    'past_due',
    'cancelled',
    'unpaid',
    'expired',
    'incomplete',
    'paused'
  ));

-- Add last_stripe_event_timestamp to subscriptions for out-of-order event protection
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS last_stripe_event_timestamp BIGINT NULL;

-- 2. DEDICATED STRIPE CUSTOMERS MAPPING TABLE
CREATE TABLE IF NOT EXISTS public.stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS (Service-role only; no direct client access)
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS tr_stripe_customers_updated_at ON public.stripe_customers;
CREATE TRIGGER tr_stripe_customers_updated_at
  BEFORE UPDATE ON public.stripe_customers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Backfill stripe_customers from existing subscriptions where provider_customer_id is present
INSERT INTO public.stripe_customers (user_id, stripe_customer_id, created_at, updated_at)
SELECT DISTINCT ON (user_id) user_id, provider_customer_id, created_at, updated_at
FROM public.subscriptions
WHERE provider_customer_id IS NOT NULL
ORDER BY user_id, created_at DESC
ON CONFLICT (user_id) DO NOTHING;

-- 3. STRIPE WEBHOOK EVENTS (IDEMPOTENCY & AUDIT) TABLE
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('processing', 'processed', 'failed')),
  error_message TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ NULL
);

-- Enable RLS (Service-role only)
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_id
  ON public.stripe_webhook_events(stripe_event_id);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_status
  ON public.stripe_webhook_events(status);

-- 4. ACTIVE SUBSCRIPTION DATABASE HELPER FUNCTION
-- Safe helper to check whether a user has active/trialing membership
CREATE OR REPLACE FUNCTION public.has_active_subscription(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = check_user_id
      AND status IN ('active', 'trialing')
      AND (current_period_end IS NULL OR current_period_end > now())
  );
$$;

-- 5. DATABASE-LEVEL SCORE MUTATION ENFORCEMENT (RLS)
-- Drop existing unhardened policies
DROP POLICY IF EXISTS "Users can insert own scores" ON public.scores;
DROP POLICY IF EXISTS "Users can update own scores" ON public.scores;
DROP POLICY IF EXISTS "Users can delete own scores" ON public.scores;
DROP POLICY IF EXISTS "Subscribers and admins can insert scores" ON public.scores;
DROP POLICY IF EXISTS "Subscribers and admins can update own scores" ON public.scores;
DROP POLICY IF EXISTS "Subscribers and admins can delete own scores" ON public.scores;

-- INSERT: Subscriber must be self, AND have active/trialing subscription OR be admin
CREATE POLICY "Subscribers and admins can insert scores"
  ON public.scores FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (public.has_active_subscription(auth.uid()) OR public.is_admin())
  );

-- UPDATE: Subscriber must be self, AND have active/trialing subscription OR be admin
CREATE POLICY "Subscribers and admins can update own scores"
  ON public.scores FOR UPDATE
  USING (
    auth.uid() = user_id
    AND (public.has_active_subscription(auth.uid()) OR public.is_admin())
  )
  WITH CHECK (
    auth.uid() = user_id
    AND (public.has_active_subscription(auth.uid()) OR public.is_admin())
  );

-- DELETE: Lapsed subscribers cannot mutate scores; subscriber must be self AND have active subscription OR be admin
CREATE POLICY "Subscribers and admins can delete own scores"
  ON public.scores FOR DELETE
  USING (
    auth.uid() = user_id
    AND (public.has_active_subscription(auth.uid()) OR public.is_admin())
  );
