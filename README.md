# ScoreKind

> **Score. Win. Give Back.**

A subscription-based golf performance, monthly prize draw, and verified charitable contribution platform built with Next.js 16, React 19, Tailwind CSS v4, Shadcn/UI, and Supabase.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Authentication & JWT Architecture](#authentication--jwt-architecture)
- [Installation](#installation)
- [Development](#development)
- [Environment Variables](#environment-variables)
- [Supabase Setup](#supabase-setup)
- [Creating the First Administrator](#creating-the-first-administrator)
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

## Authentication & JWT Architecture

ScoreKind enforces a **single source of truth** security model built on Supabase-issued JWT access tokens:

```
User Credentials / Signup
          ↓
Supabase Auth Engine
          ↓
Supabase-issued JWT Access Token + Refresh Token
          ↓
Secure Supabase SSR Cookies (HTTP-only)
          ↓
Next.js 16 Server / Proxy Interception (proxy.ts)
          ↓
Verified Authenticated User Identity (auth.getUser())
          ↓
Database Profile & Role (profiles.role)
          ↓
Role-Based Access Control (RBAC) + Row Level Security (RLS)
          ↓
Protected Data & Resources
```

### Key Security Principles

1. **No Competing JWT Layer**: The Supabase Auth JWT access token is the sole authentication token. No redundant custom `jsonwebtoken` signing or duplicate `JWT_SECRET` is introduced.
2. **No Client-Side Token Storage**: Access tokens are **never** stored manually in `localStorage` or `sessionStorage`. All session persistence is handled via secure HTTP-only cookies managed by `@supabase/ssr`.
3. **Server-Side Identity Derivation**: Authorization decisions **never** trust client-supplied `user_id`, `role`, or `admin=true`. User identity is derived strictly on the server via `supabase.auth.getUser()`.
4. **Zero-Trust Role Escalation**:
   - Every new registration receives `role = 'subscriber'` via a PostgreSQL trigger (`handle_new_user`).
   - Database triggers (`check_role_update`) reject any attempt by subscribers to modify their own role.
   - Admin routes require verified server-side profile checks (`requireAdmin()`).

---

## Installation

Ensure [Bun](https://bun.sh) is installed on your system:

```bash
bun install
```

---

## Development

Start the local Next.js development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

Copy `.env.example` to `.env.local` and configure your Supabase credentials:

```bash
cp .env.example .env.local
```

### Variable Reference

| Variable | Scope | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Client & Server | Your Supabase project URL (e.g. `https://xyz.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client & Server | Your Supabase Anon / Publishable key |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client & Server | Optional modern alias for publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-Only** | Privileged service key for admin CLI scripts (**never commit or expose with `NEXT_PUBLIC_`**) |

---

## Supabase Setup

1. **Create a Supabase Project**:
   Sign in to [supabase.com](https://supabase.com) and create a new project.

2. **Execute Database Migrations**:
   Navigate to the **SQL Editor** in your Supabase dashboard and run the contents of:
   ```
   supabase/migrations/20260916000000_initial_schema.sql
   ```
   This provisions all 11 tables, constraints, indexes, triggers, and Row Level Security policies.

3. **Configure Authentication**:
   - Go to **Authentication > URL Configuration**.
   - Set **Site URL** to `http://localhost:3000` (or your production URL).
   - Add Redirect URL: `http://localhost:3000/api/auth/callback`.

---

## Creating the First Administrator

There is **no public "Register as Admin"** feature. All registrations automatically default to `role = 'subscriber'`.

To promote a user to `admin`, use one of the two trusted methods:

### Method A: Using the Server CLI Utility (Recommended)

With `SUPABASE_SERVICE_ROLE_KEY` configured in `.env.local`:

```bash
bun run scripts/promote-admin.ts user@example.com
```

### Method B: Via Supabase SQL Editor

Run the following query in your Supabase SQL Editor:

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

The initial schema includes 11 relational tables with strict RLS policies:

1. `profiles`: User account details, synced via `handle_new_user()` trigger from `auth.users`. Role default is `'subscriber'`.
2. `subscriptions`: Billing cycles, plans (`monthly`/`yearly`), status (`active`, `past_due`, `cancelled`, etc.).
3. `scores`: Golf scores with constraints (`1 <= score <= 45`) and unique constraint `(user_id, score_date)`.
4. `charities`: Verified partner organizations (`slug` UNIQUE, `status` IN `draft`, `active`, `inactive`).
5. `charity_preferences`: Member cause allocation (`10 <= contribution_percentage <= 100`, `UNIQUE(user_id)`).
6. `charity_contributions`: Audited distribution ledger (`type` IN `subscription`, `donation`).
7. `draws`: Monthly draw cycles (`random`/`weighted`, statuses: `draft`, `simulated`, `locked`, `published`, `completed`).
8. `draw_entries`: Immutable draw participant snapshots (`scores_snapshot`, `subscription_snapshot`).
9. `winners`: Draw outcome records (`prize_tier` IN `three_match`, `four_match`, `five_match`).
10. `winner_verifications`: Scorecard & handicap verification queue (`pending`, `approved`, `rejected`).
11. `payouts`: Settlement records (`pending`, `paid`).

---

## Testing & Quality Checks

Run linting and production build verification:

```bash
# Verify ESLint (0 errors, 0 warnings)
bun run lint

# Verify Next.js 16 Turbopack build
bun run build
```

---

## Future Development Milestones

The foundation is complete. Upcoming milestones:
1. **Score Management System**: Stableford score entry, rolling-five active score calculations, score history.
2. **Stripe Subscription Billing**: Checkout Sessions, Customer Portal, Webhooks (`invoice.paid`, `customer.subscription.deleted`).
3. **Monthly Draw Engine**: Automated number selection, weighted draw algorithms, snapshot locking.
4. **Winner Verification & Payouts**: Handicap certificate upload, scorecard review queue, payout settlement.
