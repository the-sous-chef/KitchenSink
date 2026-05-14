# Technical Plan: Feature 006 — Meal Planning

**Feature**: `006-meal-planning`
**Status**: Draft

---

## 1. Architecture Overview

### System Context

```
User creates meal plan (1 week, 2 weeks, etc.)
    ↓
Assign recipes to meal slots (breakfast/lunch/dinner/snack)
    ↓
Nutritional summary (pulled from 003 USDA data via 001 recipes)
    ↓
Grocery list generation (triggers 007)
    ↓
AI suggestions (triggers 005 AI integration)
```

### Meal Plan Data Flow

```
MealPlan {
  id, userId, startDate, endDate, name
  → MealPlanEntries[] (recipe + meal slot + day)
  → NutritionalSummary (aggregated from recipe ingredients via 003)
}
```

---

## 2. Data Model

### Core Tables

```sql
-- Meal plan (user's weekly/monthly plan)
meal_plans (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  is_locked BOOLEAN DEFAULT false,   -- Locked = finalized, not editable
  plan_type TEXT                     -- 'weekly' | 'biweekly' | 'custom'
)

-- Individual meal assignments
meal_plan_entries (
  id UUID PRIMARY KEY,
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id),
  meal_type TEXT,                   -- 'breakfast' | 'lunch' | 'dinner' | 'snack'
  date DATE,
  servings INT DEFAULT 1,
  notes TEXT,                       -- "omit onions", "extra spicy"
  created_at TIMESTAMP
)

-- Aggregated nutritional totals per meal plan day
meal_plan_nutrition (
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
  date DATE,
  calories_total DECIMAL,
  protein_g_total DECIMAL,
  carbs_g_total DECIMAL,
  fat_g_total DECIMAL,
  fiber_g_total DECIMAL,
  PRIMARY KEY (meal_plan_id, date)
)
```

---

## 3. API Contracts

### Endpoints

| Method | Path                                      | Auth     | Description                           |
| ------ | ----------------------------------------- | -------- | ------------------------------------- |
| GET    | `/v1/meal-plans`                          | Required | List user's meal plans                |
| POST   | `/v1/meal-plans`                          | Required | Create new meal plan                  |
| GET    | `/v1/meal-plans/{id}`                     | Required | Get meal plan with entries            |
| PUT    | `/v1/meal-plans/{id}`                     | Required | Update meal plan (add/remove entries) |
| DELETE | `/v1/meal-plans/{id}`                     | Required | Delete meal plan                      |
| POST   | `/v1/meal-plans/{id}/entries`             | Required | Add recipe to meal plan               |
| DELETE | `/v1/meal-plans/{id}/entries/{entryId}`   | Required | Remove entry                          |
| GET    | `/v1/meal-plans/{id}/nutrition`           | Required | Get aggregated nutrition summary      |
| POST   | `/v1/meal-plans/{id}/recipes/suggestions` | Required | Get AI suggestions (005)              |

### Request/Response Shapes

```typescript
// POST /v1/meal-plans
Request:
{
  "name": "Week of May 12",
  "startDate": "2026-05-12",
  "endDate": "2026-05-18",
  "planType": "weekly"
}

Response: MealPlan with id, entries: [], nutrition summary empty

// POST /v1/meal-plans/{id}/entries
Request:
{
  "recipeId": "rec_abc123",
  "date": "2026-05-12",
  "mealType": "dinner",
  "servings": 2
}

// GET /v1/meal-plans/{id}/nutrition
Response:
{
  "planId": "mp_xyz",
  "dateRange": { "start": "2026-05-12", "end": "2026-05-18" },
  "dailyNutrition": [
    {
      "date": "2026-05-12",
      "meals": [
        { "mealType": "breakfast", "recipeId": "...", "calories": 450, "proteinG": 25, "carbsG": 40, "fatG": 15 },
        { "mealType": "lunch", "recipeId": "...", "calories": 620, "proteinG": 35, "carbsG": 55, "fatG": 20 }
      ],
      "totals": { "calories": 1070, "proteinG": 60, "carbsG": 95, "fatG": 35 }
    }
  ],
  "weekTotals": { "calories": 15400, "proteinG": 420, "carbsG": 1890, "fatG": 490 }
}
```

---

## 4. Drag-and-Drop UX (Frontend)

### Component Architecture

```
<MealPlanCalendar>
  ├── <WeekStrip> (Mon-Sun columns)
  │   ├── <DayColumn>
  │   │   ├── <BreakfastSlot> ← drag target
  │   │   ├── <LunchSlot> ← drag target
  │   │   ├── <DinnerSlot> ← drag target
  │   │   └── <SnackSlot> ← drag target
  │   └── ...
  ├── <RecipeSidebar> (draggable recipe cards)
  └── <NutritionSummary> (sticky footer)
```

### Drag Library

Use `@dnd-kit/core` + `@dnd-kit/sortable` — best React accessibility support, works with touch and mouse.

---

## 5. Integration with 003 (USDA) and 007 (Grocery)

### Nutritional Rollup

```typescript
// When recipe is added to meal plan:
// 1. Fetch recipe ingredients (001)
// 2. For each ingredient with usda_fdc_id → fetch nutrients (003)
// 3. Sum per day → meal_plan_nutrition table

interface NutritionCalculator {
    calculateDayNutrition(entries: MealPlanEntry[]): DayNutrition;
    calculateWeekNutrition(planId: UUID): WeekNutrition;
    triggerOnEntryAdd(entry: MealPlanEntry): void;
}
```

### Grocery List Generation (triggers 007)

```typescript
// POST /v1/meal-plans/{id}/grocery-list
// → fetches all entries for the plan
// → aggregates ingredients across recipes (dedup via 007)
// → returns grocery list manifest (leaves actual 007 creation to user)
```

---

## 6. AI Integration (via 005)

### Meal Suggestion Flow

```typescript
// POST /v1/meal-plans/{id}/recipes/suggestions
// → calls 005 AI service
// → passes: user preferences, dietary restrictions, existing recipes, target macros

interface MealSuggestionRequest {
    planId: UUID;
    targetDate: Date;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    preferences: UserPreferences; // from user profile
    macroTargets?: MacroTargets; // optional override
}

// Response: suggested recipes ranked by match score
```

---

## 7. Resilience & External Services

- **003 USDA API**: Cache-aside for ingredient nutrients, TTL 1h
- **005 AI API**: Async SQS pattern, 60s timeout, retry with exponential backoff
- **Recipe availability**: If recipe is deleted, mark entry as `orphaned` — don't cascade delete entry

---

## 8. Migration / Schema Changes

```sql
-- Migration for 006 meal-planning
CREATE TABLE meal_plans (...);
CREATE TABLE meal_plan_entries (...);
CREATE TABLE meal_plan_nutrition (...);

CREATE INDEX idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX idx_meal_plans_dates ON meal_plans(start_date, end_date);
CREATE INDEX idx_meal_plan_entries_plan_id ON meal_plan_entries(meal_plan_id);
CREATE INDEX idx_meal_plan_entries_date ON meal_plan_entries(date);
CREATE INDEX idx_meal_plan_nutrition_plan_date ON meal_plan_nutrition(meal_plan_id, date);
```

---

## 9. Open Questions

1. **Meal plan templates**: Should users save/reuse custom templates?
2. **Recipe scaling**: If I assign 2 servings for dinner but my plan is for 1 person, does grocery list scale automatically?
3. **Lock mechanism**: What does "locked" mean in practice? Prevents editing? Just signals finalization for grocery ordering?

---

## 10. Implementation Order

1. **CRUD APIs** — meal_plans, meal_plan_entries
2. **GET nutrition** — aggregation from recipe ingredients via 003
3. **Frontend calendar** — drag-and-drop @dnd-kit
4. **Grocery list generation** — aggregate + hand off to 007
5. **AI suggestions** — integrate via 005
6. **Lock/finalize flow** — prevent edits after grocery generation
