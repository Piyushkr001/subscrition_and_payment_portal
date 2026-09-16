-- ==============================================================================
-- SCOREKIND INITIAL DATABASE SCHEMA & ROW LEVEL SECURITY
-- ==============================================================================

-- 1. Helper function to check if current user is admin (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 2. Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT NULL,
  role TEXT NOT NULL DEFAULT 'subscriber' CHECK (role IN ('subscriber', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger to prevent self-promotion or role tampering by subscribers.
-- Permits trusted server/service-role operations, database superusers, or established admins.
CREATE OR REPLACE FUNCTION public.check_role_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_profiles_role_check ON public.profiles;
CREATE TRIGGER tr_profiles_role_check
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_role_update();

-- Function and trigger to auto-create profile when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    'subscriber' -- ALWAYS 'subscriber' on signup, never trusting user metadata
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_customer_id TEXT NULL,
  provider_subscription_id TEXT NULL,
  plan TEXT CHECK (plan IN ('monthly', 'yearly')),
  status TEXT CHECK (status IN ('active', 'past_due', 'cancelled', 'expired', 'incomplete')),
  current_period_start TIMESTAMPTZ NULL,
  current_period_end TIMESTAMPTZ NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS tr_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER tr_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 5. SCORES TABLE
CREATE TABLE IF NOT EXISTS public.scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
  score_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT scores_user_date_unique UNIQUE (user_id, score_date)
);

DROP TRIGGER IF EXISTS tr_scores_updated_at ON public.scores;
CREATE TRIGGER tr_scores_updated_at
  BEFORE UPDATE ON public.scores
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 6. CHARITIES TABLE
CREATE TABLE IF NOT EXISTS public.charities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  website_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'inactive')),
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS tr_charities_updated_at ON public.charities;
CREATE TRIGGER tr_charities_updated_at
  BEFORE UPDATE ON public.charities
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 7. CHARITY PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.charity_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  charity_id UUID NOT NULL REFERENCES public.charities(id) ON DELETE RESTRICT,
  contribution_percentage INTEGER NOT NULL CHECK (contribution_percentage >= 10 AND contribution_percentage <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS tr_charity_preferences_updated_at ON public.charity_preferences;
CREATE TRIGGER tr_charity_preferences_updated_at
  BEFORE UPDATE ON public.charity_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 8. CHARITY CONTRIBUTIONS TABLE
CREATE TABLE IF NOT EXISTS public.charity_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  charity_id UUID NOT NULL REFERENCES public.charities(id) ON DELETE RESTRICT,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  percentage INTEGER NOT NULL CHECK (percentage >= 10 AND percentage <= 100),
  type TEXT NOT NULL CHECK (type IN ('subscription', 'donation')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. DRAWS TABLE
CREATE TABLE IF NOT EXISTS public.draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_date DATE NOT NULL,
  draw_type TEXT NOT NULL CHECK (draw_type IN ('random', 'weighted')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'simulated', 'locked', 'published', 'completed')),
  numbers JSONB,
  subscriber_count INTEGER DEFAULT 0 CHECK (subscriber_count >= 0),
  base_prize_pool NUMERIC(12,2) DEFAULT 0 CHECK (base_prize_pool >= 0),
  rollover_amount NUMERIC(12,2) DEFAULT 0 CHECK (rollover_amount >= 0),
  final_prize_pool NUMERIC(12,2) DEFAULT 0 CHECK (final_prize_pool >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ NULL
);

-- 10. DRAW ENTRIES TABLE (Immutable Historical Snapshot)
CREATE TABLE IF NOT EXISTS public.draw_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id UUID NOT NULL REFERENCES public.draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scores_snapshot JSONB NOT NULL,
  subscription_snapshot JSONB NOT NULL,
  eligible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT draw_entries_draw_user_unique UNIQUE (draw_id, user_id)
);

-- 11. WINNERS TABLE
CREATE TABLE IF NOT EXISTS public.winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id UUID NOT NULL REFERENCES public.draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_count INTEGER NOT NULL CHECK (match_count BETWEEN 3 AND 5),
  prize_tier TEXT NOT NULL CHECK (prize_tier IN ('three_match', 'four_match', 'five_match')),
  prize_amount NUMERIC(10,2) NOT NULL CHECK (prize_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_winners_match_tier CHECK (
    (match_count = 3 AND prize_tier = 'three_match') OR
    (match_count = 4 AND prize_tier = 'four_match') OR
    (match_count = 5 AND prize_tier = 'five_match')
  )
);

-- 12. WINNER VERIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.winner_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  winner_id UUID NOT NULL UNIQUE REFERENCES public.winners(id) ON DELETE CASCADE,
  proof_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  review_notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ NULL
);

-- 13. PAYOUTS TABLE
CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  winner_id UUID NOT NULL REFERENCES public.winners(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  reference TEXT,
  paid_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_scores_user_id ON public.scores(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_date ON public.scores(score_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_charity_preferences_user ON public.charity_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_charity_contributions_user ON public.charity_contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_draws_status_date ON public.draws(status, draw_date);
CREATE INDEX IF NOT EXISTS idx_draw_entries_draw ON public.draw_entries(draw_id);
CREATE INDEX IF NOT EXISTS idx_draw_entries_user ON public.draw_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_winners_draw ON public.winners(draw_id);
CREATE INDEX IF NOT EXISTS idx_winners_user ON public.winners(user_id);
CREATE INDEX IF NOT EXISTS idx_winner_verifications_status ON public.winner_verifications(status);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.payouts(status);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charity_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charity_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draw_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winner_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- 2. Scores Policies
CREATE POLICY "Users can view own scores"
  ON public.scores FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert own scores"
  ON public.scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scores"
  ON public.scores FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scores"
  ON public.scores FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Subscriptions Policies
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- Only admins/service role can insert/update/delete subscriptions (prevents client fabrication)
CREATE POLICY "Admins can manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. Charities Policies
CREATE POLICY "Public can view active charities"
  ON public.charities FOR SELECT
  USING (status = 'active' OR public.is_admin());

CREATE POLICY "Admins can manage charities"
  ON public.charities FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. Charity Preferences Policies
CREATE POLICY "Users can view own charity preference"
  ON public.charity_preferences FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert own charity preference"
  ON public.charity_preferences FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.charities
      WHERE public.charities.id = public.charity_preferences.charity_id
      AND public.charities.status = 'active'
    )
  );

CREATE POLICY "Users can update own charity preference"
  ON public.charity_preferences FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (
    (auth.uid() = user_id OR public.is_admin())
    AND EXISTS (
      SELECT 1 FROM public.charities
      WHERE public.charities.id = public.charity_preferences.charity_id
      AND public.charities.status = 'active'
    )
  );

CREATE POLICY "Users can delete own charity preference"
  ON public.charity_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Charity Contributions Policies
CREATE POLICY "Users can view own contributions"
  ON public.charity_contributions FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins can manage contributions"
  ON public.charity_contributions FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 7. Draws Policies
CREATE POLICY "Public can view published draws"
  ON public.draws FOR SELECT
  USING (status IN ('published', 'completed') OR public.is_admin());

CREATE POLICY "Admins can manage draws"
  ON public.draws FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 8. Draw Entries Policies
CREATE POLICY "Users can view own draw entries"
  ON public.draw_entries FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins can manage draw entries"
  ON public.draw_entries FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 9. Winners Policies
CREATE POLICY "Users and public can view winners"
  ON public.winners FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.draws
      WHERE public.draws.id = public.winners.draw_id
      AND public.draws.status IN ('published', 'completed')
    )
    OR public.is_admin()
  );

CREATE POLICY "Admins can manage winners"
  ON public.winners FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 10. Winner Verifications Policies
CREATE POLICY "Winners can view own verification"
  ON public.winner_verifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.winners
      WHERE public.winners.id = public.winner_verifications.winner_id
      AND public.winners.user_id = auth.uid()
    )
    OR public.is_admin()
  );

-- Hardened: Winners can insert their own proof, but cannot self-approve or supply review metadata
CREATE POLICY "Winners can insert own proof"
  ON public.winner_verifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.winners
      WHERE public.winners.id = public.winner_verifications.winner_id
      AND public.winners.user_id = auth.uid()
    )
    AND (status IS NULL OR status = 'pending')
    AND reviewed_by IS NULL
    AND reviewed_at IS NULL
    AND review_notes IS NULL
  );

CREATE POLICY "Admins can update verifications"
  ON public.winner_verifications FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 11. Payouts Policies
CREATE POLICY "Winners can view own payouts"
  ON public.payouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.winners
      WHERE public.winners.id = public.payouts.winner_id
      AND public.winners.user_id = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY "Admins can manage payouts"
  ON public.payouts FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
