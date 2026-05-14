# Tasks: Feature 007 — Grocery Lists & Online Ordering

**Feature**: `007-grocery-lists`
**Generated**: 2026-05-09
**Last Updated**: 2026-05-10 (added T-039..T-046; resolved open questions; added mobile UI tasks)
**Source Artifacts**: plan.md, spec.md, research/
**Total Tasks**: 46

---

## Dependency Order

```
[T-001] DB Migration
    ↓
[T-002] Drizzle Schema
    ↓
[T-003] Unit Conversion Utility (shared)
    ↓
[T-004] Ingredient Aggregator Service
    ↓
[T-005] Pantry Service
    ↓
[T-006..T-012] Core API Endpoints
    ↓
[T-013..T-015] Store Mapping (Walmart — adapter first; requires WALMART_API_KEY)
    ↓
[T-016..T-018] Store Mapping (Instacart — adapter second; requires partner agreement + OAuth creds)
    ↓
[T-019] Order Status Polling
    ↓
[T-020] Premium Feature Guard (010 gating)
    ↓
[T-021..T-024] NestJS Module Wiring & Guards
    ↓
[T-025..T-028] Web UI (Next.js)          [T-039] Dedicated Shopping Lists Page (Web)
    ↓                                         ↓
[T-041..T-044] Mobile UI (Expo/RN)       [T-040] Meal Plan Cross-Links (Web + 006 view)
    ↓
[T-045..T-046] Mobile E2E Tests
    ↓
[T-029..T-038] Tests & Validation
```

> **Store adapter note**: T-013..T-018 implement the adapter code and can be built and unit-tested with mocks. They MUST NOT be marked complete until a real API key or sandbox credential is available for integration testing against the actual store API.

---

## Phase 1 — Database & Schema

### T-001 · DB Migration: grocery-lists tables

**Priority**: P1 · **Story**: FR-028, FR-029, FR-030, FR-031
**Depends on**: 006-meal-planning migration (meal_plans table must exist)

Create Drizzle migration file for all four tables:

```sql
CREATE TABLE grocery_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',   -- 'draft' | 'ready' | 'ordered'
  store TEXT,                              -- 'walmart' | 'instacart' | null
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE grocery_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grocery_list_id UUID NOT NULL REFERENCES grocery_lists(id) ON DELETE CASCADE,
  usda_fdc_id INT REFERENCES foods(fdc_id),
  display_name TEXT NOT NULL,
  quantity_g DECIMAL,
  unit_display TEXT,
  category TEXT,
  is_pantry BOOLEAN NOT NULL DEFAULT false,
  is_ordered BOOLEAN NOT NULL DEFAULT false,
  store_sku JSONB,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE user_pantry_items (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  usda_fdc_id INT NOT NULL,
  quantity_g DECIMAL,
  expires_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (user_id, usda_fdc_id)
);

CREATE TABLE grocery_product_map (
  usda_fdc_id INT PRIMARY KEY,
  walmart_sku TEXT,
  walmart_price DECIMAL(10,2),
  instacart_product_id TEXT,
  instacart_price DECIMAL(10,2),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_grocery_lists_user_id ON grocery_lists(user_id);
CREATE INDEX idx_grocery_lists_meal_plan_id ON grocery_lists(meal_plan_id);
CREATE INDEX idx_grocery_list_items_list_id ON grocery_list_items(grocery_list_id);
CREATE INDEX idx_grocery_list_items_fdc_id ON grocery_list_items(usda_fdc_id);
CREATE INDEX idx_user_pantry_user ON user_pantry_items(user_id);
```

**Acceptance**: Migration runs cleanly with `drizzle-kit migrate`; rollback drops all four tables.

---

### T-002 · Drizzle ORM Schema: grocery-lists

**Priority**: P1 · **Story**: FR-028, FR-029, FR-030, FR-031
**Depends on**: T-001

Create `src/db/schema/grocery-lists.ts` with Drizzle table definitions, inferred TypeScript types, and Zod insert/select schemas for all four tables. Export from `src/db/schema/index.ts`.

**Acceptance**: `tsc --noEmit` passes; all four tables importable from schema index.

---

## Phase 2 — Shared Utility

### T-003 · Unit Conversion Utility: `culinary-units.ts`

**Priority**: P1 · **Story**: FR-028
**Depends on**: nothing (pure utility)
**Location**: `packages/shared/src/culinary-units.ts`

Implement `UnitConversion` interface:

```typescript
export interface ParsedIngredient {
    quantity: number;
    unit: string;
    remainder?: string;
}

export interface BaseQuantity {
    value: number;
    baseUnit: 'g' | 'mL' | 'count';
}

export interface UnitConversion {
    parse(ingredientString: string): ParsedIngredient;
    toBaseUnit(quantity: number, unit: string, foodType?: string): BaseQuantity;
    toDisplayUnit(grams: number, foodType?: string): string;
}
```

- Support `VOLUME_UNITS`: tsp, tbsp, cup, floz, ml, l
- Support `MASS_UNITS`: oz, lb, g, kg
- Support `COUNT_UNITS`: clove, whole, slice, piece
- Implement `DENSITY_MAP` with at minimum: water, flour, sugar, butter, olive_oil, milk
- Handle fractional strings: "1/2 cup", "1 1/2 tsp"
- Export `createUnitConverter(): UnitConversion`

**Acceptance**: Unit tests cover volume→mass cross-conversion (e.g., "2 cups flour" → ~250g), fractional parsing, and unknown unit fallback.

---

## Phase 3 — Core Services

### T-004 · Ingredient Aggregator Service

**Priority**: P1 · **Story**: FR-028
**Depends on**: T-002, T-003
**Location**: `src/grocery-lists/aggregator.service.ts`

Implement `IngredientAggregatorService`:

```typescript
interface IngredientAggregatorService {
    aggregate(ingredients: RecipeIngredient[]): GroceryListItem[];
    normalizeUnit(quantity: number, unit: string, foodType: string): number; // returns grams
    deduplicate(items: GroceryListItem[]): GroceryListItem[];
}
```

- Group by `usda_fdc_id` (primary) or `display_name` normalized (fallback for unmapped)
- Sum `quantity_g` across duplicates
- Preserve `unit_display` from the largest-quantity source item
- Assign `category` from USDA food group (via 003 foods table lookup)
- Sort output by category then display_name

**Acceptance**: Given 3 recipes each contributing "onion" with different units, output is a single aggregated item with correct summed grams.

---

### T-005 · Pantry Service

**Priority**: P1 · **Story**: FR-029
**Depends on**: T-002
**Location**: `src/grocery-lists/pantry.service.ts`

Implement `PantryService`:

```typescript
interface PantryService {
    addItem(userId: string, fdcId: number, quantityG?: number): Promise<void>;
    removeItem(userId: string, fdcId: number): Promise<void>;
    getItems(userId: string): Promise<UserPantryItem[]>;
    subtractFromList(items: GroceryListItem[], userId: string): Promise<GroceryListItem[]>;
    pruneExpired(): Promise<number>; // returns count pruned
}
```

- TTL: 7 days from last update (`expires_at = now() + interval '7 days'`)
- `subtractFromList`: marks items as `is_pantry = true` if user has them in pantry
- `pruneExpired`: called by a scheduled task (NestJS `@Cron`)

**Acceptance**: Items marked as pantry are excluded from the "to order" count; expired items are pruned on schedule.

---

## Phase 4 — API Endpoints

### T-006 · POST `/v1/grocery-lists` — Generate from meal plan

**Priority**: P1 · **Story**: FR-028
**Depends on**: T-004, T-005

Implement endpoint:

- Accept `{ mealPlanId?: string, name: string, store?: 'walmart' | 'instacart' }`
- Validate `mealPlanId` belongs to authenticated user (via 006 meal_plans)
- Fetch all `recipe_ingredients` for the meal plan's recipes (via 001)
- Run `IngredientAggregatorService.aggregate()`
- Apply pantry subtraction via `PantryService.subtractFromList()`
- Persist `grocery_lists` + `grocery_list_items` rows
- Return full list with summary (`totalItems`, `pantryItems`, `toOrderItems`, `estimatedTotal`)
- Handle empty meal plan: return empty list with `totalItems: 0`

**Acceptance**: Scenario 1 from spec passes; empty meal plan returns 200 with empty items array.

---

### T-007 · GET `/v1/grocery-lists` — List user's grocery lists

**Priority**: P1 · **Story**: FR-028
**Depends on**: T-002

- Return paginated list of `grocery_lists` for authenticated user
- Include `itemCount` and `status` per list
- Default sort: `created_at DESC`
- Pagination: cursor-based (`?after=<id>&limit=20`)

**Acceptance**: Returns only lists belonging to the authenticated user; pagination works correctly.

---

### T-008 · GET `/v1/grocery-lists/:id` — Get list with items

**Priority**: P1 · **Story**: FR-028
**Depends on**: T-002

- Return full `grocery_list` with all `grocery_list_items`
- Items sorted by `sort_order` then `category`
- Include `storeMapping` from `store_sku` JSONB
- 404 if list not found or belongs to different user

**Acceptance**: Returns all items with correct categories and store mappings.

---

### T-009 · PUT `/v1/grocery-lists/:id` — Update items

**Priority**: P1 · **Story**: FR-029
**Depends on**: T-002

- Accept partial updates to `grocery_list_items` (batch)
- Allow toggling `is_pantry`, `is_ordered`, `sort_order`
- Update `grocery_lists.updated_at`
- 403 if list belongs to different user

**Acceptance**: Scenario 3 from spec passes (mark items as "already have").

---

### T-010 · DELETE `/v1/grocery-lists/:id` — Delete list

**Priority**: P2 · **Story**: FR-028
**Depends on**: T-002

- Soft-delete or hard-delete (cascade via FK)
- 403 if list belongs to different user
- 404 if not found

**Acceptance**: List and all items are removed; subsequent GET returns 404.

---

### T-011 · POST `/v1/grocery-lists/:id/items/:itemId/pantry` — Mark item as pantry

**Priority**: P1 · **Story**: FR-029
**Depends on**: T-005

- Set `is_pantry = true` on the item
- Optionally persist to `user_pantry_items` for future lists
- Accept `{ persist?: boolean }` body

**Acceptance**: Item excluded from "to order" count after marking.

---

### T-012 · DELETE `/v1/grocery-lists/:id/items/:itemId/pantry` — Remove pantry flag

**Priority**: P1 · **Story**: FR-029
**Depends on**: T-005

- Set `is_pantry = false` on the item
- Optionally remove from `user_pantry_items`

**Acceptance**: Item re-appears in "to order" count after un-marking.

---

## Phase 5 — Store Mapping (Walmart)

### T-013 · Walmart API Client

**Priority**: P2 · **Story**: FR-030, FR-031
**Depends on**: T-002
**Location**: `src/grocery-lists/store-clients/walmart.client.ts`

Implement `WalmartClient`:

```typescript
interface WalmartClient {
    searchByIngredient(query: string, fdcId: number): Promise<WalmartProduct | null>;
    createCart(items: WalmartCartItem[]): Promise<string>; // cartId
    checkout(cartId: string): Promise<{ checkoutUrl: string }>;
}
```

- 10s timeout on all requests
- Circuit breaker: 5 consecutive failures → 60s open state (use `opossum` or equivalent)
- Retry: 2 retries with exponential backoff on 5xx
- Config via `WALMART_API_KEY` env var (Zod-validated)

**Acceptance**: Circuit breaker opens after 5 failures; requests fail fast during open state.

---

### T-014 · Product Mapping Service

**Priority**: P2 · **Story**: FR-031
**Depends on**: T-002, T-013
**Location**: `src/grocery-lists/product-mapping.service.ts`

Implement `ProductMappingService`:

```typescript
interface ProductMappingService {
    mapItems(items: GroceryListItem[], store: 'walmart' | 'instacart'): Promise<MappedItem[]>;
    refreshMapping(fdcId: number, store: string): Promise<void>;
}
```

- Check `grocery_product_map` cache first (stale if `last_updated > 24h`)
- On cache miss: call store API, persist result
- Items with no mapping: return `status: 'unmapped'`
- Items where store API fails: return `status: 'not_found'`

**Acceptance**: Cache hit avoids store API call; unmapped items degrade gracefully.

---

### T-015 · POST `/v1/grocery-lists/:id/order` — Initiate online order (Walmart)

**Priority**: P2 · **Story**: FR-031
**Depends on**: T-014, T-020 (premium gate)

- Check subscription tier via 010 gating (premium required)
- Map all non-pantry items via `ProductMappingService`
- Create Walmart cart
- Return `{ checkoutUrl, mappedCount, unmappedCount, unmappedItems[] }`
- Persist `store = 'walmart'` and `status = 'ordered'` on success

**Acceptance**: Scenario 4 from spec passes; non-premium users receive 403 with upgrade prompt.

---

## Phase 6 — Store Mapping (Instacart)

> **Status note**: Instacart Connect requires a partner agreement that is not confirmed at spec time. These tasks implement the adapter code and can be built and unit-tested with mocks. They MUST NOT be marked complete until OAuth credentials and a sandbox environment are available.

### T-016 · Instacart OAuth Flow

**Priority**: P2 · **Story**: FR-030
**Depends on**: T-002
**Location**: `src/grocery-lists/store-clients/instacart.oauth.ts`
**Blocker**: Requires `INSTACART_CLIENT_ID` + `INSTACART_CLIENT_SECRET` from a confirmed partner agreement.

Implement OAuth 2.0 authorization code flow:

- `GET /v1/grocery-lists/instacart/connect` → redirect to Instacart OAuth
- `GET /v1/grocery-lists/instacart/callback` → exchange code for tokens, persist encrypted tokens
- Token refresh on expiry
- Config via `INSTACART_CLIENT_ID`, `INSTACART_CLIENT_SECRET`, `INSTACART_REDIRECT_URI` (Zod-validated)

**Acceptance**: OAuth flow completes end-to-end in Instacart sandbox; tokens persisted and refreshed correctly. _Cannot be fully accepted without sandbox credentials._

---

### T-017 · Instacart API Client

**Priority**: P2 · **Story**: FR-031
**Depends on**: T-016
**Location**: `src/grocery-lists/store-clients/instacart.client.ts`
**Blocker**: Requires Instacart sandbox credentials (same as T-016).

Implement `InstacartClient`:

```typescript
interface InstacartClient {
    searchProducts(query: string, fdcId: number): Promise<InstacartProduct | null>;
    createOrder(items: InstacartItem[]): Promise<string>; // orderId
}
```

- 10s timeout; token auto-refresh on 401
- Same circuit breaker pattern as Walmart client

**Acceptance**: Token refresh works transparently; circuit breaker pattern consistent with Walmart. _Cannot be fully accepted without sandbox credentials._

---

### T-018 · POST `/v1/grocery-lists/:id/order` — Initiate online order (Instacart)

**Priority**: P2 · **Story**: FR-031
**Depends on**: T-017, T-020
**Blocker**: Requires Instacart sandbox credentials (same as T-016).

- Extend T-015 endpoint to support `store: 'instacart'`
- Use `InstacartClient` for product search and order creation
- Return same response shape as Walmart path

**Acceptance**: Instacart order creation works end-to-end with valid OAuth tokens. _Cannot be fully accepted without sandbox credentials._

---

### T-019 · GET `/v1/grocery-lists/:id/order-status` — Poll order status

**Priority**: P2 · **Story**: FR-031
**Depends on**: T-015, T-018

**Mechanism**: Client-driven polling (no webhooks in MVP — see plan.md Section 8.2).

- Return current order status from store API (or cached last-known value)
- Cache status for 30s to avoid hammering store APIs
- Status values: `'pending' | 'confirmed' | 'in_progress' | 'delivered' | 'failed' | 'unavailable'`
- `in_progress` and `delivered` are only returned if the store API provides those signals; otherwise the status stays at `confirmed`
- `unavailable` is returned when no store integration is active

**Acceptance**: Status polling returns correct state; 30s cache prevents excessive API calls; `unavailable` returned when store not configured.

---

## Phase 7 — Premium Gating

### T-020 · Premium Feature Guard (010 integration)

**Priority**: P2 · **Story**: FR-031
**Depends on**: 010-subscriptions module
**Location**: `src/grocery-lists/guards/premium-ordering.guard.ts`

Implement NestJS guard that:

- Checks user subscription tier via 010 subscriptions service
- Returns 403 with `{ error: 'PREMIUM_REQUIRED', upgradeUrl: '/upgrade' }` for free users
- Applies to: `POST /v1/grocery-lists/:id/order`, `GET /v1/grocery-lists/:id/order-status`

**Acceptance**: Free-tier users receive 403; premium users pass through.

---

## Phase 8 — NestJS Module Wiring

### T-021 · GroceryListsModule: NestJS module definition

**Priority**: P1 · **Story**: all
**Depends on**: T-004, T-005, T-013, T-014
**Location**: `src/grocery-lists/grocery-lists.module.ts`

Wire all providers, controllers, and imports:

- Import `DrizzleModule`, `AuthModule` (002), `MealPlansModule` (006)
- Provide: `GroceryListsService`, `IngredientAggregatorService`, `PantryService`, `ProductMappingService`
- Provide: `WalmartClient`, `InstacartClient` (conditional on env vars)
- Register `@Cron` for pantry TTL pruning (daily at 02:00 UTC)

**Acceptance**: Module bootstraps without errors; all providers injectable.

---

### T-022 · GroceryListsController: route registration

**Priority**: P1 · **Story**: all
**Depends on**: T-021
**Location**: `src/grocery-lists/grocery-lists.controller.ts`

Register all 9 endpoints from plan.md Section 3 with:

- `@UseGuards(JwtAuthGuard)` on all routes
- `@UseGuards(PremiumOrderingGuard)` on order routes
- Request DTOs with `class-validator` decorators
- Response serialization via `class-transformer`

**Acceptance**: All routes registered; `tsc --noEmit` passes; Swagger docs generated.

---

### T-023 · GroceryListsService: orchestration layer

**Priority**: P1 · **Story**: all
**Depends on**: T-004, T-005, T-014
**Location**: `src/grocery-lists/grocery-lists.service.ts`

Thin orchestration service that coordinates:

- `IngredientAggregatorService` for list generation
- `PantryService` for pantry operations
- `ProductMappingService` for store mapping
- Direct Drizzle queries for CRUD operations

**Acceptance**: All service methods have JSDoc; no business logic in controller.

---

### T-024 · DTOs: request/response validation

**Priority**: P1 · **Story**: all
**Depends on**: T-002
**Location**: `src/grocery-lists/dto/`

Create DTOs for all endpoints:

- `CreateGroceryListDto` — `mealPlanId?`, `name`, `store?`
- `UpdateGroceryListItemsDto` — array of item patches
- `GroceryListResponseDto` — full list with items and summary
- `GroceryListItemDto` — individual item with store mapping
- `OrderResponseDto` — checkout URL, mapped/unmapped counts

All DTOs: `class-validator` decorators, `class-transformer` `@Expose()`, JSDoc on all fields.

**Acceptance**: Invalid requests return 400 with field-level error messages.

---

## Phase 9 — Web UI (Next.js)

> **Parity note**: Every web UI task in this phase has a corresponding mobile UI task in Phase 10A. Mobile tasks are T-041..T-044. Both sets must be completed before the feature ships.

### T-025 · Grocery List Page: `/meal-plans/[id]/grocery-list`

**Priority**: P2 · **Story**: SC-008
**Depends on**: T-006, T-008

Create Next.js App Router page:

- "Generate Grocery List" button triggers `POST /v1/grocery-lists`
- Loading state during generation (skeleton UI)
- Display items grouped by category
- Each item shows: display name, quantity display, category badge
- Accessible: all interactive elements queryable by role/label (NFR-003)
- Color not sole state conveyor — use icons + text (NFR-004)

**Acceptance**: SC-008 — full workflow completable in under 10 minutes for a 7-day plan.

---

### T-026 · Pantry Toggle UI

**Priority**: P2 · **Story**: FR-029
**Depends on**: T-011, T-012, T-025

- Checkbox or toggle per item: "Already have"
- Optimistic UI update (mark immediately, revert on error)
- "Already have" items visually de-emphasized (strikethrough + muted color + icon)
- Summary counter updates in real-time

**Acceptance**: Scenario 3 from spec passes in Playwright test.

---

### T-027 · Store Connection UI

**Priority**: P2 · **Story**: FR-030
**Depends on**: T-016, T-025

- "Connect Store" section in grocery list page
- Walmart: API key entry form
- Instacart: OAuth "Connect with Instacart" button → redirect flow
- Connected state shows store logo + "Disconnect" option
- Scenario 5: guide user through setup if no store configured

**Acceptance**: Scenario 5 from spec passes; OAuth redirect and callback work end-to-end.

---

### T-028 · Online Ordering UI (Premium)

**Priority**: P2 · **Story**: FR-031
**Depends on**: T-015, T-018, T-019, T-027

- "Order Groceries" button (disabled + upgrade prompt for free users)
- Pre-order review: show mapped vs unmapped items
- Allow manual selection for unmapped items
- Post-order: show checkout URL as CTA button
- Order status polling with progress indicator

**Acceptance**: Scenario 4 from spec passes; premium gate shows upgrade prompt for free users.

---

## Phase 10 — Tests & Validation

### T-029 · Unit tests: `culinary-units.ts`

**Priority**: P1 · **Story**: FR-028
**Depends on**: T-003

Test cases:

- Volume→mass cross-conversion: "2 cups flour" → ~250g
- Mass→mass: "1 lb butter" → ~454g
- Fractional parsing: "1/2 cup", "1 1/2 tsp"
- Count units: "3 cloves garlic"
- Unknown unit fallback (no crash)
- Round-trip: parse → toBaseUnit → toDisplayUnit

**Acceptance**: 100% branch coverage on `culinary-units.ts`.

---

### T-030 · Unit tests: `aggregator.service.ts`

**Priority**: P1 · **Story**: FR-028
**Depends on**: T-004

Test cases:

- 3 recipes with overlapping onion → single aggregated item
- Same ingredient, different units → correct summed grams
- Unmapped ingredient (no fdcId) → grouped by normalized display_name
- Empty input → empty output

**Acceptance**: Scenario 2 from spec passes in unit test.

---

### T-031 · Unit tests: `pantry.service.ts`

**Priority**: P1 · **Story**: FR-029
**Depends on**: T-005

Test cases:

- Add item → persisted with 7-day TTL
- `subtractFromList` → pantry items marked `is_pantry = true`
- `pruneExpired` → removes only expired items
- Remove item → no longer in pantry

**Acceptance**: All pantry scenarios covered; TTL logic verified with mocked `Date.now()`.

---

### T-032 · Integration tests: grocery list API endpoints

**Priority**: P1 · **Story**: FR-028, FR-029
**Depends on**: T-006–T-012, T-021–T-024

Integration tests using NestJS `supertest`:

- `POST /v1/grocery-lists` with valid meal plan → 201 with items
- `POST /v1/grocery-lists` with empty meal plan → 200 with empty items
- `GET /v1/grocery-lists` → only returns authenticated user's lists
- `PUT /v1/grocery-lists/:id` → pantry toggle persists
- Unauthenticated requests → 401

**Acceptance**: All 5 acceptance scenarios from spec covered by integration tests.

---

### T-033 · Integration tests: store mapping + circuit breaker

**Priority**: P2 · **Story**: FR-031
**Depends on**: T-013, T-014

- Mock Walmart API: success path → correct SKU mapping
- Mock Walmart API: 5 consecutive failures → circuit opens
- Cache hit: second call within 24h skips API
- Unmapped item: returns `status: 'unmapped'` gracefully

**Acceptance**: Circuit breaker behavior verified without real API calls.

---

### T-034 · E2E Playwright test: meal-plan-to-grocery-list workflow

**Priority**: P2 · **Story**: SC-008
**Depends on**: T-025, T-026

Playwright test:

1. Navigate to a 7-day meal plan
2. Click "Generate Grocery List"
3. Verify items appear grouped by category
4. Mark 2 items as "already have"
5. Verify summary count updates
6. Verify workflow completable in < 10 minutes (SC-008)

**Acceptance**: SC-008 success criterion verified; all interactive elements accessible by role/label (NFR-003).

---

### T-035 · E2E Playwright test: online ordering flow (premium)

**Priority**: P2 · **Story**: FR-031
**Depends on**: T-028

Playwright test:

1. Free user: "Order Groceries" shows upgrade prompt
2. Premium user: initiate order → review mapped/unmapped items
3. Confirm order → checkout URL displayed

**Acceptance**: Scenario 4 from spec passes end-to-end.

---

### T-036 · Performance validation: SC-004

**Priority**: P2 · **Story**: SC-004
**Depends on**: T-006

Automated test:

- Generate grocery list from a 7-day meal plan (21 recipes, ~150 ingredients)
- Assert response time < 5 seconds (SC-004)
- Run in CI with timing assertion

**Acceptance**: SC-004 — grocery list generation completes within 5 seconds.

---

### T-037 · TypeScript strict mode validation

**Priority**: P1 · **Story**: NFR-001
**Depends on**: all implementation tasks

- Run `tsc --noEmit --strict` across all new files
- Zero `any` usage outside explicitly marked test doubles
- All exported functions and interfaces carry JSDoc (NFR-002)

**Acceptance**: `tsc --noEmit` exits 0; ESLint `@typescript-eslint/no-explicit-any` passes.

---

### T-038 · Pantry TTL cron job: scheduled pruning

**Priority**: P2 · **Story**: FR-029
**Depends on**: T-005, T-021

- Register `@Cron('0 2 * * *')` (daily 02:00 UTC) in `GroceryListsModule`
- Call `PantryService.pruneExpired()`
- Log count of pruned items via `@aws-lambda-powertools/logger`

**Acceptance**: Cron fires in test environment; pruned count logged correctly.

---

## Phase 10A — Mobile UI (Expo / React Native)

> These tasks mirror the web UI tasks (T-025..T-028) for the mobile app. Each task targets the same user story and acceptance scenario as its web counterpart. Mobile-specific interaction patterns (swipe gestures, bottom sheets, one-handed check-off) are noted per task.

### T-041 · Mobile: Grocery List Screen (from meal plan)

**Priority**: P2 · **Story**: SC-008
**Depends on**: T-006, T-008
**Mirrors**: T-025
**Location**: `packages/apps/sous-chef/mobile/src/screens/GroceryListScreen.tsx`

- "Generate Grocery List" action accessible from the meal plan detail screen
- Loading skeleton during generation
- Items displayed in category sections (SectionList)
- Each item shows: display name, quantity, category label
- Swipe-to-check gesture for in-store check-off (one-handed use)
- Accessible: all interactive elements queryable by role/label (NFR-003)
- Color not sole state conveyor — use icons + text (NFR-004)

**Acceptance**: SC-008 — full workflow completable in under 10 minutes for a 7-day plan on mobile.

---

### T-042 · Mobile: Pantry Toggle

**Priority**: P2 · **Story**: FR-029
**Depends on**: T-011, T-012, T-041
**Mirrors**: T-026

- Tap toggle per item: "Already have"
- Optimistic UI update; revert on error
- "Already have" items visually de-emphasized (strikethrough + muted + icon)
- Summary counter updates in real-time

**Acceptance**: Scenario 3 from spec passes in Detox/Maestro test on mobile.

---

### T-043 · Mobile: Store Connection Screen

**Priority**: P2 · **Story**: FR-030
**Depends on**: T-016, T-041
**Mirrors**: T-027

- "Connect Store" accessible from grocery list screen (bottom sheet or modal)
- Walmart: API key entry form
- Instacart: "Connect with Instacart" button → in-app browser OAuth redirect
- Connected state shows store name + "Disconnect" option
- Scenario 5: guide user through setup if no store configured

**Acceptance**: Scenario 5 from spec passes on mobile; OAuth redirect and callback work end-to-end. _Instacart path cannot be fully accepted without sandbox credentials._

---

### T-044 · Mobile: Online Ordering UI (Premium)

**Priority**: P2 · **Story**: FR-031
**Depends on**: T-015, T-018, T-019, T-043
**Mirrors**: T-028

- "Order Groceries" button (disabled + upgrade prompt for free users)
- Pre-order review: mapped vs unmapped items in a scrollable bottom sheet
- Allow manual selection for unmapped items
- Post-order: checkout URL opens in system browser (not in-app WebView)
- Order status polling with progress indicator

**Acceptance**: Scenario 4 from spec passes on mobile; premium gate shows upgrade prompt for free users.

---

## Phase 10B — New Web Tasks

### T-039 · Dedicated Shopping Lists Page: `/shopping-lists`

**Priority**: P2 · **Story**: FR-032
**Depends on**: T-006, T-007, T-008

Create Next.js App Router page at `/shopping-lists`:

- List all user's grocery lists, paginated, sorted by `created_at DESC`
- Each list card shows: name, item count, status badge, linked meal plan name (if any), date
- "New List" button: opens a form to create a standalone list (no meal plan) or pick a meal plan from a dropdown
- "Generate from Meal Plan" shortcut: meal plan picker → calls `POST /v1/grocery-lists` with selected `mealPlanId`
- Accessible: all interactive elements queryable by role/label (NFR-003)

**Acceptance**: SC-009 — user can reach this page from main nav and create a list without visiting a meal plan first.

---

### T-040 · Meal Plan / Shopping List Cross-Links

**Priority**: P2 · **Story**: FR-033
**Depends on**: T-025, T-039

**Web — Grocery list → meal plan back-link**:

- When `meal_plan_id` is set, show "From meal plan: [name]" link at the top of the grocery list page
- If the meal plan has been deleted (`meal_plan_id` is NULL after cascade), show "Meal plan no longer available" (no broken link)

**Web — Meal plan → grocery lists**:

- Add a "Grocery Lists" section to the meal plan detail page (feature 006 view)
- Query `GET /v1/grocery-lists?mealPlanId={id}` and list associated lists by name and date
- "Generate New List" shortcut within this section

**Mobile — equivalent cross-links**:

- Grocery list screen shows back-link chip to meal plan when applicable
- Meal plan detail screen shows associated grocery lists in a collapsible section

**Cross-feature note**: The meal plan detail page change touches feature 006's UI. This task must be coordinated with the 006 team. The API endpoint (`GET /v1/grocery-lists?mealPlanId=`) is owned by feature 007.

**Acceptance**: Scenarios 7 and 8 from spec pass on both web and mobile.

---

## Phase 10C — Mobile E2E Tests

### T-045 · Mobile E2E: meal-plan-to-grocery-list workflow

**Priority**: P2 · **Story**: SC-008
**Depends on**: T-041, T-042
**Mirrors**: T-034

Detox or Maestro test:

1. Navigate to a 7-day meal plan on mobile
2. Tap "Generate Grocery List"
3. Verify items appear in category sections
4. Mark 2 items as "already have"
5. Verify summary count updates
6. Verify workflow completable in < 10 minutes (SC-008)

**Acceptance**: SC-008 verified on mobile; all interactive elements accessible by role/label (NFR-003).

---

### T-046 · Mobile E2E: dedicated shopping-list page

**Priority**: P2 · **Story**: FR-032
**Depends on**: T-039, T-041

Detox or Maestro test:

1. Navigate to Shopping Lists from main nav
2. Create a standalone list (no meal plan)
3. Verify list appears in the list view
4. Generate a list from a meal plan via the picker
5. Verify cross-link back to meal plan is visible

**Acceptance**: SC-009 verified on mobile.

---

## Summary Table

| Task  | Description                                           | Priority | Phase                     |
| ----- | ----------------------------------------------------- | -------- | ------------------------- |
| T-001 | DB Migration: grocery-lists tables                    | P1       | DB & Schema               |
| T-002 | Drizzle ORM Schema                                    | P1       | DB & Schema               |
| T-003 | Unit Conversion Utility                               | P1       | Shared Utility            |
| T-004 | Ingredient Aggregator Service                         | P1       | Core Services             |
| T-005 | Pantry Service                                        | P1       | Core Services             |
| T-006 | POST /v1/grocery-lists                                | P1       | API Endpoints             |
| T-007 | GET /v1/grocery-lists                                 | P1       | API Endpoints             |
| T-008 | GET /v1/grocery-lists/:id                             | P1       | API Endpoints             |
| T-009 | PUT /v1/grocery-lists/:id                             | P1       | API Endpoints             |
| T-010 | DELETE /v1/grocery-lists/:id                          | P2       | API Endpoints             |
| T-011 | POST pantry mark                                      | P1       | API Endpoints             |
| T-012 | DELETE pantry mark                                    | P1       | API Endpoints             |
| T-013 | Walmart API Client                                    | P2       | Store Mapping (Walmart)   |
| T-014 | Product Mapping Service                               | P2       | Store Mapping (Walmart)   |
| T-015 | POST order (Walmart)                                  | P2       | Store Mapping (Walmart)   |
| T-016 | Instacart OAuth Flow ⚠️ needs partner creds           | P2       | Store Mapping (Instacart) |
| T-017 | Instacart API Client ⚠️ needs partner creds           | P2       | Store Mapping (Instacart) |
| T-018 | POST order (Instacart) ⚠️ needs partner creds         | P2       | Store Mapping (Instacart) |
| T-019 | GET order-status (polling)                            | P2       | Store Mapping             |
| T-020 | Premium Feature Guard                                 | P2       | Premium Gating            |
| T-021 | GroceryListsModule                                    | P1       | NestJS Wiring             |
| T-022 | GroceryListsController                                | P1       | NestJS Wiring             |
| T-023 | GroceryListsService                                   | P1       | NestJS Wiring             |
| T-024 | DTOs                                                  | P1       | NestJS Wiring             |
| T-025 | Grocery List Page (Next.js, from meal plan)           | P2       | Web UI                    |
| T-026 | Pantry Toggle UI (Web)                                | P2       | Web UI                    |
| T-027 | Store Connection UI (Web)                             | P2       | Web UI                    |
| T-028 | Online Ordering UI (Web, Premium)                     | P2       | Web UI                    |
| T-029 | Unit tests: culinary-units                            | P1       | Tests                     |
| T-030 | Unit tests: aggregator                                | P1       | Tests                     |
| T-031 | Unit tests: pantry                                    | P1       | Tests                     |
| T-032 | Integration tests: API                                | P1       | Tests                     |
| T-033 | Integration tests: store mapping                      | P2       | Tests                     |
| T-034 | E2E (Web): meal-plan-to-grocery-list                  | P2       | Tests                     |
| T-035 | E2E (Web): online ordering                            | P2       | Tests                     |
| T-036 | Performance: SC-004                                   | P2       | Tests                     |
| T-037 | TypeScript strict validation                          | P1       | Tests                     |
| T-038 | Pantry TTL cron job                                   | P2       | Tests                     |
| T-039 | Dedicated Shopping Lists Page `/shopping-lists` (Web) | P2       | Web UI                    |
| T-040 | Meal Plan / Shopping List Cross-Links (Web + Mobile)  | P2       | Web UI + Mobile UI        |
| T-041 | Mobile: Grocery List Screen (from meal plan)          | P2       | Mobile UI                 |
| T-042 | Mobile: Pantry Toggle                                 | P2       | Mobile UI                 |
| T-043 | Mobile: Store Connection Screen                       | P2       | Mobile UI                 |
| T-044 | Mobile: Online Ordering UI (Premium)                  | P2       | Mobile UI                 |
| T-045 | Mobile E2E: meal-plan-to-grocery-list                 | P2       | Mobile Tests              |
| T-046 | Mobile E2E: dedicated shopping-list page              | P2       | Mobile Tests              |

**P1 tasks**: 20 (must-have for core functionality)
**P2 tasks**: 26 (store integration, UI, premium features, mobile parity)

> ⚠️ T-016, T-017, T-018 cannot be marked complete without Instacart partner credentials. Track separately from other P2 tasks.
