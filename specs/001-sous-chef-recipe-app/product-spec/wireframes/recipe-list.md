# Wireframe: Recipe List (Mobile)

**Branch**: `001-sous-chef-recipe-app` | **Date**: 2026-05-09
**FRs**: [FR-006](../../spec.md#fr-006), [FR-004](../../spec.md#fr-004), [FR-044](../../spec.md#fr-044)

---

## ASCII Wireframe

```
+--------------------------------------------------+
|  [Auth status: Morgan]          [Settings icon]   |  <- FR-045 (auth required)
+--------------------------------------------------+
|                                                  |
|  +--------------------------------------------+  |
|  |  Q  Search recipes...            [Filters]  |  |  <- FR-006: full-text search
|  +--------------------------------------------+  |
|                                                  |
|  [-- My Recipes --]  [-- Community --]          |  <- Tab: own vs public
|                                                  |
|  Filter chips:                                   |  <- FR-006: filter by
|  [+ Italian] [+ Quick (<30m)] [+ Low-carb]     |     tags, cuisine,
|                                                  |     dietary, time
|  +------------------------------------------+   |
|  |  [PHOTO]                                  |   |
|  |  Grandma's Pasta                           |   |
|  |  Italian  |  45 min  |  420 cal           |   |  <- FR-007a: nutrition
|  |  [Tags: pasta, family, italian]           |   |
|  |  v12  |  Public  |  Edited 2d ago        |   |  <- FR-007b: version badge
|  +------------------------------------------+   |
|                                                  |
|  +------------------------------------------+   |
|  |  [PHOTO]                                  |   |
|  |  Lemon Herb Chicken                        |   |
|  |  American  |  30 min  |  310 cal           |   |
|  |  [Tags: chicken, keto, quick]             |   |
|  |  v3  |  Private  |  Created 1w ago         |   |  <- FR-003: private badge
|  +------------------------------------------+   |
|                                                  |
|  +------------------------------------------+   |
|  |  [PHOTO]                                  |   |
|  |  Spicy Thai Basil Tofu                    |   |
|  |  Thai  |  25 min  |  280 cal               |   |
|  |  [Tags: tofu, thai, spicy]               |   |
|  |  v7  |  Public  |  Edited 3d ago          |   |
|  +------------------------------------------+   |
|                                                  |
|  +------------------------------------------+   |
|  |  [PHOTO]                                  |   |
|  |  Overnight Oats                           |   |
|  |  American  |  5 min  |  350 cal           |   |
|  |  [Tags: breakfast, meal-prep]            |   |
|  |  v2  |  Public  |  Created 2w ago         |   |
|  +------------------------------------------+   |
|                                                  |
|  --- end of results ---                          |
|                                                  |
+--------------------------------------------------+
|  [Recipes]    [Collections]    [Meal Plan]       |  <- FR-044: feature parity
|    [*]              [ ]            [ ]            |     bottom nav
+--------------------------------------------------+
```

## Layout Notes

| Zone             | Description                                                                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header           | Auth status (avatar) + settings; no unauthenticated access (FR-045)                                                                                 |
| Search bar       | Full-text input; tap opens dedicated search page (recipe-search.md)                                                                                 |
| Filter chips     | Horizontal scroll; active = filled; each activates a filter (FR-006)                                                                                |
| Tab bar          | "My Recipes" shows owned; "Community" shows public shared recipes (FR-004)                                                                          |
| Recipe card      | Photo thumbnail (or placeholder), title, cuisine tag, total time, lead nutrition calorie, tags, version badge, visibility badge, relative timestamp |
| Version badge    | "v{N}" shown when version > 1 (FR-007b)                                                                                                             |
| Visibility badge | "Public" (default, all users) or "Private" (premium only — FR-003)                                                                                  |
| Bottom nav       | Three tabs; Recipes active; feature parity across web and mobile (FR-044)                                                                           |

## Mobile Gesture / Interaction Notes

- Tap recipe card → navigate to [recipe-detail.md](./recipe-detail.md)
- Long-press card → context menu (Edit / Delete / Add to collection)
- Pull-to-refresh → reload list with latest data
- Tap "+" FAB → navigate to [recipe-edit.md](./recipe-edit.md) (new recipe)

## FR Annotation Summary

| Element                        | FR              |
| ------------------------------ | --------------- |
| Auth required                  | FR-045          |
| Search bar                     | FR-006          |
| Filter chips                   | FR-006          |
| Community tab (public recipes) | FR-004          |
| Recipe card photo              | FR-001          |
| Nutrition data                 | FR-007, FR-007a |
| Version badge                  | FR-007b         |
| Visibility badge               | FR-003          |
| Bottom nav                     | FR-044          |
