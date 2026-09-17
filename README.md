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
| `NEXT_PUBLIC_SUPABASE_URL` | Client & Server | Your Supabase project URL (e.g. `https://rxyhvivuqytuqxjelbqu.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client & Server | Your Supabase Anon / Publishable key |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client & Server | Modern alias for publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-Only** | Privileged service key for admin CLI scripts (**never commit or prefix with `NEXT_PUBLIC_`**) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Client & Server | Optional Google OAuth Client ID |
| `STRIPE_SECRET_KEY` | **Server-Only** | Stripe Secret Key for server actions and checkout sessions (**never prefix with `NEXT_PUBLIC_`**) |
| `STRIPE_WEBHOOK_SECRET` | **Server-Only** | Stripe Webhook signing secret for validating event signatures (**never prefix with `NEXT_PUBLIC_`**) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client & Server | Stripe publishable key |
| `STRIPE_MONTHLY_PRICE_ID` | Server-Only | Optional Stripe Price ID for monthly plan (uses dynamic recurring fallback if unset) |
| `STRIPE_YEARLY_PRICE_ID` | Server-Only | Optional Stripe Price ID for yearly plan (uses dynamic recurring fallback if unset) |
| `NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_AMOUNT` | Client & Server | Configurable monthly price (default: `1299`) |
| `NEXT_PUBLIC_STRIPE_YEARLY_PRICE_AMOUNT` | Client & Server | Configurable annual price (default: `11999`) |
| `NEXT_PUBLIC_STRIPE_CURRENCY` | Client & Server | ISO currency code (default: `inr`) |
| `NEXT_PUBLIC_STRIPE_CURRENCY_SYMBOL` | Client & Server | Currency symbol (default: `₹`) |

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
   - Provisions all 11 core tables (`profiles`, `subscriptions`, `scores`, `charities`, `charity_preferences`, `charity_contributions`, `draws`, `draw_entries`, `winners`, `winner_verifications`, `payouts`).
   - Attaches `handle_new_user()` trigger to `auth.users`.
   - Enables RLS on all 11 tables with default security policies.
2. `supabase/migrations/20260917000000_security_and_verifications_hardening.sql`:
   - Attaches `check_profile_update()` trigger to enforce role and email immutability.
   - Drops `UNIQUE(winner_id)` on `winner_verifications` to support multiple audit attempts upon rejected proof resubmission.
   - Hardens `public.winners` SELECT access against anonymous scraping.
3. `supabase/migrations/20260918000000_stripe_subscriptions_hardening.sql`:
   - Adds `stripe_price_id` to `public.subscriptions`.
   - Expands `status` check constraint to support all Stripe subscription lifecycles (`trialing`, `canceled`, `unpaid`, `paused`, etc.).
   - Adds unique index on `provider_subscription_id` to ensure idempotent webhook upserts.
   - Adds indexes on `provider_customer_id` and composite `(user_id, status)`.

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
| `/` | **Public** | Marketing landing page |
| `/charities` | **Public** | Partner charity directory |
| `/draws` | **Public** | Draw mechanics & prize tiers |
| `/login` | **Public** | Sign in (redirects to `/dashboard` or `/admin` based on trusted role) |
| `/signup` | **Public** | Sign up (subscriber registration only) |
| `/dashboard/*` | **Subscriber** | Protected: unauthenticated requests redirect to `/login?redirectTo=...` |
| `/dashboard/scores` | **Subscriber** | Score management interface (rolling-five cards, history, add/edit/delete) |
| `/admin/*` | **Admin** | Protected: unauthenticated requests redirect to `/login`; subscribers redirect to `/dashboard` |
| `/api/auth/callback` | **Public** | OAuth code exchange with safe internal redirection |
| `/api/me` | **Authenticated** | Returns verified user identity derived from session JWT |
| `/api/stripe/checkout` | **Authenticated** | Initiates Stripe Checkout Session for monthly/yearly plans |
| `/api/stripe/portal` | **Authenticated** | Initiates Stripe Customer Portal Session for billing management |
| `/api/webhooks/stripe` | **Public (Verified)** | Ingests Stripe webhooks, validates cryptographic signature, syncs Supabase state |

---

## Database Schema & Row Level Security

The initial schema contains 11 public relational tables:

1. `public.profiles`: User details synced from `auth.users` via trigger; default role `'subscriber'`.
2. `public.subscriptions`: Membership billing cycles, plans (`monthly`, `yearly`), statuses (`active`, `past_due`, `cancelled`, etc.).
3. `public.scores`: Golf scores with constraints (`1 <= score <= 45`), unique per `(user_id, score_date)`.
4. `public.charities`: Partner charities (`slug` UNIQUE, `status` IN `draft`, `active`, `inactive`).
5. `public.charity_preferences`: Cause percentage allocations (`10 <= contribution_percentage <= 100`, only active charities).
6. `public.charity_contributions`: Audited distribution ledger (`amount >= 0`, `percentage >= 10`).
7. `public.draws`: Monthly draw cycles (`random`, `weighted`) with non-negative prize pools and subscriber counts.
8. `public.draw_entries`: Immutable draw participant snapshots (`scores_snapshot`, `subscription_snapshot`).
9. `public.winners`: Draw outcome records with consistency check between `match_count` (3–5) and `prize_tier`.
10. `public.winner_verifications`: Auditable scorecard & handicap verification queue supporting multiple submissions.
11. `public.payouts`: Payout settlement records (`amount >= 0`).

---

## Automated Verification & Testing

To run the complete milestone test suite:

```bash
# Run complete milestone test suite (Redirects, Scores, Role/Email Immutability, Stripe & RLS)
bun run scripts/test-milestone.ts

# Run targeted Stripe billing test suite
bun run scripts/test-stripe-billing.ts

# Verify ESLint (0 errors, 0 warnings)
bun run lint

# Verify Next.js 16 Turbopack production build
bun run build
```

---

## Future Development Milestones

1. **Monthly Draw Engine**: Automated number selection, weighted draw algorithms, snapshot locking.
2. **Charity Payment Remittance**: Monthly charity allocation settlement and transfer records.
3. **Winner Verification & Payouts**: Handicap certificate upload, scorecard review queue, payout settlement.
