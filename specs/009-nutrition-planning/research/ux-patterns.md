# UX Patterns: Nutrition Planning

**Branch**: `009-nutrition-planning` | **Date**: 2026-05-09
**Status**: Complete | **Source**: [spec.md](../spec.md), [plan.md](../plan.md), [research.md](../research.md)

---

## 1. Nutrition Dashboard Patterns

### 1.1 Ring + Bar Hybrid Progress

Use a **ring + stacked bar hybrid** on the dashboard:

- **Primary ring**: daily calorie progress (consumed/planned)
- **Macro bars**: protein, carbs, fat as horizontal progress bars with target markers
- **Weekly strip**: 7-day mini-bars for adherence trend

This pattern supports fast glanceability while preserving macro-level detail.

### 1.2 Color-Coded Status with Redundant Labels

Status colors are paired with icon/text badges to satisfy `NFR-004`:

- On target: green + “On Track” label
- Under target: amber + “Under” label
- Over target: red + “Over” label

Color is never the sole state indicator.

### 1.3 Deviation Emphasis

Compliance cards should show both absolute and relative deltas:

- `+/- grams` (macro-level)
- `+/- calories`
- `% deviation`

Users correct faster when deviation magnitude is explicit.

---

## 2. Goal Setup and Recalibration

### 2.1 Structured Goal Wizard

Nutrition goal setup should be a short multi-step flow:

1. Profile inputs (activity level, objective)
2. Target model (fixed grams baseline; optional ratio view)
3. Dietary constraints and exclusions
4. Confirm + save

Targets map directly to `FR-036` fields.

### 2.2 Goal Adjustment Preview

Before saving a target change, show **impact preview**:

- Previous vs new target card
- Estimated daily/weekly delta
- Warning if change pushes macros to atypical ranges

This reduces accidental aggressive target edits.

---

## 3. Dietary Tag and Constraint Filters

### 3.1 Dietary Profile Chips

Provide selectable chips in dashboard and meal-breakdown surfaces:

- Keto
- Vegan
- Allergy-aware
- Medical constraint profile

These act as filtering lenses over suggestions and breakdowns; this aligns with user-requested domain context and does not create a new FR by itself.

### 3.2 Allergy and Medical Safety Indicators

Meal-breakdown rows should include explicit safety indicators when dietary profiles are active. Use icon + text labels for accessibility.

---

## 4. Meal Nutrition Rollup Views

### 4.1 Daily Rollup Card

For each day, show:

- Planned totals (from nutrition plan targets)
- Actual totals (from linked meal plan rollup via 006)
- Delta and status by macro

This is the core `FR-037` surface.

### 4.2 Weekly Heatmap/Trend

A weekly view should visualize adherence volatility:

- Day-level status cells
- Macro-specific trend line toggles
- “Best/worst day” quick insights

---

## 5. Deficiency Alert Pattern (Augmentation Candidate)

Deficiency alerts are requested in the task domain but are not explicit FRs in `spec.md`. Treat as warning-level extension candidate:

- Display informational alert cards (e.g., low fiber/iron pattern)
- Include “Why this alert” and confidence context
- Avoid prescriptive medical language

If promoted upstream, this likely needs a dedicated FR and validation copy review.

---

## 6. Premium Trainer-Client UX

### 6.1 Assignment Flow

Trainer creates plan → selects client → sends/activates shared plan. Client sees source attribution (“Assigned by Trainer”).

### 6.2 Compliance Drilldown

Trainer dashboard includes:

- Client list with adherence score
- Drilldown by day/week
- Action hints (recipe swap opportunities tied to `FR-039`)

Consent gating is mandatory (aligns with spec assumptions and REQ-008).
