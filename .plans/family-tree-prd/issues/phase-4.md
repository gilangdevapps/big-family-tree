# Phase 4 Issues Report

## Critical Issues

### 1. Spouse Links Rendered Twice
**File:** `src/pages/tree/[treeId]/index.astro` (lines 1759–1905)

**Problem:** Spouse links are drawn twice. First at lines 1759–1774 where the tree layout's link data includes ALL relationships (including spouses) via `treeData.links()`. The class `tree-link-spouse` is conditionally applied here. Then at lines 1886–1905, the spouse link code iterates through ALL spouse relationships again and draws a SECOND set of spouse lines. The second set overwrites the first visually (same coordinates), but the doubled SVG elements are wasteful and the code is confusing.

**Severity:** Medium — Visual correctness is not broken (lines overlay perfectly), but doubled DOM elements and confusing logic.

**Fix:** Either (a) exclude spouse links from the tree layout links and only draw them in the spouse group, or (b) remove the duplicate spouse group drawing at lines 1886–1905 since spouse links are already included in treeData.links().

```ts
// Option A: Filter out spouse links from tree layout
const treeLinkData = linkData.filter(d => {
  const rel = RELS.relationships.find(r =>
    (r.person_a_id === (d.source as GraphNode).id && r.person_b_id === (d.target as GraphNode).id) ||
    (r.person_a_id === (d.target as GraphNode).id && r.person_b_id === (d.source as GraphNode).id)
  );
  return rel?.relationship_type !== 'spouse';
});
```

And draw spouse links ONLY in the spouse group (1886–1905), with curved paths.

---

### 2. Tree is NOT True Radial — `d3.tree()` is Not a Radial Layout
**File:** `src/pages/tree/[treeId]/index.astro` (lines 1720–1730)

**Problem:** The implementation report calls this a "Radial tree layout using `d3.tree()`" but `d3.tree()` produces a standard hierarchical tree layout (top-down or left-right depending on size parameters), not a radial layout. The circular appearance is achieved by centering all nodes at the same point (lines 1739–1742) and letting the force simulation spread them radially — but this is a force layout effect, not a true radial tree layout algorithm.

A true radial family tree would use `d3.cluster()` or a custom radial layout where each generation forms a concentric ring (grandparents on inner ring, parents on next, children on outer ring).

**Severity:** Low — The visual result may look radial, but the algorithm is not generating true concentric-generation rings. Line 1721 `const treeLayout = d3.tree<GraphNode>().nodeSize([NODE_R * 2.5, NODE_R * 3])` controls node spacing, not radial arrangement.

**Fix:** For true radial layout, replace `d3.tree()` with a custom radial positioning that places each depth level on a concentric circle:

```ts
// After treeLayout computes x/y positions
nodeData.forEach(d => {
  const angle = (d.depth / maxDepth) * 2 * Math.PI; // angle by depth
  const radius = d.depth * ringSpacing;
  d.x = cx + radius * Math.cos(angle);
  d.y = cy + radius * Math.sin(angle);
});
```

Or consider `d3.cluster()` which places leaf nodes at the same depth on a horizontal line — combining with radial positioning can create true radial trees.

---

### 3. Collapse Button Doesn't Show Descendant Count When Expanded
**File:** `src/pages/tree/[treeId]/index.astro` (line 1878)

**Problem:** When a node is expanded (not collapsed), the collapse button shows only "−" with no count of hidden descendants. After clicking `−`, the node collapses and shows `+N` where N is the total descendant count. This is fine for UX — but the `_childCount` shown when collapsed represents ALL descendants, not how many will be shown vs hidden by this single collapse action.

Additionally, if the tree structure changes after initial build (e.g., new relationships added via API), `_childCount` won't update because it's only computed in `attach()` during initial `buildTree()` call.

**Severity:** Low — The count is informational but correct at initial render time. Not dynamic.

---

### 4. Deep Link Timeout Race Condition
**File:** `src/pages/tree/[treeId]/index.astro` (lines 2046–2057)

**Problem:** The deep link handler fires a `setTimeout(..., 800)` to allow the tree to settle before centering and opening the panel. If a user clicks a deep link and then immediately clicks a different person or navigates away before the 800ms expires, the old deep link handler may still fire and overwrite the panel/selection with the wrong person.

**Severity:** Low — Requires rapid navigation within 800ms window.

**Fix:** Cancel or track the timeout:

```ts
let deepLinkTimeout: ReturnType<typeof setTimeout> | null = null;
// ...
if (hash.startsWith('#person-')) {
  const personId = hash.replace('#person-', '');
  if (deepLinkTimeout) clearTimeout(deepLinkTimeout);
  deepLinkTimeout = setTimeout(() => {
    selectedNodeId = personId;
    // ...
  }, 800);
}
```

---

### 5. `renderFlatLayout()` Doesn't Share State with `renderTree()`
**File:** `src/pages/tree/[treeId]/index.astro` (lines 2160–2288)

**Problem:** `renderFlatLayout()` is a completely separate rendering function for the case when no hierarchy root exists (no `root_person_id` set, no `is_root` member). It uses `d3.drag()` for nodes (lines 2224–2233) but shares no state with `renderTree()`. Notably:
- `selectedNodeId` is local to `renderTree()` (line 1703), but `updateTreeSelection()` is only called within `renderTree()`.
- `centerOnNode()` doesn't exist in `renderFlatLayout()`.
- Deep linking is handled inside `renderTree()` (lines 2046–2057) but NOT in `renderFlatLayout()`.

If a tree has no hierarchy (all members orphaned), deep links via `#person-{id}` won't work.

**Severity:** Medium — Deep links break for flat-layout trees. Selection state is local to renderTree.

**Fix:** Move `selectedNodeId` and `currentZoom` to module scope, handle deep links in both paths, share `centerOnNode` logic.

---

### 6. No Spouse Link Curvature
**File:** `src/pages/tree/[treeId]/index.astro` (lines 1896–1901)

**Problem:** Spouse links are drawn as straight lines: `spouseGroup.append('line').attr('x1', src.x)...`. The report says "curved dashed lines" but the code uses `line` elements, not `path` elements. No quadratic bezier or arc calculation is applied.

**Severity:** Low — Straight dashed lines are functional but not "curved" as documented.

**Fix:** Use a quadratic bezier for spouse links:

```ts
const mx = (src.x + tgt.x) / 2;
const my = (src.y + tgt.y) / 2 - 30; // offset upward
spouseGroup.append('path')
  .attr('class', 'tree-link tree-link-spouse')
  .attr('d', `M ${src.x} ${src.y} Q ${mx} ${my} ${tgt.x} ${tgt.y}`);
```

---

### 7. Double `zoom` Event Handler Registration
**File:** `src/pages/tree/[treeId]/index.astro` (lines 1685–1701)

**Problem:** Both a `d3.drag()` (lines 1685–1696) and a `d3.zoom()` (lines 1672–1680) are registered on the same SVG element. The drag handler does `svg.call(zoom.transform, newTransform)` which can conflict with the zoom handler. The comment at line 1698 says "zoom handles pan" acknowledging this. The drag is essentially non-functional (it just calls zoom.transform which is already handled by zoom's built-in drag behavior).

**Severity:** Low — Dead code. The drag handler does the same thing as zoom's built-in panning.

**Fix:** Remove the drag handler since zoom already handles panning:

```ts
// Remove lines 1685–1701 entirely. Zoom at line 1672 already handles pan.
svg.style('cursor', 'grab');
```

---

### 8. `openPanel()` Called Twice on Deep Link
**File:** `src/pages/tree/[treeId]/index.astro` (lines 2046–2057 + 1925–1934)

**Problem:** When deep linking, the setTimeout calls `openPanel(personId)` at line 2055. But `openPanel` is ALSO called at line 1929 inside the node click handler. For deep link on page load, this is the only path. However, if the user navigates to `#person-X` after page load, the code at line 2050 does not fire (it's only on first render). Only the breadcrumb click handler (line 2134) and node click (line 1929) would call `openPanel` for post-load deep link navigation.

**Severity:** Low — Only affects deep link on initial page load. Post-load deep link via URL change won't trigger `openPanel` unless user clicks a breadcrumb or node.

---

### 9. `buildHierarchy` Logic Error — `rootId` Can Be UUID String
**File:** `src/pages/tree/[treeId]/index.astro` (lines 1614–1625)

**Problem:** At line 1614, `buildHierarchy(rootId: string | null)` accepts `string | null`. At line 1618, `if (!rootId)` checks if rootId is falsy to fall back to finding a root member. At line 1622, `return rootNode ? buildTree(rootId) : null` — if `rootNode` exists but `rootId` was null, this passes `null` to `buildTree()` which would fail.

However, this is mitigated because if `TREE.rootId` is null (no root set), the code falls back to `nodes[0]` at line 1620 and calls `buildTree(nodes[0].id)` — passing a valid UUID. So the logic works but is confusing.

**Severity:** Low — Code is confusing but functional.

---

## Summary

| # | Severity | Issue |
|---|----------|-------|
| 1 | Medium | Spouse links rendered twice (tree links + duplicate spouse group) |
| 2 | Low | Not true radial — `d3.tree()` is not a radial layout algorithm |
| 3 | Low | Collapse button count not dynamic after tree changes |
| 4 | Low | Deep link 800ms timeout race condition |
| 5 | Medium | `renderFlatLayout()` has no deep link support and isolated state |
| 6 | Low | Spouse links use straight lines, not curves |
| 7 | Low | Dead code drag handler conflicting with zoom |
| 8 | Low | Deep link `openPanel` only fires on initial load |
| 9 | Low | Confusing `buildHierarchy` fallback logic |
