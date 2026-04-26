# Plan: Family Tree Web Application

> Source PRD: `.plans/family-tree-prd/prd.md`

## Architectural Decisions

Durable decisions that apply across all phases:

### Routes
- `/` — Landing/home page
- `/auth/magic-link` — Request magic link
- `/auth/verify?token=xxx` — Verify magic link
- `/auth/sign-out` — Sign out
- `/dashboard` — List user's trees
- `/tree/:treeId` — Tree visualization (radial view)
- `/tree/:treeId/person/:personId` — Deep link to profile
- `/tree/:treeId/settings` — Tree settings
- `/api/*` — All API endpoints

### Schema (Supabase PostgreSQL)

**users** — id (uuid, pk), email (unique), created_at, updated_at, last_sign_in_at

**family_trees** — id (uuid, pk), owner_id (fk→users), name, root_person_id (fk→family_members, nullable), created_at, updated_at, settings (jsonb)

**family_members** — id (uuid, pk), tree_id (fk→family_trees), first_name, last_name, birth_date (date), death_date (nullable), gender (enum: male/female/other), birth_place, location, occupation, bio (markdown text), email, phone, profile_photo_url, is_adopted (bool), is_root (bool), last_edited_by (fk→users), last_edited_at (timestamp), created_at, updated_at

**relationships** — id (uuid, pk), tree_id (fk→family_trees), person_a_id (fk→family_members), person_b_id (fk→family_members), relationship_type (enum: spouse/parent_child/step_sibling), is_primary (bool, default false), marriage_date, divorce_date, ended_reason (enum: divorce/death/null), created_at

**tree_memberships** — id (uuid, pk), tree_id (fk→family_trees), user_id (fk→users), role (enum: admin/family_member), invited_at, joined_at

**invite_tokens** — id (uuid, pk), tree_id (fk→family_trees), token (string, unique), email, role, expires_at (nullable = never expires), used_at (nullable), created_at

### Key Models

- **Auth**: Supabase Auth with magic link (24h validity, reusable)
- **Tree**: Owned by one user, accessed by multiple via memberships
- **Member**: Belongs to one tree, has optional photo in Supabase Storage
- **Relationship**: Connects two members within the same tree
- **Invite**: Token-based, never expires, role assigned at creation

### Tech Stack

- **Frontend**: Astro SSR + vanilla JS
- **Backend**: Astro API routes + Supabase
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage (photos as-is)
- **Auth**: Supabase Auth (magic link)
- **Visualization**: D3.js force-directed radial layout
- **Markdown**: marked.js for bio fields

---

## Phase 1: Project Setup & Authentication

**User stories**: 1, 2, 3, 4, 5, 6, 7

### What to Build

Set up the entire project infrastructure: Supabase project with database schema, magic link authentication flow, and basic Astro layout with landing page and auth pages.

- Create Supabase project and database schema (all 6 tables with proper indexes and RLS policies)
- Configure Supabase Auth with magic link email template
- Build Astro project structure with layouts
- Create landing page (`/`)
- Create magic link request page (`/auth/magic-link`)
- Create magic link verification handler (`/auth/verify`)
- Create sign-out handler
- Create basic dashboard page (`/dashboard`) — shows list of user's trees (empty initially)
- Build API endpoints for auth
- Set up session handling with HTTP-only cookies
- Add environment variable configuration

### Acceptance Criteria

- [ ] User can request magic link by entering email
- [ ] User receives email with sign-in link
- [ ] Clicking link signs user in and redirects to dashboard
- [ ] Magic link is valid for 24 hours and reusable within that window
- [ ] User can sign out
- [ ] Unauthenticated users are redirected to sign-in
- [ ] Deleting account removes membership but preserves tree data
- [ ] Database schema created with proper relationships and indexes
- [ ] RLS policies enforce tree access control

---

## Phase 2: Tree & Family Member Management

**User stories**: 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26

### What to Build

Full CRUD for family trees and members with guided onboarding. Tree owner can create trees, add members, and manage settings. First-tree creation includes guided walkthrough for adding the first member.

- Create Tree CRUD API endpoints (`/api/trees`)
- Build tree creation page with duplicate name warning
- Build tree deletion with name confirmation
- Build tree settings page (rename, set root person)
- Build ownership transfer endpoint and UI
- Create Family Member CRUD API endpoints (`/api/trees/:treeId/members`)
- Build add member form with all profile fields (name, birth date, death date, gender, bio with markdown, location, occupation, contact)
- Build edit member form with last-edited tracking
- Build delete member (orphans children, does not delete them)
- Build guided first-member walkthrough for empty trees
- Build member profile page (`/tree/:treeId/person/:personId`)
- Build profile panel slide-out for tree view (medium detail: name, photo, dates, immediate family links, last edit info, admin edit button)
- Support both "empty tree" and "pre-create me" options on first tree creation

### Acceptance Criteria

- [ ] User can create, rename, and delete family trees
- [ ] Tree deletion requires typing tree name to confirm
- [ ] User can have unlimited trees
- [ ] Warning shown when creating tree with duplicate name
- [ ] Owner can transfer tree ownership to another user
- [ ] Admin can add family members with all profile fields
- [ ] Admin can edit member profiles (tracked: last_edited_by, last_edited_at)
- [ ] Admin can delete members (children become orphans, not deleted)
- [ ] Admin can mark a member as "root" ancestor
- [ ] First tree creation offers guided walkthrough or empty start
- [ ] Profile page shows all fields including last edit info
- [ ] Profile panel shows medium detail with immediate family links

---

## Phase 3: Relationships & Invite System

**User stories**: 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61

### What to Build

Relationship management between family members (spouse, parent-child, step-sibling, adopted) plus the invite system for inviting family members with role-based access.

- Create Relationship CRUD API endpoints (`/api/trees/:treeId/relationships`)
- Build relationship creation UI (select-based: select person A → choose type → select person B)
- Add drag-and-drop relationship creation in tree view
- Implement adopted children: when marked adopted, automatically creates dual parent-child relationships (bio + adoptive)
- Implement polygamy: is_primary flag for spouse relationships, UI emphasizes primary spouse
- Support marriage tracking: marriage_date, divorce_date, ended_reason
- Support step-sibling relationships
- Create Invite API endpoints (`/api/trees/:treeId/invites`, `/api/invites/:token/accept`)
- Build invite creation UI (email input, role selector)
- Build invite acceptance flow (new users create account, existing users join directly)
- Build membership management UI (list members, change roles, revoke access)
- Implement self-demote prevention (cannot demote yourself, must transfer ownership first)
- Invites never expire until manually revoked

### Acceptance Criteria

- [ ] Admin can create spouse relationships between two members
- [ ] Admin can create parent-child relationships
- [ ] Admin can mark child as adopted → system auto-creates dual parent links
- [ ] Polygamy: multiple spouses supported, one marked as primary
- [ ] Marriage end (divorce/death) is tracked with date and reason
- [ ] Step-sibling relationships can be added
- [ ] Admin can create invite with email and role (Family Member)
- [ ] Invite link never expires until revoked
- [ ] User can accept invite and join tree
- [ ] Admin can list, promote, and revoke user access
- [ ] Cannot demote yourself (error returned)
- [ ] Both select-based and drag-drop relationship creation work

---

## Phase 4: Tree Visualization

**User stories**: 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51

### What to Build

D3.js force-directed radial tree visualization with full interactivity: zoom, pan, click to open profile panel, collapse/expand branches, mobile gesture support, progressive loading for large trees.

- Create Tree Visualization API endpoint (`/api/trees/:treeId/graph`)
- Build D3.js radial layout (all-direction force-directed)
- Implement zoom in/out controls
- Implement pan/drag canvas navigation
- Build collapse/expand branch controls
- Click person → profile panel slides out
- Center tree on selected person
- Draw connection lines between members
- Mobile: pinch to zoom, pan gesture, tap to select
- Progressive rendering: load visible nodes first, expand on demand
- Implement `/tree/:treeId/person/:personId` deep links
- Breadcrumb navigation showing position in tree
- Branch filtering to focus on specific family lines

### Acceptance Criteria

- [ ] Tree renders in radial layout with D3.js
- [ ] All connections radiate outward in all directions from center
- [ ] Click on person opens profile panel with medium detail
- [ ] Zoom in/out works (controls + scroll wheel)
- [ ] Pan/drag works to navigate
- [ ] Branches can be collapsed/expanded
- [ ] Tree centers on selected person
- [ ] Connection lines show relationships
- [ ] Mobile: pinch, pan, tap all work
- [ ] Deep links work (`/tree/:treeId/person/:personId`)
- [ ] Progressive loading for 100+ members
- [ ] Breadcrumb navigation shown

---

## Phase 5: Photos, Search & Polish

**User stories**: 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72

### What to Build

Photo upload to Supabase Storage, cross-tree search, deep linking polish, and mobile responsiveness improvements.

- Create photo upload API (`/api/trees/:treeId/members/:memberId/photo`)
- Integrate Supabase Storage for photo uploads
- Photos stored as-is (any aspect ratio, no auto-crop)
- Upload accepts image types, max 5MB
- Display profile photos in tree nodes and profile panel
- Admin can remove profile photo
- Create search API (`/api/search/members?q=query`)
- Search across all user's trees by name
- Filter tree view by branch
- Full mobile responsiveness (critical requirement)
- Keyboard navigation in tree view
- Screen reader support for profile information
- High contrast mode support
- Minimum 44x44px touch targets on mobile

### Acceptance Criteria

- [ ] Admin can upload profile photo (stored as-is in Supabase Storage)
- [ ] Admin can remove profile photo
- [ ] Photos display in tree nodes and profile panel
- [ ] Upload rejects non-image files and files >5MB
- [ ] Search finds members by name across all user's trees
- [ ] Filter tree by branch works
- [ ] Tree fully responsive on mobile (critical)
- [ ] Mobile: 44x44px minimum touch targets
- [ ] Deep links accessible to all tree members
- [ ] Trees are private (only invited members can access)
- [ ] All data transmission encrypted (HTTPS)

---

## Phase Overview

| Phase | Title | Key Deliverables |
|-------|-------|-----------------|
| 1 | Project Setup & Auth | Supabase schema, magic link auth, landing/dashboard pages |
| 2 | Tree & Member Management | Tree CRUD, member CRUD, guided onboarding, profile/panel |
| 3 | Relationships & Access | Spouse/parent-child/adopted, invites, roles, self-demote prevention |
| 4 | Tree Visualization | D3.js radial, zoom/pan, profile panel, mobile gestures, deep links |
| 5 | Photos, Search & Polish | Photo upload, cross-tree search, mobile responsiveness, security |
