# Phase 5 Issues Report

## Critical Issues

### 1. `createServerClient` Called with Wrong Signature in Photo API
**File:** `src/pages/api/trees/[treeId]/members/[memberId]/photo.ts`

**Problem:** At line 17, `createServerClient` is called with `{ cookies, headers: request.headers }` — but the `createServerClient` function in `src/lib/supabase-server.ts` expects `cookies: Cookies` (an Astro Cookies object) not a plain object. The other API files pass `{ cookies: Astro.cookies, headers: Astro.request.headers }` which is the correct pattern. The Photo API incorrectly destructures `cookies` and `headers` from `request.headers` directly, which is not the Astro pattern.

At line 220, the DELETE handler repeats this same error.

The GET handler at line 5 does the same: `createServerClient({ cookies, headers: request.headers })`.

**Severity:** Medium — Will fail at runtime. `cookies` must be an Astro `Cookies` object.

**Fix:** Change all calls to:
```ts
// POST/DELETE in photo.ts
const supabase = createServerClient({ cookies: Astro.cookies, headers: Astro.request.headers });

// GET in search/members.ts
const supabase = createServerClient({ cookies: Astro.cookies, headers: Astro.request.headers });
```

---

### 2. Branch Filter Re-enumerates Children on Each Render — No Progressive loading support
**File:** `src/pages/tree/[treeId]/index.astro`

**Problem:** The branch filter implementation re-renders the tree from the selected node each time. For a tree with 100+ members, this re-renders all descendants every time the filter is applied. There's no progressive loading (virtualization, view culling) — the entire filtered subtree is rendered to the DOM at once.

The report claims "Progressive loading for 100+ members" was a Phase 4 criterion verified as implemented — but it doesn't exist. The current implementation renders all visible nodes to SVG.

**Severity:** Medium — Performance concern for large trees. All nodes rendered regardless of viewport.

---

### 3. Search `GET` Route in `photo.ts` — Misplaced File
**File:** `src/pages/api/trees/[treeId]/members/[memberId]/photo.ts`

**Problem:** The file `photo.ts` contains a `GET` export at line 4. This is clearly a mistake — it should be `search/members.ts`. The `GET` at line 4 is the Search API handler, not a photo retrieval endpoint. The `photo.ts` file has both the photo upload handler AND the search handler, which is a file organization error. The search API should be in its own file.

**Severity:** High — Confusing file structure. The photo endpoint file has search code in it.

---

### 4. No Search Results Pagination — All 20 Results Loaded at Once
**File:** `src/pages/api/search/members.ts` (line 69)

**Problem:** Search returns up to 20 results with no pagination. For power users with large trees and many members sharing the same name, 20 results may not be enough. There's also no cursor-based pagination for future scalability.

**Severity:** Low — 20 is reasonable for now, but not scalable.

---

## Medium-Severity Issues

### 5. Photo Upload Uses Service Role Key — RLS Bypassed for DB Updates
**File:** `src/pages/api/trees/[treeId]/members/[memberId]/photo.ts` (lines 176–211)

**Problem:** The photo upload uses `SUPABASE_SERVICE_ROLE_KEY` to create a storage client that bypasses RLS. This is intentional per the implementation notes ("must be set for server-side storage operations"). However, the subsequent database update (line 195) uses the regular `supabase` client (not the service role one), which correctly enforces RLS. But the storage operations themselves bypass RLS entirely — if the bucket path is misconfigured, any photo could be overwritten.

This is a design decision documented in Phase 5 notes, but the security implications (storage write without membership check) should be explicit.

**Severity:** Medium — Storage bypasses RLS. An admin of any tree could potentially overwrite another tree's member photo by crafting a request with a different `treeId`.

**Fix:** The treeId is validated against the member's actual tree_id at line 203 (`eq('tree_id', treeId)`), so cross-tree writes are prevented. The concern is mitigated but the service role key usage should be reviewed.

---

### 6. Photo Remove Button Dynamically Created — Missing `data-photo-url` Attribute
**File:** `src/pages/tree/[treeId]/members/[memberId]/edit.astro` (lines 592–599)

**Problem:** When the remove button doesn't exist in the DOM (no photo initially), it is created dynamically at lines 592–599. The newly created button does NOT get the `data-photo-url` attribute, but the remove handler `handleRemovePhoto()` uses `confirm()` for the prompt rather than `data-photo-url`. So the behavior is correct — but the dynamically created button lacks the `id="remove-photo-btn"` set on the original, so subsequent calls to `handleRemovePhoto` would attach to the original button only if it exists.

If a user uploads a photo, then removes it, then uploads another photo, the dynamically created "Remove" button won't have the `id` attribute. Subsequent `handleRemovePhoto` calls would still work since the event listener is attached via `removePhotoBtn?.addEventListener('click', handleRemovePhoto)` only at line 643 — which only runs once at page load. If the initial state has no remove button (member has no photo), the `removePhotoBtn` variable is `null` and no listener is attached for dynamically created buttons.

**Severity:** Medium — The dynamically created remove button after an upload won't have a click listener since the original `removePhotoBtn` was null at page load.

**Fix:** After creating the remove button dynamically, attach the listener:

```ts
newRemoveBtn.addEventListener('click', handleRemovePhoto);
```

---

### 7. `isOwnerOrAdmin` Check Incorrect — `membership` Can Be Non-Admin
**File:** `src/pages/tree/[treeId]/members/[memberId]/edit.astro` (line 34)

**Problem:** `isOwnerOrAdmin` is set to `tree.owner_id === user.id || (membership && membership.length > 0)`. This means ANY member of the tree (admin or family_member) can edit any member. The correct check should require `role === 'admin'` for non-owners. This was identified in Phase 2 as well.

In `photo.ts`, the admin check is correctly done via `eq('role', 'admin')`. But in `edit.astro`, `isOwnerOrAdmin` is used for showing the edit button, which means family members can see the edit button.

Looking at line 285: `{isOwnerOrAdmin && (<a href=...Edit member>)` — this shows edit button to family members too.

**Severity:** High — Family members can access the edit page (though the server-side PATCH endpoint correctly checks admin). The edit button is visible but the form submit would fail at the API level. Still a UX confusion issue.

---

## Low-Severity Issues

### 8. Search Results Photo `alt=""` Is Empty
**File:** `src/pages/dashboard.astro` (line 204)

**Problem:** Search result avatar shows photo with `alt=""`. For a screen reader, this should be descriptive: `alt="${r.first_name} ${r.last_name}'s photo"` or similar.

**Severity:** Low — Accessibility.

---

### 9. Search Overlay Doesn't Have `aria-hidden="true"` on Background Content
**File:** `src/pages/dashboard.astro` (lines 171–175)

**Problem:** The search overlay (`search-overlay`) is added to `document.body` but no `aria-hidden="true"` is set on the main content behind it. For screen readers, the dropdown is correctly associated with the search input via `aria-controls`, but the overlay clicking hides the results (line 174) which is fine.

**Severity:** Low — Minor a11y gap.

---

### 10. No `loading="lazy"` on Profile Photo in Profile Page
**File:** `src/pages/tree/[treeId]/person/[memberId]/index.astro` (line 140)

**Problem:** The profile photo `<img>` tag doesn't have `loading="lazy"` — the image will always load even if below the fold on mobile. For first-page images above the fold this is fine, but it's inconsistent with best practice.

**Severity:** Low — Performance.

---

### 11. `tabindex="0"` Set in JavaScript Instead of HTML
**File:** `src/pages/tree/[treeId]/index.astro` (line 2326)

**Problem:** `svgWrapper.setAttribute('tabindex', '0')` is called in JS at runtime. This should be in the HTML template (`<div class="tree-svg-wrapper" id="tree-svg-wrapper" tabindex="0">`) so it's accessible before JavaScript runs.

**Severity:** Low — Works but fragile.

---

### 12. Keyboard Focus Ring Not Visible on `toolbar-btn`
**File:** `src/pages/tree/[treeId]/index.astro` (CSS for `.toolbar-btn`)

**Problem:** `.toolbar-btn` has `:focus-visible` outline only for `.btn` base class — the `toolbar-btn` class extends `.btn` but doesn't override the focus style. The `.btn:focus-visible` rule at line 2776 applies, but the focus ring may be clipped by the circular shape's border-radius or invisible against the background.

**Severity:** Low — May be hard to see.

---

## Summary

| # | Severity | Issue |
|---|----------|-------|
| 1 | High | `createServerClient` called with wrong signature in photo.ts and search/members.ts — runtime failure |
| 2 | Medium | Branch filter re-renders all nodes — no virtualization for 100+ members |
| 3 | High | Search `GET` handler misplaced in `photo.ts` file — wrong file |
| 4 | Low | Search returns only 20 results with no pagination |
| 5 | Medium | Service role key usage for storage — RLS bypass (mitigated by DB check) |
| 6 | Medium | Dynamically created remove button has no click listener |
| 7 | High | `isOwnerOrAdmin` incorrectly allows family_member to see edit UI |
| 8 | Low | Search result photo `alt=""` |
| 9 | Low | Search overlay missing `aria-hidden` on background |
| 10 | Low | Profile photo missing `loading="lazy"` |
| 11 | Low | `tabindex="0"` set in JS instead of HTML |
| 12 | Low | Focus ring invisible on `toolbar-btn` |