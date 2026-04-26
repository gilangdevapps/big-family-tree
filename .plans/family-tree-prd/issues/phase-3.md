# Phase 3 Issues Report

## Critical Issues

### 1. Non-Atomic Invite Acceptance — Invite Left as Used Even If Membership Insert Fails
**File:** `src/pages/api/invites/[token]/accept.ts` (lines 75–97)

**Problem:** The invite acceptance uses two separate Supabase operations (update invite `used_at`, then insert membership) without a true database transaction. If the membership insert fails, the invite is already marked as used — the user cannot retry and must ask admin for a new invite.

**Severity:** High — Data integrity issue. User loses invite with no recovery path.

**Fix:** Swap the order: insert membership first, then mark invite as used. On membership insert failure, no side effect. Or use a Supabase transaction via RPC if available.

```ts
// Insert membership FIRST
const { data: membership, error: membershipError } = await supabase
  .from('tree_memberships')
  .insert({ tree_id: invite.tree_id, user_id: user.id, role: invite.role, joined_at: new Date().toISOString() })
  .select()
  .single();

if (membershipError) {
  return new Response(JSON.stringify({ error: membershipError.message }), { status: 500 });
}

// THEN mark invite as used (only after membership succeeds)
const { error: updateError } = await supabase
  .from('invite_tokens')
  .update({ used_at: new Date().toISOString() })
  .eq('id', invite.id);
```

---

### 2. `is_primary` Resolved Incorrectly for Adopted Child Code Path
**File:** `src/pages/api/trees/[treeId]/relationships/index.ts` (lines 156–169 + 174–229)

**Problem:** The `is_primary` auto-resolution logic (lines 156–169) only runs when `is_adopted !== true`. When `is_adopted === true`, the code jumps to the `if (relationship_type === 'parent_child' && is_adopted === true)` block (line 174) and bypasses the is_primary logic entirely. This means an adopted parent-child relationship may be created without any is_primary value resolved — it defaults to `false` (from the schema) when it should follow the same first-parent link = primary rule.

Additionally, the adopted child block only creates a SINGLE relationship, but the comments say "we create dual parent-child relationships: bio parent + adoptive parent" — yet the code only creates one.

**Severity:** High — Adopted child relationships may lack is_primary when they should have it. The dual-parent comment is misleading.

**Fix:** Move the is_primary resolution before the is_adopted branching, or add it inside the adopted block:

```ts
// Before the is_adopted check, resolve is_primary for parent_child too:
// If first parent link for person_b, set is_primary = true
if (relationship_type === 'parent_child') {
  const { data: existingParents } = await supabase
    .from('relationships')
    .select('id')
    .eq('tree_id', treeId)
    .eq('relationship_type', 'parent_child')
    .or(`person_a_id.eq.${person_b_id},person_b_id.eq.${person_b_id}`);

  if (!existingParents || existingParents.length === 0) {
    resolvedIsPrimary = true;
  }
}
```

---

### 3. No Relationship Cleanup on Member Delete
**File:** `src/pages/api/trees/[treeId]/members/[memberId]/index.ts` (DELETE handler — not shown in Phase 3 code)

**Problem:** Schema has `ON DELETE CASCADE` on `person_a_id` and `person_b_id` FKs to `family_members` — so deleting a member WILL cascade-delete related relationships. However, if relationships have `ON DELETE SET NULL` intent but schema shows `CASCADE`, the behavior is correct per the FK definition. The schema uses `CASCADE` (lines 73–74) so relationships are cleaned up automatically.

BUT: `is_adopted` flag on `family_members` has no corresponding relationship-level flag tracking whether that specific parental link is the adopted one vs. biological. If a bio parent is replaced by an adoptive parent, the child still shows `is_adopted: true` even if only bio links remain.

**Severity:** Medium — The cascade works, but the dual-link intent (creating both bio and adoptive parent links when is_adopted is checked) is not implemented. The code only creates ONE relationship with `is_adopted: true` on the child member, not a dual pair.

**Fix:** Clarify the adopted child UX flow: user should add each parent separately. The `is_adopted: true` on family_members is a historical record, not a real-time flag tied to a specific relationship.

---

### 4. `ended_reason` String `'null'` Not Enforced in PATCH
**File:** `src/pages/api/trees/[treeId]/relationships/[relId]/index.ts`

**Problem:** The PATCH handler accepts any `ended_reason` value — the schema CHECK constraint only allows `'divorce'`, `'death'`, or `'null'` (the string). But the API doesn't validate this, so a client could send `ended_reason: 'abandoned'` and it would be stored, or the insert would fail with a cryptic DB error.

**Severity:** Low — API-level validation is missing.

**Fix:** Validate ended_reason in both PATCH and POST:

```ts
const validEndedReasons = ['divorce', 'death', 'null'];
if (ended_reason !== undefined && !validEndedReasons.includes(ended_reason)) {
  return new Response(JSON.stringify({ error: 'ended_reason must be divorce, death, or null' }), { status: 400 });
}
```

---

### 5. Self-Removal Prevention Missing From API (DELETE Membership)
**File:** `src/pages/api/trees/[treeId]/memberships/[membershipId]/index.ts` (lines 161–167)

**Problem:** Wait — this IS implemented at lines 161–167. The DELETE handler correctly checks `if (targetMembership.user_id === user.id)` and returns 400. This issue was a false positive from the Phase 2 report. The self-demote prevention for PATCH is also present (lines 57–66).

**Status:** Not an issue. Confirmed implemented.

---

### 6. No Rate Limiting or Invite Exhaustion Check
**File:** `src/pages/api/trees/[treeId]/invites/index.ts` (POST)

**Problem:** An admin could create hundreds of invite tokens for the same email, effectively locking that email out of ever accepting (if the invite is never revoked, and the same-email uniqueness is per-tree). There's no check for an existing unused invite to the same email.

**Severity:** Low — Design issue, not a bug.

---

### 7. Transfer Ownership Not Implemented (Noted in Open Notes)
**File:** N/A

**Problem:** The `SELF_DEMOTE_NOT_ALLOWED` code references "Transfer ownership first" but there's no transfer ownership UI or API. The settings page shows the membership list with a role dropdown, but transferring tree ownership to another member is not implemented.

**Severity:** Medium — The error message promises a path (transfer ownership) that doesn't exist.

**Fix:** Implement a transfer ownership feature — either a dedicated API endpoint or add an "Owner" badge alongside Admin/Member roles. Options: (a) Add an `owner_id` field on `family_trees` that can be reassigned, (b) use a "Transfer ownership" button on the settings page that calls an API to change `owner_id` on the tree and reassign admin role.

---

## Summary

| # | Severity | Issue |
|---|----------|-------|
| 1 | Critical | Non-atomic invite accept — invite marked used before membership confirmed |
| 2 | High | `is_primary` not resolved in adopted child code path; dual-link intent not met |
| 3 | Medium | Adopted child flow only creates one relationship despite comments saying dual |
| 4 | Low | `ended_reason` not validated in PATCH API |
| 5 | N/A | Self-removal prevention — confirmed implemented |
| 6 | Low | No duplicate invite check per email |
| 7 | Medium | Transfer ownership referenced but not implemented |
