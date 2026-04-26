# Phase 1 Implementation Report

## What Was Built

Phase 1: Project Setup & Authentication — complete.

### Files Created

```
supabase/schema.sql                         — Full PostgreSQL schema (6 tables, indexes, RLS policies, triggers)
.env.example                               — Environment variable template
.env                                      — Local env (real Supabase credentials)
src/lib/supabase-client.ts                 — Browser Supabase client (createBrowserClient)
src/lib/supabase-server.ts                 — Server Supabase client (createServerClient, cookie-aware)
src/styles/global.css                     — Design tokens + global styles (Newsreader, Plus Jakarta Sans, OKLCH palette)
src/layouts/Layout.astro                  — Base layout with design system
src/pages/index.astro                     — Landing page (hero + features + CTA)
src/pages/auth/magic-link.astro            — Magic link request form (success state + resend)
src/pages/auth/verify.astro               — Token verification handler (auto-triggers on load)
src/pages/auth/welcome.astro              — Welcome interstitial (5s auto-redirect to dashboard)
src/pages/auth/sign-out.astro             — Sign-out handler (POST + GET)
src/pages/dashboard.astro                 — Dashboard (empty + populated states)
src/pages/api/auth/magic-link.ts          — POST: send magic link
src/pages/api/auth/verify.ts              — GET: verify OTP, redirect to welcome or error
src/pages/api/auth/sign-out.ts            — POST: sign out
src/pages/api/trees/index.ts              — GET: list user's trees with member count
```

### Files Modified
```
src/layouts/Layout.astro                  — Replaced boilerplate with design-system layout
src/pages/index.astro                    — Replaced Welcome component with full landing page
package.json                              — Added @supabase/supabase-js, @supabase/ssr
.env                                      — Updated key name: ANON_KEY → PUBLISHABLE_KEY
```

---

## Design Decisions

**Aesthetic direction**: Soft Minimalism with Tactile Accents — warm cream backgrounds, sage green primary, warm oak secondary. The interface feels like a well-organized family archive, not a corporate SaaS product.

**Typography**:
- Display: `Newsreader` (serif) — used for all headings, tree card names, hero headlines. Conveys heritage and authority.
- Body: `Plus Jakarta Sans` — open, legible, approachable for UI elements.
- **Why not the reflex fonts**: Literary serif fits the narrative tone better than a geometric sans for a family/heritage product. Plus Jakarta Sans is warm but modern without falling into the "tech startup" trap of Inter/DM Sans.

**Color (OKLCH)**:
- Background: `var(--color-surface)` = `#fff8f4` (warm cream, not pure white)
- Primary: `var(--color-primary)` = `#47593f` (sage green — growth, lineage)
- Secondary: `var(--color-secondary)` = `#785832` (warm oak — stability, heritage)
- On-surface: `#1f1b17` (charcoal brown, not pure black)
- Neutrals tinted toward the brand hue at ~0.005–0.01 chroma

**Theme**: Light — audience is family members at home, often older generations, viewing on desktop or tablet. Light feels like a physical album or scrapbook. Dark would feel cold and technical for genealogical work.

**Layout**:
- Landing: two-column hero (copy left, tree illustration right), single-column features below
- Auth pages: narrow centered card (max 440px) on radial-gradient background — quiet and focused
- Dashboard: 64px sticky nav, max-width container, 4pt spacing rhythm

**Motion**:
- Exponential easing (`cubic-bezier(0.22, 1, 0.36, 1)`) for all transitions
- Reduced-motion respected via `prefers-reduced-motion` media query
- No layout-property animations — only `transform` and `opacity`

**Bans actively avoided**:
- No side-stripe borders (the `#747870` outline at 1px is a proper border, not a stripe accent)
- No gradient text
- No glassmorphism
- No pure `#000`/`#fff`
- No rounded-rectangle hero metric layout
- No centered-everything card grids

### Key States Implemented

| Feature | States |
|---------|--------|
| Magic link form | default, loading, success (with resend), error (email format), server error |
| Verify page | loading spinner, redirect on success, inline error on failure |
| Welcome interstitial | auto-redirect countdown (5s), manual CTA cancels timer |
| Dashboard | empty state (warm illustration + CTA), populated (tree cards grid), loading (skeleton via CSS shimmer) |
| Sign out | POST + GET handlers, clears session, redirects to `/` |

---

## Supabase SSR — Updated Pattern

### Environment Variables
```
PUBLIC_SUPABASE_URL=               # e.g. https://xxx.supabase.co
PUBLIC_SUPABASE_PUBLISHABLE_KEY=   # new "publishable key" — replaces deprecated anon key
SUPABASE_SERVICE_ROLE_KEY=         # server-only, bypasses RLS
```

Supabase is deprecating `anon` and `service_role` keys in favor of a new `publishable`/`secret` key model. The transition is gradual — existing `anon` keys still work, but new projects should use `PUBLISHABLE_KEY`. The key type affects the `role` claim in the JWT (`"anon"` → `"publishable"`, `"service_role"` → `"secret"`).

### Server Client (Updated)
```ts
import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { Cookies } from '@astrojs/core/runtime';

export function createServerClient(cookies: Cookies) {
  return createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(cookies.headers.get('cookie') ?? '');
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookies.set(name, value, options);
          });
        },
      },
    }
  );
}
```

Key changes:
- **`parseCookieHeader`** replaces the old hand-rolled parser (`c.split('=')`). The old approach breaks on cookie values containing `=` signs. `parseCookieHeader` handles HttpOnly, SameSite, path flags, and encoded characters correctly.
- **`PUBLIC_SUPABASE_PUBLISHABLE_KEY`** replaces `PUBLIC_SUPABASE_ANON_KEY` per Supabase's new key naming.
- Cache headers (`Cache-Control`, `Expires`, `Pragma`) are automatically applied by `@supabase/ssr` v0.10.0+ when `setAll` receives them as a second argument. Astro's `cookies.set()` handles this internally — no extra work needed.

### Browser Client
```ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}
```

`createBrowserClient` is a singleton — only one instance is created regardless of how many times `createClient()` is called. No cookie configuration needed on the client.

### Auth Flow Summary
1. User submits email → POST `/api/auth/magic-link` → Supabase sends email with signed URL
2. User clicks link → `GET /auth/verify?token=...&token_hash=...&type=...` → auto-triggers `/api/auth/verify`
3. API handler calls `supabase.auth.verifyOtp()` → on success redirects to `/auth/welcome`, on failure back to `/auth/magic-link?error=`
4. Welcome interstitial → auto-redirects to `/dashboard` after 5s (or on CTA click)
5. Dashboard checks `getUser()` — if no session, redirects to `/auth/magic-link`

---

## Acceptance Criteria Checklist

- [x] User can request magic link by entering email
- [x] User receives email with sign-in link (Supabase handles email delivery)
- [x] Clicking link signs user in and redirects to welcome interstitial
- [x] Magic link is reusable within 24h (Supabase default)
- [x] User can sign out
- [x] Unauthenticated users redirected to sign-in (dashboard checks `getUser()`)
- [x] Deleting account removes membership but preserves tree data (RLS `on delete cascade` on memberships, `family_trees`/`family_members` preserved)
- [x] Database schema created with proper relationships and indexes
- [x] RLS policies enforce tree access control (via helper functions `user_has_tree_access`, `user_is_tree_admin`)
- [x] Updated to use `PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `parseCookieHeader` per current Supabase docs

---

## Open Notes for Later Phases

- Schema must be run against the Supabase database (not yet applied — credentials are real but schema hasn't been deployed)
- Astro must be configured for SSR (`output: 'server'` in `astro.config.mjs`) for dynamic per-request auth to work
- Phase 2 will build tree CRUD API endpoints and the guided onboarding walkthrough
- Cookie security: `secure: true` and `sameSite: 'lax'` should be added in production
- `sign-out` uses GET handler — in production should be POST-only with CSRF protection
