# Product Specification: Nutrition Planning

**Branch**: `009-nutrition-planning`
**Date**: 2026-05-09
**Status**: Draft
**Source**: [spec.md](../spec.md)

---

## Vision

Nutrition Planning helps users turn meal planning into measurable nutrition outcomes. It lets users define calorie and macro targets, link those targets to meal plans, and see whether planned or actual intake aligns with goals. For premium workflows, trainers can manage client plans and the system can suggest recipe swaps to improve adherence.

**Tagline**: “Plan meals. Hit targets. Improve consistency.”

**Core principles**:

- Targets must be explicit, understandable, and adjustable.
- Compliance insights must be actionable, not just descriptive.
- Trainer-client workflows require explicit consent and clear boundaries.
- Accessibility and semantic status cues are non-negotiable.

---

## Personas

### Primary: P4 Sam (Nutrition & Diet Planner)

**Archetype**: Nutrition & Diet Planner
**Core Motivation**: Macros, diet protocols, goal tracking

**Profile**: Sam tracks calories and macronutrients with precision, follows structured diet protocols (keto, high-protein, calorie deficit), and wants the app to surface gaps before they derail weekly progress. Compliance data needs to be visual and fast to scan.

**Goals and Pains**:

- Set and adjust daily calorie, protein, carb, and fat targets without hunting through settings.
- See planned-vs-target compliance at a glance, broken down by macro, not just total calories.
- Get recipe swap suggestions that actually fit the current protocol (e.g., no high-carb swaps on a keto day).
- Recalibrate targets when training load or body-composition goals shift, with a preview of the impact before committing.
- Avoid deficiency blind spots: wants alerts when repeated meal patterns leave a micronutrient consistently low.

---

### Secondary: P3 Riley (Family Meal Planner)

**Archetype**: Family Meal Planner
**Core Motivation**: Quick, kid-friendly, weekly rotation, household scale

**Profile**: Riley plans meals for a household with mixed ages and preferences. Nutrition targets aren't about personal macros; they're about making sure kids get enough protein and adults don't overdo sodium. Portioning across different eaters is the hard part.

**Goals and Pains**:

- Set separate nutrition targets per household member (kid vs. adult portions) without duplicating entire plans.
- Quickly spot which planned meals are nutritionally weak for younger eaters (low iron, low calcium).
- Link weekly meal-plan rotations to household-level compliance summaries, not just individual views.
- Swap a recipe for a kid-friendlier version without losing the nutritional intent of the original.
- Keep the interface simple enough to use during a busy weeknight, not just on Sunday planning sessions.

---

### Tertiary: P1 Casey (Beginner Cook)

**Archetype**: Beginner Cook
**Core Motivation**: Build confidence, guided cooking, accessible UX

**Profile**: Casey is just starting to pay attention to what they eat. Macros and micronutrients feel overwhelming. Casey needs plain-language summaries ("this meal is high in protein, low in carbs") rather than raw numbers, and gentle nudges rather than compliance warnings.

**Goals and Pains**:

- Understand whether a meal is "healthy" without needing to know what a macro split means.
- Get simple, jargon-free explanations when a plan is off target ("you're low on protein today, try adding eggs or chicken").
- Set a basic calorie goal and see progress in a format that doesn't require nutrition expertise to interpret.
- Receive recipe suggestions that are both nutritionally appropriate and easy to cook.
- Build confidence gradually: start with one target (calories), add macros later when ready.

---

## Internal Stakeholders

### Coach/Trainer

**Role**: Operational, not a primary user persona. Coaches and personal trainers interact with the nutrition planning feature in a supporting capacity for clients who have explicitly granted access.

**Responsibilities**:

- Read-only client view: review a client's linked meal plans and compliance trends without editing the client's personal data directly.
- Plan templates: create reusable nutrition plan templates (calorie targets, macro splits, dietary protocol tags) that can be assigned to consenting clients.
- Compliance tracking: monitor adherence trends across a client roster, flag clients who are consistently off target, and queue swap suggestions for client review.
- All access requires explicit client consent; the system enforces this gate before any trainer can view or act on client data.

---

## Epics

1. **Nutrition Targets and Compliance** (`FR-036`, `FR-037`)
2. **Trainer-Client Nutrition Collaboration** (`FR-038`)
3. **Guided Optimization via Recipe Swaps** (`FR-039`)
4. **Accessible, Explainable Progress UX** (`NFR-003`, `NFR-004`)

---

## Story Map (MoSCoW)

## Must Have

### US-001: Create Nutrition Plan

As a user, I can create a nutrition plan with daily calorie/protein/carbs/fat targets so that I have a concrete target baseline.

**Traceability**: `FR-036`

### US-002: Link Meal Plan and View Compliance

As a user, I can link a meal plan to a nutrition plan and view planned-vs-target compliance so that I can identify gaps and excesses.

**Traceability**: `FR-037`

### US-003: Trainer Creates Client Plan (Premium)

As a trainer, I can create a nutrition plan for a client so that coaching is individualized.

**Traceability**: `FR-038`

### US-004: Guided Recipe Swap Suggestions (Premium)

As a user, I receive recipe swap suggestions when my plan is off target so that I can improve adherence.

**Traceability**: `FR-039`

---

## Should Have

### US-005: Client Consent Gate for Trainer Access

As a client, I explicitly consent before a trainer can manage my nutrition plan.

**Traceability**: `REQ-008` (derived from spec assumptions)
**WARNING**: Consent gate is explicit in assumptions/REQ but not declared as separate FR ID.

### US-006: Weekly Trend View

As a user, I can review weekly adherence trends to understand consistency, not just single-day variance.

**Traceability**: Supports `FR-037` visualization intent.

### US-007: Goal Recalibration Workflow

As a user, I can adjust targets and preview impact so I can keep goals realistic.

**Traceability**: Extension pattern under `FR-036` target management.

---

## Could Have

### US-008: Dietary Profile Filters

As a user, I can apply keto/vegan/allergy/medical profile filters to insights and suggestions.

**WARNING**: Not explicitly declared in `FR-036..FR-039`; treat as augmentation candidate.

### US-009: Deficiency Alerts

As a user, I receive informational deficiency alerts when repeated intake patterns indicate likely gaps.

**WARNING**: Requested in domain brief, but no explicit FR ID in canonical spec.

---

## Won’t Have (This Iteration)

- Real-time wearable integration ingestion.
- Clinical diagnosis recommendations or treatment advice.
- Fully automated meal-plan auto-rewrite without user approval.

---

## Out of Scope

- Rebuilding core food-entry logging as a standalone tracker app.
- Replacing feature 006 meal-planning primitives.
- Adding new legal/medical opinion engines beyond informational UX.

---

## Traceability Table

| Story  | Priority | FR/REQ Mapping               |
| ------ | -------- | ---------------------------- |
| US-001 | Must     | FR-036                       |
| US-002 | Must     | FR-037                       |
| US-003 | Must     | FR-038                       |
| US-004 | Must     | FR-039                       |
| US-005 | Should   | REQ-008 (assumption-derived) |
| US-006 | Should   | FR-037 (coverage extension)  |
| US-007 | Should   | FR-036 (coverage extension)  |
| US-008 | Could    | Warning-level augmentation   |
| US-009 | Could    | Warning-level augmentation   |

---

## Open Scope Questions for Revalidation

1. Promote dietary profiles to explicit FR?
2. Promote deficiency alerts to explicit FR?
3. Keep all swap guidance premium-only or introduce partial free tier?
