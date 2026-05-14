# Hazard Analysis (FMEA): Cooking Mode

**Feature Branch**: `008-cooking-mode`
**Created**: 2026-05-10
**Status**: Draft
**Source**: `specs/008-cooking-mode/v-model/system-design.md`
**Standard**: General-Purpose FMEA (non-regulated software; `domain: ''` in `v-model-config.yml`)

## Overview

This document presents the Failure Mode and Effects Analysis (FMEA) for the **Cooking Mode** feature. Every system component (`SYS-001`..`SYS-008`) from `system-design.md` is assessed for realistic failure modes in active kitchen operation (hands occupied, intermittent connectivity, noisy environment, background interruptions).

Each hazard uses a unique `HAZ-NNN` identifier and links to risk controls via valid `REQ-*`, `SYS-*`, and `ARCH-*` identifiers from this feature. Full hazard-to-test lineage is captured in Matrix H of `traceability-matrix.md`.

**Non-regulated context.** Sous Chef is a consumer recipe application. Severity is measured in terms of user trust, workflow continuity, data integrity, accessibility, and device resource impact (battery/performance), not personal injury. Safety-critical taxonomies are intentionally not applied.

## ID Schema

- **Hazard ID**: `HAZ-{NNN}` — 3-digit, zero-padded, sequential.
- **Lineage**: Mitigation references use existing IDs from this feature only (`REQ-*`, `SYS-*`, `ARCH-*`).

## Risk Matrix Definition

### Severity Scale (consumer cooking workflow)

| Level      | Definition                                                                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Critical   | Persistent session loss, timer correctness failure causing major workflow breakdown, or unrecoverable integrity issue impacting cooking completion. |
| Serious    | Recoverable but high-friction interruption (missed alerts, wrong step transitions, prolonged interruption, repeated retries).                       |
| Minor      | Annoyance with workaround; user can continue with moderate friction.                                                                                |
| Negligible | Cosmetic/logging/telemetry issue with no meaningful workflow impact.                                                                                |

### Likelihood Scale

| Level      | Definition                                            |
| ---------- | ----------------------------------------------------- |
| Probable   | Expected to occur regularly in real use.              |
| Occasional | Expected to occur sometimes under normal variability. |
| Remote     | Uncommon but realistic edge condition.                |
| Improbable | Rare; requires unusual preconditions.                 |

### Risk Level Matrix

| Severity \ Likelihood | Probable    | Occasional  | Remote     | Improbable |
| --------------------- | ----------- | ----------- | ---------- | ---------- |
| Critical              | Undesirable | Undesirable | Tolerable  | Tolerable  |
| Serious               | Undesirable | Tolerable   | Tolerable  | Acceptable |
| Minor                 | Tolerable   | Tolerable   | Acceptable | Acceptable |
| Negligible            | Acceptable  | Acceptable  | Acceptable | Acceptable |

## Operational States

| State       | Meaning                                                               |
| ----------- | --------------------------------------------------------------------- |
| NORMAL      | Active Cooking Mode session in foreground.                            |
| BACKGROUND  | App backgrounded (home button, app switch, lock event).               |
| INTERRUPTED | External interruption (call, notification overlay, audio focus loss). |
| OFFLINE     | Network unavailable after recipe load.                                |
| LOW-BATTERY | OS enters aggressive power management behavior.                       |

## Hazard Register (FMEA)

### SYS-001 — Step Display

| HAZ ID  | Component | Failure Mode                                                                              | Operational State | Effect                                                               | Severity | Likelihood | Risk Level | Mitigation                                                                                                                                              | Residual Risk |
| ------- | --------- | ----------------------------------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------- | -------- | ---------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| HAZ-001 | SYS-001   | Screen rotation resets displayed step to an incorrect index.                              | NORMAL            | User resumes on wrong instruction and loses continuity.              | Serious  | Occasional | Tolerable  | REQ-001, REQ-008, REQ-009; SYS-001 index ownership; ARCH-001 + ARCH-002 preserve step index across re-render.                                           | Tolerable     |
| HAZ-002 | SYS-001   | App crash mid-step drops transient session state and user re-enters at ambiguous point.   | NORMAL            | Step progress context lost; user must reconstruct position manually. | Serious  | Remote     | Tolerable  | ARCH-013 error boundary fallback; SYS-005 cached recipe continuity; REQ-001, REQ-011.                                                                   | Tolerable     |
| HAZ-003 | SYS-001   | Ingredient checkbox/progress marks (if used during session) are lost on refresh/re-entry. | BACKGROUND        | User confidence drops; repeated manual checking of ingredient prep.  | Minor    | Occasional | Tolerable  | REQ-CN-001 (read-only model boundary), ARCH-002 deterministic rendering from source step data, ARCH-013 recovery UI clarifies transient state behavior. | Acceptable    |

### SYS-002 — Step Navigation

| HAZ ID  | Component | Failure Mode                                                                                       | Operational State | Effect                                                      | Severity | Likelihood | Risk Level | Mitigation                                                                                                                                | Residual Risk |
| ------- | --------- | -------------------------------------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------- | -------- | ---------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| HAZ-004 | SYS-002   | Accidental swipe skips one or more steps unexpectedly.                                             | NORMAL            | User may miss critical prep/cook instruction.               | Serious  | Occasional | Tolerable  | REQ-002, REQ-003, REQ-010; ARCH-004 boundary clamping + explicit step indicator in ARCH-002.                                              | Tolerable     |
| HAZ-005 | SYS-002   | Voice command misrecognition advances or rewinds to wrong step when hands-free control is enabled. | INTERRUPTED       | Unexpected navigation causes confusion and loss of pacing.  | Serious  | Remote     | Tolerable  | REQ-010 primary gesture/tap path remains authoritative; ARCH-005 requires explicit intent mapping and confirmation before state mutation. | Tolerable     |
| HAZ-006 | SYS-002   | Hands-free swipe gesture false-positive caused by incidental touch/wet screen noise.               | NORMAL            | Unintended step transition while user is focused elsewhere. | Serious  | Occasional | Tolerable  | ARCH-005 gesture threshold/debounce; ARCH-004 idempotent `goNext/goPrev` with boundary checks; REQ-010.                                   | Tolerable     |

### SYS-003 — Timer Engine

| HAZ ID  | Component | Failure Mode                                                                       | Operational State | Effect                                                                | Severity | Likelihood | Risk Level  | Mitigation                                                                                                                   | Residual Risk |
| ------- | --------- | ---------------------------------------------------------------------------------- | ----------------- | --------------------------------------------------------------------- | -------- | ---------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------- |
| HAZ-007 | SYS-003   | Timer drift or loss after app background/resume cycle.                             | BACKGROUND        | Remaining time becomes inaccurate; cooking timing quality degrades.   | Critical | Occasional | Undesirable | REQ-004, REQ-005; ARCH-006 state machine computes remaining time from durable timestamps, not tick count.                    | Tolerable     |
| HAZ-008 | SYS-003   | Multi-timer collision (overlapping timed steps) causes wrong alert-source mapping. | NORMAL            | Alert fires without clear step association; user follows wrong timer. | Serious  | Remote     | Tolerable   | ARCH-006 associates timer instance with step ID; ARCH-007 displays active timer identity + label per REQ-NF-005.             | Tolerable     |
| HAZ-009 | SYS-003   | Audio focus stolen by phone call/media session and completion alert is inaudible.  | INTERRUPTED       | User misses done signal; over/under-cook risk in workflow terms.      | Serious  | Occasional | Tolerable   | REQ-006 audible alert plus ARCH-007 visible countdown completion state; ARCH-008 fallback visual cue when audio unavailable. | Tolerable     |

### SYS-004 — Screen Wake Lock

| HAZ ID  | Component | Failure Mode                                                                    | Operational State | Effect                                                           | Severity | Likelihood | Risk Level | Mitigation                                                                                                                                        | Residual Risk |
| ------- | --------- | ------------------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------------- | -------- | ---------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| HAZ-010 | SYS-004   | Screen sleep occurs during active cooking due to wake lock acquisition failure. | LOW-BATTERY       | Hands-free flow breaks; user must unlock device repeatedly.      | Serious  | Occasional | Tolerable  | REQ-007, REQ-CN-002; ARCH-009 platform-specific acquisition with warning path surfaced in UI.                                                     | Tolerable     |
| HAZ-011 | SYS-004   | Wake lock leak after exiting Cooking Mode causes unnecessary battery drain.     | NORMAL            | Battery depletion and user trust degradation post-session.       | Serious  | Remote     | Tolerable  | REQ-CN-002 enforced release on exit; ARCH-001 lifecycle hooks + ARCH-009 release guard on unmount.                                                | Tolerable     |
| HAZ-012 | SYS-004   | Keep-screen-on policy over-consumes battery during long sessions.               | LOW-BATTERY       | Session termination by OS battery policies; degraded continuity. | Minor    | Probable   | Tolerable  | REQ-007 scoped to active mode only; ARCH-009 deactivates immediately on exit/background where platform requires; user-visible low-power guidance. | Acceptable    |

### SYS-005 — Offline Recipe Cache

| HAZ ID  | Component | Failure Mode                                                   | Operational State | Effect                                       | Severity | Likelihood | Risk Level | Mitigation                                                                                     | Residual Risk |
| ------- | --------- | -------------------------------------------------------------- | ----------------- | -------------------------------------------- | -------- | ---------- | ---------- | ---------------------------------------------------------------------------------------------- | ------------- |
| HAZ-013 | SYS-005   | Offline cache not populated at entry, then connectivity drops. | OFFLINE           | Steps/timers become unavailable mid-session. | Serious  | Occasional | Tolerable  | REQ-011; SYS-005 preloads recipe payload at start; ARCH-010 write-then-confirm cache path.     | Tolerable     |
| HAZ-014 | SYS-005   | Cache corruption serves mismatched step/timer data.            | OFFLINE           | User follows stale or invalid instructions.  | Serious  | Remote     | Tolerable  | ARCH-010 cache invalidation/version checks; ARCH-011 schema validation before render; REQ-011. | Tolerable     |

### SYS-006 — Recipe Data Adapter

| HAZ ID  | Component | Failure Mode                                                                           | Operational State | Effect                                                | Severity | Likelihood | Risk Level | Mitigation                                                                              | Residual Risk |
| ------- | --------- | -------------------------------------------------------------------------------------- | ----------------- | ----------------------------------------------------- | -------- | ---------- | ---------- | --------------------------------------------------------------------------------------- | ------------- |
| HAZ-015 | SYS-006   | Step-duration parsing error maps timer value incorrectly (e.g., 5m interpreted as 5s). | NORMAL            | Incorrect timing guidance propagates to timer engine. | Critical | Remote     | Tolerable  | REQ-IF-001; ARCH-011 schema + transform validation; SYS-003 sanity bounds before start. | Tolerable     |
| HAZ-016 | SYS-006   | Adapter mutates source recipe object while normalizing steps.                          | NORMAL            | Cross-feature recipe data integrity is compromised.   | Critical | Improbable | Tolerable  | REQ-CN-001 read-only constraint; ARCH-011 immutable mapping strategy; SYS-006 contract. | Acceptable    |

### SYS-007 — Auth Guard

| HAZ ID  | Component | Failure Mode                                                                      | Operational State | Effect                                                 | Severity | Likelihood | Risk Level | Mitigation                                                                  | Residual Risk |
| ------- | --------- | --------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------ | -------- | ---------- | ---------- | --------------------------------------------------------------------------- | ------------- |
| HAZ-017 | SYS-007   | Session expiry is not enforced and Cooking Mode opens without valid auth context. | NORMAL            | Unauthorized access path to recipe content.            | Serious  | Remote     | Tolerable  | REQ-IF-002; ARCH-012 mandatory session check before entry.                  | Tolerable     |
| HAZ-018 | SYS-007   | False-negative auth check blocks legitimate user entry.                           | NORMAL            | Denial of service for valid user during cooking start. | Minor    | Occasional | Tolerable  | ARCH-012 retry/re-auth redirect behavior; SYS-007 explicit error messaging. | Acceptable    |

### SYS-008 — Quality & Accessibility

| HAZ ID  | Component | Failure Mode                                                                                   | Operational State | Effect                                                   | Severity | Likelihood | Risk Level | Mitigation                                                      | Residual Risk |
| ------- | --------- | ---------------------------------------------------------------------------------------------- | ----------------- | -------------------------------------------------------- | -------- | ---------- | ---------- | --------------------------------------------------------------- | ------------- |
| HAZ-019 | SYS-008   | Accessible names missing on controls, reducing reliable interaction when attention is divided. | NORMAL            | Controls become harder to identify and operate reliably. | Serious  | Remote     | Tolerable  | REQ-NF-004; ARCH-014 lint and runtime checks across components. | Tolerable     |
| HAZ-020 | SYS-008   | Color-only timer/step state communication reduces clarity under kitchen lighting conditions.   | NORMAL            | User misreads timer or navigation state.                 | Serious  | Occasional | Tolerable  | REQ-NF-005; ARCH-007 icon+text state and ARCH-014 enforcement.  | Tolerable     |

## Progressive Deepening (Architecture-Level)

Additional cross-module hazards visible at architecture boundaries:

| HAZ ID  | Component           | Failure Mode                                                                                            | Operational State | Effect                                                      | Severity | Likelihood | Risk Level | Mitigation                                                                                                                    | Residual Risk |
| ------- | ------------------- | ------------------------------------------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------- | -------- | ---------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------- |
| HAZ-021 | ARCH-008 + ARCH-007 | TTS/voice output failure produces silence for completion guidance.                                      | INTERRUPTED       | User receives no audible guidance despite timer completion. | Serious  | Occasional | Tolerable  | REQ-006 + REQ-NF-005: visual completion cue is always present in `TimerDisplayWidget`; `AudioAlertService` fallback path.     | Tolerable     |
| HAZ-022 | ARCH-006 + ARCH-001 | Notification interruption races timer completion update; UI misses done state until manual interaction. | INTERRUPTED       | Delayed awareness of completion.                            | Serious  | Remote     | Tolerable  | ARCH-006 event emission idempotency + ARCH-001 lifecycle resume reconciliation.                                               | Tolerable     |
| HAZ-023 | ARCH-004 + ARCH-003 | Transition animation and navigation update race causing apparent double-advance.                        | NORMAL            | User perceives skipped step.                                | Serious  | Remote     | Tolerable  | REQ-009 smooth transition contract, ARCH-004 single source of truth for index, ARCH-003 animation lock during commit.         | Tolerable     |
| HAZ-024 | ARCH-009 + ARCH-001 | Wake lock acquire/release path diverges across platforms during rapid enter/exit loops.                 | LOW-BATTERY       | Either premature sleep or leaked wake lock across sessions. | Serious  | Remote     | Tolerable  | REQ-007 + REQ-CN-002; ARCH-009 platform abstraction with symmetric acquire/release guards and structured logging in ARCH-013. | Tolerable     |

## Coverage Summary

| Metric                        | Value |
| ----------------------------- | ----- |
| Total SYS Components          | 8     |
| SYS Components with ≥1 Hazard | 8     |
| Total Hazards                 | 24    |
| SYS-Level Hazards             | 20    |
| ARCH-Level Hazards            | 4     |

All `SYS-001`..`SYS-008` components are represented in the register.

## Domain Note (non-regulated)

This hazard analysis is intentionally framed for consumer software risk management and release quality gates. No regulated-domain hazard taxonomy or certification mapping is applied.
