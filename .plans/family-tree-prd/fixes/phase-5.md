# Phase 5 Fixes Report

## Issues Fixed

### Issue 7 (High) — `isOwnerOrAdmin` Check Incorrect
**File:** `src/pages/tree/[treeId]/members/[memberId]/edit.astro` (line 34)

**Problem:** `isOwnerOrAdmin` was set to `tree.owner_id === user.id || (membership && membership.length > 0)` — this allowed ANY member (including `family_member` role) to see the edit button.

**Fix:** Changed to `tree.owner_id === user.id || (membership && membership.length > 0 && membership[0].role === 'admin')` so only tree owners and admins can see and access the edit UI.

**Status:** Fixed

---

### Issue 8 (Low) — Search Result Photo `alt=""` Empty
**File:** `src/pages/dashboard.astro` (line 204)

**Problem:** Search result avatar showed photo with `alt=""`.

**Fix:** Changed to `alt="${r.first_name} ${r.last_name}'s photo"`.

**Status:** Fixed

---

### Issue 9 (Low) — Search Overlay Missing `aria-hidden` on Background
**File:** `src/pages/dashboard.astro` (lines 171–175)

**Problem:** The search overlay was created without `aria-hidden="true"`.

**Fix:** Added `overlay.setAttribute('aria-hidden', 'true')` when creating the overlay div.

**Status:** Fixed

---

### Issue 10 (Low) — Profile Photo Missing `loading="lazy"`
**File:** `src/pages/tree/[treeId]/person/[memberId]/index.astro` (line 140)

**Problem:** The profile photo `<img>` tag didn't have `loading="lazy"`.

**Fix:** Added `loading="lazy"` attribute to the profile photo img tag.

**Status:** Fixed

---

### Issue 11 (Low) — `tabindex="0"` Set in JavaScript Instead of HTML
**File:** `src/pages/tree/[treeId]/index.astro`

**Problem:** `svgWrapper.setAttribute('tabindex', '0')` was called in JS at runtime instead of being in the HTML template.

**Fix:** Moved `tabindex="0"` to the HTML template: `<div class="tree-svg-wrapper" id="tree-svg-wrapper" tabindex="0">`. Removed the `setAttribute` call from JavaScript.

**Status:** Fixed

---

### Issue 12 (Low) — Focus Ring Invisible on `toolbar-btn`
**File:** `src/pages/tree/[treeId]/index.astro` (CSS for `.toolbar-btn`)

**Problem:** `.toolbar-btn` extended `.btn` but the `:focus-visible` rule was only on `.btn`, not on toolbar buttons specifically.

**Fix:** Added explicit `.toolbar-btn:focus-visible` rule with matching outline: `outline: 2px solid var(--color-primary); outline-offset: 2px;`

**Status:** Fixed

---

## Issues Not Fixed (By Design or Out of Scope)

### Issue 1 (High) — `createServerClient` Wrong Signature
**File:** `src/pages/api/trees/[treeId]/members/[memberId]/photo.ts`, `src/pages/api/search/members.ts`

**Status:** Not fixed. The pattern `{ cookies, headers: request.headers }` is used consistently across ALL API files. The `createServerClient` function signature accepts `{ headers: Headers; cookies: AstroCookies }` and Astro passes cookies/headers via the route handler destructured props. All API files use the same pattern. This appears to be a false positive in the issue report — the signature IS correct for Astro API routes.

---

### Issue 2 (Medium) — Branch Filter Re-renders All Nodes
**File:** `src/pages/tree/[treeId]/index.astro`

**Status:** Not fixed. This is a performance optimization that would require significant architectural changes (virtualization, view culling). Marked as out of scope for this fix pass.

---

### Issue 3 (High) — Search `GET` Handler Misplaced in `photo.ts`
**File:** `src/pages/api/trees/[treeId]/members/[memberId]/photo.ts`

**Status:** Not fixed. This is a file organization issue. The `photo.ts` file only contains `POST` and `DELETE` exports — no `GET` handler exists in that file. The issue report appears to be incorrect about this.

---

### Issue 4 (Low) — Search Returns Only 20 Results
**File:** `src/pages/api/search/members.ts`

**Status:** Not fixed. This is a feature enhancement rather than a bug. 20 results is reasonable for the current scope.

---

### Issue 5 (Medium) — Service Role Key Usage for Storage
**File:** `src/pages/api/trees/[treeId]/members/[memberId]/photo.ts`

**Status:** Not fixed. This is a documented design decision with mitigations in place (DB-level tree_id validation prevents cross-tree writes).

---

### Issue 6 (Medium) — Dynamically Created Remove Button Has No Click Listener
**File:** `src/pages/tree/[treeId]/members/[memberId]/edit.astro`

**Status:** Not fixed. Looking at the code (lines 592–599), the dynamically created button DOES get the listener attached at line 599: `newRemoveBtn.addEventListener('click', handleRemovePhoto)`. The issue report appears to be incorrect — the listener is properly attached.

---

## Summary

| # | Severity | Issue | Status |
|---|----------|-------|--------|
| 1 | High | `createServerClient` wrong signature | Not a bug (all APIs use same pattern) |
| 2 | Medium | Branch filter performance | Out of scope |
| 3 | High | Search handler misplaced | Not a bug (no GET in photo.ts) |
| 4 | Low | No search pagination | Out of scope |
| 5 | Medium | Service role key | By design / mitigated |
| 6 | Medium | Remove button listener | Not a bug (listener IS attached) |
| 7 | High | `isOwnerOrAdmin` allows family_member | **Fixed** |
| 8 | Low | Search result alt empty | **Fixed** |
| 9 | Low | Missing aria-hidden | **Fixed** |
| 10 | Low | Missing loading=lazy | **Fixed** |
| 11 | Low | tabindex in JS | **Fixed** |
| 12 | Low | Focus ring invisible | **Fixed** |

**Fixed:** 6 issues
**Not fixed:** 6 issues (5 out of scope/by-design, 1 incorrectly reported)
