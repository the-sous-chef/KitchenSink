# Wireframe: Recipe Search (Web)

**Branch**: `001-commise-recipe-app` | **Date**: 2026-05-09
**FRs**: [FR-006](../../spec.md#fr-006), [FR-004](../../spec.md#fr-004), [FR-044](../../spec.md#fr-044)

---

## ASCII Wireframe

```
+--------------------------------------------------------------------------+
|  Commise                                          [Morgan ▼] [Settings]|
+--------------------------------------------------------------------------+
|                                                                          |
|  +------------------+  +--------------------------------------------+   |
|  |                  |  |  Q  Search recipes...                       |   |  <- FR-006
|  |  FILTERS         |  +--------------------------------------------+   |
|  |                  |                                                  |   |
|  |  [ Clear all ]  |  Sort by: [ Relevance ▼ ]  [ Newest ▼ ]        |   |
|  |                  |                                                  |   |
|  |  Cuisine         |  Showing 47 results for "pasta"               |   |
|  |  [ ] Italian    |                                                  |   |
|  |  [ ] American   |  +------------------------------------------+ |   |
|  |  [ ] Thai       |  | [PHOTO]                                    | |   |
|  |  [ ] Mexican   |  | Grandma's Pasta                             | |   |
|  |  [ ] Indian    |  | by @alexk   |  Italian  |  45 min  |  Public | |   |  <- FR-004
|  |                  |  | 420 cal/serving  |  [Clone]               | |   |
|  |  Dietary        |  +------------------------------------------+ |   |
|  |  [ ] Vegetarian |                                                |   |
|  |  [ ] Vegan      |  +------------------------------------------+ |   |
|  |  [ ] Keto       |  | [PHOTO]                                    | |   |
|  |  [ ] Low-carb  |  | Simple Marinara Pasta                      | |   |
|  |  [ ] Gluten-free| | by @cookingwithkids |  30 min |  Public   | |   |
|  |                  |  | 310 cal/serving  |  [Clone]               | |   |
|  |  Prep time      |  +------------------------------------------+ |   |
|  |  (o) Any        |                                                |   |
|  |  ( ) < 15 min   |  +------------------------------------------+ |   |
|  |  ( ) 15-30 min |  | [PHOTO]                                    | |   |
|  |  ( ) 30-60 min |  | Creamy Garlic Pasta                        | |   |
|  |  ( ) > 60 min  |  | by @chefcarlos |  Italian  |  25 min | Public | |   |
|  |                  |  | 390 cal/serving  |  [Clone]               | |   |
|  |  Cook time      |  +------------------------------------------+ |   |
|  |  (o) Any        |                                                |   |
|  |  ( ) < 30 min  |  +------------------------------------------+ |   |
|  |  ( ) 30-60 min |  | [PHOTO]                                    | |   |
|  |  ( ) > 60 min  |  | Pasta Primavera                           | |   |
|  |                  |  | by @freshmarket |  40 min |  Public    | |   |
|  |  Ingredients    |  | 350 cal/serving  |  [Clone]               | |   |
|  |  [________]     |  +------------------------------------------+ |   |
|  |  e.g. chicken  |                                                  |   |
|  |                  |  +------------------------------------------+ |   |
|  |  Tags           |  | [PHOTO]                                    | |   |
|  |  [ ] family     |  | Spaghetti alla Carbonara                   | |   |
|  |  [ ] quick      |  | by @romancook |  Italian  |  35 min | Public | |   |
|  |  [ ] weeknight  |  | 480 cal/serving  |  [Clone]               | |   |
|  |  [ ] meal-prep  |  +------------------------------------------+ |   |
|  |  [ ] comfort    |                                                  |   |
|  |                  |  [ Load more results (12 more) ]            |   |
|  |  [ Apply ]      |                                                  |   |
|  +------------------+                                                  |   |
|                                                                          |
+--------------------------------------------------------------------------+
```

## Layout Notes

| Zone           | Description                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| Left sidebar   | Sticky filter panel; checkboxes per category; radio for time ranges; text input for ingredient filter |
| Search bar     | Full-text search with live suggestions (FR-006)                                                       |
| Sort dropdown  | Relevance, Newest, Most Cloned, Quickest                                                              |
| Results header | Shows query + result count                                                                            |
| Recipe card    | Photo, title, author handle, cuisine tag, cook time, calories per serving, visibility, clone button   |
| Clone button   | Available on all public recipe cards (FR-005)                                                         |
| Load more      | Paginated; no infinite scroll (pagination preferred for performance)                                  |

## Filter Options (FR-006)

| Filter           | Type                                        | FR     |
| ---------------- | ------------------------------------------- | ------ |
| Keyword          | Full-text search                            | FR-006 |
| Cuisine          | Multi-select checkbox                       | FR-006 |
| Dietary category | Multi-select checkbox                       | FR-006 |
| Prep time        | Radio (Any / <15 / 15-30 / 30-60 / >60 min) | FR-006 |
| Cook time        | Radio (Any / <30 / 30-60 / >60 min)         | FR-006 |
| Ingredient       | Text input (matches ingredient list)        | FR-006 |
| Tags             | Multi-select checkbox                       | FR-006 |

## FR Annotation Summary

| Element                     | FR     |
| --------------------------- | ------ |
| Full-text search            | FR-006 |
| Filter sidebar              | FR-006 |
| Public recipe results only  | FR-004 |
| Author attribution on cards | FR-005 |
| Clone button                | FR-005 |
| Sort controls               | FR-006 |
| Pagination                  | FR-006 |
| Web layout                  | FR-044 |
