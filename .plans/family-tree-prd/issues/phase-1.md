# Phase 1 Review — Issues Found

## Critical Issues

### 1. Astro SSR mode not configured
**File**: `astro.config.mjs`

The magic link auth flow requires server-side cookie handling via `@supabase/ssr`. This only works if Astro is in **server output mode**.

```js
// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'server', // ← MISSING — required for auth to work
});
```

**Impact**: Without `output: 'server'`, every page is pre-rendered at build time. The cookie-based session from `createServerClient` will not function correctly. Auth-protected pages like `/dashboard` will fail.

**Fix**: Add `output: 'server'` to `astro.config.mjs`. If you deploy to a Node.js-compatible host (Vercel, Netlify, Cloudflare Pages, etc.), you'll also need an adapter:

```js
import vercel from '@astrojs/vercel';
// or netlify, cloudflare, node, etc.
export default defineConfig({
  output: 'server',
  adapter: vercel(),
});
```

---

### 2. Verify page does client-side redirect instead of server-side verification
**File**: `src/pages/auth/verify.astro` (lines 57–71)

The verify page shows a loading spinner and then uses client-side JS to redirect to `/api/auth/verify`. This creates an unnecessary two-hop redirect (verify page → API → welcome).

**Problems**:
- Users with JS disabled see a broken page
- Brief flash of loading spinner before redirect
- Tokens visible in browser history
- The API endpoint returns a 302 redirect, which the JS `window.location.href` then follows

**Better approach**: Do the OTP verification directly in the Astro page frontmatter (server-side), then redirect. No client JS needed:

```astro
---
// src/pages/auth/verify.astro
import { createServerClient } from '../../../lib/supabase-server';

const token = Astro.url.searchParams.get('token');
const tokenHash = Astro.url.searchParams.get('token_hash');
const type = Astro.url.searchParams.get('type');

if (!token || !tokenHash || !type) {
  return Astro.redirect('/auth/magic-link?error=invalid_link');
}

const supabase = createServerClient(Astro.cookies);
const { error } = await supabase.auth.verifyOtp({ type, token, token_hash: tokenHash });

if (!error) {
  return Astro.redirect('/auth/welcome');
}
return Astro.redirect('/auth/magic-link?error=' + encodeURIComponent(error.message));
---
<!-- Just show loading state while redirecting -->
<meta http-equiv="refresh" content="0;url=/auth/welcome" />
```

This eliminates the JS dependency and the extra network hop.

---

## Medium Issues

### 3. `.env` with real credentials is untracked in git
**Files**: `.env`

The `.env` file contains real Supabase credentials and is in `.gitignore` (good), but the example file `.env.example` is committed while `.env` is not — this is correct. However, if the repo is ever made public accidentally, those credentials could be leaked. The `.env.example` correctly documents which variables are needed.

**Recommendation**: Add a note to NEVER commit `.env` in a README or contributing guide. Consider using Supabase's masking feature for the service role key in logs.

---

### 4. `ended_reason` CHECK constraint uses string `'null'` instead of SQL NULL
**File**: `supabase/schema.sql` (line 79)

```sql
ended_reason text check (ended_reason in ('divorce', 'death', 'null')),
```

The value `'null'` (a 4-character string) is used to represent "no end reason yet". This is unusual — standard SQL uses actual NULL for missing values.

```sql
ended_reason text check (ended_reason in ('divorce', 'death')) CHECK (ended_reason IS NOT NULL OR ...),
-- Or simply:
ended_reason text, -- nullable, actual SQL NULL when not ended
```

This works functionally, but any code that reads `ended_reason = 'null'` will get the string `'null'` instead of seeing a true null. All client code must be aware of this convention.

---

### 5. Tree deletion only allows owner, not admins
**File**: `supabase/schema.sql` (line 193–195)

```sql
create policy "Owner can delete tree"
  on public.family_trees for delete
  using (auth.uid() = owner_id);
```

The plan says "admins" can delete a tree (tree membership role), but this policy only allows the `owner_id` user to delete. If ownership is transferred, the new owner (now an admin) can delete — but other admins cannot.

Given the plan's stated requirement that admins should be able to delete, this should probably be:

```sql
create policy "Owner or admin can delete tree"
  on public.family_trees for delete
  using (user_is_tree_admin(id) OR auth.uid() = owner_id);
```

However, since the owner IS always an admin (via `createTree` adding them as admin), this is only a real issue if ownership is transferred. Consider whether transferred ownership should grant delete rights.

---

### 6. `sign-out` GET handler is a security anti-pattern
**File**: `src/pages/auth/sign-out.astro`

Having a GET handler for sign-out (in addition to POST) means anyone can log out a user by having them visit a URL:

```html
<a href="/auth/sign-out">Click here</a>
```

This is a CSRF-style vulnerability. In Phase 1 context it may be acceptable (the report mentions this), but it should be addressed before production.

**Fix**: Remove the GET handler, keep only POST. Update the dashboard link to use a form:

```html
<form method="POST" action="/auth/sign-out">
  <button type="submit" class="btn btn-ghost btn-sm">Sign out</button>
</form>
```

---

## Minor Issues

### 7. Magic link email not customizable yet
**File**: `src/pages/api/auth/magic-link.ts`

The magic link email is sent via Supabase's default template. Phase 1 acceptance criteria don't require custom email templates, but for a production-quality app, the email should be branded (custom subject, body with app name and logo).

Supabase allows configuring custom email templates in the dashboard or via API.

---

### 8. Dashboard tree count via nested SELECT may be unreliable
**File**: `src/pages/api/trees/index.ts` (line 26)

```ts
family_members (count)
```

Supabase's nested SELECT count syntax may not work as a nested resource this way. If the count returns unexpectedly, it would show 0 members even when members exist. Consider using a RPC function or a separate count query:

```ts
// Alternative: explicit count query
const { count } = await supabase
  .from('family_members')
  .select('*', { count: 'exact', head: true })
  .eq('tree_id', tree.id);
```

---

### 9. `getUser()` in dashboard is called twice
**File**: `src/pages/dashboard.astro` (lines 5–10)

```ts
const supabase = createServerClient(Astro.cookies);
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  return Astro.redirect('/auth/magic-link');
}
```

The `user` data is already available from `getUser()`, but the dashboard JS also fetches `/api/trees` which calls `getUser()` again. This is fine but redundant. Not worth fixing in Phase 1.

---

## Summary

| # | Severity | Issue | Status |
|---|----------|-------|--------|
| 1 | **Critical** | SSR mode not configured | Must fix before deploy |
| 2 | **Medium** | verify.astro client-side redirect | Should fix for JS-disabled users |
| 3 | Info | `.env` credentials in gitignore | OK — just monitor |
| 4 | Minor | `ended_reason` uses string `'null'` | Convention noted |
| 5 | Minor | Owner-only delete policy | May not match intended behavior |
| 6 | Medium | GET sign-out handler | Security anti-pattern |
| 7 | Minor | Default magic link email template | Acceptable for Phase 1 |
| 8 | Minor | Tree count syntax may be unreliable | Should verify with live data |

**Required before production**: Issues #1 (critical), #2 (medium-high), #6 (medium).

All other issues are acceptable for Phase 1 given its scope.
