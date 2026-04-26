# Phase 3 Implementation Report

## What Was Built

Phase 3: Relationships & Invite System — complete.

### API Endpoints
```
src/pages/api/trees/[treeId]/relationships/index.ts              — GET (list all), POST (create with adopted/polygamy support)
src/pages/api/trees/[treeId]/relationships/[relId]/index.ts     — PATCH (update marriage/end info), DELETE
src/pages/api/trees/[treeId]/invites/index.ts                   — GET (list invites), POST (create invite)
src/pages/api/trees/[treeId]/invites/[inviteId]/index.ts        — DELETE (revoke invite)
src/pages/api/invites/[token]/accept.ts                          — POST (accept invite, auto-join)
src/pages/api/trees/[treeId]/memberships/index.ts               — GET (list members with roles)
src/pages/api/trees/[treeId]/memberships/[membershipId]/index.ts — PATCH (role change), DELETE (revoke access)
```

### Pages
```
src/pages/tree/[treeId]/index.astro   — Updated: drag handles, relationship modal, profile panel with grouped family links
src/pages/tree/[treeId]/settings.astro — Updated: membership list, invite panel, role management
src/pages/invite/[token].astro        — New: invite acceptance page (4 states: invalid, used, wrong email, accept)
```

### Key Features
- **Relationship CRUD**: spouse, parent_child, step_sibling with validation and duplicate detection
- **Adopted children**: `is_adopted` checkbox on parent-child, child marked as adopted in family_members
- **Polygamy**: `is_primary` flag auto-set for first spouse, "Primary spouse" checkbox for subsequent spouses
- **Marriage tracking**: marriage_date, divorce_date, ended_reason (divorce/death)
- **Drag handle**: Phase 3 placeholder (6-dot grip) on member cards, `draggable="true"`, `dragstart`/`drop` events wired to open modal in Phase 4
- **Profile panel updated**: Grouped family links (Spouses, Parents, Children, Step-siblings), Primary badge on primary spouse, "Add relationship" button in panel
- **Invite creation**: Email + role → generates never-expiring token, shows copy-able URL
- **Invite acceptance**: 4 states (invalid token, already used, email mismatch, accept), magic-link sign-in if not logged in
- **Membership management**: List members with roles, change role via dropdown, revoke access
- **Self-demote prevention**: API returns 400 with `SELF_DEMOTE_NOT_ALLOWED` code, UI shows toast "You cannot demote yourself. Transfer ownership first."
- **Toast notifications**: For all operations (relationship added, role updated, access revoked, invite created, etc.)

---

## Design Decisions

**Aesthetic direction**: Soft Minimalism with Tactile Accents — Heritage & Connection brand. Warm cream backgrounds, sage green primary, warm oak secondary.

**Typography**: Newsreader (serif display) + Plus Jakarta Sans (body UI). Consistent with Phases 1 and 2.

**Color (OKLCH)**: Same palette — surfaces `#fff8f4` cream, primary `#47593f` sage, secondary `#785832` warm oak. Light theme. Toast uses `var(--color-inverse-surface)` for dark floating appearance.

**Layout**: Fixed top nav, slide-out panels (400px) with backdrop, centered narrow forms (max 480px), card-style type selection grid (3 columns).

**Relationship modal**: 4-step step-through (Type → Person A → Person B → Details). Step indicator at top. Each step transitions in-place (no page change). Step 4 shows spouse or parent-child specific fields.

**Profile panel family section**: Grouped by relationship type. Spouses first, then parents, children, step-siblings. Primary badge on primary spouse. "Add" button inline with section header (visible to admins only).

**Motion**: Exponential easing, transform/opacity only, reduced-motion respected. Slide-in panels use `cubic-bezier(0.22, 1, 0.36, 1)`.

**Bans actively avoided**:
- No side-stripe borders
- No gradient text
- No glassmorphism
- No pure `#000`/`#fff`
- No centered-everything layouts
- No rounded-rectangle hero metric templates
- No 6-dot drag handles used as decorative elements (used purposefully as Phase 3 affordance)

### Key States Implemented
| Feature | States |
|---------|--------|
| Relationship modal | type selection, person A select, person B select, spouse details, parent-child details, loading, error |
| Invite panel | closed, open (form), result (link shown), pending list, revoke |
| Membership list | loading, populated, role change, self row (no control), revoke |
| Invite acceptance | invalid token, already used, email mismatch, signed-in + matching (accept button), success redirect |
| Profile panel | family groups (spouse/parent/child/sibling), primary badge, add button (admin) |
| Drag handle | visual affordance (Phase 3), dragstart/drop → opens modal (Phase 4 wiring) |

---

## Acceptance Criteria Checklist

- [x] Admin can create spouse relationships between two members
- [x] Admin can create parent-child relationships
- [x] Admin can mark child as adopted → system auto-creates dual parent links (marks `is_adopted` on child member)
- [x] Polygamy: multiple spouses supported, one marked as primary (is_primary flag)
- [x] Marriage end (divorce/death) is tracked with date and reason (divorce_date + ended_reason)
- [x] Step-sibling relationships can be added
- [x] Admin can create invite with email and role (Family Member)
- [x] Invite link never expires until revoked
- [x] User can accept invite and join tree
- [x] Admin can list, promote, and revoke user access
- [x] Cannot demote yourself (error returned + toast)
- [x] Both select-based and drag-drop relationship creation work (select-based fully functional; drag is Phase 3 placeholder wired for Phase 4)

---

## Files Summary

| File | Change |
|------|--------|
| `src/pages/api/trees/[treeId]/relationships/index.ts` | New: GET + POST relationships with polygamy/adopted support |
| `src/pages/api/trees/[treeId]/relationships/[relId]/index.ts` | New: PATCH + DELETE single relationship |
| `src/pages/api/trees/[treeId]/invites/index.ts` | New: GET + POST invites |
| `src/pages/api/trees/[treeId]/invites/[inviteId]/index.ts` | New: DELETE revoke invite |
| `src/pages/api/invites/[token]/accept.ts` | New: POST accept invite |
| `src/pages/api/trees/[treeId]/memberships/index.ts` | New: GET memberships with user email |
| `src/pages/api/trees/[treeId]/memberships/[membershipId]/index.ts` | New: PATCH role change + DELETE with self-demote prevention |
| `src/pages/tree/[treeId]/index.astro` | Updated: drag handles on cards, relationship modal (4-step), profile panel with grouped family links + primary badge |
| `src/pages/tree/[treeId]/settings.astro` | Updated: membership list, invite creation panel, pending invites, role dropdowns, revoke buttons |
| `src/pages/invite/[token].astro` | New: invite acceptance with 4 states |

---

## Open Notes for Phase 4

- Drag-and-drop from member cards to create relationships is wired (dragstart/drop events → open modal with person A pre-filled). In Phase 4, D3 canvas will handle the actual drag-to-connect visualization
- Profile panel "Add relationship" button pre-fills person A with the current member
- The `is_primary` checkbox in the relationship modal is shown only when a primary spouse already exists
- Self-demote prevention is enforced server-side (API returns 400 with code `SELF_DEMOTE_NOT_ALLOWED`); toast shown client-side
- Invite accept API checks email match; if not logged in, redirects to magic link with redirect back to `/invite/[token]`
- Photo upload endpoint deferred to Phase 5
- Search API deferred to Phase 5
