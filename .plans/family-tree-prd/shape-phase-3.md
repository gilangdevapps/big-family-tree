# Phase 3 Design Brief: Relationships & Invite System

## Feature Summary

Phase 3 adds relationship management between family members (spouse, parent-child, step-sibling, adopted) and the invite system for role-based tree access. Users with admin access can connect members, track marriages with dates and divorce/death, and invite family members via email links that never expire.

## Primary User Action

**Admin builds family connections** — select person A → choose type → select person B → relationship appears in the tree and profile panels. Admins also invite new members via email and manage roles.

## Design Direction

Phase 3 follows the established **Heritage & Connection** brand from `docs/designs/DESIGN.md`. The feel is "family archive" — warm, tactile, grounded. Relationships are presented as bonds between real people, not database records.

- **Relationship forms**: Select-based with a clean modal/step-through flow. Relationship type chosen first, then person selectors appear.
- **Drag-and-drop placeholder**: Member cards get a subtle drag handle in Phase 3 (wires up in Phase 4 D3 canvas).
- **Profile panel updated**: Spouses shown with "Primary" badge; polygamy partners listed in a visible row.
- **Invite system**: Email-based with copy-link fallback. Toast notifications for errors like self-demote attempts.

## Layout Strategy

### `/tree/:treeId/relationships/new` (Relationship Creation — Select-Based)
- Modal overlay, centered, max 480px wide
- Step 1: Relationship type selector (3 large illustrated cards: Spouse, Parent-Child, Step-Sibling)
- Step 2: Person A selector (searchable dropdown of all members in tree)
- Step 3: Person B selector + optional marriage date / primary spouse toggle
- "Mark as adopted" toggle appears for parent-child type
- Back/Next/Create navigation, no full page reload
- Success: modal closes, toast "Relationship added"

### Member Cards (Drag Handle — Phase 3 Placeholder)
- Existing member cards in tree view get a subtle drag handle (6-dot grip icon, top-right)
- Drag handle has `cursor: grab`, no actual drag behavior yet — visually present to set user expectation
- Wires up in Phase 4 when D3 canvas is active

### Profile Panel Updates
- Spouse row: multiple spouses shown with avatar, name, "(Primary)" badge on primary spouse
- Adopted children noted inline in the child label
- "Add relationship" button in panel (opens relationship creation modal)
- Marriage dates shown on spouse entries: "Spouse · Married 1985 (divorced 2001)" or "(Primary)" label

### `/tree/:treeId/settings` → Membership Tab
- Already in tree settings page; add a "Members & Access" tab or section
- Lists all users with their role, join date
- Admin role selector per user (dropdown: Admin / Family Member)
- "Remove access" button per non-self user
- Self row shown with "You (Admin)" — no demote control
- "Invite family member" CTA at top → invite creation panel

### Invite Creation Panel (Slide-in)
- Slides in from right or opens as modal
- Email input + role selector (Admin / Family Member — defaults to Family Member)
- "Send invite" button → generates link, shows copy-able URL + sends email via Supabase (or just shows link)
- Never-expires notice shown ("This invite link never expires")
- List of existing pending invites below with revoke button

### Invite Acceptance (`/invite/:token`)
- If logged-in user email matches invite → auto-join, redirect to tree dashboard with toast "Welcome to [tree name]"
- If not logged in → redirect to magic link sign-in, then auto-join after sign-in
- If logged-in email doesn't match → show friendly error "This invite was sent to [email]. Sign in with that address to join."

## Key States

### Relationship Creation Modal
| State | User sees |
|-------|-----------|
| Default | Type cards, "Next" disabled |
| Type selected | Person A selector appears |
| Person A selected | Person B selector appears (with already-linked persons greyed out) |
| Adopting child | "Mark as adopted" toggle visible |
| Multiple spouses | "Mark as primary" checkbox for second+ spouses |
| Loading | "Create" button spinner |
| Error | Inline error message, form stays open |
| Success | Modal closes, toast "Relationship added" |

### Profile Panel — Spouse Section
| State | User sees |
|-------|-----------|
| No spouse | "No spouse listed" with "Add spouse" link |
| One spouse | Single avatar + name + "Spouse" label |
| Multiple spouses | Row of avatars + names, primary spouse has "(Primary)" badge |
| Spouse with dates | "Spouse · Married 1985" or "(Primary) · Married 1985 – Divorced 2001" |

### Invite Creation Panel
| State | User sees |
|-------|-----------|
| Default | Email input + role select + "Create invite" |
| Invalid email | Inline validation error below input |
| Loading | Button spinner |
| Success | Panel shows invite URL in a copy-able input + "Link copied!" confirmation |
| Pending invites | List below: email, role, created date, "Revoke" button |
| Self-demote attempt | Toast: "You cannot demote yourself. Transfer ownership first." |

### Membership Management
| State | User sees |
|-------|-----------|
| Default | List of members with role dropdowns |
| Own row | "You (Admin)" — no dropdown |
| Promoting user | Role dropdown → Admin, immediate save |
| Revoking access | Confirmation: "Remove [name] from this tree?" + Remove / Cancel |
| Revoke success | Row removed, toast "Access revoked" |
| Self-demote attempt | Toast error (no form change) |

## Interaction Model

- **Relationship modal open** → Step through type → person A → person B → optional settings → Create
- **Drag handle on member card** → visual affordance only in Phase 3 (no-op on drag)
- **Profile panel spouse click** → opens that person's profile
- **Invite link copy** → copies to clipboard, shows "Copied!" confirmation
- **Role dropdown change** → PATCH API immediately → success toast or error toast
- **Remove access** → confirmation dialog → DELETE → toast → row removed
- **Self-demote** → API returns error → toast appears, no UI change

## Content Requirements

### Relationship Creation
- Heading: "Add a relationship"
- Type cards: "Spouse" (heart icon), "Parent-Child" (tree icon), "Step-Sibling" (branch icon)
- Person A label: "First person"
- Person B label: "Second person"
- Marriage date: "Marriage date" (optional, date picker)
- "Mark as primary" checkbox: "Primary spouse" (shown only for spouse when a primary already exists)
- "Mark as adopted" checkbox: "This child is adopted" (shown only for parent-child)
- "Mark as ended" section (collapsible): "End this relationship" → divorce_date + ended_reason (divorce/death radio)
- Button: "Add relationship"
- Cancel: text link

### Profile Panel — Relationship Section Heading
- "Family" (existing) → rename to "Relationships" or keep "Family" with sub-sections: "Spouse(s)", "Parents", "Children", "Siblings"

### Invite Creation
- Heading: "Invite a family member"
- Email label: "Email address"
- Role label: "Role"
- Role options: "Family Member" (default), "Admin"
- Copy-link hint: "Share this link with them. It never expires."
- Success: "Invite link ready" with copy button
- List item: "[email] · [role] · Sent [date] · [Revoke button]"

### Membership Management
- Heading: "Members & Access"
- Own row: "[your email] · You (Admin)"
- Other rows: "[email] · [role dropdown] · [remove button]"
- Empty: "No other members yet"

### Toast Messages
- Relationship added: "Relationship added"
- Invite created: "Invite created"
- Link copied: "Link copied to clipboard"
- Access revoked: "Access revoked"
- Self-demote error: "You cannot demote yourself. Transfer ownership first."
- Role updated: "Role updated"

## Technical Notes

- Relationship CRUD: `GET/POST /api/trees/:treeId/relationships`, `PATCH/DELETE /api/trees/:treeId/relationships/:relId`
- Membership management: `GET/PATCH/DELETE /api/trees/:treeId/memberships/:membershipId`
- Invite: `GET/POST /api/trees/:treeId/invites`, `DELETE /api/trees/:treeId/invites/:inviteId`
- Invite acceptance: `POST /api/invites/:token/accept`
- Adopted child → on `POST /api/trees/:treeId/relationships` with `is_adopted: true` on child member, auto-create dual parent-child relationships
- Polygamy → `is_primary` defaults to `true` for first spouse, subsequent spouses `false` unless marked
- Self-demote prevention → server checks `auth.uid() === user_id` on role PATCH, returns 400 with specific error code
- Drag handle → `draggable="true"` attribute on member cards, Phase 4 wires up `dragstart`/`drop` events

## Open Questions

- None — all resolved via discovery.
