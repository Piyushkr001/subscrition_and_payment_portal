-- ==============================================================================
-- SCOREKIND DATABASE SCHEMA VERIFICATION (READ-ONLY)
-- Run this in the Supabase Dashboard SQL Editor or via CLI to verify remote setup.
-- THIS SCRIPT DOES NOT MUTATE ANY DATA OR SCHEMA.
-- ==============================================================================

-- 1. VERIFY ALL EXPECTED SCOREKIND PUBLIC TABLES
-- Expected (11): charities, charity_contributions, charity_preferences, draw_entries,
-- draws, payouts, profiles, scores, subscriptions, winner_verifications, winners
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.table_name) AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. VERIFY ROW LEVEL SECURITY (RLS) IS ENABLED ON ALL TABLES
-- Expected: rowsecurity = true for all 11 public tables
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 3. VERIFY RLS POLICIES ACROSS ALL PUBLIC TABLES
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual AS using_expression,
  with_check AS check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. VERIFY DATABASE TRIGGERS
-- Expected:
-- on_auth_user_created ON auth.users -> public.handle_new_user()
-- tr_profiles_role_check ON public.profiles -> public.check_role_update()
-- tr_subscriptions_updated_at ON public.subscriptions -> public.set_updated_at()
-- tr_scores_updated_at ON public.scores -> public.set_updated_at()
-- tr_charities_updated_at ON public.charities -> public.set_updated_at()
-- tr_charity_preferences_updated_at ON public.charity_preferences -> public.set_updated_at()
SELECT 
  event_object_schema,
  event_object_table,
  trigger_name,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema IN ('public', 'auth')
ORDER BY event_object_schema, event_object_table, trigger_name;

-- 5. VERIFY SCORE CONSTRAINTS (1 <= score <= 45 and unique(user_id, score_date))
SELECT 
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE n.nspname = 'public'
  AND conrelid::regclass::text IN (
    'public.scores',
    'public.draws',
    'public.winners',
    'public.payouts',
    'public.charity_contributions',
    'public.charity_preferences'
  )
ORDER BY conrelid::regclass::text, conname;

-- 6. VERIFY FOREIGN KEYS
SELECT
  tc.table_schema, 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;
