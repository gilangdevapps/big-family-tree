# Phase 1 Design Brief: Project Setup & Authentication

## Feature Summary

Phase 1 establishes the foundational infrastructure: Supabase project with full database schema (6 tables with RLS), magic link authentication via Supabase Auth, and the core Astro page shell covering landing, auth, and dashboard. The goal is a fully functional auth system that feels warm and trustworthy — this is the first impression of a family history product, so it must feel welcoming, not clinical.

## Primary User Action

**Sign in or sign up via magic link.** The user flow: land on `/` → optionally browse marketing content → navigate to `/auth/magic-link` → enter email → see "check your inbox" confirmation with resend option → click link in email → hit welcome interstitial → enter dashboard.

## Design Direction

This phase expresses the **Heritage & Connection** brand: soft cream backgrounds, warm oak and sage accents, Newsreader serif for headings, Plus Jakarta Sans for UI. The feel is "warm archive" not "corporate SaaS."

- **Auth pages** should feel like entering a private family study — warm, quiet, focused. No noisy marketing on auth screens.
- **Landing page** leads with storytelling content, inviting exploration. Sign-in is secondary, below the fold.
- **Welcome interstitial** is a brief, warm confirmation moment — celebratory but not flashy.
- **Dashboard empty state** should feel like an inviting canvas, not a blank spreadsheet.

## Layout Strategy

### `/` (Landing Page)
- Full-width hero section with brand story, emotional copy, subtle background texture
- Below-fold: brief feature highlights, then sign-in call-to-action at the bottom
- The flow is "browse first, sign in later" — users who want to sign up immediately have the link, but browsing is the primary experience

### `/auth/magic-link`
- Centered, narrow form (max 400px) on cream background
- Email input with label, prominent "Send magic link" button
- Below input: link to resend if not received
- Inline error state for invalid email format

### `/auth/verify?token=xxx`
- If token is valid: brief loading state → redirect to welcome interstitial
- If token is invalid/expired: inline error message on the page, with "request a new link" action

### `/auth/sign-out`
- POST handler, clears session, redirects to `/`

### Welcome Interstitial (`/auth/welcome`)
- Centered, warm welcome message with user's email displayed
- "Go to dashboard" primary CTA
- Brief next-steps text: "Create your first family tree or explore sample trees"
- Auto-redirect to dashboard after 5 seconds if no interaction

### `/dashboard`
- Top nav with user email and sign-out link
- Page header: "Your family trees"
- Empty state: warm illustration/icon, inviting copy ("Your family story starts here"), "Create your first tree" CTA button
- Once trees exist: card grid layout (one tree = one card)
- Cards show: tree name, member count, last edited date, "Open" action

## Key States

### Magic Link Request
| State | User sees |
|-------|-----------|
| Default | Email input, "Send magic link" button |
| Loading | Button shows spinner, input disabled |
| Success | "Check your inbox" confirmation with email shown, resend link, return home link |
| Error (invalid email) | Inline error below input, red border, input re-enabled |
| Error (server) | Banner error at top of form, input re-enabled |

### Verify Token
| State | User sees |
|-------|-----------|
| Loading | Brief spinner while validating |
| Success | Redirect to /auth/welcome |
| Error (invalid/expired) | Error message with "request a new link" action |

### Dashboard
| State | User sees |
|-------|-----------|
| Empty | Warm empty state with illustration placeholder, headline, "Create your first tree" CTA |
| Loading | Skeleton cards |
| Populated | Grid of tree cards |
| Error | Inline error banner with retry |

## Interaction Model

- **Magic link send**: POST to `/api/auth/magic-link`, optimistically show success state
- **Token verification**: Auto-triggered on page load via URL param, redirect on success
- **Welcome interstitial**: Auto-redirect to dashboard after 5s; manual "Go to dashboard" button
- **Dashboard tree cards**: Click → navigate to `/tree/:treeId`; hover → subtle lift shadow
- **Sign out**: POST to `/auth/sign-out`, clear cookies, redirect to `/`

## Content Requirements

### Landing page
- Hero headline (evocative, not generic — e.g., "Your family's story, preserved")
- 1–2 sentences of brand copy
- Feature highlights section (3 bullets max)
- Bottom CTA: "Sign in to start your tree"

### Magic link page
- Heading: "Sign in to Big Family Tree"
- Subtext: "Enter your email and we'll send you a link to sign in instantly."
- Button: "Send magic link"
- Success heading: "Check your inbox"
- Success body: "We sent a sign-in link to [email]. It expires in 24 hours."
- Resend text: "Didn't get it? [Send again]"
- Error: "That email doesn't look right. Please check and try again."

### Verify page
- Loading: "Verifying your link…"
- Error heading: "This link has expired or is invalid"
- Error body: "No worries — request a new one and it'll be on its way."

### Welcome interstitial
- Heading: "Welcome to Big Family Tree"
- Body: "Your account is ready. Ready to start exploring your family's story?"
- CTA: "Go to dashboard"

### Dashboard
- Heading: "Your family trees"
- Empty headline: "Your family story starts here"
- Empty body: "Create your first tree and invite family members to collaborate."
- Empty CTA: "Create your first tree"
- Tree card: name (Newsreader serif), "[N] members · last edited [date]", "Open" link

## Technical Notes

- Session stored in HTTP-only cookies via Supabase SSR helpers
- All API routes use `Astro.locals` for auth context
- RLS policies enforce tree access via `tree_memberships`
- Supabase client initialized with `PUBLIC_*` env vars on client, `SUPABASE_*` on server

## Open Questions

- None — all resolved via discovery questions.
