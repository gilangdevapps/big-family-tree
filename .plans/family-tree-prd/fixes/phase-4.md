# Phase 4 Fixes Report

## Summary

Fixed **5 issues** from the Phase 4 issues report. Remaining issues are either design decisions (not bugs) or low-severity informational items.

## Fixed Issues

### Issue 7: Double `zoom` Event Handler Registration (Low)
**File:** `src/pages/tree/[treeId]/index.astro`

**Problem:** Both `d3.drag()` and `d3.zoom()` were registered on the same SVG element. The drag handler essentially duplicated zoom's built-in panning.

**Fix:** Removed the redundant drag handler (lines 1685-1701). Zoom already handles panning via its built-in drag behavior.

**Commit:** Remove redundant drag handler, zoom handles pan alone

---

### Issue 1: Spouse Links Rendered Twice (Medium)
**File:** `src/pages/tree/[treeId]/index.astro`

**Problem:** Spouse links were drawn twice:
1. In `linkGroup` via `linkData` (tree layout links) with class `tree-link-spouse`
2. In `spouseGroup` as a second pass

**Fix:** Filter out spouse links from `linkData` before drawing in `linkGroup`. Spouse links are now ONLY drawn in `spouseGroup` with curved paths.

```ts
// Filter out spouse links - they are drawn with curves in spouse group
const treeOnlyLinks = linkData.filter(d => {
  const rel = RELS.relationships.find(r => ...);
  return rel?.relationship_type !== 'spouse';
});
```

**Commit:** Filter spouse links from tree layout, draw only in spouse group

---

### Issue 6: No Spouse Link Curvature (Low)
**File:** `src/pages/tree/[treeId]/index.astro`

**Problem:** Spouse links used straight `line` elements instead of curved paths.

**Fix:** Changed from `line` to `path` elements with quadratic bezier curves:

```ts
const mx = ((src.x || 0) + (tgt.x || 0)) / 2;
const my = ((src.y || 0) + (tgt.y || 0)) / 2 - 40; // Curve upward
spouseGroup.append('path')
  .attr('class', 'tree-link tree-link-spouse')
  .attr('d', `M ${src.x} ${src.y} Q ${mx} ${my} ${tgt.x} ${tgt.y}`);
```

Also updated the simulation tick handler to update path `d` attributes instead of line coordinates.

**Commit:** Add curved spouse links using quadratic bezier

---

### Issue 4: Deep Link Timeout Race Condition (Low)
**File:** `src/pages/tree/[treeId]/index.astro`

**Problem:** Deep link handler used `setTimeout(..., 800)` without tracking/canceling previous timeouts. Rapid navigation could cause stale handlers to execute.

**Fix:** Added timeout tracking variable and cancel before setting new timeout:

```ts
let deepLinkTimeout: ReturnType<typeof setTimeout> | null = null;

// In deep link handler:
if (deepLinkTimeout) clearTimeout(deepLinkTimeout);
deepLinkTimeout = setTimeout(() => { ... }, 800);
```

**Commit:** Cancel deep link timeout on subsequent navigations

---

### Issue 5: `renderFlatLayout()` Doesn't Share State with `renderTree()` (Medium)
**File:** `src/pages/tree/[treeId]/index.astro`

**Problem:**
- `selectedNodeId` was local to `renderTree()`
- Deep links didn't work in flat layout
- No `centerOnNode` equivalent in flat layout

**Fix:**
1. `selectedNodeId` was already at module scope - ensured it's accessible
2. Added `updateFlatSelection()` function to update selection visuals
3. Added `centerOnFlatNode()` function to center on a node
4. Added deep link handler in `renderFlatLayout()` with timeout tracking
5. Node click now updates `selectedNodeId` and calls all relevant update functions

```ts
nodeEls.on('click', (event, d) => {
  event.stopPropagation();
  selectedNodeId = d.id;
  updateFlatSelection();
  openPanel(d.id);
  centerOnFlatNode(d.id);
  history.replaceState(null, '', `#person-${d.id}`);
});
```

**Commit:** Add selection state and deep link support to renderFlatLayout

---

## Not Fixed (Design Decisions or Informational)

| Issue | Severity | Reason |
|-------|----------|--------|
| 2: Tree is NOT true radial | Low | Design decision - current d3.tree() + force approach is intentional |
| 3: Collapse button count | Low | UX design decision - "-" means collapse, "+N" means expand showing N |
| 8: openPanel called twice | Low | Not actually a bug - separate code paths, no double-firing |
| 9: buildHierarchy logic | Low | Code is confusing but functional due to fallback logic |

## Verification

All fixes maintain backward compatibility:
- Tree layout still renders correctly with spouse links as curved dashed lines
- Selection state works in both tree and flat layouts
- Deep links work in both layouts with proper timeout handling
- Zoom/pan behavior unchanged (just removed dead code)
