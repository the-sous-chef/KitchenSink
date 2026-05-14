# UX Patterns: Cooking Mode

**Branch**: `008-cooking-mode` | **Date**: 2026-05-09
**Status**: Complete | **Source**: [spec.md](../spec.md), [plan.md](../plan.md), [research.md](../research.md)

---

## 1. Step-Centric Reading Pattern

Cooking Mode should present exactly one active step at a time with:

- Large instruction typography (32sp target for instruction body).
- Persistent position label (`Step N of M`).
- Optional step media that never displaces core instruction text.

**Why**: Kitchen cognition is fragmented; reducing simultaneous information improves completion and lowers error rate.

**Traceability**: FR-032, SC-007, REQ-001, REQ-NF-003.

---

## 2. Dual-Path Navigation Pattern (Tap + Swipe)

Navigation controls should combine:

1. **Large tap zones/buttons** (prev/next, minimum 56×56dp).
2. **Swipe gestures** (left/right) as ergonomic shortcut.
3. **Explicit disabled states** at first/last step.

Include step dots or linear progress for orientation, but never rely on color-only active state.

**Traceability**: FR-033, NFR-004, REQ-002, REQ-003, REQ-010, REQ-NF-005.

---

## 3. Integrated Timer Pattern (Inline + Active Panel)

Timers should exist in two layers:

- **Inline trigger** in current step context.
- **Global active timers panel** for concurrent countdown management.

Required states:

- Running
- Paused
- Completed/alerted

Completion feedback should include audible cue + visible banner and an accessible live announcement.

**Traceability**: FR-034, Acceptance Scenario 3, REQ-004..REQ-006.

---

## 4. Screen-Awake Affordance Pattern

Cooking Mode should actively keep the screen on while engaged and recover lock after lifecycle interruptions (web visibility changes, app focus changes).

UX affordances:

- Subtle status indicator (“Screen stays awake while cooking mode is active”).
- Graceful fallback messaging when wake lock API is unsupported.

**Traceability**: FR-035, REQ-007.

---

## 5. Voice Command Entry Pattern (Phase 2)

Voice should be additive, not mandatory:

- Dedicated microphone control with clear listening state.
- Short command grammar for v1.5/v2 (`next`, `back`, `start timer`, `pause timer`).
- Error recovery message when command confidence is low.

**Traceability note**: Voice is present in scenario narrative and research/tasks but not an explicit FR; keep as Should Have until promoted.

---

## 6. Ingredient Checkoff Panel Pattern (Candidate)

A collapsible side/bottom panel can support ingredient checkoff during cooking:

- Checkboxes with large hit targets.
- “Checked” state communicated by icon + label (not color-only).
- Step-linked ingredient highlighting (future enhancement).

**Traceability note**: Candidate scope only; no canonical FR currently defines this behavior.

---

## 7. Cook-Time Scaling Pattern (Candidate)

Potential flow:

1. User chooses serving multiplier (0.5×, 1×, 1.5×, 2×).
2. Ingredient quantities scale deterministically.
3. Timer defaults optionally scale with confirmation (never silently alter active timers).

**Traceability note**: Requested domain scope but not represented by FR-032..FR-035.

---

## 8. Accessibility Baseline Pattern

Required baseline from spec/research:

- Queryable accessible names for all controls.
- Live-region announcements for timer completion.
- 56×56dp touch targets for core controls.
- High-contrast text/state indicators with icon+label pairings.
- Support dynamic type/font scaling without clipping critical controls.

**Traceability**: NFR-003, NFR-004, REQ-NF-004, REQ-NF-005.

---

## 9. Offline Continuity Pattern

Once a recipe is loaded and user enters cooking mode:

- Navigation, timers, and wake-lock behavior run locally.
- Connectivity loss shows non-blocking status only.
- If no cached recipe exists at entry while offline, present explicit fallback message.

**Traceability**: Edge case + assumption in spec, REQ-011, plan offline strategy.
