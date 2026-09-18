# ScoreKind

> **Score. Win. Give Back.**

A subscription-based golf performance, monthly prize draw, and verified charitable contribution platform built with Next.js 16, React 19, Tailwind CSS v4, Shadcn/UI, and Supabase.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Authentication & User Architecture](#authentication--user-architecture)
- [Security Model & Protection Rules](#security-model--protection-rules)
- [Score Management System](#score-management-system)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Supabase Setup & Migration Pipeline](#supabase-setup--migration-pipeline)
  - [1. Supabase CLI Setup](#1-supabase-cli-setup)
  - [2. Linking Remote Project](#2-linking-remote-project)
  - [3. Applying Migrations (db push)](#3-applying-migrations-db-push)
  - [4. Applied Migrations](#4-applied-migrations)
- [Creating & Promoting Administrators](#creating--promoting-administrators)
- [Route Roles & Protection Rules](#route-roles--protection-rules)
- [Database Schema & Row Level Security](#database-schema--row-level-security)
- [Automated Verification & Testing](#automated-verification--testing)
- [Future Development Milestones](#future-development-milestones)

---

## Overview

ScoreKind connects amateur golf performance with audited rewards and philanthropy:
1. **Golf Score Tracking**: Log 18-hole Stableford scores (1–45 points) to establish a rolling-five active scoring pool.
2. **Monthly Prize Draws**: Verified draw engine with rollover jackpots and tiered prizes (3-match, 4-match, 5-match).
3. **Guaranteed Charitable Impact**: Minimum 10% of every member subscription is directly remitted to the member's chosen verified charity partner.

---

## Tech Stack

- **Framework**: Next.js 16.3.5 (App Router, Turbopack, React Server Components)
- **Library**: React 19.2.8
- **Language**: TypeScript 5 (Strict Mode)
- **Styling**: Tailwind CSS v4, tw-animate-css
- **UI Components**: Shadcn / Base UI
- **Themes**: `next-themes` (Dark mode & Light mode support)
- **Icons**: Lucide React
- **Forms & Validation**: React Hook Form + Zod
- **Database & Auth**: Supabase PostgreSQL + Supabase Auth
- **Session & Security**: `@supabase/ssr` with Next.js 16 `proxy.ts` request interception
- **Package Manager**: Bun 1.3.10

---

## Authentication & User Architecture

ScoreKind enforces a **single source of truth** security model built strictly on Supabase-issued JWT access tokens:

```
User Credentials / Google OAuth
          ↓
Supabase Auth Engine
          ↓
auth.users record created
          ↓
on_auth_user_created trigger executes
          ↓
public.profiles record created (role = 'subscriber')
          ↓
Supabase-issued JWT Access Token + Refresh Token
          ↓
Secure Supabase SSR Cookies (HTTP-only)
          ↓
Next.js 16 Server / Proxy Interception (proxy.ts)
          ↓
Verified Authenticated User Identity (auth.getUser())
          ↓
Role-Based Access Control (RBAC) + Row Level Security (RLS)
```

### Where Accounts & Profiles Live

- **Authentication Accounts**: Stored in `auth.users`. Visible in **Supabase Dashboard → Authentication → Users**.
- **Application Profiles**: Stored in `public.profiles` (1:1 with `auth.users`). Visible in **Supabase Dashboard → Table Editor → profiles**.
- **Profile Provisioning**: The `handle_new_user()` trigger automatically provisions `public.profiles` whenever an `auth.users` row is inserted.
- **Role Guarantee**: Normal signups unconditionally receive `role = 'subscriber'`.

---

## Security Model & Protection Rules

### 1. No Public Admin Registration
There is **no browser-facing admin registration route or API endpoint**. Normal registration exclusively yields subscriber accounts. There are no public endpoints using `SUPABASE_SERVICE_ROLE_KEY` to register admin accounts.

### 2. No Hardcoded Secrets or Invite Codes
All administrative invite codes, default secrets (e.g. `ScoreKindAdmin2026`), and environment fallbacks have been eliminated. Administrative promotion is restricted to server-side CLI scripts or direct database SQL.

### 3. Role & Email Mutability Protection
Subscribers cannot alter `profiles.role` or `profiles.email` through the browser client, Supabase REST API, or profile forms. The database trigger `check_profile_update()` enforces:
- Only database superusers, administrators, or service-role operations can modify roles.
- `profiles.email` is strictly synchronized from `auth.users` and cannot be arbitrarily overwritten.

### 4. Safe Internal Redirects
All login redirect parameters (`?redirectTo=`) and OAuth callbacks (`?next=`) pass through `getSafeInternalRedirect` (`lib/auth/safe-redirect.ts`). Protocol-relative URLs (e.g. `//evil.example`), external URLs (`https://evil.example`), and pseudo-protocols (`javascript:`) are rejected and normalized to safe internal routes.

### 5. Winner Data Privacy
Direct `SELECT` access on `public.winners` is restricted to the winning user or administrators (`auth.uid() = user_id OR is_admin()`). Anonymous users cannot harvest internal UUIDs or identity data.

---

## Score Management System

ScoreKind uses the **Stableford scoring system** to track golf performance and build each user's rolling-five draw pool.

### Business Rules & Constraints
- **Stableford Points**: Values must be integers between **1 and 45** inclusive (enforced by both Zod and PostgreSQL `CHECK` constraint).
- **Date Requirement**: Every round must specify a calendar date.
- **No Future Dates**: Round dates cannot be in the future (`scoreDate <= today`), ensuring all logged rounds represent completed games.
- **Unique Date Per User**: A user may log only one round per calendar date (`UNIQUE(user_id, score_date)`). Attempting to add a second round on an existing date yields a friendly error: *"You already have a score for this date. Edit the existing entry instead."*
- **Rolling Five Derivation**: A user's active golf snapshot is derived dynamically using:
  ```sql
  SELECT * FROM public.scores
  WHERE user_id = auth.uid()
  ORDER BY score_date DESC
  LIMIT 5;
  ```
- **Historical Preservation**: Historical scores are **never deleted** when new rounds are logged. All historical rounds remain archived in the user's permanent golf logbook.
- **Full CRUD Capabilities**:
  - **Create**: Add new round with points (1–45) and date.
  - **Read**: View rolling-five prominent cards and full historical table/cards.
  - **Update**: Edit points and date with duplicate-date conflict prevention.
  - **Delete**: Remove a round with a confirmation dialog; rolling-five immediately recalculates.
- **Row Level Security**: Users can only SELECT, INSERT, UPDATE, and DELETE their own scores (`auth.uid() = user_id`).
- **Dashboard Overview Integration**: The main `/dashboard` page dynamically queries and displays the user's real scores and status (`X of 5 Recorded`).

---

## Installation

Ensure [Bun](https://bun.sh) is installed on your system:

```bash
bun install
```

Start the local Next.js development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

Copy `.env.example` to `.env` or `.env.local`:

```bash
cp .env.example .env.local
```

### Variable Reference

| Variable | Scope | Description |
| :--- | :--- | :--- |
| `APP_URL` | **Server-Only** | Trusted application URL for Stripe return paths (e.g. `http://localhost:3000` or production domain) |
| `NEXT_PUBLIC_SUPABASE_URL` | Client & Server | Your Supabase project URL (e.g. `https://rxyhvivuqytuqxjelbqu.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client & Server | Your Supabase Anon / Publishable key |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client & Server | Modern alias for publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-Only** | Privileged service key for admin CLI scripts (**never commit or prefix with `NEXT_PUBLIC_`**) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Client & Server | Optional Google OAuth Client ID |
| `STRIPE_SECRET_KEY` | **Server-Only** | Stripe Secret Key for server actions and checkout sessions (**never prefix with `NEXT_PUBLIC_`**) |
| `STRIPE_WEBHOOK_SECRET` | **Server-Only** | Stripe Webhook signing secret for validating event signatures (**never prefix with `NEXT_PUBLIC_`**) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client & Server | Stripe publishable key (reserved for client-side Stripe.js use) |
| `STRIPE_MONTHLY_PRICE_ID` | **Server-Only** | **Required** Stripe Price ID for monthly plan (authoritative charge source) |
| `STRIPE_YEARLY_PRICE_ID` | **Server-Only** | **Required** Stripe Price ID for yearly plan (authoritative charge source) |
| `NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_AMOUNT` | Client & Server | Configurable monthly price display amount (default: `1299`) |
| `NEXT_PUBLIC_STRIPE_YEARLY_PRICE_AMOUNT` | Client & Server | Configurable annual price display amount (default: `11999`) |
| `NEXT_PUBLIC_STRIPE_CURRENCY` | Client & Server | ISO currency code (default: `inr`) |
| `NEXT_PUBLIC_STRIPE_CURRENCY_SYMBOL` | Client & Server | Currency symbol (default: `₹`) |

---

## Stripe Architecture & Hardened Subscription Pipeline

ScoreKind implements an enterprise-grade, zero-trust billing model:

```
Stripe Event (Webhook)
      ↓
POST /api/webhooks/stripe
      ↓
stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)
      ↓
stripe_webhook_events idempotency lookup (duplicate? -> return 200)
      ↓
syncSubscriptionFromStripe()
      ↓
Fail-Closed Normalizer (unknown status -> 'incomplete'; canceled -> 'cancelled')
      ↓
Out-of-Order Timestamp Guard (last_stripe_event_timestamp)
      ↓
1:1 stripe_customers mapping table & public.subscriptions record
      ↓
PostgreSQL has_active_subscription() Helper & RLS Enforcement
```

### 1. Webhook Endpoint & Local Forwarding

The authoritative webhook route is:

```
POST /api/webhooks/stripe
```

To forward Stripe test events to your local development environment:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the printed webhook signing secret (`whsec_...`) into your `.env` file as `STRIPE_WEBHOOK_SECRET`.

### 2. Supported Webhook Events

- `checkout.session.completed`: Synchronizes new member subscription details and associates user identity.
- `customer.subscription.created` & `customer.subscription.updated`: Reconciles plan changes, billing intervals, and renewal dates.
- `customer.subscription.deleted`: Sets subscription status to `cancelled` and terminates auto-renew.
- `invoice.payment_succeeded`: Retrieves the live subscription object from Stripe to re-verify state before confirming active membership.
- `invoice.payment_failed`: Retrieves live subscription state and synchronizes `past_due` or `unpaid` restrictions.

### 3. Duplicate Prevention & Customer Mapping

- **Checkout Check**: Authenticated members with `active` or `trialing` status cannot create duplicate subscriptions. The server returns HTTP 409 and guides the user to the Customer Portal.
- **Customer Reuse**: The `public.stripe_customers` table ensures 1:1 mapping between `profiles.id` and Stripe's `cus_...` ID. Abandoned checkout attempts do not generate orphaned customers.
- **No Dynamic Price Fallback**: Charges are determined strictly by configured server-side `STRIPE_MONTHLY_PRICE_ID` and `STRIPE_YEARLY_PRICE_ID`. Dynamic `price_data` generation is completely disabled.

---

## Supabase Setup & Migration Pipeline

### 1. Supabase CLI Setup

The Supabase CLI is managed via `devDependencies`:

```bash
bunx supabase --version
```

### 2. Linking Remote Project

Link local repository configuration to your remote Supabase project:

```bash
bunx supabase link --project-ref rxyhvivuqytuqxjelbqu
```

### 3. Applying Migrations (db push)

Apply any pending migrations to the linked remote database:

```bash
bunx supabase db push
```

### 4. Applied Migrations

1. `supabase/migrations/20260916000000_initial_schema.sql`:
   - Provisions all 11 core tables (`profiles`, `subscriptions`, `scores`, `charities`, etc.).
   - Attaches `handle_new_user()` trigger to `auth.users`.
   - Enables RLS on all 11 tables with default security policies.
2. `supabase/migrations/20260917000000_security_and_verifications_hardening.sql`:
   - Attaches `check_profile_update()` trigger to enforce role and email immutability.
   - Drops `UNIQUE(winner_id)` on `winner_verifications` to support multiple audit attempts upon rejected proof resubmission.
   - Hardens `public.winners` SELECT access against anonymous scraping.
3. `supabase/migrations/20260918000000_stripe_subscriptions_hardening.sql`:
   - Adds `stripe_price_id` to `public.subscriptions`.
   - Expands `status` check constraint to support Stripe subscription lifecycles.
   - Adds unique index on `provider_subscription_id` to ensure idempotent webhook upserts.
4. `supabase/migrations/20260918120000_stripe_hardening.sql`:
   - Canonicalizes subscription status to `'cancelled'` (strictly disallows `'canceled'`).
   - Introduces dedicated `public.stripe_customers` 1:1 mapping table.
   - Introduces `public.stripe_webhook_events` table for retry-safe idempotency tracking.
   - Adds `last_stripe_event_timestamp` to `public.subscriptions` for out-of-order event protection.
   - Adds `public.has_active_subscription()` `SECURITY DEFINER` function.
   - Hardens `public.scores` RLS policies (INSERT, UPDATE, DELETE) to require active/trialing subscription or admin role.

---

## Creating & Promoting Administrators

Normal signups always create accounts with `role = 'subscriber'`. Self-promotion is strictly blocked by the `check_profile_update` database trigger.

To promote an initial user to `admin`, use one of the two trusted methods:

### Method A: Using the Server CLI Utility (Recommended)

Ensure `SUPABASE_SERVICE_ROLE_KEY` is configured in `.env`:

```bash
bun run scripts/promote-admin.ts user@example.com
```

### Method B: Via Supabase Dashboard SQL Editor

Run the following statement in your Supabase SQL Editor:

```sql
UPDATE public.profiles
SET role = 'admin', updated_at = now()
WHERE email = 'user@example.com';
```

---

## Route Roles & Protection Rules

| Route Group | Access Level | Description / Protection Rule |
| :--- | :--- | :--- |
| `/` | **Public** | Marketing landing page with pricing calculator |
| `/charities` | **Public** | Partner charity directory |
| `/draws` | **Public** | Draw mechanics & prize tiers |
| `/login` | **Public** | Sign in (preserves billing plan and redirects to `/dashboard` or `/admin`) |
| `/signup` | **Public** | Sign up (preserves billing plan parameter) |
| `/dashboard/*` | **Subscriber** | Protected: unauthenticated requests redirect to `/login?redirectTo=...` |
| `/dashboard/billing` | **Subscriber** | Dedicated billing management, plan selection, and Stripe continuation |
| `/dashboard/scores` | **Subscriber** | Score management interface (gated mutation controls for active members) |
| `/admin/*` | **Admin** | Protected: unauthenticated requests redirect to `/login`; subscribers redirect to `/dashboard` |
| `/api/auth/callback` | **Public** | OAuth code exchange with safe internal redirection |
| `/api/me` | **Authenticated** | Returns verified user identity derived from session JWT |
| `/api/stripe/checkout` | **Authenticated** | Initiates Stripe Checkout Session with duplicate check & customer reuse |
| `/api/stripe/portal` | **Authenticated** | Initiates Stripe Customer Portal Session for billing management |
| `/api/webhooks/stripe` | **Public (Verified)** | Ingests Stripe webhooks, validates cryptographic signature, syncs Supabase state |

---

## Automated Verification & Testing

All integration tests are protected against accidental production execution and require explicit opt-in:

```bash
# 1. Targeted Stripe Billing, Idempotency & Customer Mapping Suite
ALLOW_DESTRUCTIVE_TESTS=true bun run scripts/test-stripe-billing.ts

# 2. Real User JWT RLS Bypass Test (verifies inactive users cannot insert/update scores directly)
ALLOW_DESTRUCTIVE_TESTS=true bun run scripts/test-rls-bypass.ts

# 3. Comprehensive Milestone Test Suite
ALLOW_DESTRUCTIVE_TESTS=true bun run scripts/test-milestone.ts

# 4. ESLint Verification (0 errors, 0 warnings)
bun run lint

# 5. TypeScript Compiler Verification
bunx tsc --noEmit

# 6. Next.js 16 Production Build
bun run build
```

---

## Future Development Milestones

1. **Charity System**: Real charity partner CRUD, admin management, public directory search/filter, and subscriber contribution ledger.
2. **Monthly Draw Engine**: Automated number selection, weighted draw algorithms, snapshot locking.
3. **Winner Verification & Payouts**: Handicap certificate upload, scorecard review queue, payout settlement.

