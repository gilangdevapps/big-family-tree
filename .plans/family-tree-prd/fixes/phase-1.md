# Phase 1 Fixes Report

## Fixed Issues

### 1. Astro SSR mode not configured — **FIXED**
**File**: `astro.config.mjs`

Added `output: 'server'` to enable SSR mode required for cookie-based auth via `@supabase/ssr`.

```js
export default defineConfig({
  output: 'server',
});
```

> **Note**: An adapter (e.g., `@astrojs/vercel`, `@astrojs/netlify`) must be added before deployment to a specific host.

---

### 2. Verify page does client-side redirect instead of server-side — **FIXED**
**File**: `src/pages/auth/verify.astro`

Rewrote verify.astro to perform OTP verification in the Astro frontmatter (server-side) and redirect directly — no client JS required.

**Changes**:
- Moved `createServerClient` and `verifyOtp` into the frontmatter
- Server-side redirect to `/auth/welcome` on success, back to `/auth/magic-link?error=...` on failure
- Removed the `<script>` block that performed client-side redirect via `window.location.href`
- Preserved the visual loading spinner for users who land on the page before the redirect completes (works for JS-enabled users)
- No-JS users now get a proper redirect rather than a broken page

---

### 3. GET sign-out handler is a security anti-pattern — **FIXED**
**File**: `src/pages/auth/sign-out.astro`

Removed the `GET` handler from `sign-out.astro`. Only `POST` remains.

**Changes**:
- Removed `export const GET: APIRoute` handler entirely
- Updated dashboard sign-out link from `<a href="/auth/sign-out">` to a `<form method="POST" action="/auth/sign-out">` with a `<button type="submit">`

---

## Issues Left as Designed

| # | Severity | Issue | Reason Left |
|---|----------|-------|-------------|
| 3 | Info | `.env` credentials in gitignore | Already handled — `.env` is gitignored, `.env.example` is committed |
| 4 | Minor | `ended_reason` uses string `'null'` | Functional convention, would require schema migration |
| 5 | Minor | Owner-only delete policy | Owner IS always an admin via `createTree`, only a concern if ownership is transferred |
| 7 | Minor | Default magic link email template | Acceptable for Phase 1 scope |
| 8 | Minor | Tree count via nested SELECT | Requires live data verification, not a code issue yet |
| 9 | Minor | `getUser()` called twice in dashboard | Not worth fixing in Phase 1 — minor redundancy |

---

## Summary

**3 critical/medium issues fixed:**
1. SSR mode configured (`output: 'server'`)
2. Server-side OTP verification in verify.astro (no JS dependency)
3. POST-only sign-out (removed GET handler CSRF anti-pattern)

**Deployment note**: An Astro adapter must be added to `astro.config.mjs` before deploying (e.g., `vercel()`, `netlify()`, `node()`), matching the target host.
