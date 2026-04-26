# Phase 2 Review — Issues Found

## Critical Issues

### 1. Syntax error in settings.astro — will not compile
**File**: `src/pages/tree/[treeId]/settings.astro` (line 38)

```astro
.order('created_at', ascending: true);
```

Should be:

```astro
.order('created_at', { ascending: true });
```

The Astro expression syntax requires an object when passing named properties. This will cause a build/compile error.

---

### 2. Missing authorization check on DELETE member endpoint
**File**: `src/pages/api/trees/[treeId]/members/[memberId]/index.ts` (DELETE handler)

```ts
export const DELETE: APIRoute = async ({ cookies, params }) => {
  // ... auth check ...

  const { error } = await supabase
    .from('family_members')
    .delete()
    .eq('id', memberId)
    .eq('tree_id', treeId);

  // No admin check! Any member can delete any other member.
```

The DELETE handler authenticates the user but never checks whether they are an admin. Any authenticated tree member can delete any other member's profile. This bypasses the RLS policy that correctly restricts deletes to admins.

**Fix**: Add admin check before the delete (mirroring the PATCH handler's approach).

---

## Medium Issues

### 3. Transfer ownership page queries ALL users in database
**File**: `src/pages/tree/[treeId]/settings/transfer.astro` (line 45–48)

```ts
const { data: users } = await supabase
  .from('users')
  .select('id, email')
  .order('email', { ascending: true });
```

This queries **every user** in the entire database, not just members of the tree. This is:
- A serious privacy leak (all user emails visible to any tree member)
- Broken UX (shows users who haven't been invited yet)

**Fix**: Query `tree_memberships` joined with `users`, filtered to this tree.

---

### 4. Transfer ownership requires user to already be a member — but UX doesn't communicate this
**File**: `src/pages/tree/[treeId]/settings/transfer.astro`

The transfer flow works only if the new owner is already a member of the tree (`/api/trees/[treeId]/transfer` requires `user_is_tree_member`). But there's no guidance in the UI telling the owner to invite the new owner first. If someone not yet a tree member is selected, the transfer silently fails or shows an error.

**Fix**: Either (a) add a note "The person must already be a member of this tree" on the transfer page, or (b) pre-filter the dropdown to only show current tree members.

---

### 5. Tree view is list/grid, not radial visualization
**File**: `src/pages/tree/[treeId]/index.astro`

The plan for Phase 2 says "Tree view" but the acceptance criteria don't explicitly require the D3.js radial visualization until Phase 4. Phase 2 has a "member list view" which is what was actually built — a grid of clickable member cards.

**Status**: This is correct per the plan. The list view is a reasonable interim state before Phase 4 adds the actual radial tree.

---

### 6. walkthrough.astro uses search params for treeId instead of Astro route params
**File**: `src/pages/tree/[treeId]/walkthrough.astro`

```astro
const { searchParams } = new URL(Astro.request.url);
const treeId = searchParams.get('treeId');
```

Everything else uses `Astro.params.treeId`. The walkthrough page is at `/tree/:treeId/walkthrough` so the route param IS available — but it's using search params instead. This means the treeId appears in the URL twice: `/tree/xxx/walkthrough?treeId=xxx`. It's not broken, but it's inconsistent.

---

### 7. POST /api/trees creates tree but doesn't create tree_membership for owner
**File**: `src/pages/api/trees/index.ts` (POST handler)

```ts
const { data: tree, error } = await supabase
  .from('family_trees')
  .insert({ owner_id: user.id, name: trimmedName })
  .select()
  .single();
```

After creating a tree, the owner is NOT inserted into `tree_memberships`. The plan says "Owner is set as admin in membership" in the Tree Module Tests. But there is NO code that creates the membership record after inserting the tree.

This means:
- The `user_is_tree_admin` function won't work for the owner
- RLS policies that rely on `tree_memberships` will deny the owner access
- The owner can only access the tree because the `family_trees` RLS policy checks `auth.uid() = owner_id` directly

**Fix**: After inserting the tree, also insert the owner as an admin into `tree_memberships`.

---

### 8. Dashboard tree count via nested SELECT may be unreliable
**File**: `src/pages/api/trees/index.ts` (line 26–27)

This issue was already flagged in Phase 1 review. It persists in the updated `GET` handler — the nested `family_members(count)` count syntax is used again. Should verify with live Supabase that this actually works.

---

### 9. Empty state "Skip for now" link in walkthrough goes to `/tree/:treeId` without treeId param
**File**: `src/pages/tree/[treeId]/walkthrough.astro` (line 165)

```astro
<a href={`/tree/${treeId}`} class="btn btn-ghost" id="skip-btn">Skip for now</a>
```

`treeId` here comes from `new URLSearchParams(window.location.search).get('treeId')` (line 449). But on the `/tree/:treeId/walkthrough` route, the `treeId` is in the URL path, not search params. On a direct navigation to `/tree/xxx/walkthrough`, `searchParams.get('treeId')` returns null, so the skip link would go to `/tree/null`.

However, since the walkthrough is always navigated to via `window.location.href` from the new tree page (which adds `?treeId=xxx` to the URL), this works in practice. Still fragile.

---

## Minor Issues

### 10. Profile page bio renders raw markdown as plain text
**File**: `src/pages/tree/[treeId]/person/[memberId]/index.astro` (line 166)

```astro
<div class="profile-bio">{member.bio}</div>
```

The bio field is stored as markdown but rendered as plain text. For Phase 5, a markdown renderer (marked.js) needs to be integrated.

---

### 11. Settings page "danger zone" only visible to owner
**File**: `src/pages/tree/[treeId]/settings.astro` (line 119)

```astro
{tree.owner_id === user.id && (
  <section class="settings-section danger-zone">
```

Other admins cannot initiate tree deletion. This matches Phase 1's DELETE policy (only owner can delete), but the plan says "admins can delete". Since the RLS policy also restricts delete to `auth.uid() = owner_id`, this is consistent — though the plan intent may have been different. Noted.

---

### 12. Inline "last edited by" shows raw email in profile page
**File**: `src/pages/tree/[treeId]/person/[memberId]/index.astro` (line 282)

```astro
Last edited by {lastEditorEmail} on ...
```

The edit tracking feature works correctly but shows the raw user email. For Phase 5 or a future update, this should show a display name if available.

---

## Summary

| # | Severity | Issue | Status |
|---|----------|-------|--------|
| 1 | **Critical** | Syntax error in settings.astro — won't compile | Must fix |
| 2 | **Critical** | DELETE member has no admin authorization check | Must fix |
| 3 | **Medium** | Transfer page queries ALL users (privacy leak) | Must fix |
| 4 | **Medium** | Transfer doesn't tell user they must be a member first | Should fix |
| 5 | Info | List view is interim, D3 radial in Phase 4 | OK |
| 6 | Minor | walkthrough uses search params inconsistently | Nice to fix |
| 7 | **Medium** | POST /api/trees doesn't create membership for owner | Should fix |
| 8 | Minor | Tree count syntax may be unreliable | Verify with live DB |
| 9 | Minor | walkthrough skip link fragile if accessed directly | Nice to fix |
| 10 | Minor | Bio renders as plain text, not rendered markdown | Phase 5 |
| 11 | Info | Delete only visible to owner — consistent with RLS | OK |
| 12 | Minor | Last editor shows raw email | Nice to fix |

**Required before production**: Issues #1 (critical — build error), #2 (security), #3 (privacy), #7 (broken ownership tracking).

Overall the Phase 2 implementation is solid — all acceptance criteria are met functionally, the design language is consistent with Phase 1, and the UI states are well-handled. The critical issues are: the syntax error blocking compilation, a missing authorization check on member deletion, and a user privacy leak in the transfer page.
