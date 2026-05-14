# Competitor Analysis: Nutrition Planning Apps

**Branch**: `009-nutrition-planning` | **Date**: 2026-05-09
**Status**: Complete | **Source**: [research.md](../research.md), requested competitor set

---

## Competitive Landscape Overview

The nutrition-planning market segments into four dominant UX and product strategies:

1. **High-adoption tracking + broad food database** (MyFitnessPal, Lose It!)
2. **High-fidelity nutrient analytics** (Cronometer)
3. **Diet-specific optimization** (Carb Manager)
4. **Coaching overlays** (trainer workflows layered on top of target compliance)

Feature 009 sits at the intersection of (2), (3), and (4) while reusing meal-planning infrastructure from 006.

---

## Competitor Profiles

### 1. MyFitnessPal

| Attribute          | Detail                                                                  |
| ------------------ | ----------------------------------------------------------------------- |
| **Positioning**    | Mainstream calorie/macro tracking with large user-generated food corpus |
| **Macro Model**    | Percentage-first (free), fixed grams in premium workflows               |
| **Micronutrients** | Limited compared with Cronometer depth                                  |
| **Coach/Client**   | Weak native coaching model                                              |
| **Strength**       | Habit adherence at scale, low-friction logging                          |
| **Weakness**       | Data quality variance, less clinical nutrient precision                 |

### 2. Cronometer

| Attribute          | Detail                                                              |
| ------------------ | ------------------------------------------------------------------- |
| **Positioning**    | Precision nutrition and biomarker-oriented tracking                 |
| **Macro Model**    | Ratios + fixed grams + advanced target editing                      |
| **Micronutrients** | Best-in-class vitamins/minerals visibility and deficiency awareness |
| **Coach/Client**   | Professional plan support available                                 |
| **Strength**       | Data fidelity and nutrient completeness                             |
| **Weakness**       | Heavier UX for casual users                                         |

### 3. Lose It!

| Attribute          | Detail                                               |
| ------------------ | ---------------------------------------------------- |
| **Positioning**    | Weight-loss-centric adherence and behavior loops     |
| **Macro Model**    | Goal and budget oriented with premium macro controls |
| **Micronutrients** | Secondary emphasis                                   |
| **Coach/Client**   | Limited direct trainer-client workflows              |
| **Strength**       | Engagement loops, approachable onboarding            |
| **Weakness**       | Less suitable for clinical precision goals           |

### 4. Carb Manager

| Attribute          | Detail                                           |
| ------------------ | ------------------------------------------------ |
| **Positioning**    | Keto/low-carb planning and net-carb optimization |
| **Macro Model**    | Carb-constrained targets, net-carb prominence    |
| **Micronutrients** | Moderate depth; keto-specific framing            |
| **Coach/Client**   | Mixed; more self-directed than trainer-first     |
| **Strength**       | Diet-profile fit for low-carb audiences          |
| **Weakness**       | Narrower appeal for non-keto users               |

---

## Comparative Matrix (Feature 009 Lens)

| Capability                                  | MyFitnessPal | Cronometer | Lose It! | Carb Manager | Implication for 009                                                      |
| ------------------------------------------- | ------------ | ---------- | -------- | ------------ | ------------------------------------------------------------------------ |
| Fixed gram macro targets                    | Premium      | Yes        | Premium  | Yes          | Keep explicit grams as baseline (`FR-036`)                               |
| Ratio-based macro model                     | Yes          | Yes        | Partial  | Yes          | Optional ratio mode is useful, but not required by current FRs           |
| Micronutrient depth                         | Low-Med      | High       | Low-Med  | Med          | Deficiency-alert UX is a differentiation candidate (warning-level scope) |
| Trainer-client workflows                    | Low          | Medium     | Low      | Low-Med      | `FR-038` can differentiate with consent-governed trainer plans           |
| Meal-plan compliance rollup                 | Medium       | Medium     | Medium   | Medium       | 009 should leverage 006 rollup to reduce friction (`FR-037`)             |
| Diet profile filters (keto/vegan/allergies) | Partial      | Partial    | Partial  | Keto-strong  | Broad dietary filter model supports more users than keto-only            |

---

## Strategic Takeaways for Feature 009

1. **Precision + simplicity must coexist**: adopt Cronometer-like depth for analysis while preserving MyFitnessPal/Lose It ease for daily adherence.
2. **Trainer-client workflow is under-served** in mainstream trackers; `FR-038` is the core moat candidate if consent and visibility controls are strong.
3. **Dietary profile support (keto, vegan, allergies, medical constraints)** should be expressed as filtering and target overlays to avoid overfitting a single diet vertical.
4. **Deficiency alerts** are a high-value opportunity but currently under-specified in canonical FRs; keep as a flagged extension candidate.

---

## Risks and Constraints

- Competitive parity on logging UX is costly; 009 should prioritize integration-powered insights over rebuilding food-logging complexity.
- Nutrient recommendations can imply health guidance risk; alerts must be informational and aligned with consent and disclaimers.
- Premium gating must remain coherent with dependency spec 010 (subscriptions).
