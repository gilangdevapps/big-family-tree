# Phase 2 Fixes Report

## Fixed Issues

### 1. Syntax error in settings.astro (Critical)
**File**: `src/pages/tree/[treeId]/settings.astro`
**Status**: Already fixed — line 40 already uses the correct `{ ascending: true }` object syntax.

---

### 2. DELETE member missing admin authorization check (Critical)
**File**: `src/pages/api/trees/[treeId]/members/[memberId]/index.ts`
**Fix**: Added admin membership check before delete:

```ts
// Verify user is admin of this tree
const { data: membership } = await supabase
  .from('tree_memberships')
  .select('role')
  .eq('tree_id', treeId)
  .eq('user_id', user.id)
  .eq('role', 'admin')
  .limit(1);

if (!membership || membership.length === 0) {
  return new Response(JSON.stringify({ error: 'Forbidden: must be tree admin' }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

---

### 3. Transfer page queries ALL users — privacy leak (Critical)
**File**: `src/pages/tree/[treeId]/settings/transfer.astro`
**Fix**: Replaced global `users` query with tree-scoped membership join:

```ts
const { data: treeMembers } = await supabase
  .from('tree_memberships')
  .select(`user_id, role, users(id, email)`)
  .eq('tree_id', treeId);

const userList = (treeMembers ?? []).map((m: any) => m.users).filter(Boolean);
```

Also removed unused `family_members` and `relationships` queries that were loaded but never used.

---

### 4. Transfer doesn't communicate membership requirement (Medium)
**File**: `src/pages/tree/[treeId]/settings/transfer.astro`
**Fix**: Added a note below the description:

```astro
<p class="settings-note">
  Only current tree members are shown. To transfer ownership to someone not yet in the tree, invite them first from the Members page.
</p>
```

---

### 6. walkthrough.astro uses search params inconsistently (Minor)
**File**: `src/pages/tree/[treeId]/walkthrough.astro`
**Fix**:
- Changed frontmatter from `searchParams.get('treeId')` to `Astro.params.treeId`
- Updated script block from `new URLSearchParams(window.location.search).get('treeId')` to hardcoded `<treeId>` (Astro route params are available at build time)
- Skip link `href={/tree/${treeId}}` now uses the route param correctly

---

### 7. POST /api/trees doesn't create membership for owner (Medium)
**File**: `src/pages/api/trees/index.ts`
**Fix**: After inserting the tree, insert the owner as admin into `tree_memberships`:

```ts
// Create admin membership for the owner
const { error: membershipError } = await supabase
  .from('tree_memberships')
  .insert({ tree_id: tree.id, user_id: user.id, role: 'admin' });

if (membershipError) {
  // Rollback: delete the tree we just created
  await supabase.from('family_trees').delete().eq('id', tree.id);
  return new Response(JSON.stringify({ error: membershipError.message }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

---

### 9. walkthrough skip link fragile when accessed directly (Minor)
**File**: `src/pages/tree/[treeId]/walkthrough.astro`
**Fix**: Resolved by Issue #6 fix — `treeId` is now read from `Astro.params` in frontmatter, so the skip link `href={/tree/${treeId}}` uses the correct route param instead of relying on search params.

---

## Not Fixed (Known/Deferred)

| # | Issue | Reason |
|---|-------|--------|
| 5 | Tree view is list, not radial | Correct per plan — radial is Phase 4 |
| 8 | Tree count via nested SELECT may be unreliable | Requires live Supabase verification |
| 10 | Bio renders as plain text, not markdown | Phase 5 |
| 11 | Danger zone only visible to owner | Consistent with RLS policy |
| 12 | Last editor shows raw email | Nice to fix, not critical |

---

## Summary

| Issue | Severity | Status |
|-------|----------|--------|
| 1. Syntax error | Critical | Already correct |
| 2. DELETE no admin check | Critical | **Fixed** |
| 3. ALL users queried | Critical | **Fixed** |
| 4. No membership guidance | Medium | **Fixed** |
| 6. walkthrough search params | Minor | **Fixed** |
| 7. No owner membership | Medium | **Fixed** |
| 9. Skip link fragile | Minor | **Fixed** (via #6) |

All critical and medium issues have been addressed.