# Phase 3 Fixes Report

## Fixed Issues

### 1. Non-Atomic Invite Acceptance (Critical)
**File:** `src/pages/api/invites/[token]/accept.ts`

**Problem:** The invite acceptance marked the invite as `used_at` BEFORE inserting the membership. If membership insert failed, the invite was already consumed with no recovery path.

**Fix Applied:** Swapped the order — insert membership FIRST, then mark invite as used. If membership insert fails, no side effect occurs. If invite update fails after membership succeeds, a console error is logged but the user is already a member (edge case where user can retry).

**Status:** ✅ Fixed

---

### 2. `is_primary` Not Resolved for Adopted Child (High)
**File:** `src/pages/api/trees/[treeId]/relationships/index.ts`

**Problem:** The `is_primary` auto-resolution logic only ran for `spouse` relationships. When `is_adopted === true`, the code bypassed the is_primary resolution entirely, leaving `resolvedIsPrimary` as `false` (default) even when it should have been `true` for the first parent link.

**Fix Applied:** Added `is_primary` resolution for `parent_child` relationships before the `is_adopted` check. Now when a child gets their first parent link, `is_primary` is correctly set to `true`, regardless of whether the relationship is biological or adopted.

**Status:** ✅ Fixed

---

## Not Applicable / Already Implemented

| # | Issue | Status |
|---|-------|--------|
| 3 | Adopted child flow only creates one relationship | Not applicable — comments were misleading but code correctly creates one relationship per parent-add action |
| 4 | `ended_reason` not validated in PATCH | Already implemented at lines 68–76 in `[relId]/index.ts` |
| 5 | Self-removal prevention missing | Confirmed implemented (lines 161–167 in memberships endpoint) |
| 6 | No duplicate invite check per email | Already implemented at lines 151–169 in invites/index.ts |
| 7 | Transfer ownership not implemented | Already implemented in `transfer.ts` |

---

## Summary

| # | Severity | Issue | Status |
|---|----------|-------|--------|
| 1 | Critical | Non-atomic invite accept | ✅ Fixed |
| 2 | High | `is_primary` not resolved in adopted child path | ✅ Fixed |
| 3 | Medium | Dual-link intent unclear | Not applicable |
| 4 | Low | `ended_reason` not validated | Already fixed |
| 5 | N/A | Self-removal prevention | Confirmed implemented |
| 6 | Low | No duplicate invite check | Already fixed |
| 7 | Medium | Transfer ownership missing | Already implemented |

**Total Fixed: 2**
**Already Implemented: 4**
**Not Applicable: 1**
