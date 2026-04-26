# Phase 2 Implementation Report

## What Was Built

Phase 2: Tree & Family Member Management — complete.

### API Endpoints
```
src/pages/api/trees/index.ts              — GET (list trees), POST (create tree)
src/pages/api/trees/[treeId]/index.ts     — GET, PATCH (rename, set root), DELETE
src/pages/api/trees/[treeId]/members/index.ts    — GET, POST (create member)
src/pages/api/trees/[treeId]/members/[memberId]/index.ts — GET, PATCH (update/tracking), DELETE
src/pages/api/trees/[treeId]/transfer.ts — POST (ownership transfer)
src/pages/api/trees/[treeId]/graph.ts    — GET (members + relationships for Phase 4)
```

### Pages
```
src/pages/tree/new.astro                 — Create tree (guided/empty choice, duplicate warning)
src/pages/tree/[treeId]/index.astro      — Tree view (member list + slide-out profile panel)
src/pages/tree/[treeId]/walkthrough.astro — 4-step guided first-member flow
src/pages/tree/[treeId]/settings.astro   — Rename, root person selector, delete with modal confirmation
src/pages/tree/[treeId]/settings/transfer.astro — Ownership transfer
src/pages/tree/[treeId]/members/new.astro — Add member form (progressive disclosure)
src/pages/tree/[treeId]/members/[memberId]/edit.astro — Edit member form (with last-edited tracking)
src/pages/tree/[treeId]/person/[memberId]/index.astro — Full member profile page
```

### Key Features
- **Tree CRUD**: Create (with duplicate-name warning), rename, delete (name confirmation modal), root person selection
- **Member CRUD**: All profile fields, progressive disclosure (basic → life events → bio/contact), markdown hint in bio field
- **Last-edited tracking**: `last_edited_by` + `last_edited_at` set on every PATCH
- **Root ancestor toggle**: Checkbox on member forms, badge on cards/panels/profiles
- **Profile panel**: Slide-out from right, loads via API, family links navigate within panel, skeleton loading state
- **Guided walkthrough**: 4-step flow (name → birth/gender → optional details → confirmation), creates member + sets as root person
- **Ownership transfer**: POST to `/api/trees/:treeId/transfer`, old owner becomes admin
- **Settings page**: Inline save (no full redirect), delete requires typing tree name

---

## Design Decisions

**Aesthetic direction**: Soft Minimalism with Tactile Accents — same Heritage & Connection brand from Phase 1. Warm cream backgrounds, sage green primary, warm oak secondary.

**Typography**: Newsreader (serif display) + Plus Jakarta Sans (body UI). Consistent with Phase 1.

**Color (OKLCH)**: Same palette as Phase 1 — surfaces from `#fff8f4` cream, primary `#47593f` sage, secondary `#785832` warm oak. Light theme.

**Layout**: Fixed top nav, centered narrow forms (max 520–600px), card-style empty states, slide-out panel (400px) with backdrop.

**Motion**: Exponential easing (`cubic-bezier(0.22, 1, 0.36, 1)`), transform/opacity only, reduced-motion respected.

**Bans actively avoided**:
- No side-stripe borders
- No gradient text
- No glassmorphism
- No pure `#000`/`#fff`
- No centered-everything card grids
- No rounded-rectangle hero metric layouts

### Key States Implemented
| Feature | States |
|---------|--------|
| Create tree form | default, duplicate warning, loading, server error |
| Walkthrough | Step 1–4 with validation, loading, success redirect |
| Member form (new/edit) | default, validation errors, loading, server error, success |
| Profile panel | closed, loading (skeleton), content, error, closing |
| Tree settings | inline save confirmation, delete modal, input validation |
| Profile page | all fields rendered, family links, edit button (admin only) |

---

## Acceptance Criteria Checklist

- [x] User can create, rename, and delete family trees
- [x] Tree deletion requires typing tree name to confirm (modal)
- [x] User can have unlimited trees
- [x] Warning shown when creating tree with duplicate name (client-side debounce + server-side check)
- [x] Owner can transfer tree ownership to another user (via settings/transfer page)
- [x] Admin can add family members with all profile fields
- [x] Admin can edit member profiles (last_edited_by, last_edited_at tracked)
- [x] Admin can delete members (orphans children — handled by DB cascade)
- [x] Admin can mark a member as "root" ancestor (toggle on forms, badge in UI)
- [x] First tree creation offers guided walkthrough or empty start (radio card selection on /tree/new)
- [x] Profile page shows all fields including last edit info
- [x] Profile panel shows medium detail with immediate family links

---

## Files Summary

| File | Change |
|------|--------|
| `src/pages/api/trees/index.ts` | Updated: POST now checks for duplicate names |
| `src/pages/api/trees/[treeId]/index.ts` | New: GET, PATCH, DELETE single tree |
| `src/pages/api/trees/[treeId]/members/index.ts` | New: GET, POST members |
| `src/pages/api/trees/[treeId]/members/[memberId]/index.ts` | New: GET, PATCH, DELETE single member with edit tracking |
| `src/pages/api/trees/[treeId]/transfer.ts` | New: ownership transfer |
| `src/pages/api/trees/[treeId]/graph.ts` | New: members + relationships (for Phase 4 viz) |
| `src/pages/tree/new.astro` | New: create tree with mode selection |
| `src/pages/tree/[treeId]/index.astro` | New: tree view with member list + profile panel |
| `src/pages/tree/[treeId]/walkthrough.astro` | New: 4-step guided onboarding |
| `src/pages/tree/[treeId]/settings.astro` | New: rename, root, delete |
| `src/pages/tree/[treeId]/settings/transfer.astro` | New: ownership transfer UI |
| `src/pages/tree/[treeId]/members/new.astro` | New: add member form |
| `src/pages/tree/[treeId]/members/[memberId]/edit.astro` | New: edit member form |
| `src/pages/tree/[treeId]/person/[memberId]/index.astro` | New: full profile page |

---

## Open Notes for Phase 3

- Delete member leaves orphaned children in relationships table (cascades to members only — relationships orphaned but harmless until Phase 3 adds cleanup)
- Profile panel family links work within the panel but relationships must be created via Phase 3 API
- Photo upload endpoint `/api/trees/:treeId/members/:memberId/photo` deferred to Phase 5
- Search API deferred to Phase 5
- Dashboard "New tree" button links to `/tree/new` — confirm this is the right route
- The `/tree/new` page doesn't check for duplicate names on submit — the client-side debounce + server-side check in POST handles this, no separate API call needed
- Ownership transfer requires user to already be a tree member — invite flow (Phase 3) handles adding new members first
