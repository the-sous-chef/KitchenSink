# Tasks: Feature 008 — Cooking Mode

**Feature**: `008-cooking-mode`
**Generated**: 2026-05-09
**Source Artifacts**: plan.md, spec.md, research.md
**Total Tasks**: 32

---

## Dependency Graph

```
[T-001] Shared types + interfaces
    └── [T-002] CookingSession persistence service
    └── [T-003] Timer service (core logic)
    └── [T-004] Wake lock utility (web)
    └── [T-005] Wake lock utility (React Native / Expo)
    └── [T-006] Recipe instructions API integration

[T-006] Recipe instructions API integration
    └── [T-007] Offline cache strategy (cache-on-entry)

[T-001] + [T-006] → [T-008] CookingModeScreen scaffold (web)
[T-001] + [T-006] → [T-009] CookingModeScreen scaffold (mobile)

[T-008] → [T-010] StepDisplay component (web)
[T-009] → [T-011] StepDisplay component (mobile)

[T-010] → [T-012] StepNavigation — tap zones + step dots (web)
[T-011] → [T-013] StepNavigation — tap zones + step dots (mobile)

[T-012] → [T-014] Swipe gesture navigation (web)
[T-013] → [T-015] Swipe gesture navigation (mobile)

[T-003] + [T-010] → [T-016] TimerBadge inline component (web)
[T-003] + [T-011] → [T-017] TimerBadge inline component (mobile)

[T-003] → [T-018] ActiveTimers panel + TimerCard (web)
[T-003] → [T-019] ActiveTimers panel + TimerCard (mobile)

[T-018] → [T-020] Timer alerts — audio + visual + vibration (web)
[T-019] → [T-021] Timer alerts — audio + visual + vibration (mobile)

[T-004] + [T-008] → [T-022] Wake lock integration (web)
[T-005] + [T-009] → [T-023] Wake lock integration (mobile)

[T-002] + [T-008] → [T-024] Session resume prompt (web)
[T-002] + [T-009] → [T-025] Session resume prompt (mobile)

[T-007] + [T-008] → [T-026] Offline handling — no-cache message (web)
[T-007] + [T-009] → [T-027] Offline handling — no-cache message (mobile)

[T-010..T-027] → [T-028] Accessibility audit — ARIA live regions, contrast, touch targets
[T-010..T-027] → [T-029] Keyboard navigation (web)

[T-028] → [T-030] Voice control — Web Speech API (web, Phase 2)
[T-028] → [T-031] Voice control — React Native (mobile, Phase 2)

[T-030] + [T-031] → [T-032] End-to-end Playwright / Detox tests
```

---

## User Story 1 — Cooking Mode (P2)

> A user selects a recipe and enters Cooking Mode: step-by-step, hands-free-friendly interface with large text, navigation, integrated timers, and screen wake lock.

---

### Phase 1 — Shared Core (packages/shared/src/cooking/)

#### T-001 · Define shared TypeScript types and interfaces

**Priority**: P2 | **Effort**: S | **Depends on**: none

Create `packages/shared/src/cooking/types.ts` with all shared interfaces from plan.md §2 and §4:

- `CookingSession`, `CookingTimer`, `TimerState`, `TimerAlert`
- `RecipeInstruction` (extend from 001 if already defined, otherwise declare locally)
- `CookingSessionEvent` (WebSocket, Phase 2 stub)
- Export all from `packages/shared/src/cooking/index.ts`

**Acceptance**: TypeScript compiles with `strict: true`; all types exported; JSDoc on every interface and field.

---

#### T-002 · CookingSession persistence service

**Priority**: P2 | **Effort**: M | **Depends on**: T-001

Create `packages/shared/src/cooking/session-store.ts`:

- `saveSession(session: CookingSession): Promise<void>` — writes to AsyncStorage (RN) / IndexedDB (web) via platform adapter
- `loadSession(recipeId: string): Promise<CookingSession | null>`
- `clearSession(recipeId: string): Promise<void>`
- 24-hour expiry check: if `pausedAt < now - 86_400_000`, return `null`
- Platform adapter interface so web and RN share the same service

**Acceptance**: Unit tests cover save/load/clear/expiry; compiles strict; JSDoc on all exports.

---

#### T-003 · Timer service — core countdown logic

**Priority**: P2 | **Effort**: M | **Depends on**: T-001

Create `packages/shared/src/cooking/timer-service.ts`:

- `createTimer(label, durationMs, stepNumber): CookingTimer`
- `startTimer(id)`, `pauseTimer(id)`, `resumeTimer(id)`, `cancelTimer(id)`
- `tickTimers(timers, nowMs): CookingTimer[]` — pure function for countdown tick
- `isTimerComplete(timer): boolean`
- Support multiple concurrent timers
- Persist timer state via session store (T-002)

**Acceptance**: Unit tests cover start/pause/resume/cancel/complete/concurrent; pure tick function is deterministic; strict TypeScript.

---

#### T-004 · Screen wake lock utility — Web

**Priority**: P2 | **Effort**: S | **Depends on**: T-001

Create `packages/shared/src/cooking/wake-lock.ts` (web implementation from plan.md §5):

- `requestWakeLock(): Promise<void>` — uses `navigator.wakeLock.request('screen')`
- `releaseWakeLock(): Promise<void>`
- Re-acquire on `visibilitychange` event
- Graceful no-op if `wakeLock` not in `navigator` (unsupported browser)

**Acceptance**: Works in Chrome/Edge; no-op in unsupported browsers; JSDoc; strict TypeScript.

---

#### T-005 · Screen wake lock utility — React Native / Expo

**Priority**: P2 | **Effort**: S | **Depends on**: T-001

Create `packages/shared/src/cooking/wake-lock-rn.ts` (RN implementation from plan.md §5):

- `activateWakeLock(): void` — calls `KeepAwake.activate()` from `expo-keep-awake`
- `deactivateWakeLock(): void` — calls `KeepAwake.deactivate()`
- Add `expo-keep-awake` to mobile package dependencies if not already present

**Acceptance**: Compiles; `expo-keep-awake` in package.json; JSDoc; strict TypeScript.

---

#### T-006 · Recipe instructions API integration

**Priority**: P2 | **Effort**: S | **Depends on**: T-001

Create `packages/shared/src/cooking/recipe-api.ts`:

- `fetchRecipeInstructions(recipeId: string, authToken: string): Promise<RecipeInstruction[]>`
- Calls `GET /v1/recipes/{id}/instructions` (from plan.md §3)
- Returns typed `RecipeInstruction[]`
- Throws typed error on non-2xx

**Acceptance**: Unit test with mocked fetch; strict TypeScript; JSDoc.

---

#### T-007 · Offline cache strategy — cache-on-entry

**Priority**: P2 | **Effort**: S | **Depends on**: T-006

Create `packages/shared/src/cooking/offline-cache.ts`:

- `cacheRecipeForOffline(recipeId, instructions): Promise<void>` — stores instructions + images in AsyncStorage/IndexedDB on cooking mode entry
- `getCachedRecipe(recipeId): Promise<RecipeInstruction[] | null>`
- `isOffline(): boolean` — checks `navigator.onLine` (web) / NetInfo (RN)

**Acceptance**: Unit tests cover cache/retrieve/offline-check; strict TypeScript; JSDoc.

---

### Phase 2 — Web UI (apps/web/src/features/cooking-mode/)

#### T-008 · CookingModeScreen scaffold — web

**Priority**: P2 | **Effort**: S | **Depends on**: T-001, T-006

Create `apps/web/src/features/cooking-mode/CookingModeScreen.tsx`:

- Accepts `recipeId` prop
- Fetches instructions via T-006 on mount; shows loading state
- Calls offline cache (T-007) on successful fetch
- Renders `<StepDisplay>`, `<StepNavigation>`, `<ActiveTimers>` placeholders
- Manages `currentStepIndex` state

**Acceptance**: Renders without errors; loading state visible; strict TypeScript; accessible landmark (`<main>`).

---

#### T-009 · CookingModeScreen scaffold — mobile

**Priority**: P2 | **Effort**: S | **Depends on**: T-001, T-006

Create `apps/mobile/src/features/cooking-mode/CookingModeScreen.tsx` (React Native):

- Same responsibilities as T-008 but using RN primitives (`View`, `Text`, `ActivityIndicator`)
- Uses `useNavigation` for back navigation
- Manages `currentStepIndex` state

**Acceptance**: Renders on iOS + Android simulators; loading state; strict TypeScript.

---

#### T-010 · StepDisplay component — web

**Priority**: P2 | **Effort**: M | **Depends on**: T-008

Create `apps/web/src/features/cooking-mode/StepDisplay.tsx`:

- Props: `step: RecipeInstruction`, `stepNumber: number`, `totalSteps: number`
- Renders step text at minimum 32px font (plan.md §6)
- Renders optional `<StepImage>` if `step.imageUrl` present
- Renders `<TimerBadge>` if `step.durationMinutes` present (wired in T-016)
- Shows "Step N of M" counter
- WCAG AAA contrast (7:1) per plan.md §6

**Acceptance**: Readable at 3 feet on standard mobile (SC-007); font ≥ 32px; image optional; accessible `role="region"` with label; strict TypeScript.

---

#### T-011 · StepDisplay component — mobile

**Priority**: P2 | **Effort**: M | **Depends on**: T-009

Create `apps/mobile/src/features/cooking-mode/StepDisplay.tsx` (React Native):

- Same responsibilities as T-010 using RN `Text`, `Image`
- Font size ≥ 32sp
- `accessibilityRole="text"` with descriptive label

**Acceptance**: Renders on iOS + Android; font ≥ 32sp; accessible; strict TypeScript.

---

#### T-012 · StepNavigation — tap zones + step dots — web

**Priority**: P2 | **Effort**: M | **Depends on**: T-010

Create `apps/web/src/features/cooking-mode/StepNavigation.tsx`:

- Left tap zone (40% width): navigate to previous step; disabled on step 0
- Right tap zone (40% width): navigate to next step; disabled on last step
- `<StepDots>` sub-component: filled dot for current step, outline for others
- Touch targets ≥ 48×48dp (plan.md §6)
- Props: `currentIndex`, `totalSteps`, `onPrev`, `onNext`

**Acceptance**: Tap zones functional; dots update on navigation; disabled states correct; touch targets ≥ 48px; accessible button labels; strict TypeScript.

---

#### T-013 · StepNavigation — tap zones + step dots — mobile

**Priority**: P2 | **Effort**: M | **Depends on**: T-011

Create `apps/mobile/src/features/cooking-mode/StepNavigation.tsx` (React Native):

- Same as T-012 using `TouchableOpacity` / `Pressable`
- Touch targets ≥ 48dp
- `accessibilityLabel` on each zone

**Acceptance**: Functional on iOS + Android; touch targets ≥ 48dp; accessible; strict TypeScript.

---

#### T-014 · Swipe gesture navigation — web

**Priority**: P2 | **Effort**: S | **Depends on**: T-012

Add swipe gesture support to `CookingModeScreen` (web):

- Swipe left → next step
- Swipe right → previous step
- Use pointer events or a lightweight gesture library (no heavy deps)
- Passive event listeners (plan.md best practices)

**Acceptance**: Swipe navigation works on touch-enabled browsers; passive listeners; does not conflict with tap zones; strict TypeScript.

---

#### T-015 · Swipe gesture navigation — mobile

**Priority**: P2 | **Effort**: S | **Depends on**: T-013

Add swipe gesture support to `CookingModeScreen` (mobile):

- Use `react-native-gesture-handler` (already in Expo) `Swipeable` or `PanGestureHandler`
- Swipe left → next, swipe right → previous

**Acceptance**: Swipe navigation works on iOS + Android; does not conflict with tap zones; strict TypeScript.

---

#### T-016 · TimerBadge inline component — web

**Priority**: P2 | **Effort**: S | **Depends on**: T-003, T-010

Create `apps/web/src/features/cooking-mode/TimerBadge.tsx`:

- Displays countdown for the current step's timer (if `step.durationMinutes` present)
- "Start Timer" button → calls timer service (T-003)
- Shows live countdown once started
- Props: `stepNumber`, `durationMinutes`, `timers: CookingTimer[]`, `onStart`

**Acceptance**: Timer starts on button press; countdown visible; strict TypeScript; accessible label.

---

#### T-017 · TimerBadge inline component — mobile

**Priority**: P2 | **Effort**: S | **Depends on**: T-003, T-011

Create `apps/mobile/src/features/cooking-mode/TimerBadge.tsx` (React Native):

- Same as T-016 using RN primitives

**Acceptance**: Functional on iOS + Android; accessible; strict TypeScript.

---

#### T-018 · ActiveTimers panel + TimerCard — web

**Priority**: P2 | **Effort**: M | **Depends on**: T-003

Create `apps/web/src/features/cooking-mode/ActiveTimers.tsx` + `TimerCard.tsx`:

- `ActiveTimers`: renders list of all running `CookingTimer[]`
- `TimerCard`: shows label, step number, live countdown, pause/resume button
- Timers persist across step navigation
- Multiple concurrent timers supported

**Acceptance**: Multiple timers visible simultaneously; pause/resume works; countdown accurate; strict TypeScript; accessible.

---

#### T-019 · ActiveTimers panel + TimerCard — mobile

**Priority**: P2 | **Effort**: M | **Depends on**: T-003

Create `apps/mobile/src/features/cooking-mode/ActiveTimers.tsx` + `TimerCard.tsx` (React Native):

- Same as T-018 using RN primitives

**Acceptance**: Functional on iOS + Android; multiple concurrent timers; accessible; strict TypeScript.

---

#### T-020 · Timer alerts — audio + visual + vibration — web

**Priority**: P2 | **Effort**: M | **Depends on**: T-018

Implement `TimerAlert` on timer completion (web):

- Visual: pulsing banner at top of screen (plan.md §4)
- Audio: chime sound via Web Audio API or `<audio>` element
- ARIA live region announcement for screen readers
- Dismiss on user interaction

**Acceptance**: Alert fires on timer completion; visual + audio; ARIA live region; dismissible; strict TypeScript.

---

#### T-021 · Timer alerts — audio + visual + vibration — mobile

**Priority**: P2 | **Effort**: M | **Depends on**: T-019

Implement `TimerAlert` on timer completion (mobile):

- Visual: pulsing banner
- Vibration: `Vibration.vibrate()` from React Native
- Audio: `expo-av` or system sound
- Accessible announcement

**Acceptance**: Alert fires on iOS + Android; vibration + visual; accessible; strict TypeScript.

---

#### T-022 · Wake lock integration — web

**Priority**: P2 | **Effort**: S | **Depends on**: T-004, T-008

Wire wake lock into `CookingModeScreen` (web):

- Call `requestWakeLock()` on mount
- Call `releaseWakeLock()` on unmount
- Re-acquire on `visibilitychange` (already in T-004)

**Acceptance**: Screen stays on during cooking mode; released on exit; no-op in unsupported browsers; strict TypeScript.

---

#### T-023 · Wake lock integration — mobile

**Priority**: P2 | **Effort**: S | **Depends on**: T-005, T-009

Wire wake lock into `CookingModeScreen` (mobile):

- Call `activateWakeLock()` on mount
- Call `deactivateWakeLock()` on unmount (cleanup in `useEffect`)

**Acceptance**: Screen stays on during cooking mode on iOS + Android; released on exit; strict TypeScript.

---

#### T-024 · Session resume prompt — web

**Priority**: P2 | **Effort**: M | **Depends on**: T-002, T-008

Add session resume flow to `CookingModeScreen` (web):

- On mount, call `loadSession(recipeId)` (T-002)
- If session exists and within 24h: show modal "Resume where you left off? (Step N)"
- Confirm → restore `currentStepIndex` + active timers
- Decline → `clearSession()` + start fresh

**Acceptance**: Resume prompt appears for valid sessions; dismissed sessions start fresh; expired sessions ignored; strict TypeScript.

---

#### T-025 · Session resume prompt — mobile

**Priority**: P2 | **Effort**: M | **Depends on**: T-002, T-009

Same as T-024 for React Native using `Alert.alert()` or a custom modal.

**Acceptance**: Functional on iOS + Android; same logic as T-024; strict TypeScript.

---

#### T-026 · Offline handling — no-cache message — web

**Priority**: P2 | **Effort**: S | **Depends on**: T-007, T-008

In `CookingModeScreen` (web):

- On mount, if `isOffline()` and no cached recipe → show "You're offline and this recipe isn't cached" message with back button
- If offline but cached → proceed with cached data silently

**Acceptance**: Offline + no-cache shows message; offline + cached proceeds; strict TypeScript.

---

#### T-027 · Offline handling — no-cache message — mobile

**Priority**: P2 | **Effort**: S | **Depends on**: T-007, T-009

Same as T-026 for React Native.

**Acceptance**: Functional on iOS + Android; same logic as T-026; strict TypeScript.

---

### Phase 3 — Accessibility, Keyboard & Voice (Phase 2)

#### T-028 · Accessibility audit — ARIA live regions, contrast, touch targets

**Priority**: P2 | **Effort**: M | **Depends on**: T-010–T-027

Audit all cooking mode components against plan.md §6 and spec.md NFR-001–NFR-004:

- ARIA live regions on timer alerts (NFR-003)
- Contrast ratio ≥ 7:1 WCAG AAA on all text
- Touch targets ≥ 48×48dp
- Color not sole conveyor of state (NFR-004) — add icon/text labels alongside color indicators
- Screen reader walkthrough on iOS VoiceOver + Android TalkBack

**Acceptance**: All NFRs pass; no color-only state; live regions fire on timer complete; touch targets verified.

---

#### T-029 · Keyboard navigation — web

**Priority**: P2 | **Effort**: S | **Depends on**: T-012, T-016, T-018

Add keyboard support to web cooking mode:

- `ArrowRight` / `ArrowLeft` → next/previous step
- `Space` → start/pause current step timer
- `Escape` → exit cooking mode
- Focus management: focus moves to step display on navigation

**Acceptance**: All keyboard shortcuts functional; focus visible; no focus traps; strict TypeScript.

---

#### T-030 · Voice control — Web Speech API (web, Phase 2)

**Priority**: P3 | **Effort**: M | **Depends on**: T-028

Implement voice control in `packages/shared/src/cooking/voice-control.ts` (web):

- Commands: "next", "back" / "previous", "timer", "pause" (plan.md §5)
- `startVoiceControl(onCommand)` / `stopVoiceControl()`
- Graceful no-op if `SpeechRecognition` not available
- English only for MVP (plan.md §9 open question)

**Acceptance**: Voice commands navigate steps and control timers; no-op in unsupported browsers; strict TypeScript.

---

#### T-031 · Voice control — React Native (mobile, Phase 2)

**Priority**: P3 | **Effort**: M | **Depends on**: T-028

Implement voice control for mobile using `@react-native-voice/voice` or `expo-speech`:

- Same commands as T-030
- Permission request in context (not on app launch)

**Acceptance**: Voice commands functional on iOS + Android; permission requested contextually; strict TypeScript.

---

### Phase 4 — Tests

#### T-032 · End-to-end tests — Playwright (web) + Detox (mobile)

**Priority**: P2 | **Effort**: L | **Depends on**: T-030, T-031 (or T-028 if Phase 2 skipped)

Write E2E tests covering spec.md acceptance scenarios:

1. Enter cooking mode → first step displayed in large text
2. Advance through all steps → smooth transitions
3. Start timer on timed step → countdown visible → alert on completion
4. Navigate backward → previous step shown without losing place
5. Screen stays on during session (wake lock active)
6. Offline + no cache → error message shown
7. Session resume → prompt appears → confirm restores step

**Acceptance**: All 7 scenarios pass in CI; accessible queries (`getByRole`, `getByLabel`) per NFR-003; strict TypeScript.

---

## Summary Table

| Task  | Description                                   | Priority | Effort | Depends On          |
| ----- | --------------------------------------------- | -------- | ------ | ------------------- |
| T-001 | Shared TypeScript types + interfaces          | P2       | S      | —                   |
| T-002 | CookingSession persistence service            | P2       | M      | T-001               |
| T-003 | Timer service — core countdown logic          | P2       | M      | T-001               |
| T-004 | Wake lock utility — web                       | P2       | S      | T-001               |
| T-005 | Wake lock utility — React Native / Expo       | P2       | S      | T-001               |
| T-006 | Recipe instructions API integration           | P2       | S      | T-001               |
| T-007 | Offline cache strategy                        | P2       | S      | T-006               |
| T-008 | CookingModeScreen scaffold — web              | P2       | S      | T-001, T-006        |
| T-009 | CookingModeScreen scaffold — mobile           | P2       | S      | T-001, T-006        |
| T-010 | StepDisplay component — web                   | P2       | M      | T-008               |
| T-011 | StepDisplay component — mobile                | P2       | M      | T-009               |
| T-012 | StepNavigation — tap zones + dots — web       | P2       | M      | T-010               |
| T-013 | StepNavigation — tap zones + dots — mobile    | P2       | M      | T-011               |
| T-014 | Swipe gesture navigation — web                | P2       | S      | T-012               |
| T-015 | Swipe gesture navigation — mobile             | P2       | S      | T-013               |
| T-016 | TimerBadge inline component — web             | P2       | S      | T-003, T-010        |
| T-017 | TimerBadge inline component — mobile          | P2       | S      | T-003, T-011        |
| T-018 | ActiveTimers panel + TimerCard — web          | P2       | M      | T-003               |
| T-019 | ActiveTimers panel + TimerCard — mobile       | P2       | M      | T-003               |
| T-020 | Timer alerts — audio + visual — web           | P2       | M      | T-018               |
| T-021 | Timer alerts — audio + vibration — mobile     | P2       | M      | T-019               |
| T-022 | Wake lock integration — web                   | P2       | S      | T-004, T-008        |
| T-023 | Wake lock integration — mobile                | P2       | S      | T-005, T-009        |
| T-024 | Session resume prompt — web                   | P2       | M      | T-002, T-008        |
| T-025 | Session resume prompt — mobile                | P2       | M      | T-002, T-009        |
| T-026 | Offline handling — no-cache message — web     | P2       | S      | T-007, T-008        |
| T-027 | Offline handling — no-cache message — mobile  | P2       | S      | T-007, T-009        |
| T-028 | Accessibility audit — ARIA, contrast, targets | P2       | M      | T-010–T-027         |
| T-029 | Keyboard navigation — web                     | P2       | S      | T-012, T-016, T-018 |
| T-030 | Voice control — Web Speech API (Phase 2)      | P3       | M      | T-028               |
| T-031 | Voice control — React Native (Phase 2)        | P3       | M      | T-028               |
| T-032 | End-to-end tests — Playwright + Detox         | P2       | L      | T-028+              |

**Effort key**: S = Small (< 4h) · M = Medium (4–8h) · L = Large (1–2 days)
