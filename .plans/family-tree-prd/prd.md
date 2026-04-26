# Family Tree Web Application — PRD

## Problem Statement

Keluarga ingin menyimpan dan melihat silsilah keluarga (family tree) secara digital — menggantikan cara tradisional seperti catatan kertas atau spreadsheet. Tantangan utamanya:

- Data tersebar di banyak tempat (WhatsApp, foto, catatan)
- Tidak ada cara mudah untuk memvisualisasikan hubungan keluarga
- Tidak ada sistem yang memungkinkan beberapa anggota keluarga berkontribusi tanpa mengatur infrastruktur sendiri

## Solution

Web application berbasis cloud yang memungkinkan keluarga untuk:

- Menyimpan profil setiap anggota keluarga secara lengkap (nama, tanggal lahir, foto, informasi pernikahan, kontak, bio, lokasi)
- Memvisualisasikan hubungan keluarga dalam bentuk tree interaktif dengan layout radial all-direction
- Beberapa anggota keluarga bisa berkontribusi melalui sistem invite dengan role-based access
- Mendukung complex family relationships (adopted, step-siblings, polygamy)
- Semua data tersimpan aman di cloud (Supabase/PostgreSQL)

---

## User Stories

### Authentication & User Management

1. As a new user, I want to sign up using magic link (email only), so that I don't need to remember a password
2. As a user, I want to sign in via magic link, so that I can access my family trees securely
3. As a user, I want magic links to remain valid for 24 hours, so that I can retry if I don't click immediately
4. As a user, I want to sign out, so that I can protect my account on shared devices
5. As a user, I want to manage my account settings (email, notification preferences), so that I control my account
6. As a user, I want to delete my account, so that my personal data is removed from the system
7. As a user who deleted my account, I want my membership to be removed, so that I no longer appear in the tree — but the tree data itself remains

### Family Tree Management

8. As a user, I want to create a new family tree, so that I can start documenting my family lineage
9. As a user, I want to name my family tree (e.g., "Keluarga Besar Smith"), so that I can distinguish between multiple trees
10. As a user, I want to be warned if I create a tree with a duplicate name, so that I avoid confusion
11. As a user, I want to have unlimited family trees under one account, so that I can manage as many family lines as needed
12. As a user, I want to delete a family tree by typing the tree name to confirm, so that accidental deletes are prevented
13. As a user, I want to set a primary/"home" person in each tree, so that the radial layout centers on the right person
14. As a user, I want to transfer tree ownership to another user, so that I can pass management responsibility

### First Member & Onboarding

15. As a new user creating my first tree, I want to choose between starting with an empty tree or pre-creating my own profile, so that onboarding fits my preference
16. As a new user, I want a guided walkthrough for adding my first family member, so that I get started easily
17. As an admin, I want to mark a family member as the "root" or oldest known ancestor, so that the tree has a starting point

### Family Member Profiles

18. As an admin, I want to add a new family member profile, so that I can grow the family tree
19. As an admin, I want to edit family member profiles, so that I can keep information accurate and up-to-date
20. As an admin, I want to track who last edited a profile and when, so that I can see edit history ("Last edited by [name] on [date]")
21. As an admin, I want to delete a family member profile, so that I can remove incorrect or unwanted entries
22. As an admin deleting a parent with linked children, I want children to become "orphaned" (remain in tree without parent links), so that removing one person doesn't destroy the entire branch
23. As an admin, I want to set the following profile fields:
    - Full name (first name, last name) — **required**
    - Birth date (day, month, year) — **required, full date only**
    - Death date (day, month, year) — **optional for living members**
    - Gender
    - Profile photo (stored as-is, no auto-cropping)
    - Bio/notes (markdown supported)
    - Birth place
    - Current location
    - Occupation
    - Email (optional contact)
    - Phone number (optional contact)
24. As a viewer, I want to view a family member's full profile, so that I can learn about that person
25. As a viewer, I want to see a person's immediate family connections, so that I understand their relationships
26. As a viewer, I want to see the last edit information on profiles, so that I know how current the data is

### Relationships

27. As an admin, I want to link two people as married, so that I can show spousal relationships
28. As an admin, I want to mark one spouse as "primary" in polygamous relationships, so that the tree UI can emphasize the primary connection
29. As an admin, I want to link a child to their parents, so that I can show parent-child relationships
30. As an admin, I want to mark a child as adopted, so that the system automatically creates dual relationships — linking the child to both biological AND adoptive parents
31. As an admin, I want to track multiple marriages (polygamy), so that the system supports all family structures
32. As an admin, I want to mark a marriage as ended (divorce or death), so that relationship status is accurate
33. As an admin, I want to add step-sibling relationships, so that blended families are properly represented
34. As a viewer, I want to see the relationship type between connected people, so that I understand how people are related

### Relationship Creation UI

35. As an admin, I want to add relationships by selecting person A, choosing relationship type, then searching/selecting person B, so that I can build connections efficiently
36. As an admin, I want to add relationships by dragging from person A in the tree and dropping on person B, so that relationship creation feels natural and visual
37. As an admin, I want both relationship creation methods to be available, so that I can use whichever is more convenient

### Tree Visualization

38. As a user, I want to see the family tree in a radial (circular) layout using D3.js force-directed style, so that all connections radiate outward in all directions from the center
39. As a user, I want to click on a person in the tree and see a profile panel slide out, so that I can view details without leaving the tree view
40. As a user viewing the profile panel, I want to see name, photo, dates, immediate family links, and admin edit button (medium detail), so that I get useful info at a glance
41. As a user, I want to zoom in and out of the tree, so that I can see details or get an overview
42. As a user, I want to pan/drag the tree canvas, so that I can navigate large trees
43. As a user, I want to collapse/expand branches, so that I can focus on specific parts of the tree
44. As a user, I want to see the tree centered on a selected person, so that I can explore from any starting point
45. As a user, I want to see connection lines between family members, so that relationships are visually clear
46. As a user on mobile, I want full gesture support (pinch to zoom, pan, tap to select), so that navigation feels native on touch devices
47. As a user on mobile, I want the tree to be fully responsive, so that it works well on phones and tablets

### Tree Performance for Large Families

48. As a user with a large tree (100+ members), I want progressive rendering — nodes load on demand as I expand, so that the tree stays fast and responsive
49. As a user, I want deep links to individual profiles via URL (`/tree/:treeId/person/:personId`), so that I can share links to specific people
50. As a user accessing via deep link, I want any tree member to be able to view that profile, so that sharing is seamless
51. As a user, I want breadcrumb navigation showing my position in the tree, so that I don't get lost in large trees

### Invite & Access Control

52. As an admin, I want to invite family members via email, so that they can join the tree
53. As an admin, I want to send a magic link invite, so that invitees can sign up/sign in seamlessly
54. As an admin, I want invites to never expire until manually revoked, so that I don't have to re-invite people
55. As an admin, I want to set the invitee role (Family Member), so that they can edit profiles
56. As an admin, I want to change a user's role, so that I can promote family members to admins
57. As an admin, I want to prevent accidental self-demotion — I cannot demote myself to Family Member, I must transfer ownership first, so that there's always at least one admin
58. As an admin, I want to revoke a user's access, so that I can remove people who should no longer have access
59. As an admin, I want to see a list of all invited/accessible users, so that I can manage permissions
60. As a family member, I want to receive an invite email, so that I can join the family tree
61. As a family member, I want to join via invite link, so that I can easily access the tree

### Photo Management

62. As an admin, I want to upload profile photos, so that family members have visual identification
63. As an admin, I want to upload photos directly to Supabase Storage, so that images are stored securely in the cloud
64. As an admin, I want to store photos as-is (any aspect ratio), so that I don't have to pre-crop images
65. As an admin, I want to remove a profile photo, so that I can clear outdated or unwanted images
66. As a viewer, I want to see profile photos in the tree and profile, so that the experience is visual and personal

### Search & Navigation

67. As a user, I want to search for family members by name across all my trees, so that I can find people quickly
68. As a user, I want to filter tree view by branch, so that I can focus on specific family lines
69. As a user, I want to navigate to a person's profile directly via URL, so that I can share links to specific people

### Data Privacy & Security

70. As an admin, I want trees to be private by default, so that only invited members can access
71. As a user, I want my personal data (email, phone) to be protected, so that my privacy is maintained
72. As an admin, I want all data transmission to be encrypted, so that sensitive family information is secure

---

## Design Decisions

### Authentication

| Decision | Choice |
|----------|--------|
| Sign-in method | Magic link (passwordless) |
| Magic link validity | 24 hours, reusable within window |

### Family Tree

| Decision | Choice |
|----------|--------|
| Trees per account | Unlimited |
| Tree name uniqueness | Warn on duplicates, don't block |
| Tree deletion | Requires typing tree name to confirm |
| First member onboarding | Offer both empty tree and pre-create "You" options |

### Family Member Profiles

| Decision | Choice |
|----------|--------|
| Required fields | First name, last name, birth date (full date) |
| Optional fields | Death date, gender, photo, bio, location, occupation, contact |
| Bio/notes formatting | Markdown supported |
| Photo storage | Store as-is (any aspect ratio, no auto-crop) |
| Delete parent with children | Orphan children (keep them, remove parent links) |
| Edit tracking | Track who + when ("Last edited by [name] on [date]") |
| Account deletion | Membership removed, tree data preserved |

### Relationships

| Decision | Choice |
|----------|--------|
| Adopted children | Auto dual relationships (bio + adoptive parents) |
| Polygamy | Primary spouse emphasized (is_primary flag) |
| Relationship creation UI | Both select-based AND drag-and-drop |
| Marriage end tracking | divorce_date + ended_reason |

### Tree Visualization

| Decision | Choice |
|----------|--------|
| Layout | Radial/circular, all-direction (D3.js force-directed) |
| Click action | Profile panel slides out (medium detail) |
| Zoom | Yes |
| Pan | Yes |
| Mobile gestures | Full (pinch, pan, tap to select) |
| Large tree rendering | Progressive loading on demand |
| Deep links | Enabled for all tree members |

### Invite & Access

| Decision | Choice |
|----------|--------|
| Roles | Admin, Family Member |
| Who can edit | Admins only |
| Invite expiration | Never (until revoked) |
| Role change | Allowed, but cannot demote yourself |
| Initial setup walkthrough | Guided for first member |

---

## Implementation Decisions

### Authentication Module

- **Magic Link Authentication**: Users enter email, receive a sign-in link via email, click to authenticate
- **Magic Link Validity**: Token valid for 24 hours, reusable within that window
- **Session Management**: JWT tokens stored in HTTP-only cookies with refresh token rotation
- **Email Service**: Supabase Auth for sending magic link emails

### Data Model

#### Users Table
```
- id (UUID, primary key)
- email (unique)
- created_at
- updated_at
- last_sign_in_at
```

#### Family Trees Table
```
- id (UUID, primary key)
- owner_id (FK to users)
- name (string)
- root_person_id (FK to family_members, nullable)
- created_at
- updated_at
- settings (JSONB) - tree-specific preferences
```

#### Family Members Table
```
- id (UUID, primary key)
- tree_id (FK to family_trees)
- first_name (string, required)
- last_name (string, required)
- birth_date (date, required)
- death_date (date, nullable)
- gender (enum: male, female, other)
- birth_place (string, nullable)
- location (string, nullable)
- occupation (string, nullable)
- bio (text, nullable) -- markdown
- email (string, nullable)
- phone (string, nullable)
- profile_photo_url (string, nullable)
- is_adopted (boolean, default false)
- is_root (boolean, default false)
- last_edited_by (FK to users, nullable)
- last_edited_at (timestamp, nullable)
- created_at
- updated_at
```

#### Relationships Table
```
- id (UUID, primary key)
- tree_id (FK to family_trees)
- person_a_id (FK to family_members)
- person_b_id (FK to family_members)
- relationship_type (enum: spouse, parent_child, step_sibling)
- is_primary (boolean, default false) -- for polygamy, which spouse is primary
- marriage_date (date, nullable)
- divorce_date (date, nullable)
- ended_reason (enum: divorce, death, null)
- created_at
```

#### Tree Memberships Table
```
- id (UUID, primary key)
- tree_id (FK to family_trees)
- user_id (FK to users)
- role (enum: admin, family_member)
- invited_at
- joined_at
```

#### Invite Tokens Table
```
- id (UUID, primary key)
- tree_id (FK to family_trees)
- token (string, unique)
- email (string)
- role (enum: admin, family_member)
- expires_at (nullable) -- null means never expires
- used_at (nullable)
- created_at
```

### Module Architecture

#### 1. Auth Module
- `sendMagicLink(email)` - Generate and send magic link email (24h validity, reusable)
- `verifyMagicLink(token)` - Validate token, create session
- `signOut()` - Invalidate session
- `getCurrentUser()` - Get authenticated user

#### 2. Tree Module
- `createTree(name, options)` - Create new family tree (options: empty or pre-create user)
- `getTrees()` - List user's accessible trees (search across all)
- `getTree(id)` - Get tree details with root person
- `updateTree(id, data)` - Update tree settings
- `deleteTree(id, confirmName)` - Delete tree (requires name confirmation)
- `transferOwnership(treeId, newOwnerId)` - Transfer ownership

#### 3. Family Member Module
- `addMember(treeId, data)` - Add new family member
- `updateMember(memberId, data)` - Update member profile (tracks last_edited_by)
- `deleteMember(memberId)` - Remove member (orphans children, does not delete them)
- `getMember(memberId)` - Get member with relationships and last edit info
- `searchMembers(query)` - Search across all user's trees by name
- `uploadPhoto(memberId, file)` - Upload to Supabase Storage (stores as-is)

#### 4. Relationship Module
- `addRelationship(data)` - Create relationship between two people
- `addRelationship` for adopted - automatically creates dual parent-child links
- `updateRelationship(id, data)` - Update relationship details (including is_primary)
- `removeRelationship(id)` - Remove relationship
- `getRelationships(memberId)` - Get all relationships for a person
- `getImmediateFamily(memberId)` - Get parents, siblings, spouse, children

#### 5. Tree Visualization Module
- `getTreeGraph(treeId)` - Get full tree data for visualization
- `getSubTree(personId, depth)` - Get partial tree starting from person (progressive loading)
- `getAncestors(personId)` - Get all ancestors
- `getDescendants(personId)` - Get all descendants

#### 6. Invite Module
- `createInvite(treeId, email, role)` - Generate invite link (never expires)
- `getInvite(token)` - Validate invite token
- `acceptInvite(token, userId)` - Accept invite, add to tree
- `revokeInvite(inviteId)` - Cancel unused invite
- `listInvites(treeId)` - List all invites for tree
- `listMembers(treeId)` - List all members with roles
- `updateMemberRole(membershipId, newRole)` - Change user role (cannot demote self)

### API Endpoints

```
POST   /api/auth/magic-link/send
POST   /api/auth/magic-link/verify
POST   /api/auth/sign-out
GET    /api/auth/me

GET    /api/trees
POST   /api/trees
GET    /api/trees/:id
PATCH  /api/trees/:id
DELETE /api/trees/:id
POST   /api/trees/:id/transfer

GET    /api/trees/:treeId/members
POST   /api/trees/:treeId/members
GET    /api/trees/:treeId/members/:memberId
PATCH  /api/trees/:treeId/members/:memberId
DELETE /api/trees/:treeId/members/:memberId
POST   /api/trees/:treeId/members/:memberId/photo

GET    /api/trees/:treeId/members/:memberId/relationships
POST   /api/trees/:treeId/relationships
PATCH  /api/trees/:treeId/relationships/:relId
DELETE /api/trees/:treeId/relationships/:relId

GET    /api/trees/:treeId/graph
GET    /api/trees/:treeId/members/:memberId/ancestors
GET    /api/trees/:treeId/members/:memberId/descendants
GET    /api/trees/:treeId/members/:memberId/family

POST   /api/trees/:treeId/invites
GET    /api/trees/:treeId/invites
DELETE /api/trees/:treeId/invites/:inviteId
POST   /api/invites/:token/accept

GET    /api/trees/:treeId/memberships
PATCH  /api/trees/:treeId/memberships/:membershipId
DELETE /api/trees/:treeId/memberships/:membershipId

GET    /api/search/members?q=query -- search across all user's trees
```

### Tech Stack

- **Frontend**: Astro (SSR) with vanilla JS for interactivity
- **Backend**: Astro API routes with Supabase
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage for photos (as-is, no processing)
- **Auth**: Supabase Auth with magic link
- **Tree Visualization**: D3.js force-directed radial layout
- **Markdown**: For bio/notes fields (e.g., marked.js)

### Security Decisions

- All API routes require authentication
- Tree membership checked on every request
- Only tree admins can: add/edit/delete members, manage invites, delete tree
- Family members can only: view tree, view profiles
- Cannot demote yourself (must transfer ownership first)
- File uploads: validated for image types only, size limited to 5MB
- CSRF protection on all mutations
- Rate limiting on auth endpoints

### Profile Panel (Slide-out)

The profile panel shows medium detail:

- Name and profile photo
- Birth date and death date (if applicable)
- Gender
- Immediate family links (clickable)
- Bio excerpt
- "Last edited by [name] on [date]"
- Admin: Edit button

---

## Testing Decisions

### Testing Philosophy

Tests will focus on **external behavior only** — API responses, database state changes, and UI interactions. We will NOT test internal implementation details.

### Module Tests

#### Auth Module Tests
- `sendMagicLink`: Given valid email, token is created and email sent
- `sendMagicLink`: Given invalid email format, error returned
- `verifyMagicLink`: Given valid token, user session created
- `verifyMagicLink`: Given expired (>24h) token, error returned
- `verifyMagicLink`: Given used token, still valid within 24h window
- `signOut`: Session is invalidated

#### Tree Module Tests
- `createTree`: Owner is set as admin in membership
- `createTree` with "pre-create me" option: Creates user as first member
- `getTrees`: Only returns trees user has access to
- `deleteTree`: Requires correct name confirmation
- `deleteTree`: All members, relationships deleted (CASCADE)
- `transferOwnership`: New owner has admin role, old owner becomes family_member
- `updateMemberRole`: Cannot demote self (returns error)

#### Family Member Module Tests
- `addMember`: Member created with all provided fields
- `updateMember`: last_edited_by and last_edited_at are set
- `deleteMember` with children: Children remain in tree, parent links removed
- `uploadPhoto`: Photo URL stored correctly, aspect ratio preserved
- `searchMembers`: Returns results from all user's trees

#### Relationship Module Tests
- `addRelationship` (spouse): Creates spouse relationship
- `addRelationship` (adopted child): Creates dual parent-child links automatically
- `addRelationship` with is_primary: Primary spouse flag set correctly
- `updateRelationship`: Can change is_primary
- `removeRelationship`: Related family data remains intact
- `getImmediateFamily`: Returns correct set of relatives

#### Invite Module Tests
- `createInvite`: Token generated with no expiry (null expires_at)
- `acceptInvite`: User added to tree with correct role
- `revokeInvite`: Token no longer valid after revocation
- `updateMemberRole`: Role changed successfully

### Integration Test Scenarios

1. **New user flow**: Sign up via magic link → Create tree → Guided first member walkthrough → Verify tree populated
2. **Adopted child flow**: Add parent A, parent B, child → Mark child as adopted → Verify dual relationships
3. **Polygamy flow**: Add person with two spouses → Mark one as primary → Verify is_primary flag
4. **Edit flow**: Add member → Update fields → Verify last_edited_by updated → Verify edit persists
5. **Delete with children flow**: Add parent with children → Delete parent → Verify children still in tree, parent links removed
6. **Role change flow**: Invite user as family_member → Promote to admin → Verify permissions expanded
7. **Self-demote prevention**: As admin → Try to demote self → Verify error returned
8. **Access control**: Tree admin edits → Family member tries to edit → Verify 403 error
9. **Search flow**: Create members in multiple trees → Search by name → Verify results from all trees
10. **Photo upload**: Upload photo → Verify stored as-is (check aspect ratio preserved)

---

## Out of Scope

### Not Included in Initial Version

- Public/global family tree search
- Data export (JSON/CSV)
- Data import from other sources (GEDCOM, etc.)
- Offline mode
- Push notifications
- Family events/calendar
- Family photo albums beyond profile photos
- Multiple languages/i18n
- Family tree printing
- DNA integration
- Family messaging/chat
- Subscription/payment system (app is free)
- Auto-cropping of photos
- Partial dates (day-only, month-only)

### Explicitly Not Supported

- Same-sex marriage distinction (tracked as spouse like any other)
- Detailed medical history
- Family recipes/traditions documentation
- Family tree comparison/merging tools

---

## Further Notes

### Performance Considerations

- Radial tree layout should render smoothly for trees up to ~500 members
- Progressive rendering: nodes load on demand as user expands branches
- Lazy load relationship data as user expands
- Optimize photo thumbnails for tree view, full size only on profile
- No hard limit on members, but UI may degrade beyond ~500

### Accessibility

- Keyboard navigation in tree view
- Screen reader support for profile information
- High contrast mode support
- Minimum touch target sizes for mobile (44x44px)
- Full gesture support on mobile (pinch, pan, tap)

### Future Extensibility (Not in Scope)

- Family events and reunions scheduling
- Document storage (birth certificates, old photos)
- Timeline view of family history
- AI-powered suggestions for family connections
- Data export/import
- Photo auto-cropping
- Partial date support
