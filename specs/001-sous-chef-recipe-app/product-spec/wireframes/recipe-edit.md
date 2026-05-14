# Wireframe: Recipe Edit (Web — Multi-Step Editor)

**Branch**: `001-sous-chef-recipe-app` | **Date**: 2026-05-09
**FRs**: [FR-001](../../spec.md#fr-001), [FR-001a](../../spec.md#fr-001a), [FR-002](../../spec.md#fr-002), [FR-007b](../../spec.md#fr-007b), [FR-007c](../../spec.md#fr-007c), [FR-044](../../spec.md#fr-044)

---

## ASCII Wireframe — Step 1 of 4: Basic Info

```
+--------------------------------------------------------------------------+
|  Sous Chef          [Save Draft]           [Preview]    [Cancel] [Publish]|  <- FR-002
+--------------------------------------------------------------------------+
|                                                                          |
|  Recipe Editor                                     Progress: Step 1 of 4  |
|  +--------+                                                                |
|  | [1]----+  [2----]  [3----]  [4----]                                   |
|  + Basic   Ingredients  Instructions  Photos                               |
|                                                                          |
|  +-- Basics ------------------------------------------------------------+ |
|  |                                                                      | |
|  |  Title *                                              [  64 chars ]  | |  <- FR-001
|  |  _______________________________________________________              | |
|  |                                                                      | |
|  |  Description                                          [  256 chars]  | |
|  |  _______________________________________________________              | |
|  |                                                                      | |
|  |  Cuisine / Category            Tags                                   | |
|  |  [ Italian             v ]     [ + Add tag                        ] | |  <- FR-001
|  |                                [family] [pasta] [italian]            | |
|  |                                                                      | |
|  |  Servings *    Prep time (min)   Cook time (min)   Total time        | |
|  |  [ 4    ]      [ 15            ]  [ 30            ]  = 45 min (auto) | |  <- FR-001
|  |                                                                      | |
|  +----------------------------------------------------------------------+ |
|                                                                          |
|  [Cancel and discard changes]                    [Next: Ingredients >]     |
|                                                                          |
+--------------------------------------------------------------------------+
```

## ASCII Wireframe — Step 2 of 4: Ingredients

```
+--------------------------------------------------------------------------+
|  Sous Chef          [Save Draft]           [Preview]    [Cancel] [Publish]|
+--------------------------------------------------------------------------+
|                                                                          |
|  Recipe Editor                                     Progress: Step 2 of 4  |
|  +--------+                                                                |
|  | [1]----+  [2----]  [3----]  [4----]                                   |
|  + Basic   Ingredients  Instructions  Photos                               |
|                                                                          |
|  +-- Ingredients --------------------------------------------------------+ |
|  |                                                                      | |
|  |  Search ingredients...                    [USDA database]             | |  <- FR-007
|  |  _______________________________________________________              | |
|  |                                                                      | |
|  |  +----------------------------------------------------------------+  | |
|  |  |  [ ]  200g  | Pasta (Barilla, penne)          | x | 420 cal  |  | | |
|  |  |  [ ]  150g  | Chicken breast, diced           | x | 165 cal  |  | | |  <- FR-007
|  |  |  [ ]  2tbsp | Olive oil                       | x | 120 cal  |  | | |
|  |  |  [ ]  4clv  | Garlic, minced                  | x |   4 cal  |  | | |
|  |  |  [ ]  1 cup | Cherry tomatoes                 | x |  25 cal  |  | | |
|  |  |  [+] [freeform]  Kale, chopped — 50 cal       |   |  50 cal  |  | | |  <- FR-007a
|  |  +----------------------------------------------------------------+  | |
|  |                                                                      | |
|  |  [ + Add ingredient ]                                                | |
|  |                                                                      | |
|  |  Total nutrition (per serving):  420 cal | 18g P | 62g C | 12g F    | |  <- FR-007
|  |                                                                      | |
|  +----------------------------------------------------------------------+ |
|                                                                          |
|  [< Prev: Basics]                            [Next: Instructions >]       |
|                                                                          |
+--------------------------------------------------------------------------+
```

## ASCII Wireframe — Step 4 of 4: Photos + Save

```
+--------------------------------------------------------------------------+
|  Sous Chef          [Save Draft]           [Preview]    [Cancel] [Publish]|
+--------------------------------------------------------------------------+
|                                                                          |
|  Recipe Editor                                     Progress: Step 4 of 4  |
|  +--------+                                                                |
|  | [1]----+  [2----]  [3----]  [4----]                                   | |
|  + Basic   Ingredients  Instructions  Photos                               |
|                                                                          |
|  +-- Photos (max 10) ----------------------------------------------------+ |
|  |                                                                      | |
|  |  +------------------+  +------------------+  +------------------+     | |
|  |  | [PHOTO 1]        |  | [PHOTO 2]        |  | [PHOTO 3]        |     | |
|  |  | [Uploaded OK]    |  | [Uploading...]   |  | [FAILED] x        |     | |  <- FR-001a
|  |  | [x] [replace]   |  | [progress bar]  |  | [Retry] [Remove]  |     | |     per-file status
|  |  +------------------+  +------------------+  +------------------+     | |
|  |                                                                      | |
|  |  +------------------+  +------------------+                         | |
|  |  | [PHOTO 4]        |  | [ + Add Photo ]  |                         | |
|  |  | [Uploaded OK]    |  | JPEG PNG WebP    |                         | |
|  |  | [x] [replace]   |  | HEIC / HEIF      |                         | |
|  |  +------------------+  | max 5MB each    |                         | |
|  |                         +------------------+                         | |
|  |                                                                      | |
|  +----------------------------------------------------------------------+ |
|                                                                          |
|  Photo upload notes:                                                      |
|  - Metadata saves immediately; photos upload independently              | |  <- FR-001a
|  - Failed uploads can be retried without re-saving the recipe           | |
|  - Validated client-side (size, MIME) and server-side (magic bytes)     | |
|                                                                          |
|  [< Prev: Instructions]                    [Save and Publish >]           |
|                                                                          |
+--------------------------------------------------------------------------+
```

## Layout Notes

| Zone                    | Description                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------- |
| Step indicator          | 4-step progress bar; completed = filled circle; current = outlined                    |
| Title field             | Required; character counter; max 64 chars (FR-001)                                    |
| Tag input               | Chip input; type-ahead suggestion; tags stored as array (FR-001)                      |
| Nutrition (live)        | Recalculates as ingredients change; per-serving display                               |
| Ingredient autocomplete | USDA database lookup with real nutrition data; also freeform option (FR-007, FR-007a) |
| Photo upload grid       | 3-column grid; each photo shows status icon: uploaded / uploading / failed (FR-001a)  |
| Per-file status         | Uploaded = green check; Uploading = spinner; Failed = red X with retry                |
| Save Draft              | Saves metadata without publishing; visibility stays as-is                             |
| Publish                 | Sets to public and redirects to detail view                                           |

## FR Annotation Summary

| Element                         | FR      |
| ------------------------------- | ------- |
| Multi-step form                 | FR-001  |
| Ingredient autocomplete         | FR-007  |
| Freeform ingredient option      | FR-007a |
| Live nutrition calculation      | FR-007  |
| Step progress indicator         | FR-044  |
| Photo grid with per-file status | FR-001a |
| Save Draft                      | FR-001a |
| Recipe metadata atomic persist  | FR-001a |
