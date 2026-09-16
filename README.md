# ScoreKind

> **Score. Win. Give Back.**

A subscription-based golf performance, monthly prize draw, and verified charitable contribution platform built with Next.js 16, React 19, Tailwind CSS v4, Shadcn/UI, and Supabase.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Authentication & User Architecture](#authentication--user-architecture)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Supabase Setup & Migration Pipeline](#supabase-setup--migration-pipeline)
  - [1. Supabase CLI Setup](#1-supabase-cli-setup)
  - [2. Supabase Login](#2-supabase-login)
  - [3. Supabase Initialization](#3-supabase-initialization)
  - [4. Linking Remote Project](#4-linking-remote-project)
  - [5. Applying Migrations (db push)](#5-applying-migrations-db-push)
  - [6. Alternative: Supabase Dashboard SQL Editor](#6-alternative-supabase-dashboard-sql-editor)
  - [7. Verifying Remote Database Schema](#7-verifying-remote-database-schema)
- [Creating & Promoting Administrators](#creating--promoting-administrators)
- [Route Roles & Protection Rules](#route-roles--protection-rules)
- [Database Schema & Row Level Security](#database-schema--row-level-security)
- [Testing & Quality Checks](#testing--quality-checks)
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
- **UI Components**: Shadcn / Base UI (`base-nova` style)
- **Themes**: `next-themes` (Dark mode & Light mode support)
- **Icons**: Lucide React
- **Forms & Validation**: React Hook Form + Zod
- **Database & Auth**: Supabase PostgreSQL + Supabase Auth
- **Session & Security**: `@supabase/ssr` with Next.js 16 `proxy.ts` request interception
- **Package Manager**: Bun 1.3.10

---

## Authentication & User Architecture

ScoreKind enforces a **single source of truth** security model built on Supabase-issued JWT access tokens:

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

### Where Authentication Accounts & Profiles Live

- **Authentication Accounts**: Stored in `auth.users`. Visible in **Supabase Dashboard → Authentication → Users**.
- **Application Profiles**: Stored in `public.profiles` (1:1 with `auth.users`). Visible in **Supabase Dashboard → Table Editor → profiles**.
- **Profile Synchronization**: The `handle_new_user()` trigger automatically provisions `public.profiles` whenever an `auth.users` row is inserted.
- **Why Public Admin Registration Is Disabled**: To protect system integrity and prevent unauthorized privilege escalation, there is **no public admin registration route or endpoint**. Normal user signup exclusively yields `role = 'subscriber'`. Administrator privileges can only be granted by trusted administrators, direct SQL operations in the Supabase Dashboard, or server-side CLI scripts using the service role key.

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
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client & Server | Optional modern alias for publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-Only** | Privileged service key for admin CLI scripts (**never commit or prefix with `NEXT_PUBLIC_`**) |

> [!IMPORTANT]
> The project reference in `NEXT_PUBLIC_SUPABASE_URL` (the subdomain before `.supabase.co`, e.g. `rxyhvivuqytuqxjelbqu`) **must match** the Project Reference shown in your **Supabase Dashboard → Project Settings → General**.

---

## Supabase Setup & Migration Pipeline

### 1. Supabase CLI Setup

The Supabase CLI is installed as a development dependency in `package.json`:

```bash
bunx supabase --version
# Outputs: 2.117.0 (or newer)
```

### 2. Supabase Login

Authenticate your CLI session:

```bash
bunx supabase login
```

This generates or opens a browser session to issue a Supabase personal access token. Alternatively, set `SUPABASE_ACCESS_TOKEN` in your environment.

### 3. Supabase Initialization

The Supabase project configuration is managed in `supabase/config.toml`:

```bash
bunx supabase init
```

Existing migrations in `supabase/migrations/` are strictly preserved.

### 4. Linking Remote Project

Link the local project configuration to your remote Supabase project:

```bash
bunx supabase link --project-ref <PROJECT_REF>
```

For this project:

```bash
bunx supabase link --project-ref rxyhvivuqytuqxjelbqu
```

*(You may be prompted for your remote database password during linking).*

### 5. Applying Migrations (db push)

Apply the hardened initial schema to your remote Supabase database:

```bash
bunx supabase db push
```

The CLI applies:
- `supabase/migrations/20260916000000_initial_schema.sql`

### 6. Alternative: Supabase Dashboard SQL Editor

If you prefer applying the migrations directly via the web console:
1. Open **Supabase Dashboard → SQL Editor**.
2. Copy the entire contents of [supabase/migrations/20260916000000_initial_schema.sql](file:///Users/piyushkumar/Websites/subscrition_and_payment_portal/supabase/migrations/20260916000000_initial_schema.sql).
3. Paste into the SQL Editor and click **Run**.

### 7. Verifying Remote Database Schema

After applying migrations, execute the read-only verification script:
1. Open **Supabase Dashboard → SQL Editor**.
2. Run the queries from [supabase/verify-schema.sql](file:///Users/piyushkumar/Websites/subscrition_and_payment_portal/supabase/verify-schema.sql).
3. Confirm the 11 public tables, RLS enablement, policies, triggers, and constraints.

---

## Creating & Promoting Administrators

Normal signups always create accounts with `role = 'subscriber'`. Self-promotion is strictly blocked by the `check_role_update` database trigger.

To promote an initial user to `admin`, choose one of the two trusted methods:

### Method A: Using the Server CLI Utility (Recommended)

Ensure `SUPABASE_SERVICE_ROLE_KEY` is configured in your `.env`:

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

Once promoted, the user can sign in and access `/admin`.

---

## Route Roles & Protection Rules

| Route Group | Access Level | Description / Protection Rule |
| :--- | :--- | :--- |
| `/` | **Public** | Marketing landing page |
| `/charities` | **Public** | Partner charity directory |
| `/draws` | **Public** | Draw mechanics & prize tiers |
| `/login` | **Public** | Sign in (redirects to `/dashboard` if already authenticated) |
| `/signup` | **Public** | Sign up (redirects to `/dashboard` if already authenticated) |
| `/dashboard/*` | **Subscriber** | Protected: unauthenticated requests redirect to `/login?redirectTo=...` |
| `/admin/*` | **Admin** | Protected: unauthenticated requests redirect to `/login`; subscribers redirect to `/dashboard` |
| `/api/me` | **Authenticated** | Returns verified user identity derived from session JWT (401 if unauthenticated) |

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
10. `public.winner_verifications`: Scorecard & handicap verification queue (hardened against self-approval).
11. `public.payouts`: Payout settlement records (`amount >= 0`).

---

## Testing & Quality Checks

```bash
# Verify ESLint (0 errors, 0 warnings)
bun run lint

# Verify Next.js 16 Turbopack production build
bun run build
```

---

## Future Development Milestones

1. **Score Management System**: Stableford score entry, rolling-five active score calculations, score history.
2. **Stripe Subscription Billing**: Checkout Sessions, Customer Portal, Webhooks (`invoice.paid`, `customer.subscription.deleted`).
3. **Monthly Draw Engine**: Automated number selection, weighted draw algorithms, snapshot locking.
4. **Winner Verification & Payouts**: Handicap certificate upload, scorecard review queue, payout settlement.
