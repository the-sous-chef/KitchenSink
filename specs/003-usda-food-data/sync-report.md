# Sync Report: 003-usda-food-data

**Run**: #1 | **Date**: 2026-06-02 | **Phase**: pre-implement
**Layers Checked**: 1, 2, 3, 4, 6, 7 | **Layers Skipped**: 5 (feature is pre-implement)

---

## Summary

| Severity | Count | Description |
|----------|-------|-------------|
| CRITICAL | 0 | |
| WARNING  | 3 | Mechanism divergence, phantom task ranges, undefined FR |
| INFO     | 1 | Pre-impl state — zero implementation code |
| CLEAN    | 3 | Layers 1, 6 (downgraded), 7 |

**Verdict**: `WARNING` — 3 forward-drift items detected. All are resolvable artifact edits; no blockers for implementation.

---

## Per-Layer Results

### Layer 1 — research/ ↔ product-spec/
**Status**: `CLEAN`
- Research conclusions (USDA-only, no third-party APIs, event-driven queue architecture) align with product-spec vision and core principles.
- No incorrect `apps/web/` or `apps/mobile/` paths found in feature specs (research/codebase-analysis.md correctly uses `packages/apps/commise/{web,mobile}`).

### Layer 2 — product-spec/ ↔ spec.md
**Status**: `WARNING`
- US-005 mechanism in product-spec.md describes a **Redis sorted set** keyed by `fdcId` with score = duplicate-request count (`ZINCRBY`).
- spec.md US-5 describes static **High/Low SQS priority queues** (FR-014–FR-018) with no mention of the demand-weighted Redis sorted set.
- This is a forward drift: product-spec introduces a mechanism not reflected in the technical spec.

### Layer 3 — spec.md ↔ plan.md
**Status**: `WARNING`
- plan.md Open Questions references **FR-036** ("Required for P3 (FR-036), deferred or in-scope for initial release?").
- spec.md defines FR-001 through FR-035 only; FR-036 is undefined.

### Layer 4 — plan.md ↔ tasks.md
**Status**: `WARNING`
- tasks.md Dependency Graph declares task ranges **T-044–T-048** (Monitoring) and **T-049–T-052** (WebSocket).
- Actual task headings in tasks.md are T-001 through T-043 only; T-044–T-052 do not exist.
- Summary table says "Total tasks: 43" (consistent with T-001–T-043) but still lists the phantom ranges.

### Layer 5 — tasks.md ↔ Code
**Status**: `SKIPPED` — feature is pre-implement (zero completed tasks).

### Layer 6 — spec.md ↔ Code
**Status**: `INFO` (downgraded from CRITICAL per pre-impl directive)
- No implementation code exists for any FR or task. Expected pre-impl state.

### Layer 7 — Cross-link integrity
**Status**: `CLEAN`
- All markdown cross-links verified:
  - `../001-commise-recipe-app/spec.md` → exists
  - `../002-user-auth/spec.md` → exists
  - `../006-meal-planning/spec.md` → exists
  - `../007-grocery-lists/spec.md` → exists
  - `../009-nutrition-planning/spec.md` → exists
  - `../../docs/architecture/usda/05-event-driven-queue-based.md` → exists
- No broken internal or external links detected.

---

## Drift Details

| ID | Layer | Severity | Source | Target | Evidence |
|----|-------|----------|--------|--------|----------|
| D-001 | L2 | WARNING | product-spec.md US-005 | spec.md US-5 | product-spec: "consumer maintains a Redis sorted set keyed by fdcId with score = duplicate-request count (ZINCRBY)"; spec.md: "FR-014: EventBridge MUST route FoodRequested events to the High Priority SQS queue and FoodBatchRequested/IngestionScheduled events to the Low Priority SQS queue" |
| D-002 | L3 | WARNING | plan.md §9 Open Questions | spec.md FR definitions | plan.md line 294: "WebSocket notifications: Required for P3 (FR-036), deferred or in-scope for initial release?" — FR-036 is absent from spec.md (FR-001–FR-035 defined) |
| D-003 | L4 | WARNING | tasks.md Dependency Graph | tasks.md headings | Graph shows "MONITORING (T-044–T-048)" and "WEBSOCKET (T-049–T-052)"; grep of `^### T-` confirms only 43 headings (T-001–T-043), so T-044–T-052 are phantom |
| D-004 | L6 | INFO | spec.md | Codebase | No `usda`, `foods`, or `fdcId` implementation found in `packages/` or `src/` — expected pre-impl state |

---

## Sync History

| Run | Date | Verdict | Critical | Warning | Info | Clean |
|-----|------|---------|----------|---------|------|-------|
| #1  | 2026-06-02 | WARNING | 0 | 3 | 1 | 3 |

---

## Recommendations

1. **D-001**: Add the Redis sorted set demand-weighted priority mechanism to spec.md US-5 (or remove from product-spec if static queues are the intended design).
2. **D-002**: Define FR-036 in spec.md (auth scope for WebSocket) or remove the reference from plan.md Open Questions.
3. **D-003**: Reconcile tasks.md dependency graph: either add tasks T-044–T-052 or update the graph to match actual T-001–T-043 range.
