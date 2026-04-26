# Phase 2 Design Brief: Tree & Family Member Management

## Feature Summary

Phase 2 adds full CRUD for family trees and family members, plus guided onboarding for first-time tree creation. Users can create and manage multiple family trees, add members with rich profiles, and configure tree settings. The first-tree creation experience includes a guided walkthrough that helps users add the root ancestor.

## Primary User Action

**Create a tree → Add members → View member profiles.** The primary flow: dashboard → create tree (with optional guided first-member walkthrough) → tree view → add/edit members → click member to view profile panel.

## Design Direction

Phase 2 follows the established **Heritage & Connection** brand from Phase 1 — warm cream backgrounds, sage green primary, warm oak secondary, Newsreader serif headings, Plus Jakarta Sans UI. The feel is "family archive" not "corporate database."

- **Tree creation**: Warm, inviting dialog — no cold form. First tree gets a guided walkthrough.
- **Member forms**: Rich, progressive disclosure — essential fields first, advanced details behind expandable sections.
- **Profile panel**: Slide-out panel from right, medium detail (name, photo, dates, immediate family links, last edit info).
- **Tree settings**: Clean, focused page for rename and root person selection.

## Layout Strategy

### `/tree/new` (Create Tree)
- Full-page centered form (max 520px)
- Tree name input with live duplicate-name warning
- Two choices for first tree: "Start with guided walkthrough" (default) or "Start empty"
- Submit → if guided → redirect to walkthrough; if empty → redirect to tree view

### `/tree/:treeId` (Tree View)
- Full-canvas view with tree visualization placeholder
- Top bar: tree name, "Add member" button, settings gear
- Eventually: D3.js radial layout (Phase 4), currently: member list as fallback
- Click member → profile panel slides in from right

### `/tree/:treeId/settings` (Tree Settings)
- Narrow centered form (max 480px)
- Rename field with save on blur or button
- Root person selector (dropdown of all members)
- Delete tree (bottom, destructive, requires name confirmation)
- Back link to tree view

### `/tree/:treeId/members/new` & `/tree/:treeId/members/:memberId/edit` (Member Form)
- Full-page centered form (max 600px) with progressive disclosure
- Section 1 (always visible): First name, Last name, Gender, Birth date
- Section 2 (expandable): Death date, Birth place, Location, Occupation
- Section 3 (expandable): Bio (markdown textarea), Email, Phone
- Section 4 (admin only): Profile photo upload
- "Mark as root ancestor" toggle
- Last edited tracking shown on edit form
- Cancel → back to tree view; Save → optimistically update

### `/tree/:treeId/person/:memberId` (Member Profile Page)
- Full profile page with all member fields
- Header: name, photo, vital dates
- Bio rendered as markdown
- Immediate family section: relationships listed
- "Edit" button for admin
- Deep-linkable URL

### Profile Panel (slide-out, also from tree view click)
- Slides in from right, 400px wide on desktop, full-width on mobile
- Header: circular photo, name, vital dates
- Immediate family: spouse(s), parents, children — clickable
- Last edited info (who + when)
- "Edit" button for admin
- Close button (X) and click-outside to close

### Guided First-Member Walkthrough (`/tree/:treeId/walkthrough`)
- Multi-step inline flow within the page
- Step 1: "Who is the oldest person you know in your family?" — name fields
- Step 2: Birth date, gender
- Step 3: Optional details (birth place, a sentence or two about them)
- Step 4: Confirmation — "This will be the root of your tree"
- Progress indicator at top

## Key States

### Tree Creation
| State | User sees |
|-------|-----------|
| Default | Name input, two option cards, "Create tree" button |
| Duplicate warning | Inline amber note below input "You already have a tree with this name" |
| Loading | Button shows spinner, form disabled |
| Success | Redirect to walkthrough or empty tree |

### Tree Deletion
| State | User sees |
|-------|-----------|
| Default | "Delete tree" button (destructive style) |
| Confirmation | Modal asking to type tree name |
| Loading | Button spinner, input disabled |
| Success | Redirect to dashboard |

### Member Form
| State | User sees |
|-------|-----------|
| Default | Sections 1 expanded, 2-3 collapsed |
| Expanded sections | All fields visible |
| Loading | Save button spinner, form disabled |
| Error (validation) | Inline errors below fields, form re-enabled |
| Error (server) | Banner error at top, form re-enabled |
| Success | Redirect to tree view or profile |

### Profile Panel
| State | User sees |
|-------|-----------|
| Open | Slides in from right, focus trapped inside |
| Loading content | Skeleton for family links |
| No relationships | "No family links yet" with add link CTA |
| Closing | Slides out to right |

### Guided Walkthrough
| State | User sees |
|-------|-----------|
| Step 1 | Name fields, "Next" button |
| Step 2 | Date + gender selectors |
| Step 3 | Optional fields collapsed |
| Step 4 | Confirmation with "Add this person" / "Go back" |
| Success | Redirects to tree view with new member visible |

## Interaction Model

- **Tree card click** → navigate to `/tree/:treeId`
- **Add member button** → navigate to `/tree/:treeId/members/new`
- **Member card/node click** → opens profile panel (right slide-out)
- **Profile panel "Edit"** → navigate to edit form
- **Form submit** → optimistically show success state → redirect
- **Tree settings save** → inline confirmation, no full redirect
- **Walkthrough "Next"** → advance step, validate current step
- **Walkthrough "Back"** → previous step
- **Walkthrough "Add this person"** → POST to API → redirect to tree view
- **Delete tree** → modal confirmation with name typed → DELETE API → redirect to dashboard

## Content Requirements

### Tree creation
- Heading: "Create a new family tree"
- Name label: "Tree name"
- Name placeholder: "e.g. The Smith Family"
- Option A: "Start with guided walkthrough" + subtext "We'll help you add your first family member step by step"
- Option B: "Start with an empty tree" + subtext "Add members on your own time"
- Button: "Create tree"
- Duplicate warning: "You already have a tree named '{name}'"

### Tree settings
- Heading: "Tree settings"
- Name field: "Tree name" (pre-filled)
- Root person: "Root ancestor" (dropdown, optional)
- Delete section: "Danger zone" heading, "Delete tree" button
- Delete confirmation modal: "Type '{tree name}' to confirm" input + "Delete forever" button

### Member form
- Heading (new): "Add family member"
- Heading (edit): "Edit {firstName}"
- First name: label, required
- Last name: label, required
- Gender: label, required, select (Male / Female / Other / Prefer not to say)
- Birth date: label (optional), date input
- Death date: label (optional), date input, shown only when gender/age makes sense
- Birth place: label (optional)
- Location: label (optional, "Where do they live now?")
- Occupation: label (optional)
- Bio: label, textarea with markdown hint
- Email: label (optional)
- Phone: label (optional)
- Mark as root toggle: "This person is the root ancestor of this tree"
- Save button: "Save member"
- Cancel: text link

### Profile page / panel
- Name as heading
- Vital dates: "Born [date] in [place]" or "Born [date]"
- Location line if present
- Occupation line if present
- Bio section (rendered markdown)
- Contact section if email/phone
- Family links section: "Spouse", "Parents", "Children"
- Edit button (admin only)
- Last edited: "Last edited by [name] on [date]"

### Guided walkthrough
- Progress: "Step 1 of 4"
- Step 1 heading: "Start with the oldest person you know"
- Step 1 body: "This will be the root of your family tree — the person everything connects back to."
- Step 2 heading: "When were they born?"
- Step 3 heading: "Anything else you know?"
- Step 4 heading: "Add [Name] as the root of your tree?"
- Step 4 body: confirm details shown

## Technical Notes

- Tree CRUD API: `GET/POST /api/trees`, `DELETE /api/trees/:treeId`, `PATCH `/api/trees/:treeId`
- Member CRUD API: `GET/POST /api/trees/:treeId/members`, `PATCH/DELETE /api/trees/:treeId/members/:memberId`
- Root person set via `PATCH /api/trees/:treeId` (sets `root_person_id`)
- `last_edited_by` and `last_edited_at` tracked on member update
- Profile panel state managed in JS (no route change)
- Walkthrough is a single page with JS step state

## Open Questions

- None — all resolved in Phase 1 discovery and plan review.
