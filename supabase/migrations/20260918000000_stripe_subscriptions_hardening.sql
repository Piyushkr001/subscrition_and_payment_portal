-- ==============================================================================
-- SCOREKIND STRIPE SUBSCRIPTION HARDENING MIGRATION
-- ==============================================================================

-- 1. Add stripe_price_id column if not already present
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT NULL;

-- 2. Expand status check constraint to support all Stripe subscription lifecycles
-- Drop existing constraint
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_status_check;

-- Add updated constraint covering active, trialing, past_due, cancelled, canceled, unpaid, expired, incomplete, paused
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN (
    'active',
    'trialing',
    'past_due',
    'cancelled',
    'canceled',
    'unpaid',
    'expired',
    'incomplete',
    'paused'
  ));

-- 3. Unique index on provider_subscription_id to enable idempotent webhook upserts
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_provider_sub_id
  ON public.subscriptions(provider_subscription_id)
  WHERE provider_subscription_id IS NOT NULL;

-- 4. Index on provider_customer_id for customer portal & checkout lookup
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_customer_id
  ON public.subscriptions(provider_customer_id);

-- 5. Composite index for fast user subscription status resolution
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
  ON public.subscriptions(user_id, status);
