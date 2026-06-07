# Feature 008 — Cooking Mode — Tasks

**Feature**: `008-cooking-mode`  
**Status**: Draft  
**Source**: [spec.md](spec.md) | [plan.md](plan.md) | [product-spec](product-spec/product-spec.md)

---

## US Reference

| ID     | Story                                                                                          | Priority    | FRs                  |
| ------ | ---------------------------------------------------------------------------------------------- | ----------- | -------------------- |
| US-001 | Enter Cooking Mode and see one step at a time in large readable text                           | P2 Must Have | FR-032               |
| US-002 | Navigate forward/backward through steps without losing position                                | P2 Must Have | FR-033               |
| US-003 | Start timers directly from timed steps                                                         | P2 Must Have | FR-034               |
| US-004 | Receive clear alert when a timer completes                                                     | P2 Must Have | FR-034               |
| US-005 | Keep device screen awake while Cooking Mode is active                                          | P2 Must Have | FR-035               |
| US-006 | Use voice commands for next/back/timer                                                         | Should Have | FR-033, FR-034       |
| US-007 | Recover an in-progress session after short interruption                                          | Should Have | FR-033, FR-035       |
| US-008 | Check off ingredients in a side panel while cooking                                            | Could Have  | FR-032               |
| US-009 | Apply cook-time scaling guidance in mode                                                       | Could Have  | FR-034               |

---

## Dependency Graph

```
T-001 ─┬─→ T-002 ─┬─→ T-006 ─┬─→ T-011
       │          │          ├─→ T-012
       │          ├─→ T-008  │
       │          ├─→ T-013  │
       │          └─→ T-014  │
       │
       └─→ T-003 ─┬─→ T-009 ─┬─→ T-016
                  ├─→ T-010  │
                  └─→ T-017  │

T-004, T-005 (independent wake-lock platforms)
T-007 depends on T-001
```

---

## US-001 — Enter Cooking Mode and see one step at a time in large readable text

- [ ] **T-001** [P1] [US-001] Define CookingMode domain types (`CookingSession`, `CookingTimer`, `RecipeInstruction`) — `packages/shared/src/cooking/types.ts`
  - **Depends on**: none
  - **Implements**: plan.md §2 data model, FR-032
  - **Acceptance**: Types compile under `strict: true`; all exported interfaces carry JSDoc (NFR-001, NFR-002); fields match spec.md plan.md §2 exactly.

- [ ] **T-002** [P1] [US-001] Implement cooking session state machine and step navigation engine — `packages/shared/src/cooking/session.ts`
  - **Depends on**: T-001
  - **Implements**: FR-032, FR-033
  - **Acceptance**: `advance()` / `goBack()` update `currentStepIndex`; boundary clamps at first/last step; `completedSteps` tracked; 100% unit-test coverage.

- [ ] **T-007** [P2] [US-001] Build `StepDisplay` component (large instruction text, optional image, step counter) — `packages/ui/src/cooking/StepDisplay.tsx`
  - **Depends on**: T-001
  - **Implements**: plan.md §4, FR-032, SC-007
  - **Acceptance**: Instruction text ≥32sp; image lazy-loaded; step position visible; `getByRole` queryable accessible name (NFR-003); color paired with icon/text for states (NFR-004).

- [ ] **T-006** [P2] [US-001] Build `CookingModeScreen` orchestrator composing StepDisplay, Navigation, and Timers — `packages/ui/src/cooking/CookingModeScreen.tsx`
  - **Depends on**: T-002, T-007, T-008, T-009
  - **Implements**: plan.md §4 component architecture, FR-032
  - **Acceptance**: Screen mounts at first step; sub-components render correctly; exit releases wake lock and clears session.

- [ ] **T-011** [P3] [US-001] Add Cooking Mode web route/entry point wired to recipe selection — `packages/apps/commise/web/src/routes/cooking.tsx`
  - **Depends on**: T-006, T-004
  - **Implements**: plan.md §1 Web target
  - **Acceptance**: Route `/cooking/:recipeId` loads CookingModeScreen; recipe instructions fetched from 001 API; auth gate enforced.

- [ ] **T-012** [P3] [US-001] Add Cooking Mode mobile screen entry wired to recipe selection — `packages/apps/commise/mobile/src/screens/CookingModeScreen.tsx`
  - **Depends on**: T-006, T-005
  - **Implements**: plan.md §1 Mobile target
  - **Acceptance**: Screen pushed from recipe detail; passes recipeId; auth gate enforced; Expo-compatible.

---

## US-002 — Navigate forward/backward through steps without losing position

- [ ] **T-008** [P2] [US-002] Build `StepNavigation` component (tap zones, swipe handler, progress dots) — `packages/ui/src/cooking/StepNavigation.tsx`
  - **Depends on**: T-002
  - **Implements**: FR-033, plan.md §4 Navigation UX
  - **Acceptance**: Tap zones ≥40% width each (48×48dp touch target); swipe gesture supported; progress dots reflect current step; first/last step boundaries disabled safely; `getByRole` labels for prev/next (NFR-003).

---

## US-003 — Start timers directly from timed steps

- [ ] **T-003** [P1] [US-003] Implement countdown timer engine with concurrent timer support — `packages/shared/src/cooking/timer-engine.ts`
  - **Depends on**: T-001
  - **Implements**: FR-034, plan.md §4 Timer Component
  - **Acceptance**: Multiple timers run concurrently; pause/resume per timer; remainingMs decrements accurately; no `any` types (NFR-001); unit tests cover concurrent + pause scenarios.

- [ ] **T-009** [P2] [US-003] Build `TimerBadge` and `ActiveTimers` panel components — `packages/ui/src/cooking/TimerBadge.tsx`
  - **Depends on**: T-003
  - **Implements**: FR-034
  - **Acceptance**: Timed steps show start action; countdown visible while active; concurrent timers listed; accessible labels (NFR-003); non-color state cues (NFR-004).

---

## US-004 — Receive clear alert when a timer completes

- [ ] **T-010** [P2] [US-004] Build `TimerAlert` component (audible chime, pulsing visual banner, ARIA live region) — `packages/ui/src/cooking/TimerAlert.tsx`
  - **Depends on**: T-003
  - **Implements**: FR-034, plan.md §4 TimerAlert
  - **Acceptance**: Timer completion triggers sound + visual pulse; ARIA live region announces to screen readers; accessible dismiss action (NFR-003, NFR-004).

---

## US-005 — Keep device screen awake while Cooking Mode is active

- [ ] **T-004** [P2] [US-005] Implement web screen wake lock (`navigator.wakeLock`) with visibilitychange re-acquire — `packages/shared/src/cooking/wake-lock.ts`
  - **Depends on**: none
  - **Implements**: FR-035, plan.md §5 Screen Wake Lock (Web)
  - **Acceptance**: Requested on cooking mode entry; released on exit; re-acquired when tab returns to visible; graceful noop on unsupported browsers.

- [ ] **T-005** [P2] [US-005] Implement Expo screen wake lock (`expo-keep-awake`) — `packages/shared/src/cooking/wake-lock-native.ts`
  - **Depends on**: none
  - **Implements**: FR-035, plan.md §5 Screen Wake Lock (RN/Expo)
  - **Acceptance**: `KeepAwake.activate()` on entry; `deactivate()` on exit; tested on iOS + Android.

---

## US-007 — Recover an in-progress session after short interruption

- [ ] **T-013** [P3] [US-007] Implement session persistence and 24h resume logic (IndexedDB / AsyncStorage) — `packages/shared/src/cooking/session-persistence.ts`
  - **Depends on**: T-002
  - **Implements**: plan.md §8 Session Resume, FR-033, FR-035
  - **Acceptance**: Session saved on pause/exit; resume prompt shown if <24h; restores step index and active timers; start-fresh option clears cache.

---

## US-006 — Use voice commands for next/back/timer

- [ ] **T-014** [P3] [US-006] Implement Web Speech API voice command controller (`next`, `back`, `timer`, `pause`) — `packages/shared/src/cooking/voice-control.ts`
  - **Depends on**: T-002
  - **Implements**: plan.md §5 Voice Control, FR-033, FR-034
  - **Acceptance**: Toggle on/off; commands mapped to session actions; error/retry feedback surfaced; English MVP.

---

## US-008 — Check off ingredients in a side panel while cooking

- [ ] **T-015** [P4] [US-008] Build `IngredientChecklist` slide-out panel component — `packages/ui/src/cooking/IngredientChecklist.tsx`
  - **Depends on**: none
  - **Implements**: FR-032
  - **Acceptance**: Panel toggles without obscuring active step; check state clear and accessible (NFR-003, NFR-004); ingredient data from 001 recipe entity.

---

## US-009 — Apply cook-time scaling guidance in mode

- [ ] **T-016** [P4] [US-009] Build `CookingScaleSelector` component with timer recalculation — `packages/ui/src/cooking/CookingScaleSelector.tsx`
  - **Depends on**: T-009
  - **Implements**: FR-034
  - **Acceptance**: Scaling factor selectable; timer suggestions update with explicit user confirmation; does not auto-mutate running timers.

---

## Cross-Cutting

- [ ] **T-017** [P2] [US-001, US-002, US-003, US-004] Add unit tests for cooking session, timer engine, and wake lock — `packages/shared/src/cooking/__tests__/`
  - **Depends on**: T-002, T-003, T-004, T-005
  - **Implements**: NFR-001, plan.md testability
  - **Acceptance**: Tests cover session state transitions, concurrent timer lifecycle, wake lock request/release, pause/resume, boundary conditions; run with `npm test`.

---

## Constraints Checklist

- [x] All tasks are `- [ ]`  
- [x] All paths under `packages/`  
- [x] No phantom T-NNN referenced without definition  
- [x] Every task traces to a US and to spec.md FRs  
- [x] Dependency graph contains only tasks written above  
- [x] Acceptance criteria reference spec.md acceptance scenarios and NFRs
