-- ==============================================================================
-- SCOREKIND CHARITY SYSTEM, WEBHOOK IDEMPOTENCY & SECURITY HARDENING MIGRATION
-- Migration: 20260919000000_charity_and_security_hardening.sql
-- ==============================================================================

-- 1. HARDEN has_active_subscription() AGAINST CROSS-USER ENUMERATION
-- Prohibits unprivileged subscribers from passing arbitrary UUIDs to probe
-- other members' active subscription status.
CREATE OR REPLACE FUNCTION public.has_active_subscription(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Strict cross-user privacy enforcement:
  -- Non-admins cannot inspect other users' subscription status.
  IF check_user_id IS NOT NULL 
     AND auth.uid() IS NOT NULL 
     AND check_user_id != auth.uid() 
     AND NOT public.is_admin() 
     AND COALESCE((auth.jwt() ->> 'role'), '') != 'service_role' THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = check_user_id
      AND status IN ('active', 'trialing')
      AND (current_period_end IS NULL OR current_period_end > now())
  );
END;
$$;

REVOKE ALL ON FUNCTION public.has_active_subscription(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(UUID) TO anon, authenticated, service_role;

-- 2. ATOMIC STRIPE WEBHOOK EVENT CLAIMING RPC
-- Replaces non-atomic SELECT -> PROCESS -> UPDATE with atomic row claiming.
CREATE OR REPLACE FUNCTION public.claim_stripe_webhook_event(
  p_event_id TEXT,
  p_event_type TEXT
)
RETURNS TABLE (
  claimed BOOLEAN,
  already_processed BOOLEAN,
  current_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_row public.stripe_webhook_events%ROWTYPE;
BEGIN
  -- A. Attempt atomic insert with 'processing' status
  INSERT INTO public.stripe_webhook_events (
    stripe_event_id,
    event_type,
    status,
    created_at
  )
  VALUES (
    p_event_id,
    p_event_type,
    'processing',
    now()
  )
  ON CONFLICT (stripe_event_id) DO NOTHING
  RETURNING * INTO v_row;

  -- Successfully claimed fresh event
  IF FOUND THEN
    RETURN QUERY SELECT TRUE, FALSE, 'processing'::TEXT;
    RETURN;
  END IF;

  -- B. Event exists: lock row for inspection
  SELECT * INTO v_row
  FROM public.stripe_webhook_events
  WHERE stripe_event_id = p_event_id
  FOR UPDATE;

  -- If already processed to completion, acknowledge duplicate
  IF v_row.status = 'processed' THEN
    RETURN QUERY SELECT FALSE, TRUE, 'processed'::TEXT;
    RETURN;
  END IF;

  -- If previously failed, allow retry by reclaiming
  IF v_row.status = 'failed' THEN
    UPDATE public.stripe_webhook_events
    SET status = 'processing',
        error_message = NULL,
        created_at = now()
    WHERE stripe_event_id = p_event_id;
    
    RETURN QUERY SELECT TRUE, FALSE, 'processing'::TEXT;
    RETURN;
  END IF;

  -- If currently 'processing' but timed out (> 5 minutes), reclaim abandoned job
  IF v_row.status = 'processing' AND v_row.created_at < (now() - INTERVAL '5 minutes') THEN
    UPDATE public.stripe_webhook_events
    SET created_at = now(),
        error_message = 'Reclaimed after processing timeout'
    WHERE stripe_event_id = p_event_id;
    
    RETURN QUERY SELECT TRUE, FALSE, 'processing'::TEXT;
    RETURN;
  END IF;

  -- Otherwise actively processing by concurrent worker
  RETURN QUERY SELECT FALSE, FALSE, 'processing'::TEXT;
  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_stripe_webhook_event(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_stripe_webhook_event(TEXT, TEXT) TO service_role;

-- 3. ENHANCE CHARITY CONTRIBUTIONS FOR TRACEABLE ALLOCATIONS & IDEMPOTENCY
ALTER TABLE public.charity_contributions
  ADD COLUMN IF NOT EXISTS provider_invoice_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'usd';

-- Unique constraint ensuring an invoice can never be allocated more than once
CREATE UNIQUE INDEX IF NOT EXISTS idx_charity_contributions_invoice
  ON public.charity_contributions(provider_invoice_id)
  WHERE provider_invoice_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_charity_contributions_charity
  ON public.charity_contributions(charity_id);

CREATE INDEX IF NOT EXISTS idx_charity_contributions_status
  ON public.charity_contributions(status);

-- 4. ENHANCE CHARITIES INDEXES
CREATE INDEX IF NOT EXISTS idx_charities_slug
  ON public.charities(slug);

CREATE INDEX IF NOT EXISTS idx_charities_status
  ON public.charities(status);

CREATE INDEX IF NOT EXISTS idx_charities_featured
  ON public.charities(featured);

-- 5. CONFIGURE SUPABASE STORAGE BUCKET FOR CHARITY ASSETS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'charity-media',
  'charity-media',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']::text[];

-- Storage RLS Policies
DROP POLICY IF EXISTS "Public read charity media" ON storage.objects;
CREATE POLICY "Public read charity media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'charity-media');

DROP POLICY IF EXISTS "Admin upload charity media" ON storage.objects;
CREATE POLICY "Admin upload charity media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'charity-media' 
    AND (public.is_admin() OR (auth.jwt() ->> 'role') = 'service_role')
  );

DROP POLICY IF EXISTS "Admin update charity media" ON storage.objects;
CREATE POLICY "Admin update charity media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'charity-media' 
    AND (public.is_admin() OR (auth.jwt() ->> 'role') = 'service_role')
  )
  WITH CHECK (
    bucket_id = 'charity-media' 
    AND (public.is_admin() OR (auth.jwt() ->> 'role') = 'service_role')
  );

DROP POLICY IF EXISTS "Admin delete charity media" ON storage.objects;
CREATE POLICY "Admin delete charity media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'charity-media' 
    AND (public.is_admin() OR (auth.jwt() ->> 'role') = 'service_role')
  );

-- 6. SEED INITIAL VERIFIED PARTNER CHARITIES (If table is empty)
INSERT INTO public.charities (name, slug, description, website_url, status, featured)
SELECT 'First Tee Youth Athletics', 'first-tee-youth-athletics', 'Empowering underserved juniors through character education, life skills, and accessible golf instruction.', 'https://firsttee.org', 'active', true
WHERE NOT EXISTS (SELECT 1 FROM public.charities WHERE slug = 'first-tee-youth-athletics');

INSERT INTO public.charities (name, slug, description, website_url, status, featured)
SELECT 'Birdies Against Cancer', 'birdies-against-cancer', 'Funding pioneering oncological research and patient recovery programs through tournament giving.', 'https://cancer.org', 'active', true
WHERE NOT EXISTS (SELECT 1 FROM public.charities WHERE slug = 'birdies-against-cancer');

INSERT INTO public.charities (name, slug, description, website_url, status, featured)
SELECT 'Fairway Veterans Wellness', 'fairway-veterans-wellness', 'Providing recreational rehabilitation, camaraderie, and mental health therapy for military veterans.', 'https://saluteheroes.org', 'active', false
WHERE NOT EXISTS (SELECT 1 FROM public.charities WHERE slug = 'fairway-veterans-wellness');

INSERT INTO public.charities (name, slug, description, website_url, status, featured)
SELECT 'Green Greens Conservation', 'green-greens-conservation', 'Dedicated to environmental restoration, biodiversity corridors, and water conservation on golf reserves.', 'https://auduboninternational.org', 'active', false
WHERE NOT EXISTS (SELECT 1 FROM public.charities WHERE slug = 'green-greens-conservation');
